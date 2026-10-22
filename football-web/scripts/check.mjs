/**
 * Drives the headless Chrome started by the smoke test (remote debugging on :9222),
 * prints the rendered text and saves a screenshot.
 *
 *   node scripts/check.mjs <url> <screenshotPath>
 */
import { writeFile } from "node:fs/promises";

const URL_TO_LOAD = process.argv[2] ?? "http://127.0.0.1:4173/";
const SHOT = process.argv[3] ?? "screenshot.png";
const DEBUG = "http://127.0.0.1:9222";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let attempt = 0; attempt < 30; attempt += 1) {
  try {
    await fetch(`${DEBUG}/json/version`);
    break;
  } catch {
    await sleep(300);
  }
}

const targets = await (await fetch(`${DEBUG}/json/list`)).json();
const page = targets.find((t) => t.type === "page");
if (!page) throw new Error("No page target found in Chrome");

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
});

function send(method, params = {}) {
  const id = (nextId += 1);
  return new Promise((resolve) => {
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const errors = [];
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") {
    errors.push(message.params.exceptionDetails.text ?? "exception");
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    errors.push(message.params.args.map((a) => a.value ?? a.description ?? "?").join(" "));
  }
});

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1280,
  height: 900,
  deviceScaleFactor: 2,
  mobile: false,
});

await send("Page.navigate", { url: URL_TO_LOAD });
await sleep(4_000);

const body = await send("Runtime.evaluate", {
  expression: "document.body.innerText",
  returnByValue: true,
});
const text = body.result?.result?.value ?? "";

const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
if (shot.result?.data) {
  await writeFile(SHOT, Buffer.from(shot.result.data, "base64"));
}

console.log(text);
if (errors.length > 0) {
  console.log("\n--- console errors ---");
  for (const error of errors) console.log(error);
}
ws.close();

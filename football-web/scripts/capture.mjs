/**
 * Captures the running app in several states through the DevTools protocol.
 * Requires headless Chrome on :9222 and the smoke server on :4173.
 *
 *   node scripts/capture.mjs
 */
import { writeFile } from "node:fs/promises";

const URL_TO_LOAD = process.argv[2] ?? "http://127.0.0.1:4173/";
const DEBUG = "http://127.0.0.1:9222";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
const consoleErrors = [];
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    consoleErrors.push(message.params.exceptionDetails.text ?? "exception");
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    consoleErrors.push(message.params.args.map((a) => a.value ?? a.description ?? "?").join(" "));
  }
});

function send(method, params = {}) {
  const id = (nextId += 1);
  return new Promise((resolve) => {
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return res.result?.result?.value;
}

async function viewport(width, height, scale = 2) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: width < 600,
  });
}

async function load(theme) {
  await evaluate(`localStorage.setItem("football-web.theme", ${JSON.stringify(theme)})`);
  await send("Page.navigate", { url: URL_TO_LOAD });
  await sleep(2_500);
}

async function shot(name) {
  const res = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  if (!res.result?.data) throw new Error(`No screenshot data for ${name}`);
  await writeFile(name, Buffer.from(res.result.data, "base64"));
  console.log(`wrote ${name}`);
}

await send("Runtime.enable");
await send("Page.enable");

await viewport(1280, 900);
await load("dark");
await shot("shot-desktop-dark.png");

await load("light");
await shot("shot-desktop-light.png");

await load("dark");
await evaluate(`[...document.querySelectorAll(".segmented button")].find((b) => b.textContent.includes("Live"))?.click()`);
await sleep(500);
await shot("shot-live-filter.png");
console.log("live filter text:", (await evaluate(`document.querySelectorAll(".match").length`)) + " rows");

await viewport(390, 844);
await load("dark");
await shot("shot-mobile.png");

console.log("matches:", await evaluate(`document.querySelectorAll(".match").length`));
console.log("console errors:", consoleErrors.length === 0 ? "none" : consoleErrors.join(" | "));
ws.close();

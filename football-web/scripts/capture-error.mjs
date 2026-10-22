/**
 * Captures the failure state: same page, but the backend requests are blocked.
 *
 *   node scripts/capture-error.mjs
 */
import { writeFile } from "node:fs/promises";

const URL_TO_LOAD = "http://127.0.0.1:4173/";
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

async function evaluate(expression) {
  const res = await send("Runtime.evaluate", { expression, returnByValue: true });
  return res.result?.result?.value;
}

await send("Runtime.enable");
await send("Page.enable");
await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1280,
  height: 700,
  deviceScaleFactor: 2,
  mobile: false,
});
await send("Network.setBlockedURLs", { urls: ["*localhost:3000*", "*127.0.0.1:3000*"] });

await evaluate(`localStorage.setItem("football-web.theme", "dark")`);
await send("Page.navigate", { url: URL_TO_LOAD });
await sleep(3_000);

const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
await writeFile("shot-error.png", Buffer.from(shot.result.data, "base64"));
console.log(await evaluate("document.body.innerText"));
console.log("wrote shot-error.png");
ws.close();

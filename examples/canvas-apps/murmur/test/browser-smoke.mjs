/* Optional end-to-end check in a REAL browser (system Chrome via playwright-core from the repo root):
 * relay + two isolated browser contexts, each mounting the built extension.js. A creates a room, B joins
 * by the shared address, and a message must cross. Run: node test/browser-smoke.mjs (after npm run build). */
import http from "node:http";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { startRelay } from "../relay/relay.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("../../../../node_modules/playwright-core");
const dir = fileURLToPath(new URL("..", import.meta.url));
const server = http.createServer((req, res) => {
  if (req.url === "/extension.js") { res.setHeader("content-type", "text/javascript"); return res.end(readFileSync(dir + "extension.js")); }
  res.setHeader("content-type", "text/html");
  res.end(`<!doctype html><body style="margin:0;height:100vh"><div id="app" style="height:100vh"></div><script type="module">
    import { activate } from "/extension.js";
    activate({ apiVersion: "1", registerPage: (_id, fn) => { fn({ container: document.getElementById("app") }); return () => {}; } });
  </script>`);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/`;
const relay = await startRelay({ port: 0, host: "127.0.0.1", quiet: true });
const relayAddr = relay.getMultiaddrs().map(String).find((a) => a.includes("/ws/p2p/"));
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const T0 = Date.now(); const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
let failed = false;
try {
  const pages = [];
  for (const name of ["ada", "bo"]) {
    const ctx = await browser.newContext();
    await ctx.addInitScript(([n, r]) => { localStorage.setItem("canvas-extension-murmur:v1", JSON.stringify({ name: n, relays: [r], rooms: [] })); }, [name, relayAddr]);
    const page = await ctx.newPage();
    page.on("pageerror", (e) => log(name, "pageerror:", e.message));
    await page.goto(url);
    pages.push(page);
  }
  const [a, b] = pages;
  for (const p of pages) await p.waitForFunction(() => document.querySelector("#mr-status")?.textContent === "Connected to relay", null, { timeout: 60000 });
  log("both browsers: status = Connected to relay");
  await a.getByRole("button", { name: "New room" }).click();
  await a.getByRole("button", { name: "Share this room" }).click();
  const address = await a.locator(".pop code").innerText();
  log("A room address:", address);
  await b.waitForFunction(() => /^1 peer$/.test([...document.querySelectorAll("button")].find((x) => /peers?$/.test(x.textContent))?.textContent || ""), null, { timeout: 60000 });
  log("B sees 1 peer");
  await b.getByLabel("Room name or address").fill(address);
  await b.getByRole("button", { name: "Join", exact: true }).click();
  await a.getByRole("textbox", { name: "Message" }).fill("hello from ada's browser");
  await a.getByRole("textbox", { name: "Message" }).press("Enter");
  await b.waitForFunction(() => document.querySelector(".log")?.textContent.includes("hello from ada's browser"), null, { timeout: 60000 });
  log("B received A's message");
  await b.getByRole("textbox", { name: "Message" }).fill("hi ada, bo here");
  await b.getByRole("textbox", { name: "Message" }).press("Enter");
  await a.waitForFunction(() => document.querySelector(".log")?.textContent.includes("hi ada, bo here"), null, { timeout: 60000 });
  log("A received B's reply");
  log("A log:", (await a.locator(".log").innerText()).replace(/\n+/g, " | "));
  log("PASS: two real Chrome contexts replicated an OrbitDB room via the relay");
} catch (e) { failed = true; log("FAIL:", e.message); }
await browser.close(); await relay.stop(); server.close(); process.exit(failed ? 1 : 0);

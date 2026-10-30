/* Two real OrbitDB nodes + a real relay, all in this Node process. Node A creates a room and writes
 * messages; node B opens the room by ADDRESS and must see them replicate (history + live).
 * Nodes are configured like browsers: no listening port, reachable only through the relay.
 */
import { startRelay } from "../relay/relay.mjs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTransport } from "../src/p2p.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (label, fn, ms = 60000) => {
  const t0 = Date.now();
  for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t0 > ms) throw new Error(`timeout waiting for: ${label}`); await sleep(300); }
};
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
const T0 = Date.now();

const relay = await startRelay({ port: 0, host: "127.0.0.1", quiet: true });
const relayAddr = relay.getMultiaddrs().map(String).find((a) => a.includes("/ws/p2p/"));
log("relay up:", relayAddr);

const dirs = [mkdtempSync(join(tmpdir(), "murmur-a-")), mkdtempSync(join(tmpdir(), "murmur-b-"))];
const A = createTransport({ directory: dirs[0], relays: [relayAddr], webrtc: false, displayName: "Ada" });
const B = createTransport({ directory: dirs[1], relays: [relayAddr], webrtc: false, displayName: "Bo" });
let failed = false;
try {
  await A.start(); await B.start();
  await until("A and B linked to the relay", () => A.status === "relay" && B.status === "relay");
  log("both nodes connected to the relay; status:", A.status, B.status);

  await until("A and B discover each other through the relay", () => A.peers().length > 0 && B.peers().length > 0);
  log("peers: A sees", A.peers().length, "B sees", B.peers().length);
  const roomA = await A.joinRoom("test-room-" + Date.now());
  log("A created room", roomA.address);
  await roomA.send("hello from A (1)");
  await roomA.send("hello from A (2)");
  log("A wrote 2 messages before B joined");

  const roomB = await B.joinRoom(roomA.address);   // join by shared address only
  log("B opened the address; same address:", roomB.address === roomA.address);
  const got = [];
  roomB.onMessage((m) => got.push(m.text));

  await until("B sees A's 2 historical messages", async () => (await roomB.history()).length >= 2);
  log("B history:", (await roomB.history()).map((m) => `${m.author}: ${m.text}`));

  await roomA.send("live message from A (3)");
  await until("B receives live message", async () => (await roomB.history()).length >= 3);
  await roomB.send("reply from B");
  await until("A receives B's reply", async () => (await roomA.history()).length >= 4);
  log("A history:", (await roomA.history()).map((m) => `${m.author}: ${m.text}`));
  log("B 'update' events seen:", got.length, got);
  log("peers seen by A:", A.peers().map((p) => `${p.id.slice(-8)} relayed=${p.relayed}`), "by B:", B.peers().map((p) => `${p.id.slice(-8)} relayed=${p.relayed}`));
  log("PASS: two nodes replicated an OrbitDB room through the relay");
} catch (e) {
  failed = true; log("FAIL:", e.message);
} finally {
  await A.stop().catch(() => {}); await B.stop().catch(() => {}); await relay.stop().catch(() => {}); dirs.forEach((d) => rmSync(d, { recursive: true, force: true }));
  process.exit(failed ? 1 : 0);
}

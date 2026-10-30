/* Murmur transport on OrbitDB (the FraterCCCLXIII/holons-p2p fork of @orbitdb/core 3.x).
 *
 * One libp2p node per browser tab, no server in the data path: peers meet through a relay that
 * only introduces them (circuit relay v2 + pubsub peer discovery), then replicate an OrbitDB
 * "events" (append-only log) database per room over gossipsub + the OrbitDB heads protocol.
 *
 * The same module runs in Node (test/replicate.mjs), so the replication path is testable.
 */
import { createHelia } from "helia";
import { bitswap } from "@helia/block-brokers";
import { createLibp2p } from "libp2p";
import { MemoryBlockstore } from "blockstore-core";
import { LevelBlockstore } from "blockstore-level";
import { identify } from "@libp2p/identify";
import { webSockets } from "@libp2p/websockets";
import { all as wsAll } from "@libp2p/websockets/filters";
import { webRTC } from "@libp2p/webrtc";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import { createOrbitDB, IPFSAccessController, isValidAddress } from "@orbitdb/core";
import { multiaddr } from "@multiformats/multiaddr";

import { DISCOVERY_TOPIC } from "./topic.js";
export { DISCOVERY_TOPIC };
export const DEFAULT_RELAY = "/ip4/127.0.0.1/tcp/12345/ws/p2p/<run `npm run relay` and paste the address it prints>";

/** Is this a usable relay multiaddr (websocket transport, with a /p2p/<peer id>)? */
export function validateRelay(text) {
  const s = String(text || "").trim();
  if (!s) return { ok: false, note: "Empty address." };
  let ma;
  try { ma = multiaddr(s); } catch { return { ok: false, note: "Not a valid multiaddr." }; }
  if (!/\/(ws|wss|tls\/ws|tls\/sni\/[^/]+\/ws)(\/|$)/.test(s)) return { ok: false, note: "A browser can only reach a relay over /ws or /wss." };
  if (!ma.getPeerId()) return { ok: false, note: "Missing /p2p/<relay peer id> at the end." };
  return { ok: true, note: "Looks right." };
}

/** Accept a room name or an /orbitdb/... address. */
export function parseRoomInput(text) {
  const s = String(text || "").trim();
  if (!s) return null;
  if (isValidAddress(s)) return { kind: "address", value: s };
  if (/^orbitdb\/zdpu/i.test(s) || /^zdpu[1-9A-HJ-NP-Za-km-z]{40,}$/.test(s)) return { kind: "address", value: s.startsWith("/") ? s : s.startsWith("zdpu") ? `/orbitdb/${s}` : `/${s}` };
  return { kind: "name", value: s.replace(/\s+/g, "-").slice(0, 64) };
}

/**
 * Create the transport. Options: relays (multiaddr strings), directory (storage prefix; omit for
 * memory), webrtc (browser only), displayName.
 */
export function createTransport({ relays = [], directory, webrtc = typeof window !== "undefined", displayName = "" } = {}) {
  let helia, orbitdb, libp2p;
  const listeners = new Set();
  const rooms = new Map();
  let status = "starting";
  const emit = (e) => listeners.forEach((fn) => { try { fn(e); } catch { /* listener errors never break the node */ } });

  const relayPeerIds = () => relays.map((r) => { try { return multiaddr(r).getPeerId(); } catch { return null; } }).filter(Boolean);
  const computeStatus = () => {
    if (!relays.length) return "no-relay";
    const ids = new Set(relayPeerIds());
    const linked = libp2p.getConnections().some((c) => ids.has(c.remotePeer.toString()));
    return linked ? "relay" : "connecting";
  };
  const refresh = () => { const s = computeStatus(); if (s !== status) { status = s; } emit({ type: "status", status, peers: peerList() }); };

  const peerList = () => {
    const ids = new Set(relayPeerIds());
    const seen = new Map();
    for (const c of libp2p.getConnections()) {
      const id = c.remotePeer.toString();
      if (ids.has(id)) continue;
      seen.set(id, { id, relayed: String(c.remoteAddr).includes("/p2p-circuit"), direct: !String(c.remoteAddr).includes("/p2p-circuit") });
    }
    return [...seen.values()];
  };

  async function start() {
    const connectionGater = { denyDialMultiaddr: () => false };
    libp2p = await createLibp2p({
      start: false,
      addresses: { listen: [...relays.map((r) => `${r}/p2p-circuit`), ...(webrtc ? ["/webrtc"] : [])] },
      transports: [webSockets({ filter: wsAll }), circuitRelayTransport(), ...(webrtc ? [webRTC()] : [])],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      connectionGater,
      peerDiscovery: [pubsubPeerDiscovery({ interval: 8000, topics: [DISCOVERY_TOPIC], listenOnly: false })],
      services: { identify: identify({ runOnLimitedConnection: true }), pubsub: gossipsub({ allowPublishToZeroTopicPeers: true, emitSelf: false, runOnLimitedConnection: true }) },
    });
    // OrbitDB registers its heads-exchange protocol with libp2p.handle()/dialProtocol(); peers that
    // only meet through a circuit relay are on a "limited" connection, which libp2p refuses for
    // protocols unless told otherwise. Allow it for everything on this node.
    const origHandle = libp2p.handle.bind(libp2p);
    libp2p.handle = (p, h, o) => origHandle(p, h, { runOnLimitedConnection: true, ...(o || {}) });
    const origRegister = libp2p.register.bind(libp2p);
    libp2p.register = (p, topology) => origRegister(p, Object.assign(topology, { notifyOnLimitedConnection: true }));
    const origDial = libp2p.dialProtocol.bind(libp2p);
    libp2p.dialProtocol = (p, proto, o) => origDial(p, proto, { runOnLimitedConnection: true, ...(o || {}) });

    await libp2p.start();

    libp2p.addEventListener("peer:discovery", (e) => {
      const id = e.detail.id;
      if (id.equals(libp2p.peerId)) return;
      libp2p.dial(id, { signal: AbortSignal.timeout(15000) }).catch(() => {});
    });
    libp2p.addEventListener("peer:connect", refresh);
    libp2p.addEventListener("peer:disconnect", refresh);
    libp2p.addEventListener("self:peer:update", refresh);

    const blockstore = directory ? new LevelBlockstore(`${directory}/blocks`) : new MemoryBlockstore();
    helia = await createHelia({ libp2p, blockstore, blockBrokers: [bitswap({ runOnLimitedConnections: true })] });
    orbitdb = await createOrbitDB({ ipfs: helia, directory: directory ? `${directory}/orbitdb` : undefined });

    // Keep trying the relays: the first dial can race the node starting up.
    const redial = () => relays.forEach((r) => libp2p.dial(multiaddr(r), { signal: AbortSignal.timeout(10000) }).catch(() => {}));
    redial();
    const timer = setInterval(() => { if (computeStatus() !== "relay") redial(); refresh(); }, 6000);
    const baseStop = stop;
    stop = async () => { clearInterval(timer); await baseStop(); };
    refresh();
    return api;
  }

  let stop = async () => {
    for (const r of rooms.values()) await r.db.close().catch(() => {});
    rooms.clear();
    await orbitdb?.stop().catch(() => {});
    await helia?.stop().catch(() => {});
  };

  /** Open (or create) a room: by name (deterministic address, open to all writers) or by address. */
  async function joinRoom(input) {
    const parsed = typeof input === "string" ? parseRoomInput(input) : input;
    if (!parsed) throw new Error("Give a room name or address.");
    const db = parsed.kind === "address"
      ? await orbitdb.open(parsed.value)
      : await orbitdb.open(`murmur/${parsed.value}`, { type: "events", AccessController: IPFSAccessController({ write: ["*"] }) });
    if (rooms.has(db.address)) return rooms.get(db.address);
    const subs = new Set();
    const room = {
      address: db.address,
      name: db.name,
      db,
      async history() { const all = await db.all(); return all.map((e) => ({ id: e.hash, ...e.value })); },
      async send(text) {
        const msg = { v: 1, author: displayName || "anon", authorId: orbitdb.identity.id, text: String(text), ts: Date.now() };
        const hash = await db.add(msg);
        return { id: hash, ...msg };
      },
      onMessage(fn) { subs.add(fn); return () => subs.delete(fn); },
      async close() { await db.close(); rooms.delete(db.address); },
    };
    db.events.on("update", async (entry) => {
      const e = entry?.payload ? { hash: entry.hash, value: entry.payload.value } : null;
      if (e) subs.forEach((fn) => fn({ id: e.hash, ...e.value }));
    });
    db.events.on("join", () => emit({ type: "status", status, peers: peerList() }));
    rooms.set(db.address, room);
    return room;
  }

  const api = {
    start,
    stop: () => stop(),
    joinRoom,
    onEvent(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    get status() { return status; },
    peers: () => peerList(),
    get identityId() { return orbitdb.identity.id; },
    get peerId() { return libp2p.peerId.toString(); },
    get multiaddrs() { return libp2p.getMultiaddrs().map(String); },
    get libp2p() { return libp2p; },
    demo: false,
  };
  return api;
}

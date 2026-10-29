// A small Nostr relay for developing the team chat: NIP-01 events and filters, NIP-11-free,
// NIP-42 sign-in and NIP-29 groups (create, invites, join, put/remove user, member lists).
// It keeps everything in memory (and optionally a JSON file) and is NOT a production relay:
// the real thing to point the chat at is a NIP-29 relay such as Buzz (github.com/block/buzz).
//
//   node scripts/dev-nostr-relay.mjs [--port 4869] [--file .nostr-dev-relay.json]
import { schnorr } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { WebSocketServer } from "ws";

const tag = (e, name) => e.tags.find((t) => t[0] === name)?.[1];
const tags = (e, name) => e.tags.filter((t) => t[0] === name);
const idOf = (e) => bytesToHex(sha256(utf8ToBytes(JSON.stringify([0, e.pubkey, e.created_at, e.kind, e.tags, e.content]))));
const valid = (e) => {
  try {
    return typeof e.id === "string" && e.id === idOf(e) && schnorr.verify(hexToBytes(e.sig), hexToBytes(e.id), hexToBytes(e.pubkey));
  } catch { return false; }
};

function matches(f, e) {
  if (f.ids && !f.ids.includes(e.id)) return false;
  if (f.authors && !f.authors.includes(e.pubkey)) return false;
  if (f.kinds && !f.kinds.includes(e.kind)) return false;
  if (f.since && e.created_at < f.since) return false;
  if (f.until && e.created_at > f.until) return false;
  return Object.entries(f).every(([k, v]) => !k.startsWith("#") || (Array.isArray(v) && e.tags.some((t) => t[0] === k.slice(1) && v.includes(t[1]))));
}

export function startRelay({ port = 4869, host = "127.0.0.1", file = null } = {}) {
  const relaySecret = bytesToHex(schnorr.utils.randomSecretKey());
  const relayPub = bytesToHex(schnorr.getPublicKey(hexToBytes(relaySecret)));
  const sign = (e) => { const full = { ...e, pubkey: relayPub }; full.id = idOf(full); full.sig = bytesToHex(schnorr.sign(hexToBytes(full.id), hexToBytes(relaySecret))); return full; };

  /** @type {Map<string, any>} */ const events = new Map();
  /** group id -> { name, admins:Set, members:Map(pubkey->roles), invites:Map(code->bool used), requests:Set } */
  const groups = new Map();
  const clients = new Set();

  if (file && existsSync(file)) {
    try {
      const saved = JSON.parse(readFileSync(file, "utf8"));
      saved.events?.forEach((e) => events.set(e.id, e));
      saved.events?.sort((a, b) => a.created_at - b.created_at).forEach((e) => { if (e.kind >= 9000 && e.kind <= 9022) applyGroupEvent(e, true); });
    } catch { /* start empty */ }
  }
  const persist = () => { if (file) writeFileSync(file, JSON.stringify({ events: [...events.values()].filter((e) => e.kind !== 39000 && e.kind !== 39001 && e.kind !== 39002) })); };

  const memberOf = (group, pubkey) => groups.get(group)?.members.has(pubkey);

  /** Who may read an event: group events only to that group's members; profiles to anyone signed in. */
  const canRead = (client, e) => {
    if (!client.pubkey) return false;
    const h = tag(e, "h") ?? (e.kind >= 39000 && e.kind <= 39002 ? tag(e, "d") : undefined);
    return h ? Boolean(memberOf(h, client.pubkey)) : true;
  };

  function replaceable(kind, d, event) {
    for (const [id, old] of events) if (old.kind === kind && tag(old, "d") === d) events.delete(id);
    events.set(event.id, event);
  }

  function publishGroupState(id) {
    const g = groups.get(id);
    const now = Math.floor(Date.now() / 1000);
    const out = [
      sign({ created_at: now, kind: 39000, tags: [["d", id], ["name", g.name]], content: "" }),
      sign({ created_at: now, kind: 39001, tags: [["d", id], ...[...g.admins].map((p) => ["p", p, "admin"])], content: "" }),
      sign({ created_at: now, kind: 39002, tags: [["d", id], ...[...g.members].map(([p, roles]) => ["p", p, ...roles])], content: "" }),
    ];
    out.forEach((e) => { replaceable(e.kind, id, e); broadcast(e); });
  }

  /** Applies a moderation or membership event. Returns an error string, or null when it took effect. */
  function applyGroupEvent(e, replay = false) {
    const id = tag(e, "h");
    if (!id) return "invalid: missing group";
    let g = groups.get(id);
    if (e.kind === 9007) {
      if (g) return "duplicate: that group exists";
      g = { name: tag(e, "name") ?? id, admins: new Set([e.pubkey]), members: new Map([[e.pubkey, ["admin"]]]), invites: new Map(), requests: new Set() };
      groups.set(id, g);
    } else if (!g) return "invalid: no such group";
    else if (e.kind === 9002) { if (!g.admins.has(e.pubkey)) return "restricted: admins only"; g.name = tag(e, "name") ?? g.name; }
    else if (e.kind === 9000) {
      if (!g.admins.has(e.pubkey)) return "restricted: admins only";
      tags(e, "p").forEach((t) => { const roles = t.slice(2).length ? t.slice(2) : ["member"]; g.members.set(t[1], roles); if (roles.includes("admin")) g.admins.add(t[1]); g.requests.delete(t[1]); });
    } else if (e.kind === 9001) {
      if (!g.admins.has(e.pubkey)) return "restricted: admins only";
      tags(e, "p").forEach((t) => { g.members.delete(t[1]); g.admins.delete(t[1]); });
    } else if (e.kind === 9009) {
      if (!g.admins.has(e.pubkey)) return "restricted: admins only";
      const code = tag(e, "code"); if (!code) return "invalid: missing code"; g.invites.set(code, false);
    } else if (e.kind === 9021) {
      if (g.members.has(e.pubkey)) return replay ? null : "duplicate: already a member";
      const code = tag(e, "code");
      if (code && g.invites.get(code) === false) { g.invites.set(code, true); g.members.set(e.pubkey, ["member"]); }
      else if (code) return "restricted: that invite is not valid or was already used";
      else g.requests.add(e.pubkey);
    } else if (e.kind === 9022) { g.members.delete(e.pubkey); g.admins.delete(e.pubkey); }
    if (!replay) publishGroupState(id);
    return null;
  }

  function broadcast(e) {
    for (const c of clients) for (const [subId, filters] of c.subs) if (canRead(c, e) && filters.some((f) => matches(f, e))) c.ws.send(JSON.stringify(["EVENT", subId, e]));
  }

  const wss = new WebSocketServer({ port, host });
  wss.on("connection", (ws) => {
    const challenge = bytesToHex(schnorr.utils.randomSecretKey()).slice(0, 32);
    const client = { ws, pubkey: null, subs: new Map(), challenge };
    clients.add(client);
    ws.send(JSON.stringify(["AUTH", challenge]));
    ws.on("close", () => clients.delete(client));
    ws.on("message", (raw) => {
      let msg; try { msg = JSON.parse(String(raw)); } catch { return; }
      const [type, a, ...rest] = msg;
      const reply = (...m) => ws.send(JSON.stringify(m));
      if (type === "AUTH") {
        const e = a;
        if (!e || !valid(e) || e.kind !== 22242 || tag(e, "challenge") !== challenge) return reply("OK", e?.id ?? "", false, "auth-required: sign-in failed");
        client.pubkey = e.pubkey; return reply("OK", e.id, true, "");
      }
      if (type === "REQ") {
        if (!client.pubkey) return reply("CLOSED", a, "auth-required: sign in first");
        client.subs.set(a, rest);
        const found = [...events.values()].filter((e) => canRead(client, e) && rest.some((f) => matches(f, e))).sort((x, y) => x.created_at - y.created_at);
        const limit = Math.min(...rest.map((f) => f.limit ?? Infinity));
        (Number.isFinite(limit) ? found.slice(-limit) : found).forEach((e) => reply("EVENT", a, e));
        return reply("EOSE", a);
      }
      if (type === "CLOSE") { client.subs.delete(a); return; }
      if (type === "EVENT") {
        const e = a;
        if (!e || !valid(e)) return reply("OK", e?.id ?? "", false, "invalid: bad id or signature");
        if (!client.pubkey || client.pubkey !== e.pubkey) return reply("OK", e.id, false, "auth-required: sign in as the author first");
        if (events.has(e.id)) return reply("OK", e.id, true, "duplicate: already have this event");
        if (e.kind === 0) {
          for (const [id, old] of events) if (old.kind === 0 && old.pubkey === e.pubkey) events.delete(id);
          events.set(e.id, e); persist(); broadcast(e); return reply("OK", e.id, true, "");
        }
        if (e.kind >= 9000 && e.kind <= 9022 && e.kind !== 9) {
          const err = applyGroupEvent(e);
          if (err) return reply("OK", e.id, false, err);
          events.set(e.id, e); persist(); broadcast(e); return reply("OK", e.id, true, "");
        }
        if (e.kind === 9) {
          const h = tag(e, "h");
          if (!h || !memberOf(h, e.pubkey)) return reply("OK", e.id, false, "restricted: only group members can post");
          events.set(e.id, e); persist(); broadcast(e); return reply("OK", e.id, true, "");
        }
        return reply("OK", e.id, false, "blocked: this relay only takes profiles and group events");
      }
    });
  });
  return new Promise((resolve) => wss.on("listening", () => {
    const actual = wss.address().port;
    resolve({ port: actual, url: `ws://${host}:${actual}`, groups, events, close: () => new Promise((r) => { clients.forEach((c) => c.ws.terminate()); wss.close(() => r()); }) });
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
  const relay = await startRelay({ port: Number(arg("--port", 4869)), file: arg("--file", null) });
  console.log(`Dev Nostr relay listening on ${relay.url}`);
}

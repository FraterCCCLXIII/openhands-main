import { webcrypto } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MeshClient, activate, bytesToHex, createDemoClient, entityIdFor, exportBundle, generateIdentity, hexToBytes, identityFromJwk,
  importBundle, linkIdFor, attestationIdFor, validateProfileInput, x25519Supported,
} from "./extension.js";

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (fn, ms = 2000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { const v = fn(); if (v) return v; } catch { /* retry */ } await tick(5); }
  throw new Error(`waitFor timed out: ${fn}`);
};
const jsonRes = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });

beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); localStorage.clear(); });

function mountApp(saved = {}) {
  localStorage.clear();
  localStorage.setItem("mesh-hangout:v1", JSON.stringify({ welcomed: true, ...saved }));
  let mountFn;
  activate({ apiVersion: "1", registerPage: (_id, fn) => { mountFn = fn; return () => {}; } });
  const container = document.createElement("div");
  document.body.append(container);
  return { container, dispose: mountFn({ container }) };
}
const demoFetch = () => vi.fn(async () => { throw new TypeError("down"); });
const setVal = (node, value) => { node.value = value; node.dispatchEvent(new Event("input", { bubbles: true })); };
const submit = (form) => form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
const dialog = (c) => c.querySelector("[role=dialog]");
const clickText = (root, selector, text) => {
  const b = [...root.querySelectorAll(selector)].find((n) => n.textContent.trim() === text || n.textContent.includes(text));
  if (!b) throw new Error(`no ${selector} with text ${text}`);
  b.click();
  return b;
};
const rail = (c, text) => [...c.querySelectorAll(".list .row")].find((r) => r.textContent.includes(text));

// ── Python cross-checks ──────────────────────────────────────────────────────────────────
const PY_DIR = join(homedir(), "Documents/github/holon-protocol/mesh-protocol/app/server");
const pyReady = (() => {
  try { execFileSync("python3", ["-I", "-c", "import cryptography"], { stdio: "ignore" }); return existsSync(join(PY_DIR, "protocol.py")); } catch { return false; }
})();
function py(script, args) {
  const prelude = `import sys, json, base64\nsys.path.insert(0, ${JSON.stringify(PY_DIR)})\nimport protocol as p\nargs = json.loads(sys.argv[1])\nb64 = lambda s: base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))\n`;
  const out = execFileSync("python3", ["-I", "-c", prelude + script, JSON.stringify(args)], { encoding: "utf8", env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" } });
  return JSON.parse(out);
}

// A stateful fake node that really verifies the Ed25519 challenge signature, like server_v2.verify_signature does.
function fakeNode({ version = "1.1", takenHandles = [], entityDetail = {} } = {}) {
  const calls = [];
  const entities = new Map();
  takenHandles.forEach((h) => entities.set(`ent:taken-${h}`, { id: `ent:taken-${h}`, handle: h, profile: {} }));
  const challenge = "ab".repeat(32);
  const v2 = version.startsWith("2");
  const fetchImpl = vi.fn(async (url, init = {}) => {
    const u = new URL(url);
    const call = { method: init.method || "GET", path: u.pathname, query: Object.fromEntries(u.searchParams), body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(call);
    const route = `${call.method} ${call.path}`;
    if (route === "GET /.well-known/mesh-node") return jsonRes({ node_id: "n1", node_url: "http://localhost:12000", protocol_version: version, features: [] });
    if (call.method === "GET" && call.path.startsWith("/api/entities/by-handle/")) {
      const h = decodeURIComponent(call.path.split("/").pop());
      const hit = [...entities.values()].find((e) => e.handle === h);
      return hit ? jsonRes(hit) : jsonRes({ detail: "Entity not found" }, 404);
    }
    if (call.method === "GET" && call.path.startsWith("/api/entities/")) {
      const id = decodeURIComponent(call.path.split("/").pop());
      return entities.has(id) ? jsonRes(entities.get(id)) : jsonRes({ detail: v2 ? "Not found" : "Entity not found" }, 404);
    }
    if (route === "POST /api/entities") {
      const id = await entityIdFor(hexToBytes(call.body.public_key));
      if (entities.has(id)) return jsonRes({ detail: v2 ? "Entity exists" : "Entity already exists" }, 409);
      if (call.body.handle && (takenHandles.includes(call.body.handle) || [...entities.values()].some((e) => e.handle === call.body.handle))) return jsonRes({ detail: v2 ? "Handle taken" : "Handle already taken" }, 409);
      entities.set(id, { id, kind: "user", public_key: call.body.public_key, encryption_key: call.body.encryption_key, handle: call.body.handle, profile: call.body.profile, ...entityDetail });
      return jsonRes({ id, handle: call.body.handle });
    }
    if (route === "POST /api/auth/challenge") return jsonRes({ challenge, expires_at: "x" });
    if (route === "POST /api/auth/verify") {
      const e = entities.get(call.body.entity_id);
      if (!e) return jsonRes({ detail: "Entity not found" }, 404);
      const key = await webcrypto.subtle.importKey("raw", hexToBytes(e.public_key), { name: "Ed25519" }, false, ["verify"]);
      const ok = await webcrypto.subtle.verify({ name: "Ed25519" }, key, hexToBytes(call.body.signature), new TextEncoder().encode(call.body.challenge));
      if (!ok) return jsonRes({ detail: "Invalid signature" }, 401);
      calls.verified = { challenge: call.body.challenge, signature: call.body.signature, publicKey: e.public_key, entityId: e.id };
      return jsonRes({ token: "tok-1", expires_at: "later", entity_id: e.id });
    }
    if (call.path.startsWith("/api/users/") && call.path.endsWith("/feed")) return jsonRes({ items: [] });
    if (call.path.startsWith("/api/users/") && call.path.endsWith("/following")) return jsonRes({ items: [] });
    if (route === "GET /api/messages/conversations") return jsonRes({ conversations: [] });
    if (route === "GET /api/groups") return jsonRes({ items: [] });
    if (route === "GET /api/feed") return jsonRes({ items: [] });
    if (route === "GET /api/content") return jsonRes({ items: [] });
    if (call.path.startsWith("/api/sync/")) return jsonRes({ actor: "x", heads: ["h1"] });
    if (call.path.startsWith("/api/subjects/")) return jsonRes({ labels: [] });
    return jsonRes({ detail: "Not found" }, 404);
  });
  return { fetchImpl, calls, entities };
}

describe("keys and signatures against the Python reference helpers", () => {
  it.skipIf(!pyReady)("Ed25519 signatures, entity ids and the X25519 encryption key are accepted by protocol.py", async () => {
    const id = await generateIdentity();
    expect(id.enc).not.toBeNull();
    const challenge = "c0".repeat(32);
    const sig = await id.sign(challenge);
    const res = py(
      `pub = bytes.fromhex(args["pub"])
sig = bytes.fromhex(args["sig"])
ok = p.verify_signature(pub, args["challenge"].encode(), sig)
bad = p.verify_signature(pub, b"tampered", sig)
entity = p.generate_entity_id(pub)
priv = p.EncryptionKeyPair.from_private_bytes(b64(args["enc_d"]))
pubmatch = priv.public_key_bytes().hex() == args["enc_pub"]
env = p.encrypt_for_recipient(b"hello hangout", bytes.fromhex(args["enc_pub"]))
plain = p.decrypt_from_sender(env, priv).decode()
print(json.dumps({"ok": ok, "bad": bad, "entity": entity, "pubmatch": pubmatch, "plain": plain,
  "link": p.generate_link_id(args["me"], "like", "c1"), "att": p.generate_attestation_id(args["me"], "c1", "spam")}))`,
      { pub: id.publicKeyHex, sig, challenge, enc_d: id.enc.jwk.d, enc_pub: id.enc.publicKeyHex, me: id.entityId },
    );
    expect(res.ok).toBe(true);
    expect(res.bad).toBe(false);
    expect(res.entity).toBe(id.entityId);
    expect(res.pubmatch).toBe(true);
    expect(res.plain).toBe("hello hangout");
    expect(res.link).toBe(await linkIdFor(id.entityId, "like", "c1"));
    expect(res.att).toBe(await attestationIdFor(id.entityId, "c1", "spam"));
  });

  it.skipIf(!pyReady)("the challenge signature sent while creating an identity in the app verifies in Python", async () => {
    const node = fakeNode({ version: "2.0" });
    vi.stubGlobal("fetch", node.fetchImpl);
    const { container } = mountApp({ channel: "following" });
    await waitFor(() => container.querySelector(".status")?.dataset.mode === "connected");
    container.querySelector(".acct").click();
    const form = dialog(container).querySelector("form");
    const [, name] = form.querySelectorAll("input");
    setVal(form.querySelector("input"), "pytest");
    setVal(name, "Py Test");
    submit(form);
    await waitFor(() => node.calls.verified);
    const v = node.calls.verified;
    const res = py(`print(json.dumps({"ok": p.verify_signature(bytes.fromhex(args["pub"]), args["challenge"].encode(), bytes.fromhex(args["sig"])), "ent": p.generate_entity_id(bytes.fromhex(args["pub"]))}))`, { pub: v.publicKey, challenge: v.challenge, sig: v.signature });
    expect(res.ok).toBe(true);
    expect(res.ent).toBe(v.entityId);
  });
});

describe("identity helpers", () => {
  it("exports and imports a bundle, and still accepts a bare Ed25519 JWK", async () => {
    const id = await generateIdentity();
    const stored = { jwk: id.jwk, enc: id.enc.jwk, handle: "ada", name: "Ada" };
    const back = await importBundle(exportBundle(stored));
    expect(back.identity.entityId).toBe(id.entityId);
    expect(back.identity.enc.publicKeyHex).toBe(id.enc.publicKeyHex);
    expect(back.stored).toMatchObject({ handle: "ada", name: "Ada" });
    expect((await importBundle(JSON.stringify(id.jwk))).identity.entityId).toBe(id.entityId);
    await expect(importBundle("nope")).rejects.toThrow(/not valid JSON/);
    await expect(importBundle(JSON.stringify({ kty: "OKP", crv: "Ed25519", x: id.jwk.x }))).rejects.toThrow(/Ed25519 private key/);
    expect(await x25519Supported()).toBe(true);
    expect((await identityFromJwk(id.jwk)).enc).toBeNull();
  });

  it("validates profile input", () => {
    expect(validateProfileInput({ handle: "a b", name: "x" })).toMatch(/Handle/);
    expect(validateProfileInput({ handle: "ada", name: " " })).toMatch(/display name/);
    expect(validateProfileInput({ handle: "", name: "x", bio: "y".repeat(281) })).toMatch(/Bio/);
    expect(validateProfileInput({ handle: "ada_1", name: "Ada", bio: "" })).toBe("");
  });
});

describe("MeshClient wire format per flow (v1.1 vs v2.0)", () => {
  const node = (version, routes = {}) => {
    const calls = [];
    const fetchImpl = vi.fn(async (url, init = {}) => {
      const u = new URL(url);
      const call = { method: init.method, path: u.pathname, query: Object.fromEntries(u.searchParams), body: init.body ? JSON.parse(init.body) : undefined };
      calls.push(call);
      if (u.pathname === "/.well-known/mesh-node") return jsonRes({ node_id: "n", node_url: "x", protocol_version: version, features: [] });
      const h = routes[`${init.method} ${u.pathname}`];
      return h ? h(call) : jsonRes({ detail: "Not found" }, 404);
    });
    return { fetchImpl, calls };
  };
  const client = async (version, routes) => {
    const n = node(version, routes);
    const c = new MeshClient("http://n", { fetch: n.fetchImpl });
    await c.info();
    c.useSession("tok", "ent:me");
    return { c, calls: n.calls };
  };

  it("registers with the exact EntityCreate fields and passes the 409 detail through", async () => {
    for (const v of ["1.1", "2.0"]) {
      const { c, calls } = await client(v, { "POST /api/entities": () => jsonRes({ id: "ent:x", handle: "ada" }) });
      await c.createEntity({ publicKeyHex: "aa".repeat(32), encryptionKeyHex: "bb".repeat(32), handle: "ada", profile: { name: "Ada", agent: false, bio: "hi" } });
      expect(calls.at(-1)).toMatchObject({ method: "POST", path: "/api/entities", query: {}, body: { public_key: "aa".repeat(32), encryption_key: "bb".repeat(32), handle: "ada", profile: { name: "Ada", agent: false, bio: "hi" } } });
      expect(Object.keys(calls.at(-1).body).sort()).toEqual(["encryption_key", "handle", "profile", "public_key"]);
    }
    const { c } = await client("1.1", { "POST /api/entities": () => jsonRes({ detail: "Handle already taken" }, 409) });
    await expect(c.createEntity({ publicKeyHex: "aa", handle: "x" })).rejects.toMatchObject({ status: 409, message: "Handle already taken" });
  });

  it("v1.1 edits the profile with a bare profile body; v2.0 refuses", async () => {
    const { c, calls } = await client("1.1", { "PUT /api/entities/ent%3Ame": () => jsonRes({ status: "updated" }) });
    await c.updateProfile({ name: "New", bio: "b", agent: true });
    expect(calls.at(-1)).toMatchObject({ method: "PUT", path: "/api/entities/ent%3Ame", query: { token: "tok" }, body: { name: "New", bio: "b", agent: true } });
    const v2 = await client("2.0");
    await expect(v2.c.updateProfile({ name: "x" })).rejects.toThrow(/no profile update/);
    expect(v2.calls.some((x) => x.method === "PUT")).toBe(false);
  });

  it("posts: v1.1 group posts carry access=group and group_id and never media; v2.0 sends media and rejects groups", async () => {
    const a = await client("1.1", { "POST /api/content": () => jsonRes({ id: "p" }) });
    await a.c.post("hi group", { groupId: "grp:abc", media: ["https://x.test/a.png"] });
    expect(a.calls.at(-1).body).toEqual({ kind: "post", body: "hi group", reply_to: null, access: "group", group_id: "grp:abc" });
    await a.c.post("plain", {});
    expect(a.calls.at(-1).body).toEqual({ kind: "post", body: "plain", reply_to: null, access: "public" });
    await a.c.post("re", { replyTo: "p1", groupId: "grp:abc" });
    expect(a.calls.at(-1).body).toMatchObject({ kind: "reply", reply_to: "p1", access: "group", group_id: "grp:abc" });
    const b = await client("2.0", { "POST /api/content": () => jsonRes({ id: "p" }) });
    await b.c.post("with media", { media: ["https://x.test/a.png"] });
    expect(b.calls.at(-1).body).toEqual({ author: "ent:me", kind: "post", body: "with media", media: ["https://x.test/a.png"], reply_to: null });
    await expect(b.c.post("x", { groupId: "grp:abc" })).rejects.toThrow(/no groups/);
  });

  it("deletes own content on v1.1 only", async () => {
    const a = await client("1.1", { "DELETE /api/content/c%201": () => jsonRes({ status: "deleted" }) });
    await a.c.deleteContent("c 1");
    expect(a.calls.at(-1)).toMatchObject({ method: "DELETE", path: "/api/content/c%201", query: { token: "tok" } });
    const b = await client("2.0");
    await expect(b.c.deleteContent("x")).rejects.toThrow(/no delete/);
  });

  it("follow, like and repost links use data on v1.1 (id-based delete) and metadata on v2.0 (query delete)", async () => {
    const a = await client("1.1", { "POST /api/links": () => jsonRes({ id: "l" }), "DELETE /api/links/d32f5c8af786d260eac22d546c267361": () => jsonRes({ status: "deleted" }) });
    await a.c.link("like", "c1");
    expect(a.calls.at(-1)).toMatchObject({ path: "/api/links", query: { token: "tok" }, body: { target: "c1", kind: "like", data: {} } });
    expect(a.c.caps.repost).toBe(false);
    a.c.useSession("tok", "ent:a");
    await a.c.unfollow("ent:b");
    expect(a.calls.at(-1)).toMatchObject({ method: "DELETE", path: "/api/links/d32f5c8af786d260eac22d546c267361" });
    await a.c.unlink("like", "never-liked"); // 404 means there is nothing to undo
    const b = await client("2.0", { "POST /api/links": () => jsonRes({ id: "l" }), "DELETE /api/links": () => jsonRes({ status: "deleted" }) });
    await b.c.link("repost", "c9");
    expect(b.calls.at(-1).body).toEqual({ target: "c9", kind: "repost", metadata: {} });
    await b.c.unlink("repost", "c9");
    expect(b.calls.at(-1)).toMatchObject({ method: "DELETE", path: "/api/links", query: { target: "c9", kind: "repost", token: "tok" } });
  });

  it("groups: list, read with optional token, create, join, leave, feed and group replies", async () => {
    const { c, calls } = await client("1.1", {
      "GET /api/groups": () => jsonRes({ items: [{ id: "grp:1", name: "Lobby", description: "d", owner: "ent:o", access: "public", member_count: 3 }] }),
      "GET /api/groups/grp%3A1": () => jsonRes({ id: "grp:1", name: "Lobby", access: "public", member_count: 3, is_member: true, members: [] }),
      "POST /api/groups": () => jsonRes({ id: "grp:2", name: "New" }),
      "POST /api/groups/grp%3A1/join": () => jsonRes({ status: "joined" }),
      "POST /api/groups/grp%3A1/leave": () => jsonRes({ status: "left" }),
      "GET /api/content": () => jsonRes({ items: [{ id: "g1", author: "ent:o", body: "hello", group_id: "grp:1", created_at: "2026-01-01T00:00:00" }] }),
    });
    expect((await c.groups())[0]).toMatchObject({ id: "grp:1", name: "Lobby", memberCount: 3 });
    expect(calls.at(-1).query).toEqual({ limit: "50" });
    expect(await c.group("grp:1")).toMatchObject({ isMember: true });
    expect(calls.at(-1).query).toEqual({ token: "tok" });
    await c.createGroup({ name: "New", description: "d", access: "private" });
    expect(calls.at(-1)).toMatchObject({ method: "POST", path: "/api/groups", query: { token: "tok" }, body: { name: "New", description: "d", access: "private" } });
    await c.joinGroup("grp:1"); await c.leaveGroup("grp:1");
    expect(calls.at(-1)).toMatchObject({ path: "/api/groups/grp%3A1/leave", query: { token: "tok" } });
    expect((await c.groupFeed("grp:1"))[0].groupId).toBe("grp:1");
    expect(calls.at(-1).query).toEqual({ group_id: "grp:1", limit: "50" });
    await c.replies("g1", { groupId: "grp:1" });
    expect(calls.at(-1).query).toEqual({ reply_to: "g1", group_id: "grp:1", limit: "100" });
    const v2 = await client("2.0");
    expect(await v2.c.groups()).toEqual([]);
    await expect(v2.c.createGroup({ name: "x" })).rejects.toThrow(/no groups/);
  });

  it("DMs: v1.1 posts recipient_id/content; v2.0 posts author/recipient/body and explains a missing encryption key", async () => {
    const a = await client("1.1", { "POST /api/messages": () => jsonRes({ id: "d", status: "sent" }) });
    await a.c.sendDm("ent:y", "hi");
    expect(a.calls.at(-1)).toMatchObject({ path: "/api/messages", query: { token: "tok" }, body: { recipient_id: "ent:y", content: "hi" } });
    const b = await client("2.0", { "POST /api/dm": () => jsonRes({ detail: "Recipient doesn't support E2EE" }, 400) });
    await expect(b.c.sendDm("ent:y", "hi")).rejects.toThrow(/encryption key/);
    expect(b.calls.at(-1).body).toEqual({ author: "ent:me", recipient: "ent:y", body: "hi" });
  });

  it("labels: attestation body has subject, type, claim.reason, evidence and confidence; reads pass viewer", async () => {
    const { c, calls } = await client("2.0", { "POST /api/attestations": () => jsonRes({ id: "a" }), "GET /api/subjects/c1/labels": () => jsonRes({ labels: [{ id: "a", issuer: "ent:me", type: "spam", claim: { reason: "ads" }, confidence: 0.8 }] }) });
    await c.attest("c1", "spam", { reason: "ads" }, 0.8);
    expect(calls.at(-1)).toMatchObject({ path: "/api/attestations", query: { token: "tok" }, body: { subject: "c1", type: "spam", claim: { reason: "ads" }, evidence: null, confidence: 0.8 } });
    expect((await c.labels(["c1"])).get("c1")[0]).toMatchObject({ issuer: "ent:me", confidence: 0.8 });
    expect(calls.at(-1).query).toEqual({ viewer: "ent:me" });
    const v1 = await client("1.1");
    await expect(v1.c.attest("c1", "spam")).rejects.toThrow(/does not accept attestations/);
  });

  it("re-runs the challenge flow once when the node forgot the session", async () => {
    let posts = 0;
    const { c, calls } = await client("2.0", {
      "POST /api/content": (call) => { posts += 1; return call.query.token === "tok" ? jsonRes({ detail: "Invalid session" }, 401) : jsonRes({ id: "ok" }); },
    });
    c.onAuthExpired = async () => { c.token = "fresh"; return true; };
    expect((await c.post("hello")).id).toBe("ok");
    expect(posts).toBe(2);
    expect(calls.at(-1).query.token).toBe("fresh");
  });
});

describe("Demo mode, end to end", () => {
  it("creates an identity, edits the profile, posts, replies, likes, boosts and deletes", async () => {
    const demo = createDemoClient();
    const id = await generateIdentity();
    await demo.createEntity({ publicKeyHex: id.publicKeyHex, encryptionKeyHex: id.enc.publicKeyHex, handle: "grace", profile: { name: "Grace", agent: false } });
    await expect(demo.createEntity({ publicKeyHex: id.publicKeyHex })).rejects.toMatchObject({ status: 409, message: "Entity already exists" });
    const other = await generateIdentity();
    await expect(demo.createEntity({ publicKeyHex: other.publicKeyHex, handle: "grace" })).rejects.toMatchObject({ status: 409, message: "Handle already taken" });
    await demo.signIn(id);
    expect(demo.me).toBe(id.entityId);
    await demo.updateProfile({ name: "Grace H", bio: "compilers", agent: false });
    expect(await demo.entity(id.entityId)).toMatchObject({ name: "Grace H", bio: "compilers", handle: "grace" });
    const { id: post } = await demo.post("my first post", { media: ["https://x.test/p.png"] });
    expect((await demo.timeline(id.entityId))[0]).toMatchObject({ body: "my first post", media: ["https://x.test/p.png"], kind: "post" });
    const { id: reply } = await demo.post("replying", { replyTo: post });
    expect((await demo.replies(post)).map((m) => m.id)).toEqual([reply]);
    await demo.link("like", post);
    expect((await demo.timeline(id.entityId))[0]).toMatchObject({ likeCount: 1, likedByMe: true });
    await demo.unlink("like", post);
    expect((await demo.timeline(id.entityId))[0].likeCount).toBe(0);
    await expect(demo.deleteContent("demo-c1")).rejects.toMatchObject({ status: 403 });
    await demo.deleteContent(post);
    expect((await demo.timeline(id.entityId)).map((m) => m.id)).not.toContain(post);
    await demo.signOut();
    expect(demo.signedIn).toBe(false);
    demo.useSession("", "");
    expect(demo.me).toMatch(/^ent:demo/);
  });

  it("follows, finds, messages, labels and runs groups", async () => {
    const demo = createDemoClient();
    expect((await demo.lookup("@ada")).id).toMatch(/^ent:ada/);
    await expect(demo.lookup("@nobody")).rejects.toMatchObject({ status: 404 });
    await demo.follow("ent:nova0000000000000000000000000000");
    expect((await demo.following()).map((e) => e.handle)).toContain("nova");
    await demo.sendDm((await demo.lookup("lin")).id, "hello lin");
    expect((await demo.conversations()).map((c) => c.handle)).toEqual(expect.arrayContaining(["lin", "atlas"]));
    expect((await demo.messages((await demo.lookup("lin")).id)).at(-1).body).toBe("hello lin");
    const target = (await demo.feedGlobal())[0];
    await demo.attest(target.id, "misleading", { reason: "unsourced" }, 0.5);
    expect((await demo.labels([target.id])).get(target.id).at(-1)).toMatchObject({ type: "misleading", issuer: demo.me, claim: { reason: "unsourced" }, confidence: 0.5 });
    const g = await demo.createGroup({ name: "Builders", description: "d", access: "private" });
    expect((await demo.groups()).map((x) => x.name)).toContain("Builders");
    await demo.post("inside", { groupId: g.id });
    expect((await demo.groupFeed(g.id)).map((m) => m.body)).toEqual(["inside"]);
    expect((await demo.feedGlobal()).some((m) => m.body === "inside")).toBe(false);
    await demo.leaveGroup(g.id);
    await expect(demo.post("nope", { groupId: g.id })).rejects.toMatchObject({ status: 403 });
    await expect(demo.joinGroup(g.id)).rejects.toMatchObject({ status: 403 });
  });
});

describe("the page, Demo mode", () => {
  it("creates, shows, edits, exports and forgets an identity", async () => {
    vi.stubGlobal("fetch", demoFetch());
    const { container } = mountApp();
    await waitFor(() => container.querySelector(".status")?.dataset.mode === "demo");
    await waitFor(() => container.querySelector(".acct"));
    expect(container.querySelector(".acct").textContent).toContain("You");
    container.querySelector(".acct").click();
    let d = dialog(container);
    expect(d.getAttribute("aria-modal")).toBe("true");
    expect(d.textContent).toContain("Built-in sample identity");

    // validation, then success
    let form = d.querySelector("form");
    const inputs = form.querySelectorAll("input");
    setVal(inputs[0], "bad handle!");
    submit(form);
    expect(d.querySelector(".flash.err").textContent).toMatch(/Handle must be/);
    setVal(inputs[0], "grace"); setVal(inputs[1], "Grace Hopper");
    form.querySelector("textarea").value = "Debugger.";
    submit(form);
    await waitFor(() => dialog(container).textContent.includes("Welcome, Grace Hopper"));
    d = dialog(container);
    expect(d.querySelector(".whocard").textContent).toContain("@grace");
    expect(d.textContent).toContain("Registered on the demo node");
    expect(d.textContent).toContain("Encryption key published");
    expect(container.querySelector(".acct").textContent).toContain("Grace Hopper");
    expect(JSON.parse(localStorage.getItem("mesh-hangout:v1")).identity).toMatchObject({ handle: "grace", name: "Grace Hopper" });

    // edit profile
    clickText(d, "button", "Edit profile");
    d = dialog(container);
    form = d.querySelector("form");
    setVal(form.querySelector("input"), "Grace H.");
    submit(form);
    await waitFor(() => dialog(container).textContent.includes("Profile saved."));
    expect(dialog(container).querySelector(".whocard").textContent).toContain("Grace H.");

    // export hides the key behind an acknowledgement and warns
    clickText(dialog(container), "button", "Export key");
    d = dialog(container);
    expect(d.querySelector(".warnbox").textContent).toMatch(/private key/);
    const area = d.querySelector("textarea");
    expect(area.hidden).toBe(true);
    const ack = d.querySelector("input[type=checkbox]");
    ack.checked = true; ack.dispatchEvent(new Event("change"));
    expect(area.hidden).toBe(false);
    expect(JSON.parse(area.value).ed25519.d).toBeTruthy();
    clickText(d, "button", "Back");

    // forget needs the acknowledgement, then returns to the sample identity
    clickText(dialog(container), "button", "Switch / forget identity");
    d = dialog(container);
    form = d.querySelector("form");
    submit(form);
    expect(d.querySelector(".flash.err").textContent).toMatch(/Tick the box/);
    const ok = form.querySelector("input[type=checkbox]");
    ok.checked = true;
    submit(form);
    await waitFor(() => dialog(container).textContent.includes("Identity removed"));
    expect(JSON.parse(localStorage.getItem("mesh-hangout:v1")).identity).toBeNull();
    clickText(dialog(container), "button", "Close");
    expect(dialog(container)).toBeNull();
    await waitFor(() => container.querySelector(".acct").textContent.includes("You"));
  });

  it("imports an exported key and signs back in as the same identity", async () => {
    vi.stubGlobal("fetch", demoFetch());
    const id = await generateIdentity();
    const text = exportBundle({ jwk: id.jwk, enc: id.enc.jwk, handle: null, name: null });
    const { container } = mountApp();
    await waitFor(() => container.querySelector(".status")?.dataset.mode === "demo");
    await waitFor(() => container.querySelector(".acct"));
    container.querySelector(".acct").click();
    clickText(dialog(container), "button", "import it");
    let form = dialog(container).querySelector("form");
    submit(form);
    expect(dialog(container).querySelector(".flash.err").textContent).toMatch(/Paste the exported key/);
    setVal(form.querySelector("textarea"), "garbage");
    submit(form);
    await waitFor(() => dialog(container).querySelector(".flash.err")?.textContent.includes("Import failed"));
    setVal(form.querySelector("textarea"), text);
    submit(form);
    await waitFor(() => dialog(container).textContent.includes("not registered on this node yet"));
    form = dialog(container).querySelector("form");
    setVal(form.querySelectorAll("input")[1], "Imported Ivy");
    submit(form);
    await waitFor(() => dialog(container).textContent.includes("Registered and signed in"));
    expect(dialog(container).querySelector("code").textContent).toBe(id.entityId);
  });

  it("posts, quotes, likes, boosts and deletes", async () => {
    vi.stubGlobal("fetch", demoFetch());
    const { container } = mountApp({ channel: "following" });
    await waitFor(() => container.querySelectorAll(".thread .msg").length > 2);
    const ta = container.querySelector(".composerbox textarea");
    setVal(ta, "Hello from **me**");
    container.querySelector(".attachbtn").click();
    const mi = container.querySelector(".mediachips input");
    setVal(mi, "javascript:alert(1)");
    mi.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(container.querySelector(".mchip")).toBeNull();
    setVal(mi, "https://example.org/pic.png");
    mi.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(container.querySelector(".mchip").textContent).toContain("example.org");
    submit(container.querySelector(".composerbox"));
    await waitFor(() => container.querySelector(".msg.me strong"));
    const mine = container.querySelector(".msg.me");
    expect(mine.querySelector(".mediachips a").getAttribute("href")).toBe("https://example.org/pic.png");

    clickText(mine, "button", "Like");
    await waitFor(() => container.querySelector(".msg.me .likebtn")?.getAttribute("aria-pressed") === "true");
    expect(container.querySelector(".msg.me .likebtn").textContent).toBe("Liked · 1");

    // quote someone else's message into the composer
    const other = [...container.querySelectorAll(".msg:not(.me)")][0];
    clickText(other, "button", "Quote");
    expect(container.querySelector(".composerbox textarea").value).toMatch(/^> .*\n> — /);
    expect(container.querySelector(".boostbtn")).not.toBeNull();
    clickText(other, "button", "Boost");
    await waitFor(() => container.querySelector(`.msg[data-id="${other.dataset.id}"] .boostbtn`)?.textContent === "Boosted");

    // delete asks first
    clickText(container.querySelector(".msg.me"), "button", "Delete");
    expect(container.querySelector(".msg.me .confirm").textContent).toMatch(/Delete this message/);
    clickText(container.querySelector(".msg.me"), "button", "Keep");
    expect(container.querySelector(".msg.me")).not.toBeNull();
    clickText(container.querySelector(".msg.me"), "button", "Delete");
    clickText(container.querySelector(".msg.me"), "button", "Yes, delete");
    await waitFor(() => !container.querySelector(".msg.me"));
    expect(container.textContent).toContain("Message deleted.");
  });

  it("finds a member, follows, lists following and starts a DM", async () => {
    vi.stubGlobal("fetch", demoFetch());
    const { container } = mountApp({ channel: "global" });
    await waitFor(() => container.querySelector(".members .mrow"));
    const search = container.querySelector(".members form.search");
    setVal(search.querySelector("input"), "@nobody");
    submit(search);
    await waitFor(() => container.querySelector(".finderr"));
    expect(container.querySelector(".finderr").textContent).toMatch(/No member/);
    setVal(container.querySelector(".members form.search input"), "@sentinel");
    submit(container.querySelector(".members form.search"));
    await waitFor(() => container.querySelector(".mrow.found"));
    const found = container.querySelector(".mrow.found");
    expect(found.textContent).toContain("Sentinel");
    expect(container.querySelector(".tab[aria-pressed=true]").textContent).toBe("All");
    clickText(found, "button", "Follow");
    await waitFor(() => container.querySelector(".mrow.found .follow")?.textContent === "Following");
    clickText(container.querySelector(".tabs"), "button", "Following");
    expect([...container.querySelectorAll(".members .mrow .name")].map((n) => n.textContent)).toEqual(expect.arrayContaining(["Sentinel"]));
    clickText(container.querySelector(".mrow.found"), "button", "Following");
    await waitFor(() => !container.querySelector(".tab[aria-pressed=true]").textContent.includes("4"));

    // new message by handle
    clickText(container.querySelector(".list"), "button", "+ New");
    let form = dialog(container).querySelector("form");
    setVal(form.querySelector("input"), "@lin");
    submit(form);
    await waitFor(() => container.querySelector(".chead h2")?.textContent === "Lin Wei");
    const ta = container.querySelector(".composerbox textarea");
    setVal(ta, "ping");
    submit(container.querySelector(".composerbox"));
    await waitFor(() => [...container.querySelectorAll(".thread .msg.me")].some((m) => m.textContent.includes("ping")));
    expect(rail(container, "Lin Wei")).toBeTruthy();
  });

  it("labels a message with a reason, shows who labeled, and honours trusted labelers", async () => {
    vi.stubGlobal("fetch", demoFetch());
    const { container } = mountApp({ channel: "global" });
    await waitFor(() => container.querySelector(".folded"));
    const q = [...container.querySelectorAll(".msg")].find((m) => m.textContent.includes("feed order"));
    clickText(q, "button", "Label");
    let form = dialog(container).querySelector("form");
    const sel = form.querySelector("select");
    expect([...sel.options].map((o) => o.value)).toEqual(["spam", "nsfw", "misleading", "harassment"]);
    sel.value = "misleading";
    setVal(form.querySelector("textarea"), "no source");
    setVal(form.querySelector("input[type=number]"), "2");
    submit(form);
    expect(dialog(container).querySelector(".flash.err").textContent).toMatch(/between 0 and 1/);
    setVal(form.querySelector("input[type=number]"), "0.9");
    submit(form);
    await waitFor(() => !dialog(container));
    const labeled = [...container.querySelectorAll(".msg")].find((m) => m.textContent.includes("feed order"));
    expect(labeled.querySelector(".badge[data-label='misleading']")).not.toBeNull();
    expect(labeled.querySelector(".labelinfo").textContent).toBe("Labeled: Misleading by You (90%): no source");
    expect(container.querySelector(".folded")).not.toBeNull();

    // trust only myself: Sentinel's spam label no longer folds the post
    container.querySelector(".trustbtn").click();
    form = dialog(container).querySelector("form");
    const radios = form.querySelectorAll("input[type=radio]");
    radios[1].checked = true;
    form.querySelectorAll("input[type=checkbox]").forEach((b) => { b.checked = false; });
    submit(form);
    await waitFor(() => !container.querySelector(".folded"));
    expect(container.textContent).toContain("BUY NOW");
    expect(JSON.parse(localStorage.getItem("mesh-hangout:v1")).trusted).toEqual([]);
    expect(container.querySelector(".trustbtn").textContent).toBe("Labelers: 0 trusted");
  });

  it("labels a member and creates, joins and leaves a group", async () => {
    vi.stubGlobal("fetch", demoFetch());
    const { container } = mountApp({ channel: "following" });
    await waitFor(() => container.querySelector(".members .mrow"));
    const nova = [...container.querySelectorAll(".members .mrow")].find((r) => r.textContent.includes("Nova"));
    clickText(nova, "button", "Label");
    expect(dialog(container).querySelector("select").options.length).toBe(7);
    clickText(dialog(container), "button", "Close");

    clickText(container.querySelector(".list"), "button", "+ New");
    // two "+ New" buttons exist (DMs, Groups); the second one is for groups
    clickText(dialog(container), "button", "Close");
    const groupBtn = container.querySelectorAll(".list .sectbtn")[1];
    groupBtn.click();
    const form = dialog(container).querySelector("form");
    submit(form);
    expect(dialog(container).querySelector(".flash.err").textContent).toMatch(/group name/);
    setVal(form.querySelector("input"), "Builders");
    setVal(form.querySelector("textarea"), "Ship it");
    submit(form);
    await waitFor(() => container.querySelector(".chead h2")?.textContent === "Builders");
    expect(container.textContent).toContain("Group \"Builders\" created");
    expect(container.querySelector(".chead small").textContent).toContain("1 member");
    setVal(container.querySelector(".composerbox textarea"), "first in group");
    submit(container.querySelector(".composerbox"));
    await waitFor(() => container.querySelector(".thread .msg.me"));
    clickText(container.querySelector(".chead"), "button", "Leave");
    await waitFor(() => container.querySelector(".composerbox textarea").disabled);
    expect(container.querySelector(".composerbox textarea").placeholder).toMatch(/Join this group/);
    clickText(container.querySelector(".chead"), "button", "Join");
    await waitFor(() => !container.querySelector(".composerbox textarea").disabled);
  });
});

describe("the page, Connected mode", () => {
  it("v1.1: creates an identity with the exact registration and sign-in requests, then edits the profile", async () => {
    const node = fakeNode({ version: "1.1", takenHandles: ["taken"] });
    vi.stubGlobal("fetch", node.fetchImpl);
    const { container } = mountApp({ channel: "following" });
    await waitFor(() => container.querySelector(".status")?.dataset.mode === "connected");
    expect(container.querySelector(".acct").textContent).toContain("Create your identity");
    container.querySelector(".acct").click();
    let form = dialog(container).querySelector("form");
    setVal(form.querySelectorAll("input")[0], "taken");
    setVal(form.querySelectorAll("input")[1], "Taken Tom");
    submit(form);
    await waitFor(() => dialog(container).querySelector(".flash.err"));
    expect(node.calls.some((c) => c.method === "POST" && c.path === "/api/entities")).toBe(false);

    form = dialog(container).querySelector("form");
    setVal(form.querySelectorAll("input")[0], "ada");
    setVal(form.querySelectorAll("input")[1], "Ada L");
    form.querySelector("textarea").value = "first programmer";
    submit(form);
    await waitFor(() => dialog(container).textContent.includes("Welcome, Ada L"));
    const reg = node.calls.find((c) => c.method === "POST" && c.path === "/api/entities");
    expect(Object.keys(reg.body).sort()).toEqual(["encryption_key", "handle", "profile", "public_key"]);
    expect(reg.body.public_key).toMatch(/^[0-9a-f]{64}$/);
    expect(reg.body.encryption_key).toMatch(/^[0-9a-f]{64}$/);
    expect(reg.body).toMatchObject({ handle: "ada", profile: { name: "Ada L", agent: false, bio: "first programmer" } });
    const verify = node.calls.find((c) => c.path === "/api/auth/verify");
    expect(verify.body.signature).toMatch(/^[0-9a-f]{128}$/);
    expect(verify.body.challenge).toBe("ab".repeat(32));
    expect(JSON.parse(localStorage.getItem("mesh-hangout:v1")).tokens["http://localhost:12000"]).toBe("tok-1");

    // profile edit: PUT with the bare merged profile body and the token
    node.fetchImpl.mockImplementation(((orig) => async (url, init = {}) => {
      const u = new URL(url);
      if (init.method === "PUT") { node.calls.push({ method: "PUT", path: u.pathname, query: Object.fromEntries(u.searchParams), body: JSON.parse(init.body) }); return jsonRes({ status: "updated" }); }
      return orig(url, init);
    })(node.fetchImpl.getMockImplementation()));
    clickText(dialog(container), "button", "Edit profile");
    form = dialog(container).querySelector("form");
    setVal(form.querySelector("input"), "Ada Lovelace");
    submit(form);
    await waitFor(() => node.calls.some((c) => c.method === "PUT"));
    const put = node.calls.find((c) => c.method === "PUT");
    expect(put.path).toMatch(/^\/api\/entities\/ent%3A/);
    expect(put.query).toEqual({ token: "tok-1" });
    expect(put.body).toMatchObject({ name: "Ada Lovelace", agent: false, bio: "first programmer" });
  });

  it("v1.1: a handle taken only at registration keeps the key and offers a retry form", async () => {
    const node = fakeNode({ version: "2.0", takenHandles: ["ada"] });
    vi.stubGlobal("fetch", node.fetchImpl);
    const { container } = mountApp({ channel: "following" });
    await waitFor(() => container.querySelector(".status")?.dataset.mode === "connected");
    container.querySelector(".acct").click();
    let form = dialog(container).querySelector("form");
    setVal(form.querySelectorAll("input")[0], "ada");
    setVal(form.querySelectorAll("input")[1], "Ada");
    submit(form);
    await waitFor(() => dialog(container).textContent.includes("setup did not finish"));
    expect(dialog(container).textContent).toMatch(/@ada is already taken/);
    expect(JSON.parse(localStorage.getItem("mesh-hangout:v1")).identity.jwk.d).toBeTruthy();
    form = dialog(container).querySelector("form");
    expect(dialog(container).textContent).toContain("Register this identity");
    setVal(form.querySelectorAll("input")[0], "ada2");
    submit(form);
    await waitFor(() => dialog(container).textContent.includes("Registered and signed in"));
    const posts = node.calls.filter((c) => c.method === "POST" && c.path === "/api/entities");
    expect(posts.map((p) => p.body.handle)).toEqual(["ada", "ada2"]);
    expect(posts[0].body.public_key).toBe(posts[1].body.public_key);
  });

  it("v2.0: explains that profile editing is not supported and posts with media", async () => {
    const node = fakeNode({ version: "2.0" });
    const id = await generateIdentity();
    await node.fetchImpl("http://localhost:12000/api/entities", { method: "POST", body: JSON.stringify({ public_key: id.publicKeyHex, encryption_key: id.enc.publicKeyHex, handle: "vee", profile: { name: "Vee" } }) });
    node.calls.length = 0;
    const baseHandler = node.fetchImpl.getMockImplementation();
    node.fetchImpl.mockImplementation(async (url, init = {}) => {
      const u = new URL(url);
      if (u.pathname === "/api/content" && init.method === "POST") { node.calls.push({ method: "POST", path: u.pathname, query: Object.fromEntries(u.searchParams), body: JSON.parse(init.body) }); return jsonRes({ id: "new" }); }
      return baseHandler(url, init);
    });
    vi.stubGlobal("fetch", node.fetchImpl);
    const { container } = mountApp({ channel: "following", identity: { jwk: id.jwk, enc: id.enc.jwk, handle: "vee", name: "Vee", bio: "", agent: false } });
    await waitFor(() => container.querySelector(".acct")?.textContent.includes("signed in"));
    expect(container.querySelector(".list").textContent).not.toContain("Groups");
    setVal(container.querySelector(".composerbox textarea"), "v2 post");
    container.querySelector(".attachbtn").click();
    const mi = container.querySelector(".mediachips input");
    setVal(mi, "https://example.org/a.png");
    mi.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    submit(container.querySelector(".composerbox"));
    await waitFor(() => node.calls.some((c) => c.path === "/api/content" && c.method === "POST"));
    expect(node.calls.find((c) => c.path === "/api/content" && c.method === "POST")).toMatchObject({ query: { token: "tok-1" }, body: { author: id.entityId, kind: "post", body: "v2 post", media: ["https://example.org/a.png"], reply_to: null } });

    container.querySelector(".acct").click();
    await waitFor(() => dialog(container).textContent.includes("Registered on n1"));
    expect(dialog(container).textContent).toContain("Encryption key published");
    clickText(dialog(container), "button", "Edit profile");
    expect(dialog(container).textContent).toMatch(/no profile update endpoint/);
    expect(dialog(container).querySelector("form")).toBeNull();
  });

  it("v2.0: new message refuses a recipient with no encryption key", async () => {
    const node = fakeNode({ version: "2.0" });
    const id = await generateIdentity();
    const reg = (pk, enc, h) => node.fetchImpl("http://localhost:12000/api/entities", { method: "POST", body: JSON.stringify({ public_key: pk, encryption_key: enc, handle: h, profile: { name: h } }) });
    await reg(id.publicKeyHex, id.enc.publicKeyHex, "me");
    const bare = await generateIdentity({ encryption: false });
    await reg(bare.publicKeyHex, null, "bare");
    const keyed = await generateIdentity();
    await reg(keyed.publicKeyHex, keyed.enc.publicKeyHex, "keyed");
    vi.stubGlobal("fetch", node.fetchImpl);
    const { container } = mountApp({ channel: "following", identity: { jwk: id.jwk, enc: id.enc.jwk, handle: "me", name: "me", bio: "", agent: false } });
    await waitFor(() => container.querySelector(".acct")?.textContent.includes("signed in"));
    clickText(container.querySelector(".list"), "button", "+ New");
    const form = dialog(container).querySelector("form");
    expect(form.textContent).toMatch(/end-to-end encrypted/);
    setVal(form.querySelector("input"), bare.entityId);
    submit(form);
    await waitFor(() => dialog(container).querySelector(".flash.err"));
    expect(dialog(container).querySelector(".flash.err").textContent).toMatch(/has not published an encryption key/);
    setVal(form.querySelector("input"), "@keyed");
    submit(form);
    await waitFor(() => dialog(container).querySelector(".flash.err")?.textContent.includes("cannot look up handles"));
    setVal(form.querySelector("input"), keyed.entityId);
    submit(form);
    await waitFor(() => !dialog(container));
    expect(container.querySelector(".chead h2").textContent).toBe("keyed");
  });
});

// ── Node failures, the connection pill, and DMs a node cannot read back ───────────────────
describe("the page, node failures", () => {
  const INFO = { node_id: "node1", node_url: "http://localhost:12000", protocol_version: "1.1", features: [] };
  const post = { id: "c1", author: "ent:zed", author_handle: "zed", author_profile: { name: "Zed" }, body: "hello from zed", created_at: "2026-01-01T00:00:00", reply_count: 0 };
  /** A node whose health endpoint and global feed can be switched: `health` up/down, `feed` ok / "throw" (CORS-less 500) / "503". */
  function flaky() {
    const ctl = { health: true, feed: "ok", calls: [] };
    ctl.fetchImpl = vi.fn(async (url) => {
      const u = new URL(url);
      ctl.calls.push(u.pathname);
      if (!ctl.health) throw new TypeError("Failed to fetch");
      if (u.pathname === "/.well-known/mesh-node") return jsonRes(INFO);
      if (u.pathname === "/api/content") {
        if (ctl.feed === "throw") throw new TypeError("Failed to fetch");
        if (ctl.feed === "503") return jsonRes({}, 503);
        return jsonRes({ items: [post] });
      }
      if (u.pathname.startsWith("/api/entities/")) return jsonRes({ id: "ent:zed", kind: "user", handle: "zed", profile: { name: "Zed" } });
      return jsonRes({ detail: "nope" }, 404);
    });
    return ctl;
  }
  const noteText = (c) => [...c.querySelectorAll(".notice")].map((n) => n.textContent).join(" | ");

  it("tells a readable HTTP status, a node that is up but failing, and an unreachable node apart", async () => {
    const node = flaky();
    vi.stubGlobal("fetch", node.fetchImpl);
    node.feed = "503";
    const { container } = mountApp({ channel: "global" });
    await waitFor(() => container.querySelector(".notice.error"));
    expect(noteText(container)).toContain("The node answered 503");
    expect(container.querySelector(".status").dataset.mode).toBe("connected");

    // fetch throws (a CORS-less 500) but the info endpoint answers: the node is up
    node.feed = "throw";
    clickText(container, ".list .row", "Following");
    clickText(container, ".list .row", "Global feed");
    await waitFor(() => container.querySelector(".notice.error")?.textContent.includes("The node is up but could not load this view"));
    expect(container.querySelector(".notice.error").textContent).toContain("known node bug");
    expect(container.querySelector(".status").dataset.mode).toBe("connected");
    clickText(container.querySelector(".notice.error"), "button", "Docs");
    expect(container.textContent).toContain("About this implementation");
  });

  it("shows Disconnected with Retry node, keeps what is loaded, and returns to Connected", async () => {
    const node = flaky();
    vi.stubGlobal("fetch", node.fetchImpl);
    const { container } = mountApp({ channel: "global" });
    await waitFor(() => container.textContent.includes("hello from zed"));
    expect(container.querySelector(".status").textContent).toContain("Connected");

    node.health = false;
    clickText(container, ".list .row", "Following");
    clickText(container, ".list .row", "Global feed");
    await waitFor(() => container.querySelector(".status")?.dataset.mode === "disconnected");
    expect(container.querySelector(".status").textContent).toContain("Disconnected");
    expect(container.querySelector(".notice.warn").textContent).toContain("Cannot reach http://localhost:12000. Check that the node is running");

    // a failed retry stays Disconnected; a successful one reconnects
    clickText(container.querySelector(".notice.warn"), "button", "Retry node");
    await tick(30);
    expect(container.querySelector(".status").dataset.mode).toBe("disconnected");
    node.health = true;
    clickText(container.querySelector(".notice.warn"), "button", "Retry node");
    await waitFor(() => container.querySelector(".status")?.dataset.mode === "connected");
    await waitFor(() => container.textContent.includes("hello from zed"));
    expect(noteText(container)).not.toContain("Cannot reach");
  });

  it("keeps already-loaded messages on screen when a background refresh finds the node gone", async () => {
    const node = flaky();
    vi.stubGlobal("fetch", node.fetchImpl);
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    try {
      const { container: c2 } = mountApp({ channel: "global" });
      await waitFor(() => c2.textContent.includes("hello from zed"));
      node.health = false;
      vi.advanceTimersByTime(20_000);
      await waitFor(() => c2.querySelector(".status")?.dataset.mode === "disconnected");
      expect(c2.textContent).toContain("hello from zed");
    } finally { vi.useRealTimers(); }
  });

  it("replaces the Demo members with the node's members after Retry node", async () => {
    const node = flaky();
    node.health = false;
    vi.stubGlobal("fetch", node.fetchImpl);
    const { container } = mountApp({ channel: "global" });
    await waitFor(() => container.querySelector(".status")?.dataset.mode === "demo");
    await waitFor(() => container.querySelector(".members")?.textContent.includes("Atlas"));
    node.health = true;
    clickText(container.querySelector(".notice.warn"), "button", "Retry node");
    await waitFor(() => container.querySelector(".status")?.dataset.mode === "connected");
    await waitFor(() => container.querySelector(".members")?.textContent.includes("Zed"));
    const members = container.querySelector(".members").textContent;
    for (const demo of ["Ada", "Lin", "Atlas", "Nova", "Sentinel"]) expect(members).not.toContain(demo);
    expect(container.querySelector(".mhead .sub").textContent).toBe("1");
  });

  it("v1.1: shows a sent DM as Sent with a note, and keeps it when the thread cannot be read", async () => {
    const node = fakeNode({ version: "1.1" });
    const id = await generateIdentity();
    await node.fetchImpl("http://localhost:12000/api/entities", { method: "POST", body: JSON.stringify({ public_key: id.publicKeyHex, encryption_key: id.enc.publicKeyHex, handle: "me", profile: { name: "me" } }) });
    let sent = 0;
    const fetchImpl = vi.fn(async (url, init = {}) => {
      const u = new URL(url);
      if (decodeURIComponent(u.pathname) === "/api/messages/ent:zed" && (init.method || "GET") === "GET") throw new TypeError("Failed to fetch"); // CORS-less 500 on read
      if (u.pathname === "/api/messages" && init.method === "POST") { sent += 1; return jsonRes({ id: "m1", status: "sent" }); }
      return node.fetchImpl(url, init);
    });
    vi.stubGlobal("fetch", fetchImpl);
    const { container } = mountApp({ channel: "dm:ent:zed", identity: { jwk: id.jwk, enc: id.enc.jwk, handle: "me", name: "me", bio: "", agent: false } });
    await waitFor(() => container.querySelector(".acct")?.textContent.includes("signed in"));
    await waitFor(() => container.querySelector(".notice.error"));
    expect(container.querySelector(".notice.error").textContent).toContain("known node bug");

    const ta = container.querySelector("textarea");
    setVal(ta, "hi zed");
    container.querySelector(".composerbox").dispatchEvent(new Event("submit", { cancelable: true }));
    await waitFor(() => container.querySelector(".msg .badge.sent"));
    expect(sent).toBe(1);
    expect(container.querySelector(".thread").textContent).toContain("hi zed");
    await waitFor(() => container.textContent.includes("Replies cannot be loaded from this node right now"));
    expect(container.querySelector(".notice.error")).toBeNull();
    expect(container.querySelector(".thread").textContent).toContain("hi zed");
  });
});

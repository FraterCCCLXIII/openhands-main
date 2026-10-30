import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MeshClient, activate, attestationIdFor, bodyText, canonicalJson, contentIdV1, createDemoClient, ed25519Supported,
  entityIdFor, generateIdentity, hexToBytes, identityFromJwk, linkIdFor, normalizeContent, normalizeNodeUrl, parseTs,
  renderMarkdown, verifyObject, blobIdFor,
} from "./extension.js";

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (fn, ms = 1000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { if (fn()) return; } catch { /* retry */ } await tick(5); }
  throw new Error("waitFor timed out");
};

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

const jsonRes = (data, status = 200) => ({ ok: status < 200 || status >= 300 ? false : true, status, json: async () => data });

// Expected values below were produced by the Python reference (implementations/mesh/crypto.py:
// json.dumps(sort_keys=True, separators=(',', ':')) and the sha256-based id helpers).
describe("canonicalisation and ids match the Python reference", () => {
  const sample = { b: [1, null, true, "é \"\\\n\u0001\u007f😀"], a: { z: 0, y: "x" }, author: "ent:abc", reply_to: null, created_at: "2026-01-02T03:04:05.123456" };

  it("serialises like canonical_json", () => {
    expect(canonicalJson(sample)).toBe('{"a":{"y":"x","z":0},"author":"ent:abc","b":[1,null,true,"\\u00e9\\u2028\\"\\\\\\n\\u0001\\u007f\\ud83d\\ude00"],"created_at":"2026-01-02T03:04:05.123456","reply_to":null}');
  });

  it("derives content, entity, link and attestation ids", async () => {
    expect(await contentIdV1(sample)).toBe("bb72f74c7a60b6ad9d4b288b67f6a849fa9bd942b28518d3");
    expect(await entityIdFor(Uint8Array.from({ length: 32 }, (_, i) => i))).toBe("ent:630dcd2966c4336691125448bbb25b4f");
    expect(await linkIdFor("ent:a", "follow", "ent:b")).toBe("d32f5c8af786d260eac22d546c267361");
    expect(await attestationIdFor("ent:a", "ent:b", "spam")).toBe("7f7d506c35019b702a5fde12e88a23de");
  });
});

describe("Ed25519 identity", () => {
  it("signs challenges and objects that verify against the raw public key", async () => {
    expect(await ed25519Supported()).toBe(true);
    const id = await generateIdentity();
    expect(id.entityId).toMatch(/^ent:[0-9a-f]{32}$/);
    const challenge = "ab".repeat(32);
    const sig = await id.sign(challenge);
    expect(sig).toMatch(/^[0-9a-f]{128}$/);
    const key = await webcrypto.subtle.importKey("raw", hexToBytes(id.publicKeyHex), { name: "Ed25519" }, false, ["verify"]);
    expect(await webcrypto.subtle.verify({ name: "Ed25519" }, key, hexToBytes(sig), new TextEncoder().encode(challenge))).toBe(true);

    const signed = await id.signObject({ author: id.entityId, body: "hi", sig: "ignored" });
    expect(await verifyObject(signed, id.publicKeyHex)).toBe(true);
    expect(await verifyObject({ ...signed, body: "tampered" }, id.publicKeyHex)).toBe(false);
  });

  it("restores the same entity from the stored key", async () => {
    const id = await generateIdentity();
    const again = await identityFromJwk(JSON.parse(JSON.stringify(id.jwk)));
    expect(again.entityId).toBe(id.entityId);
  });

  it("reports unsupported when WebCrypto lacks Ed25519", async () => {
    vi.stubGlobal("crypto", { subtle: { generateKey: async () => { throw new Error("NotSupportedError"); } } });
    expect(await ed25519Supported()).toBe(false);
  });
});

describe("MeshClient against the documented API", () => {
  const node = (version, routes) => {
    const calls = [];
    const fetchImpl = vi.fn(async (url, init = {}) => {
      const u = new URL(url);
      calls.push({ method: init.method, path: u.pathname, query: Object.fromEntries(u.searchParams), body: init.body ? JSON.parse(init.body) : undefined });
      if (u.pathname === "/.well-known/mesh-node") return jsonRes({ node_id: "n1", node_url: "http://x", protocol_version: version, features: [] });
      const handler = routes[`${init.method} ${u.pathname}`];
      return handler ? handler(calls.at(-1)) : jsonRes({ detail: "Not found" }, 404);
    });
    return { fetchImpl, calls };
  };

  it("detects the node flavor from protocol_version", async () => {
    const a = new MeshClient("localhost:12000/", { fetch: node("1.1", {}).fetchImpl });
    expect((await a.info()).flavor).toBe("v1");
    expect(a.caps.globalFeed).toBe(true);
    const b = new MeshClient("http://localhost:12000", { fetch: node("2.0", {}).fetchImpl });
    expect((await b.info()).flavor).toBe("v2");
    expect(b.caps.globalFeed).toBe(false);
    expect(a.baseUrl).toBe("http://localhost:12000");
  });

  it("runs the challenge flow with a hex signature of the challenge text", async () => {
    const { fetchImpl, calls } = node("1.1", {
      "POST /api/auth/challenge": () => jsonRes({ challenge: "c0ffee", expires_at: "x" }),
      "POST /api/auth/verify": () => jsonRes({ token: "tok", expires_at: "y" }),
    });
    const id = await generateIdentity();
    const c = new MeshClient("http://n", { fetch: fetchImpl });
    await c.signIn(id);
    expect(calls[0].body).toEqual({ entity_id: id.entityId });
    expect(Object.keys(calls[1].body).sort()).toEqual(["challenge", "entity_id", "signature"]);
    expect(calls[1].body.challenge).toBe("c0ffee");
    expect(calls[1].body.signature).toBe(await id.sign("c0ffee"));
    expect(c.signedIn).toBe(true);
  });

  it("v1.1 posts, replies, feeds and follows with the token as a query parameter", async () => {
    const { fetchImpl, calls } = node("1.1", {
      "POST /api/content": () => jsonRes({ id: "c1" }),
      "GET /api/users/ent%3Ame/feed": () => jsonRes({ items: [{ id: "a", author: "ent:x", body: "one", created_at: "2026-01-01T00:00:00", moderation_labels: [{ id: "l", type: "spam", issuer: "ent:m", claim: {} }] }, { id: "b", author: "ent:x", body: "two", created_at: "2026-01-02T00:00:00" }] }),
      "POST /api/links": () => jsonRes({ id: "l1" }),
      "DELETE /api/links/d32f5c8af786d260eac22d546c267361": () => jsonRes({ status: "deleted" }),
    });
    const c = new MeshClient("http://n", { fetch: fetchImpl });
    await c.info();
    c.useSession("tok", "ent:me");
    await c.post("hello", { replyTo: "p1" });
    expect(calls.at(-1)).toMatchObject({ method: "POST", path: "/api/content", query: { token: "tok" }, body: { kind: "reply", body: "hello", reply_to: "p1", access: "public" } });
    const feed = await c.feedFollowing();
    expect(calls.at(-1).query).toMatchObject({ labels: "true" });
    expect(feed.map((m) => m.id)).toEqual(["b", "a"]); // server sends newest first; the thread shows oldest first
    expect(feed[1].labels).toHaveLength(1);
    await c.follow("ent:b");
    expect(calls.at(-1).body).toEqual({ target: "ent:b", kind: "follow", data: {} });
    const c2 = new MeshClient("http://n", { fetch: fetchImpl });
    c2.useSession("tok", "ent:a");
    await c2.info();
    await c2.unfollow("ent:b");
    expect(calls.at(-1)).toMatchObject({ method: "DELETE", path: "/api/links/d32f5c8af786d260eac22d546c267361" });
  });

  it("v2.0 uses /api/feed, post kind=post, DM and attestation payloads", async () => {
    const { fetchImpl, calls } = node("2.0", {
      "GET /api/feed": () => jsonRes({ items: [{ id: "a", author: "ent:x", author_handle: "x", author_name: "X", kind: "post", body: "root", reply_to: null, created_at: "2026-01-01T00:00:00" }, { id: "r", author: "ent:y", kind: "post", body: "re", reply_to: "a", created_at: "2026-01-01T00:01:00" }] }),
      "POST /api/content": () => jsonRes({ id: "c" }),
      "POST /api/dm": () => jsonRes({ id: "d", encrypted: true }),
      "POST /api/attestations": () => jsonRes({ id: "att" }),
      "GET /api/subjects/a/labels": () => jsonRes({ labels: [{ id: "1", issuer: "ent:m", subject: "a", type: "misleading", claim: {}, confidence: 0.9 }] }),
      "DELETE /api/links": () => jsonRes({ status: "deleted" }),
    });
    const c = new MeshClient("http://n", { fetch: fetchImpl });
    await c.info();
    c.useSession("tok", "ent:me");
    const feed = await c.feedFollowing();
    expect(calls.at(-1)).toMatchObject({ path: "/api/feed", query: { token: "tok", limit: "50" } });
    expect(feed).toHaveLength(2);
    expect((await c.replies("a")).map((m) => m.id)).toEqual(["r"]);
    await c.post("reply", { replyTo: "a" });
    expect(calls.at(-1).body).toEqual({ author: "ent:me", kind: "post", body: "reply", media: [], reply_to: "a" });
    await c.sendDm("ent:y", "psst");
    expect(calls.at(-1)).toMatchObject({ path: "/api/dm", body: { author: "ent:me", recipient: "ent:y", body: "psst" } });
    await c.attest("a", "spam", { reason: "x" });
    expect(calls.at(-1).body).toEqual({ subject: "a", type: "spam", claim: { reason: "x" }, evidence: null, confidence: 1.0 });
    expect((await c.labels(["a"])).get("a")[0].type).toBe("misleading");
    expect(calls.at(-1).query.viewer).toBe("ent:me");
    await c.unfollow("ent:y");
    expect(calls.at(-1)).toMatchObject({ method: "DELETE", path: "/api/links", query: { target: "ent:y", kind: "follow", token: "tok" } });
  });

  it("maps HTTP errors and network failures to MeshError", async () => {
    const c = new MeshClient("http://n", { fetch: async () => jsonRes({ detail: "Invalid or expired token" }, 401) });
    await expect(c.request("GET", "/x")).rejects.toMatchObject({ status: 401, message: "Invalid or expired token" });
    const down = new MeshClient("http://n", { fetch: async () => { throw new TypeError("fetch failed"); } });
    await expect(down.info()).rejects.toThrow(/Cannot reach/);
    await expect(new MeshClient("http://n", { fetch: node("1.1", {}).fetchImpl }).request("POST", "/p", { auth: true })).rejects.toMatchObject({ status: 401 });
  });
});

describe("normalisation", () => {
  it("handles naive server timestamps, object bodies and URLs", () => {
    expect(parseTs("2026-01-01T00:00:00").toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(bodyText({ text: "hi", recipient: "x" })).toBe("hi");
    expect(normalizeContent({ id: "1", author: "ent:a", body: "b", author_handle: "ada", author_profile: { name: "Ada" } }).authorName).toBe("Ada");
    expect(normalizeNodeUrl("localhost:12000/")).toBe("http://localhost:12000");
    expect(() => normalizeNodeUrl("ftp://x")).toThrow();
  });
});

describe("markdown", () => {
  it("renders formatting as DOM and never as HTML", () => {
    const md = renderMarkdown("**bold** `code` <img src=x onerror=alert(1)>\n\n- one\n- two\n\n```js\nlet a = 1\n```\n[bad](javascript:alert(1))");
    expect(md.querySelector("strong").textContent).toBe("bold");
    expect(md.querySelectorAll("li")).toHaveLength(2);
    expect(md.querySelector(".mdcode code").textContent).toBe("let a = 1");
    expect(md.querySelector("img")).toBeNull();
    expect(md.querySelector("a[href^='javascript']")).toBeNull();
    expect(md.textContent).toContain("<img");
  });
});

describe("demo mode", () => {
  it("serves the same interface from memory", async () => {
    const demo = createDemoClient();
    const feed = await demo.feedFollowing();
    expect(feed.length).toBeGreaterThan(2);
    const spam = (await demo.feedGlobal()).find((m) => /BUY NOW/.test(m.body));
    expect((await demo.labels([spam.id])).get(spam.id)[0].type).toBe("spam");
    await demo.post("a reply", { replyTo: spam.id });
    expect((await demo.replies(spam.id)).some((m) => m.body === "a reply")).toBe(true);
    await demo.unfollow((await demo.following())[0].id);
    expect(await demo.following()).toHaveLength(2);
    expect(blobIdFor("ent:ada")).toBe(blobIdFor("ent:ada"));
  });
});

describe("the page", () => {
  it("falls back to Demo when no node answers, shows data, badges, and the footer", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    const { container } = mountApp();
    await waitFor(() => container.querySelector(".status")?.dataset.mode === "demo");
    expect(container.querySelector(".status").textContent).toContain("Demo");
    expect(container.querySelector(".notice.warn").textContent).toContain("Cannot reach http://localhost:12000");
    await waitFor(() => container.querySelectorAll(".thread .msg").length > 0);
    expect(container.querySelector(".powered").textContent).toBe("Powered byKamijiandKosmos");
    expect(container.querySelector(".avatar svg[data-style='orb']")).not.toBeNull();
    expect([...container.querySelectorAll(".list .row .name")].map((n) => n.textContent)).toEqual(expect.arrayContaining(["Following", "Global feed"]));
    expect(container.querySelector(".members").textContent).toContain("Atlas");

    // The spam post in the Global feed is folded behind its moderation label until revealed.
    [...container.querySelectorAll(".list .row")].find((r) => r.textContent.includes("Global feed")).click();
    await waitFor(() => container.querySelector(".folded"));
    expect(container.querySelector(".badge[data-label='spam']")).not.toBeNull();
    container.querySelector(".folded button").click();
    expect(container.querySelector(".folded")).toBeNull();
    expect(container.textContent).toContain("BUY NOW");
  });

  it("sends a reply in Demo mode", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("down"); }));
    const { container } = mountApp({ channel: "global" });
    await waitFor(() => container.querySelectorAll(".thread .msg").length > 0);
    [...container.querySelectorAll(".acts button")].find((b) => b.textContent === "Reply").click();
    const ta = container.querySelector("textarea");
    ta.value = "hello **mesh**"; ta.dispatchEvent(new Event("input"));
    container.querySelector(".composerbox").dispatchEvent(new Event("submit", { cancelable: true }));
    await waitFor(() => [...container.querySelectorAll(".msg.me strong")].some((s) => s.textContent === "mesh") || container.querySelector(".msg.reply.me"));
    expect(container.textContent).toContain("hello");
  });

  it("shows Connected against a reachable node and read-only notice without an identity", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      const u = new URL(url);
      if (u.pathname === "/.well-known/mesh-node") return jsonRes({ node_id: "node1", node_url: "http://localhost:12000", protocol_version: "1.1", features: [] });
      if (u.pathname === "/api/content") return jsonRes({ items: [{ id: "c1", author: "ent:zed", author_handle: "zed", author_profile: { name: "Zed" }, body: "first **post**", created_at: "2026-01-01T00:00:00", reply_count: 0 }] });
      if (u.pathname.startsWith("/api/entities/")) return jsonRes({ id: "ent:zed", kind: "user", handle: "zed", profile: { name: "Zed" } });
      return jsonRes({ detail: "nope" }, 404);
    }));
    const { container } = mountApp({ channel: "global" });
    await waitFor(() => container.querySelector(".status")?.dataset.mode === "connected");
    expect(container.querySelector(".status").textContent).toContain("node1");
    await waitFor(() => container.querySelector(".thread .msg strong"));
    expect(container.querySelector(".thread .bubble strong").textContent).toBe("post");
    expect(container.querySelector(".notice.warn").textContent).toContain("Read-only");
    expect(container.querySelector("textarea").disabled).toBe(true);
  });

  it("says posting is read-only when the browser lacks Ed25519", async () => {
    vi.stubGlobal("crypto", { subtle: { generateKey: async () => { throw new Error("nope"); }, digest: webcrypto.subtle.digest.bind(webcrypto.subtle) } });
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      const u = new URL(url);
      if (u.pathname === "/.well-known/mesh-node") return jsonRes({ node_id: "node1", node_url: "x", protocol_version: "2.0", features: [] });
      return jsonRes({ items: [] });
    }));
    const { container } = mountApp({ channel: "following" });
    await waitFor(() => container.querySelector(".notice.warn")?.textContent.includes("read-only"));
    expect(container.querySelector(".notice.warn").textContent).toContain("Ed25519");
  });

  it("shows the welcome page first with the Powered by footer", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("down"); }));
    const { container } = mountApp({ welcomed: false });
    expect(container.querySelector(".welcome h1").textContent).toBe("Welcome to MESH");
    expect(container.querySelector(".welcome .powered b").textContent).toBe("Kamiji");
    container.querySelector(".wgo").click();
    expect(container.querySelector(".welcome")).toBeNull();
    expect(container.querySelector(".thread")).not.toBeNull();
  });

  it("replaces the welcome page when a channel is opened from the rail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("down"); }));
    const { container } = mountApp({ welcomed: false });
    [...container.querySelectorAll(".list .row")].find((b) => /Global feed/.test(b.textContent)).click();
    await waitFor(() => container.querySelector(".thread"));
    expect(container.querySelector(".welcome")).toBeNull();
    expect(container.querySelectorAll(".composerwrap")).toHaveLength(1);
  });
});

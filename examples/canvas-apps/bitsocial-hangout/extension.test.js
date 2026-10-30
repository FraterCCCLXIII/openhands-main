import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { activate, addressFromPublicKey, base58btcEncode, base64ToBytes, buildComment, cborEncode, createBitsocialApi, createRpcClient, decodeFrame, demoCommunities, demoDirectory, ed25519Supported, encodeRequest, extractPrivateKey, generateIdentity, identityFromPrivateKey, normalizeEntry, postsFromCommunity, relativeTime, renderMarkdown, repliesFromRaw, signPublication, validateCommunityAddress, validateComposer } from "./extension.js";

/** A scriptable WebSocket stand-in. `respond(method, params)` returns the result for a request. */
function fakeServer(respond = () => null) {
  const sockets = [];
  const factory = (url) => {
    const ws = {
      url, sent: [],
      send(data) {
        const msg = JSON.parse(data);
        ws.sent.push(msg);
        queueMicrotask(() => {
          const out = respond(msg.method, msg.params, ws);
          if (out instanceof Error) ws.onmessage({ data: JSON.stringify({ jsonrpc: "2.0", id: msg.id, error: { code: -32000, message: out.message } }) });
          else ws.onmessage({ data: JSON.stringify({ jsonrpc: "2.0", id: msg.id, result: out }) });
        });
      },
      close() { ws.onclose && ws.onclose(); },
      notify(subscription, event, result, method = "n") { ws.onmessage({ data: JSON.stringify({ jsonrpc: "2.0", method, params: { result, subscription, event } }) }); },
    };
    sockets.push(ws);
    queueMicrotask(() => ws.onopen && ws.onopen());
    return ws;
  };
  return { factory, sockets };
}
const unreachableFactory = () => { const ws = { send() {}, close() {} }; queueMicrotask(() => ws.onerror && ws.onerror(new Error("refused"))); return ws; };
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

function mountApp(opts = {}, saved, identity) {
  localStorage.clear();
  if (saved) localStorage.setItem("bitsocial-hangout:v1", JSON.stringify(saved));
  if (identity) localStorage.setItem("bitsocial-hangout:identity:v1", JSON.stringify(identity));
  let mountFn;
  activate({ apiVersion: "1", registerPage: (_id, fn) => { mountFn = fn; return () => {}; } }, opts);
  const container = document.createElement("div");
  document.body.append(container);
  return { container, dispose: mountFn({ container }) };
}
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("JSON-RPC framing", () => {
  it("encodes requests as JSON-RPC 2.0 with positional params", () => {
    expect(JSON.parse(encodeRequest("subplebbitsSubscribe", [], 7))).toEqual({ jsonrpc: "2.0", method: "subplebbitsSubscribe", params: [], id: 7 });
  });
  it("tells responses, notifications and junk apart", () => {
    expect(decodeFrame('{"jsonrpc":"2.0","id":3,"result":42}')).toEqual({ kind: "response", id: 3, result: 42 });
    expect(decodeFrame('{"jsonrpc":"2.0","id":3,"error":{"message":"no"}}').error.message).toBe("no");
    expect(decodeFrame('{"jsonrpc":"2.0","method":"x","params":{"subscription":9,"event":"update","result":{"a":1}}}')).toMatchObject({ kind: "notification", subscription: 9, event: "update", result: { a: 1 } });
    expect(decodeFrame("not json").kind).toBe("invalid");
  });
  it("sends numbered requests and resolves with the matching result", async () => {
    const server = fakeServer((m) => (m === "getComment" ? { content: "hi" } : null));
    const client = createRpcClient("ws://x", { socketFactory: server.factory });
    expect(await client.call("getComment", [{ cid: "Qm1" }])).toEqual({ content: "hi" });
    expect(server.sockets[0].sent[0]).toEqual({ jsonrpc: "2.0", method: "getComment", params: [{ cid: "Qm1" }], id: 1 });
  });
  it("rejects with the server's error message", async () => {
    const server = fakeServer(() => new Error("boom"));
    const client = createRpcClient("ws://x", { socketFactory: server.factory });
    await expect(client.call("getComment", [])).rejects.toThrow("boom");
  });
  it("reports an unreachable node with the URL in the text", async () => {
    const client = createRpcClient("ws://nope:1", { socketFactory: unreachableFactory });
    await expect(client.call("getComment", [])).rejects.toThrow(/Can't reach a Bitsocial node at ws:\/\/nope:1/);
  });
  it("delivers subscription notifications, including ones that arrive before the handler", async () => {
    const server = fakeServer((m) => (m === "subplebbitsSubscribe" ? 5 : true));
    const client = createRpcClient("ws://x", { socketFactory: server.factory });
    const api = createBitsocialApi(client);
    const seen = [];
    const pendingWatch = api.watchCommunityList((list) => seen.push(list));
    await tick();
    server.sockets[0].notify(5, "subplebbitschange", ["a.eth", "b.eth"]);
    const watch = await pendingWatch;
    expect(watch.id).toBe(5);
    server.sockets[0].notify(5, "subplebbitschange", ["a.eth"]);
    expect(seen.at(-1)).toEqual(["a.eth"]);
    await watch.stop();
    expect(server.sockets[0].sent.at(-1)).toMatchObject({ method: "unsubscribe", params: [5] });
  });
  it("uses the verified Plebbit method names and param shapes", async () => {
    const server = fakeServer(() => ({ comments: [] }));
    const api = createBitsocialApi(createRpcClient("ws://x", { socketFactory: server.factory }));
    await api.getSubplebbitPage("a.eth", "QmPage", 20);
    await api.getCommentPage("a.eth", "QmPost", "QmPage");
    await api.getComment("QmPost");
    const calls = server.sockets[0].sent.map((m) => [m.method, m.params]);
    expect(calls).toEqual([
      ["getSubplebbitPage", [{ cid: "QmPage", subplebbitAddress: "a.eth", type: "posts", pageMaxSize: 20 }]],
      ["getCommentPage", [{ cid: "QmPage", commentCid: "QmPost", subplebbitAddress: "a.eth", pageMaxSize: 50 }]],
      ["getComment", [{ cid: "QmPost" }]],
    ]);
  });
});

describe("Bitsocial data mapping", () => {
  const sub = { posts: { pages: { hot: { comments: [
    { comment: { author: { address: "12D3KooWabc123456789", displayName: "Ada" }, title: "T", content: "body", timestamp: 200 }, commentUpdate: { cid: "Qm2", replyCount: 1, upvoteCount: 3, replies: { pages: { best: { comments: [{ comment: { author: { address: "r.eth" }, content: "reply", timestamp: 300 }, commentUpdate: { cid: "Qm3", replies: { pages: { best: { comments: [{ comment: { author: { address: "z.eth" }, content: "deep", timestamp: 400 }, commentUpdate: { cid: "Qm4" } }] } } } } }] } } } } },
    { comment: { author: { address: "old.eth" }, content: "first", timestamp: 100 }, commentUpdate: { cid: "Qm1", removed: true } },
  ] } } } };
  it("turns community pages into oldest-first chat messages", () => {
    const posts = postsFromCommunity(sub);
    expect(posts.map((p) => p.cid)).toEqual(["Qm1", "Qm2"]);
    expect(posts[1]).toMatchObject({ title: "T", content: "body", replyCount: 1, upvotes: 3, timestamp: 200000 });
    expect(posts[1].author.name).toBe("Ada");
    expect(posts[0].content).toBe("_[removed]_");
  });
  it("flattens nested replies with depth", () => {
    const replies = repliesFromRaw(postsFromCommunity(sub)[1].repliesRaw);
    expect(replies.map((r) => [r.content, r.depth])).toEqual([["reply", 0], ["deep", 1]]);
  });
  it("shortens long author addresses and builds a reply comment", () => {
    expect(normalizeEntry({ author: { address: "12D3KooWabcdefghijkl" } }).author.name).toBe("12D3Ko…ijkl");
    expect(buildComment({ subplebbitAddress: "a.eth", authorAddress: "me", content: "yo", parentCid: "QmP", now: 5000 })).toEqual({ subplebbitAddress: "a.eth", author: { address: "me" }, timestamp: 5, content: "yo", protocolVersion: "1.0.0", parentCid: "QmP", postCid: "QmP" });
    expect(relativeTime(0, 3 * 3600 * 1000)).toBe("3h ago");
  });
});

describe("rendering and demo mode", () => {
  it("starts on the welcome page in demo mode with the footer and an RPC field", () => {
    const { container } = mountApp();
    expect(container.querySelector(".status").textContent).toBe("Demo mode");
    expect(container.querySelector("#bh-rpc-url").value).toBe("ws://localhost:9138");
    expect(container.querySelector(".powered").textContent).toContain("Powered by");
    expect(container.querySelector(".powered").textContent).toContain("Kosmos");
    expect(container.querySelectorAll(".side .row")).toHaveLength(demoCommunities().length);
  });
  it("opens a demo community, renders markdown, and posts into a thread", async () => {
    const { container } = mountApp({ socketFactory: unreachableFactory, autoConnect: false }, { welcomed: true, url: "ws://localhost:9138" });
    // saved + welcomed triggers a quiet connect; use an unreachable socket factory so we stay in demo
    container.querySelector('.row[data-address="bitsocial.eth"]').click();
    expect(container.querySelector(".head h2").textContent).toBe("# Bitsocial");
    expect(container.querySelector(".msg strong").textContent).toBe("Bitsocial");
    expect(container.querySelector(".members .mhead").textContent).toMatch(/^Members \(\d+\)$/);
    container.querySelector(".linkbtn").click();
    expect(container.querySelector(".head h2").textContent).toBe("Thread");
    const ta = container.querySelector("textarea");
    ta.value = "a **new** reply";
    container.querySelector(".composerbar .btn").click();
    await tick();
    const last = [...container.querySelectorAll(".msg")].at(-1);
    expect(last.querySelector("strong").textContent).toBe("new");
  });
  it("falls back to demo with readable text when the RPC is unreachable, and keeps the URL", async () => {
    const { container } = mountApp({ socketFactory: unreachableFactory });
    container.querySelector("#bh-rpc-url").value = "ws://10.0.0.9:9138";
    [...container.querySelectorAll(".card .btn")].find((b) => b.textContent === "Connect").click();
    await tick(20);
    expect(container.querySelector(".status").textContent).toBe("Demo mode");
    expect(container.querySelector('[role="alert"]').textContent).toContain("ws://10.0.0.9:9138");
    expect(JSON.parse(localStorage.getItem("bitsocial-hangout:v1")).url).toBe("ws://10.0.0.9:9138");
  });
  it("shows Connected and lists communities from the node", async () => {
    const server = fakeServer((m) => (m === "subplebbitsSubscribe" ? 1 : m === "subplebbitUpdateSubscribe" ? 2 : true));
    const { container } = mountApp({ socketFactory: server.factory });
    [...container.querySelectorAll(".card .btn")].find((b) => b.textContent === "Connect").click();
    await tick(20);
    server.sockets[0].notify(1, "subplebbitschange", ["music.eth"]);
    await tick(20);
    expect(container.querySelector(".status").textContent).toBe("Connected");
    expect(container.querySelector(".side .row").dataset.address).toBe("music.eth");
    server.sockets[0].notify(2, "update", { title: "Music", description: "Tunes", posts: { pages: { hot: { comments: [{ comment: { author: { address: "a.eth" }, content: "hello *world*", timestamp: 10 }, commentUpdate: { cid: "Qm9" } }] } } } });
    await tick(20);
    expect(container.querySelector(".head h2").textContent).toBe("# Music");
    expect(container.querySelector(".msg em").textContent).toBe("world");
  });
  it("renders markdown safely", () => {
    const md = renderMarkdown("[x](javascript:alert(1)) `c` <img src=x onerror=1>");
    expect(md.querySelector("a")).toBeNull();
    expect(md.querySelector("img")).toBeNull();
    expect(md.querySelector("code").textContent).toBe("c");
  });
});


// ─── Publishing, identity and creation flows ───────────────────────────────────────────────

// Generated by running the real plebbit-js 0.0.11 signer (src/signer/signatures.ts: signComment, signVote,
// signCommentEdit; verified with verifyCommentPubsubMessage / verifyVote / verifyCommentEdit) with this
// fixed key. Ed25519 signatures are deterministic, so our output must match byte for byte.
const VECTORS = {"privateKey": "BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc", "publicKey": "6kpsY+KcUgq+9VB7Ey7F+ZVHdq6+vnuSQh7qaRRG0iw", "address": "12D3KooWRawPbxPtP1eZaJpumGnyWX2DcUyd3RQnydr3eAto4Az7", "cases": {"post": {"input": {"timestamp": 1700000000, "protocolVersion": "1.0.0", "subplebbitAddress": "vectors.eth", "author": {"address": "12D3KooWRawPbxPtP1eZaJpumGnyWX2DcUyd3RQnydr3eAto4Az7", "displayName": "Zo\u00eb \u2713"}, "title": "Hello \u2713 world", "content": "Body **md**\nline2 \u00fcn\u00efcode \ud83d\ude00", "link": "https://example.com/a?b=1"}, "signature": "qS9s05GZWV3YOlHYZKggK8zLu9DEyLgogL3GM7FifvV1iFhTkUV2F6EwUaXpMabbtmq37FoWGal/b9whLa44Dw", "signedPropertyNames": ["content", "title", "link", "author", "subplebbitAddress", "protocolVersion", "timestamp"], "valid": true}, "reply": {"input": {"timestamp": 1700000000, "protocolVersion": "1.0.0", "subplebbitAddress": "vectors.eth", "author": {"address": "12D3KooWRawPbxPtP1eZaJpumGnyWX2DcUyd3RQnydr3eAto4Az7", "displayName": "Zo\u00eb \u2713"}, "content": "a reply", "parentCid": "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", "postCid": "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"}, "signature": "XDbZwUF0knlzNmikfegCJvgSpt9cmQwtlR9cqSU7Lrvyq0TDZGFLVX+ngj+DqUxFYUJVvxSwcYQ2ozr7khx7Bw", "signedPropertyNames": ["content", "parentCid", "postCid", "author", "subplebbitAddress", "protocolVersion", "timestamp"], "valid": true}, "vote": {"input": {"timestamp": 1700000000, "protocolVersion": "1.0.0", "subplebbitAddress": "vectors.eth", "author": {"address": "12D3KooWRawPbxPtP1eZaJpumGnyWX2DcUyd3RQnydr3eAto4Az7", "displayName": "Zo\u00eb \u2713"}, "commentCid": "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", "vote": -1}, "signature": "g4DMNxi47TdA+5wrutbUOygZpZusuPL2gqYFVwpvZuogqCiQ6KTOyni7FLUAwLpSaQsTklgEZJEetAfrIZf0BQ", "signedPropertyNames": ["author", "subplebbitAddress", "protocolVersion", "timestamp", "commentCid", "vote"], "valid": true}, "voteUp": {"input": {"timestamp": 1700000000, "protocolVersion": "1.0.0", "subplebbitAddress": "vectors.eth", "author": {"address": "12D3KooWRawPbxPtP1eZaJpumGnyWX2DcUyd3RQnydr3eAto4Az7", "displayName": "Zo\u00eb \u2713"}, "commentCid": "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", "vote": 1}, "signature": "C2RPb9OxZ2AYQvEzZ+tpV3PmWHI6Vst2rxYgLQRXZSn4CT5QlcsEapcrqiYSkJrQuk5RP0lZivd76BcYcl7ZAg", "signedPropertyNames": ["author", "subplebbitAddress", "protocolVersion", "timestamp", "commentCid", "vote"], "valid": null}, "edit": {"input": {"timestamp": 1700000000, "protocolVersion": "1.0.0", "subplebbitAddress": "vectors.eth", "author": {"address": "12D3KooWRawPbxPtP1eZaJpumGnyWX2DcUyd3RQnydr3eAto4Az7", "displayName": "Zo\u00eb \u2713"}, "commentCid": "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", "deleted": true, "reason": "oops"}, "signature": "K9jN+sdPaF16CWU6pROAAI8i1mQRW5LnKFHpXwKmkCoo66/7mjzfx3Ce8+0bNhtO9KqSyoj0vRcVUoW7HtchAw", "signedPropertyNames": ["author", "subplebbitAddress", "protocolVersion", "timestamp", "commentCid", "deleted", "reason"], "valid": true}, "vote0": {"input": {"timestamp": 1700000000, "protocolVersion": "1.0.0", "subplebbitAddress": "vectors.eth", "author": {"address": "12D3KooWRawPbxPtP1eZaJpumGnyWX2DcUyd3RQnydr3eAto4Az7", "displayName": "Zo\u00eb \u2713"}, "commentCid": "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", "vote": 0}, "signature": "yVpBWw8m1e5jBejj00dFpyQ7TeqDKNtl9EAWxEfJDVGH9VZbPmYgMbFeCX7ppmugLFctzAhVUSL4ULXJOl90Cw", "signedPropertyNames": ["author", "subplebbitAddress", "protocolVersion", "timestamp", "commentCid", "vote"], "valid": null}, "postNoName": {"input": {"timestamp": 1700000000, "protocolVersion": "1.0.0", "subplebbitAddress": "vectors.eth", "author": {"address": "12D3KooWRawPbxPtP1eZaJpumGnyWX2DcUyd3RQnydr3eAto4Az7"}, "content": "plain"}, "signature": "oEhFzwK7VhW5Wo0I9pLHUXPoc9k/mFsxuXl4ZRh+yhH2vECOIr0Jrgww9MnD7TZwHp2QTtbMFIFzHmr+phBxAg", "signedPropertyNames": ["content", "author", "subplebbitAddress", "protocolVersion", "timestamp"], "valid": true}, "editContent": {"input": {"timestamp": 1700000000, "protocolVersion": "1.0.0", "subplebbitAddress": "vectors.eth", "author": {"address": "12D3KooWRawPbxPtP1eZaJpumGnyWX2DcUyd3RQnydr3eAto4Az7", "displayName": "Zo\u00eb \u2713"}, "commentCid": "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", "content": "edited"}, "signature": "jzY13Ue+EYoHpFvHJ8keqmCuO7PxqTC8my4znamaXCCtatUniv/3JMvsWO1iitMGeYSpk1KfWC0e2x2ZIzDOBA", "signedPropertyNames": ["author", "subplebbitAddress", "protocolVersion", "timestamp", "commentCid", "content"], "valid": null}}};
const CID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
const KINDS = { post: "comment", reply: "comment", postNoName: "comment", vote: "vote", voteUp: "vote", vote0: "vote", edit: "commentEdit", editContent: "commentEdit" };
const IDENTITY = { type: "ed25519", privateKey: VECTORS.privateKey, publicKey: VECTORS.publicKey, address: VECTORS.address };
const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
async function waitFor(fn, ms = 1500) {
  const end = Date.now() + ms;
  for (;;) {
    let value;
    try { value = fn(); } catch { value = null; }
    if (value) return value;
    if (Date.now() > end) throw new Error(`waitFor timed out: ${fn}`);
    await tick(5);
  }
}
const btn = (scope, text) => [...scope.querySelectorAll("button")].find((b) => b.textContent === text);
const dialog = () => document.querySelector('[role="dialog"]');
const fill = (input, value) => { input.value = value; input.dispatchEvent(new Event("input", { bubbles: true })); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("signing is byte-identical to plebbit-js", () => {
  it("derives the same public key and Bitsocial address from the private key", async () => {
    const id = await identityFromPrivateKey(VECTORS.privateKey);
    expect(id).toMatchObject({ type: "ed25519", publicKey: VECTORS.publicKey, address: VECTORS.address, privateKey: VECTORS.privateKey });
    expect(addressFromPublicKey(base64ToBytes(VECTORS.publicKey))).toBe(VECTORS.address);
  });
  it.each(Object.keys(VECTORS.cases))("signs the %s case exactly like the real signer", async (name) => {
    const { input, signature, signedPropertyNames } = VECTORS.cases[name];
    const { author, ...rest } = input;
    const pub = await signPublication(KINDS[name], { ...rest, author: author.displayName ? { displayName: author.displayName } : {} }, IDENTITY);
    expect(pub.signature).toEqual({ signature, publicKey: VECTORS.publicKey, type: "ed25519", signedPropertyNames });
    expect(pub).toMatchObject(input);
    expect(pub.signer).toBeUndefined();
  });
  it("encodes CBOR like cborg: shortest integers, length-first sorted keys, utf-8 strings", () => {
    expect(hex(cborEncode({ bb: 1, a: 2, ab: 3 }))).toBe("a361610262616203626262" + "01");
    expect(hex(cborEncode([0, 23, 24, 255, 256, 65536, 4294967296, -1, true, false]))).toBe("8a00" + "17" + "1818" + "18ff" + "190100" + "1a00010000" + "1b0000000100000000" + "20" + "f5f4");
    expect(hex(cborEncode("é"))).toBe("62c3a9");
    expect(() => cborEncode(1.5)).toThrow(/whole numbers/);
    expect(() => cborEncode(undefined)).toThrow();
    expect(base58btcEncode(Uint8Array.of(0, 0, 1))).toBe("112");
  });
  it("refuses fields that are not part of the signed schema", async () => {
    await expect(signPublication("vote", { vote: 1, commentCid: CID, subplebbitAddress: "a.eth", extra: "x" }, IDENTITY)).rejects.toThrow(/unknown vote field/);
  });
  it("generates, round-trips, and reports unsupported browsers", async () => {
    const id = await generateIdentity();
    expect((await identityFromPrivateKey(id.privateKey)).address).toBe(id.address);
    expect(id.address).toMatch(/^12D3KooW/);
    vi.stubGlobal("crypto", {});
    expect(await ed25519Supported()).toBe(false);
    await expect(generateIdentity()).rejects.toThrow(/Ed25519/);
  });
  it("validates what people type", () => {
    expect(validateCommunityAddress(" Music.ETH ")).toEqual({ ok: true, address: "music.eth" });
    expect(validateCommunityAddress(VECTORS.address).ok).toBe(true);
    expect(validateCommunityAddress("not an address").ok).toBe(false);
    expect(validateCommunityAddress("").ok).toBe(false);
    expect(validateComposer({}).length).toBeGreaterThan(0);
    expect(validateComposer({ title: "t", link: "javascript:alert(1)" })).toMatch(/http/);
    expect(validateComposer({ title: "t", link: "https://x.org" })).toBe("");
    expect(validateComposer({ content: " ", isReply: true })).toMatch(/reply/);
    expect(extractPrivateKey(JSON.stringify({ signer: { privateKey: "abc" } }))).toBe("abc");
    expect(() => extractPrivateKey("{}")).toThrow(/No signer/);
  });
});

describe("identity dialog", () => {
  it("creates an identity, shows its address, keeps the key in this browser, and restores it on reload", async () => {
    const { container } = mountApp({ autoConnect: false }, { welcomed: true });
    container.querySelector(".idchip").click();
    expect(dialog().textContent).toContain("never sent to the node");
    btn(dialog(), "Create identity").click();
    await waitFor(() => dialog().querySelector(".idbox .mono"));
    const address = dialog().querySelector(".idbox .mono").textContent;
    expect(address).toMatch(/^12D3KooW/);
    const stored = JSON.parse(localStorage.getItem("bitsocial-hangout:identity:v1"));
    expect(stored.address).toBe(address);
    expect(base64ToBytes(stored.privateKey)).toHaveLength(32);
    expect(localStorage.getItem("bitsocial-hangout:v1")).not.toContain(stored.privateKey);
    document.body.replaceChildren();
    const again = mountApp({ autoConnect: false }, { welcomed: true }, stored);
    expect(again.container.querySelector(".idchip").textContent).toContain(address.slice(0, 6));
  });
  it("imports a private key, rejects bad ones, and exports on request", async () => {
    const { container } = mountApp({ autoConnect: false }, { welcomed: true });
    container.querySelector(".idchip").click();
    const box = dialog().querySelector("textarea");
    fill(box, "definitely not a key");
    btn(dialog(), "Import identity").click();
    await waitFor(() => dialog().querySelector(".errtext").textContent.length > 0);
    expect(dialog().querySelector(".errtext").textContent).toMatch(/not valid base64|not a valid private key/);
    fill(dialog().querySelector("textarea"), VECTORS.privateKey);
    btn(dialog(), "Import identity").click();
    await waitFor(() => dialog().querySelector(".idbox .mono"));
    expect(dialog().querySelector(".idbox .mono").textContent).toBe(VECTORS.address);
    expect(dialog().textContent).not.toContain(VECTORS.privateKey);
    btn(dialog(), "Show private key to export").click();
    expect([...dialog().querySelectorAll("textarea")].find((t) => t.readOnly).value).toBe(VECTORS.privateKey);
  });
  it("closes on Escape and says so clearly when the browser has no Ed25519", async () => {
    vi.stubGlobal("crypto", {});
    const { container } = mountApp({ autoConnect: false }, { welcomed: true });
    container.querySelector(".idchip").click();
    await waitFor(() => dialog().querySelector(".warn") && !dialog().querySelector(".warn").hidden);
    btn(dialog(), "Create identity").click();
    await waitFor(() => /Ed25519/.test(dialog().querySelector(".errtext").textContent));
    dialog().dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(dialog()).toBeNull();
  });
});

describe("demo mode, end to end and in memory", () => {
  const demo = () => mountApp({ autoConnect: false }, { welcomed: true });
  const composer = (c) => ({ title: c.querySelector('[aria-label="Post title"]'), link: c.querySelector('[aria-label="Post link"]'), text: c.querySelector('.composerbox textarea'), send: c.querySelector(".composerbar .btn"), err: c.querySelector(".composerbar .err") });

  it("validates, then publishes a post with title, link and markdown body", async () => {
    const { container } = demo();
    container.querySelector('.row[data-address="bitsocial.eth"]').click();
    const f = composer(container);
    f.send.click();
    expect(f.err.textContent).toMatch(/title, some text or a link/);
    fill(f.title, "Hello"); fill(f.link, "ftp://x");
    f.send.click();
    expect(f.err.textContent).toMatch(/http/);
    fill(f.link, "https://example.com/x"); fill(f.text, "some **bold** words");
    f.send.click();
    expect(f.send.disabled).toBe(true);
    expect(f.send.textContent).toBe("Sending…");
    await waitFor(() => !f.send.disabled);
    const posted = await waitFor(() => [...container.querySelectorAll(".msg")].find((m) => m.querySelector(".ptitle") && m.querySelector(".ptitle").textContent === "Hello"));
    expect(posted.querySelector("strong").textContent).toBe("bold");
    expect(posted.querySelector("a").getAttribute("href")).toBe("https://example.com/x");
    expect(f.title.value).toBe("");
    await waitFor(() => !posted.classList.contains("pending") || !container.querySelector(".msg.pending"));
  });
  it("replies to the post and to a reply, then votes, edits and deletes its own post", async () => {
    const { container } = demo();
    container.querySelector('.row[data-address="bitsocial.eth"]').click();
    container.querySelector(".linkbtn").click();
    const f = composer(container);
    fill(f.text, "first reply");
    f.send.click();
    await waitFor(() => container.querySelector(".msg.pending") === null && container.textContent.includes("first reply"));
    const reply = [...container.querySelectorAll(".msg")].find((m) => m.textContent.includes("Linus"));
    btn(reply, "Reply").click();
    expect(container.querySelector(".replychip").hidden).toBe(false);
    expect(container.querySelector(".replychip").textContent).toContain("Replying to Linus");
    fill(f.text, "nested reply");
    f.send.click();
    await waitFor(() => container.textContent.includes("nested reply") && container.querySelector(".replychip").hidden);
    const nested = [...container.querySelectorAll(".msg")].find((m) => m.textContent.includes("nested reply"));
    expect(nested.style.marginLeft).toBe("24px");
    // vote on the root post
    const root = container.querySelector(".msg");
    const up = root.querySelector('[aria-label="Upvote"]');
    up.click();
    const upNow = () => container.querySelector(".msg").querySelector('[aria-label="Upvote"]');
    await waitFor(() => upNow().getAttribute("aria-pressed") === "true" && !upNow().disabled);
    expect(container.querySelector(".msg output").textContent).toBe("43");
    expect(JSON.parse(localStorage.getItem("bitsocial-hangout:v1")).votes["Qm-demo-1"]).toBe(1);
    upNow().click();
    await waitFor(() => container.querySelector(".msg output").textContent === "42" && !upNow().disabled);
    // edit and delete my own reply
    const mine = [...container.querySelectorAll(".msg")].find((m) => m.textContent.includes("first reply"));
    btn(mine, "Edit").click();
    fill(dialog().querySelector("textarea"), "edited reply");
    btn(dialog(), "Save edit").click();
    await waitFor(() => dialog() === null);
    expect(container.textContent).toContain("edited reply");
    btn([...container.querySelectorAll(".msg")].find((m) => m.textContent.includes("edited reply")), "Delete").click();
    btn(dialog(), "Delete").click();
    await waitFor(() => dialog() === null);
    expect(container.textContent).toContain("[deleted]");
  });
  it("walks through a community challenge: wrong answer is rejected, right answer publishes", async () => {
    const { container } = demo();
    container.querySelector('.row[data-address="plebtoken.eth"]').click();
    const f = composer(container);
    fill(f.text, "anyone here?");
    f.send.click();
    await waitFor(() => dialog());
    expect(dialog().textContent).toContain("What is 2 + 3?");
    btn(dialog(), "Send answer").click();
    expect(dialog().querySelector(".errtext").textContent).toMatch(/Answer every challenge/);
    fill(dialog().querySelector("fieldset input"), "4");
    btn(dialog(), "Send answer").click();
    await waitFor(() => /Rejected/.test(dialog().querySelector(".errtext").textContent));
    btn(dialog(), "Close").click();
    expect(container.querySelector(".msg.failed .note").textContent).toMatch(/wrong/);
    fill(f.text, "anyone there?");
    f.send.click();
    await waitFor(() => dialog());
    fill(dialog().querySelector("fieldset input"), " 5 ");
    dialog().querySelector("fieldset input").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await waitFor(() => /Accepted/.test(dialog().querySelector(".oktext").textContent));
    btn(dialog(), "Close").click();
    expect([...container.querySelectorAll(".msg")].find((m) => m.textContent.includes("anyone there?") && !m.classList.contains("pending") && !m.classList.contains("failed"))).toBeTruthy();
  });
  it("creates a community in memory, lists it as yours, and edits its title and description", async () => {
    const { container } = demo();
    btn(container, "Create").click();
    btn(dialog(), "Create and start").click();
    await waitFor(() => /title or a description/.test(dialog().querySelector(".errtext").textContent) && btn(dialog(), "Create and start"));
    fill(dialog().querySelector("input"), "Gardening");
    fill(dialog().querySelector("textarea"), "Plants and soil");
    btn(dialog(), "Create and start").click();
    await waitFor(() => dialog() === null);
    expect(container.querySelector(".head h2").textContent).toBe("# Gardening");
    expect(container.querySelector('.row[aria-current="true"] .tag').textContent).toBe("yours");
    btn(container, "Yours").click();
    expect(dialog().textContent).toContain("Gardening");
    btn(dialog(), "Edit").click();
    const inputs = dialog().querySelectorAll(".ownrow input, .ownrow textarea");
    fill(inputs[0], "Gardens");
    fill(inputs[1], "Soil and seeds");
    btn(dialog(), "Save changes").click();
    await waitFor(() => /Saved/.test(dialog().querySelector(".oktext").textContent));
    expect(container.querySelector(".head h2").textContent).toBe("# Gardens");
    expect(container.querySelector(".head .desc").textContent).toBe("Soil and seeds");
    // posting in my own community works too
    dialog().dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    fill(composer(container).text, "first!");
    composer(container).send.click();
    await waitFor(() => container.textContent.includes("first!"));
  });
  it("joins by address with validation, persists the list, and leaves again", async () => {
    const { container } = demo();
    btn(container, "Join").click();
    const input = dialog().querySelector("input");
    fill(input, "not an address!");
    btn(dialog(), "Join").click();
    await waitFor(() => /is not a community address/.test(dialog().querySelector(".errtext").textContent));
    fill(input, "nowhere.eth");
    btn(dialog(), "Join").click();
    await waitFor(() => /Can't reach nowhere.eth in demo mode/.test(dialog().querySelector(".errtext").textContent));
    fill(input, "bitsocial.eth");
    btn(dialog(), "Join").click();
    await waitFor(() => /already have/.test(dialog().querySelector(".errtext").textContent));
    fill(input, "Music.eth");
    btn(dialog(), "Join").click();
    await waitFor(() => dialog() === null);
    expect(container.querySelector('.row[data-address="music.eth"]')).toBeTruthy();
    expect(container.querySelector(".head h2").textContent).toBe("# Music");
    expect(JSON.parse(localStorage.getItem("bitsocial-hangout:v1")).joinedDemo).toContain("music.eth");
    btn(container.querySelector(".head"), "Leave").click();
    expect(container.querySelector('.row[data-address="music.eth"]')).toBeNull();
    expect(JSON.parse(localStorage.getItem("bitsocial-hangout:v1")).joinedDemo).not.toContain("music.eth");
    expect(demoDirectory().map((c) => c.address)).toContain("music.eth");
  });
});

/** A node that answers the Plebbit RPC the way the real one does (ids for subscriptions, results otherwise). */
function scriptedNode(overrides = {}) {
  let next = 10;
  const returned = {};
  const server = fakeServer((method, params) => {
    let out;
    if (overrides[method]) out = overrides[method](params);
    else if (method === "subplebbitsSubscribe") out = 1;
    else if (/^(subplebbitUpdateSubscribe|publishComment|publishVote|publishCommentEdit|startSubplebbit)$/.test(method)) out = next++;
    else if (method === "createSubplebbit") out = { address: "12D3KooWNewCommunity" };
    else if (method === "editSubplebbit") out = {};
    else out = true;
    (returned[method] = returned[method] || []).push(out);
    return out;
  });
  const ws = () => server.sockets[0];
  return { ...server, ws, returned, calls: (m) => ws().sent.filter((x) => x.method === m) };
}
const postUpdate = (extra = {}) => ({ title: "Vectors", description: "Test community", posts: { pages: { hot: { comments: [{ comment: { author: { address: "12D3KooWsomeoneelse", displayName: "Ada" }, title: "A post", content: "hi", timestamp: 1699999000 }, commentUpdate: { cid: CID, replyCount: 0, upvoteCount: 2, downvoteCount: 1 } }] } } }, ...extra });

async function connectedApp({ identity = IDENTITY, name = "Zoë ✓", opts = {}, update = postUpdate() } = {}) {
  vi.spyOn(Date, "now").mockReturnValue(1700000000000);
  const node = scriptedNode();
  const app = mountApp({ socketFactory: node.factory, ...opts }, { welcomed: true, url: "ws://node:9138", name }, identity);
  await waitFor(() => node.sockets[0] && node.calls("subplebbitsSubscribe").length);
  node.ws().notify(1, "subplebbitschange", ["vectors.eth"]);
  await waitFor(() => node.calls("subplebbitUpdateSubscribe").length);
  node.ws().notify(node.returned.subplebbitUpdateSubscribe[0], "update", update);
  await waitFor(() => app.container.querySelector(".msg"));
  return { ...app, node };
}
const composerOf = (c) => ({ title: c.querySelector('[aria-label="Post title"]'), link: c.querySelector('[aria-label="Post link"]'), text: c.querySelector(".composerbox textarea"), send: c.querySelector(".composerbar .btn"), err: c.querySelector(".composerbar .err") });

describe("connected mode: exact RPC calls", () => {
  it("publishes a signed post with the exact publishComment params, then unsubscribes after verification", async () => {
    const { container, node } = await connectedApp();
    const f = composerOf(container);
    fill(f.title, "Hello ✓ world"); fill(f.link, "https://example.com/a?b=1"); fill(f.text, "Body **md**\nline2 ünïcode 😀");
    f.send.click();
    await waitFor(() => node.calls("publishComment").length);
    const v = VECTORS.cases.post;
    expect(node.calls("publishComment")[0].params).toEqual([{ comment: { ...v.input, signature: { signature: v.signature, publicKey: VECTORS.publicKey, type: "ed25519", signedPropertyNames: v.signedPropertyNames } } }]);
    expect(container.querySelector(".msg.pending")).toBeTruthy();
    const subId = node.returned.publishComment[0];
    node.ws().notify(subId, "challengeverification", { challengeSuccess: true, commentUpdate: { cid: "QmNewPost" } });
    await waitFor(() => container.querySelector(".msg.pending") === null);
    expect(container.querySelector('.msg[data-cid="QmNewPost"]')).toBeTruthy();
    await waitFor(() => node.calls("unsubscribe").some((c) => c.params[0] === subId));
  });
  it("replies with parentCid and postCid, signed like the reference reply", async () => {
    const { container, node } = await connectedApp();
    container.querySelector(".linkbtn").click();
    fill(composerOf(container).text, "a reply");
    composerOf(container).send.click();
    await waitFor(() => node.calls("publishComment").length);
    const v = VECTORS.cases.reply;
    expect(node.calls("publishComment")[0].params[0].comment).toEqual({ ...v.input, signature: { signature: v.signature, publicKey: VECTORS.publicKey, type: "ed25519", signedPropertyNames: v.signedPropertyNames } });
  });
  it("refuses to publish without an identity and opens the identity dialog instead", async () => {
    const { container, node } = await connectedApp({ identity: null });
    const f = composerOf(container);
    fill(f.text, "hello");
    f.send.click();
    expect(f.err.textContent).toMatch(/identity/);
    expect(dialog().textContent).toContain("Your identity");
    await sleep(20);
    expect(node.calls("publishComment")).toHaveLength(0);
    expect(f.text.value).toBe("hello");
  });
  it("shows a challenge, sends publishChallengeAnswers, and reports the verification result", async () => {
    const { container, node } = await connectedApp();
    fill(composerOf(container).text, "needs captcha");
    composerOf(container).send.click();
    await waitFor(() => node.calls("publishComment").length);
    const subId = node.returned.publishComment[0];
    node.ws().notify(subId, "challenge", { challenges: [{ challenge: "iVBORw0KGgo=", type: "image/png" }, { challenge: "2 + 2", type: "text/plain" }] });
    await waitFor(() => dialog());
    expect(dialog().querySelector("img").getAttribute("src")).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(dialog().textContent).toContain("2 + 2");
    const [a, b] = dialog().querySelectorAll("fieldset input");
    fill(a, "abc");
    btn(dialog(), "Send answer").click();
    expect(dialog().querySelector(".errtext").textContent).toMatch(/Answer every/);
    fill(b, "4");
    btn(dialog(), "Send answer").click();
    await waitFor(() => node.calls("publishChallengeAnswers").length);
    expect(node.calls("publishChallengeAnswers")[0].params).toEqual([subId, { challengeAnswers: ["abc", "4"] }]);
    node.ws().notify(subId, "challengeverification", { challengeSuccess: false, reason: "Wrong captcha", challengeErrors: { 0: "bad" } });
    await waitFor(() => /Rejected: Wrong captcha bad/.test(dialog().querySelector(".errtext").textContent));
    btn(dialog(), "Close").click();
    expect(container.querySelector(".msg.failed .note").textContent).toContain("Wrong captcha");
    btn(container.querySelector(".msg.failed"), "Dismiss").click();
    expect(container.querySelector(".msg.failed")).toBeNull();
  });
  it("treats closing a challenge without answering as a failed publish", async () => {
    const { container, node } = await connectedApp();
    fill(composerOf(container).text, "skip the challenge");
    composerOf(container).send.click();
    await waitFor(() => node.calls("publishComment").length);
    node.ws().notify(node.returned.publishComment[0], "challenge", { challenges: [{ challenge: "x", type: "text/plain" }] });
    await waitFor(() => dialog());
    btn(dialog(), "Cancel").click();
    await waitFor(() => container.querySelector(".msg.failed"));
    expect(container.querySelector(".msg.failed .note").textContent).toMatch(/not answered/);
  });
  it("votes with a signed publishVote and reverts when the community rejects it", async () => {
    const { container, node } = await connectedApp();
    const up = () => container.querySelector('.msg [aria-label="Upvote"]');
    up().click();
    await waitFor(() => node.calls("publishVote").length);
    const v = VECTORS.cases.voteUp;
    expect(node.calls("publishVote")[0].params).toEqual([{ vote: { ...v.input, signature: { signature: v.signature, publicKey: VECTORS.publicKey, type: "ed25519", signedPropertyNames: v.signedPropertyNames } } }]);
    expect(up().getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector(".msg output").textContent).toBe("2");
    node.ws().notify(node.returned.publishVote[0], "challengeverification", { challengeSuccess: false, reason: "Not allowed" });
    await waitFor(() => up().getAttribute("aria-pressed") === "false");
    expect(container.querySelector(".notice").textContent).toContain("Not allowed");
    expect(container.querySelector(".msg output").textContent).toBe("1");
    up().click();
    await waitFor(() => node.calls("publishVote").length === 2);
    up().click;
    node.ws().notify(node.returned.publishVote[1], "challengeverification", { challengeSuccess: true });
    await waitFor(() => !container.querySelector('.msg [aria-label="Downvote"]').disabled);
    container.querySelector('.msg [aria-label="Downvote"]').click();
    await waitFor(() => node.calls("publishVote").length === 3);
    expect(node.calls("publishVote")[2].params[0].vote.vote).toBe(-1);
  });
  it("edits and deletes only the author's own posts, signed with publishCommentEdit", async () => {
    const own = postUpdate({ posts: { pages: { hot: { comments: [{ comment: { author: { address: VECTORS.address, displayName: "Zoë ✓" }, title: "Mine", content: "original", timestamp: 1699999000 }, commentUpdate: { cid: CID } }] } } } });
    const { container, node } = await connectedApp({ update: own });
    expect(btn(container, "Edit")).toBeTruthy();
    btn(container, "Edit").click();
    fill(dialog().querySelector("textarea"), "edited");
    btn(dialog(), "Save edit").click();
    await waitFor(() => node.calls("publishCommentEdit").length);
    const v = VECTORS.cases.editContent;
    expect(node.calls("publishCommentEdit")[0].params).toEqual([{ commentEdit: { ...v.input, signature: { signature: v.signature, publicKey: VECTORS.publicKey, type: "ed25519", signedPropertyNames: v.signedPropertyNames } } }]);
    node.ws().notify(node.returned.publishCommentEdit[0], "challengeverification", { challengeSuccess: true });
    await waitFor(() => dialog() === null);
    expect(container.textContent).toContain("edited");
    btn(container, "Delete").click();
    btn(dialog(), "Delete").click();
    await waitFor(() => node.calls("publishCommentEdit").length === 2);
    const del = node.calls("publishCommentEdit")[1].params[0].commentEdit;
    expect(del).toMatchObject({ commentCid: CID, deleted: true, subplebbitAddress: "vectors.eth", author: { address: VECTORS.address } });
    // the signature verifies against the public key over the CBOR of the signed properties
    const picked = Object.fromEntries(del.signature.signedPropertyNames.map((k) => [k, del[k]]));
    const key = await webcrypto.subtle.importKey("raw", base64ToBytes(del.signature.publicKey), { name: "Ed25519" }, false, ["verify"]);
    expect(await webcrypto.subtle.verify({ name: "Ed25519" }, key, base64ToBytes(del.signature.signature), cborEncode(picked))).toBe(true);
    node.ws().notify(node.returned.publishCommentEdit[1], "challengeverification", { challengeSuccess: true });
    await waitFor(() => container.textContent.includes("[deleted]"));
  });
  it("doesn't offer edit or delete on other people's posts", async () => {
    const { container } = await connectedApp();
    expect(btn(container, "Edit")).toBeUndefined();
    expect(btn(container, "Delete")).toBeUndefined();
  });
});

describe("connected mode: communities", () => {
  it("creates, starts and names a community, then edits its title and description", async () => {
    const { container, node } = await connectedApp();
    btn(container, "Create").click();
    const [title, domain] = dialog().querySelectorAll("input");
    fill(title, "Gardening");
    fill(dialog().querySelector("textarea"), "Plants and soil");
    fill(domain, "not a name");
    btn(dialog(), "Create and start").click();
    await waitFor(() => /must look like/.test(dialog().querySelector(".errtext").textContent) && btn(dialog(), "Create and start"));
    fill(domain, "Garden.eth");
    btn(dialog(), "Create and start").click();
    await waitFor(() => node.calls("editSubplebbit").length);
    expect(node.calls("createSubplebbit")[0].params).toEqual([{ title: "Gardening", description: "Plants and soil" }]);
    expect(node.calls("startSubplebbit")[0].params).toEqual([{ address: "12D3KooWNewCommunity" }]);
    expect(node.calls("editSubplebbit")[0].params).toEqual(["12D3KooWNewCommunity", { address: "garden.eth" }]);
    await waitFor(() => node.calls("unsubscribe").some((c) => c.params[0] === node.returned.startSubplebbit[0]));
    await waitFor(() => container.querySelector('.row[data-address="garden.eth"] .tag'));
    node.ws().notify(1, "subplebbitschange", ["vectors.eth", "garden.eth"]);
    btn(container, "Yours").click();
    expect(dialog().textContent).toContain("Gardening");
    const row = [...dialog().querySelectorAll(".ownrow")].find((r) => r.textContent.includes("Gardening"));
    btn(row, "Start").click();
    await waitFor(() => node.calls("startSubplebbit").length === 2);
    expect(node.calls("startSubplebbit")[1].params).toEqual([{ address: "garden.eth" }]);
    btn(row, "Edit").click();
    const fields = row.querySelectorAll("input, textarea");
    fill(fields[0], "Gardens");
    fill(fields[1], "Seeds");
    btn(row, "Save changes").click();
    await waitFor(() => node.calls("editSubplebbit").length === 2);
    expect(node.calls("editSubplebbit")[1].params).toEqual(["garden.eth", { title: "Gardens", description: "Seeds" }]);
    await waitFor(() => /Saved/.test(row.querySelector(".oktext").textContent));
  });
  it("tells you when creating fails, and keeps the form", async () => {
    const node = scriptedNode({ createSubplebbit: () => new Error("ERR_NODE_BUSY") });
    const { container } = mountApp({ socketFactory: node.factory }, { welcomed: true, url: "ws://n" });
    await waitFor(() => node.sockets[0] && node.calls("subplebbitsSubscribe").length);
    btn(container, "Create").click();
    fill(dialog().querySelector("input"), "X");
    btn(dialog(), "Create and start").click();
    await waitFor(() => /ERR_NODE_BUSY/.test(dialog().querySelector(".errtext").textContent));
    expect(dialog().querySelector("input").disabled).toBe(false);
  });
  it("joins a remote community once it answers, remembers it, and leaves again", async () => {
    const { container, node } = await connectedApp({ opts: { joinTimeoutMs: 80 } });
    btn(container, "Join").click();
    const input = dialog().querySelector("input");
    fill(input, "bad address");
    btn(dialog(), "Join").click();
    await waitFor(() => /is not a community address/.test(dialog().querySelector(".errtext").textContent));
    expect(node.calls("subplebbitUpdateSubscribe")).toHaveLength(1);
    fill(input, "silent.eth");
    btn(dialog(), "Join").click();
    await waitFor(() => node.calls("subplebbitUpdateSubscribe").length === 2);
    expect(node.calls("subplebbitUpdateSubscribe")[1].params).toEqual([{ address: "silent.eth" }]);
    await waitFor(() => /Could not reach silent.eth/.test(dialog().querySelector(".errtext").textContent));
    expect(JSON.parse(localStorage.getItem("bitsocial-hangout:v1")).joined).toEqual([]);
    expect(container.querySelector('.row[data-address="silent.eth"]')).toBeNull();
    fill(input, "music.eth");
    btn(dialog(), "Join").click();
    await waitFor(() => node.calls("subplebbitUpdateSubscribe").length === 3);
    node.ws().notify(node.returned.subplebbitUpdateSubscribe[2], "update", { title: "Music", description: "Tunes", posts: { pages: {} } });
    await waitFor(() => dialog() === null);
    expect(container.querySelector('.row[data-address="music.eth"]')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("bitsocial-hangout:v1")).joined).toEqual(["music.eth"]);
    btn(container.querySelector(".head"), "Leave").click();
    expect(container.querySelector('.row[data-address="music.eth"]')).toBeNull();
    expect(JSON.parse(localStorage.getItem("bitsocial-hangout:v1")).joined).toEqual([]);
  });
  it("keeps joined communities across a reload and shows the node's own as yours", async () => {
    const node = scriptedNode();
    const { container } = mountApp({ socketFactory: node.factory }, { welcomed: true, url: "ws://n", joined: ["music.eth"] });
    await waitFor(() => node.sockets[0] && node.calls("subplebbitsSubscribe").length);
    node.ws().notify(1, "subplebbitschange", ["mine.eth"]);
    await waitFor(() => container.querySelectorAll(".side .row").length === 2);
    expect([...container.querySelectorAll(".side .row")].map((r) => r.dataset.address)).toEqual(["mine.eth", "music.eth"]);
    expect(container.querySelector('.side .row[data-address="mine.eth"] .tag')).toBeTruthy();
    expect(container.querySelector('.side .row[data-address="music.eth"] .tag')).toBeNull();
  });
});

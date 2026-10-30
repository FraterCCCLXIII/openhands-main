import { afterEach, describe, expect, it } from "vitest";
import { activate, buildComment, createBitsocialApi, createRpcClient, decodeFrame, demoCommunities, encodeRequest, normalizeEntry, postsFromCommunity, relativeTime, renderMarkdown, repliesFromRaw } from "./extension.js";

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

function mountApp(opts = {}, saved) {
  localStorage.clear();
  if (saved) localStorage.setItem("bitsocial-hangout:v1", JSON.stringify(saved));
  let mountFn;
  activate({ apiVersion: "1", registerPage: (_id, fn) => { mountFn = fn; return () => {}; } }, opts);
  const container = document.createElement("div");
  document.body.append(container);
  return { container, dispose: mountFn({ container }) };
}
afterEach(() => { document.body.replaceChildren(); });

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

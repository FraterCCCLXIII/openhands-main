/* Bitsocial Hangout — a Canvas App that looks and feels like Hangout / Team Chat, but talks
 * to the Bitsocial protocol (peer-to-peer social on IPFS pubsub, formerly Plebbit).
 *
 *   community  = channel      post  = thread root      reply = reply in the thread
 *
 * It speaks the Plebbit RPC (JSON-RPC 2.0 over WebSocket, default ws://localhost:9138, the
 * same one Bitsocial Node Manager and seedit use). With no reachable node it falls back to a
 * Demo mode with in-memory sample communities, so the page always works.
 *
 * Browser-only, dependency-free ESM. Styles are scoped under `.bh`; text is always set with
 * textContent. The RPC URL and a few preferences are kept in this browser's localStorage.
 */

const STORAGE_KEY = "bitsocial-hangout:v1";
export const DEFAULT_RPC_URL = "ws://localhost:9138";

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

// ─── JSON-RPC 2.0 over WebSocket (the Plebbit RPC wire protocol) ────────────────────────────
// Verified against plebbit-js 0.0.11 (seedit/node_modules/@plebbit/plebbit-js):
//  - requests are {jsonrpc:"2.0", method, params:[...], id}      (rpc-websockets client `call`)
//  - responses carry the same id with `result` or `error`
//  - subscriptions answer with a numeric subscription id; later events arrive as notifications
//    without an id: {jsonrpc:"2.0", method, params:{result, subscription, event}}

/** Encodes one JSON-RPC request frame. */
export function encodeRequest(method, params = [], id = 1) {
  return JSON.stringify({ jsonrpc: "2.0", method, params, id });
}

/** Classifies an incoming frame: a response (has id), a subscription notification, or junk. */
export function decodeFrame(raw) {
  let msg;
  try { msg = JSON.parse(typeof raw === "string" ? raw : String(raw)); } catch { return { kind: "invalid" }; }
  if (!isObject(msg)) return { kind: "invalid" };
  if (msg.id !== undefined && msg.id !== null) {
    if (msg.error) return { kind: "response", id: msg.id, error: msg.error };
    return { kind: "response", id: msg.id, result: msg.result };
  }
  const p = msg.params;
  if (isObject(p) && p.subscription !== undefined) return { kind: "notification", subscription: p.subscription, event: p.event, result: p.result, method: msg.method };
  return { kind: "invalid" };
}

const describeError = (err) => {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  return [err.code ? `${err.code}` : "", err.message || ""].filter(Boolean).join(": ") || "Unknown error";
};

/** A tiny JSON-RPC client over one WebSocket. `socketFactory(url)` is injectable for tests. */
export function createRpcClient(url, { socketFactory, timeoutMs = 15000 } = {}) {
  let socket = null;
  let nextId = 1;
  let openPromise = null;
  const pending = new Map(); // id -> { resolve, reject, timer }
  const handlers = new Map(); // subscription id -> fn(event, result)
  const buffered = new Map(); // notifications that arrived before the handler was set
  const stateListeners = new Set();
  let state = "closed"; // closed | connecting | open | failed
  const setState = (s) => { if (s === state) return; state = s; stateListeners.forEach((fn) => fn(s)); };

  const failAll = (error) => { pending.forEach(({ reject, timer }) => { clearTimeout(timer); reject(error); }); pending.clear(); };

  function onMessage(ev) {
    const frame = decodeFrame(ev && ev.data !== undefined ? ev.data : ev);
    if (frame.kind === "response") {
      const entry = pending.get(frame.id);
      if (!entry) return;
      pending.delete(frame.id);
      clearTimeout(entry.timer);
      if (frame.error) { const e = new Error(describeError(frame.error)); e.rpc = frame.error; entry.reject(e); } else entry.resolve(frame.result);
    } else if (frame.kind === "notification") {
      const fn = handlers.get(frame.subscription);
      if (fn) fn(frame.event, frame.result);
      else { const list = buffered.get(frame.subscription) || []; list.push(frame); buffered.set(frame.subscription, list); }
    }
  }

  function connect() {
    if (state === "open") return Promise.resolve();
    if (openPromise) return openPromise;
    setState("connecting");
    openPromise = new Promise((resolve, reject) => {
      const unreachable = (why) => {
        const e = new Error(`Can't reach a Bitsocial node at ${url}${why ? ` (${why})` : ""}. Start your node and check the URL.`);
        e.unreachable = true;
        return e;
      };
      let settled = false;
      try {
        socket = socketFactory ? socketFactory(url) : new WebSocket(url);
      } catch (err) {
        setState("failed");
        openPromise = null;
        reject(unreachable(err && err.message));
        return;
      }
      const timer = setTimeout(() => { if (!settled) { settled = true; setState("failed"); openPromise = null; try { socket.close(); } catch { /* ignore */ } reject(unreachable("timed out")); } }, timeoutMs);
      socket.onopen = () => { if (settled) return; settled = true; clearTimeout(timer); setState("open"); resolve(); };
      socket.onerror = () => { if (settled) return; settled = true; clearTimeout(timer); setState("failed"); openPromise = null; reject(unreachable("connection refused")); };
      socket.onclose = () => {
        clearTimeout(timer);
        if (!settled) { settled = true; setState("failed"); openPromise = null; reject(unreachable("closed")); return; }
        openPromise = null;
        setState("closed");
        failAll(new Error("The connection to the Bitsocial node closed."));
      };
      socket.onmessage = onMessage;
    });
    return openPromise;
  }

  async function call(method, params = []) {
    await connect();
    const id = nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`The node did not answer ${method} in time.`)); }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
      try { socket.send(encodeRequest(method, params, id)); } catch (err) { pending.delete(id); clearTimeout(timer); reject(err); }
    });
  }

  /** Registers a handler for a subscription id; replays notifications that arrived early. */
  function onSubscription(subscriptionId, fn) {
    handlers.set(subscriptionId, fn);
    const early = buffered.get(subscriptionId);
    if (early) { buffered.delete(subscriptionId); early.forEach((f) => fn(f.event, f.result)); }
    return () => handlers.delete(subscriptionId);
  }

  function close() {
    failAll(new Error("closed"));
    handlers.clear();
    buffered.clear();
    try { socket && socket.close(); } catch { /* ignore */ }
    openPromise = null;
    setState("closed");
  }

  return { url, connect, call, onSubscription, close, get state() { return state; }, onState: (fn) => { stateListeners.add(fn); return () => stateListeners.delete(fn); } };
}

// ─── Bitsocial / Plebbit calls on top of the RPC client ────────────────────────────────────
// Method names and param shapes come from plebbit-js (plebbit-rpc-client.ts, rpc/src/index.ts):
//   subplebbitsSubscribe []                         -> sub id; event "subplebbitschange" = [addresses]
//   subplebbitUpdateSubscribe [{address}]           -> sub id; event "update" = community JSON (posts.pages)
//   getSubplebbitPage [{cid, subplebbitAddress, type:"posts", pageMaxSize}] -> {comments:[{comment,commentUpdate}], nextCid}
//   getCommentPage [{cid, commentCid, subplebbitAddress, pageMaxSize}]      -> same page shape (replies)
//   getComment [{cid}]                              -> comment (ipfs)
//   publishComment [{comment}]                      -> sub id; events "challenge", "challengeverification", "error"
//   publishChallengeAnswers [subId, {challengeAnswers}] -> true
//   unsubscribe [subId]

export function createBitsocialApi(client) {
  const subscribe = async (method, params, onEvent) => {
    const id = await client.call(method, params);
    const off = client.onSubscription(id, onEvent);
    return { id, stop: async () => { off(); try { await client.call("unsubscribe", [id]); } catch { /* connection may be gone */ } } };
  };
  return {
    watchCommunityList: (onList) => subscribe("subplebbitsSubscribe", [], (event, result) => { if (event === "subplebbitschange" && Array.isArray(result)) onList(result); }),
    watchCommunity: (address, onUpdate, onError) => subscribe("subplebbitUpdateSubscribe", [{ address }], (event, result) => { if (event === "update") onUpdate(result); else if (event === "error" && onError) onError(result); }),
    getSubplebbitPage: (subplebbitAddress, cid, pageMaxSize = 50) => client.call("getSubplebbitPage", [{ cid, subplebbitAddress, type: "posts", pageMaxSize }]),
    getCommentPage: (subplebbitAddress, commentCid, cid, pageMaxSize = 50) => client.call("getCommentPage", [{ cid, commentCid, subplebbitAddress, pageMaxSize }]),
    getComment: (cid) => client.call("getComment", [{ cid }]),
    publishComment: (comment, onEvent) => subscribe("publishComment", [{ comment }], (event, result) => onEvent && onEvent(event, result)),
    answerChallenge: (subscriptionId, challengeAnswers) => client.call("publishChallengeAnswers", [subscriptionId, { challengeAnswers }]),
  };
}

// ─── Normalising Bitsocial data into chat messages ─────────────────────────────────────────

const authorOf = (comment) => {
  const a = (comment && comment.author) || {};
  const address = a.address || "unknown";
  return { address, name: a.displayName || (address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address) };
};

/** One page entry {comment, commentUpdate} (or a bare comment) to a chat message. */
export function normalizeEntry(entry) {
  const comment = (entry && entry.comment) || entry || {};
  const update = (entry && entry.commentUpdate) || {};
  const edit = update.edit || {};
  const removed = Boolean(update.removed) || Boolean(edit.deleted);
  return {
    cid: update.cid || comment.cid || "",
    author: authorOf(comment),
    title: comment.title || "",
    content: removed ? "_[removed]_" : edit.content || comment.content || "",
    link: comment.link || "",
    timestamp: (comment.timestamp || 0) * 1000,
    replyCount: update.replyCount || 0,
    upvotes: update.upvoteCount || 0,
    pinned: Boolean(update.pinned),
    repliesRaw: update.replies || null,
    replies: null,
  };
}

const sortPages = (pages) => {
  if (!isObject(pages)) return [];
  const order = ["hot", "new", "active", "best", "old"];
  const names = [...order.filter((n) => pages[n]), ...Object.keys(pages).filter((n) => !order.includes(n))];
  return names.length ? pages[names[0]].comments || [] : [];
};

/** The preloaded posts of a community update, as chat messages (oldest first). */
export function postsFromCommunity(sub) {
  const entries = sortPages(sub && sub.posts && sub.posts.pages);
  return entries.map(normalizeEntry).sort((a, b) => a.timestamp - b.timestamp);
}

/** Flattens preloaded replies (nested trees) to a list sorted oldest first. */
export function repliesFromRaw(raw) {
  const out = [];
  const walk = (entries, depth) => entries.forEach((e) => {
    const msg = { ...normalizeEntry(e), depth };
    out.push(msg);
    const nested = msg.repliesRaw && sortPages(msg.repliesRaw.pages);
    if (nested && nested.length) walk(nested, depth + 1);
  });
  walk(raw ? sortPages(raw.pages) : [], 0);
  return out.sort((a, b) => a.timestamp - b.timestamp);
}

/** An unsigned Bitsocial comment ready to hand to publishComment. */
export function buildComment({ subplebbitAddress, authorAddress, content, title = "", parentCid, postCid, now = Date.now() }) {
  const comment = { subplebbitAddress, author: { address: authorAddress }, timestamp: Math.floor(now / 1000), content, protocolVersion: "1.0.0" };
  if (title) comment.title = title;
  if (parentCid) { comment.parentCid = parentCid; comment.postCid = postCid || parentCid; }
  return comment;
}

// ─── Demo mode: in-memory sample communities ───────────────────────────────────────────────

const H = 3600 * 1000;
const mk = (cid, name, address, text, ago, extra = {}) => ({ cid, author: { address, name }, title: "", content: text, link: "", timestamp: 0, ago, replyCount: 0, upvotes: 0, pinned: false, replies: [], ...extra });

export function demoCommunities(now = Date.now()) {
  const list = [
    { address: "bitsocial.eth", title: "Bitsocial", description: "News, ideas and questions about the Bitsocial protocol.", posts: [
      mk("Qm-demo-1", "Esteban", "12D3KooWesteban", "Welcome to **Bitsocial**! Every community is run by its owner from their own node. No company in the middle.", 30 * H, { title: "Welcome to Bitsocial", pinned: true, upvotes: 42, replies: [
        mk("Qm-demo-1a", "Ada", "12D3KooWada", "Love that *anyone* can run a community from a laptop.", 29 * H),
        mk("Qm-demo-1b", "Linus", "12D3KooWlinus", "How do posts reach other people?\n\nThrough pubsub on IPFS, with the community node publishing signed updates.", 28 * H),
      ] }),
      mk("Qm-demo-2", "Grace", "12D3KooWgrace", "Tip: run the node manager and point apps at `ws://localhost:9138`.\n\n```sh\nbitsocial-node --rpc 9138\n```", 5 * H, { title: "Running your own node", upvotes: 17, replies: [mk("Qm-demo-2a", "Esteban", "12D3KooWesteban", "That is the same URL this app uses in Connected mode.", 4 * H)] }),
    ] },
    { address: "seedit.eth", title: "Seedit", description: "The Reddit-style client for Bitsocial communities.", posts: [
      mk("Qm-demo-3", "Margaret", "12D3KooWmargaret", "Seedit now supports **multiple accounts**.\n\n- Import an account\n- Export a backup\n- Switch in settings", 12 * H, { title: "Multiple accounts", upvotes: 9, replies: [mk("Qm-demo-3a", "Ada", "12D3KooWada", "Nice, importing was painless.", 11 * H)] }),
    ] },
    { address: "plebtoken.eth", title: "Plebs", description: "Casual chat for everyone.", posts: [
      mk("Qm-demo-4", "Linus", "12D3KooWlinus", "What are you building this weekend?", 2 * H, { title: "Weekend projects", upvotes: 3 }),
    ] },
  ];
  list.forEach((c) => c.posts.forEach((p) => { p.timestamp = now - p.ago; p.replies.forEach((r) => { r.timestamp = now - r.ago; r.depth = 0; }); p.replyCount = p.replies.length; }));
  return list;
}

// ─── Avatars: Kamiji-style orbs, tinted from the author address ────────────────────────────

const SVG_NS = "http://www.w3.org/2000/svg";

const BLOBS = [
  { id: "violet", fill: "#8B5CF6", path: "M32 6c14 0 24 10 24 24 0 16-11 28-24 28S8 46 8 30C8 16 18 6 32 6Z" },
  { id: "blue", fill: "#2D9CF0", path: "M32 4c9 14 22 22 22 36 0 11-10 20-22 20S10 51 10 40C10 26 23 18 32 4Z" },
  { id: "green", fill: "#2FBF71", path: "M18 18c4-8 12-8 14-2 3-6 12-6 15 2 7 1 12 9 8 17-3 7-10 9-16 8-6 4-14 4-19-2-7-3-9-12-5-18 0-2 1-4 3-5Z" },
  { id: "teal", fill: "#19B5A5", path: "M10 14c0-5 4-8 9-8h14c9 0 15 7 15 16s-6 14-14 14H21c-6 0-11-4-11-10Z" },
  { id: "brown", fill: "#8A5A3C", path: "M32 6c15 0 26 10 26 25S47 58 32 58 6 46 6 31 17 6 32 6Z" },
  { id: "orange", fill: "#F5760A", path: "M32 5c14 0 25 11 25 26 0 14-10 26-25 26S7 45 7 31C7 16 18 5 32 5Z" },
  { id: "red", fill: "#EF4444", path: "M12 22c0-8 6-14 14-14h12c8 0 14 6 14 14v10c0 8-6 14-14 14H26c-8 0-14-6-14-14Z" },
  { id: "pink", fill: "#EC4899", path: "M32 6 58 52H6Z" },
  { id: "indigo", fill: "#5B5BF0", path: "M14 12h36c3 0 6 3 6 6v28c0 3-3 6-6 6H14c-3 0-6-3-6-6V18c0-3 3-6 6-6Z" },
];


// Slightly different outlines for the orb, so a column of them does not look stamped.
const ORB_PATHS = [
  "M32 6C45 5 58 15 58 31C58 47 46 58 31 58C17 58 6 47 6 32C6 17 18 7 32 6Z",
  "M30 5C44 4 59 17 58 33C57 48 44 59 30 58C16 57 5 46 6 31C7 17 17 6 30 5Z",
  "M34 6C47 8 58 19 57 34C56 49 43 58 29 57C15 56 6 44 7 29C8 15 21 4 34 6Z",
];

/** The front-page orb as an avatar: one flat blob that wobbles, with two pill eyes that glance around and blink. */
function orbSvg(blob, index) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("data-style", "orb");
  const delay = `${-((index * 7 + 3) % 53) / 10}s`;
  const add = (parent, tag, attrs) => {
    const n = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v)));
    parent.append(n);
    return n;
  };
  const halo = add(svg, "circle", { cx: 32, cy: 33, r: 31, fill: blob.fill, opacity: 0.16 });
  halo.setAttribute("class", "orb-halo");
  const body = add(svg, "g", { class: "orb-body" });
  body.style.animationDelay = delay;
  add(body, "path", { d: ORB_PATHS[index % ORB_PATHS.length], fill: blob.fill });
  const look = add(body, "g", { class: "orb-look" });
  look.style.animationDelay = delay;
  const blink = add(look, "g", { class: "orb-blink" });
  blink.style.animationDelay = delay;
  [21, 36].forEach((x) => add(blink, "rect", { class: "pill-eye", x, y: 23, width: 7, height: 19, rx: 3.5, fill: "#1a0f33" }));
  return svg;
}

/** The avatar for an agent, tinted per agent: the wisp, a flat blob with two pill eyes. */
export function blobSvg(blobId) {
  const blob = BLOBS.find((b) => b.id === blobId) || BLOBS[0];
  return orbSvg(blob, BLOBS.indexOf(blob));
}


// ─── Markdown for messages: built as DOM, never as HTML (copied from Hangout) ─────

/** Agents sometimes reply with a JSON envelope like {"message": "...", "summary": "..."}; show the message. */
export function unwrapMessage(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return { body: String(raw || ""), note: "" };
  try {
    const data = JSON.parse(trimmed);
    if (isObject(data) && typeof data.message === "string") {
      const note = typeof data.summary === "string" ? data.summary : "";
      return { body: data.message, note };
    }
  } catch { /* not an envelope */ }
  return { body: String(raw || ""), note: "" };
}
const SAFE_URL = /^(https?:\/\/|mailto:)/i;
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*|__[^_\n]+__)|(~~[^~\n]+~~)|(\[[^\]\n]+\]\([^)\s]+\))|(\bhttps?:\/\/[^\s<>)]+[^\s<>).,;:!?])|(\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)/g;

/** Appends inline markdown (code, bold, italic, strike, links) to a parent, as text nodes and elements. */
export function renderInline(parent, source) {
  let last = 0;
  const textOf = (t) => document.createTextNode(t);
  for (const m of source.matchAll(INLINE)) {
    if (m.index > last) parent.append(textOf(source.slice(last, m.index)));
    const [whole] = m;
    if (m[1]) { const c = document.createElement("code"); c.textContent = whole.slice(1, -1); parent.append(c); }
    else if (m[2]) { const b = document.createElement("strong"); renderInline(b, whole.slice(2, -2)); parent.append(b); }
    else if (m[3]) { const d = document.createElement("del"); renderInline(d, whole.slice(2, -2)); parent.append(d); }
    else if (m[4]) {
      const [, label, url] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(whole);
      if (SAFE_URL.test(url)) { const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; renderInline(a, label); parent.append(a); }
      else parent.append(textOf(label));
    } else if (m[5]) { const a = document.createElement("a"); a.href = whole; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = whole; parent.append(a); }
    else { const i = document.createElement("em"); renderInline(i, whole.slice(1, -1)); parent.append(i); }
    last = m.index + whole.length;
  }
  if (last < source.length) parent.append(textOf(source.slice(last)));
}

const FENCE_OPEN = /^\s*```\s*([\w+#.-]*)\s*$/;
const BULLET = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

function codeBlock(lang, lines) {
  const wrap = document.createElement("div");
  wrap.className = "mdcode";
  const bar = document.createElement("div");
  bar.className = "mdcodebar";
  const label = document.createElement("span");
  label.textContent = lang || "text";
  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "Copy";
  copy.addEventListener("click", () => {
    navigator.clipboard?.writeText(lines.join("\n")).then(() => { copy.textContent = "Copied"; setTimeout(() => { copy.textContent = "Copy"; }, 1200); }).catch(() => {});
  });
  bar.append(label, copy);
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = lines.join("\n");
  pre.append(code);
  wrap.append(bar, pre);
  return wrap;
}

function listBlock(items) {
  // items: [{ indent, ordered, text }]; nested by indentation.
  const root = document.createElement(items[0].ordered ? "ol" : "ul");
  const stack = [{ indent: items[0].indent, list: root }];
  items.forEach((it) => {
    while (stack.length > 1 && it.indent < stack.at(-1).indent) stack.pop();
    let top = stack.at(-1);
    if (it.indent > top.indent) {
      const parentLi = top.list.lastElementChild;
      const sub = document.createElement(it.ordered ? "ol" : "ul");
      (parentLi || top.list).append(sub);
      top = { indent: it.indent, list: sub };
      stack.push(top);
    }
    const li = document.createElement("li");
    const task = /^\[([ xX])\]\s+(.*)$/.exec(it.text);
    if (task) {
      li.className = "mdtask";
      const box = document.createElement("input");
      box.type = "checkbox";
      box.disabled = true;
      box.checked = task[1].toLowerCase() === "x";
      li.append(box, document.createTextNode(" "));
      renderInline(li, task[2]);
    } else renderInline(li, it.text);
    top.list.append(li);
  });
  return root;
}

function tableBlock(rows) {
  const split = (line) => line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
  const table = document.createElement("table");
  const head = document.createElement("thead");
  const hr = document.createElement("tr");
  split(rows[0]).forEach((c) => { const th = document.createElement("th"); renderInline(th, c); hr.append(th); });
  head.append(hr);
  const body = document.createElement("tbody");
  rows.slice(2).forEach((line) => {
    const tr = document.createElement("tr");
    split(line).forEach((c) => { const td = document.createElement("td"); renderInline(td, c); tr.append(td); });
    body.append(tr);
  });
  table.append(head, body);
  const wrap = document.createElement("div");
  wrap.className = "mdtable";
  wrap.append(table);
  return wrap;
}

/** Renders markdown into a container element. Tolerates half-finished text, so it is safe to call as a reply streams in. */
export function renderMarkdown(source) {
  const root = document.createElement("div");
  root.className = "md";
  const { body, note } = unwrapMessage(source);
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  let para = [];
  const flush = () => {
    if (!para.length) return;
    const p = document.createElement("p");
    para.forEach((line, n) => { if (n) p.append(document.createElement("br")); renderInline(p, line); });
    root.append(p);
    para = [];
  };
  while (i < lines.length) {
    const line = lines[i];
    const open = FENCE_OPEN.exec(line);
    if (open) {
      flush();
      const code = [];
      i += 1;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { code.push(lines[i]); i += 1; }
      i += 1; // closing fence, or the end of a reply that is still streaming
      root.append(codeBlock(open[1], code));
      continue;
    }
    if (!line.trim()) { flush(); i += 1; continue; }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      const h = document.createElement(`h${Math.min(heading[1].length + 2, 6)}`);
      renderInline(h, heading[2]);
      root.append(h);
      i += 1;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); root.append(document.createElement("hr")); i += 1; continue; }
    if (/^\s*>/.test(line)) {
      flush();
      const quote = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { quote.push(lines[i].replace(/^\s*>\s?/, "")); i += 1; }
      const bq = document.createElement("blockquote");
      quote.forEach((q, n) => { if (n) bq.append(document.createElement("br")); renderInline(bq, q); });
      root.append(bq);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      flush();
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i]); i += 1; }
      root.append(tableBlock(rows));
      continue;
    }
    if (BULLET.test(line)) {
      flush();
      const items = [];
      while (i < lines.length && (BULLET.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        const b = BULLET.exec(lines[i]);
        if (b) items.push({ indent: b[1].length, ordered: /\d/.test(b[2]), text: b[3] });
        else items.at(-1).text += ` ${lines[i].trim()}`;
        i += 1;
      }
      root.append(listBlock(items));
      continue;
    }
    para.push(line);
    i += 1;
  }
  flush();
  if (note) { const n = document.createElement("p"); n.className = "mdnote"; n.textContent = note; root.append(n); }
  return root;
}

/** A one-line plain version/** A one-line plain version of a message, for the list preview. */
export function plainText(source) {
  const { body } = unwrapMessage(source);
  return body
    .replace(/```[\s\S]*?(```|$)/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/(\*\*|__|~~)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*([-*+]|\d+[.)])\s+(\[[ xX]\]\s+)?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}


const hashOf = (text) => { let h = 2166136261; for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/** The orb avatar for an author: colour and outline picked from their address. */
export function orbFor(address) {
  const h = hashOf(address);
  return orbSvg(BLOBS[h % BLOBS.length], h % 97);
}

export function relativeTime(ts, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const CSS = `
.bh { --bh-bg: var(--oh-color-base, #171717); --bh-panel: var(--oh-color-base-secondary, #212121); --bh-raised: var(--oh-surface-raised, #2a2a2a);
  --bh-text: var(--oh-foreground, #eee); --bh-contrast: var(--oh-contrast, #fff); --bh-muted: var(--oh-muted, #9a9a9a);
  --bh-border: var(--oh-border-subtle, #3a3a3a); --bh-primary: var(--oh-color-primary, #fff); --bh-on-primary: var(--oh-accent-foreground, #111);
  --bh-ok: var(--oh-success, #34d399); --bh-bad: #f87171;
  box-sizing: border-box; position: sticky; top: 0; color: var(--bh-text); background: var(--bh-bg); font: 14px/1.45 system-ui, sans-serif;
  height: 100dvh; max-height: 100dvh; min-height: 480px; overflow: hidden; }
.bh *, .bh *::before, .bh *::after { box-sizing: border-box; }
.bh button, .bh input, .bh textarea { font: inherit; color: inherit; }
.bh .shell { display: grid; grid-template-columns: 260px minmax(0, 1fr) 240px; height: 100%; min-height: 0; }
.bh .side, .bh .members { display: flex; flex-direction: column; min-height: 0; background: var(--bh-bg); }
.bh .side { border-right: 1px solid var(--bh-border); }
.bh .members { border-left: 1px solid var(--bh-border); }
.bh .brand { display: flex; align-items: center; gap: 12px; padding: 18px 18px 10px; }
.bh .brand h1 { margin: 0; font-size: 16px; font-weight: 600; color: var(--bh-contrast); }
.bh .status { display: inline-flex; align-items: center; gap: 6px; margin: 0 18px 6px; padding: 3px 10px; border: 1px solid var(--bh-border); border-radius: 999px; font-size: 12px; color: var(--bh-muted); align-self: flex-start; }
.bh .status::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--bh-muted); }
.bh .status[data-state="connected"]::before { background: var(--bh-ok); }
.bh .status[data-state="connecting"]::before { background: #f2b51d; }
.bh .status[data-state="demo"]::before { background: #8b5cf6; }
.bh .sectionlabel { padding: 14px 18px 6px; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--bh-muted); }
.bh .list { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 0 10px; display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; gap: 2px; }
.bh .row { display: flex; align-items: center; gap: 12px; width: 100%; min-width: 0; padding: 9px 10px; border: 0; border-radius: 10px; background: transparent; cursor: pointer; text-align: left; }
.bh .row:hover { background: var(--bh-panel); }
.bh .row[aria-current="true"] { background: var(--bh-raised); color: var(--bh-contrast); }
.bh .row .t { min-width: 0; flex: 1; display: grid; gap: 1px; }
.bh .row .t b { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bh .row .t b i { font-style: normal; color: var(--bh-muted); margin-right: 2px; }
.bh .row .t small { color: var(--bh-muted); font-size: 12px; line-height: 1.35; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bh .row[aria-current="true"] .t b i { color: var(--bh-contrast); }
.bh .avatar { flex: none; width: 36px; height: 36px; }
.bh .avatar svg { width: 100%; height: 100%; display: block; }
.bh .avatar.sm { width: 28px; height: 28px; }
.bh .avatar.lg { width: 96px; height: 96px; }
.bh .sidefoot { display: grid; gap: 8px; padding: 10px 12px 12px; border-top: 1px solid var(--bh-border); }
.bh .btn { border: 1px solid var(--bh-border); border-radius: 10px; background: var(--bh-panel); padding: 6px 12px; cursor: pointer; }
.bh .btn:hover { background: var(--bh-raised); }
.bh .btn.primary { background: var(--bh-primary); color: var(--bh-on-primary); border-color: transparent; }
.bh .btn:disabled { opacity: .5; cursor: default; }
.bh .powered { display: flex; align-items: center; gap: 6px; color: var(--bh-muted); font-size: 12px; }
.bh .powered b { color: var(--bh-text); font-weight: 600; }
.bh .poweredmark { width: 18px; height: 18px; display: inline-block; }
.bh .poweredmark svg { width: 100%; height: 100%; }
.bh .main { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.bh .head { flex: none; display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-bottom: 1px solid var(--bh-border); }
.bh .head h2 { margin: 0; font-size: 16px; font-weight: 600; color: var(--bh-contrast); }
.bh .head .desc { color: var(--bh-muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bh .body { flex: 1; min-height: 0; overflow: auto; }
.bh .msgs { padding: 16px 20px; display: grid; gap: 14px; align-content: start; }
.bh .msg { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 10px; }
.bh .msg .who { display: flex; align-items: baseline; gap: 8px; }
.bh .msg .who b { color: var(--bh-contrast); font-weight: 600; }
.bh .msg .who span { color: var(--bh-muted); font-size: 12px; }
.bh .msg .ptitle { font-weight: 650; color: var(--bh-contrast); margin: 1px 0 2px; }
.bh .msg .tag { font-size: 11px; padding: 0 6px; border: 1px solid var(--bh-border); border-radius: 6px; color: var(--bh-muted); }
.bh .msg.pending { opacity: .65; }
.bh .msg.failed .note { color: var(--bh-bad); }
.bh .msg .note { font-size: 12px; color: var(--bh-muted); }
.bh .linkbtn { border: 0; background: none; padding: 2px 0; color: var(--arco-accent, #7c9dff); cursor: pointer; font-size: 12px; }
.bh .linkbtn:hover { text-decoration: underline; }
.bh .empty { padding: 40px 20px; text-align: center; color: var(--bh-muted); }
.bh .composerwrap { flex: none; padding: 8px 16px 14px; }
.bh .composerbox { display: grid; gap: 6px; border: 1px solid var(--bh-border); border-radius: 18px; background: var(--bh-panel); padding: 8px 12px; }
.bh .composerbox:focus-within { border-color: var(--bh-muted); }
.bh .composerbox input, .bh .composerbox textarea { border: 0; outline: 0; background: transparent; resize: none; width: 100%; }
.bh .composerbox textarea { min-height: 38px; max-height: 160px; }
.bh .composerbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.bh .composerbar .err { color: var(--bh-bad); font-size: 12px; }
.bh .mhead { padding: 14px 14px 6px; font-weight: 600; color: var(--bh-contrast); }
.bh .mrow { display: flex; align-items: center; gap: 10px; padding: 5px 14px; }
.bh .mrow .t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bh .mrow small { color: var(--bh-muted); display: block; font-size: 11px; }
.bh .page { max-width: 560px; margin: 0 auto; padding: 36px 24px; display: grid; gap: 16px; justify-items: center; text-align: center; }
.bh .page h2 { margin: 0; font-size: 26px; font-weight: 500; color: var(--bh-contrast); }
.bh .page p { margin: 0; color: var(--bh-muted); }
.bh .card { width: 100%; display: grid; gap: 8px; padding: 14px; border: 1px solid var(--bh-border); border-radius: 14px; background: var(--bh-panel); text-align: left; }
.bh .card label { font-size: 12px; color: var(--bh-muted); }
.bh .card input { border: 1px solid var(--bh-border); border-radius: 10px; background: var(--bh-bg); padding: 7px 10px; width: 100%; }
.bh .card .actions { display: flex; flex-wrap: wrap; gap: 8px; }
.bh .card .errtext { color: var(--bh-bad); font-size: 13px; }
.bh .card .hint { color: var(--bh-muted); font-size: 12px; }
/* markdown + orb styles, copied from Hangout */
.bh .md { display: grid; gap: 8px; min-width: 0; line-height: 1.5; }
.bh .md > :first-child { margin-top: 0; }
.bh .md p, .bh .md ul, .bh .md ol, .bh .md blockquote, .bh .md h3, .bh .md h4, .bh .md h5, .bh .md h6, .bh .md hr { margin: 0; }
.bh .md h3 { font-size: 16px; font-weight: 650; color: var(--hg-contrast); }
.bh .md h4 { font-size: 15px; font-weight: 650; color: var(--hg-contrast); }
.bh .md h5, .bh .md h6 { font-size: 14px; font-weight: 650; color: var(--hg-contrast); }
.bh .md strong { font-weight: 650; color: var(--hg-contrast); }
.bh .md a { color: var(--arco-accent, #7c9dff); text-decoration: underline; text-underline-offset: 2px; }
.bh .md ul, .bh .md ol { padding-left: 22px; display: grid; gap: 3px; }
.bh .md li > ul, .bh .md li > ol { margin-top: 3px; }
.bh .md li.mdtask { list-style: none; margin-left: -20px; }
.bh .md li.mdtask input { margin-right: 4px; vertical-align: -1px; accent-color: var(--hg-primary); }
.bh .md blockquote { border-left: 3px solid var(--hg-border); padding: 2px 0 2px 12px; color: var(--hg-muted); }
.bh .md hr { border: 0; border-top: 1px solid var(--hg-border); }
.bh .md code { font: 12.5px ui-monospace, SF Mono, Menlo, monospace; background: rgba(255,255,255,.08); border-radius: 5px; padding: 1px 5px; overflow-wrap: anywhere; }
.bh .md .mdcode { border: 1px solid var(--hg-border); border-radius: 10px; overflow: hidden; background: #0e0e10; }
.bh .md .mdcodebar { display: flex; align-items: center; justify-content: space-between; padding: 4px 10px; font-size: 11px; color: var(--hg-muted); border-bottom: 1px solid var(--hg-border); background: rgba(255,255,255,.03); }
.bh .md .mdcodebar button { border: 0; background: transparent; color: var(--hg-muted); cursor: pointer; font-size: 11px; }
.bh .md .mdcodebar button:hover { color: var(--hg-contrast); }
.bh .md pre { margin: 0; padding: 10px 12px; overflow-x: auto; font: 12.5px/1.55 ui-monospace, SF Mono, Menlo, monospace; }
.bh .md pre code { background: none; padding: 0; border-radius: 0; overflow-wrap: normal; }
.bh .md .mdtable { overflow-x: auto; border: 1px solid var(--hg-border); border-radius: 10px; }
.bh .md table { border-collapse: collapse; width: 100%; font-size: 13px; }
.bh .md th, .bh .md td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--hg-border); }
.bh .md th { color: var(--hg-contrast); background: rgba(255,255,255,.03); font-weight: 600; }
.bh .md tr:last-child td { border-bottom: 0; }
.bh .md .mdnote.bh .md .mdnote { font-size: 12px; color: var(--hg-muted); border-top: 1px solid var(--hg-border); padding-top: 6px; }
.bh .orb-body { transform-box: view-box; transform-origin: 32px 34px; animation: bhOrb 5s ease-in-out infinite alternate; }
.bh .orb-look { animation: bhLook 8s ease-in-out infinite; }
.bh .orb-blink { transform-box: view-box; transform-origin: 32px 33px; animation: bhBlink 6s infinite; }
@keyframes bhOrb { 0% { transform: scale(1, 1) rotate(0deg); } 100% { transform: scale(1.05, .95) rotate(-3deg); } }
@keyframes bhLook { 0%, 38% { transform: translateX(0); } 46%, 66% { transform: translateX(3px); } 76%, 92% { transform: translateX(-3px); } 100% { transform: translateX(0); } }
@keyframes bhBlink { 0%, 91%, 100% { transform: scaleY(1); } 94% { transform: scaleY(.1); } }
@media (prefers-reduced-motion: reduce) { .bh .orb-body, .bh .orb-look, .bh .orb-blink { animation: none; } }
@media (max-width: 900px) { .bh .shell { grid-template-columns: 220px minmax(0, 1fr); } .bh .members { display: none; } }
@media (max-width: 600px) { .bh .shell { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); } .bh .side { border-right: 0; border-bottom: 1px solid var(--bh-border); max-height: 38vh; } }
`;

function el(tag, cls, content) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (content !== undefined) node.textContent = content;
  return node;
}

function avatar(address, size) {
  const wrap = el("span", `avatar${size ? ` ${size}` : ""}`);
  wrap.append(orbFor(address));
  return wrap;
}

export function activate(host, options = {}) {
  if (host.apiVersion !== "1") throw new Error("Bitsocial Hangout requires Canvas host API 1.");
  return host.registerPage("bitsocial-hangout", ({ container }) => mount(container, options));
}

function mount(container, options) {
  container.append(el("style", "", CSS));
  const root = el("div", "bh");
  container.append(root);
  let disposed = false;

  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } })();
  const state = {
    url: typeof saved.url === "string" && saved.url ? saved.url : DEFAULT_RPC_URL,
    name: saved.name || "You",
    address: saved.address || "you.eth",
    welcomed: Boolean(saved.welcomed),
    view: saved.welcomed ? "chat" : "welcome", // welcome | chat | settings
    status: "demo", // demo | connecting | connected
    error: "",
    communities: demoCommunities(),
    selected: "",
    thread: "",
    draftTitle: "",
    sendError: "",
  };
  state.selected = state.communities[0].address;
  const persist = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ url: state.url, name: state.name, address: state.address, welcomed: state.welcomed })); } catch { /* storage unavailable */ } };

  let client = null;
  let api = null;
  let listWatch = null;
  let communityWatch = null;

  const community = () => state.communities.find((c) => c.address === state.selected);
  const post = () => { const c = community(); return c && c.posts.find((p) => p.cid === state.thread); };

  // ─── connection ───────────────────────────────────────────────────────────────────────
  async function stopLive() {
    const watches = [listWatch, communityWatch].filter(Boolean);
    listWatch = null; communityWatch = null;
    await Promise.all(watches.map((w) => w.stop().catch(() => {})));
    if (client) { client.close(); client = null; api = null; }
  }

  function useDemo(error = "") {
    state.status = "demo";
    state.error = error;
    state.communities = demoCommunities();
    state.selected = state.communities[0].address;
    state.thread = "";
  }

  async function connect(url, manual = false) {
    state.url = url.trim() || DEFAULT_RPC_URL;
    persist();
    await stopLive();
    state.status = "connecting";
    state.error = "";
    renderChrome();
    try {
      client = createRpcClient(state.url, options.socketFactory ? { socketFactory: options.socketFactory } : {});
      api = createBitsocialApi(client);
      await client.connect();
      state.communities = [];
      state.status = "connected";
      state.thread = "";
      listWatch = await api.watchCommunityList((addresses) => {
        if (disposed) return;
        const known = new Map(state.communities.map((c) => [c.address, c]));
        state.communities = addresses.map((a) => known.get(a) || { address: a, title: a, description: "", posts: [], loaded: false });
        if (!state.communities.some((c) => c.address === state.selected)) { state.selected = state.communities[0] ? state.communities[0].address : ""; state.thread = ""; watchSelected(); }
        render();
      });
      client.onState((s) => { if (s === "closed" && state.status === "connected" && !disposed) { useDemo("The node closed the connection. Showing demo data."); render(); } });
    } catch (err) {
      await stopLive();
      useDemo(err && err.message ? err.message : "Could not reach the node.");
      if (manual) state.view = "settings";
    }
    if (state.status === "connected") { state.view = "chat"; watchSelected(); }
    render();
  }

  async function watchSelected() {
    if (communityWatch) { await communityWatch.stop().catch(() => {}); communityWatch = null; }
    const c = community();
    if (!api || state.status !== "connected" || !c) return;
    try {
      communityWatch = await api.watchCommunity(c.address, (sub) => {
        if (disposed) return;
        c.title = (sub && sub.title) || c.address;
        c.description = (sub && sub.description) || "";
        const fetched = postsFromCommunity(sub);
        const pendingLocal = c.posts.filter((p) => p.pending || p.failed);
        c.posts = [...fetched, ...pendingLocal];
        c.loaded = true;
        render();
      }, (e) => { state.error = `Community ${c.address}: ${describeError(e)}`; render(); });
    } catch (err) {
      state.error = err && err.message ? err.message : String(err);
      render();
    }
  }

  async function loadReplies(p) {
    const c = community();
    if (!p || p.replies || !c) return;
    p.replies = repliesFromRaw(p.repliesRaw);
    if (!p.replies.length && p.replyCount && api && p.repliesRaw && p.repliesRaw.pageCids) {
      const cid = Object.values(p.repliesRaw.pageCids)[0];
      try {
        const page = await api.getCommentPage(c.address, p.cid, cid);
        p.replies = (page.comments || []).map((e) => ({ ...normalizeEntry(e), depth: 0 })).sort((a, b) => a.timestamp - b.timestamp);
      } catch (err) { state.error = `Could not load replies: ${describeError(err)}`; }
      render();
    }
  }

  // ─── sending ──────────────────────────────────────────────────────────────────────────
  async function send(text, title) {
    const c = community();
    if (!c || !text.trim()) return;
    const parent = post();
    const msg = { cid: `local-${Date.now()}`, author: { address: state.address, name: state.name }, title: parent ? "" : title.trim(), content: text, link: "", timestamp: Date.now(), replyCount: 0, upvotes: 0, pinned: false, replies: parent ? null : [], depth: 0 };
    if (state.status === "connected" && api) {
      msg.pending = true;
      (parent ? (parent.replies = parent.replies || []) : c.posts).push(msg);
      render();
      const comment = buildComment({ subplebbitAddress: c.address, authorAddress: state.address, content: text, title: msg.title, parentCid: parent && parent.cid, postCid: parent && parent.cid });
      try {
        await api.publishComment(comment, (event, result) => {
          if (event === "challengeverification") {
            msg.pending = false;
            if (result && result.challengeSuccess === false) { msg.failed = true; msg.note = `The community rejected it${result.reason ? `: ${result.reason}` : "."}`; }
            render();
          } else if (event === "challenge") {
            msg.note = "This community asks for a challenge (for example a captcha). Answer it in a full client such as seedit.";
            render();
          } else if (event === "error") {
            msg.pending = false; msg.failed = true; msg.note = describeError(result);
            render();
          }
        });
      } catch (err) {
        msg.pending = false; msg.failed = true; msg.note = `Your node did not accept the post: ${err && err.message ? err.message : err}`;
        render();
      }
      return;
    }
    // Demo mode: purely in memory.
    if (parent) { parent.replies = parent.replies || []; parent.replies.push(msg); parent.replyCount = parent.replies.length; } else c.posts.push(msg);
    render();
  }

  // ─── view ─────────────────────────────────────────────────────────────────────────────
  const side = el("aside", "side");
  const main = el("section", "main");
  const members = el("aside", "members");
  const shell = el("div", "shell");
  shell.append(side, main, members);
  root.append(shell);

  const head = el("div", "head");
  const body = el("div", "body");
  const composerWrap = el("div", "composerwrap");
  main.append(head, body, composerWrap);

  const titleInput = el("input");
  titleInput.placeholder = "Title (optional)";
  titleInput.setAttribute("aria-label", "Post title");
  const textarea = el("textarea");
  textarea.rows = 1;
  textarea.setAttribute("aria-label", "Message");
  const sendBtn = el("button", "btn primary", "Send");
  sendBtn.type = "button";
  const errLine = el("span", "err");
  const bar = el("div", "composerbar");
  bar.append(errLine, sendBtn);
  const box = el("div", "composerbox");
  box.append(titleInput, textarea, bar);
  composerWrap.append(box);
  const submit = async () => {
    const text = textarea.value;
    const title = titleInput.value;
    if (!text.trim()) return;
    textarea.value = ""; titleInput.value = "";
    await send(text, title);
  };
  sendBtn.addEventListener("click", submit);
  textarea.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } });

  const poweredBy = () => {
    const d = el("div", "powered");
    const hand = el("span", "poweredmark");
    hand.append(orbSvg(BLOBS[0], 0));
    d.append(el("span", "", "Powered by"), hand, el("b", "", "Kamiji"), el("span", "", "and"), el("b", "kosmos", "Kosmos"));
    return d;
  };

  function statusText() {
    if (state.status === "connected") return "Connected";
    if (state.status === "connecting") return "Connecting…";
    return "Demo mode";
  }

  function renderSide() {
    side.replaceChildren();
    const brand = el("div", "brand");
    brand.append(avatar("bitsocial", ""), el("h1", "", "Bitsocial Hangout"));
    const status = el("div", "status", statusText());
    status.dataset.state = state.status;
    status.setAttribute("role", "status");
    status.title = state.status === "connected" ? `Connected to ${state.url}` : state.error || "No node connected. Showing sample communities.";
    if (state.error && state.status === "demo") { const e = el("div", "status", state.error); e.style.cssText = "white-space: normal; border-radius: 10px; color: var(--bh-bad);"; e.setAttribute("role", "alert"); side.append(brand, status, e); } else side.append(brand, status);
    const list = el("div", "list");
    state.communities.forEach((c) => {
      const row = el("button", "row");
      row.type = "button";
      row.setAttribute("aria-current", String(state.view === "chat" && c.address === state.selected));
      row.dataset.address = c.address;
      row.append(avatar(c.address, "sm"));
      const t = el("span", "t");
      const name = el("b");
      name.append(el("i", "", "#"), document.createTextNode(c.title || c.address));
      t.append(name);
      if (c.description) t.append(el("small", "", c.description));
      row.append(t);
      row.addEventListener("click", () => {
        state.view = "chat"; state.selected = c.address; state.thread = ""; state.welcomed = true; persist();
        watchSelected();
        render();
      });
      list.append(row);
    });
    if (!state.communities.length) list.append(el("div", "empty", state.status === "connected" ? "No communities on this node yet." : "No communities."));
    const foot = el("div", "sidefoot");
    const settings = el("button", "btn", "Connection settings");
    settings.type = "button";
    settings.addEventListener("click", () => { state.view = "settings"; render(); });
    foot.append(settings, poweredBy());
    side.append(el("div", "sectionlabel", "Communities"), list, foot);
  }

  function messageNode(m, opts = {}) {
    const row = el("div", `msg${m.pending ? " pending" : ""}${m.failed ? " failed" : ""}`);
    if (opts.depth) row.style.marginLeft = `${Math.min(opts.depth, 4) * 24}px`;
    row.dataset.cid = m.cid;
    const col = el("div", "col");
    const who = el("div", "who");
    who.append(el("b", "", m.author.name), el("span", "", relativeTime(m.timestamp)));
    if (m.pinned) who.append(el("span", "tag", "Pinned"));
    col.append(who);
    if (m.title) col.append(el("div", "ptitle", m.title));
    if (m.content) col.append(renderMarkdown(m.content));
    if (m.link) { const a = el("a", "", m.link); if (/^https?:\/\//i.test(m.link)) { a.href = m.link; a.target = "_blank"; a.rel = "noopener noreferrer"; } col.append(a); }
    if (m.pending && !m.note) col.append(el("div", "note", "Publishing…"));
    if (m.note) col.append(el("div", "note", m.note));
    if (opts.openThread) {
      const n = m.replyCount || (m.replies ? m.replies.length : 0);
      const b = el("button", "linkbtn", n ? `${n} ${n === 1 ? "reply" : "replies"}` : "Reply");
      b.type = "button";
      b.addEventListener("click", () => { state.thread = m.cid; render(); loadReplies(m); });
      col.append(b);
    }
    row.append(avatar(m.author.address), col);
    return row;
  }

  function settingsCard() {
    const card = el("div", "card");
    const label = el("label", "", "Bitsocial node (Plebbit RPC WebSocket URL)");
    label.htmlFor = "bh-rpc-url";
    const input = el("input");
    input.id = "bh-rpc-url";
    input.value = state.url;
    input.spellcheck = false;
    input.autocomplete = "off";
    const nameLabel = el("label", "", "Your display name");
    nameLabel.htmlFor = "bh-name";
    const nameInput = el("input");
    nameInput.id = "bh-name";
    nameInput.value = state.name;
    const actions = el("div", "actions");
    const connectBtn = el("button", "btn primary", state.status === "connected" ? "Reconnect" : "Connect");
    connectBtn.type = "button";
    connectBtn.addEventListener("click", () => { state.name = nameInput.value.trim() || "You"; state.welcomed = true; persist(); connect(input.value, true); });
    const demoBtn = el("button", "btn", "Use demo mode");
    demoBtn.type = "button";
    demoBtn.addEventListener("click", async () => { state.name = nameInput.value.trim() || "You"; await stopLive(); useDemo(); state.welcomed = true; state.view = "chat"; persist(); render(); });
    actions.append(connectBtn, demoBtn);
    card.append(label, input, nameLabel, nameInput, actions);
    if (state.error) { const e = el("div", "errtext", state.error); e.setAttribute("role", "alert"); card.append(e); }
    card.append(el("div", "hint", state.status === "connected" ? `Connected to ${state.url}.` : "Not connected: showing in-memory demo communities. The URL is saved in this browser."));
    return card;
  }

  function renderBody() {
    body.replaceChildren();
    head.replaceChildren();
    if (state.view === "welcome" || state.view === "settings") {
      composerWrap.hidden = true;
      if (state.view === "settings") {
        head.append(el("h2", "", "Connection settings"));
        const page = el("div", "page");
        page.append(settingsCard());
        body.append(page);
        return;
      }
      const page = el("div", "page");
      const big = el("span", "avatar lg");
      big.append(orbSvg(BLOBS[0], 0));
      page.append(big, el("h2", "", "Welcome to Bitsocial Hangout"), el("p", "", "Chat in Bitsocial communities: each community is a channel, each post a thread, all peer to peer. No node yet? Start in demo mode."), settingsCard());
      body.append(page);
      return;
    }
    const c = community();
    if (!c) { composerWrap.hidden = true; body.append(el("div", "empty", "Pick a community to start.")); return; }
    composerWrap.hidden = false;
    const p = post();
    if (p) {
      const back = el("button", "btn", "Back");
      back.type = "button";
      back.addEventListener("click", () => { state.thread = ""; render(); });
      head.append(back, el("h2", "", "Thread"), el("span", "desc", `in # ${c.title || c.address}`));
      const list = el("div", "msgs");
      list.append(messageNode(p));
      list.append(el("div", "sectionlabel", `${(p.replies || []).length} replies`));
      (p.replies || []).forEach((r) => list.append(messageNode(r, { depth: r.depth })));
      body.append(list);
      textarea.placeholder = "Reply in thread";
      titleInput.hidden = true;
    } else {
      head.append(el("h2", "", `# ${c.title || c.address}`), el("span", "desc", c.description || c.address));
      const list = el("div", "msgs");
      if (!c.posts.length) list.append(el("div", "empty", state.status === "connected" && !c.loaded ? "Loading community from the network…" : "No posts yet. Say hello!"));
      c.posts.forEach((m) => list.append(messageNode(m, { openThread: true })));
      body.append(list);
      textarea.placeholder = `Message # ${c.title || c.address}`;
      titleInput.hidden = false;
    }
    errLine.textContent = state.error && state.status === "connected" ? state.error : "";
    body.scrollTop = body.scrollHeight;
  }

  function renderMembers() {
    members.replaceChildren();
    const c = state.view === "chat" ? community() : null;
    if (!c) return;
    const p = post();
    const counts = new Map();
    const count = (m) => { const e = counts.get(m.author.address) || { author: m.author, n: 0 }; e.n += 1; counts.set(m.author.address, e); };
    (p ? [p, ...(p.replies || [])] : c.posts.flatMap((x) => [x, ...(x.replies || [])])).forEach(count);
    members.append(el("div", "mhead", `Members (${counts.size})`));
    [...counts.values()].sort((a, b) => b.n - a.n).forEach(({ author, n }) => {
      const row = el("div", "mrow");
      const t = el("div", "t", author.name);
      t.append(el("small", "", `${n} ${n === 1 ? "message" : "messages"}`));
      row.append(avatar(author.address, "sm"), t);
      members.append(row);
    });
  }

  function renderChrome() { renderSide(); }
  function render() {
    if (disposed) return;
    renderSide();
    renderBody();
    renderMembers();
  }

  render();
  // Try the saved node quietly; fall back to demo mode if it is not there.
  if (saved.url && saved.autoconnect !== false && options.autoConnect !== false && saved.welcomed) connect(state.url);

  return () => { disposed = true; stopLive(); root.remove(); };
}

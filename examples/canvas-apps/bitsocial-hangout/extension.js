/* Bitsocial — a Canvas App that looks and feels like Hangout / Team Chat, but talks
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
 *
 * Publishing: every comment, vote and comment edit is signed in this browser (Ed25519 via
 * WebCrypto, CBOR-encoded exactly like plebbit-js) and handed to the node as a ready-made
 * signed publication. The private key never leaves this browser's localStorage.
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
//   publishVote [{vote}] / publishCommentEdit [{commentEdit}]   same event shape as publishComment
//   createSubplebbit [{title?, description?}]       -> {address, ...}   (local community on the node)
//   startSubplebbit [{address}]                     -> sub id (the node keeps the community running)
//   editSubplebbit [address, {title?, description?, address?}] -> community JSON
//   publishChallengeAnswers [subId, {challengeAnswers}] -> true
//   unsubscribe [subId]

const PUBLISH_METHODS = {
  comment: { method: "publishComment", key: "comment" },
  vote: { method: "publishVote", key: "vote" },
  commentEdit: { method: "publishCommentEdit", key: "commentEdit" },
};

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
    /** Publishes a signed comment / vote / commentEdit; resolves to {id, stop} once the node accepted the request. */
    publish: (kind, publication, onEvent) => {
      const spec = PUBLISH_METHODS[kind];
      if (!spec) throw new Error(`Unknown publication kind ${kind}`);
      return subscribe(spec.method, [{ [spec.key]: publication }], (event, result) => onEvent && onEvent(event, result));
    },
    createCommunity: (options) => client.call("createSubplebbit", [options]),
    startCommunity: (address, onEvent) => subscribe("startSubplebbit", [{ address }], (event, result) => onEvent && onEvent(event, result)),
    editCommunity: (address, props) => client.call("editSubplebbit", [address, props]),
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
    downvotes: update.downvoteCount || 0,
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

// ─── Identity and signing ──────────────────────────────────────────────────────────────────
// Verified against plebbit-js 0.0.11 (src/signer/signatures.ts, src/signer/util.ts, src/plebbit/plebbit.ts):
//  - signer = Ed25519; privateKey = base64 (no padding) of the 32 byte seed; publicKey likewise (raw 32 bytes)
//  - author address = base58btc of the identity multihash of the libp2p protobuf public key ("12D3KooW...")
//  - a publication is signed as: pick the signed properties, drop null/undefined/empty objects,
//    CBOR-encode (cborg, map keys sorted by byte length then bytewise), Ed25519-sign the bytes
//  - the signature object is {signature (base64), publicKey (base64), type: "ed25519", signedPropertyNames}
//  - the node's publishComment / publishVote / publishCommentEdit take the pubsub publication, i.e. only the
//    signed properties plus `signature` (no `signer`)

export const PROTOCOL_VERSION = "1.0.0";

// Property order of each publication type (src/publications/*/schema.ts); `signedPropertyNames` follows it.
const SIGNED_ORDER = {
  comment: ["flairs", "spoiler", "nsfw", "content", "title", "link", "linkWidth", "linkHeight", "linkHtmlTagName", "parentCid", "postCid", "quotedCids", "author", "subplebbitAddress", "protocolVersion", "timestamp"],
  vote: ["author", "subplebbitAddress", "protocolVersion", "timestamp", "commentCid", "vote"],
  commentEdit: ["author", "subplebbitAddress", "protocolVersion", "timestamp", "commentCid", "content", "deleted", "flairs", "spoiler", "nsfw", "reason"],
};

const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Base58btc (Bitcoin alphabet) encoding of bytes. */
export function base58btcEncode(bytes) {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;
  const digits = [];
  for (let i = zeros; i < bytes.length; i += 1) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j += 1) { carry += digits[j] << 8; digits[j] = carry % 58; carry = Math.floor(carry / 58); }
    while (carry) { digits.push(carry % 58); carry = Math.floor(carry / 58); }
  }
  return "1".repeat(zeros) + digits.reverse().map((d) => B58_ALPHABET[d]).join("");
}

/** Base64 without padding (what plebbit-js stores for keys and signatures). */
export function bytesToBase64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/=+$/, "");
}

/** Decodes standard or url-safe base64, padded or not. Throws on junk. */
export function base64ToBytes(text) {
  const clean = String(text || "").trim().replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  if (!/^[A-Za-z0-9+/]*$/.test(clean) || clean.length % 4 === 1) throw new Error("That is not valid base64.");
  const bin = atob(clean + "=".repeat((4 - (clean.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

const utf8 = (text) => new TextEncoder().encode(text);

function cborHead(major, n) {
  if (n < 24) return Uint8Array.of((major << 5) | n);
  if (n < 0x100) return Uint8Array.of((major << 5) | 24, n);
  if (n < 0x10000) return Uint8Array.of((major << 5) | 25, n >> 8, n & 255);
  if (n < 0x100000000) return Uint8Array.of((major << 5) | 26, (n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255);
  const out = new Uint8Array(9);
  out[0] = (major << 5) | 27;
  new DataView(out.buffer).setBigUint64(1, BigInt(n));
  return out;
}

const concatBytes = (parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  parts.forEach((p) => { out.set(p, at); at += p.length; });
  return out;
};

const compareKeyBytes = (a, b) => {
  if (a.length !== b.length) return a.length - b.length;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};

/** The subset of CBOR plebbit signs: integers, strings, booleans, arrays and maps (keys sorted like cborg). */
export function cborEncode(value) {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("Only whole numbers can be signed.");
    return value >= 0 ? cborHead(0, value) : cborHead(1, -1 - value);
  }
  if (typeof value === "string") { const b = utf8(value); return concatBytes([cborHead(3, b.length), b]); }
  if (typeof value === "boolean") return Uint8Array.of(value ? 0xf5 : 0xf4);
  if (value === null) return Uint8Array.of(0xf6);
  if (Array.isArray(value)) return concatBytes([cborHead(4, value.length), ...value.map(cborEncode)]);
  if (isObject(value)) {
    const entries = Object.entries(value).map(([k, v]) => [utf8(k), v]);
    entries.sort((a, b) => compareKeyBytes(a[0], b[0]));
    return concatBytes([cborHead(5, entries.length), ...entries.flatMap(([k, v]) => [cborHead(3, k.length), k, cborEncode(v)])]);
  }
  throw new Error("This value can not be signed.");
}

/** plebbit-js cleanUpBeforePublishing: drops null/undefined values and empty objects, recursively. */
export function cleanForSigning(value) {
  if (Array.isArray(value)) return value.map(cleanForSigning);
  if (!isObject(value)) return value;
  const out = {};
  Object.entries(value).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    const cleaned = cleanForSigning(v);
    if (isObject(cleaned) && !Object.keys(cleaned).length) return;
    out[k] = cleaned;
  });
  return out;
}

/** The Bitsocial (Plebbit) address of an Ed25519 public key: base58btc of the identity multihash of its libp2p protobuf. */
export function addressFromPublicKey(publicKeyBytes) {
  if (!publicKeyBytes || publicKeyBytes.length !== 32) throw new Error("An Ed25519 public key is 32 bytes.");
  const pb = concatBytes([Uint8Array.of(0x08, 0x01, 0x12, 0x20), publicKeyBytes]);
  return base58btcEncode(concatBytes([Uint8Array.of(0x00, pb.length), pb]));
}

const PKCS8_ED25519_PREFIX = Uint8Array.of(0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20);
const subtle = () => (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) || null;
export const NO_ED25519_TEXT = "This browser can't create or use Ed25519 keys (WebCrypto Ed25519 is missing). Update to a current Chrome, Edge, Safari or Firefox to publish. Reading and demo mode still work.";

/** True when WebCrypto can generate Ed25519 keys here. */
export async function ed25519Supported() {
  try {
    const s = subtle();
    if (!s) return false;
    return Boolean(await s.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]));
  } catch { return false; }
}

const importSeed = async (seed) => {
  const s = subtle();
  if (!s) throw new Error(NO_ED25519_TEXT);
  try { return await s.importKey("pkcs8", concatBytes([PKCS8_ED25519_PREFIX, seed]), { name: "Ed25519" }, true, ["sign"]); } catch { throw new Error(NO_ED25519_TEXT); }
};

/** Builds a signer {privateKey, publicKey, address, type} from a base64 32 byte Ed25519 seed. */
export async function identityFromPrivateKey(privateKeyBase64) {
  let seed;
  try { seed = base64ToBytes(privateKeyBase64); } catch { throw new Error("That is not a valid private key. Expected 32 bytes in base64."); }
  if (seed.length !== 32) throw new Error(`A private key is 32 bytes (43 base64 characters); this one is ${seed.length} bytes.`);
  const key = await importSeed(seed);
  const jwk = await subtle().exportKey("jwk", key);
  const publicKey = base64ToBytes(jwk.x);
  return { type: "ed25519", privateKey: bytesToBase64(seed), publicKey: bytesToBase64(publicKey), address: addressFromPublicKey(publicKey) };
}

/** Creates a brand new random signer. */
export async function generateIdentity() {
  const s = subtle();
  if (!s) throw new Error(NO_ED25519_TEXT);
  let pkcs8;
  try { pkcs8 = new Uint8Array(await s.exportKey("pkcs8", (await s.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])).privateKey)); } catch { throw new Error(NO_ED25519_TEXT); }
  return identityFromPrivateKey(bytesToBase64(pkcs8.slice(pkcs8.length - 32)));
}

/** Pulls a private key out of what a person pastes: the bare base64 key, or an exported account JSON. */
export function extractPrivateKey(text) {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("Paste a private key first.");
  if (!raw.startsWith("{")) return raw;
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error("That looks like JSON but could not be parsed."); }
  const found = [data && data.signer && data.signer.privateKey, data && data.account && data.account.signer && data.account.signer.privateKey, data && data.privateKey].find((k) => typeof k === "string");
  if (!found) throw new Error("No signer private key found in that JSON.");
  return found;
}

/**
 * Signs a publication ("comment" | "vote" | "commentEdit") with the identity and returns the pubsub
 * publication the Plebbit RPC expects: the signed properties plus `signature`.
 * `fields` are the type's own fields; author.address, protocolVersion and timestamp are filled in here.
 */
export async function signPublication(kind, fields, identity, { now = Date.now() } = {}) {
  const order = SIGNED_ORDER[kind];
  if (!order) throw new Error(`Unknown publication kind ${kind}`);
  const unknown = Object.keys(fields).filter((k) => fields[k] !== undefined && fields[k] !== null && !order.includes(k));
  if (unknown.length) throw new Error(`Can't sign unknown ${kind} field(s): ${unknown.join(", ")}`);
  if (!identity || !identity.privateKey) throw new Error("Create or import an identity first.");
  const author = { ...(fields.author || {}), address: identity.address };
  const full = cleanForSigning({ ...fields, author, protocolVersion: fields.protocolVersion || PROTOCOL_VERSION, timestamp: fields.timestamp || Math.floor(now / 1000) });
  const signedPropertyNames = order.filter((k) => k in full);
  const picked = Object.fromEntries(signedPropertyNames.map((k) => [k, full[k]]));
  const key = await importSeed(base64ToBytes(identity.privateKey));
  const signature = new Uint8Array(await subtle().sign({ name: "Ed25519" }, key, cborEncode(picked)));
  return { ...picked, signature: { signature: bytesToBase64(signature), publicKey: identity.publicKey, type: "ed25519", signedPropertyNames } };
}

const PEER_ID = /^(12D3KooW[1-9A-HJ-NP-Za-km-z]{44}|Qm[1-9A-HJ-NP-Za-km-z]{44})$/;
const DOMAIN_NAME = /^(?=.{3,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

/** Accepts a peer-id style IPNS address or an ENS-like name (name.eth, name.sol); returns {ok, address} or {ok:false, error}. */
export function validateCommunityAddress(input) {
  const text = String(input || "").trim();
  if (!text) return { ok: false, error: "Enter a community address, such as name.eth or 12D3KooW…" };
  if (PEER_ID.test(text)) return { ok: true, address: text };
  if (DOMAIN_NAME.test(text.toLowerCase())) return { ok: true, address: text.toLowerCase() };
  return { ok: false, error: `"${text.length > 60 ? `${text.slice(0, 57)}…` : text}" is not a community address. Use a name like music.eth or a peer id starting with 12D3KooW.` };
}

/** Checks the fields of a new post or reply; returns an error string or "". */
export function validateComposer({ content = "", title = "", link = "", isReply = false }) {
  if (isReply) return content.trim() ? "" : "Write something to reply.";
  if (!content.trim() && !title.trim() && !link.trim()) return "A post needs a title, some text or a link.";
  if (link.trim()) {
    if (link.trim().length > 2000) return "The link is longer than 2000 characters.";
    try { const u = new URL(link.trim()); if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("scheme"); } catch { return "The link must be a full http(s) address, like https://example.com."; }
  }
  return "";
}

// ─── Demo mode: in-memory sample communities ───────────────────────────────────────────────

const H = 3600 * 1000;
const mk = (cid, name, address, text, ago, extra = {}) => ({ cid, author: { address, name }, title: "", content: text, link: "", timestamp: 0, ago, replyCount: 0, upvotes: 0, downvotes: 0, pinned: false, replies: [], ...extra });

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
    { address: "plebtoken.eth", title: "Plebs", description: "Casual chat for everyone. Posting here asks a demo challenge.", challenge: { question: "What is 2 + 3?", answer: "5" }, posts: [
      mk("Qm-demo-4", "Linus", "12D3KooWlinus", "What are you building this weekend?", 2 * H, { title: "Weekend projects", upvotes: 3 }),
    ] },
  ];
  list.forEach((c) => c.posts.forEach((p) => { p.timestamp = now - p.ago; p.replies.forEach((r) => { r.timestamp = now - r.ago; r.depth = 0; }); p.replyCount = p.replies.length; }));
  return list;
}

/** Communities a demo user can join by address (not in the sidebar until joined). */
export function demoDirectory(now = Date.now()) {
  const list = [
    { address: "music.eth", title: "Music", description: "Albums, gigs and gear.", posts: [mk("Qm-demo-5", "Ada", "12D3KooWada", "What are you listening to this week?", 3 * H, { title: "Weekly listening thread", upvotes: 6 })] },
    { address: "devs.eth", title: "Devs", description: "Building on Bitsocial.", posts: [mk("Qm-demo-6", "Grace", "12D3KooWgrace", "Share what you are shipping.", 6 * H, { title: "Show and tell", upvotes: 11 })] },
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
// Bitsocial characters have square heads: a rounded square with a slightly different corner radius each.
const ORB_PATHS = [
  "M18 7h28c8 0 12 4 12 12v26c0 8-4 12-12 12H18c-8 0-12-4-12-12V19C6 11 10 7 18 7Z",
  "M15 7h34c6 0 9 3 9 9v32c0 6-3 9-9 9H15c-6 0-9-3-9-9V16C6 10 9 7 15 7Z",
  "M20 7h24c9 0 14 5 14 14v22c0 9-5 14-14 14H20c-9 0-14-5-14-14V21C6 12 11 7 20 7Z",
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
  const halo = add(svg, "rect", { x: 1, y: 2, width: 62, height: 62, rx: 18, fill: blob.fill, opacity: 0.16 });
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
.bh .composerbox { display: grid; gap: 2px; border: 1px solid var(--bh-border); border-radius: 18px; background: var(--bh-panel); padding: 0 10px 8px; }
.bh .composerbox:focus-within { border-color: var(--bh-muted); }
.bh .composerbox .grip { height: 14px; display: grid; place-items: center; }
.bh .composerbox .grip::after { content: ""; width: 36px; height: 4px; border-radius: 4px; background: var(--bh-border); }
.bh .composerbox input, .bh .composerbox textarea { border: 0; outline: 0; background: transparent; resize: none; width: 100%; padding: 6px 6px; }
.bh .composerbox textarea { min-height: 44px; max-height: 320px; }
.bh .composerbar { display: flex; align-items: center; gap: 6px; }
.bh .composerbar .tool { display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 12px; background: var(--bh-bg); padding: 6px 10px; font-size: 12px; cursor: pointer; white-space: nowrap; }
.bh .composerbar .tool:hover { background: var(--bh-raised); }
.bh .composerbar .tool.on { background: var(--bh-primary); color: var(--bh-on-primary); }
.bh .composerbar .spacer { flex: 1; }
.bh .composerbar .send { border: 0; border-radius: 50%; width: 34px; height: 34px; background: var(--bh-primary); color: var(--bh-on-primary); cursor: pointer; font-weight: 700; }
.bh .composerbar .send:disabled { opacity: .4; cursor: default; }
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
.bh .head .spacer { flex: 1; min-width: 0; }
.bh .head .btn { padding: 4px 10px; font-size: 13px; }
.bh .notice { flex: none; margin: 8px 16px 0; padding: 7px 12px; border: 1px solid var(--bh-border); border-radius: 10px; background: var(--bh-panel); font-size: 13px; }
.bh .notice[data-kind="error"] { border-color: var(--bh-bad); color: var(--bh-bad); }
.bh .notice[hidden] { display: none; }
.bh .acts { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; margin-top: 2px; }
.bh .vote { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; color: var(--bh-muted); }
.bh .vote button { border: 0; background: none; padding: 1px 5px; border-radius: 6px; cursor: pointer; color: var(--bh-muted); font-size: 12px; }
.bh .vote button:hover:not(:disabled) { background: var(--bh-raised); color: var(--bh-contrast); }
.bh .vote button[aria-pressed="true"] { color: var(--bh-contrast); background: var(--bh-raised); }
.bh .vote button:disabled { opacity: .5; cursor: default; }
.bh .vote output { min-width: 16px; text-align: center; color: var(--bh-text); }
.bh .linkbtn.danger { color: var(--bh-bad); }
.bh .replychip { display: flex; align-items: center; gap: 8px; margin: 0 4px 6px; padding: 4px 10px; border: 1px solid var(--bh-border); border-radius: 10px; font-size: 12px; color: var(--bh-muted); }
.bh .replychip[hidden] { display: none; }
.bh .sidebtns { display: flex; gap: 6px; padding: 8px 12px 0; }
.bh .sidebtns .btn { flex: 1; padding: 5px 8px; font-size: 13px; }
.bh .idchip { display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px 8px; border: 1px solid var(--bh-border); border-radius: 12px; background: var(--bh-panel); cursor: pointer; text-align: left; }
.bh .idchip:hover { background: var(--bh-raised); }
.bh .idchip .t { min-width: 0; display: grid; }
.bh .idchip .t b { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bh .idchip .t small { color: var(--bh-muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bh .tag { font-size: 10px; padding: 0 5px; margin-left: 6px; border: 1px solid var(--bh-border); border-radius: 6px; color: var(--bh-muted); font-style: normal; }
.bh .dlgback { position: absolute; inset: 0; z-index: 30; display: grid; place-items: center; padding: 16px; background: rgba(0,0,0,.55); }
.bh .dlg { width: min(520px, 100%); max-height: 100%; overflow: auto; display: grid; gap: 12px; align-content: start; padding: 16px; border: 1px solid var(--bh-border); border-radius: 16px; background: var(--bh-bg); box-shadow: 0 12px 40px rgba(0,0,0,.5); }
.bh .dlghead { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.bh .dlghead h2 { margin: 0; font-size: 17px; font-weight: 600; color: var(--bh-contrast); }
.bh .dlgbody { display: grid; gap: 12px; }
.bh .dlg p { margin: 0; color: var(--bh-muted); font-size: 13px; }
.bh .fld { display: grid; gap: 4px; }
.bh .fld label, .bh .dlg legend { font-size: 12px; color: var(--bh-muted); }
.bh .fld input, .bh .fld textarea, .bh .dlg input.plain { border: 1px solid var(--bh-border); border-radius: 10px; background: var(--bh-panel); padding: 7px 10px; width: 100%; }
.bh .fld textarea { min-height: 84px; resize: vertical; }
.bh .fld textarea.mono, .bh .mono { font: 12px ui-monospace, SF Mono, Menlo, monospace; word-break: break-all; }
.bh .fld .hint, .bh .dlg .hint { font-size: 12px; color: var(--bh-muted); }
.bh .dlg .actions { display: flex; flex-wrap: wrap; gap: 8px; }
.bh .dlg .errtext { color: var(--bh-bad); font-size: 13px; }
.bh .dlg .oktext { color: var(--bh-ok); font-size: 13px; }
.bh .dlg .warn { padding: 8px 10px; border: 1px solid #f2b51d; border-radius: 10px; font-size: 13px; color: var(--bh-text); }
.bh .dlg fieldset { margin: 0; padding: 10px; display: grid; gap: 8px; border: 1px solid var(--bh-border); border-radius: 12px; }
.bh .dlg fieldset img { max-width: 100%; background: #fff; border-radius: 8px; justify-self: start; }
.bh .dlg .sep { border: 0; border-top: 1px solid var(--bh-border); margin: 0; }
.bh .dlg .idbox { display: flex; align-items: center; gap: 12px; padding: 10px; border: 1px solid var(--bh-border); border-radius: 12px; background: var(--bh-panel); }
.bh .dlg .idbox .t { min-width: 0; display: grid; gap: 2px; }
.bh .dlg .ownrow { display: grid; gap: 8px; padding: 10px; border: 1px solid var(--bh-border); border-radius: 12px; background: var(--bh-panel); }
.bh .dlg .ownrow .top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.bh .dlg .ownrow .top b { color: var(--bh-contrast); font-weight: 500; }
.bh button:focus-visible, .bh input:focus-visible, .bh textarea:focus-visible { outline: 2px solid var(--arco-accent, #7c9dff); outline-offset: 1px; }
@keyframes bhOrb { 0% { transform: scale(1, 1) rotate(0deg); } 100% { transform: scale(1.05, .95) rotate(-3deg); } }
@keyframes bhLook { 0%, 38% { transform: translateX(0); } 46%, 66% { transform: translateX(3px); } 76%, 92% { transform: translateX(-3px); } 100% { transform: translateX(0); } }
@keyframes bhBlink { 0%, 91%, 100% { transform: scaleY(1); } 94% { transform: scaleY(.1); } }
@media (prefers-reduced-motion: reduce) { .bh .orb-body, .bh .orb-look, .bh .orb-blink { animation: none; } }
@media (max-width: 900px) { .bh .shell { grid-template-columns: 220px minmax(0, 1fr); } .bh .members { display: none; } }
@media (max-width: 600px) { .bh .shell { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); } .bh .side { border-right: 0; border-bottom: 1px solid var(--bh-border); max-height: 38vh; } }
/* Feed app sizing: 14px text, 12px meta, 16px gutters, 12px gaps, 32px avatars, 16px section titles. */
.bh { font-size: 14px; line-height: 20px; }
.bh small, .bh .sub, .bh .sectionlabel, .bh .sect { font-size: 12px; line-height: 16px; }
.bh h1, .bh .lhead h2, .bh .chead h2, .bh .mhead h2, .bh .brand h1 { font-size: 16px; line-height: 24px; font-weight: 600; }
.bh .lhead, .bh .chead, .bh .mhead, .bh .brand { padding-left: 16px; padding-right: 16px; }
.bh .msg { gap: 12px; }
.bh .thread, .bh .body { padding: 12px 16px; gap: 12px; }
.bh .composerwrap { padding: 8px 16px 14px; }
.bh .row { gap: 12px; padding-left: 12px; padding-right: 12px; }
.bh .avatar { width: 32px; height: 32px; }
/* Fewer rules: the rails separate from the page by tone, not by lines. */
.bh .side, .bh .members { border: 0; background: var(--bh-panel); }
.bh .sidefoot, .bh .head, .bh .dlg .sep { border: 0; }
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
  if (host.apiVersion !== "1") throw new Error("Bitsocial requires Canvas host API 1.");
  return host.registerPage("bitsocial-hangout", ({ container }) => mount(container, options));
}

const IDENTITY_KEY = "bitsocial-hangout:identity:v1";
const GUEST = { name: "You", address: "you.eth" };
const errText = (err) => (err && err.message ? err.message : String(err || "Unknown error"));
const shortAddress = (a) => (a && a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || "");

function mount(container, options) {
  container.append(el("style", "", CSS));
  const root = el("div", "bh");
  container.append(root);
  let disposed = false;
  let idCounter = 0;
  const timers = new Set();
  const later = (fn, ms = 0) => { const t = setTimeout(() => { timers.delete(t); if (!disposed) fn(); }, ms); timers.add(t); return t; };

  const readJson = (key) => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } };
  const writeJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } };
  const saved = readJson(STORAGE_KEY) || {};
  const savedIdentity = readJson(IDENTITY_KEY);
  const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x) : null);

  const state = {
    url: typeof saved.url === "string" && saved.url ? saved.url : DEFAULT_RPC_URL,
    name: saved.name || GUEST.name,
    welcomed: Boolean(saved.welcomed),
    view: saved.welcomed ? "chat" : "welcome", // welcome | chat | settings
    status: "demo", // demo | connecting | connected
    error: "",
    identity: savedIdentity && typeof savedIdentity.privateKey === "string" && typeof savedIdentity.address === "string" && typeof savedIdentity.publicKey === "string" ? savedIdentity : null,
    joined: strings(saved.joined) || [], // communities joined by address on a node
    joinedDemo: strings(saved.joinedDemo) || demoCommunities().map((c) => c.address), // joined demo communities
    votes: isObject(saved.votes) ? saved.votes : {}, // comment cid -> 1 | -1 (this browser's own votes)
    ownAddresses: [], // communities hosted by the connected node
    pool: [...demoCommunities(), ...demoDirectory()], // all demo communities, in memory only
    selected: "",
    thread: "",
    replyTo: null,
    composerError: "",
  };
  const persist = () => writeJson(STORAGE_KEY, { url: state.url, name: state.name, welcomed: state.welcomed, joined: state.joined, joinedDemo: state.joinedDemo, votes: state.votes });
  const persistIdentity = () => { try { if (state.identity) localStorage.setItem(IDENTITY_KEY, JSON.stringify(state.identity)); else localStorage.removeItem(IDENTITY_KEY); } catch { /* storage unavailable */ } };

  let client = null;
  let api = null;
  let listWatch = null;
  let communityWatch = null;
  const known = new Map(); // address -> community object while connected

  const isConnected = () => state.status === "connected" && Boolean(api);
  function connectedList() {
    const seen = new Set();
    const out = [];
    [...state.ownAddresses, ...state.joined].forEach((address) => {
      if (seen.has(address)) return;
      seen.add(address);
      let c = known.get(address);
      if (!c) { c = { address, title: address, description: "", posts: [], loaded: false }; known.set(address, c); }
      c.owned = state.ownAddresses.includes(address);
      out.push(c);
    });
    return out;
  }
  const demoList = () => state.pool.filter((c) => c.owned || state.joinedDemo.includes(c.address));
  const communities = () => (state.status === "connected" ? connectedList() : demoList());
  const community = () => communities().find((c) => c.address === state.selected);
  const post = () => { const c = community(); return c && c.posts.find((p) => p.cid === state.thread); };
  /** Keeps the selection on a community that exists; true when it had to move. */
  function ensureSelected() {
    const list = communities();
    if (list.some((c) => c.address === state.selected)) return false;
    state.selected = list[0] ? list[0].address : "";
    state.thread = "";
    state.replyTo = null;
    return true;
  }
  ensureSelected();

  const authorName = () => state.name || GUEST.name;
  const me = () => ({ address: state.identity ? state.identity.address : GUEST.address, name: authorName() });
  const isMine = (m) => Boolean(m.mine) || Boolean(state.identity && m.author && m.author.address === state.identity.address);

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
    state.ownAddresses = [];
    state.thread = "";
    state.replyTo = null;
    ensureSelected();
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
      state.status = "connected";
      state.thread = "";
      state.replyTo = null;
      state.ownAddresses = [];
      known.clear();
      listWatch = await api.watchCommunityList((addresses) => {
        if (disposed) return;
        state.ownAddresses = addresses;
        if (ensureSelected()) watchSelected();
        render();
      });
      client.onState((s) => { if (s === "closed" && state.status === "connected" && !disposed) { useDemo("The node closed the connection. Showing demo data."); render(); } });
    } catch (err) {
      await stopLive();
      useDemo(err && err.message ? err.message : "Could not reach the node.");
      if (manual) state.view = "settings";
    }
    if (state.status === "connected") { state.view = "chat"; ensureSelected(); watchSelected(); }
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

  // ─── dialogs ──────────────────────────────────────────────────────────────────────────
  const dialogs = [];
  function openDialog(title, build, opts = {}) {
    const opener = document.activeElement;
    const back = el("div", "dlgback");
    const dlg = el("div", "dlg");
    const titleId = `bh-d-${++idCounter}`;
    dlg.setAttribute("role", "dialog");
    dlg.setAttribute("aria-modal", "true");
    dlg.setAttribute("aria-labelledby", titleId);
    const dh = el("div", "dlghead");
    const h = el("h2", "", title);
    h.id = titleId;
    const x = el("button", "btn", "×");
    x.type = "button";
    x.setAttribute("aria-label", "Close dialog");
    dh.append(h, x);
    const dbody = el("div", "dlgbody");
    dlg.append(dh, dbody);
    back.append(dlg);
    let closed = false;
    const handle = { body: dbody, element: dlg, close: () => {} };
    handle.close = () => {
      if (closed) return;
      closed = true;
      const i = dialogs.indexOf(handle);
      if (i >= 0) dialogs.splice(i, 1);
      back.remove();
      if (opts.onClose) opts.onClose();
      if (opener && opener.focus && document.contains(opener)) opener.focus();
    };
    x.addEventListener("click", handle.close);
    if (!opts.sticky) back.addEventListener("mousedown", (e) => { if (e.target === back) handle.close(); });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.stopPropagation(); handle.close(); return; }
      if (e.key !== "Tab") return;
      const f = [...dlg.querySelectorAll('button:not([disabled]), input:not([disabled]):not([hidden]), textarea:not([disabled]), a[href]')].filter((n) => !n.closest("[hidden]"));
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    dialogs.push(handle);
    root.append(back);
    build(handle);
    const focusTarget = (opts.focus && dbody.querySelector(opts.focus)) || dbody.querySelector("input:not([hidden]), textarea, button");
    if (focusTarget) focusTarget.focus();
    return handle;
  }

  let fieldCounter = 0;
  function field(labelText, control, hint) {
    const wrap = el("div", "fld");
    control.id = `bh-f-${++fieldCounter}`;
    const l = el("label", "", labelText);
    l.htmlFor = control.id;
    wrap.append(l, control);
    if (hint) wrap.append(el("div", "hint", hint));
    return wrap;
  }
  function textInput(value = "", placeholder = "") {
    const i = el("input");
    i.type = "text";
    i.value = value;
    i.placeholder = placeholder;
    i.autocomplete = "off";
    i.spellcheck = false;
    return i;
  }
  function textBox(value = "", rows = 4) {
    const t = el("textarea");
    t.rows = rows;
    t.value = value;
    return t;
  }
  function button(label, cls = "btn") {
    const b = el("button", cls, label);
    b.type = "button";
    return b;
  }
  /** A pair of live regions for a form: an error line (role alert) and a success line (role status). */
  function messages() {
    const err = el("div", "errtext");
    err.setAttribute("role", "alert");
    const ok = el("div", "oktext");
    ok.setAttribute("role", "status");
    return {
      err, ok,
      error: (text) => { ok.textContent = ""; err.textContent = text; },
      success: (text) => { err.textContent = ""; ok.textContent = text; },
      clear: () => { err.textContent = ""; ok.textContent = ""; },
    };
  }
  async function withBusy(btn, busyLabel, fn) {
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = busyLabel;
    btn.setAttribute("aria-busy", "true");
    try { return await fn(); } finally { btn.disabled = false; btn.textContent = label; btn.removeAttribute("aria-busy"); }
  }

  // A short message above the thread for outcomes that have no form of their own.
  const noticeEl = el("div", "notice");
  noticeEl.hidden = true;
  let noticeTimer = null;
  function flash(text, kind = "info") {
    clearTimeout(noticeTimer);
    noticeEl.hidden = !text;
    noticeEl.textContent = text;
    noticeEl.dataset.kind = kind;
    noticeEl.setAttribute("role", kind === "error" ? "alert" : "status");
    if (text) noticeTimer = setTimeout(() => { noticeEl.hidden = true; noticeEl.textContent = ""; }, 9000);
  }

  // ─── identity ─────────────────────────────────────────────────────────────────────────
  let cryptoSupported = null;
  async function cryptoOk() {
    if (cryptoSupported === null) cryptoSupported = await ed25519Supported();
    return cryptoSupported;
  }
  function setIdentity(identity) {
    state.identity = identity;
    persistIdentity();
    render();
  }

  function openIdentityDialog() {
    return openDialog("Your identity", (dlg) => {
      let revealed = false;
      let armed = ""; // "replace" | "remove": the second click confirms
      const status = messages();
      const draw = () => {
        dlg.body.replaceChildren();
        const id = state.identity;
        const support = el("div", "warn", NO_ED25519_TEXT);
        support.hidden = true;
        support.setAttribute("role", "alert");
        cryptoOk().then((ok) => { support.hidden = ok; });
        dlg.body.append(support);
        dlg.body.append(el("p", "", "Your identity is a key pair that signs everything you publish. The private key stays in this browser (localStorage). It is never sent to the node: only the signed post is. Export it to use the same identity elsewhere."));

        if (id) {
          const box = el("div", "idbox");
          box.append(avatar(id.address, "sm"));
          const t = el("div", "t");
          t.append(el("b", "", authorName()), el("span", "mono", id.address));
          box.append(t);
          dlg.body.append(box);
        } else {
          dlg.body.append(el("div", "hint", "No identity yet. Create one to publish in Connected mode. Demo mode works without."));
        }

        const nameInput = textInput(state.name === GUEST.name ? "" : state.name, "Display name (optional)");
        const saveName = button("Save name");
        saveName.addEventListener("click", () => { state.name = nameInput.value.trim() || GUEST.name; persist(); render(); status.success("Display name saved. It is signed into new posts."); });
        const nameRow = el("div", "actions");
        nameRow.append(saveName);
        dlg.body.append(field("Display name", nameInput, "Shown next to your posts. Part of what you sign."), nameRow);

        const gen = button(id ? "Generate a new identity" : "Create identity", id ? "btn" : "btn primary");
        gen.addEventListener("click", async () => {
          if (id && armed !== "replace") { armed = "replace"; gen.textContent = "Replace? Export first. Click again"; return; }
          armed = "";
          await withBusy(gen, "Generating…", async () => {
            try { setIdentity(await generateIdentity()); revealed = false; draw(); } catch (err) { status.error(errText(err)); }
          });
        });
        const genRow = el("div", "actions");
        genRow.append(gen);
        dlg.body.append(el("hr", "sep"), genRow);

        const importBox = textBox("", 2);
        importBox.className = "mono";
        importBox.setAttribute("autocomplete", "off");
        const importBtn = button("Import identity");
        importBtn.addEventListener("click", () => withBusy(importBtn, "Importing…", async () => {
          try {
            const identity = await identityFromPrivateKey(extractPrivateKey(importBox.value));
            setIdentity(identity);
            revealed = false;
            draw();
            status.success(`Imported identity ${identity.address}.`);
          } catch (err) { status.error(errText(err)); }
        }));
        const impRow = el("div", "actions");
        impRow.append(importBtn);
        dlg.body.append(field("Import a private key", importBox, "Paste the base64 private key, or an exported account JSON with signer.privateKey."), impRow);

        if (id) {
          const reveal = button(revealed ? "Hide private key" : "Show private key to export");
          reveal.addEventListener("click", () => { revealed = !revealed; draw(); });
          const exportRow = el("div", "actions");
          exportRow.append(reveal);
          if (revealed) {
            const keyBox = textBox(id.privateKey, 2);
            keyBox.readOnly = true;
            keyBox.className = "mono";
            const copy = button("Copy private key");
            copy.addEventListener("click", async () => {
              try { await navigator.clipboard.writeText(id.privateKey); status.success("Private key copied. Keep it secret."); } catch { keyBox.select(); status.error("Could not copy automatically. The key is selected, copy it manually."); }
            });
            exportRow.append(copy);
            dlg.body.append(el("hr", "sep"), field("Private key (secret)", keyBox, "Anyone with this key can post as you. Store it in a password manager."), exportRow);
          } else dlg.body.append(el("hr", "sep"), exportRow);
          const remove = button("Remove identity from this browser", "btn");
          remove.addEventListener("click", () => {
            if (armed !== "remove") { armed = "remove"; remove.textContent = "Removes the key. Export first. Click again"; return; }
            armed = "";
            setIdentity(null);
            draw();
          });
          const rmRow = el("div", "actions");
          rmRow.append(remove);
          dlg.body.append(rmRow);
        }
        dlg.body.append(status.err, status.ok);
      };
      draw();
    });
  }

  // ─── publishing: sign, hand to the node (or the demo), handle challenges ───────────────
  const needIdentity = () => { const e = new Error("Create or import an identity first: everything you publish is signed with it."); e.needsIdentity = true; return e; };

  async function buildPublication(kind, fields) {
    const author = state.name && state.name !== GUEST.name ? { displayName: state.name } : {};
    if (state.identity) {
      if (!(await cryptoOk())) throw new Error(NO_ED25519_TEXT);
      return signPublication(kind, { ...fields, author }, state.identity);
    }
    if (state.status === "connected") throw needIdentity();
    // Demo mode without an identity: a guest, unsigned (the demo accepts it).
    return { ...fields, author: { address: GUEST.address, ...author }, protocolVersion: PROTOCOL_VERSION, timestamp: Math.floor(Date.now() / 1000) };
  }

  // Demo backend: the same event sequence a node produces, in memory.
  let demoSeq = 0;
  const demoPending = new Map();
  const demoBackend = {
    async publish(kind, pub, onEvent) {
      const id = ++demoSeq;
      const c = state.pool.find((x) => x.address === pub.subplebbitAddress);
      const challenge = kind === "comment" && c && c.challenge ? c.challenge : null;
      demoPending.set(id, { onEvent, challenge });
      const success = () => onEvent("challengeverification", { challengeSuccess: true, commentUpdate: kind === "comment" ? { cid: `demo-${id}` } : undefined });
      later(() => { if (challenge) onEvent("challenge", { challenges: [{ challenge: challenge.question, type: "text/plain" }] }); else success(); });
      return { id, stop: async () => { demoPending.delete(id); } };
    },
    async answer(sub, answers) {
      const entry = demoPending.get(sub.id);
      if (!entry) throw new Error("This publication is no longer waiting for an answer.");
      later(() => {
        const ok = String(answers[0] || "").trim().toLowerCase() === entry.challenge.answer;
        entry.onEvent("challengeverification", ok ? { challengeSuccess: true, commentUpdate: { cid: `demo-${sub.id}` } } : { challengeSuccess: false, reason: "The answer was wrong.", challengeErrors: { 0: "Wrong answer." } });
      });
    },
  };
  const rpcBackend = {
    publish: (kind, pub, onEvent) => api.publish(kind, pub, onEvent),
    answer: (sub, answers) => api.answerChallenge(sub.id, answers),
  };
  const backend = () => (state.status === "connected" && api ? rpcBackend : demoBackend);

  /** The dialog a community's challenge is answered in. Returns a handle to show the result. */
  function openChallengeDialog({ what, address, challenges, onSubmit, onCancel }) {
    let settled = false;
    let controller = null;
    const dlg = openDialog("Challenge", (d) => {
      const msg = messages();
      d.body.append(el("p", "", `# ${address} asks you to answer ${challenges.length === 1 ? "a challenge" : `${challenges.length} challenges`} before your ${what} is published.`));
      const inputs = challenges.map((ch, i) => {
        const set = el("fieldset");
        set.append(el("legend", "", `Challenge ${i + 1}${ch.type && ch.type !== "text/plain" ? ` (${ch.type})` : ""}`));
        if (/^image\//.test(ch.type || "") && /^[A-Za-z0-9+/=]+$/.test(ch.challenge || "")) {
          const img = el("img");
          img.src = `data:${ch.type};base64,${ch.challenge}`;
          img.alt = "Challenge image: type the text you see";
          set.append(img);
        } else {
          set.append(el("p", "", ch.challenge || ""));
          if (ch.type && ch.type !== "text/plain" && !/^image\//.test(ch.type)) set.append(el("div", "hint", "This challenge type is not interactive here. Answer as the community describes."));
        }
        const input = textInput("", "Your answer");
        input.setAttribute("aria-label", `Answer to challenge ${i + 1}`);
        set.append(input);
        d.body.append(set);
        return input;
      });
      const submit = button("Send answer", "btn primary");
      const cancel = button("Cancel");
      const actions = el("div", "actions");
      actions.append(submit, cancel);
      d.body.append(actions, msg.err, msg.ok);
      let sent = false;
      const submitAnswers = async () => {
        if (sent || settled) return;
        const answers = inputs.map((i) => i.value.trim());
        if (answers.some((a) => !a)) { msg.error("Answer every challenge."); return; }
        await withBusy(submit, "Sending…", async () => {
          try { await onSubmit(answers); sent = true; } catch (err) { msg.error(`Could not send the answer: ${errText(err)}`); }
        });
        if (sent && !settled) {
          inputs.forEach((i) => { i.disabled = true; });
          submit.disabled = true;
          msg.success("Answer sent. Waiting for the community to verify it…");
        }
      };
      submit.addEventListener("click", submitAnswers);
      d.body.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); submitAnswers(); } });
      cancel.addEventListener("click", () => d.close());
      controller = {
        result(ok, text) {
          settled = true;
          msg.clear();
          if (ok) msg.success(text); else msg.error(text);
          inputs.forEach((i) => { i.disabled = true; });
          submit.hidden = true;
          cancel.textContent = "Close";
          cancel.focus();
        },
      };
    }, { sticky: true, onClose: () => { if (!settled) { settled = true; onCancel(); } } });
    return { result: (ok, text) => controller.result(ok, text), close: dlg.close };
  }

  /**
   * Signs `fields` as a `kind` publication and publishes it. Resolves (never rejects) to
   * {ok, reason, cid} after the community verified it or it failed. Challenges open a dialog.
   */
  function runPublish({ kind, fields, what, address, onNote, onSigned }) {
    return new Promise((resolve) => {
      let pub;
      let subPromise = null;
      let finished = false;
      let dialog = null;
      const finish = (res) => {
        if (finished) return;
        finished = true;
        if (dialog) dialog.result(res.ok, res.ok ? `Accepted. Your ${what} is published.` : `Rejected${res.reason ? `: ${res.reason}` : "."}`);
        if (subPromise) subPromise.then((s) => s && s.stop()).catch(() => {});
        resolve(res);
      };
      const onEvent = (event, result) => {
        if (disposed || finished) return;
        if (event === "challenge") {
          const challenges = (result && result.challenges) || [];
          if (onNote) onNote("Waiting for your challenge answer…");
          dialog = openChallengeDialog({
            what, address, challenges,
            onSubmit: async (answers) => backend().answer(await subPromise, answers),
            onCancel: () => finish({ ok: false, reason: "The challenge was not answered." }),
          });
        } else if (event === "challengeverification") {
          const ok = !result || result.challengeSuccess !== false;
          const errors = result && result.challengeErrors ? Object.values(result.challengeErrors).join(" ") : "";
          finish({ ok, reason: ok ? "" : [result && result.reason, errors].filter(Boolean).join(" ") || "The community rejected it.", cid: result && result.commentUpdate ? result.commentUpdate.cid : "" });
        } else if (event === "error") {
          finish({ ok: false, reason: describeError(result) });
        }
      };
      buildPublication(kind, fields).then((built) => {
        pub = built;
        if (onSigned) onSigned(true);
        try { subPromise = Promise.resolve(backend().publish(kind, pub, onEvent)); } catch (err) { subPromise = Promise.reject(err); }
        subPromise.catch((err) => finish({ ok: false, reason: `Your node did not accept it: ${errText(err)}` }));
      }).catch((err) => {
        if (onSigned) onSigned(false);
        if (err && err.needsIdentity) openIdentityDialog();
        finish({ ok: false, reason: errText(err) });
      });
    });
  }

  // ─── sending posts and replies ────────────────────────────────────────────────────────
  function send({ content, title, link }) {
    const c = community();
    if (!c) { state.composerError = "Pick a community first."; return Promise.resolve(false); }
    const root = post();
    const isReply = Boolean(root);
    const parent = isReply ? state.replyTo || root : null;
    if (parent && String(parent.cid).startsWith("local-")) { state.composerError = "Wait until that message is published before replying to it."; return Promise.resolve(false); }
    if (state.status === "connected" && !state.identity) { state.composerError = "Create or import an identity to publish."; openIdentityDialog(); return Promise.resolve(false); }
    const msg = { cid: `local-${Date.now()}-${++idCounter}`, author: me(), title: isReply ? "" : title.trim(), content: content.trim(), link: isReply ? "" : link.trim(), timestamp: Date.now(), replyCount: 0, upvotes: 0, downvotes: 0, pinned: false, replies: isReply ? null : [], depth: isReply && parent !== root ? Math.min((parent.depth || 0) + 1, 4) : 0, pending: true, mine: true };
    if (isReply) { root.replies = root.replies || []; root.replies.push(msg); root.replyCount = root.replies.length; } else c.posts.push(msg);
    state.composerError = "";
    state.replyTo = null;
    render();
    const fields = { subplebbitAddress: c.address, content: msg.content || undefined, title: msg.title || undefined, link: msg.link || undefined };
    if (isReply) { fields.parentCid = parent.cid; fields.postCid = root.cid; }
    return runPublish({
      kind: "comment", fields, what: isReply ? "reply" : "post", address: c.address,
      onNote: (text) => { msg.note = text; render(); },
      onSigned: (ok) => setSendBusy(false, ok),
    }).then((res) => {
      msg.pending = false;
      if (res.ok) { msg.note = ""; if (res.cid) msg.cid = res.cid; } else { msg.failed = true; msg.note = res.reason; }
      render();
      return res.ok;
    });
  }

  // ─── votes, edits, deletes ────────────────────────────────────────────────────────────
  function applyVote(m, from, to) {
    if (from === 1) m.upvotes = Math.max(0, (m.upvotes || 0) - 1);
    if (from === -1) m.downvotes = Math.max(0, (m.downvotes || 0) - 1);
    if (to === 1) m.upvotes = (m.upvotes || 0) + 1;
    if (to === -1) m.downvotes = (m.downvotes || 0) + 1;
    if (to === 0) delete state.votes[m.cid]; else state.votes[m.cid] = to;
    persist();
  }
  async function vote(m, direction) {
    const c = community();
    if (!c || m.voting) return;
    if (!m.cid || String(m.cid).startsWith("local-")) { flash("Wait until it is published before voting.", "error"); return; }
    if (state.status === "connected" && !state.identity) { flash("Create or import an identity to vote.", "error"); openIdentityDialog(); return; }
    const prev = state.votes[m.cid] || 0;
    const next = prev === direction ? 0 : direction;
    m.voting = true;
    applyVote(m, prev, next);
    render();
    const res = await runPublish({ kind: "vote", fields: { subplebbitAddress: c.address, commentCid: m.cid, vote: next }, what: "vote", address: c.address });
    m.voting = false;
    if (!res.ok) { applyVote(m, next, prev); flash(`Your vote was not accepted: ${res.reason}`, "error"); }
    render();
  }

  function openEditDialog(m) {
    const c = community();
    if (!c) return;
    openDialog("Edit your post", (dlg) => {
      const box = textBox(m.content || "", 6);
      const save = button("Save edit", "btn primary");
      const cancel = button("Cancel");
      const msg = messages();
      const actions = el("div", "actions");
      actions.append(save, cancel);
      dlg.body.append(field("Text (markdown)", box, "Only the text can be edited. The community shows your latest edit."), actions, msg.err, msg.ok);
      cancel.addEventListener("click", dlg.close);
      save.addEventListener("click", () => withBusy(save, "Saving…", async () => {
        const content = box.value;
        if (!content.trim()) { msg.error("The text can't be empty. Use Delete to remove the post."); return; }
        if (content === m.content) { msg.error("Nothing changed."); return; }
        msg.clear();
        box.disabled = true;
        const res = await runPublish({ kind: "commentEdit", fields: { subplebbitAddress: c.address, commentCid: m.cid, content }, what: "edit", address: c.address });
        box.disabled = false;
        if (res.ok) { m.content = content; m.note = "Edited"; dlg.close(); flash("Edit published.", "info"); render(); } else msg.error(`The edit was not accepted: ${res.reason}`);
      }));
    }, { focus: "textarea" });
  }

  function openDeleteDialog(m) {
    const c = community();
    if (!c) return;
    openDialog("Delete this post?", (dlg) => {
      const yes = button("Delete", "btn primary");
      const no = button("Keep it");
      const msg = messages();
      const actions = el("div", "actions");
      actions.append(yes, no);
      dlg.body.append(el("p", "", "This publishes a signed delete. Peers may keep copies, but the community will show it as deleted."), actions, msg.err);
      no.addEventListener("click", dlg.close);
      yes.addEventListener("click", () => withBusy(yes, "Deleting…", async () => {
        const res = await runPublish({ kind: "commentEdit", fields: { subplebbitAddress: c.address, commentCid: m.cid, deleted: true }, what: "delete", address: c.address });
        if (res.ok) { m.deleted = true; m.content = "_[deleted]_"; m.link = ""; dlg.close(); flash("Deleted.", "info"); render(); } else msg.error(`The delete was not accepted: ${res.reason}`);
      }));
    }, { focus: "button.btn:not(.primary)" });
  }

  // ─── communities: create, edit, start, join, leave ───────────────────────────────────
  async function opCreateCommunity({ title, description, domain }) {
    if (isConnected()) {
      const options = {};
      if (title) options.title = title;
      if (description) options.description = description;
      const created = await api.createCommunity(options);
      const address = created && created.address;
      if (!address) throw new Error("The node did not return an address for the new community.");
      const started = await api.startCommunity(address);
      await started.stop(); // the node keeps the community running; only the event stream ends
      let finalAddress = address;
      let warning = "";
      if (domain) {
        try { await api.editCommunity(address, { address: domain }); finalAddress = domain; } catch (err) { warning = `The community runs as ${address}, but setting ${domain} failed: ${errText(err)}. Point the domain's TXT record "subplebbit-address" at it, then edit the address again.`; }
      }
      state.ownAddresses = [...state.ownAddresses.filter((a) => a !== address), finalAddress];
      known.set(finalAddress, { address: finalAddress, title: title || finalAddress, description: description || "", posts: [], loaded: true, owned: true });
      return { address: finalAddress, warning };
    }
    const address = domain || `12D3KooWdemo${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    state.pool.push({ address, title: title || address, description: description || "", posts: [], owned: true, started: true });
    return { address, warning: "" };
  }
  async function opEditCommunity(address, props) {
    if (isConnected()) {
      await api.editCommunity(address, props);
      const c = known.get(address);
      if (c) { if ("title" in props) c.title = props.title || address; if ("description" in props) c.description = props.description || ""; }
      return;
    }
    const c = state.pool.find((x) => x.address === address);
    if (!c) throw new Error("That community no longer exists.");
    if ("title" in props) c.title = props.title || address;
    if ("description" in props) c.description = props.description || "";
  }
  async function opStartCommunity(address) {
    if (isConnected()) { const s = await api.startCommunity(address); await s.stop(); return; }
    const c = state.pool.find((x) => x.address === address);
    if (c) c.started = true;
  }
  /** Checks the community can be reached, then remembers it. Throws a readable error otherwise. */
  async function opJoin(input) {
    const v = validateCommunityAddress(input);
    if (!v.ok) throw new Error(v.error);
    const address = v.address;
    if (communities().some((c) => c.address === address)) throw new Error(`You already have ${address}.`);
    if (isConnected()) {
      const timeoutMs = options.joinTimeoutMs || 15000;
      const sub = await new Promise((resolve, reject) => {
        let done = false;
        let watch = null;
        let lastError = "";
        const end = (err, value) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          if (watch) watch.stop().catch(() => {});
          if (err) reject(err); else resolve(value);
        };
        const timer = setTimeout(() => end(new Error(`Could not reach ${address}${lastError ? ` (${lastError})` : ""}. Check the address and that its owner is online.`)), timeoutMs);
        api.watchCommunity(address, (update) => end(null, update || {}), (e) => { lastError = describeError(e); }).then((w) => { watch = w; if (done) w.stop().catch(() => {}); }, (e) => end(new Error(errText(e))));
      });
      known.set(address, { address, title: sub.title || address, description: sub.description || "", posts: postsFromCommunity(sub), loaded: true, owned: false });
      state.joined = [...state.joined, address];
    } else {
      const c = state.pool.find((x) => x.address === address);
      if (!c) throw new Error(`Can't reach ${address} in demo mode. Try music.eth or devs.eth, or connect a node to join real communities.`);
      state.joinedDemo = [...state.joinedDemo, address];
    }
    persist();
    return address;
  }
  function opLeave(address) {
    if (isConnected()) state.joined = state.joined.filter((a) => a !== address); else state.joinedDemo = state.joinedDemo.filter((a) => a !== address);
    persist();
  }
  function selectCommunity(address) {
    state.view = "chat"; state.selected = address; state.thread = ""; state.replyTo = null; state.welcomed = true; persist();
    watchSelected();
    render();
  }

  function openJoinDialog() {
    openDialog("Join a community", (dlg) => {
      const input = textInput("", "music.eth or 12D3KooW…");
      const join = button("Join", "btn primary");
      const cancel = button("Cancel");
      const msg = messages();
      const actions = el("div", "actions");
      actions.append(join, cancel);
      dlg.body.append(field("Community address", input, isConnected() ? "A name like music.eth, or the peer id of the community. Your node must be able to find it." : "Demo mode: try music.eth or devs.eth."), actions, msg.err, msg.ok);
      cancel.addEventListener("click", dlg.close);
      const run = () => withBusy(join, "Looking it up…", async () => {
        msg.clear();
        input.disabled = true;
        try {
          const address = await opJoin(input.value);
          dlg.close();
          selectCommunity(address);
          flash(`Joined ${address}.`);
        } catch (err) { msg.error(errText(err)); } finally { input.disabled = false; }
      });
      join.addEventListener("click", run);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); if (!join.disabled) run(); } });
    });
  }

  function openCreateCommunityDialog() {
    openDialog("Create a community", (dlg) => {
      const title = textInput("", "Community title");
      const description = textBox("", 3);
      const domain = textInput("", "optional, like mycommunity.eth");
      const create = button("Create and start", "btn primary");
      const cancel = button("Cancel");
      const msg = messages();
      const actions = el("div", "actions");
      actions.append(create, cancel);
      dlg.body.append(
        el("p", "", isConnected() ? "The community is created on your node and started. It gets a permanent peer-id address; you can point a name at it." : "Demo mode: the community lives in memory until you reload."),
        field("Title", title), field("Description", description),
        field("Name address (optional)", domain, "A name you own, like mycommunity.eth. Its TXT record subplebbit-address must point at the community, otherwise keep the peer-id address."),
        actions, msg.err, msg.ok,
      );
      cancel.addEventListener("click", dlg.close);
      create.addEventListener("click", () => withBusy(create, "Creating…", async () => {
        msg.clear();
        const domainText = domain.value.trim();
        if (!title.value.trim() && !description.value.trim()) { msg.error("Give the community a title or a description."); return; }
        if (domainText && !DOMAIN_NAME.test(domainText.toLowerCase())) { msg.error("The name address must look like mycommunity.eth."); return; }
        [title, description, domain].forEach((i) => { i.disabled = true; });
        try {
          const res = await opCreateCommunity({ title: title.value.trim(), description: description.value.trim(), domain: domainText.toLowerCase() });
          selectCommunity(res.address);
          if (res.warning) { msg.success(`Created ${res.address}.`); msg.error(res.warning); flash(`Created ${res.address}. ${res.warning}`, "error"); } else { dlg.close(); flash(`Created ${res.address}.`); }
        } catch (err) { msg.error(`Could not create the community: ${errText(err)}`); [title, description, domain].forEach((i) => { i.disabled = false; }); }
      }));
    });
  }

  function openMyCommunitiesDialog() {
    openDialog("Your communities", (dlg) => {
      const draw = () => {
        dlg.body.replaceChildren();
        const mine = communities().filter((c) => c.owned);
        dlg.body.append(el("p", "", isConnected() ? "Communities hosted on your node." : "Communities you created in demo mode (in memory)."));
        if (!mine.length) dlg.body.append(el("div", "empty", "You haven't created a community yet."));
        mine.forEach((c) => {
          const row = el("div", "ownrow");
          const top = el("div", "top");
          top.append(avatar(c.address, "sm"), el("b", "", c.title || c.address), el("span", "mono", shortAddress(c.address)));
          const open = button("Open");
          open.addEventListener("click", () => { dlg.close(); selectCommunity(c.address); });
          const edit = button("Edit");
          const start = button("Start");
          top.append(open, edit);
          if (isConnected()) top.append(start);
          row.append(top);
          const form = el("div", "fld");
          form.hidden = true;
          const t = textInput(c.title && c.title !== c.address ? c.title : "", "Title");
          const d = textBox(c.description || "", 3);
          const save = button("Save changes", "btn primary");
          const msg = messages();
          const acts = el("div", "actions");
          acts.append(save);
          form.append(field("Title", t), field("Description", d), acts);
          row.append(form, msg.err, msg.ok);
          edit.addEventListener("click", () => {
            form.hidden = !form.hidden;
            if (!form.hidden) { if (isConnected() && state.selected !== c.address) { state.selected = c.address; state.thread = ""; watchSelected(); } t.focus(); }
          });
          start.addEventListener("click", () => withBusy(start, "Starting…", async () => {
            try { await opStartCommunity(c.address); msg.success("Started. The node now serves this community."); } catch (err) { msg.error(`Could not start it: ${errText(err)}`); }
          }));
          save.addEventListener("click", () => withBusy(save, "Saving…", async () => {
            msg.clear();
            try { await opEditCommunity(c.address, { title: t.value.trim(), description: d.value.trim() }); msg.success("Saved."); render(); } catch (err) { msg.error(`Could not save: ${errText(err)}`); }
          }));
          dlg.body.append(row);
        });
        const create = button("Create a community", "btn primary");
        create.addEventListener("click", () => { dlg.close(); openCreateCommunityDialog(); });
        const acts = el("div", "actions");
        acts.append(create);
        dlg.body.append(acts);
      };
      draw();
    });
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
  main.append(head, noticeEl, body, composerWrap);

  const replyChip = el("div", "replychip");
  replyChip.hidden = true;
  const replyChipText = el("span", "", "");
  const replyChipCancel = el("button", "linkbtn", "Cancel reply");
  replyChipCancel.type = "button";
  replyChipCancel.addEventListener("click", () => { state.replyTo = null; render(); });
  replyChip.append(replyChipText, replyChipCancel);

  const titleInput = el("input");
  titleInput.placeholder = "Title (optional)";
  titleInput.setAttribute("aria-label", "Post title");
  const linkInput = el("input");
  linkInput.placeholder = "Link (optional)";
  linkInput.type = "url";
  linkInput.setAttribute("aria-label", "Post link");
  const textarea = el("textarea");
  textarea.rows = 1;
  textarea.setAttribute("aria-label", "Message");
  const sendBtn = el("button", "send", "↑");
  sendBtn.type = "button";
  sendBtn.setAttribute("aria-label", "Send");
  sendBtn.title = "Send";
  const errLine = el("span", "err");
  errLine.setAttribute("role", "alert");
  const bar = el("div", "composerbar");
  // The title and link fields stay tucked behind chips until they are wanted.
  const fieldChip = (label, input) => {
    const chip = el("button", "tool", label);
    chip.type = "button";
    chip.setAttribute("aria-pressed", "false");
    input.hidden = true;
    chip.addEventListener("click", () => {
      input.hidden = !input.hidden;
      chip.setAttribute("aria-pressed", String(!input.hidden));
      chip.classList.toggle("on", !input.hidden);
      if (!input.hidden) input.focus();
    });
    return chip;
  };
  const titleChip = fieldChip("Title", titleInput);
  const linkChip = fieldChip("Link", linkInput);
  bar.append(titleChip, linkChip, errLine, el("span", "spacer"), sendBtn);
  const box = el("div", "composerbox");
  box.append(el("div", "grip"), titleInput, linkInput, textarea, bar);
  composerWrap.append(replyChip, box);
  function setSendBusy(busy, ok = true) {
    sendBtn.disabled = busy;
    sendBtn.textContent = busy ? "…" : "↑";
    sendBtn.title = busy ? "Sending…" : "Send";
    if (busy) sendBtn.setAttribute("aria-busy", "true"); else sendBtn.removeAttribute("aria-busy");
    if (!busy && !ok) renderComposerError();
  }
  const renderComposerError = () => { errLine.textContent = state.composerError || (state.error && state.status === "connected" ? state.error : ""); };
  const submit = async () => {
    if (sendBtn.disabled) return;
    const content = textarea.value;
    const title = titleInput.value;
    const link = linkInput.value;
    const problem = validateComposer({ content, title, link, isReply: Boolean(post()) });
    if (problem) { state.composerError = problem; renderComposerError(); return; }
    state.composerError = "";
    setSendBusy(true);
    const started = send({ content, title, link });
    if (state.composerError) { setSendBusy(false); renderComposerError(); return; }
    textarea.value = ""; titleInput.value = ""; linkInput.value = "";
    renderComposerError();
    await started;
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
    brand.append(avatar("bitsocial", ""), el("h1", "", "Bitsocial"));
    const status = el("div", "status", statusText());
    status.dataset.state = state.status;
    status.setAttribute("role", "status");
    status.title = state.status === "connected" ? `Connected to ${state.url}` : state.error || "No node connected. Showing sample communities.";
    if (state.error && state.status === "demo") { const e = el("div", "status", state.error); e.style.cssText = "white-space: normal; border-radius: 10px; color: var(--bh-bad);"; e.setAttribute("role", "alert"); side.append(brand, status, e); } else side.append(brand, status);
    const list = el("div", "list");
    communities().forEach((c) => {
      const row = el("button", "row");
      row.type = "button";
      row.setAttribute("aria-current", String(state.view === "chat" && c.address === state.selected));
      row.dataset.address = c.address;
      row.append(avatar(c.address, "sm"));
      const t = el("span", "t");
      const name = el("b");
      name.append(el("i", "", "#"), document.createTextNode(c.title || c.address));
      if (c.owned) name.append(el("i", "tag", "yours"));
      t.append(name);
      if (c.description) t.append(el("small", "", c.description));
      row.append(t);
      row.addEventListener("click", () => selectCommunity(c.address));
      list.append(row);
    });
    if (!communities().length) list.append(el("div", "empty", state.status === "connected" ? "No communities yet. Create one or join by address." : "No communities. Join one by address."));
    const btns = el("div", "sidebtns");
    const join = button("Join");
    join.title = "Join a community by address";
    join.addEventListener("click", openJoinDialog);
    const create = button("Create");
    create.title = "Create a community";
    create.addEventListener("click", openCreateCommunityDialog);
    const mine = button("Yours");
    mine.title = "Your communities";
    mine.addEventListener("click", openMyCommunitiesDialog);
    btns.append(join, create, mine);
    const foot = el("div", "sidefoot");
    const chip = el("button", "idchip");
    chip.type = "button";
    chip.setAttribute("aria-label", "Your identity");
    chip.append(avatar(state.identity ? state.identity.address : "no-identity", "sm"));
    const ct = el("span", "t");
    ct.append(el("b", "", state.identity ? authorName() : "No identity"), el("small", "", state.identity ? shortAddress(state.identity.address) : "Set up to publish"));
    chip.append(ct);
    chip.addEventListener("click", openIdentityDialog);
    const settings = el("button", "btn", "Connection settings");
    settings.type = "button";
    settings.addEventListener("click", () => { state.view = "settings"; render(); });
    foot.append(chip, settings, poweredBy());
    side.append(el("div", "sectionlabel", "Communities"), list, btns, foot);
  }

  function voteControls(m) {
    const wrap = el("span", "vote");
    const mineVote = state.votes[m.cid] || 0;
    const up = el("button", "", "▲");
    up.type = "button";
    up.setAttribute("aria-label", "Upvote");
    up.setAttribute("aria-pressed", String(mineVote === 1));
    up.disabled = Boolean(m.voting);
    const down = el("button", "", "▼");
    down.type = "button";
    down.setAttribute("aria-label", "Downvote");
    down.setAttribute("aria-pressed", String(mineVote === -1));
    down.disabled = Boolean(m.voting);
    const score = el("output", "", String((m.upvotes || 0) - (m.downvotes || 0)));
    score.setAttribute("aria-label", "Score");
    up.addEventListener("click", () => vote(m, 1));
    down.addEventListener("click", () => vote(m, -1));
    wrap.append(up, score, down);
    return wrap;
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
    const acts = el("div", "acts");
    if (opts.openThread) {
      const n = m.replyCount || (m.replies ? m.replies.length : 0);
      const b = el("button", "linkbtn", n ? `${n} ${n === 1 ? "reply" : "replies"}` : "Reply");
      b.type = "button";
      b.addEventListener("click", () => { state.thread = m.cid; state.replyTo = null; render(); loadReplies(m); });
      acts.append(b);
    } else if (opts.replyable && !m.pending && !m.failed) {
      const b = el("button", "linkbtn", "Reply");
      b.type = "button";
      b.addEventListener("click", () => { state.replyTo = m; render(); textarea.focus(); });
      acts.append(b);
    }
    if (!m.pending && !m.failed && !m.deleted) {
      acts.append(voteControls(m));
      if (isMine(m) && !String(m.cid).startsWith("local-")) {
        const edit = el("button", "linkbtn", "Edit");
        edit.type = "button";
        edit.addEventListener("click", () => openEditDialog(m));
        const del = el("button", "linkbtn danger", "Delete");
        del.type = "button";
        del.addEventListener("click", () => openDeleteDialog(m));
        acts.append(edit, del);
      }
    }
    if (m.failed) {
      const dismiss = el("button", "linkbtn", "Dismiss");
      dismiss.type = "button";
      dismiss.addEventListener("click", () => {
        const c = community();
        if (c) { c.posts = c.posts.filter((x) => x !== m); const p = post(); if (p && p.replies) { p.replies = p.replies.filter((x) => x !== m); p.replyCount = p.replies.length; } }
        render();
      });
      acts.append(dismiss);
    }
    if (acts.children.length) col.append(acts);
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
    connectBtn.addEventListener("click", () => { state.name = nameInput.value.trim() || GUEST.name; state.welcomed = true; persist(); connect(input.value, true); });
    const demoBtn = el("button", "btn", "Use demo mode");
    demoBtn.type = "button";
    demoBtn.addEventListener("click", async () => { state.name = nameInput.value.trim() || GUEST.name; await stopLive(); useDemo(); state.welcomed = true; state.view = "chat"; persist(); render(); });
    const idBtn = el("button", "btn", state.identity ? "Manage identity" : "Create identity");
    idBtn.type = "button";
    idBtn.addEventListener("click", openIdentityDialog);
    actions.append(connectBtn, demoBtn, idBtn);
    card.append(label, input, nameLabel, nameInput, actions);
    if (state.error) { const e = el("div", "errtext", state.error); e.setAttribute("role", "alert"); card.append(e); }
    card.append(el("div", "hint", state.status === "connected" ? `Connected to ${state.url}.` : "Not connected: showing in-memory demo communities. The URL is saved in this browser."));
    return card;
  }

  function headActions(c) {
    const wrap = el("span", "spacer");
    const group = el("span");
    group.style.cssText = "display:inline-flex;gap:6px;";
    if (c.owned) {
      const edit = button("Edit community");
      edit.addEventListener("click", openMyCommunitiesDialog);
      group.append(edit);
    } else {
      const leave = button("Leave");
      leave.title = `Leave ${c.address}`;
      leave.addEventListener("click", () => {
        opLeave(c.address);
        if (ensureSelected()) watchSelected();
        flash(`Left ${c.address}.`);
        render();
      });
      group.append(leave);
    }
    return [wrap, group];
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
      page.append(big, el("h2", "", "Welcome to Bitsocial"), el("p", "", "Chat in Bitsocial communities: each community is a channel, each post a thread, all peer to peer. No node yet? Start in demo mode."), settingsCard());
      body.append(page);
      return;
    }
    const c = community();
    if (!c) {
      composerWrap.hidden = true;
      const empty = el("div", "empty", "Pick a community to start, or ");
      const join = el("button", "linkbtn", "join one by address");
      join.type = "button";
      join.addEventListener("click", openJoinDialog);
      empty.append(join, document.createTextNode("."));
      body.append(empty);
      return;
    }
    composerWrap.hidden = false;
    const p = post();
    if (state.replyTo && (!p || !(p.replies || []).includes(state.replyTo)) && state.replyTo !== p) state.replyTo = null;
    if (p) {
      const back = el("button", "btn", "Back");
      back.type = "button";
      back.addEventListener("click", () => { state.thread = ""; state.replyTo = null; render(); });
      head.append(back, el("h2", "", "Thread"), el("span", "desc", `in # ${c.title || c.address}`));
      const list = el("div", "msgs");
      list.append(messageNode(p));
      list.append(el("div", "sectionlabel", `${(p.replies || []).length} replies`));
      (p.replies || []).forEach((r) => list.append(messageNode(r, { depth: r.depth, replyable: true })));
      body.append(list);
      textarea.placeholder = state.replyTo ? `Reply to ${state.replyTo.author.name}` : "Reply in thread";
      titleInput.hidden = true;
      linkInput.hidden = true;
      titleChip.hidden = true;
      linkChip.hidden = true;
    } else {
      head.append(el("h2", "", `# ${c.title || c.address}`), el("span", "desc", c.description || c.address), ...headActions(c));
      const list = el("div", "msgs");
      if (!c.posts.length) list.append(el("div", "empty", state.status === "connected" && !c.loaded ? "Loading community from the network…" : "No posts yet. Say hello!"));
      c.posts.forEach((m) => list.append(messageNode(m, { openThread: true })));
      body.append(list);
      textarea.placeholder = `Message # ${c.title || c.address}`;
      titleChip.hidden = false;
      linkChip.hidden = false;
      titleInput.hidden = titleChip.getAttribute("aria-pressed") !== "true";
      linkInput.hidden = linkChip.getAttribute("aria-pressed") !== "true";
    }
    replyChip.hidden = !state.replyTo;
    replyChipText.textContent = state.replyTo ? `Replying to ${state.replyTo.author.name}` : "";
    renderComposerError();
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

  return () => {
    disposed = true;
    timers.forEach(clearTimeout);
    clearTimeout(noticeTimer);
    dialogs.slice().forEach((d) => d.close());
    stopLive();
    root.remove();
  };
}

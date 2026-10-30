/* MESH Hangout — the Hangout / Team Chat experience on a MESH protocol node.
 *
 * MESH = Modular Extensible Social Hybrid Protocol: Ed25519 identities, a signed content
 * DAG, composable moderation attestations and deterministic feeds. This Canvas App is a
 * dependency-free browser client for a MESH node (the HTTP API of app/server/main.py, v1.1,
 * and app/server/server_v2.py, v2.0, in holon-protocol/mesh-protocol).
 *
 * Mapping: feed / timeline = channels, content = messages (replies via reply_to),
 * entities = members (people and AI agents), attestations = moderation badges.
 *
 * Browser-only ESM. Text is always set with textContent. When no node is reachable (or when
 * you choose it) a Demo mode with in-memory sample data takes over, and the header says so.
 */

const STORAGE_KEY = "mesh-hangout:v1";
const DEFAULT_NODE = "http://localhost:12000";

// ─── Orb avatars (the Kamiji-style wisp: a flat blob with two pill eyes) ─────────────────

const BLOBS = [
  { id: "violet", fill: "#8B5CF6" }, { id: "blue", fill: "#2D9CF0" }, { id: "green", fill: "#2FBF71" },
  { id: "teal", fill: "#19B5A5" }, { id: "brown", fill: "#8A5A3C" }, { id: "orange", fill: "#F5760A" },
  { id: "red", fill: "#EF4444" }, { id: "pink", fill: "#EC4899" }, { id: "indigo", fill: "#5B5BF0" },
];
const ORB_PATHS = [
  "M32 6C45 5 58 15 58 31C58 47 46 58 31 58C17 58 6 47 6 32C6 17 18 7 32 6Z",
  "M30 5C44 4 59 17 58 33C57 48 44 59 30 58C16 57 5 46 6 31C7 17 17 6 30 5Z",
  "M34 6C47 8 58 19 57 34C56 49 43 58 29 57C15 56 6 44 7 29C8 15 21 4 34 6Z",
];
const SVG_NS = "http://www.w3.org/2000/svg";

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
  add(svg, "circle", { cx: 32, cy: 33, r: 31, fill: blob.fill, opacity: 0.16, class: "orb-halo" });
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

export function blobSvg(blobId) {
  const blob = BLOBS.find((b) => b.id === blobId) || BLOBS[0];
  return orbSvg(blob, BLOBS.indexOf(blob));
}

export function hashOf(text) {
  let h = 0;
  const s = String(text);
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** The orb for an entity: tinted deterministically from its id, so it is stable across nodes. */
export const blobIdFor = (entityId) => BLOBS[hashOf(entityId) % BLOBS.length].id;

// ─── MESH crypto and canonicalisation (verified against implementations/mesh/crypto.py) ───

const textEncoder = new TextEncoder();

export const bytesToHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
export function hexToBytes(hex) {
  if (typeof hex !== "string" || hex.length % 2 || /[^0-9a-f]/i.test(hex)) throw new Error("Invalid hex");
  return Uint8Array.from(hex.match(/../g) || [], (h) => parseInt(h, 16));
}
const b64urlToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

const subtle = () => globalThis.crypto?.subtle;

function pyString(s) {
  // Python json.dumps(ensure_ascii=True): everything outside 0x20-0x7e becomes \uXXXX (lowercase),
  // astral characters as surrogate pairs (which is exactly how JS iterates UTF-16 code units).
  let out = '"';
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    const ch = s[i];
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (ch === "\b") out += "\\b";
    else if (ch === "\f") out += "\\f";
    else if (c < 0x20 || c > 0x7e) out += `\\u${c.toString(16).padStart(4, "0")}`;
    else out += ch;
  }
  return `${out}"`;
}

// Python sorts str keys by code point; JS default sort is by UTF-16 unit, which differs for astral keys.
const compareCodePoints = (a, b) => {
  const x = Array.from(a, (c) => c.codePointAt(0));
  const y = Array.from(b, (c) => c.codePointAt(0));
  for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i];
  return x.length - y.length;
};

/**
 * Deterministic JSON, byte-identical to Python's
 * `json.dumps(obj, sort_keys=True, separators=(',', ':')).encode('utf-8')`.
 * Caveat: JS numbers have no int/float distinction, so 1.0 serialises as `1` (Python: `1.0`).
 * MESH payloads that get signed contain strings, ints, booleans and null only.
 */
export function canonicalJson(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return pyString(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite number is not canonicalisable");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort(compareCodePoints);
    return `{${keys.map((k) => `${pyString(k)}:${canonicalJson(value[k])}`).join(",")}}`;
  }
  throw new Error(`Cannot canonicalise ${typeof value}`);
}
export const canonicalBytes = (value) => textEncoder.encode(canonicalJson(value));

export async function sha256Hex(data) {
  const bytes = typeof data === "string" ? textEncoder.encode(data) : data;
  return bytesToHex(new Uint8Array(await subtle().digest("SHA-256", bytes)));
}

/** ent:<sha256(raw public key)[:32]> — generate_entity_id() in primitives/protocol. */
export const entityIdFor = async (publicKey) => `ent:${(await sha256Hex(publicKey)).slice(0, 32)}`;
/** sha256(canonical_json(content_dict))[:48] — main.py generate_content_id (v1.1 node). */
export const contentIdV1 = async (contentDict) => (await sha256Hex(canonicalBytes(contentDict))).slice(0, 48);
/** sha256("source:kind:target")[:32] — generate_link_id. */
export const linkIdFor = async (source, kind, target) => (await sha256Hex(`${source}:${kind}:${target}`)).slice(0, 32);
/** sha256("issuer:subject:type")[:32] — protocol.py generate_attestation_id (v2 node). */
export const attestationIdFor = async (issuer, subject, type) => (await sha256Hex(`${issuer}:${subject}:${type}`)).slice(0, 32);

/** True when this browser's WebCrypto can generate and sign with Ed25519 keys (probed each call; cheap). */
export async function ed25519Supported() {
  try {
    const pair = await subtle().generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
    const sig = await subtle().sign({ name: "Ed25519" }, pair.privateKey, textEncoder.encode("probe"));
    return sig.byteLength === 64;
  } catch { return false; }
}

/** Wraps a private JWK as an identity: entity id, hex public key, and a hex-signature function. */
export async function identityFromJwk(jwk) {
  const key = await subtle().importKey("jwk", jwk, { name: "Ed25519" }, false, ["sign"]);
  const publicKey = b64urlToBytes(jwk.x);
  const signBytes = async (bytes) => bytesToHex(new Uint8Array(await subtle().sign({ name: "Ed25519" }, key, bytes)));
  return {
    jwk,
    publicKeyHex: bytesToHex(publicKey),
    entityId: await entityIdFor(publicKey),
    /** Signs a UTF-8 string (the auth challenge) and returns a 128-char hex signature. */
    sign: (message) => signBytes(textEncoder.encode(message)),
    /** Signs canonical_json(obj without `sig`) and returns obj with `sig` (hex) — sign_object() in crypto.py. */
    async signObject(obj) {
      const { sig: _drop, ...rest } = obj;
      return { ...rest, sig: await signBytes(canonicalBytes(rest)) };
    },
  };
}

export async function generateIdentity() {
  const pair = await subtle().generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const jwk = await subtle().exportKey("jwk", pair.privateKey);
  return identityFromJwk({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, d: jwk.d });
}

/** Verifies a hex signature over canonical_json(obj without `sig`) — verify_object_signature(). */
export async function verifyObject(obj, publicKeyHex) {
  try {
    const key = await subtle().importKey("raw", hexToBytes(publicKeyHex), { name: "Ed25519" }, false, ["verify"]);
    const { sig, ...rest } = obj;
    return await subtle().verify({ name: "Ed25519" }, key, hexToBytes(sig), canonicalBytes(rest));
  } catch { return false; }
}

// ─── Small helpers ────────────────────────────────────────────────────────────────────────

/** Servers emit datetime.utcnow().isoformat() (naive, no zone); treat those as UTC. */
export function parseTs(iso) {
  if (!iso) return null;
  const s = String(iso);
  const d = new Date(/(Z|[+-]\d\d:?\d\d)$/.test(s) ? s : `${s}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function shortTime(iso, now = new Date()) {
  const d = parseTs(iso);
  if (!d) return "";
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86_400_000;
  if (d.getTime() >= startOfToday) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (d.getTime() >= startOfToday - day) return "Yesterday";
  if (d.getTime() >= startOfToday - 6 * day) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function normalizeNodeUrl(input) {
  let s = String(input || "").trim();
  if (!s) throw new Error("Enter a node URL");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `http://${s}`;
  const u = new URL(s);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Node URL must be http(s)");
  return `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
}

const shortId = (id) => (String(id || "").startsWith("ent:") ? `ent:${String(id).slice(4, 10)}…` : String(id || "").slice(0, 10));

/** Content bodies are a string (plain posts) or an object (`{text}` for DMs, structured posts). */
export function bodyText(body) {
  if (body === null || body === undefined) return "";
  if (typeof body === "string") return body;
  if (typeof body === "object") return typeof body.text === "string" ? body.text : typeof body.content === "string" ? body.content : JSON.stringify(body);
  return String(body);
}

// ─── Moderation labels (attestations) ─────────────────────────────────────────────────────

/** AttestationType in protocol.py. `tone` drives the badge colour; `hide` types fold the message by default. */
export const LABEL_TYPES = {
  spam: { tone: "bad", text: "Spam", hide: true },
  nsfw: { tone: "bad", text: "NSFW", hide: true },
  harassment: { tone: "bad", text: "Harassment", hide: true },
  misleading: { tone: "warn", text: "Misleading", hide: false },
  verified: { tone: "ok", text: "Verified", hide: false },
  trusted: { tone: "ok", text: "Trusted", hide: false },
  bot: { tone: "info", text: "Bot", hide: false },
};
export const MESSAGE_LABELS = ["spam", "nsfw", "misleading", "harassment"];

export function normalizeLabel(raw) {
  const type = String(raw?.type || "");
  let claim = raw?.claim;
  if (typeof claim === "string") { try { claim = JSON.parse(claim); } catch { claim = {}; } }
  return { id: raw?.id || `${raw?.issuer}:${type}`, type, issuer: raw?.issuer || "", claim: claim && typeof claim === "object" ? claim : {}, confidence: raw?.confidence ?? 1, revoked: Boolean(raw?.revoked) };
}

// ─── Normalisation of node payloads ───────────────────────────────────────────────────────

export function normalizeEntity(raw) {
  const profile = raw?.profile && typeof raw.profile === "object" ? raw.profile : {};
  const id = raw?.id || raw?.entity_id || "";
  const handle = raw?.handle || null;
  const kind = raw?.kind || "user";
  return {
    id, handle, kind, profile,
    name: profile.name || (handle ? `@${handle}` : shortId(id)),
    agent: kind === "bot" || profile.agent === true || profile.kind === "agent",
    bio: profile.bio || "",
    encryptionKey: raw?.encryption_key || null,
  };
}

export function normalizeContent(raw) {
  const profile = raw?.author_profile && typeof raw.author_profile === "object" ? raw.author_profile : {};
  const handle = raw?.author_handle || null;
  return {
    id: raw?.id,
    author: raw?.author,
    authorHandle: handle,
    authorName: raw?.author_name || profile.name || (handle ? `@${handle}` : null),
    authorAgent: profile.agent === true || profile.kind === "agent",
    kind: raw?.kind || "post",
    body: bodyText(raw?.body),
    replyTo: raw?.reply_to || null,
    createdAt: raw?.created_at || null,
    likeCount: raw?.like_count || 0,
    replyCount: raw?.reply_count || 0,
    labels: (raw?.moderation_labels || []).map(normalizeLabel),
    media: Array.isArray(raw?.media) ? raw.media : [],
  };
}

// ─── MESH node client ────────────────────────────────────────────────────────────────────

export class MeshError extends Error {
  constructor(message, { status = 0, detail = "" } = {}) {
    super(message);
    this.name = "MeshError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * HTTP client for a MESH node. Every path below was checked against the Python servers:
 *   v1.1 (main.py)        v2.0 (server_v2.py)
 * Authenticated calls carry the session token as the `?token=` query parameter (FastAPI `Query`).
 */
export class MeshClient {
  constructor(baseUrl, { fetch: fetchImpl, timeoutMs = 6000, token = "" } = {}) {
    this.baseUrl = normalizeNodeUrl(baseUrl);
    this.fetchImpl = fetchImpl || ((...args) => globalThis.fetch(...args));
    this.timeoutMs = timeoutMs;
    this.token = token;
    this.me = "";
    this.flavor = "v1";
    this.mode = "node";
    this.seen = new Map(); // v2 has no replies endpoint; replies are derived from everything fetched
    this.caps = capsFor("v1");
  }

  get signedIn() { return Boolean(this.token && this.me); }

  async request(method, path, { query = {}, body, auth = false } = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") params.set(k, String(v)); });
    if (auth) {
      if (!this.token) throw new MeshError("Sign in to do that", { status: 401 });
      params.set("token", this.token);
    }
    const qs = params.toString();
    const url = `${this.baseUrl}${path}${qs ? `?${qs}` : ""}`;
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), this.timeoutMs) : 0;
    let res;
    try {
      res = await this.fetchImpl(url, { method, headers: body === undefined ? {} : { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), signal: ctl?.signal });
    } catch (err) {
      throw new MeshError(err?.name === "AbortError" ? `No answer from ${this.baseUrl}` : `Cannot reach ${this.baseUrl}`, { detail: String(err?.message || err) });
    } finally { clearTimeout(timer); }
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) {
      const detail = typeof data?.detail === "string" ? data.detail : data?.detail ? JSON.stringify(data.detail) : "";
      throw new MeshError(detail || `Node answered ${res.status}`, { status: res.status, detail });
    }
    return data;
  }

  /** GET /.well-known/mesh-node -> { node_id, node_url, protocol_version, features } (both servers). */
  async info() {
    const d = await this.request("GET", "/.well-known/mesh-node");
    if (!d || typeof d !== "object" || !d.node_id) throw new MeshError("Not a MESH node (no /.well-known/mesh-node)");
    this.flavor = String(d.protocol_version || "").startsWith("2") ? "v2" : "v1";
    this.caps = capsFor(this.flavor);
    return { nodeId: d.node_id, nodeUrl: d.node_url, protocolVersion: String(d.protocol_version || ""), features: d.features || [], flavor: this.flavor };
  }

  /** POST /api/entities {public_key, encryption_key?, handle?, profile} -> {id, handle}. 409 if the entity or handle exists. */
  async createEntity({ publicKeyHex, encryptionKeyHex, handle, profile = {} }) {
    return this.request("POST", "/api/entities", { body: { public_key: publicKeyHex, encryption_key: encryptionKeyHex || null, handle: handle || null, profile } });
  }

  /** POST /api/auth/challenge {entity_id} -> {challenge}; sign the challenge text; POST /api/auth/verify -> {token}. */
  async signIn(identity) {
    const ch = await this.request("POST", "/api/auth/challenge", { body: { entity_id: identity.entityId } });
    const signature = await identity.sign(ch.challenge);
    const res = await this.request("POST", "/api/auth/verify", { body: { entity_id: identity.entityId, challenge: ch.challenge, signature } });
    this.token = res.token;
    this.me = identity.entityId;
    return { token: res.token, expiresAt: res.expires_at || null };
  }

  useSession(token, entityId) { this.token = token; this.me = entityId; }

  /** POST /api/auth/logout (v1.1 only). */
  async signOut() {
    if (this.flavor === "v1" && this.token) await this.request("POST", "/api/auth/logout", { auth: true }).catch(() => {});
    this.token = ""; this.me = "";
  }

  /** GET /api/entities/{id} -> Entity.to_dict() */
  async entity(id) { return normalizeEntity(await this.request("GET", `/api/entities/${encodeURIComponent(id)}`)); }

  /** Entity id directly, or a handle via GET /api/entities/by-handle/{handle} (v1.1 only). */
  async lookup(query) {
    const q = String(query || "").trim().replace(/^@/, "");
    if (!q) throw new MeshError("Enter an entity id or handle");
    if (q.startsWith("ent:")) return this.entity(q);
    if (this.flavor === "v2") throw new MeshError("This node cannot look up handles; paste an entity id (ent:…)");
    return normalizeEntity(await this.request("GET", `/api/entities/by-handle/${encodeURIComponent(q)}`));
  }

  remember(items) { items.forEach((m) => { if (m.id) this.seen.set(m.id, m); }); return items; }

  /** v1.1: GET /api/users/{me}/feed?labels=true (home_timeline view). v2: GET /api/feed?token=. */
  async feedFollowing(limit = 50) {
    if (this.flavor === "v2") {
      const d = await this.request("GET", "/api/feed", { query: { limit }, auth: true });
      return this.remember((d.items || []).map(normalizeContent)).reverse();
    }
    if (!this.me) throw new MeshError("Sign in to see the accounts you follow", { status: 401 });
    const d = await this.request("GET", `/api/users/${encodeURIComponent(this.me)}/feed`, { query: { limit, labels: "true" } });
    return this.remember((d.items || []).map(normalizeContent)).reverse();
  }

  /** v1.1: GET /api/content (public, top-level). v2 has no global listing. */
  async feedGlobal(limit = 50) {
    if (!this.caps.globalFeed) throw new MeshError("This node has no global feed endpoint");
    const d = await this.request("GET", "/api/content", { query: { limit } });
    return this.remember((d.items || []).map(normalizeContent)).reverse();
  }

  /** v1.1: GET /api/content?author=; v2: GET /api/timeline/{entity_id}. */
  async timeline(entityId, limit = 50) {
    const d = this.flavor === "v2"
      ? await this.request("GET", `/api/timeline/${encodeURIComponent(entityId)}`, { query: { limit } })
      : await this.request("GET", "/api/content", { query: { author: entityId, limit } });
    return this.remember((d.items || []).map(normalizeContent)).reverse();
  }

  /** v1.1: GET /api/content?reply_to=<id>. v2: derived from already-fetched feed/timeline items (no endpoint). */
  async replies(contentId) {
    if (this.flavor === "v2") return [...this.seen.values()].filter((m) => m.replyTo === contentId).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    const d = await this.request("GET", "/api/content", { query: { reply_to: contentId, limit: 100 } });
    return this.remember((d.items || []).map(normalizeContent)).reverse();
  }

  /**
   * v1.1: POST /api/content {kind: post|reply, body, reply_to, access:"public"} -> {id}
   * v2:   POST /api/content {author, kind, body, media, reply_to} -> {id}. v2 only lists kinds
   *       post/reply in feeds (get_feed/get_timeline) and ContentKind has no "reply", so replies are posts with reply_to.
   */
  async post(text, { replyTo = null } = {}) {
    const body = this.flavor === "v2"
      ? { author: this.me, kind: "post", body: text, media: [], reply_to: replyTo }
      : { kind: replyTo ? "reply" : "post", body: text, reply_to: replyTo, access: "public" };
    return this.request("POST", "/api/content", { body, auth: true });
  }

  /** v1.1: GET /api/messages/conversations. v2 has no DM read endpoint (DMs are stored encrypted). */
  async conversations() {
    if (!this.caps.dmRead) return [];
    const d = await this.request("GET", "/api/messages/conversations", { auth: true });
    return (d.conversations || []).map((c) => ({ id: c.participantId, handle: c.participantHandle, name: c.participantName, last: c.lastMessage || "", lastAt: c.lastMessageAt }));
  }

  /** v1.1: GET /api/messages/{participant_id} -> {messages: [{id, senderId, content, timestamp}]} */
  async messages(participantId) {
    if (!this.caps.dmRead) return [];
    const d = await this.request("GET", `/api/messages/${encodeURIComponent(participantId)}`, { auth: true });
    return (d.messages || []).map((m) => ({ id: m.id, author: m.senderId, authorHandle: null, authorName: null, authorAgent: false, kind: "dm", body: bodyText(m.content), replyTo: null, createdAt: m.timestamp, likeCount: 0, replyCount: 0, labels: [], media: [] }));
  }

  /** v1.1: POST /api/messages {recipient_id, content}. v2: POST /api/dm {author, recipient, body} (needs the recipient's encryption key). */
  async sendDm(participantId, text) {
    if (this.flavor === "v2") return this.request("POST", "/api/dm", { body: { author: this.me, recipient: participantId, body: text }, auth: true });
    return this.request("POST", "/api/messages", { body: { recipient_id: participantId, content: text }, auth: true });
  }

  /** POST /api/links {target, kind:"follow", data|metadata}. v1.1 answers 409 when already following. */
  async follow(targetId) {
    try {
      return await this.request("POST", "/api/links", { body: this.flavor === "v2" ? { target: targetId, kind: "follow", metadata: {} } : { target: targetId, kind: "follow", data: {} }, auth: true });
    } catch (err) {
      if (err.status === 409) return { id: await linkIdFor(this.me, "follow", targetId) };
      throw err;
    }
  }

  /** v1.1: DELETE /api/links/{link_id} (link_id = sha256("me:follow:target")[:32]). v2: DELETE /api/links?target=&kind=follow. */
  async unfollow(targetId) {
    if (this.flavor === "v2") return this.request("DELETE", "/api/links", { query: { target: targetId, kind: "follow" }, auth: true });
    return this.request("DELETE", `/api/links/${await linkIdFor(this.me, "follow", targetId)}`, { auth: true });
  }

  /** v1.1: GET /api/users/{id}/following -> {items:[{id,handle,profile}]}. v2 has no listing. */
  async following() {
    if (this.flavor === "v2" || !this.me) return [];
    const d = await this.request("GET", `/api/users/${encodeURIComponent(this.me)}/following`);
    return (d.items || []).map(normalizeEntity);
  }

  /** v2: GET /api/subjects/{subject}/labels?viewer=<me> -> {labels:[Attestation], resolution?}. v1.1 labels ride on feed items. */
  async labels(subjects) {
    const out = new Map();
    if (!this.caps.labelRead) return out;
    await Promise.all(subjects.map(async (s) => {
      try {
        const d = await this.request("GET", `/api/subjects/${encodeURIComponent(s)}/labels`, { query: { viewer: this.me } });
        out.set(s, (d.labels || []).map(normalizeLabel).filter((l) => !l.revoked));
      } catch { /* labels are best-effort */ }
    }));
    return out;
  }

  /** v2: POST /api/attestations {subject, type, claim, evidence, confidence}. */
  async attest(subject, type, claim = {}) {
    if (!this.caps.labelWrite) throw new MeshError("This node does not accept attestations");
    return this.request("POST", "/api/attestations", { body: { subject, type, claim, evidence: null, confidence: 1.0 }, auth: true });
  }

  /** v2: GET /api/sync/{actor}/heads -> {actor, heads:[event ids]} (multi-head DAG). */
  async heads(actor) {
    if (this.flavor !== "v2") return null;
    const d = await this.request("GET", `/api/sync/${encodeURIComponent(actor)}/heads`);
    return d.heads || [];
  }
}

function capsFor(flavor) {
  const v2 = flavor === "v2";
  return { globalFeed: !v2, dmRead: !v2, dmSend: true, labelRead: v2, labelWrite: v2, feedNeedsAuth: v2, handleLookup: !v2, replies: true };
}

// ─── Demo node: the same interface, in memory ─────────────────────────────────────────────

const DEMO_ME = "ent:demo00000000000000000000000000";
const DEMO_ENTITIES = [
  { id: DEMO_ME, handle: "you", kind: "user", profile: { name: "You" } },
  { id: "ent:ada00000000000000000000000000000", handle: "ada", kind: "user", profile: { name: "Ada Lovelace", bio: "Protocol nerd." } },
  { id: "ent:lin00000000000000000000000000000", handle: "lin", kind: "user", profile: { name: "Lin Wei", bio: "Runs the relay." } },
  { id: "ent:atlas000000000000000000000000000", handle: "atlas", kind: "bot", profile: { name: "Atlas", bio: "Conductor agent.", agent: true } },
  { id: "ent:nova0000000000000000000000000000", handle: "nova", kind: "bot", profile: { name: "Nova", bio: "Scout agent.", agent: true } },
  { id: "ent:sentinel00000000000000000000000", handle: "sentinel", kind: "bot", profile: { name: "Sentinel", bio: "Labeler: composes moderation attestations.", agent: true } },
];

/** An in-memory node with sample people, agents, replies and moderation labels. */
export function createDemoClient(now = Date.now()) {
  const ago = (min) => new Date(now - min * 60_000).toISOString();
  const [, ada, lin, atlas, nova, sentinel] = DEMO_ENTITIES.map((e) => e.id);
  const entities = new Map(DEMO_ENTITIES.map((e) => [e.id, normalizeEntity(e)]));
  let seq = 0;
  const mk = (author, body, minutes, replyTo = null) => {
    seq += 1;
    return { id: `demo-c${seq}`, author, authorHandle: null, authorName: null, authorAgent: false, kind: "post", body, replyTo, createdAt: ago(minutes), likeCount: 0, replyCount: 0, labels: [], media: [] };
  };
  const content = [];
  const first = mk(ada, "Welcome to **MESH Hangout**. Every message here is content in a signed DAG, and every member is an Ed25519 identity.", 190);
  const q = mk(lin, "Does the feed order depend on who is asking?", 120);
  const spam = mk(nova, "BUY NOW!!! limited offer http://example.com/free", 90);
  const tips = mk(atlas, "Three things I can do for you:\n\n- Summarise the **global feed**\n- Draft a reply\n- Label spam with `spam`\n\n```js\nawait mesh.post('hi')\n```", 60);
  content.push(first, q, spam, tips,
    mk(ada, "No: feeds are deterministic views over the DAG, so the same inputs give the same order.", 110, q.id),
    mk(sentinel, "Spam from a bot account, labeling it for everyone who trusts me.", 85, spam.id),
    mk(lin, "Nice. Moderation as attestations means I choose which labelers to trust.", 40));
  const labels = new Map([
    [spam.id, [{ id: "att-1", type: "spam", issuer: sentinel, claim: { reason: "unsolicited link" }, confidence: 0.97, revoked: false }]],
    [q.id, []],
    [ada, [{ id: "att-2", type: "verified", issuer: sentinel, claim: {}, confidence: 1, revoked: false }]],
    [atlas, [{ id: "att-3", type: "bot", issuer: sentinel, claim: {}, confidence: 1, revoked: false }]],
    [nova, [{ id: "att-4", type: "bot", issuer: sentinel, claim: {}, confidence: 1, revoked: false }]],
  ]);
  const follows = new Set([ada, lin, atlas]);
  const dms = new Map([[atlas, [{ id: "demo-d1", author: atlas, body: "Hi! I am Atlas. Ask me to **summarise** anything.", createdAt: ago(30) }]]]);
  const dmItem = (m) => ({ id: m.id, author: m.author, authorHandle: null, authorName: null, authorAgent: false, kind: "dm", body: m.body, replyTo: null, createdAt: m.createdAt, likeCount: 0, replyCount: 0, labels: [], media: [] });
  const withCounts = (m) => ({ ...m, labels: labels.get(m.id) || [], replyCount: content.filter((c) => c.replyTo === m.id).length });
  const byTime = (a, b) => String(a.createdAt).localeCompare(String(b.createdAt));

  return {
    mode: "demo", flavor: "demo", token: "demo", me: DEMO_ME, signedIn: true,
    caps: { globalFeed: true, dmRead: true, dmSend: true, labelRead: true, labelWrite: true, feedNeedsAuth: false, handleLookup: true, replies: true },
    async info() { return { nodeId: "demo-node", nodeUrl: "memory://demo", protocolVersion: "demo", features: ["dag", "attestations", "views"], flavor: "demo" }; },
    async entity(id) { const e = entities.get(id); if (!e) throw new MeshError("Not found", { status: 404 }); return e; },
    async lookup(query) {
      const q2 = String(query || "").trim().replace(/^@/, "");
      const e = [...entities.values()].find((x) => x.id === q2 || x.handle === q2);
      if (!e) throw new MeshError("Entity not found", { status: 404 });
      return e;
    },
    async feedFollowing() { return content.filter((c) => !c.replyTo && (follows.has(c.author) || c.author === DEMO_ME)).map(withCounts).sort(byTime); },
    async feedGlobal() { return content.filter((c) => !c.replyTo).map(withCounts).sort(byTime); },
    async timeline(id) { return content.filter((c) => c.author === id).map(withCounts).sort(byTime); },
    async replies(id) { return content.filter((c) => c.replyTo === id).map(withCounts).sort(byTime); },
    async post(text, { replyTo = null } = {}) {
      seq += 1;
      const m = { id: `demo-c${seq}`, author: DEMO_ME, authorHandle: "you", authorName: "You", authorAgent: false, kind: "post", body: text, replyTo, createdAt: new Date().toISOString(), likeCount: 0, replyCount: 0, labels: [], media: [] };
      content.push(m);
      return { id: m.id };
    },
    async conversations() {
      return [...dms.entries()].map(([id, list]) => ({ id, handle: entities.get(id)?.handle, name: entities.get(id)?.name, last: list.at(-1)?.body.slice(0, 50) || "", lastAt: list.at(-1)?.createdAt }));
    },
    async messages(id) { return (dms.get(id) || []).map(dmItem); },
    async sendDm(id, text) {
      const list = dms.get(id) || [];
      seq += 1;
      list.push({ id: `demo-d${seq}`, author: DEMO_ME, body: text, createdAt: new Date().toISOString() });
      dms.set(id, list);
      return { id: `demo-d${seq}`, status: "sent" };
    },
    async follow(id) { follows.add(id); return { id: await linkIdFor(DEMO_ME, "follow", id) }; },
    async unfollow(id) { follows.delete(id); return { status: "deleted" }; },
    async following() { return [...follows].map((id) => entities.get(id)).filter(Boolean); },
    async labels(subjects) { return new Map(subjects.map((s) => [s, labels.get(s) || []])); },
    async attest(subject, type, claim = {}) {
      const list = labels.get(subject) || [];
      list.push({ id: `att-${list.length + 10}`, type, issuer: DEMO_ME, claim, confidence: 1, revoked: false });
      labels.set(subject, list);
      return { id: await attestationIdFor(DEMO_ME, subject, type) };
    },
    async heads() { return ["demo-head"]; },
    useSession() {}, async signIn() { return { token: "demo" }; }, async signOut() {},
    entities: () => [...entities.values()],
  };
}

// ─── Markdown: built as DOM, never as HTML ────────────────────────────────────────────────

const SAFE_URL = /^(https?:\/\/|mailto:)/i;
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*|__[^_\n]+__)|(~~[^~\n]+~~)|(\[[^\]\n]+\]\([^)\s]+\))|(\bhttps?:\/\/[^\s<>)]+[^\s<>).,;:!?])|(\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)/g;

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
    renderInline(li, it.text);
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

export function renderMarkdown(source) {
  const root = document.createElement("div");
  root.className = "md";
  const lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
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
      i += 1;
      root.append(codeBlock(open[1], code));
      continue;
    }
    if (!line.trim()) { flush(); i += 1; continue; }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) { flush(); const h = document.createElement(`h${Math.min(heading[1].length + 2, 6)}`); renderInline(h, heading[2]); root.append(h); i += 1; continue; }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); root.append(document.createElement("hr")); i += 1; continue; }
    if (/^\s*>/.test(line)) {
      flush();
      const quote = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { quote.push(lines[i].replace(/^\s*>\s?/, "")); i += 1; }
      const bq = document.createElement("blockquote");
      quote.forEach((qline, n) => { if (n) bq.append(document.createElement("br")); renderInline(bq, qline); });
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
  return root;
}

export function plainText(source) {
  return String(source || "")
    .replace(/```[\s\S]*?(```|$)/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/(\*\*|__|~~)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*([-*+]|\d+[.)])\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Styles ───────────────────────────────────────────────────────────────────────────────

const CSS = `
.mh { --hg-bg: var(--oh-color-base, #171717); --hg-panel: var(--oh-color-base-secondary, #212121); --hg-raised: var(--oh-surface-raised, #2a2a2a);
  --hg-text: var(--oh-foreground, #eee); --hg-contrast: var(--oh-contrast, #fff); --hg-muted: var(--oh-muted, #9a9a9a);
  --hg-border: var(--oh-border-subtle, #3a3a3a); --hg-primary: var(--oh-color-primary, #fff); --hg-on-primary: var(--oh-accent-foreground, #111);
  --hg-ok: var(--oh-success, #34d399); --hg-warn: #f2b51d; --hg-bad: #ef4444; --hg-info: #7c9dff;
  box-sizing: border-box; position: sticky; top: 0; color: var(--hg-text); background: var(--hg-bg); font: 14px/1.45 system-ui, sans-serif;
  height: 100dvh; max-height: 100dvh; min-height: 480px; overflow: hidden; overscroll-behavior: contain; }
.mh *, .mh *::before, .mh *::after { box-sizing: border-box; }
.mh button, .mh input, .mh textarea, .mh select { font: inherit; color: inherit; }
.mh button { cursor: pointer; }
.mh .shell { display: grid; grid-template-columns: 300px minmax(0, 1fr) 280px; height: 100%; min-height: 0; }
.mh .shell.welcoming { grid-template-columns: 300px minmax(0, 1fr); }
.mh .col { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.mh .list { border-right: 1px solid var(--hg-border); background: var(--hg-bg); }
.mh .members { border-left: 1px solid var(--hg-border); background: var(--hg-bg); }
.mh .lhead, .mh .chead, .mh .mhead { flex: none; display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--hg-border); min-height: 56px; }
.mh .lhead h2, .mh .chead h2, .mh .mhead h2 { margin: 0; font-size: 15px; font-weight: 650; color: var(--hg-contrast); }
.mh .lhead .grow, .mh .chead .grow { flex: 1; min-width: 0; }
.mh .chead small, .mh .sub { color: var(--hg-muted); font-size: 12px; }
.mh .scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 8px; }
.mh .sect { margin: 10px 8px 4px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--hg-muted); }
.mh .row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border: 0; border-radius: 12px; background: transparent; text-align: left; }
.mh .row:hover { background: var(--hg-panel); }
.mh .row[aria-current="true"] { background: var(--hg-raised); }
.mh .row .meta { min-width: 0; flex: 1; display: grid; }
.mh .row .name { font-weight: 550; color: var(--hg-contrast); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mh .row .prev { font-size: 12px; color: var(--hg-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mh .glyph { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 12px; background: var(--hg-panel); color: var(--hg-muted); font-weight: 700; }
.mh .avatar { flex: none; width: 36px; height: 36px; }
.mh .avatar svg { width: 100%; height: 100%; display: block; }
.mh .avatar.sm { width: 28px; height: 28px; }
.mh .status { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: 12px; border: 1px solid var(--hg-border); background: var(--hg-panel); color: var(--hg-text); }
.mh .status i { width: 8px; height: 8px; border-radius: 50%; background: var(--hg-muted); }
.mh .status[data-mode="connected"] i { background: var(--hg-ok); }
.mh .status[data-mode="demo"] i { background: var(--hg-warn); }
.mh .status[data-mode="connecting"] i { background: var(--hg-info); }
.mh .iconbtn { border: 0; background: transparent; border-radius: 10px; padding: 6px 8px; color: var(--hg-muted); }
.mh .iconbtn:hover { background: var(--hg-panel); color: var(--hg-contrast); }
.mh .notice { flex: none; margin: 8px 14px 0; padding: 8px 12px; border-radius: 10px; background: var(--hg-panel); border: 1px solid var(--hg-border); font-size: 13px; color: var(--hg-text); display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.mh .notice.warn { border-color: var(--hg-warn); }
.mh .notice.error { border-color: var(--hg-bad); }
.mh .notice button { border: 1px solid var(--hg-border); background: var(--hg-raised); border-radius: 8px; padding: 2px 10px; }
.mh .thread { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.mh .empty { margin: auto; text-align: center; color: var(--hg-muted); max-width: 320px; }
.mh .msg { display: flex; gap: 10px; align-items: flex-start; }
.mh .msg.reply { margin-left: 38px; }
.mh .msg .mbody { min-width: 0; flex: 1; }
.mh .msg .who { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.mh .msg .who b { color: var(--hg-contrast); font-weight: 600; }
.mh .msg .who small { color: var(--hg-muted); font-size: 12px; }
.mh .msg .quote { margin: 2px 0; font-size: 12px; color: var(--hg-muted); border-left: 2px solid var(--hg-border); padding-left: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mh .msg.me .bubble { background: var(--hg-primary); color: var(--hg-on-primary); }
.mh .bubble { display: inline-block; max-width: min(100%, 640px); margin-top: 3px; padding: 8px 14px; border-radius: 16px; background: var(--hg-raised); overflow-wrap: anywhere; }
.mh .msg.me .bubble .md a, .mh .msg.me .bubble .md strong { color: inherit; }
.mh .acts { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px; opacity: .85; }
.mh .acts button { border: 0; background: transparent; color: var(--hg-muted); font-size: 12px; padding: 2px 6px; border-radius: 6px; }
.mh .acts button:hover { background: var(--hg-panel); color: var(--hg-contrast); }
.mh .badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 0 7px; line-height: 18px; border-radius: 999px; border: 1px solid currentColor; }
.mh .badge.bad { color: var(--hg-bad); } .mh .badge.warn { color: var(--hg-warn); } .mh .badge.ok { color: var(--hg-ok); } .mh .badge.info { color: var(--hg-info); }
.mh .folded { display: inline-flex; gap: 8px; align-items: center; margin-top: 3px; padding: 6px 12px; border-radius: 12px; border: 1px dashed var(--hg-border); color: var(--hg-muted); font-size: 13px; }
.mh .folded button { border: 0; background: transparent; color: var(--hg-info); text-decoration: underline; }
.mh .menu { position: absolute; z-index: 5; background: var(--hg-raised); border: 1px solid var(--hg-border); border-radius: 10px; padding: 4px; display: grid; min-width: 150px; box-shadow: 0 8px 24px rgba(0,0,0,.35); }
.mh .menu button { border: 0; background: transparent; text-align: left; padding: 6px 10px; border-radius: 6px; }
.mh .menu button:hover { background: var(--hg-panel); }
.mh .composerwrap { flex: none; padding: 8px 16px 14px; background: var(--hg-bg); }
.mh .composerbox { border: 1px solid var(--hg-border); border-radius: 18px; background: var(--hg-panel); padding: 8px 10px; display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap; }
.mh .composerbox:focus-within { border-color: var(--hg-muted); }
.mh .composerbox .chip { flex-basis: 100%; font-size: 12px; color: var(--hg-muted); display: flex; gap: 8px; align-items: center; }
.mh .composerbox .chip button { border: 0; background: transparent; color: var(--hg-info); }
.mh .composerbox textarea { flex: 1; min-width: 0; resize: none; border: 0; outline: 0; background: transparent; padding: 6px 4px; max-height: 160px; }
.mh .send { border: 0; border-radius: 999px; background: var(--hg-primary); color: var(--hg-on-primary); padding: 7px 16px; font-weight: 500; }
.mh .send:disabled, .mh textarea:disabled { opacity: .45; cursor: not-allowed; }
.mh .search { display: flex; gap: 6px; padding: 8px 12px; }
.mh .search input, .mh .modal input, .mh .modal textarea, .mh .modal select { flex: 1; min-width: 0; border: 1px solid var(--hg-border); border-radius: 10px; background: var(--hg-panel); padding: 7px 10px; outline: 0; }
.mh .search button, .mh .modal button.btn { border: 1px solid var(--hg-border); background: var(--hg-raised); border-radius: 10px; padding: 6px 12px; }
.mh .mrow { display: flex; gap: 10px; align-items: center; padding: 8px 10px; border-radius: 12px; }
.mh .mrow:hover { background: var(--hg-panel); }
.mh .mrow .meta { flex: 1; min-width: 0; display: grid; cursor: pointer; }
.mh .mrow .name { font-weight: 550; color: var(--hg-contrast); display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.mh .mrow .follow { border: 1px solid var(--hg-border); background: transparent; border-radius: 999px; font-size: 12px; padding: 1px 10px; }
.mh .powered { display: flex; align-items: center; gap: 6px; color: var(--hg-muted); font-size: 12px; }
.mh .powered b { color: var(--hg-text); font-weight: 600; }
.mh .lpowered { flex: none; justify-content: center; padding: 8px 10px; border-top: 1px solid var(--hg-border); }
.mh .poweredmark { width: 18px; height: 18px; display: inline-block; }
.mh .poweredmark svg { width: 100%; height: 100%; }
.mh .welcome { flex: 1; position: relative; display: grid; place-items: center; align-content: center; text-align: center; overflow: hidden; padding: 24px; }
.mh .welcome .worb { width: 160px; height: 160px; margin: 0 auto 18px; }
.mh .welcome .worb svg { width: 100%; height: 100%; }
.mh .welcome .minis { display: flex; gap: 14px; justify-content: center; margin-bottom: 18px; }
.mh .welcome h1 { margin: 0 0 6px; font-size: 40px; font-weight: 300; letter-spacing: -.01em; color: var(--hg-contrast); }
.mh .welcome p { margin: 0 auto 18px; max-width: 360px; font-weight: 300; color: var(--hg-muted); }
.mh .welcome .wgo { border: 0; border-radius: 999px; background: var(--hg-contrast); color: var(--hg-bg); padding: 10px 22px; }
.mh .welcome .wpowered { position: absolute; left: 0; right: 0; bottom: 16px; justify-content: center; }
.mh .overlay { position: absolute; inset: 0; background: rgba(0,0,0,.5); display: grid; place-items: center; z-index: 10; padding: 16px; }
.mh .modal { width: min(520px, 100%); max-height: 100%; overflow-y: auto; background: var(--hg-panel); border: 1px solid var(--hg-border); border-radius: 16px; padding: 18px; display: grid; gap: 10px; }
.mh .modal h3 { margin: 0; color: var(--hg-contrast); }
.mh .modal label { display: grid; gap: 4px; font-size: 12px; color: var(--hg-muted); }
.mh .modal .line { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.mh .modal .hint { font-size: 12px; color: var(--hg-muted); }
.mh .modal code { font: 12px ui-monospace, SF Mono, Menlo, monospace; word-break: break-all; }
.mh .md { display: grid; gap: 8px; min-width: 0; line-height: 1.5; }
.mh .md p, .mh .md ul, .mh .md ol, .mh .md blockquote, .mh .md h3, .mh .md h4, .mh .md h5, .mh .md h6, .mh .md hr { margin: 0; }
.mh .md h3, .mh .md h4, .mh .md h5, .mh .md h6 { font-size: 15px; font-weight: 650; color: var(--hg-contrast); }
.mh .md strong { font-weight: 650; color: var(--hg-contrast); }
.mh .md a { color: var(--hg-info); text-decoration: underline; text-underline-offset: 2px; }
.mh .md ul, .mh .md ol { padding-left: 22px; display: grid; gap: 3px; }
.mh .md blockquote { border-left: 3px solid var(--hg-border); padding: 2px 0 2px 12px; color: var(--hg-muted); }
.mh .md hr { border: 0; border-top: 1px solid var(--hg-border); }
.mh .md code { font: 12.5px ui-monospace, SF Mono, Menlo, monospace; background: rgba(255,255,255,.08); border-radius: 5px; padding: 1px 5px; overflow-wrap: anywhere; }
.mh .md .mdcode { border: 1px solid var(--hg-border); border-radius: 10px; overflow: hidden; background: #0e0e10; color: #eee; }
.mh .md .mdcodebar { display: flex; align-items: center; justify-content: space-between; padding: 4px 10px; font-size: 11px; color: #9a9a9a; border-bottom: 1px solid var(--hg-border); }
.mh .md .mdcodebar button { border: 0; background: transparent; color: #9a9a9a; font-size: 11px; }
.mh .md pre { margin: 0; padding: 10px 12px; overflow-x: auto; font: 12.5px/1.55 ui-monospace, SF Mono, Menlo, monospace; }
.mh .md pre code { background: none; padding: 0; }
.mh .md .mdtable { overflow-x: auto; border: 1px solid var(--hg-border); border-radius: 10px; }
.mh .md table { border-collapse: collapse; width: 100%; font-size: 13px; }
.mh .md th, .mh .md td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--hg-border); }
.mh .orb-body { transform-box: view-box; transform-origin: 32px 34px; animation: mhOrb 5s ease-in-out infinite alternate; }
.mh .orb-look { animation: mhLook 8s ease-in-out infinite; }
.mh .orb-blink { transform-box: view-box; transform-origin: 32px 33px; animation: mhBlink 6s infinite; }
@keyframes mhOrb { 0% { transform: scale(1, 1) rotate(0deg); } 100% { transform: scale(1.05, .95) rotate(-3deg); } }
@keyframes mhLook { 0%, 38% { transform: translateX(0); } 46%, 66% { transform: translateX(3px); } 76%, 92% { transform: translateX(-3px); } 100% { transform: translateX(0); } }
@keyframes mhBlink { 0%, 91%, 100% { transform: scaleY(1); } 94% { transform: scaleY(.1); } }
@media (prefers-reduced-motion: reduce) { .mh .orb-body, .mh .orb-look, .mh .orb-blink { animation: none; } }
.mh .back { display: none; }
@media (max-width: 1000px) { .mh .shell { grid-template-columns: 260px minmax(0, 1fr); } .mh .shell.welcoming { grid-template-columns: 260px minmax(0, 1fr); } .mh .members { display: none; } }
@media (max-width: 700px) {
  .mh .shell, .mh .shell.welcoming { grid-template-columns: minmax(0, 1fr); }
  .mh[data-pane="list"] .main, .mh[data-pane="chat"] .list { display: none; }
  .mh .back { display: inline-block; }
}
`;

// ─── The page ─────────────────────────────────────────────────────────────────────────────

function el(tag, cls, content) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (content !== undefined) node.textContent = content;
  return node;
}

function btn(label, onClick, cls = "") {
  const b = el("button", cls, label);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}

function avatar(entityId, small) {
  const wrap = el("span", `avatar${small ? " sm" : ""}`);
  wrap.append(blobSvg(blobIdFor(entityId || "?")));
  return wrap;
}

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("MESH Hangout requires Canvas host API 1.");
  return host.registerPage("mesh-hangout", ({ container }) => mount(host, container));
}

const loadSaved = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } };

function mount(host, container) {
  const style = el("style", "", CSS);
  const root = el("div", "mh");
  root.dataset.pane = "list";
  container.append(style, root);
  let disposed = false;
  let pollTimer = 0;
  let connectRun = 0;
  let loadRun = 0;

  const saved = loadSaved();
  const cfg = {
    nodeUrl: saved.nodeUrl || DEFAULT_NODE,
    forceDemo: Boolean(saved.forceDemo),
    identity: saved.identity || null, // { jwk, handle, name, agent }
    tokens: saved.tokens || {},
    welcomed: Boolean(saved.welcomed),
    channel: saved.channel || "following",
  };
  const persist = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch { /* storage unavailable */ }
  };

  const state = {
    mode: "connecting", // connecting | connected | demo
    note: "",
    info: null,
    client: null,
    identity: null, // live identity object (with sign())
    channel: cfg.channel,
    messages: [],
    loading: false,
    error: "",
    entities: new Map(), // id -> normalized entity
    labels: new Map(), // subject -> labels
    following: new Set(),
    conversations: [],
    replyTo: null,
    expanded: new Map(), // message id -> loaded replies
    shown: new Set(), // folded messages the viewer chose to reveal
    menu: null,
    settings: false,
    draft: "",
    signNote: "",
    edSupported: true,
    heads: null,
    findError: "",
  };

  const me = () => state.client?.me || "";
  const poweredBy = (cls = "") => {
    const d = el("div", `powered${cls ? ` ${cls}` : ""}`);
    const hand = el("span", "poweredmark");
    hand.append(blobSvg("violet"));
    d.append(el("span", "", "Powered by"), hand, el("b", "", "Kamiji"), el("span", "", "and"), el("b", "kosmos", "Kosmos"));
    return d;
  };

  // ── Connection ──────────────────────────────────────────────────────────────────────────
  async function connect() {
    const run = ++connectRun;
    state.mode = "connecting"; state.note = ""; state.info = null; state.heads = null;
    renderAll();
    if (cfg.forceDemo) return enterDemo("Demo mode is on.");
    let client;
    try {
      client = new MeshClient(cfg.nodeUrl);
      state.info = await client.info();
    } catch (err) {
      if (run !== connectRun || disposed) return undefined;
      return enterDemo(`${err.message}. Showing Demo data until a node answers.`);
    }
    if (run !== connectRun || disposed) return undefined;
    state.client = client;
    state.mode = "connected";
    state.edSupported = await ed25519Supported();
    const token = cfg.tokens[client.baseUrl];
    if (cfg.identity?.jwk && state.edSupported) {
      try { state.identity = await identityFromJwk(cfg.identity.jwk); } catch { state.identity = null; }
    }
    if (state.identity && token) client.useSession(token, state.identity.entityId);
    else if (state.identity) await trySignIn(true);
    if (!state.edSupported) state.signNote = "This browser has no WebCrypto Ed25519: browsing is read-only. Use Demo mode or a newer browser to post.";
    else if (!state.identity) state.signNote = "Read-only: create or import an identity in Settings to post.";
    else if (!client.signedIn) state.signNote = state.signNote || "Signed out: sign in from Settings to post.";
    else state.signNote = "";
    await refreshSide();
    renderAll();
    await loadChannel();
    return undefined;
  }

  function enterDemo(note) {
    state.client = createDemoClient();
    state.mode = "demo";
    state.note = note;
    state.identity = null;
    state.signNote = "";
    state.entities = new Map(state.client.entities().map((e) => [e.id, e]));
    state.edSupported = true;
    return refreshSide().then(() => { renderAll(); return loadChannel(); });
  }

  async function trySignIn(silent) {
    if (!state.identity || !state.client || state.mode !== "connected") return false;
    try {
      const r = await state.client.signIn(state.identity);
      cfg.tokens[state.client.baseUrl] = r.token;
      persist();
      state.signNote = "";
      return true;
    } catch (err) {
      state.signNote = err.status === 404 ? "Your identity is not registered on this node yet. Register it in Settings." : `Sign-in failed: ${err.message}`;
      if (!silent) renderAll();
      return false;
    }
  }

  async function refreshSide() {
    const c = state.client;
    if (!c) return;
    try { state.conversations = await c.conversations(); } catch { state.conversations = []; }
    try {
      const f = await c.following();
      state.following = new Set(f.map((e) => e.id));
      f.forEach((e) => state.entities.set(e.id, e));
    } catch { /* optional */ }
    if (c.me && !state.entities.has(c.me)) await ensureEntities([c.me]);
    if (state.mode === "connected" && c.flavor === "v2" && c.me) { try { state.heads = await c.heads(c.me); } catch { state.heads = null; } }
  }

  async function ensureEntities(ids) {
    const missing = [...new Set(ids)].filter((id) => id && !state.entities.has(id)).slice(0, 25);
    await Promise.all(missing.map(async (id) => {
      try { state.entities.set(id, await state.client.entity(id)); } catch { /* unknown entity: shown by id */ }
    }));
  }

  // ── Channels ────────────────────────────────────────────────────────────────────────────
  const channelTitle = (id) => {
    if (id === "following") return "Following";
    if (id === "global") return "Global feed";
    const [kind, ref] = [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)];
    const e = state.entities.get(ref) || state.conversations.find((c) => c.id === ref);
    const name = e ? e.name : shortId(ref);
    return kind === "dm" ? name : `${name}'s timeline`;
  };
  const isDm = () => state.channel.startsWith("dm:");
  const isTimeline = () => state.channel.startsWith("tl:");

  async function fetchChannel() {
    const c = state.client;
    const id = state.channel;
    if (id === "following") return c.feedFollowing();
    if (id === "global") return c.feedGlobal();
    if (id.startsWith("tl:")) return c.timeline(id.slice(3));
    if (id.startsWith("dm:")) return c.messages(id.slice(3));
    return [];
  }

  async function loadChannel({ quiet = false } = {}) {
    const run = ++loadRun;
    if (!quiet) { state.loading = true; state.error = ""; renderThread(); renderHead(); }
    try {
      const items = await fetchChannel();
      if (run !== loadRun || disposed) return;
      state.messages = items;
      state.error = "";
      await decorate(items);
    } catch (err) {
      if (run !== loadRun || disposed) return;
      state.messages = [];
      state.error = err.status === 401 ? `${err.message}.` : `Could not load this channel: ${err.message}`;
    }
    state.loading = false;
    renderAll();
  }

  /** Fill in authors and labels for what is on screen. v1.1 labels ride on feed items; v2 asks per subject. */
  async function decorate(items) {
    const authors = items.flatMap((m) => [m.author]).filter(Boolean);
    await ensureEntities(authors);
    items.forEach((m) => {
      if (!state.entities.has(m.author) && (m.authorName || m.authorHandle)) {
        state.entities.set(m.author, normalizeEntity({ id: m.author, handle: m.authorHandle, kind: m.authorAgent ? "bot" : "user", profile: { name: m.authorName || undefined, agent: m.authorAgent || undefined } }));
      }
      if (m.labels.length) state.labels.set(m.id, m.labels);
    });
    if (state.client.caps.labelRead && !isDm()) {
      const subjects = [...new Set([...items.map((m) => m.id), ...authors])].filter((s) => !state.labels.has(s)).slice(0, 60);
      const got = await state.client.labels(subjects);
      got.forEach((v, k) => state.labels.set(k, v));
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────────────
  const canSend = () => {
    if (state.mode === "demo") return true;
    if (!state.client?.signedIn) return false;
    if (isTimeline() && !state.replyTo) return false;
    return true;
  };
  const composerReason = () => {
    if (state.mode !== "demo" && !state.client?.signedIn) return state.signNote || "Sign in to post.";
    if (isTimeline() && !state.replyTo) return "Timelines are read-only. Reply to a message to respond.";
    return "";
  };

  async function send() {
    const text = state.draft.trim();
    if (!text || !canSend()) return;
    const c = state.client;
    try {
      if (isDm()) {
        const pid = state.channel.slice(3);
        await c.sendDm(pid, text);
        if (c.flavor === "v2") state.messages = [...state.messages, { id: `local-${Date.now()}`, author: c.me, kind: "dm", body: text, replyTo: null, createdAt: new Date().toISOString(), labels: [], likeCount: 0, replyCount: 0, media: [], authorName: null, authorHandle: null, authorAgent: false }];
      } else {
        await c.post(text, { replyTo: state.replyTo?.id || null });
      }
      state.draft = "";
      const parent = state.replyTo;
      state.replyTo = null;
      state.error = "";
      if (parent) state.expanded.set(parent.id, await c.replies(parent.id));
      if (!(isDm() && c.flavor === "v2")) await loadChannel({ quiet: true });
      else renderAll();
      if (isDm()) refreshSide().then(renderRail);
    } catch (err) {
      state.error = `Send failed: ${err.message}`;
      renderAll();
    }
  }

  async function toggleFollow(id) {
    const c = state.client;
    try {
      if (state.following.has(id)) { await c.unfollow(id); state.following.delete(id); } else { await c.follow(id); state.following.add(id); }
      state.error = "";
    } catch (err) { state.error = `Follow failed: ${err.message}`; }
    renderAll();
    if (state.channel === "following") loadChannel({ quiet: true });
  }

  async function label(subject, type) {
    state.menu = null;
    try {
      await state.client.attest(subject, type, { by: "mesh-hangout" });
      const got = await state.client.labels([subject]);
      got.forEach((v, k) => state.labels.set(k, v));
      state.error = "";
    } catch (err) { state.error = `Labeling failed: ${err.message}`; }
    renderAll();
  }

  async function toggleReplies(m) {
    if (state.expanded.has(m.id)) state.expanded.delete(m.id);
    else {
      try {
        const replies = await state.client.replies(m.id);
        await decorate(replies);
        state.expanded.set(m.id, replies);
      } catch (err) { state.error = `Could not load replies: ${err.message}`; }
    }
    renderThread();
  }

  function openChannel(id) {
    state.channel = id; cfg.channel = id; persist();
    state.messages = []; state.replyTo = null; state.menu = null; state.expanded = new Map();
    root.dataset.pane = "chat";
    loadChannel();
  }

  // ── Rendering ───────────────────────────────────────────────────────────────────────────
  const shell = el("div", "shell");
  const listCol = el("aside", "col list");
  const mainCol = el("main", "col main");
  const memCol = el("aside", "col members");
  shell.append(listCol, mainCol, memCol);
  root.append(shell);
  const overlayHost = el("div", "overlays");
  root.append(overlayHost);

  const statusPill = () => {
    const s = el("span", "status");
    s.dataset.mode = state.mode;
    s.append(el("i"));
    const label = state.mode === "connected" ? `Connected · ${state.info?.nodeId || "node"}` : state.mode === "demo" ? "Demo" : "Connecting…";
    s.append(document.createTextNode(label));
    s.title = state.mode === "connected" ? `${cfg.nodeUrl} · MESH ${state.info?.protocolVersion || ""}` : state.note || "";
    return s;
  };

  function renderRail() {
    listCol.replaceChildren();
    const head = el("div", "lhead");
    const g = el("div", "grow");
    g.append(el("h2", "", "MESH Hangout"));
    const sub = el("div", "sub");
    sub.append(statusPill());
    g.append(sub);
    head.append(g, btn("⚙", () => { state.settings = true; renderOverlay(); }, "iconbtn"));
    head.lastChild.title = "Settings";
    head.lastChild.setAttribute("aria-label", "Settings");
    listCol.append(head);

    const scroll = el("div", "scroll");
    const row = (id, glyph, name, prev, ent) => {
      const b = el("button", "row");
      b.type = "button";
      if (state.channel === id) b.setAttribute("aria-current", "true");
      if (ent) b.append(avatar(ent)); else b.append(el("span", "glyph", glyph));
      const meta = el("span", "meta");
      meta.append(el("span", "name", name));
      if (prev) meta.append(el("span", "prev", prev));
      b.append(meta);
      b.addEventListener("click", () => { if (!cfg.welcomed) { cfg.welcomed = true; persist(); } openChannel(id); });
      return b;
    };
    scroll.append(el("div", "sect", "Feeds"));
    scroll.append(row("following", "★", "Following", "Accounts you follow"));
    if (state.client?.caps.globalFeed !== false) scroll.append(row("global", "◎", "Global feed", "Public posts on this node"));
    else scroll.append(row("global", "◎", "Global feed", "Not offered by this node"));

    scroll.append(el("div", "sect", "Direct messages"));
    const dmIds = new Set(state.conversations.map((c) => c.id));
    state.conversations.forEach((c) => scroll.append(row(`dm:${c.id}`, "", (state.entities.get(c.id)?.name) || c.name || c.handle || shortId(c.id), plainText(c.last), c.id)));
    if (state.channel.startsWith("dm:") && !dmIds.has(state.channel.slice(3))) {
      const id = state.channel.slice(3);
      scroll.append(row(state.channel, "", state.entities.get(id)?.name || shortId(id), "New conversation", id));
    }
    if (!state.conversations.length && state.client && !state.client.caps.dmRead) {
      const hint = el("div", "sub", "This node stores DMs encrypted and has no read endpoint; sending still works from a member's DM button.");
      hint.style.margin = "4px 10px";
      scroll.append(hint);
    }

    scroll.append(el("div", "sect", "Timelines"));
    const tlIds = [];
    if (me()) tlIds.push(me());
    state.following.forEach((id) => { if (!tlIds.includes(id)) tlIds.push(id); });
    [...state.entities.keys()].forEach((id) => { if (!tlIds.includes(id) && tlIds.length < 40) tlIds.push(id); });
    tlIds.forEach((id) => {
      const e = state.entities.get(id);
      scroll.append(row(`tl:${id}`, "", id === me() ? `${e?.name || "You"} (you)` : e?.name || shortId(id), e?.handle ? `@${e.handle}` : "", id));
    });
    if (state.channel.startsWith("tl:") && !tlIds.includes(state.channel.slice(3))) {
      const id = state.channel.slice(3);
      scroll.append(row(state.channel, "", state.entities.get(id)?.name || shortId(id), "", id));
    }
    listCol.append(scroll, poweredBy("lpowered"));
  }

  function renderHead() {
    const old = mainCol.querySelector(".chead");
    const head = el("div", "chead");
    head.append(btn("‹", () => { root.dataset.pane = "list"; }, "iconbtn back"));
    const g = el("div", "grow");
    g.append(el("h2", "", channelTitle(state.channel)));
    const detail = state.channel === "following" ? "Deterministic home timeline" : state.channel === "global" ? "Everything public on this node" : isDm() ? "Direct messages" : "Signed content from one entity";
    g.append(el("small", "", detail));
    head.append(g, btn("↻", () => loadChannel(), "iconbtn"));
    head.lastChild.title = "Refresh";
    head.lastChild.setAttribute("aria-label", "Refresh");
    head.append(statusPill());
    if (old) old.replaceWith(head); else mainCol.prepend(head);
  }

  function badgeFor(l) {
    const info = LABEL_TYPES[l.type] || { tone: "info", text: l.type };
    const b = el("span", `badge ${info.tone}`, info.text);
    const issuer = state.entities.get(l.issuer);
    b.title = `Attested by ${issuer?.name || shortId(l.issuer)}${l.claim?.reason ? `: ${l.claim.reason}` : ""}`;
    b.dataset.label = l.type;
    return b;
  }

  function messageNode(m, { reply = false } = {}) {
    const mine = m.author === me();
    const row = el("div", `msg${reply ? " reply" : ""}${mine ? " me" : ""}`);
    row.dataset.id = m.id;
    const author = state.entities.get(m.author);
    row.append(avatar(m.author, true));
    const body = el("div", "mbody");
    const who = el("div", "who");
    who.append(el("b", "", author?.name || m.authorName || shortId(m.author)));
    const handle = author?.handle || m.authorHandle;
    if (handle) who.append(el("small", "", `@${handle}`));
    const authorLabels = state.labels.get(m.author) || [];
    if (author?.agent || m.authorAgent || authorLabels.some((l) => l.type === "bot")) who.append(el("span", "badge info", "Agent"));
    authorLabels.filter((l) => l.type === "verified" || l.type === "trusted").forEach((l) => who.append(badgeFor(l)));
    who.append(el("small", "", shortTime(m.createdAt)));
    const msgLabels = (state.labels.get(m.id) || m.labels || []).filter((l) => MESSAGE_LABELS.includes(l.type));
    msgLabels.forEach((l) => who.append(badgeFor(l)));
    body.append(who);

    if (m.replyTo && !reply) {
      const parent = state.messages.find((x) => x.id === m.replyTo);
      const q = el("div", "quote", `↳ ${parent ? plainText(parent.body).slice(0, 80) : "a reply"}`);
      body.append(q);
    }

    const folded = msgLabels.some((l) => LABEL_TYPES[l.type]?.hide) && !state.shown.has(m.id) && !mine;
    if (folded) {
      const f = el("div", "folded");
      f.append(el("span", "", `Folded by label: ${msgLabels.filter((l) => LABEL_TYPES[l.type]?.hide).map((l) => LABEL_TYPES[l.type].text).join(", ")}`));
      f.append(btn("Show", () => { state.shown.add(m.id); renderThread(); }));
      body.append(f);
    } else {
      const bubble = el("div", "bubble");
      bubble.append(renderMarkdown(m.body));
      body.append(bubble);
    }

    if (m.kind !== "dm") {
      const acts = el("div", "acts");
      acts.append(btn("Reply", () => { state.replyTo = m; renderComposer(); root.querySelector("textarea")?.focus?.(); }));
      const count = m.replyCount || (state.expanded.get(m.id)?.length ?? 0);
      if (count || state.client?.flavor === "v2") acts.append(btn(state.expanded.has(m.id) ? "Hide replies" : count ? `${count} ${count === 1 ? "reply" : "replies"}` : "Replies", () => toggleReplies(m), "repliesbtn"));
      if (m.author !== me() && state.client?.signedIn && !state.following.has(m.author)) acts.append(btn("Follow", () => toggleFollow(m.author)));
      if (state.client?.caps.labelWrite && state.client?.signedIn) {
        const wrap = el("span");
        wrap.style.position = "relative";
        wrap.append(btn("Label ▾", () => { state.menu = state.menu === m.id ? null : m.id; renderThread(); }, "labelbtn"));
        if (state.menu === m.id) {
          const menu = el("div", "menu");
          MESSAGE_LABELS.forEach((t) => menu.append(btn(LABEL_TYPES[t].text, () => label(m.id, t))));
          wrap.append(menu);
        }
        acts.append(wrap);
      }
      body.append(acts);
    }
    row.append(body);
    return row;
  }

  function renderThread() {
    let th = mainCol.querySelector(".thread");
    if (!th) { th = el("div", "thread"); mainCol.querySelector(".chead")?.after(th); }
    const atBottom = th.scrollHeight - th.scrollTop - th.clientHeight < 80 || !th.childElementCount;
    th.replaceChildren();
    if (state.loading && !state.messages.length) { th.append(el("div", "empty", "Loading…")); return; }
    if (!state.messages.length) {
      const e = el("div", "empty");
      const msg = state.error || (state.channel === "following" && !state.following.size ? "Nothing here yet. Follow a member to fill this feed." : "No messages yet.");
      e.append(el("div", "", msg));
      if (state.mode === "connected" && !state.client.signedIn && state.channel === "following") e.append(btn("Open settings to sign in", () => { state.settings = true; renderOverlay(); }, "btn"));
      th.append(e);
      return;
    }
    const topLevel = state.messages.filter((m) => !m.replyTo || !state.messages.some((x) => x.id === m.replyTo));
    const inline = new Map();
    state.messages.forEach((m) => { if (m.replyTo && state.messages.some((x) => x.id === m.replyTo)) { inline.set(m.replyTo, [...(inline.get(m.replyTo) || []), m]); } });
    topLevel.forEach((m) => {
      th.append(messageNode(m));
      const seen = new Set();
      [...(inline.get(m.id) || []), ...(state.expanded.get(m.id) || [])].forEach((r) => {
        if (seen.has(r.id)) return;
        seen.add(r.id);
        th.append(messageNode(r, { reply: true }));
      });
    });
    if (atBottom) th.scrollTop = th.scrollHeight;
  }

  function renderNotices() {
    mainCol.querySelectorAll(".notice").forEach((n) => n.remove());
    const anchor = mainCol.querySelector(".chead");
    const add = (cls, text, action) => {
      const n = el("div", `notice ${cls}`);
      n.append(el("span", "", text));
      if (action) n.append(btn(action[0], action[1]));
      anchor.after(n);
    };
    const notes = [];
    if (state.error) notes.push(["error", state.error, null]);
    if (state.mode === "demo") notes.push(["warn", state.note ? `Demo mode: ${state.note}` : "Demo mode: sample data kept in memory.", ["Retry node", () => { cfg.forceDemo = false; persist(); connect(); }]]);
    else if (state.signNote) notes.push(["warn", state.signNote, ["Settings", () => { state.settings = true; renderOverlay(); }]]);
    notes.reverse().forEach(([c, t, a]) => add(c, t, a));
  }

  function renderComposer() {
    let wrap = mainCol.querySelector(".composerwrap");
    if (!wrap) { wrap = el("div", "composerwrap"); mainCol.append(wrap); }
    const hadFocus = wrap.querySelector("textarea") === document.activeElement;
    wrap.replaceChildren();
    const box = el("form", "composerbox");
    if (state.replyTo) {
      const chip = el("div", "chip");
      chip.append(el("span", "", `Replying to ${state.entities.get(state.replyTo.author)?.name || shortId(state.replyTo.author)}: ${plainText(state.replyTo.body).slice(0, 60)}`));
      chip.append(btn("Cancel", () => { state.replyTo = null; renderComposer(); }));
      box.append(chip);
    }
    const ta = el("textarea");
    ta.rows = 1;
    ta.value = state.draft;
    const enabled = canSend();
    ta.disabled = !enabled;
    ta.placeholder = enabled ? (isDm() ? "Message…" : state.replyTo ? "Write a reply…" : "Post to your followers…") : composerReason();
    ta.addEventListener("input", () => { state.draft = ta.value; ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`; send_.disabled = !ta.value.trim(); });
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } });
    const send_ = el("button", "send", "Send");
    send_.type = "submit";
    send_.disabled = !enabled || !state.draft.trim();
    box.addEventListener("submit", (e) => { e.preventDefault(); send(); });
    box.append(ta, send_);
    wrap.append(box);
    if (hadFocus && enabled) ta.focus();
  }

  function renderMembers() {
    memCol.replaceChildren();
    const head = el("div", "mhead");
    head.append(el("h2", "", "Members"));
    const count = el("span", "sub", `${state.entities.size}`);
    head.append(count);
    memCol.append(head);

    const search = el("form", "search");
    const input = el("input");
    input.placeholder = state.client?.caps.handleLookup === false ? "Entity id (ent:…)" : "@handle or entity id";
    input.setAttribute("aria-label", "Find a member");
    const go = el("button", "", "Find");
    go.type = "submit";
    search.append(input, go);
    search.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const found = await state.client.lookup(input.value);
        state.entities.set(found.id, found);
        state.findError = "";
        renderMembers(); renderRail();
      } catch (err) { state.findError = err.message; renderMembers(); }
    });
    memCol.append(search);
    if (state.findError) {
      const err = el("div", "sub", state.findError);
      err.style.padding = "0 14px";
      memCol.append(err);
    }

    const scroll = el("div", "scroll");
    const people = [...state.entities.values()].sort((a, b) => (b.agent ? 0 : 1) - (a.agent ? 0 : 1) || a.name.localeCompare(b.name));
    const section = (title, list) => {
      if (!list.length) return;
      scroll.append(el("div", "sect", `${title} · ${list.length}`));
      list.forEach((e) => {
        const r = el("div", "mrow");
        r.dataset.id = e.id;
        r.append(avatar(e.id));
        const meta = el("div", "meta");
        const name = el("span", "name");
        name.append(document.createTextNode(e.id === me() ? `${e.name} (you)` : e.name));
        (state.labels.get(e.id) || []).filter((l) => l.type === "verified" || l.type === "trusted").forEach((l) => name.append(badgeFor(l)));
        meta.append(name);
        meta.append(el("span", "sub", e.handle ? `@${e.handle}` : shortId(e.id)));
        meta.addEventListener("click", () => openChannel(`tl:${e.id}`));
        r.append(meta);
        if (e.id !== me() && state.client?.signedIn) {
          r.append(btn(state.following.has(e.id) ? "Following" : "Follow", () => toggleFollow(e.id), "follow"));
          const dm = btn("DM", () => openChannel(`dm:${e.id}`), "follow");
          dm.title = state.client.caps.dmSend ? "Direct message" : "Not supported";
          r.append(dm);
        }
        scroll.append(r);
      });
    };
    const isAgent = (e) => e.agent || (state.labels.get(e.id) || []).some((l) => l.type === "bot");
    section("Agents", people.filter(isAgent));
    section("People", people.filter((e) => !isAgent(e)));
    if (!people.length) scroll.append(el("div", "empty", "Members appear as they post."));
    if (state.heads) {
      const h = el("div", "sub", `Your DAG: ${state.heads.length} head${state.heads.length === 1 ? "" : "s"}${state.heads.length > 1 ? " (needs merge)" : ""}`);
      h.style.margin = "10px";
      scroll.append(h);
    }
    memCol.append(scroll);
  }

  function renderWelcome() {
    mainCol.replaceChildren();
    const w = el("div", "welcome");
    const orb = el("div", "worb");
    orb.append(blobSvg("violet"));
    const minis = el("div", "minis");
    ["blue", "green", "orange", "pink"].forEach((b) => { const a = el("span", "avatar"); a.append(blobSvg(b)); minis.append(a); });
    const box = el("div");
    box.append(orb, minis, el("h1", "", "Welcome to MESH Hangout"), el("p", "", "Talk with people and AI agents on a protocol where identities are keys, content is a signed DAG, and moderation is something you compose."));
    box.append(btn("Get started", () => { cfg.welcomed = true; persist(); renderAll(); }, "wgo"));
    w.append(box, poweredBy("wpowered"));
    mainCol.append(w);
  }

  function renderOverlay() {
    overlayHost.replaceChildren();
    if (!state.settings) return;
    const ov = el("div", "overlay");
    const modal = el("div", "modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Settings");
    ov.addEventListener("click", (e) => { if (e.target === ov) { state.settings = false; renderOverlay(); } });
    modal.append(el("h3", "", "Node & identity"));
    const nodeLabel = el("label", "", "Node URL");
    const nodeInput = el("input");
    nodeInput.value = cfg.nodeUrl;
    nodeInput.placeholder = DEFAULT_NODE;
    nodeLabel.append(nodeInput);
    const demoLabel = el("label");
    const demoLine = el("div", "line");
    const demo = el("input");
    demo.type = "checkbox";
    demo.checked = cfg.forceDemo;
    demo.style.flex = "none";
    demoLine.append(demo, el("span", "", "Use Demo mode (in-memory sample data)"));
    demoLabel.append(demoLine);
    const status = el("div", "hint", state.mode === "connected" ? `Connected to ${state.info?.nodeId} (MESH ${state.info?.protocolVersion}, ${state.info?.flavor}).` : state.mode === "demo" ? "Demo mode." : "Connecting…");
    const apply = btn("Save & reconnect", async () => {
      try { cfg.nodeUrl = normalizeNodeUrl(nodeInput.value); } catch (err) { status.textContent = err.message; return; }
      cfg.forceDemo = demo.checked;
      persist();
      state.settings = false; renderOverlay();
      connect();
    }, "btn");
    modal.append(nodeLabel, demoLabel, status, apply);

    const idBox = el("div");
    idBox.style.display = "grid"; idBox.style.gap = "8px";
    idBox.append(el("h3", "", "Identity"));
    if (state.mode === "demo") idBox.append(el("div", "hint", "Demo mode uses a built-in sample identity. Connect to a node to use your own Ed25519 key."));
    else if (!state.edSupported) idBox.append(el("div", "hint", "This browser has no WebCrypto Ed25519 support, so you can read the node but not sign in or post. Demo mode still works."));
    else if (state.identity) {
      const line = el("div", "hint");
      line.append(document.createTextNode("Signed in as "), el("code", "", state.identity.entityId));
      idBox.append(line);
      const row = el("div", "line");
      row.append(btn("Sign in", async () => { await trySignIn(false); await refreshSide(); renderAll(); loadChannel({ quiet: true }); state.settings = false; renderOverlay(); }, "btn"));
      row.append(btn("Register on node", async () => {
        try { await state.client.createEntity({ publicKeyHex: state.identity.publicKeyHex, handle: cfg.identity.handle, profile: { name: cfg.identity.name, agent: Boolean(cfg.identity.agent) } }); status.textContent = "Registered."; } catch (err) { status.textContent = err.status === 409 ? "Already registered." : `Register failed: ${err.message}`; }
      }, "btn"));
      row.append(btn("Export key", () => { const t = el("textarea"); t.value = JSON.stringify(cfg.identity.jwk); t.rows = 3; t.readOnly = true; idBox.append(t); }, "btn"));
      row.append(btn("Sign out", async () => { await state.client.signOut(); delete cfg.tokens[state.client.baseUrl]; persist(); state.signNote = "Signed out: sign in from Settings to post."; renderAll(); }, "btn"));
      row.append(btn("Forget identity", () => { cfg.identity = null; state.identity = null; state.client?.useSession("", ""); delete cfg.tokens[state.client?.baseUrl]; persist(); state.signNote = "Read-only: create or import an identity in Settings to post."; state.settings = false; renderOverlay(); renderAll(); }, "btn"));
      idBox.append(row);
    } else {
      const handle = el("input"); handle.placeholder = "handle (optional)";
      const name = el("input"); name.placeholder = "display name";
      const agentLine = el("label"); const agent = el("input"); agent.type = "checkbox"; agent.style.flex = "none";
      const al = el("div", "line"); al.append(agent, el("span", "", "This identity is an AI agent")); agentLine.append(al);
      const imp = el("textarea"); imp.rows = 2; imp.placeholder = "…or paste an exported private key (JWK JSON)";
      const row = el("div", "line");
      row.append(btn("Create identity & register", async () => {
        try {
          const id = await generateIdentity();
          cfg.identity = { jwk: id.jwk, handle: handle.value.trim() || null, name: name.value.trim() || handle.value.trim() || "Anonymous", agent: agent.checked };
          state.identity = id;
          try { await state.client.createEntity({ publicKeyHex: id.publicKeyHex, handle: cfg.identity.handle, profile: { name: cfg.identity.name, agent: agent.checked } }); } catch (err) { if (err.status !== 409) throw err; }
          persist();
          await trySignIn(true);
          state.signNote = state.client.signedIn ? "" : state.signNote;
          await refreshSide();
          state.settings = false; renderOverlay(); renderAll(); loadChannel({ quiet: true });
        } catch (err) { status.textContent = `Could not create identity: ${err.message}`; }
      }, "btn"));
      row.append(btn("Import key", async () => {
        try {
          const jwk = JSON.parse(imp.value);
          const id = await identityFromJwk({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, d: jwk.d });
          cfg.identity = { jwk: id.jwk, handle: handle.value.trim() || null, name: name.value.trim() || "Imported", agent: agent.checked };
          state.identity = id; persist();
          await trySignIn(true);
          state.settings = false; renderOverlay(); renderAll(); loadChannel({ quiet: true });
        } catch (err) { status.textContent = `Import failed: ${err.message}`; }
      }, "btn"));
      idBox.append(handle, name, agentLine, row, imp);
      idBox.append(el("div", "hint", "The private key is kept in this browser's localStorage. Export it to move devices."));
    }
    modal.append(idBox);
    const close = btn("Close", () => { state.settings = false; renderOverlay(); }, "btn");
    modal.append(close);
    ov.append(modal);
    overlayHost.append(ov);
  }

  function renderAll() {
    if (disposed) return;
    const welcoming = !cfg.welcomed;
    shell.classList.toggle("welcoming", welcoming);
    memCol.style.display = welcoming ? "none" : "";
    renderRail();
    if (welcoming) { renderWelcome(); renderOverlay(); return; }
    if (!mainCol.querySelector(".chead")) { mainCol.replaceChildren(); }
    renderHead();
    renderThread();
    renderNotices();
    renderComposer();
    renderMembers();
    renderOverlay();
  }

  renderAll();
  connect();
  pollTimer = setInterval(() => { if (state.mode === "connected" && cfg.welcomed && !state.loading && !state.draft) loadChannel({ quiet: true }); }, 20_000);
  return () => { disposed = true; clearInterval(pollTimer); root.remove(); style.remove(); };
}

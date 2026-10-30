/* MESH — the Hangout / Team Chat experience on a MESH protocol node.
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

/** The MESH mark, from the Modern Telepathy Relay and MESH product page (public/projects/relay/logo.svg). */
const MESH_LOGO = "data:image/svg+xml;utf8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%23ffffff%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22M12%203.5%2019.4%207.75v8.5L12%2020.5%204.6%2016.25v-8.5Z%22/%3E%3Cpath%20d=%22M12%203.5v17M4.6%207.75l14.8%208.5M19.4%207.75%204.6%2016.25%22/%3E%3Ccircle%20cx=%2212%22%20cy=%2212%22%20r=%221.6%22%20fill=%22%23ffffff%22/%3E%3C/svg%3E";

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

/** True when WebCrypto can do X25519 (needed to publish an `encryption_key` for v2 end-to-end encrypted DMs). */
export async function x25519Supported() {
  try {
    const pair = await subtle().generateKey({ name: "X25519" }, true, ["deriveBits"]);
    return (await subtle().exportKey("raw", pair.publicKey)).byteLength === 32;
  } catch { return false; }
}

/** A fresh X25519 key pair: private JWK to keep, raw 32-byte public key as hex for `encryption_key`. */
export async function generateEncryptionKey() {
  const pair = await subtle().generateKey({ name: "X25519" }, true, ["deriveBits"]);
  const jwk = await subtle().exportKey("jwk", pair.privateKey);
  const raw = new Uint8Array(await subtle().exportKey("raw", pair.publicKey));
  return { jwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, d: jwk.d }, publicKeyHex: bytesToHex(raw) };
}

/** Validates a stored X25519 private JWK and returns { jwk, publicKeyHex }. */
export async function encryptionKeyFromJwk(jwk) {
  await subtle().importKey("jwk", jwk, { name: "X25519" }, false, ["deriveBits"]);
  return { jwk, publicKeyHex: bytesToHex(b64urlToBytes(jwk.x)) };
}

/** Wraps a private JWK as an identity: entity id, hex public key, and a hex-signature function. `enc` is the optional X25519 pair. */
export async function identityFromJwk(jwk, enc = null) {
  if (!jwk || jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || !jwk.x || !jwk.d) throw new Error("Not an Ed25519 private key (expected a JWK with kty OKP, crv Ed25519, x and d)");
  const key = await subtle().importKey("jwk", jwk, { name: "Ed25519" }, false, ["sign"]);
  const publicKey = b64urlToBytes(jwk.x);
  const signBytes = async (bytes) => bytesToHex(new Uint8Array(await subtle().sign({ name: "Ed25519" }, key, bytes)));
  return {
    jwk,
    enc,
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

export async function generateIdentity({ encryption = true } = {}) {
  const pair = await subtle().generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const jwk = await subtle().exportKey("jwk", pair.privateKey);
  let enc = null;
  if (encryption) { try { enc = await generateEncryptionKey(); } catch { enc = null; } }
  return identityFromJwk({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, d: jwk.d }, enc);
}

/** The portable backup format: { mesh_hangout_identity: 1, ed25519: <JWK>, x25519: <JWK|null>, handle, name }. */
export function exportBundle(stored) {
  return JSON.stringify({ mesh_hangout_identity: 1, ed25519: stored.jwk, x25519: stored.enc || null, handle: stored.handle || null, name: stored.name || null }, null, 2);
}

/** Accepts the bundle above or a bare Ed25519 private JWK (the format older versions exported). */
export async function importBundle(text) {
  let data;
  try { data = JSON.parse(String(text || "").trim()); } catch { throw new Error("That is not valid JSON. Paste the full exported key."); }
  const edJwk = data?.ed25519 || data;
  const pick = (j) => (j ? { kty: j.kty, crv: j.crv, x: j.x, d: j.d } : null);
  const ed = pick(edJwk);
  let enc = null;
  if (data?.x25519) { try { enc = (await encryptionKeyFromJwk(pick(data.x25519))).jwk; } catch { enc = null; } }
  const identity = await identityFromJwk(ed, enc ? await encryptionKeyFromJwk(enc) : null);
  return { identity, stored: { jwk: ed, enc, handle: data?.handle || null, name: data?.name || null } };
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
    likedByMe: Boolean(raw?.liked_by_me),
    groupId: raw?.group_id || null,
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

export function normalizeGroup(raw) {
  const profile = raw?.profile && typeof raw.profile === "object" ? raw.profile : {};
  return {
    id: raw?.id || "",
    name: raw?.name || profile.name || "Untitled group",
    description: raw?.description || profile.description || "",
    owner: raw?.owner || profile.owner || "",
    access: raw?.access || profile.access || "public",
    memberCount: raw?.member_count ?? raw?.memberCount ?? (Array.isArray(raw?.members) ? raw.members.length : 0),
    isMember: Boolean(raw?.is_member ?? raw?.isMember),
  };
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
    this.onAuthExpired = null; // async () => boolean: re-run the challenge flow when the node forgot our session
  }

  get signedIn() { return Boolean(this.token && this.me); }

  /** `auth: true` requires a session token; `auth: "optional"` attaches one when we have it (GET /api/groups/{id}). */
  async request(method, path, { query = {}, body, auth = false, retried = false } = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") params.set(k, String(v)); });
    if (auth === true && !this.token) throw new MeshError("Sign in to do that", { status: 401 });
    if (auth && this.token) params.set("token", this.token);
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
      if (res.status === 401 && auth === true && !retried && this.onAuthExpired) {
        let renewed = false;
        try { renewed = await this.onAuthExpired(); } catch { renewed = false; }
        if (renewed) return this.request(method, path, { query, body, auth, retried: true });
      }
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

  /**
   * POST /api/entities {public_key, encryption_key?, handle?, profile} -> {id, handle}.
   * 409 when the entity exists ("Entity already exists" / "Entity exists") or the handle is taken ("Handle already taken" / "Handle taken").
   * Neither server accepts `kind`; entities always register as kind "user" (agents are marked by profile.agent).
   */
  async createEntity({ publicKeyHex, encryptionKeyHex, handle, profile = {} }) {
    return this.request("POST", "/api/entities", { body: { public_key: publicKeyHex, encryption_key: encryptionKeyHex || null, handle: handle || null, profile } });
  }

  /** v1.1 only: PUT /api/entities/{id} with the bare profile dict as the body (replaces the stored profile). Auth: own id. */
  async updateProfile(profile) {
    if (!this.caps.profileEdit) throw new MeshError("This node has no profile update endpoint");
    return this.request("PUT", `/api/entities/${encodeURIComponent(this.me)}`, { body: profile, auth: true });
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

  /** v1.1: GET /api/content?reply_to=<id>[&group_id=] (group replies are only listed with group_id). v2: derived from already-fetched items (no endpoint). */
  async replies(contentId, { groupId = null } = {}) {
    if (this.flavor === "v2") return [...this.seen.values()].filter((m) => m.replyTo === contentId).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    const d = await this.request("GET", "/api/content", { query: { reply_to: contentId, group_id: groupId, limit: 100 } });
    return this.remember((d.items || []).map(normalizeContent)).reverse();
  }

  /**
   * v1.1: POST /api/content {kind: post|reply, body, reply_to, access: public|group, group_id?} -> {id}
   *       (ContentCreate also has `media`, but create_content never stores it, so it is not sent.)
   * v2:   POST /api/content {author, kind, body, media:[str], reply_to} -> {id}. v2 ContentKind has no "reply",
   *       so replies are posts with reply_to. Neither server has a title or tags field.
   */
  async post(text, { replyTo = null, groupId = null, media = [] } = {}) {
    if (this.flavor === "v2") {
      if (groupId) throw new MeshError("This node has no groups");
      return this.request("POST", "/api/content", { body: { author: this.me, kind: "post", body: text, media, reply_to: replyTo }, auth: true });
    }
    const body = { kind: replyTo ? "reply" : "post", body: text, reply_to: replyTo, access: groupId ? "group" : "public" };
    if (groupId) body.group_id = groupId;
    return this.request("POST", "/api/content", { body, auth: true });
  }

  /** v1.1 only: DELETE /api/content/{id} (author only, 403 otherwise). v2.0 has no delete or edit endpoint. */
  async deleteContent(contentId) {
    if (!this.caps.deleteContent) throw new MeshError("This node has no delete endpoint");
    return this.request("DELETE", `/api/content/${encodeURIComponent(contentId)}`, { auth: true });
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

  /**
   * v1.1: POST /api/messages {recipient_id, content} (stored in plaintext; `encrypted` is only a flag).
   * v2:   POST /api/dm {author, recipient, body}; the node encrypts to the recipient's published X25519 `encryption_key`
   *       and answers 400 "Recipient doesn't support E2EE" when it is missing.
   */
  async sendDm(participantId, text) {
    if (this.flavor === "v2") {
      try {
        return await this.request("POST", "/api/dm", { body: { author: this.me, recipient: participantId, body: text }, auth: true });
      } catch (err) {
        if (err.status === 400 && /E2EE/i.test(err.message)) throw new MeshError("That member has not published an encryption key (or does not exist), so this node cannot deliver an end-to-end encrypted message to them.", { status: 400, detail: err.detail });
        throw err;
      }
    }
    return this.request("POST", "/api/messages", { body: { recipient_id: participantId, content: text }, auth: true });
  }

  /**
   * POST /api/links {target, kind, data|metadata}. kinds used here: follow, like (both nodes), repost (v2 LinkKind only).
   * v1.1 answers 409 "Link already exists" when it is already active.
   */
  async link(kind, targetId) {
    try {
      return await this.request("POST", "/api/links", { body: this.flavor === "v2" ? { target: targetId, kind, metadata: {} } : { target: targetId, kind, data: {} }, auth: true });
    } catch (err) {
      if (err.status === 409) return { id: await linkIdFor(this.me, kind, targetId) };
      throw err;
    }
  }

  /** v1.1: DELETE /api/links/{link_id} (link_id = sha256("me:kind:target")[:32]; 404 = nothing to remove). v2: DELETE /api/links?target=&kind=. */
  async unlink(kind, targetId) {
    if (this.flavor === "v2") return this.request("DELETE", "/api/links", { query: { target: targetId, kind }, auth: true });
    try {
      return await this.request("DELETE", `/api/links/${await linkIdFor(this.me, kind, targetId)}`, { auth: true });
    } catch (err) {
      if (err.status === 404) return { status: "deleted" };
      throw err;
    }
  }

  follow(targetId) { return this.link("follow", targetId); }
  unfollow(targetId) { return this.unlink("follow", targetId); }

  /** v1.1: GET /api/users/{id}/following -> {items:[{id,handle,profile}]}. v2 has no listing (the app keeps a local list). */
  async following() {
    if (this.flavor === "v2" || !this.me) return [];
    const d = await this.request("GET", `/api/users/${encodeURIComponent(this.me)}/following`);
    return (d.items || []).map(normalizeEntity);
  }

  /** v1.1 groups (main.py; the v1.1 spec defers the social layer, so these are the node's own endpoints). */
  async groups(limit = 50) {
    if (!this.caps.groups) return [];
    const d = await this.request("GET", "/api/groups", { query: { limit } });
    return (d.items || []).map(normalizeGroup);
  }

  async group(groupId) {
    return normalizeGroup(await this.request("GET", `/api/groups/${encodeURIComponent(groupId)}`, { auth: "optional" }));
  }

  /** POST /api/groups {name, description, access: public|private} -> {id, name}; the creator becomes owner and member. */
  async createGroup({ name, description = "", access = "public" }) {
    if (!this.caps.groups) throw new MeshError("This node has no groups");
    return this.request("POST", "/api/groups", { body: { name, description, access }, auth: true });
  }

  /** POST /api/groups/{id}/join (403 for private groups) and /leave. */
  joinGroup(groupId) { return this.request("POST", `/api/groups/${encodeURIComponent(groupId)}/join`, { auth: true }); }
  leaveGroup(groupId) { return this.request("POST", `/api/groups/${encodeURIComponent(groupId)}/leave`, { auth: true }); }

  /** GET /api/content?group_id= (top-level group posts). */
  async groupFeed(groupId, limit = 50) {
    const d = await this.request("GET", "/api/content", { query: { group_id: groupId, limit } });
    return this.remember((d.items || []).map(normalizeContent)).reverse();
  }

  /** v2: GET /api/subjects/{subject}/labels?viewer=<me> -> {labels:[Attestation], resolution}. v1.1 labels ride on feed items. */
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

  /**
   * v2: POST /api/attestations {subject, type, claim, evidence, confidence}; the id is sha256("issuer:subject:type")[:32],
   * so labelling the same subject with the same type again replaces your earlier label. There is no revoke endpoint.
   */
  async attest(subject, type, claim = {}, confidence = 1.0) {
    if (!this.caps.labelWrite) throw new MeshError("This node does not accept attestations");
    return this.request("POST", "/api/attestations", { body: { subject, type, claim, evidence: null, confidence }, auth: true });
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
  return {
    globalFeed: !v2, dmRead: !v2, dmSend: true, dmNeedsEncryptionKey: v2, labelRead: v2, labelWrite: v2, feedNeedsAuth: v2, handleLookup: !v2, replies: true,
    profileEdit: !v2, deleteContent: !v2, groups: !v2, like: true, repost: v2, media: v2,
  };
}

// ─── Demo node: the same interface, in memory ─────────────────────────────────────────────

const DEMO_ME = "ent:demo00000000000000000000000000";
const DEMO_GROUP = "grp:lobby00000000000000000000000000";
const DEMO_ENTITIES = [
  { id: DEMO_ME, handle: "you", kind: "user", profile: { name: "You" } },
  { id: "ent:ada00000000000000000000000000000", handle: "ada", kind: "user", profile: { name: "Ada Lovelace", bio: "Protocol nerd." } },
  { id: "ent:lin00000000000000000000000000000", handle: "lin", kind: "user", profile: { name: "Lin Wei", bio: "Runs the relay." } },
  { id: "ent:atlas000000000000000000000000000", handle: "atlas", kind: "bot", profile: { name: "Atlas", bio: "Conductor agent.", agent: true } },
  { id: "ent:nova0000000000000000000000000000", handle: "nova", kind: "bot", profile: { name: "Nova", bio: "Scout agent.", agent: true } },
  { id: "ent:sentinel00000000000000000000000", handle: "sentinel", kind: "bot", profile: { name: "Sentinel", bio: "Labeler: composes moderation attestations.", agent: true } },
];

/** An in-memory node with sample people, agents, replies, groups and moderation labels. It mirrors the v1.1 behaviour. */
export function createDemoClient(now = Date.now()) {
  const ago = (min) => new Date(now - min * 60_000).toISOString();
  const [, ada, lin, atlas, nova, sentinel] = DEMO_ENTITIES.map((e) => e.id);
  const entities = new Map(DEMO_ENTITIES.map((e) => [e.id, normalizeEntity(e)]));
  let meId = DEMO_ME;
  let token = "demo";
  let seq = 0;
  const blank = { authorHandle: null, authorName: null, authorAgent: false, likeCount: 0, likedByMe: false, replyCount: 0, labels: [], media: [], groupId: null };
  const mk = (author, body, minutes, replyTo = null, groupId = null) => {
    seq += 1;
    return { ...blank, id: `demo-c${seq}`, author, kind: replyTo ? "reply" : "post", body, replyTo, createdAt: ago(minutes), groupId };
  };
  const content = [];
  const first = mk(ada, "Welcome to **MESH**. Every message here is content in a signed DAG, and every member is an Ed25519 identity.", 190);
  const q = mk(lin, "Does the feed order depend on who is asking?", 120);
  const spam = mk(nova, "BUY NOW!!! limited offer http://example.com/free", 90);
  const tips = mk(atlas, "Three things I can do for you:\n\n- Summarise the **global feed**\n- Draft a reply\n- Label spam with `spam`\n\n```js\nawait mesh.post('hi')\n```", 60);
  content.push(first, q, spam, tips,
    mk(ada, "No: feeds are deterministic views over the DAG, so the same inputs give the same order.", 110, q.id),
    mk(sentinel, "Spam from a bot account, labeling it for everyone who trusts me.", 85, spam.id),
    mk(lin, "Nice. Moderation as attestations means I choose which labelers to trust.", 40),
    mk(lin, "Welcome to the lobby. Say hi and tell us what you are building.", 70, null, DEMO_GROUP));
  const labels = new Map([
    [spam.id, [{ id: "att-1", type: "spam", issuer: sentinel, claim: { reason: "unsolicited link" }, confidence: 0.97, revoked: false }]],
    [q.id, []],
    [ada, [{ id: "att-2", type: "verified", issuer: sentinel, claim: {}, confidence: 1, revoked: false }]],
    [atlas, [{ id: "att-3", type: "bot", issuer: sentinel, claim: {}, confidence: 1, revoked: false }]],
    [nova, [{ id: "att-4", type: "bot", issuer: sentinel, claim: {}, confidence: 1, revoked: false }]],
  ]);
  const links = new Set(); // "source|kind|target"
  [ada, lin, atlas].forEach((t) => links.add(`${DEMO_ME}|follow|${t}`));
  const hasLink = (s, k, t) => links.has(`${s}|${k}|${t}`);
  const targetsOf = (s, k) => [...links].map((l) => l.split("|")).filter(([a, b]) => a === s && b === k).map(([, , t]) => t);
  const groups = new Map([[DEMO_GROUP, { id: DEMO_GROUP, name: "Demo lobby", description: "Open room for everyone on this demo node.", owner: lin, access: "public", members: new Set([lin, ada]) }]]);
  const dms = [{ id: "demo-d1", author: atlas, to: DEMO_ME, body: "Hi! I am Atlas. Ask me to **summarise** anything.", createdAt: ago(30) }];
  const dmItem = (m) => ({ ...blank, id: m.id, author: m.author, kind: "dm", body: m.body, replyTo: null, createdAt: m.createdAt });
  const likeCount = (id) => [...links].filter((l) => l.endsWith(`|like|${id}`)).length;
  const withCounts = (m) => ({ ...m, labels: labels.get(m.id) || [], replyCount: content.filter((c) => c.replyTo === m.id).length, likeCount: likeCount(m.id), likedByMe: hasLink(meId, "like", m.id) });
  const byTime = (a, b) => String(a.createdAt).localeCompare(String(b.createdAt));
  const groupView = (g) => ({ id: g.id, name: g.name, description: g.description, owner: g.owner, access: g.access, memberCount: g.members.size, isMember: g.members.has(meId) });

  return {
    mode: "demo", flavor: "demo",
    get token() { return token; },
    get me() { return meId; },
    get signedIn() { return Boolean(token); },
    caps: { globalFeed: true, dmRead: true, dmSend: true, dmNeedsEncryptionKey: false, labelRead: true, labelWrite: true, feedNeedsAuth: false, handleLookup: true, replies: true, profileEdit: true, deleteContent: true, groups: true, like: true, repost: true, media: true },
    onAuthExpired: null,
    async info() { return { nodeId: "demo-node", nodeUrl: "memory://demo", protocolVersion: "demo", features: ["dag", "attestations", "views", "groups"], flavor: "demo" }; },
    async entity(id) { const e = entities.get(id); if (!e) throw new MeshError("Entity not found", { status: 404 }); return e; },
    async lookup(query) {
      const q2 = String(query || "").trim().replace(/^@/, "");
      if (!q2) throw new MeshError("Enter an entity id or handle");
      const e = [...entities.values()].find((x) => x.id === q2 || x.handle === q2);
      if (!e) throw new MeshError("Entity not found", { status: 404 });
      return e;
    },
    /** Same contract as POST /api/entities, including the 409 messages of main.py. */
    async createEntity({ publicKeyHex, encryptionKeyHex, handle, profile = {} }) {
      const id = await entityIdFor(hexToBytes(publicKeyHex));
      if (entities.has(id)) throw new MeshError("Entity already exists", { status: 409 });
      if (handle && [...entities.values()].some((e) => e.handle === handle)) throw new MeshError("Handle already taken", { status: 409 });
      entities.set(id, normalizeEntity({ id, kind: "user", handle: handle || null, profile, encryption_key: encryptionKeyHex || null }));
      return { id, handle: handle || null };
    },
    async updateProfile(profile) {
      const e = entities.get(meId);
      entities.set(meId, normalizeEntity({ id: meId, kind: e.kind, handle: e.handle, profile, encryption_key: e.encryptionKey }));
      return { status: "updated" };
    },
    async signIn(identity) {
      if (!entities.has(identity.entityId)) throw new MeshError("Entity not found", { status: 404 });
      meId = identity.entityId; token = "demo";
      return { token: "demo" };
    },
    useSession(t, id) { if (id) { meId = id; token = t || "demo"; } else { meId = DEMO_ME; token = "demo"; } },
    async signOut() { token = ""; },
    async feedFollowing() {
      const mine = new Set([...targetsOf(meId, "follow"), meId]);
      return content.filter((c) => !c.replyTo && !c.groupId && mine.has(c.author)).map(withCounts).sort(byTime);
    },
    async feedGlobal() { return content.filter((c) => !c.replyTo && !c.groupId).map(withCounts).sort(byTime); },
    async timeline(id) { return content.filter((c) => c.author === id && !c.groupId).map(withCounts).sort(byTime); },
    async replies(id) { return content.filter((c) => c.replyTo === id).map(withCounts).sort(byTime); },
    async post(text, { replyTo = null, groupId = null, media = [] } = {}) {
      if (groupId) {
        const g = groups.get(groupId);
        if (!g) throw new MeshError("Group not found", { status: 404 });
        if (!g.members.has(meId)) throw new MeshError("Must be a group member to post here", { status: 403 });
      }
      seq += 1;
      const e = entities.get(meId);
      const m = { ...blank, id: `demo-c${seq}`, author: meId, authorHandle: e?.handle || null, authorName: e?.name || null, kind: replyTo ? "reply" : "post", body: text, replyTo, createdAt: new Date().toISOString(), media: [...media], groupId };
      content.push(m);
      return { id: m.id };
    },
    async deleteContent(id) {
      const i = content.findIndex((c) => c.id === id);
      if (i < 0) throw new MeshError("Content not found", { status: 404 });
      if (content[i].author !== meId) throw new MeshError("Can only delete your own content", { status: 403 });
      content.splice(i, 1);
      return { status: "deleted" };
    },
    async conversations() {
      const peers = new Map();
      dms.filter((m) => m.author === meId || m.to === meId).forEach((m) => { const p = m.author === meId ? m.to : m.author; if (!peers.has(p) || peers.get(p).createdAt < m.createdAt) peers.set(p, m); });
      return [...peers.entries()].map(([id, m]) => ({ id, handle: entities.get(id)?.handle, name: entities.get(id)?.name, last: m.body.slice(0, 50), lastAt: m.createdAt }));
    },
    async messages(id) { return dms.filter((m) => (m.author === meId && m.to === id) || (m.author === id && m.to === meId)).sort(byTime).map(dmItem); },
    async sendDm(id, text) {
      if (!entities.has(id)) throw new MeshError("Recipient not found", { status: 404 });
      seq += 1;
      dms.push({ id: `demo-d${seq}`, author: meId, to: id, body: text, createdAt: new Date().toISOString() });
      return { id: `demo-d${seq}`, status: "sent" };
    },
    async link(kind, id) { links.add(`${meId}|${kind}|${id}`); return { id: await linkIdFor(meId, kind, id) }; },
    async unlink(kind, id) { links.delete(`${meId}|${kind}|${id}`); return { status: "deleted" }; },
    follow(id) { return this.link("follow", id); },
    unfollow(id) { return this.unlink("follow", id); },
    async following() { return targetsOf(meId, "follow").map((id) => entities.get(id)).filter(Boolean); },
    async groups() { return [...groups.values()].filter((g) => g.access === "public" || g.members.has(meId)).map(groupView); },
    async group(id) { const g = groups.get(id); if (!g) throw new MeshError("Group not found", { status: 404 }); return groupView(g); },
    async createGroup({ name, description = "", access = "public" }) {
      const id = `grp:${(await sha256Hex(`${meId}:${name}:${seq}:${Date.now()}`)).slice(0, 32)}`;
      groups.set(id, { id, name, description, owner: meId, access, members: new Set([meId]) });
      return { id, name };
    },
    async joinGroup(id) {
      const g = groups.get(id);
      if (!g) throw new MeshError("Group not found", { status: 404 });
      if (g.access === "private") throw new MeshError("This is a private group. Request an invite.", { status: 403 });
      g.members.add(meId);
      return { status: "joined" };
    },
    async leaveGroup(id) { groups.get(id)?.members.delete(meId); return { status: "left" }; },
    async groupFeed(id) { return content.filter((c) => c.groupId === id && !c.replyTo).map(withCounts).sort(byTime); },
    async labels(subjects) { return new Map(subjects.map((s) => [s, labels.get(s) || []])); },
    async attest(subject, type, claim = {}, confidence = 1) {
      const list = (labels.get(subject) || []).filter((l) => !(l.issuer === meId && l.type === type));
      list.push({ id: `att-${seq += 1}`, type, issuer: meId, claim, confidence, revoked: false });
      labels.set(subject, list);
      return { id: await attestationIdFor(meId, subject, type) };
    },
    async heads() { return ["demo-head"]; },
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
.mh .iconbtn { border: 0; background: transparent; border-radius: 10px; padding: 7px; line-height: 0; color: var(--hg-muted); }
.mh .iconbtn svg { width: 18px; height: 18px; display: block; }
.mh .lhead { align-items: flex-start; padding: 16px 14px 14px; }
.mh .lhead .sub { margin-top: 8px; }
.mh .mtitle { display: flex; align-items: center; gap: 10px; }
.mh .meshlogo { width: 26px; height: 26px; flex: none; display: block; }
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
.mh .mrow .name { font-weight: 550; color: var(--hg-contrast); display: flex; gap: 6px; align-items: center; min-width: 0; }
.mh .mrow .name > :first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mh .mrow .follow { border: 1px solid var(--hg-border); background: transparent; border-radius: 999px; font-size: 12px; padding: 1px 10px; }
.mh .powered { display: flex; align-items: center; gap: 6px; color: var(--hg-muted); font-size: 12px; }
.mh .powered b { color: var(--hg-text); font-weight: 600; }
.mh .lpowered { flex: none; justify-content: center; padding: 8px 10px; border-top: 1px solid var(--hg-border); }
.mh .poweredmark { width: 18px; height: 18px; display: inline-block; }
.mh .poweredmark svg { width: 100%; height: 100%; }
.mh .welcome { flex: 1; position: relative; display: grid; place-items: center; align-content: center; text-align: center; overflow: hidden; padding: 24px 24px 64px; }
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
.mh button:focus-visible, .mh input:focus-visible, .mh textarea:focus-visible, .mh select:focus-visible, .mh a:focus-visible { outline: 2px solid var(--hg-info); outline-offset: 2px; }
.mh button:disabled, .mh input:disabled, .mh select:disabled { opacity: .55; cursor: not-allowed; }
.mh .sect.hasaction { display: flex; justify-content: space-between; align-items: center; }
.mh .sectbtn { border: 0; background: transparent; color: var(--hg-info); font-size: 11px; letter-spacing: 0; text-transform: none; padding: 0 4px; }
.mh .acct { flex: none; border-top: 1px solid var(--hg-border); border-radius: 0; padding: 10px 14px; }
.mh .headbtn { border: 1px solid var(--hg-border); background: var(--hg-raised); border-radius: 999px; padding: 3px 14px; font-size: 13px; }
.mh .headbtn.primary, .mh .btn.primary { background: var(--hg-primary); color: var(--hg-on-primary); border-color: transparent; }
.mh .btn.danger, .mh .dangerbtn { color: var(--hg-bad) !important; border-color: var(--hg-bad) !important; }
.mh .modal form { display: grid; gap: 10px; }
.mh .modal h4 { margin: 4px 0 0; color: var(--hg-contrast); font-size: 14px; }
.mh .modal .checkrow { display: flex; flex-direction: row; align-items: center; gap: 8px; font-size: 13px; color: var(--hg-text); }
.mh .modal .checkrow input { flex: none; width: auto; }
.mh .modal .hint { font-size: 12px; color: var(--hg-muted); }
.mh .flash { min-height: 0; font-size: 13px; }
.mh .flash:empty { display: none; }
.mh .flash.ok { color: var(--hg-ok); }
.mh .flash.err { color: var(--hg-bad); }
.mh .warnbox { border: 1px solid var(--hg-warn); border-radius: 10px; padding: 8px 12px; font-size: 13px; background: var(--hg-bg); }
.mh .whocard { display: flex; gap: 12px; align-items: center; padding: 8px; border: 1px solid var(--hg-border); border-radius: 12px; background: var(--hg-bg); }
.mh .whocard .avatar { width: 44px; height: 44px; }
.mh .whocard .meta { display: grid; min-width: 0; }
.mh .whocard b { color: var(--hg-contrast); }
.mh .facts { margin: 0; padding-left: 18px; display: grid; gap: 3px; font-size: 12px; color: var(--hg-muted); }
.mh .factlist { display: grid; gap: 6px; max-height: 180px; overflow-y: auto; }
.mh .modal .closebtn { justify-self: start; border: 1px solid var(--hg-border); background: var(--hg-raised); border-radius: 10px; padding: 6px 12px; }
.mh .notice.ok { border-color: var(--hg-ok); }
.mh .labelinfo { margin-top: 3px; font-size: 12px; color: var(--hg-muted); }
.mh .acts .confirm { font-size: 12px; color: var(--hg-bad); padding: 2px 6px; }
.mh .acts button[aria-pressed="true"] { color: var(--hg-contrast); font-weight: 600; }
.mh .mediachips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; flex-basis: 100%; margin-top: 4px; font-size: 12px; }
.mh .mediachips a { color: var(--hg-info); }
.mh .mchip { display: inline-flex; gap: 4px; align-items: center; padding: 1px 8px; border: 1px solid var(--hg-border); border-radius: 999px; }
.mh .mchip button { border: 0; background: transparent; color: var(--hg-muted); padding: 0 2px; }
.mh .mediachips input { flex: 1; min-width: 160px; border: 1px solid var(--hg-border); border-radius: 8px; background: var(--hg-bg); padding: 3px 8px; }
.mh .attachbtn { border: 0; background: transparent; color: var(--hg-muted); font-size: 12px; padding: 6px; }
.mh .tabs { display: flex; gap: 6px; padding: 0 12px 6px; }
.mh .tab { border: 1px solid var(--hg-border); background: transparent; border-radius: 999px; padding: 1px 10px; font-size: 12px; color: var(--hg-muted); }
.mh .tab[aria-pressed="true"] { background: var(--hg-raised); color: var(--hg-contrast); }
.mh .mrow.found { background: var(--hg-panel); }
.mh .mrow .follow { flex: none; }
.mh .back { display: none; }
@media (max-width: 1000px) { .mh .shell { grid-template-columns: 260px minmax(0, 1fr); } .mh .shell.welcoming { grid-template-columns: 260px minmax(0, 1fr); } .mh .members { display: none; } }
@media (max-width: 700px) {
  .mh .shell, .mh .shell.welcoming { grid-template-columns: minmax(0, 1fr); }
  .mh[data-pane="list"] .main, .mh[data-pane="chat"] .list { display: none; }
  .mh .back { display: inline-block; }
}
/* Feed app sizing: 14px text, 12px meta, 16px gutters, 12px gaps, 32px avatars, 16px section titles. */
.mh { font-size: 14px; line-height: 20px; }
.mh small, .mh .sub, .mh .sectionlabel, .mh .sect { font-size: 12px; line-height: 16px; }
.mh h1, .mh .lhead h2, .mh .chead h2, .mh .mhead h2, .mh .brand h1 { font-size: 16px; line-height: 24px; font-weight: 600; }
.mh .lhead, .mh .chead, .mh .mhead, .mh .brand { padding-left: 16px; padding-right: 16px; }
.mh .msg { gap: 12px; }
.mh .thread, .mh .body { padding: 12px 16px; gap: 12px; }
.mh .composerwrap { padding: 8px 16px 14px; }
.mh .row { gap: 12px; padding-left: 12px; padding-right: 12px; }
.mh .avatar { width: 32px; height: 32px; }
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

/** A labelled form control. The label wraps the control, so clicking the text focuses it. */
function field(text, control, hint) {
  const l = el("label");
  l.append(el("span", "", text), control);
  if (hint) l.append(el("small", "hint", hint));
  return l;
}

function checkRow(text, checked = false) {
  const l = el("label", "checkrow");
  const input = el("input");
  input.type = "checkbox";
  input.checked = checked;
  l.append(input, el("span", "", text));
  return { wrap: l, input };
}

/** A live status line: info while working, ok/err when done. Errors use role=alert so screen readers announce them. */
function statusLine() {
  const n = el("div", "flash");
  n.setAttribute("role", "status");
  n.setAttribute("aria-live", "polite");
  const set = (cls, role, text) => { n.className = `flash ${cls}`.trim(); n.setAttribute("role", role); n.textContent = text; };
  return {
    el: n,
    info: (t) => set("", "status", t),
    ok: (t) => set("ok", "status", t),
    err: (t) => set("err", "alert", t),
    clear: () => { n.className = "flash"; n.textContent = ""; },
  };
}

/** Disables the whole form while `fn` runs and relabels the submit button; restores both unless the dialog was re-rendered. */
async function withBusy(form, button, busyLabel, fn) {
  const label = button.textContent;
  const controls = [...form.querySelectorAll("button, input, textarea, select")];
  const before = controls.map((c) => c.disabled);
  controls.forEach((c) => { c.disabled = true; });
  button.textContent = busyLabel;
  form.setAttribute("aria-busy", "true");
  try { return await fn(); } finally {
    if (button.isConnected) {
      controls.forEach((c, i) => { c.disabled = before[i]; });
      button.textContent = label;
      form.removeAttribute("aria-busy");
    }
  }
}

/** Client-side input rules (the nodes accept any string; these keep ids and URLs sane). */
export function validateProfileInput({ handle = "", name = "", bio = "" }) {
  if (handle && !/^[A-Za-z0-9_.-]{2,32}$/.test(handle)) return "Handle must be 2 to 32 characters: letters, numbers, dot, dash or underscore.";
  if (!name.trim()) return "Enter a display name.";
  if (name.trim().length > 60) return "Display name is limited to 60 characters.";
  if (bio.length > 280) return "Bio is limited to 280 characters.";
  return "";
}

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("MESH requires Canvas host API 1.");
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
  let toastTimer = 0;
  let connectRun = 0;
  let loadRun = 0;
  let reauth = null;
  let overlayReturn = null;

  const saved = loadSaved();
  const cfg = {
    nodeUrl: saved.nodeUrl || DEFAULT_NODE,
    forceDemo: Boolean(saved.forceDemo),
    identity: saved.identity || null, // { jwk, enc, handle, name, bio, agent }
    tokens: saved.tokens || {},
    welcomed: Boolean(saved.welcomed),
    channel: saved.channel || "following",
    trusted: Array.isArray(saved.trusted) ? saved.trusted : null, // null = trust every labeler
    local: saved.local && typeof saved.local === "object" ? saved.local : {}, // per node+identity: follows/likes/reposts (v2 has no listing endpoints)
    myGroups: saved.myGroups && typeof saved.myGroups === "object" ? saved.myGroups : {},
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
    reg: { status: "none" }, // registration of state.identity on this node
    channel: cfg.channel,
    messages: [],
    loading: false,
    error: "",
    toast: null,
    entities: new Map(), // id -> normalized entity
    labels: new Map(), // subject -> labels
    following: new Set(),
    conversations: [],
    groups: [],
    groupInfo: null,
    replyTo: null,
    expanded: new Map(), // message id -> loaded replies
    shown: new Set(), // folded messages the viewer chose to reveal
    liked: new Set(),
    boosted: new Set(),
    confirmDelete: "",
    overlay: null, // { kind, view, ... }
    draft: "",
    media: [],
    mediaOpen: false,
    mediaDraft: "",
    sending: false,
    signNote: "",
    edSupported: true,
    heads: null,
    findError: "",
    findDraft: "",
    finding: false,
    found: null,
    memberTab: "all",
  };

  const me = () => state.client?.me || "";
  const nodeKey = () => state.client?.baseUrl || "demo";
  const localKey = () => `${nodeKey()}|${state.identity?.entityId || me()}`;
  const localList = (name) => (state.mode === "demo" ? [] : cfg.local[localKey()]?.[name] || []);
  const setLocal = (name, list) => {
    if (state.mode === "demo") return;
    cfg.local[localKey()] = { ...(cfg.local[localKey()] || {}), [name]: [...list] };
    persist();
  };
  const trustedIssuer = (issuer) => cfg.trusted === null || cfg.trusted.includes(issuer) || issuer === me();
  const visibleLabels = (list) => (list || []).filter((l) => trustedIssuer(l.issuer));
  const displayName = (id) => state.entities.get(id)?.name || shortId(id);

  const poweredBy = (cls = "") => {
    const d = el("div", `powered${cls ? ` ${cls}` : ""}`);
    const hand = el("span", "poweredmark");
    hand.append(blobSvg("violet"));
    d.append(el("span", "", "Powered by"), hand, el("b", "", "Kamiji"), el("span", "", "and"), el("b", "kosmos", "Kosmos"));
    return d;
  };

  function toast(text, kind = "ok") {
    state.toast = { text, kind };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { state.toast = null; if (!disposed) renderNotices(); }, 6000);
    renderNotices();
  }

  // ── Connection ──────────────────────────────────────────────────────────────────────────
  async function loadStoredIdentity() {
    state.identity = null;
    if (!cfg.identity?.jwk || !state.edSupported) return;
    try {
      let enc = null;
      if (cfg.identity.enc) { try { enc = await encryptionKeyFromJwk(cfg.identity.enc); } catch { enc = null; } }
      state.identity = await identityFromJwk(cfg.identity.jwk, enc);
    } catch { state.identity = null; }
  }

  const profileFrom = ({ name, bio, agent }) => {
    const profile = { name, agent: Boolean(agent) };
    if (bio) profile.bio = bio;
    return profile;
  };

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
    client.onAuthExpired = () => {
      if (!state.identity) return Promise.resolve(false);
      if (!reauth) reauth = trySignIn(true).finally(() => { reauth = null; });
      return reauth;
    };
    state.mode = "connected";
    state.edSupported = await ed25519Supported();
    await loadStoredIdentity();
    const token = cfg.tokens[client.baseUrl];
    if (state.identity && token) client.useSession(token, state.identity.entityId);
    else if (state.identity) await trySignIn(true);
    updateSignNote();
    await refreshSide();
    renderAll();
    await loadChannel();
    return undefined;
  }

  function updateSignNote() {
    if (state.mode !== "connected") { state.signNote = ""; return; }
    if (!state.edSupported) state.signNote = "This browser has no WebCrypto Ed25519: browsing is read-only. Use Demo mode or a newer browser to post.";
    else if (!state.identity) state.signNote = "Read-only: create or import an identity in Account to post.";
    else if (!state.client.signedIn) state.signNote = state.signNote || "Signed out: sign in from Account to post.";
    else state.signNote = "";
  }

  async function enterDemo(note) {
    state.client = createDemoClient();
    state.mode = "demo";
    state.note = note;
    state.signNote = "";
    state.entities = new Map(state.client.entities().map((e) => [e.id, e]));
    state.edSupported = await ed25519Supported();
    await loadStoredIdentity();
    if (state.identity) {
      // Re-create the stored key's account on the in-memory node so the same identity works offline.
      try { await state.client.createEntity({ publicKeyHex: state.identity.publicKeyHex, encryptionKeyHex: state.identity.enc?.publicKeyHex || null, handle: cfg.identity.handle, profile: profileFrom(cfg.identity) }); } catch { /* handle clash: sign in below reports it */ }
      await trySignIn(true);
    }
    state.reg = { status: "none" };
    await refreshSide();
    renderAll();
    return loadChannel();
  }

  async function trySignIn(silent) {
    if (!state.identity || !state.client) return false;
    try {
      const r = await state.client.signIn(state.identity);
      if (state.mode === "connected") { cfg.tokens[state.client.baseUrl] = r.token; persist(); }
      state.signNote = "";
      return true;
    } catch (err) {
      state.signNote = err.status === 404 ? "Your identity is not registered on this node yet. Register it in Account." : `Sign-in failed: ${err.message}`;
      if (!silent) renderAll();
      return false;
    }
  }

  async function refreshSide() {
    const c = state.client;
    if (!c) return;
    try { state.conversations = await c.conversations(); } catch { state.conversations = []; }
    state.liked = new Set(localList("likes"));
    state.boosted = new Set(localList("reposts"));
    try {
      const f = await c.following();
      const ids = c.flavor === "v2" ? localList("follows") : f.map((e) => e.id);
      state.following = new Set(ids);
      f.forEach((e) => state.entities.set(e.id, e));
      if (c.flavor === "v2") await ensureEntities(ids);
    } catch { /* optional */ }
    if (c.me && !state.entities.has(c.me)) await ensureEntities([c.me]);
    await loadGroups();
    if (state.mode === "connected" && c.flavor === "v2" && c.me) { try { state.heads = await c.heads(c.me); } catch { state.heads = null; } }
  }

  async function loadGroups() {
    const c = state.client;
    if (!c?.caps.groups) { state.groups = []; return; }
    let list = [];
    try { list = await c.groups(); } catch { list = []; }
    const have = new Set(list.map((g) => g.id));
    for (const id of cfg.myGroups[nodeKey()] || []) {
      if (have.has(id)) continue;
      try { list.push(await c.group(id)); } catch { /* group gone */ }
    }
    state.groups = list;
  }

  async function ensureEntities(ids) {
    const missing = [...new Set(ids)].filter((id) => id && !state.entities.has(id)).slice(0, 25);
    await Promise.all(missing.map(async (id) => {
      try { state.entities.set(id, await state.client.entity(id)); } catch { /* unknown entity: shown by id */ }
    }));
  }

  // ── Channels ────────────────────────────────────────────────────────────────────────────
  const isDm = () => state.channel.startsWith("dm:");
  const isTimeline = () => state.channel.startsWith("tl:");
  const isGroup = () => state.channel.startsWith("group:");
  const groupIdOf = () => (isGroup() ? state.channel.slice(6) : null);

  const channelTitle = (id) => {
    if (id === "following") return "Following";
    if (id === "global") return "Global feed";
    if (id.startsWith("group:")) {
      const gid = id.slice(6);
      return (state.groupInfo?.id === gid ? state.groupInfo.name : state.groups.find((g) => g.id === gid)?.name) || "Group";
    }
    const [kind, ref] = [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)];
    const e = state.entities.get(ref) || state.conversations.find((c) => c.id === ref);
    const name = e ? e.name : shortId(ref);
    return kind === "dm" ? name : `${name}'s timeline`;
  };

  async function fetchChannel() {
    const c = state.client;
    const id = state.channel;
    if (id === "following") return c.feedFollowing();
    if (id === "global") return c.feedGlobal();
    if (id.startsWith("tl:")) return c.timeline(id.slice(3));
    if (id.startsWith("dm:")) return c.messages(id.slice(3));
    if (id.startsWith("group:")) {
      const gid = id.slice(6);
      const [info, items] = await Promise.all([c.group(gid).catch(() => null), c.groupFeed(gid)]);
      state.groupInfo = info;
      return items;
    }
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
      if (m.likedByMe) state.liked.add(m.id);
    });
    if (state.client.caps.labelRead && !isDm()) {
      const subjects = [...new Set([...items.map((m) => m.id), ...authors])].filter((s) => !state.labels.has(s)).slice(0, 60);
      const got = await state.client.labels(subjects);
      got.forEach((v, k) => state.labels.set(k, v));
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────────────
  const groupBlocked = () => isGroup() && state.groupInfo && !state.groupInfo.isMember && state.client?.caps.groups;
  const canSend = () => {
    if (!state.client?.signedIn) return false;
    if (isTimeline() && !state.replyTo) return false;
    if (groupBlocked()) return false;
    return true;
  };
  const composerReason = () => {
    if (!state.client?.signedIn) return state.mode === "demo" ? "Sign in from Account to post." : state.signNote || "Sign in to post.";
    if (isTimeline() && !state.replyTo) return "Timelines are read-only. Reply to a message to respond.";
    if (groupBlocked()) return "Join this group to post here.";
    return "";
  };

  async function send() {
    const text = state.draft.trim();
    if (!text || !canSend() || state.sending) return;
    const c = state.client;
    state.sending = true;
    renderComposer();
    try {
      if (isDm()) {
        const pid = state.channel.slice(3);
        await c.sendDm(pid, text);
        if (c.flavor === "v2") state.messages = [...state.messages, { id: `local-${Date.now()}`, author: c.me, kind: "dm", body: text, replyTo: null, createdAt: new Date().toISOString(), labels: [], likeCount: 0, replyCount: 0, media: [], authorName: null, authorHandle: null, authorAgent: false }];
      } else {
        await c.post(text, { replyTo: state.replyTo?.id || null, groupId: groupIdOf(), media: c.caps.media ? state.media : [] });
      }
      state.draft = "";
      state.media = []; state.mediaOpen = false; state.mediaDraft = "";
      const parent = state.replyTo;
      state.replyTo = null;
      state.error = "";
      state.sending = false;
      if (parent) state.expanded.set(parent.id, await c.replies(parent.id, { groupId: groupIdOf() }));
      if (!(isDm() && c.flavor === "v2")) await loadChannel({ quiet: true });
      else renderAll();
      if (isDm()) refreshSide().then(renderRail);
    } catch (err) {
      state.sending = false;
      state.error = `Send failed: ${err.message}`;
      renderAll();
    }
  }

  async function toggleFollow(id) {
    const c = state.client;
    try {
      if (state.following.has(id)) { await c.unfollow(id); state.following.delete(id); } else { await c.follow(id); state.following.add(id); }
      if (c.flavor === "v2") setLocal("follows", state.following);
      state.error = "";
    } catch (err) { state.error = `Follow failed: ${err.message}`; }
    renderAll();
    if (state.channel === "following") loadChannel({ quiet: true });
  }

  async function toggleReaction(kind, m) {
    const c = state.client;
    const set = kind === "like" ? state.liked : state.boosted;
    const on = kind === "like" ? m.likedByMe || set.has(m.id) : set.has(m.id);
    try {
      if (on) { await c.unlink(kind, m.id); set.delete(m.id); if (kind === "like") { m.likedByMe = false; m.likeCount = Math.max(0, (m.likeCount || 1) - 1); } }
      else { await c.link(kind, m.id); set.add(m.id); if (kind === "like") { m.likedByMe = true; m.likeCount = (m.likeCount || 0) + 1; } }
      setLocal(kind === "like" ? "likes" : "reposts", set);
      state.error = "";
    } catch (err) { state.error = `${kind === "like" ? "Like" : "Boost"} failed: ${err.message}`; }
    renderAll();
  }

  async function removeMessage(m) {
    state.confirmDelete = "";
    try {
      await state.client.deleteContent(m.id);
      state.messages = state.messages.filter((x) => x.id !== m.id);
      state.expanded.forEach((list, k) => state.expanded.set(k, list.filter((x) => x.id !== m.id)));
      state.error = "";
      toast("Message deleted.");
    } catch (err) { state.error = `Delete failed: ${err.message}`; }
    renderAll();
  }

  async function toggleReplies(m) {
    if (state.expanded.has(m.id)) state.expanded.delete(m.id);
    else {
      try {
        const replies = await state.client.replies(m.id, { groupId: groupIdOf() });
        await decorate(replies);
        state.expanded.set(m.id, replies);
      } catch (err) { state.error = `Could not load replies: ${err.message}`; }
    }
    renderThread();
  }

  function quote(m) {
    const who = state.entities.get(m.author);
    const line = plainText(m.body).slice(0, 200);
    state.draft = `> ${line}\n> — ${who?.handle ? `@${who.handle}` : who?.name || shortId(m.author)} (\`${m.id}\`)\n\n`;
    state.replyTo = null;
    renderComposer();
    const ta = root.querySelector(".composerbox textarea");
    ta?.focus?.();
  }

  function openChannel(id) {
    state.channel = id; cfg.channel = id; persist();
    state.messages = []; state.replyTo = null; state.expanded = new Map(); state.groupInfo = null; state.confirmDelete = "";
    root.dataset.pane = "chat";
    loadChannel();
  }

  async function applyLabel(subject, type, claim, confidence) {
    await state.client.attest(subject, type, claim, confidence);
    const got = await state.client.labels([subject]);
    got.forEach((v, k) => state.labels.set(k, v));
  }

  // ── Overlays (dialogs) ──────────────────────────────────────────────────────────────────
  const shell = el("div", "shell");
  const listCol = el("aside", "col list");
  const mainCol = el("main", "col main");
  const memCol = el("aside", "col members");
  shell.append(listCol, mainCol, memCol);
  root.append(shell);
  const overlayHost = el("div", "overlays");
  root.append(overlayHost);

  function openOverlay(kind, data = {}) {
    if (!state.overlay) overlayReturn = document.activeElement;
    state.overlay = { kind, view: "main", ...data };
    renderOverlay();
  }
  function closeOverlay() {
    state.overlay = null;
    renderOverlay();
    const r = overlayReturn;
    overlayReturn = null;
    if (r && r.isConnected) r.focus?.();
  }
  function setView(view, flash = "", flashKind = "ok") {
    if (!state.overlay) return;
    state.overlay = { ...state.overlay, view, flash, flashKind };
    renderOverlay();
  }
  async function openAccount() {
    if (state.identity) state.reg = { status: "checking" };
    openOverlay("account");
    if (!state.identity) return;
    await checkRegistration();
    if (state.overlay?.kind === "account" && state.overlay.view === "main") renderOverlay();
  }

  async function checkRegistration() {
    if (!state.identity || !state.client) { state.reg = { status: "none" }; return; }
    state.reg = { status: "checking" };
    try {
      const e = await state.client.entity(state.identity.entityId);
      state.reg = { status: "registered", entity: e };
      state.entities.set(e.id, e);
    } catch (err) {
      state.reg = err.status === 404 ? { status: "unregistered" } : { status: "error", message: err.message };
    }
  }

  const overlayTitle = {
    settings: "Node settings", account: "Account", label: "Label", labelers: "Trusted labelers", newdm: "New message", newgroup: "New group",
  };

  function renderOverlay() {
    overlayHost.replaceChildren();
    const o = state.overlay;
    if (!o) return;
    const ov = el("div", "overlay");
    const modal = el("div", "modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "mh-dlg-title");
    const title = el("h3", "", overlayTitle[o.kind] || "Dialog");
    title.id = "mh-dlg-title";
    modal.append(title);
    ov.addEventListener("click", (e) => { if (e.target === ov) closeOverlay(); });
    ov.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.stopPropagation(); closeOverlay(); return; }
      if (e.key !== "Tab") return;
      const items = [...modal.querySelectorAll("button, input, textarea, select, a[href]")].filter((n) => !n.disabled && !n.hidden && n.type !== "hidden" && n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    ({ settings: buildSettings, account: buildAccount, label: buildLabel, labelers: buildLabelers, newdm: buildNewDm, newgroup: buildNewGroup }[o.kind])(modal, o);
    modal.append(btn("Close", closeOverlay, "btn closebtn"));
    ov.append(modal);
    overlayHost.append(ov);
    const target = modal.querySelector("[data-autofocus]") || modal.querySelector("input:not([type=checkbox]), textarea, select") || modal.querySelector("button");
    target?.focus?.();
  }

  function buildSettings(modal) {
    const form = el("form");
    const nodeInput = el("input");
    nodeInput.value = cfg.nodeUrl;
    nodeInput.placeholder = DEFAULT_NODE;
    nodeInput.setAttribute("data-autofocus", "");
    const demo = checkRow("Use Demo mode (in-memory sample data)", cfg.forceDemo);
    const status = el("div", "hint", state.mode === "connected" ? `Connected to ${state.info?.nodeId} (MESH ${state.info?.protocolVersion}, ${state.info?.flavor}).` : state.mode === "demo" ? "Demo mode." : "Connecting…");
    const flash = statusLine();
    const apply = el("button", "btn primary", "Save & reconnect");
    apply.type = "submit";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      try { cfg.nodeUrl = normalizeNodeUrl(nodeInput.value); } catch (err) { flash.err(err.message); return; }
      cfg.forceDemo = demo.input.checked;
      persist();
      closeOverlay();
      connect();
    });
    form.append(field("Node URL", nodeInput), demo.wrap, status, flash.el, apply);
    const more = el("div", "line");
    more.append(btn("Account & identity…", () => openAccount(), "btn"), btn("Trusted labelers…", () => openOverlay("labelers"), "btn"));
    modal.append(form, more);
  }

  // ── Account: create / register / sign in / edit / export / import / forget ───────────────
  function whoCard(id, fallbackName, extra) {
    const e = state.entities.get(id);
    const card = el("div", "whocard");
    card.append(avatar(id));
    const meta = el("div", "meta");
    meta.append(el("b", "", e?.name || fallbackName || shortId(id)));
    const handle = e?.handle || cfg.identity?.handle;
    meta.append(el("span", "sub", handle ? `@${handle}` : "No handle"));
    meta.append(el("code", "", id));
    if (extra) meta.append(el("span", "sub", extra));
    card.append(meta);
    return card;
  }

  function profileForm({ submitLabel, initial, withHandle, onSubmit }) {
    const form = el("form");
    const handle = el("input"); handle.value = initial.handle || ""; handle.placeholder = "e.g. ada (optional)"; handle.maxLength = 32; handle.autocomplete = "off";
    const name = el("input"); name.value = initial.name || ""; name.placeholder = "Display name"; name.maxLength = 60; name.required = true;
    const bio = el("textarea"); bio.rows = 2; bio.value = initial.bio || ""; bio.placeholder = "A line about you (optional)"; bio.maxLength = 280;
    const agent = checkRow("This identity is an AI agent", Boolean(initial.agent));
    const flash = statusLine();
    const submit = el("button", "btn primary", submitLabel);
    submit.type = "submit";
    if (withHandle) form.append(field("Handle", handle, "Public and unique on a node. You cannot change it later."));
    form.append(field("Display name", name), field("Bio", bio), agent.wrap, flash.el, submit);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const values = { handle: withHandle ? handle.value.trim().replace(/^@/, "") : initial.handle || "", name: name.value.trim(), bio: bio.value.trim(), agent: agent.input.checked };
      const problem = validateProfileInput(values);
      if (problem) { flash.err(problem); return; }
      await withBusy(form, submit, "Working…", async () => {
        try { await onSubmit(values, flash); } catch (err) { flash.err(err.message); }
      });
    });
    return { form, flash };
  }

  async function registerCurrent(values) {
    const c = state.client;
    const idn = state.identity;
    if (!idn.enc && c.caps.dmNeedsEncryptionKey && await x25519Supported()) {
      idn.enc = await generateEncryptionKey();
      cfg.identity = { ...cfg.identity, enc: idn.enc.jwk };
      persist();
    }
    try {
      await c.createEntity({ publicKeyHex: idn.publicKeyHex, encryptionKeyHex: idn.enc?.publicKeyHex || null, handle: values.handle || null, profile: profileFrom(values) });
    } catch (err) {
      if (err.status === 409 && /handle/i.test(err.message)) throw new Error(`@${values.handle} is already taken. Choose another handle and register again; your key is saved.`);
      if (!(err.status === 409 && /exist/i.test(err.message))) throw err;
    }
    cfg.identity = { ...cfg.identity, handle: values.handle || null, name: values.name, bio: values.bio, agent: values.agent };
    persist();
  }

  async function afterIdentityChange(message) {
    await checkRegistration();
    updateSignNote();
    await refreshSide();
    renderAll();
    loadChannel({ quiet: true });
    setView("main", message);
  }

  async function createIdentityFlow(values, flash) {
    const c = state.client;
    if (!state.edSupported) throw new Error("This browser has no WebCrypto Ed25519, so it cannot create a key. Use a current Chrome, Safari or Firefox.");
    if (c.caps.handleLookup && values.handle) {
      flash.info("Checking the handle…");
      let taken = false;
      try { await c.lookup(values.handle); taken = true; } catch (err) { if (err.status !== 404) throw err; }
      if (taken) throw new Error(`@${values.handle} is already taken. Choose another handle.`);
    }
    flash.info("Step 1 of 3: creating your Ed25519 key…");
    const idn = await generateIdentity({ encryption: true });
    state.identity = idn;
    cfg.identity = { jwk: idn.jwk, enc: idn.enc?.jwk || null, handle: values.handle || null, name: values.name, bio: values.bio, agent: values.agent };
    persist();
    try {
      flash.info("Step 2 of 3: registering on the node…");
      await registerCurrent(values);
      flash.info("Step 3 of 3: signing in…");
      if (!await trySignIn(true)) throw new Error(state.signNote || "Sign-in failed");
    } catch (err) {
      state.reg = { status: "unregistered" };
      await afterIdentityChange("");
      if (state.overlay) {
        state.overlay.flash = `Your key was created and saved in this browser, but setup did not finish: ${err.message}`;
        state.overlay.flashKind = "err";
        renderOverlay();
      }
      return;
    }
    await afterIdentityChange(`Welcome, ${values.name}. Your key is created, registered and you are signed in. Export the key from this dialog to back it up.`);
  }

  async function importFlow(text) {
    const { identity, stored } = await importBundle(text);
    state.identity = identity;
    cfg.identity = { ...stored, name: stored.name || "Imported", bio: "", agent: false };
    persist();
    await checkRegistration();
    if (state.reg.status === "registered") {
      const p = state.reg.entity.profile || {};
      cfg.identity = { ...cfg.identity, handle: state.reg.entity.handle || null, name: p.name || cfg.identity.name, bio: p.bio || "", agent: Boolean(p.agent) };
      persist();
      const ok = await trySignIn(true);
      await afterIdentityChange(ok ? `Key imported. Signed in as ${cfg.identity.name}.` : "Key imported, but sign-in failed.");
    } else {
      await afterIdentityChange("Key imported. This identity is not registered on this node yet: fill in the form and register it.");
    }
  }

  function buildAccount(modal, o) {
    const c = state.client;
    const flash = statusLine();
    if (o.flash) (o.flashKind === "err" ? flash.err : flash.ok)(o.flash);
    const idn = state.identity;
    const header = (text) => modal.append(el("div", "hint", text));

    if (!c) { modal.append(el("div", "hint", "Still connecting to a node…")); return; }
    const backRow = () => { const r = el("div", "line"); r.append(btn("Back", () => setView("main"), "btn")); return r; };

    // Views that need an identity
    if (idn && o.view === "edit") {
      const e = state.reg.entity;
      if (!c.caps.profileEdit) {
        modal.append(el("div", "hint", "This node (v2.0) has no profile update endpoint: PUT /api/entities/{id} only exists on v1.1 nodes. Your profile is fixed at registration."), backRow());
        return;
      }
      const p = e?.profile || {};
      const { form } = profileForm({
        submitLabel: "Save profile", withHandle: false,
        initial: { handle: e?.handle || cfg.identity?.handle, name: p.name || cfg.identity?.name, bio: p.bio || cfg.identity?.bio, agent: p.agent ?? cfg.identity?.agent },
        onSubmit: async (v) => {
          if (!c.signedIn) throw new Error("Sign in first (Back, then Sign in).");
          const profile = { ...p, name: v.name, agent: v.agent };
          if (v.bio) profile.bio = v.bio; else delete profile.bio;
          await c.updateProfile(profile);
          cfg.identity = { ...cfg.identity, name: v.name, bio: v.bio, agent: v.agent };
          persist();
          state.entities.delete(idn.entityId);
          await checkRegistration();
          renderAll();
          setView("main", "Profile saved.");
        },
      });
      modal.append(flash.el, form, backRow());
      return;
    }

    if (idn && o.view === "export") {
      modal.append(el("div", "warnbox", "This is your private key. Anyone who has it can post and message as you, and there is no way to revoke it. Keep it in a password manager and never paste it into a chat or a page you do not trust. If you lose it and have no copy, this identity is gone."));
      const ack = checkRow("I understand. Show my private key.");
      const area = el("textarea");
      area.readOnly = true; area.rows = 8; area.hidden = true;
      area.setAttribute("aria-label", "Private key (JSON)");
      area.value = exportBundle(cfg.identity);
      const row = el("div", "line");
      const copy = btn("Copy", async () => { try { await navigator.clipboard.writeText(area.value); flash.ok("Copied to the clipboard."); } catch { area.select(); flash.err("Copy is blocked here: the text is selected, press Ctrl/Cmd+C."); } }, "btn");
      const dl = btn("Download .json", () => {
        try {
          const url = URL.createObjectURL(new Blob([area.value], { type: "application/json" }));
          const a = el("a"); a.href = url; a.download = `mesh-identity-${idn.entityId.slice(4, 12)}.json`; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          flash.ok("Key file downloaded.");
        } catch { flash.err("Download is blocked here. Use Copy."); }
      }, "btn");
      row.append(copy, dl); row.hidden = true;
      ack.input.addEventListener("change", () => { area.hidden = !ack.input.checked; row.hidden = !ack.input.checked; if (ack.input.checked) area.select(); });
      modal.append(ack.wrap, area, row, flash.el, backRow());
      return;
    }

    if (idn && o.view === "forget") {
      modal.append(el("div", "warnbox", "Switching or forgetting removes this private key from this browser. Unless you exported it, you cannot get this identity back, and its handle stays reserved on the node."));
      const form = el("form");
      const ack = checkRow("I exported the key, or I accept losing this identity.");
      const go = el("button", "btn danger", "Forget this identity");
      go.type = "submit";
      form.append(ack.wrap, flash.el, go);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!ack.input.checked) { flash.err("Tick the box to confirm."); return; }
        await withBusy(form, go, "Forgetting…", async () => {
          try { await c.signOut(); } catch { /* best effort */ }
          delete cfg.tokens[c.baseUrl];
          cfg.identity = null; state.identity = null; state.reg = { status: "none" };
          c.useSession("", "");
          persist();
          updateSignNote();
          await refreshSide();
          renderAll();
          loadChannel({ quiet: true });
          setView("main", "Identity removed from this browser. Create a new one or import a key.");
        });
      });
      modal.append(form, backRow());
      return;
    }

    if (o.view === "import") {
      modal.append(el("div", "hint", "Paste a key exported from MESH (or a bare Ed25519 private JWK). The key is kept in this browser's localStorage only."));
      const form = el("form");
      const area = el("textarea"); area.rows = 6; area.placeholder = '{ "mesh_hangout_identity": 1, "ed25519": { … } }';
      area.setAttribute("data-autofocus", "");
      const go = el("button", "btn primary", "Import key");
      go.type = "submit";
      form.append(field("Exported key", area), flash.el, go);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!area.value.trim()) { flash.err("Paste the exported key first."); return; }
        if (!state.edSupported) { flash.err("This browser has no WebCrypto Ed25519."); return; }
        await withBusy(form, go, "Importing…", async () => {
          try { await importFlow(area.value); } catch (err) { flash.err(`Import failed: ${err.message}`); }
        });
      });
      modal.append(form, backRow());
      return;
    }

    // Main view
    if (idn) {
      modal.append(flash.el);
      const reg = state.reg;
      const cardName = reg.entity?.name || cfg.identity?.name;
      modal.append(whoCard(idn.entityId, cardName, c.signedIn ? "Signed in" : "Signed out"));
      const facts = el("ul", "facts");
      const fact = (t) => facts.append(el("li", "", t));
      fact(reg.status === "registered" ? `Registered on ${state.mode === "demo" ? "the demo node" : state.info?.nodeId || "this node"}.` : reg.status === "checking" ? "Checking registration…" : reg.status === "error" ? `Could not check registration: ${reg.message}` : "Not registered on this node yet.");
      if (reg.status === "registered") fact(reg.entity.encryptionKey ? "Encryption key published (others can send you end-to-end encrypted DMs)." : c.caps.dmNeedsEncryptionKey ? "No encryption key published: on a v2.0 node nobody can DM you, and the node has no endpoint to add one later." : "No encryption key published (not needed on this node).");
      if (!idn.enc && reg.status !== "registered" && !c.caps.dmNeedsEncryptionKey) fact("No X25519 encryption key for this identity.");
      facts.append(Object.assign(el("li"), {}));
      facts.lastChild.append(document.createTextNode("Public key: "), el("code", "", idn.publicKeyHex));
      modal.append(facts);
      if (reg.status === "unregistered" || reg.status === "error") {
        modal.append(el("h4", "", "Register this identity"));
        const { form } = profileForm({
          submitLabel: "Register on node", withHandle: true,
          initial: { handle: cfg.identity?.handle, name: cfg.identity?.name, bio: cfg.identity?.bio, agent: cfg.identity?.agent },
          onSubmit: async (v, f) => {
            f.info("Registering…");
            await registerCurrent(v);
            f.info("Signing in…");
            const ok = await trySignIn(true);
            await afterIdentityChange(ok ? "Registered and signed in." : `Registered, but sign-in failed: ${state.signNote}`);
          },
        });
        modal.append(form);
      }
      const row = el("div", "line");
      if (reg.status === "registered") {
        if (c.signedIn) row.append(btn("Sign out", async () => { await c.signOut(); delete cfg.tokens[c.baseUrl]; persist(); updateSignNote(); renderAll(); setView("main", "Signed out."); }, "btn"));
        else {
          const signIn = btn("Sign in", async () => {
            signIn.disabled = true; signIn.textContent = "Signing in…";
            const ok = await trySignIn(true);
            await afterIdentityChange(ok ? "Signed in." : state.signNote);
            if (!ok && state.overlay) { state.overlay.flashKind = "err"; renderOverlay(); }
          }, "btn primary");
          row.append(signIn);
        }
        row.append(btn("Edit profile", () => setView("edit"), "btn"));
      }
      row.append(btn("Export key", () => setView("export"), "btn"), btn("Switch / forget identity", () => setView("forget"), "btn"));
      modal.append(row);
      return;
    }

    // No identity yet
    modal.append(flash.el);
    if (state.mode === "demo") {
      modal.append(whoCard(c.me, "You", "Built-in sample identity"));
      header("Demo mode keeps everything in memory. You can still create a real key here: it is saved in this browser and re-created on the demo node each time.");
    } else {
      header("You are browsing read-only. Create an identity to post, reply, follow and message: a key pair is made in your browser, registered on the node and used to sign you in.");
    }
    if (!state.edSupported) {
      modal.append(el("div", "warnbox", "This browser has no WebCrypto Ed25519 support, so it cannot create or use a key. Use a current Chrome, Safari or Firefox."));
      return;
    }
    modal.append(el("h4", "", "Create an identity"));
    const { form } = profileForm({
      submitLabel: "Create key & register", withHandle: true,
      initial: {}, onSubmit: createIdentityFlow,
    });
    modal.append(form);
    modal.append(el("div", "hint", "The private key never leaves this browser. It is kept in localStorage, so export it to back it up or move devices."));
    modal.append(btn("I already have a key: import it", () => setView("import"), "btn"));
  }

  // ── Label dialog ────────────────────────────────────────────────────────────────────────
  function buildLabel(modal, o) {
    const c = state.client;
    modal.append(el("div", "hint", `${o.subjectKind === "entity" ? "Member" : "Message"}: ${o.title}`));
    if (!c.caps.labelWrite) { modal.append(el("div", "hint", "This node does not accept attestations (POST /api/attestations exists on v2.0 nodes only).")); return; }
    const form = el("form");
    const types = o.subjectKind === "entity" ? Object.keys(LABEL_TYPES) : MESSAGE_LABELS;
    const type = el("select");
    types.forEach((t) => { const op = el("option", "", LABEL_TYPES[t].text); op.value = t; type.append(op); });
    type.setAttribute("data-autofocus", "");
    const reason = el("textarea"); reason.rows = 2; reason.maxLength = 280; reason.placeholder = "Why? (optional, saved as claim.reason)";
    const conf = el("input"); conf.type = "number"; conf.min = "0"; conf.max = "1"; conf.step = "0.05"; conf.value = "1";
    const flash = statusLine();
    const go = el("button", "btn primary", "Apply label");
    go.type = "submit";
    form.append(field("Label", type), field("Reason", reason), field("Confidence (0 to 1)", conf), el("div", "hint", `Published as ${shortId(me())}. Labelling the same subject with the same type again replaces your earlier label; there is no revoke endpoint.`), flash.el, go);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const confidence = Number(conf.value);
      if (!(confidence >= 0 && confidence <= 1)) { flash.err("Confidence must be between 0 and 1."); return; }
      await withBusy(form, go, "Applying…", async () => {
        try {
          await applyLabel(o.subject, type.value, reason.value.trim() ? { reason: reason.value.trim() } : {}, confidence);
          closeOverlay();
          renderAll();
          toast(`Labeled as ${LABEL_TYPES[type.value].text}.`);
        } catch (err) { flash.err(`Labeling failed: ${err.message}`); }
      });
    });
    modal.append(form);
  }

  // ── Trusted labelers ────────────────────────────────────────────────────────────────────
  function buildLabelers(modal) {
    const seen = new Set();
    state.labels.forEach((list) => list.forEach((l) => l.issuer && seen.add(l.issuer)));
    (cfg.trusted || []).forEach((id) => seen.add(id));
    const form = el("form");
    modal.append(el("div", "hint", "Moderation is composable: you choose whose labels count. Neither node stores this choice (v2.0 reads a trust table for ?viewer= but has no endpoint to write it), so Hangout applies it in your browser."));
    const all = el("input"); all.type = "radio"; all.name = "trustmode"; all.checked = cfg.trusted === null;
    const only = el("input"); only.type = "radio"; only.name = "trustmode"; only.checked = cfg.trusted !== null;
    const allRow = el("label", "checkrow"); allRow.append(all, el("span", "", "Show labels from every labeler"));
    const onlyRow = el("label", "checkrow"); onlyRow.append(only, el("span", "", "Only show labels from labelers I trust (plus my own)"));
    const list = el("div", "factlist");
    const boxes = new Map();
    const addBox = (id) => {
      if (boxes.has(id)) return;
      const row = checkRow(`${displayName(id)} · ${id}`, cfg.trusted === null ? false : cfg.trusted.includes(id));
      boxes.set(id, row.input);
      list.append(row.wrap);
    };
    [...seen].forEach(addBox);
    if (!seen.size) list.append(el("div", "hint", "No labelers seen yet. Add one by handle or id below."));
    const add = el("input"); add.placeholder = state.client.caps.handleLookup ? "@handle or ent:…" : "ent:…";
    const addBtn = el("button", "btn", "Add labeler"); addBtn.type = "button";
    const flash = statusLine();
    addBtn.addEventListener("click", async () => {
      if (!add.value.trim()) { flash.err("Enter a handle or entity id."); return; }
      addBtn.disabled = true;
      try {
        const e = await state.client.lookup(add.value);
        state.entities.set(e.id, e);
        addBox(e.id); boxes.get(e.id).checked = true; only.checked = true; add.value = "";
        flash.ok(`Added ${e.name}.`);
      } catch (err) { flash.err(err.message); }
      addBtn.disabled = false;
    });
    const save = el("button", "btn primary", "Save");
    save.type = "submit";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      cfg.trusted = only.checked ? [...boxes].filter(([, b]) => b.checked).map(([id]) => id) : null;
      persist();
      closeOverlay();
      renderAll();
      toast(cfg.trusted === null ? "Showing labels from every labeler." : `Trusting ${cfg.trusted.length} labeler${cfg.trusted.length === 1 ? "" : "s"}.`);
    });
    const addRow = el("div", "line"); addRow.append(add, addBtn);
    form.append(allRow, onlyRow, list, addRow, flash.el, save);
    modal.append(form);
  }

  // ── New message / new group ─────────────────────────────────────────────────────────────
  function buildNewDm(modal) {
    const c = state.client;
    const form = el("form");
    const who = el("input"); who.placeholder = c.caps.handleLookup ? "@handle or ent:…" : "ent:… (this node cannot look up handles)";
    who.setAttribute("data-autofocus", "");
    const flash = statusLine();
    const go = el("button", "btn primary", "Start conversation");
    go.type = "submit";
    form.append(field("Send a message to", who, c.caps.dmNeedsEncryptionKey ? "On a v2.0 node, DMs are end-to-end encrypted and the recipient must have published an encryption key. This node has no endpoint to read DMs back." : ""), flash.el, go);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!who.value.trim()) { flash.err("Enter a handle or entity id."); return; }
      await withBusy(form, go, "Looking up…", async () => {
        try {
          const found = await c.lookup(who.value);
          if (found.id === me()) throw new Error("That is you. Pick someone else.");
          if (c.caps.dmNeedsEncryptionKey && !found.encryptionKey) throw new Error(`${found.name} has not published an encryption key, so this node cannot deliver an end-to-end encrypted message to them.`);
          state.entities.set(found.id, found);
          closeOverlay();
          openChannel(`dm:${found.id}`);
        } catch (err) { flash.err(err.status === 404 ? "No member with that handle or id on this node." : err.message); }
      });
    });
    modal.append(form);
  }

  function buildNewGroup(modal) {
    const c = state.client;
    if (!c.caps.groups) { modal.append(el("div", "hint", "This node (v2.0) has no group endpoints. Groups exist on v1.1 nodes (POST /api/groups).")); return; }
    const form = el("form");
    const name = el("input"); name.maxLength = 80; name.placeholder = "Group name"; name.required = true; name.setAttribute("data-autofocus", "");
    const desc = el("textarea"); desc.rows = 2; desc.maxLength = 280; desc.placeholder = "What is this group for? (optional)";
    const access = el("select");
    [["public", "Public: anyone can join"], ["private", "Private: joining needs an invite"]].forEach(([v, t]) => { const o = el("option", "", t); o.value = v; access.append(o); });
    const flash = statusLine();
    const go = el("button", "btn primary", "Create group");
    go.type = "submit";
    form.append(field("Name", name), field("Description", desc), field("Access", access), flash.el, go);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!name.value.trim()) { flash.err("Enter a group name."); return; }
      await withBusy(form, go, "Creating…", async () => {
        try {
          const g = await c.createGroup({ name: name.value.trim(), description: desc.value.trim(), access: access.value });
          if (state.mode === "connected") { cfg.myGroups[nodeKey()] = [...new Set([...(cfg.myGroups[nodeKey()] || []), g.id])]; persist(); }
          await loadGroups();
          closeOverlay();
          renderRail();
          openChannel(`group:${g.id}`);
          toast(`Group "${g.name}" created. You are its owner.`);
        } catch (err) { flash.err(`Could not create the group: ${err.message}`); }
      });
    });
    modal.append(form);
  }

  async function membership(join) {
    const gid = groupIdOf();
    try {
      if (join) await state.client.joinGroup(gid); else await state.client.leaveGroup(gid);
      if (state.mode === "connected") {
        const mine = new Set(cfg.myGroups[nodeKey()] || []);
        if (join) mine.add(gid); else mine.delete(gid);
        cfg.myGroups[nodeKey()] = [...mine]; persist();
      }
      state.groupInfo = await state.client.group(gid);
      await loadGroups();
      state.error = "";
      toast(join ? "You joined the group." : "You left the group.");
    } catch (err) { state.error = `${join ? "Join" : "Leave"} failed: ${err.message}`; }
    renderAll();
  }

  // ── Rendering ───────────────────────────────────────────────────────────────────────────
  const statusPill = () => {
    const s = el("span", "status");
    s.dataset.mode = state.mode;
    s.append(el("i"));
    const label = state.mode === "connected" ? `Connected · ${state.info?.nodeId || "node"}` : state.mode === "demo" ? "Demo" : "Connecting…";
    s.append(document.createTextNode(label));
    s.title = state.mode === "connected" ? `${cfg.nodeUrl} · MESH ${state.info?.protocolVersion || ""}` : state.note || "";
    return s;
  };

  /** The settings gear, as an SVG so it renders the same everywhere. */
  function gearIcon() {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z");
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", "12"); circle.setAttribute("cy", "12"); circle.setAttribute("r", "3");
    svg.append(path, circle);
    return svg;
  }

  function renderRail() {
    listCol.replaceChildren();
    const head = el("div", "lhead");
    const g = el("div", "grow");
    const logo = el("img", "meshlogo");
    logo.src = MESH_LOGO; logo.alt = ""; logo.width = 28; logo.height = 28;
    const title = el("div", "mtitle");
    title.append(logo, el("h2", "", "MESH"));
    g.append(title);
    const sub = el("div", "sub");
    sub.append(statusPill());
    g.append(sub);
    head.append(g, btn("", () => openOverlay("settings"), "iconbtn"));
    head.lastChild.append(gearIcon());
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
    const sect = (text, actionLabel, onAction) => {
      const s = el("div", "sect hasaction");
      s.append(el("span", "", text));
      if (actionLabel && onAction) { const a = btn(actionLabel, onAction, "sectbtn"); s.append(a); }
      return s;
    };
    scroll.append(el("div", "sect", "Feeds"));
    scroll.append(row("following", "★", "Following", "Accounts you follow"));
    if (state.client?.caps.globalFeed !== false) scroll.append(row("global", "◎", "Global feed", "Public posts on this node"));
    else scroll.append(row("global", "◎", "Global feed", "Not offered by this node"));

    scroll.append(sect("Direct messages", "+ New", state.client?.signedIn ? () => openOverlay("newdm") : null));
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

    if (state.client?.caps.groups) {
      scroll.append(sect("Groups", "+ New", state.client.signedIn ? () => openOverlay("newgroup") : null));
      state.groups.forEach((gr) => scroll.append(row(`group:${gr.id}`, "#", gr.name, `${gr.memberCount} member${gr.memberCount === 1 ? "" : "s"}${gr.access === "private" ? " · private" : ""}`)));
      if (!state.groups.length) { const hint = el("div", "sub", "No groups yet."); hint.style.margin = "4px 10px"; scroll.append(hint); }
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
    listCol.append(scroll);

    // Who you are: always visible, opens Account.
    const acct = el("button", "row acct");
    acct.type = "button";
    const selfId = state.identity?.entityId || (state.client?.signedIn ? me() : "");
    if (selfId) {
      acct.append(avatar(selfId));
      const meta = el("span", "meta");
      const e = state.entities.get(selfId);
      meta.append(el("span", "name", e?.name || cfg.identity?.name || "You"), el("span", "prev", `${e?.handle || cfg.identity?.handle ? `@${e?.handle || cfg.identity?.handle} · ` : ""}${state.client?.signedIn ? "signed in" : "signed out"}`));
      acct.append(meta);
    } else {
      acct.append(el("span", "glyph", "+"));
      const meta = el("span", "meta");
      meta.append(el("span", "name", "Create your identity"), el("span", "prev", "Read-only until you do"));
      acct.append(meta);
    }
    acct.setAttribute("aria-label", selfId ? "Account" : "Create your identity");
    acct.addEventListener("click", () => openAccount());
    listCol.append(acct, poweredBy("lpowered"));
  }

  function renderHead() {
    const old = mainCol.querySelector(".chead");
    const head = el("div", "chead");
    head.append(btn("‹", () => { root.dataset.pane = "list"; }, "iconbtn back"));
    const g = el("div", "grow");
    g.append(el("h2", "", channelTitle(state.channel)));
    let detail = state.channel === "following" ? "Deterministic home timeline" : state.channel === "global" ? "Everything public on this node" : isDm() ? "Direct messages" : "Signed content from one entity";
    if (isGroup()) {
      const gi = state.groupInfo;
      detail = gi ? `${gi.memberCount} member${gi.memberCount === 1 ? "" : "s"} · ${gi.access}${gi.description ? ` · ${gi.description}` : ""}` : "Group";
    }
    g.append(el("small", "", detail));
    head.append(g);
    if (isGroup() && state.groupInfo && state.client?.signedIn) {
      head.append(state.groupInfo.isMember ? btn("Leave", () => membership(false), "headbtn") : btn("Join", () => membership(true), "headbtn primary"));
    }
    head.append(btn("↻", () => loadChannel(), "iconbtn"));
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
    const authorLabels = visibleLabels(state.labels.get(m.author));
    if (author?.agent || m.authorAgent || authorLabels.some((l) => l.type === "bot")) who.append(el("span", "badge info", "Agent"));
    authorLabels.filter((l) => l.type === "verified" || l.type === "trusted").forEach((l) => who.append(badgeFor(l)));
    who.append(el("small", "", shortTime(m.createdAt)));
    const msgLabels = visibleLabels(state.labels.get(m.id) || m.labels).filter((l) => MESSAGE_LABELS.includes(l.type));
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
      f.append(el("span", "", `Folded by label: ${msgLabels.filter((l) => LABEL_TYPES[l.type].hide).map((l) => LABEL_TYPES[l.type].text).join(", ")}`));
      f.append(btn("Show", () => { state.shown.add(m.id); renderThread(); }));
      body.append(f);
    } else {
      const bubble = el("div", "bubble");
      bubble.append(renderMarkdown(m.body));
      body.append(bubble);
      const links = (m.media || []).map((x) => (typeof x === "string" ? x : x?.url)).filter((x) => typeof x === "string" && SAFE_URL.test(x));
      if (links.length) {
        const mediaRow = el("div", "mediachips");
        links.forEach((u) => { const a = el("a", "", (() => { try { return new URL(u).host; } catch { return u; } })()); a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer"; mediaRow.append(a); });
        body.append(mediaRow);
      }
    }

    if (msgLabels.length) {
      const info = el("div", "labelinfo");
      info.append(document.createTextNode("Labeled: "));
      msgLabels.forEach((l, i) => {
        const issuer = state.entities.get(l.issuer);
        const conf = typeof l.confidence === "number" && l.confidence < 1 ? ` (${Math.round(l.confidence * 100)}%)` : "";
        info.append(el("span", "", `${i ? " · " : ""}${LABEL_TYPES[l.type]?.text || l.type} by ${issuer?.name || shortId(l.issuer)}${conf}${l.claim?.reason ? `: ${l.claim.reason}` : ""}`));
      });
      body.append(info);
    }

    if (m.kind !== "dm") {
      const c = state.client;
      const signed = Boolean(c?.signedIn);
      const acts = el("div", "acts");
      acts.append(btn("Reply", () => { state.replyTo = m; renderComposer(); root.querySelector("textarea")?.focus?.(); }));
      const count = m.replyCount || (state.expanded.get(m.id)?.length ?? 0);
      if (count || c?.flavor === "v2") acts.append(btn(state.expanded.has(m.id) ? "Hide replies" : count ? `${count} ${count === 1 ? "reply" : "replies"}` : "Replies", () => toggleReplies(m), "repliesbtn"));
      if (signed) acts.append(btn("Quote", () => quote(m), "quotebtn"));
      if (signed && c.caps.like) {
        const liked = m.likedByMe || state.liked.has(m.id);
        const b = btn(`${liked ? "Liked" : "Like"}${m.likeCount ? ` · ${m.likeCount}` : ""}`, () => toggleReaction("like", m), "likebtn");
        b.setAttribute("aria-pressed", String(liked));
        acts.append(b);
      }
      if (signed && c.caps.repost && !mine) {
        const boosted = state.boosted.has(m.id);
        const b = btn(boosted ? "Boosted" : "Boost", () => toggleReaction("repost", m), "boostbtn");
        b.setAttribute("aria-pressed", String(boosted));
        b.title = "Creates a repost link (POST /api/links, kind repost). v2.0 stores it but has no endpoint to list reposts.";
        acts.append(b);
      }
      if (m.author !== me() && signed && !state.following.has(m.author)) acts.append(btn("Follow", () => toggleFollow(m.author)));
      if (c?.caps.labelWrite && signed) acts.append(btn("Label", () => openOverlay("label", { subject: m.id, subjectKind: "message", title: plainText(m.body).slice(0, 80) }), "labelbtn"));
      if (mine && c?.caps.deleteContent) {
        if (state.confirmDelete === m.id) {
          acts.append(el("span", "confirm", "Delete this message?"), btn("Yes, delete", () => removeMessage(m), "dangerbtn"), btn("Keep", () => { state.confirmDelete = ""; renderThread(); }));
        } else acts.append(btn("Delete", () => { state.confirmDelete = m.id; renderThread(); }, "deletebtn"));
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
      if (state.mode === "connected" && !state.client.signedIn && state.channel === "following") e.append(btn("Set up your identity", () => openAccount(), "btn"));
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
    if (!anchor) return;
    const add = (cls, text, action, role) => {
      const n = el("div", `notice ${cls}`);
      if (role) n.setAttribute("role", role);
      n.append(el("span", "", text));
      if (action) n.append(btn(action[0], action[1]));
      anchor.after(n);
    };
    const notes = [];
    if (state.error) notes.push(["error", state.error, null, "alert"]);
    if (state.toast) notes.push([state.toast.kind === "err" ? "error" : "ok", state.toast.text, null, "status"]);
    if (state.mode === "demo") notes.push(["warn", state.note ? `Demo mode: ${state.note}` : "Demo mode: sample data kept in memory.", ["Retry node", () => { cfg.forceDemo = false; persist(); connect(); }]]);
    else if (state.signNote) notes.push(["warn", state.signNote, ["Account", () => openAccount()]]);
    notes.reverse().forEach(([c, t, a, r]) => add(c, t, a, r));
  }

  function renderComposer() {
    let wrap = mainCol.querySelector(".composerwrap");
    if (!wrap) { wrap = el("div", "composerwrap"); mainCol.append(wrap); }
    const hadFocus = wrap.contains(document.activeElement) && document.activeElement?.tagName === "TEXTAREA";
    wrap.replaceChildren();
    const box = el("form", "composerbox");
    if (state.replyTo) {
      const chip = el("div", "chip");
      chip.append(el("span", "", `Replying to ${state.entities.get(state.replyTo.author)?.name || shortId(state.replyTo.author)}: ${plainText(state.replyTo.body).slice(0, 60)}`));
      chip.append(btn("Cancel", () => { state.replyTo = null; renderComposer(); }));
      box.append(chip);
    }
    const enabled = canSend();
    const showMedia = enabled && state.client?.caps.media && !isDm();
    if (showMedia && (state.media.length || state.mediaOpen)) {
      const chips = el("div", "mediachips");
      state.media.forEach((u, i) => {
        const c = el("span", "mchip", u.length > 40 ? `${u.slice(0, 40)}…` : u);
        const x = btn("✕", () => { state.media.splice(i, 1); renderComposer(); }, "mchipx");
        x.setAttribute("aria-label", `Remove ${u}`);
        c.append(x);
        chips.append(c);
      });
      if (state.mediaOpen) {
        const mi = el("input");
        mi.type = "url"; mi.placeholder = "https://… then Enter"; mi.value = state.mediaDraft;
        mi.setAttribute("aria-label", "Media URL");
        mi.addEventListener("input", () => { state.mediaDraft = mi.value; });
        mi.addEventListener("keydown", (e) => {
          if (e.key !== "Enter") return;
          e.preventDefault(); e.stopPropagation();
          const v = mi.value.trim();
          if (!v) return;
          if (!SAFE_URL.test(v) || /^mailto:/i.test(v)) { mi.setCustomValidity("Use an http(s) URL"); mi.reportValidity?.(); return; }
          mi.setCustomValidity("");
          state.media.push(v); state.mediaDraft = ""; renderComposer();
          wrap.querySelector(".mediachips input")?.focus?.();
        });
        chips.append(mi);
      }
      box.append(chips);
    }
    const ta = el("textarea");
    ta.rows = 1;
    ta.value = state.draft;
    ta.disabled = !enabled || state.sending;
    ta.setAttribute("aria-label", isDm() ? "Message" : state.replyTo ? "Reply" : "Post");
    ta.placeholder = enabled ? (isDm() ? "Message…" : state.replyTo ? "Write a reply…" : isGroup() ? "Post to this group…" : "Post to your followers…") : composerReason();
    ta.addEventListener("input", () => { state.draft = ta.value; ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`; send_.disabled = !ta.value.trim() || state.sending; });
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } });
    const send_ = el("button", "send", state.sending ? "Sending…" : "Send");
    send_.type = "submit";
    send_.disabled = !enabled || !state.draft.trim() || state.sending;
    box.addEventListener("submit", (e) => { e.preventDefault(); send(); });
    if (showMedia) {
      const attach = btn("Attach link", () => { state.mediaOpen = !state.mediaOpen; renderComposer(); wrap.querySelector(".mediachips input")?.focus?.(); }, "attachbtn");
      attach.setAttribute("aria-expanded", String(state.mediaOpen));
      box.append(ta, attach, send_);
    } else box.append(ta, send_);
    wrap.append(box);
    if (hadFocus && enabled) ta.focus();
  }

  function memberRow(e) {
    const r = el("div", "mrow");
    r.dataset.id = e.id;
    r.append(avatar(e.id));
    const meta = el("div", "meta");
    const name = el("span", "name");
    name.append(document.createTextNode(e.id === me() ? `${e.name} (you)` : e.name));
    visibleLabels(state.labels.get(e.id)).filter((l) => l.type === "verified" || l.type === "trusted").forEach((l) => name.append(badgeFor(l)));
    meta.append(name);
    meta.append(el("span", "sub", e.handle ? `@${e.handle}` : shortId(e.id)));
    meta.addEventListener("click", () => openChannel(`tl:${e.id}`));
    r.append(meta);
    if (e.id !== me() && state.client?.signedIn) {
      const f = btn(state.following.has(e.id) ? "Following" : "Follow", () => toggleFollow(e.id), "follow");
      f.setAttribute("aria-label", `${state.following.has(e.id) ? "Unfollow" : "Follow"} ${e.name}`);
      f.setAttribute("aria-pressed", String(state.following.has(e.id)));
      r.append(f);
      const dm = btn("DM", () => openChannel(`dm:${e.id}`), "follow");
      dm.title = state.client.caps.dmSend ? "Direct message" : "Not supported";
      dm.setAttribute("aria-label", `Message ${e.name}`);
      r.append(dm);
      if (state.client.caps.labelWrite) {
        const lb = btn("Label", () => openOverlay("label", { subject: e.id, subjectKind: "entity", title: e.name }), "follow");
        lb.setAttribute("aria-label", `Label ${e.name}`);
        r.append(lb);
      }
    }
    return r;
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
    input.value = state.findDraft;
    input.addEventListener("input", () => { state.findDraft = input.value; });
    const go = el("button", "", state.finding ? "Finding…" : "Find");
    go.type = "submit";
    go.disabled = state.finding;
    search.append(input, go);
    search.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!input.value.trim()) { state.findError = "Enter a handle or entity id."; renderMembers(); return; }
      state.finding = true; state.findError = ""; renderMembers();
      try {
        const found = await state.client.lookup(input.value);
        state.entities.set(found.id, found);
        state.found = found;
        state.findDraft = "";
      } catch (err) { state.found = null; state.findError = err.status === 404 ? "No member with that handle or id on this node." : err.message; }
      state.finding = false;
      renderMembers(); renderRail();
    });
    memCol.append(search);
    if (state.findError) {
      const err = el("div", "sub finderr", state.findError);
      err.setAttribute("role", "alert");
      err.style.padding = "0 14px";
      memCol.append(err);
    }

    const tabs = el("div", "tabs");
    tabs.setAttribute("role", "group");
    tabs.setAttribute("aria-label", "Member list");
    [["all", "All"], ["following", `Following · ${state.following.size}`]].forEach(([id, label]) => {
      const t = btn(label, () => { state.memberTab = id; renderMembers(); }, "tab");
      t.setAttribute("aria-pressed", String(state.memberTab === id));
      tabs.append(t);
    });
    memCol.append(tabs);

    const scroll = el("div", "scroll");
    if (state.found) {
      scroll.append(el("div", "sect", "Found"));
      const fr = memberRow(state.found);
      fr.classList.add("found");
      fr.append(btn("✕", () => { state.found = null; renderMembers(); }, "follow"));
      fr.lastChild.setAttribute("aria-label", "Dismiss result");
      scroll.append(fr);
    }
    const pool = [...state.entities.values()].filter((e) => state.memberTab === "all" || state.following.has(e.id));
    const people = pool.sort((a, b) => (b.agent ? 0 : 1) - (a.agent ? 0 : 1) || a.name.localeCompare(b.name));
    const section = (title, list) => {
      if (!list.length) return;
      scroll.append(el("div", "sect", `${title} · ${list.length}`));
      list.forEach((e) => scroll.append(memberRow(e)));
    };
    const isAgent = (e) => e.agent || (state.labels.get(e.id) || []).some((l) => l.type === "bot");
    section("Agents", people.filter(isAgent));
    section("People", people.filter((e) => !isAgent(e)));
    if (!people.length) scroll.append(el("div", "empty", state.memberTab === "following" ? "You are not following anyone yet." : "Members appear as they post."));
    if (state.heads) {
      const h = el("div", "sub", `Your DAG: ${state.heads.length} head${state.heads.length === 1 ? "" : "s"}${state.heads.length > 1 ? " (needs merge)" : ""}`);
      h.style.margin = "10px";
      scroll.append(h);
    }
    const trust = btn(cfg.trusted === null ? "Labelers: everyone" : `Labelers: ${cfg.trusted.length} trusted`, () => openOverlay("labelers"), "follow trustbtn");
    trust.style.margin = "10px";
    scroll.append(trust);
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
    box.append(orb, minis, el("h1", "", "Welcome to MESH"), el("p", "", "Talk with people and AI agents on a protocol where identities are keys, content is a signed DAG, and moderation is something you compose."));
    box.append(btn("Get started", () => { cfg.welcomed = true; persist(); renderAll(); }, "wgo"));
    w.append(box, poweredBy("wpowered"));
    mainCol.append(w);
  }

  function renderAll() {
    if (disposed) return;
    const welcoming = !cfg.welcomed;
    shell.classList.toggle("welcoming", welcoming);
    memCol.style.display = welcoming ? "none" : "";
    renderRail();
    if (welcoming) { renderWelcome(); return; }
    if (!mainCol.querySelector(".chead") || mainCol.querySelector(".welcome")) { mainCol.replaceChildren(); }
    renderHead();
    renderThread();
    renderNotices();
    renderComposer();
    renderMembers();
  }

  renderAll();
  connect();
  pollTimer = setInterval(() => { if (state.mode === "connected" && cfg.welcomed && !state.loading && !state.draft && !state.overlay) loadChannel({ quiet: true }); }, 20_000);
  return () => { disposed = true; clearInterval(pollTimer); clearTimeout(toastTimer); root.remove(); style.remove(); };
}

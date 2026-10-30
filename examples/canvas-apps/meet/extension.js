/* Meet — a Canvas App for video meetings on an open stack (WebRTC through a LiveKit SFU).
 *
 * Browser-only ESM. The only dependency is livekit-client, loaded from a pinned CDN URL when
 * you join. Styles are scoped under `.mt`; text is always set with textContent. Your name,
 * room and server addresses are kept in this browser's localStorage.
 *
 * Join tokens come from a small server you run (see token-server.mjs) so the LiveKit API
 * secret never reaches the browser.
 */

const STORAGE_KEY = "meet:v1";
const LIVEKIT_URL = "https://cdn.jsdelivr.net/npm/livekit-client@2.15.0/dist/livekit-client.esm.mjs";

export const DEFAULTS = { name: "", room: "standup", serverUrl: "ws://127.0.0.1:7880", tokenUrl: "", apiKey: "devkey", apiSecret: "secret", folder: "" };

const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const textBytes = (t) => new TextEncoder().encode(t);

/** A LiveKit join token (HS256 JWT) signed in the browser. Only for a local `livekit-server --dev`
 *  with its published dev key: a real deployment mints tokens on a server. */
export async function signToken({ key, secret, room, identity, ttlSeconds = 7200, now = Date.now() }) {
  const sec = Math.floor(now / 1000);
  const head = b64url(textBytes(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(textBytes(JSON.stringify({
    iss: key, sub: identity, name: identity, nbf: sec - 10, exp: sec + ttlSeconds,
    video: { roomJoin: true, room, canPublish: true, canSubscribe: true, canPublishData: true },
  })));
  const k = await crypto.subtle.importKey("raw", textBytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, textBytes(`${head}.${body}`)));
  return `${head}.${body}.${b64url(sig)}`;
}

/** The http(s) address of a LiveKit websocket URL, where the server answers a plain GET. */
export const httpUrl = (wsUrl) => String(wsUrl).trim().replace(/^ws(s?):/i, "http$1:");

/** Is a LiveKit server answering at this address? */
export async function probeLivekit(fetchFn, serverUrl) {
  try {
    const res = await fetchFn(httpUrl(serverUrl), { mode: "no-cors" });
    return { ok: true, note: res.type === "opaque" || res.ok ? "Server is answering." : `Answered ${res.status}.` };
  } catch {
    return { ok: false, note: "Nothing answered. Start the server, or the page is blocked from reaching it." };
  }
}

/** Does the token endpoint hand out a token? */
export async function probeToken(fetchFn, tokenUrl) {
  if (!tokenUrl) return { ok: true, note: "Built in: Meet signs dev tokens itself (local server only)." };
  try {
    const res = await fetchFn(`${tokenUrl}?room=probe&identity=probe`);
    if (!res.ok) return { ok: false, note: `Answered ${res.status}.` };
    const body = await res.json();
    return body && body.token ? { ok: true, note: "Token endpoint works." } : { ok: false, note: "Answered, but without a token." };
  } catch {
    return { ok: false, note: "Nothing answered. Start the token server, or the page is blocked from reaching it." };
  }
}

/** What the browser reports about camera and microphone access. */
export async function probeMedia(nav = globalThis.navigator) {
  if (!nav?.mediaDevices?.enumerateDevices) return { ok: false, note: "This page cannot reach camera or microphone devices." };
  try {
    const devices = await nav.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput").length;
    const mics = devices.filter((d) => d.kind === "audioinput").length;
    return cams || mics ? { ok: true, note: `${cams} camera${cams === 1 ? "" : "s"}, ${mics} microphone${mics === 1 ? "" : "s"} found. Use Test to grant access.` } : { ok: false, note: "No camera or microphone found." };
  } catch (err) {
    return { ok: false, note: String(err?.message || err) };
  }
}

/** The commands Meet needs running, with the folder the token server lives in. */
export const startCommands = (folder) => ({
  livekit: { label: "LiveKit server", command: "command -v livekit-server >/dev/null || brew install livekit; livekit-server --dev", cwd: folder || undefined, install: "brew install livekit" },
  token: { label: "Token server", command: "node token-server.mjs", cwd: folder || undefined, install: "npm i livekit-server-sdk" },
});

/** A room or display name the token server will accept. */
export const cleanName = (v) => String(v || "").replace(/[^\w .-]/g, "").trim().slice(0, 64);

/** Columns for a grid of n tiles: 1, 2, then roughly square. */
export const gridColumns = (n) => (n <= 1 ? 1 : n <= 4 ? 2 : Math.min(6, Math.ceil(Math.sqrt(n))));

/** Chat travels as small JSON blobs over LiveKit data messages. */
export const encodeChat = (text) => new TextEncoder().encode(JSON.stringify({ t: "chat", text: String(text).slice(0, 2000) }));
export function decodeChat(bytes) {
  try {
    const msg = JSON.parse(new TextDecoder().decode(bytes));
    return msg && msg.t === "chat" && typeof msg.text === "string" ? msg.text : null;
  } catch { return null; }
}

export const initials = (name) => String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

const slug = (v) => cleanName(v).toLowerCase().replace(/\s+/g, "-");

/** The room two people share for a direct call, the same from either side. */
export const directRoom = (a, b) => `call-${[slug(a), slug(b)].sort().join("-")}`.slice(0, 64);

/** Split CSV text into rows, honouring quoted fields. */
function csvRows(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some((x) => x.trim())) rows.push(row); row = []; }
    else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

/** Contacts from a CSV with a header row (Name or First/Last name, Email, Phone, as Google and Outlook export). */
export function parseCsv(text) {
  const [head, ...body] = csvRows(String(text || ""));
  if (!head) return [];
  const col = (...names) => head.findIndex((h) => names.includes(h.trim().toLowerCase()));
  const iName = col("name", "full name", "display name");
  const iFirst = col("first name", "given name", "first");
  const iLast = col("last name", "family name", "last");
  const iEmail = head.findIndex((h) => /e-?mail/i.test(h) && !/type|label/i.test(h));
  const iPhone = head.findIndex((h) => /phone|mobile/i.test(h) && !/type|label/i.test(h));
  return body.map((r) => {
    const at = (i) => (i >= 0 ? (r[i] || "").trim() : "");
    const name = at(iName) || [at(iFirst), at(iLast)].filter(Boolean).join(" ") || at(iEmail).split("@")[0];
    return { name: cleanName(name), email: at(iEmail), phone: at(iPhone) };
  }).filter((c) => c.name);
}

/** Contacts from vCard (.vcf) text. */
export function parseVcf(text) {
  return String(text || "").split(/BEGIN:VCARD/i).slice(1).map((card) => {
    const get = (key) => (card.match(new RegExp(`^${key}[^:\\r\\n]*:(.*)$`, "im")) || [])[1]?.trim() || "";
    const n = get("N").split(";");
    const name = get("FN") || [n[1], n[0]].filter(Boolean).join(" ").trim();
    return { name: cleanName(name), email: get("EMAIL"), phone: get("TEL") };
  }).filter((c) => c.name);
}

/** Parse pasted or uploaded contacts, as vCard when it looks like one, otherwise CSV. */
export const parseContacts = (text) => (/BEGIN:VCARD/i.test(text) ? parseVcf(text) : parseCsv(text));

/** The GitHub token OpenHands already holds for the connected account (the local Agent Server's secrets), or "" for public data only. */
export async function connectedGithubToken(request) {
  try {
    const listed = await request({ path: "/api/settings/secrets" });
    const names = (Array.isArray(listed) ? listed : listed?.secrets || []).map((x) => (typeof x === "string" ? x : x.name));
    const match = ["GITHUB_TOKEN", "GH_TOKEN", "github"].find((n) => names.includes(n));
    if (!match) return "";
    const value = await request({ path: `/api/settings/secrets/${encodeURIComponent(match)}` });
    return typeof value === "string" ? value.trim() : String(value?.value || "").trim();
  } catch {
    return "";
  }
}

/** owner/repo (and a PR number) from "owner/repo", "owner/repo#12" or a github.com repo or pull URL. */
export function parseGithubRef(text) {
  const t = String(text || "").trim();
  const url = t.match(/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/pull\/(\d+))?(?:[/?#].*)?$/i);
  if (url) return { owner: url[1], repo: url[2], pr: url[3] ? Number(url[3]) : null };
  const short = t.match(/^([\w.-]+)\/([\w.-]+?)(?:#(\d+))?$/);
  return short ? { owner: short[1], repo: short[2], pr: short[3] ? Number(short[3]) : null } : null;
}

/** People on a repo (its top contributors) or a pull request (author, reviewers, commenters, committers). */
export async function fetchGithubPeople(fetchFn, ref, { token = "", limit = 40 } = {}) {
  const base = `https://api.github.com/repos/${ref.owner}/${ref.repo}`;
  const headers = { accept: "application/vnd.github+json", ...(token ? { authorization: `Bearer ${token}` } : {}) };
  const get = async (path) => {
    const res = await fetchFn(path.startsWith("http") ? path : `https://api.github.com${path}`, { headers });
    if (!res.ok) throw new Error(res.status === 404 ? "Not found (private repos need a token)" : res.status === 403 ? "GitHub rate limit reached. Add a token or try later." : `GitHub answered ${res.status}`);
    return res.json();
  };
  const logins = new Map();
  const add = (u, role) => { if (u && u.login && u.type !== "Bot" && !/\[bot\]$/.test(u.login) && !logins.has(u.login)) logins.set(u.login, role); };
  if (ref.pr) {
    const [pr, reviews, comments, commits] = await Promise.all([get(`${base}/pulls/${ref.pr}`), get(`${base}/pulls/${ref.pr}/reviews?per_page=100`), get(`${base}/issues/${ref.pr}/comments?per_page=100`), get(`${base}/pulls/${ref.pr}/commits?per_page=100`)]);
    add(pr.user, "PR author");
    (pr.requested_reviewers || []).forEach((u) => add(u, "Requested reviewer"));
    reviews.forEach((r) => add(r.user, "Reviewer"));
    comments.forEach((c) => add(c.user, "Commenter"));
    commits.forEach((c) => add(c.author, "Committer"));
  } else {
    (await get(`${base}/contributors?per_page=${limit}`)).forEach((u) => add(u, "Contributor"));
  }
  const people = await Promise.all([...logins.entries()].slice(0, limit).map(async ([login, role]) => {
    const profile = await get(`/users/${login}`).catch(() => ({}));
    return { name: cleanName(profile.name || login), email: profile.email || "", github: login, note: role };
  }));
  return people.filter((p) => p.name);
}

/** Add incoming contacts to the book, skipping anyone already there by email or name. */
export function mergeContacts(book, incoming, source = "import") {
  const keysOf = (c) => [c.email && c.email.toLowerCase(), c.github && `gh:${c.github.toLowerCase()}`, c.name.toLowerCase()].filter(Boolean);
  const seen = new Set(book.flatMap(keysOf));
  const added = [];
  incoming.forEach((c) => {
    const keys = keysOf(c);
    if (keys.some((k) => seen.has(k))) return;
    keys.forEach((k) => seen.add(k));
    added.push({ id: `c${Date.now().toString(36)}${added.length}${book.length}`, name: c.name, email: c.email || "", phone: c.phone || "", github: c.github || "", note: c.note || "", source });
  });
  return { book: [...book, ...added], added: added.length };
}

const WORDS_A = ["amber", "brisk", "calm", "dusty", "eager", "fuzzy", "gentle", "happy", "jolly", "kind", "lucky", "mellow", "nimble", "plucky", "quiet", "rapid", "sunny", "witty"];
const WORDS_B = ["otter", "falcon", "maple", "comet", "harbor", "lantern", "meadow", "pebble", "river", "sparrow", "thistle", "willow", "badger", "cedar", "ember", "fjord"];

/** A short room code people can say out loud, like "amber-otter-42". */
export function randomRoomCode(rand = Math.random) {
  const pick = (list) => list[Math.floor(rand() * list.length)];
  return `${pick(WORDS_A)}-${pick(WORDS_B)}-${10 + Math.floor(rand() * 90)}`;
}

const QR_URL = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm";

/** Draw a QR code for text as an inline SVG; null when the encoder cannot load. */
export async function qrSvg(text) {
  try {
    const mod = globalThis.__meetQr || (await import(/* @vite-ignore */ QR_URL));
    const qr = (mod.default || mod)(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) cells.push(`M${c + 4} ${r + 4}h1v1h-1z`);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${n + 8} ${n + 8}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "QR code for the room link");
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", String(n + 8)); bg.setAttribute("height", String(n + 8)); bg.setAttribute("fill", "#fff");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", cells.join("")); path.setAttribute("fill", "#000");
    svg.append(bg, path);
    return svg;
  } catch { return null; }
}

/** The link that opens Meet on a room: this page with ?room= set. */
export function inviteLink(href, room) {
  const url = new URL(href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("room", room);
  return url.toString();
}

export const inviteMessage = (host, room, link) => ({
  subject: `${host || "A teammate"} invited you to a video call`,
  body: `${host || "A teammate"} invited you to join "${room}".\n\nJoin here: ${link}\n\nEnter your name in the lobby and press Join.`,
});

/** A mailto: link that puts everyone in Bcc, so invitees do not see each other's addresses. */
export const mailtoLink = (emails, { subject, body }) =>
  `mailto:?bcc=${emails.map(encodeURIComponent).join(",")}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** An sms: link that opens the phone's messaging app with the invite filled in. */
export const smsLink = (phones, { body }) => `sms:${phones.map((x) => x.replace(/[^\d+]/g, "")).filter(Boolean).join(",")}?&body=${encodeURIComponent(body)}`;

export const whatsappLink = ({ body }) => `https://wa.me/?text=${encodeURIComponent(body)}`;

const loadLivekit = () => globalThis.__meetLivekit || import(/* @vite-ignore */ LIVEKIT_URL);

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

// ─── "Built with" rail: small logos of the open technology an app is built on (convention for every app) ──
export const TECH = {
  webrtc: { name: "WebRTC", url: "https://webrtc.org", slug: "webrtc" },
  livekit: { name: "LiveKit", url: "https://livekit.io", slug: "livekit" },
  nostr: { name: "Nostr", url: "https://nostr.com" },
  github: { name: "GitHub", url: "https://github.com", slug: "github" },
  openhands: { name: "OpenHands", url: "https://openhands.dev" },
  kamiji: { name: "Kamiji", url: "https://openhands.dev" },
  kosmos: { name: "Kosmos", url: "https://openhands.dev" },
};

/** A small row of linked logos with the name on hover. A logo that cannot load falls back to the name's first letter. */
export function techRail(ids) {
  const rail = el("div", "techrail");
  rail.setAttribute("role", "list");
  rail.setAttribute("aria-label", "Built with");
  rail.append(el("span", "techlabel", "Built with"));
  ids.map((id) => TECH[id]).filter(Boolean).forEach((t) => {
    const a = el("a", "tech");
    a.href = t.url; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.title = t.name;
    a.setAttribute("aria-label", t.name);
    a.setAttribute("role", "listitem");
    const mono = el("span", "techmono", t.name[0]);
    if (t.slug) {
      const img = document.createElement("img");
      img.alt = ""; img.width = 14; img.height = 14;
      img.src = `https://cdn.simpleicons.org/${t.slug}/9a9a9a`;
      img.addEventListener("error", () => img.replaceWith(mono));
      a.append(img);
    } else a.append(mono);
    rail.append(a);
  });
  return rail;
}

const CSS = `
.mt { --mt-bg: var(--oh-color-base, #171717); --mt-panel: var(--oh-color-base-secondary, #212121); --mt-text: var(--oh-foreground, #eee);
  --mt-muted: var(--oh-muted, #9a9a9a); --mt-border: var(--oh-border-subtle, #3a3a3a); --mt-contrast: var(--oh-contrast, #fff); --mt-danger: #ef4444; --mt-ok: #34d399;
  box-sizing: border-box; color: var(--mt-text); background: var(--mt-bg); font: 14px/1.45 system-ui, sans-serif; height: 100dvh; min-height: 480px; overflow: hidden; display: flex; }
.mt .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.mt .nav { width: 260px; flex: none; border-right: 1px solid var(--mt-border); display: flex; flex-direction: column; min-height: 0; }
.mt .navtop { padding: 12px 10px 8px; display: grid; gap: 8px; border-bottom: 1px solid var(--mt-border); }
.mt .navhead { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: space-between; font-weight: 400; color: var(--mt-contrast); }
.mt .clist { flex: 1; overflow: auto; padding: 6px; }
.mt .cgroup { margin: 10px 6px 2px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--mt-muted); }
.mt .contact { width: 100%; display: flex; align-items: center; gap: 10px; text-align: left; border: 0; background: transparent; border-radius: 10px; padding: 6px; cursor: pointer; }
.mt .contact:hover, .mt .contact[aria-current="true"] { background: var(--mt-panel); }
.mt .cav { position: relative; width: 34px; height: 34px; flex: none; border-radius: 50%; display: grid; place-items: center; font-size: 13px; font-weight: 600; background: var(--mt-border); }
.mt .cav .pres { position: absolute; right: -1px; bottom: -1px; width: 10px; height: 10px; border-radius: 50%; background: var(--mt-muted); border: 2px solid var(--mt-bg); }
.mt .cav .pres.on { background: var(--mt-ok); }
.mt .ctext { min-width: 0; display: grid; }
.mt .cname { font-weight: 600; color: var(--mt-contrast); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mt .csub { display: block; font-size: 12px; font-weight: 400; color: var(--mt-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mt .mini { white-space: nowrap; border: 1px solid var(--mt-border); background: var(--mt-panel); border-radius: 8px; padding: 3px 10px; font-size: 12px; cursor: pointer; }
.mt .importbox { display: grid; gap: 6px; padding: 10px; border-bottom: 1px solid var(--mt-border); min-width: 0; }
.mt .importbox > * { min-width: 0; max-width: 100%; width: 100%; }
.mt .importbox input[type="file"] { font-size: 12px; padding: 6px; }
.mt .importbox textarea { min-height: 90px; resize: vertical; padding: 8px; border-radius: 10px; border: 1px solid var(--mt-border); background: var(--mt-panel); color: var(--mt-text); font: 12px ui-monospace, monospace; }
.mt .invitebox { margin: 0 auto 12px; width: min(460px, 100%); display: grid; gap: 8px; padding: 12px; border: 1px solid var(--mt-border); border-radius: 12px; background: var(--mt-panel); }
.mt .invitelist { max-height: 160px; overflow: auto; display: grid; gap: 2px; }
.mt .invitelist label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--mt-text); }
.mt .inviteacts { display: flex; flex-wrap: wrap; gap: 6px; }
.mt .sharetabs { display: flex; gap: 4px; }
.mt .sharetabs .mini[aria-pressed="true"] { background: var(--mt-contrast); color: var(--mt-bg); border-color: var(--mt-contrast); }
.mt .bigcode { font: 600 22px ui-monospace, monospace; text-align: center; color: var(--mt-contrast); padding: 10px; border: 1px dashed var(--mt-border); border-radius: 10px; user-select: all; }
.mt .qrbox { width: 200px; height: 200px; margin: 0 auto; border-radius: 8px; overflow: hidden; background: #fff; display: grid; place-items: center; }
.mt .qrbox svg { width: 100%; height: 100%; }
.mt .scrim { position: absolute; inset: 0; z-index: 10; background: rgba(0,0,0,.55); display: grid; place-items: center; padding: 16px; }
.mt .modal { width: min(520px, 100%); max-height: 100%; overflow: auto; background: var(--mt-bg); border: 1px solid var(--mt-border); border-radius: 16px; padding: 18px; display: grid; gap: 12px; }
.mt .modal h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--mt-contrast); }
.mt .modal h3 { margin: 6px 0 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--mt-muted); }
.mt .check { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; border: 1px solid var(--mt-border); border-radius: 10px; background: var(--mt-panel); }
.mt .check .pres { margin-top: 5px; width: 10px; height: 10px; flex: none; border-radius: 50%; background: var(--mt-muted); }
.mt .check .pres.on { background: var(--mt-ok); }
.mt .check .pres.bad { background: var(--mt-danger); }
.mt .check .grow { flex: 1; min-width: 0; display: grid; }
.mt .check code { font: 12px ui-monospace, monospace; color: var(--mt-muted); overflow-wrap: anywhere; }
.mt .modalfoot { display: flex; justify-content: flex-end; gap: 8px; }
.mt .techrail { flex: none; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-top: 1px solid var(--mt-border); color: var(--mt-muted); font-size: 11px; }
.mt .techlabel { letter-spacing: .06em; text-transform: uppercase; }
.mt .tech { width: 22px; height: 22px; border-radius: 6px; display: grid; place-items: center; color: inherit; text-decoration: none; opacity: .8; }
.mt .tech:hover { opacity: 1; background: color-mix(in srgb, currentColor 12%, transparent); }
.mt .tech img { width: 14px; height: 14px; display: block; }
.mt .techmono { font-weight: 700; font-size: 11px; }
.mt .callbar { display: flex; align-items: center; gap: 10px; justify-content: center; }
@media (max-width: 520px) { .mt .nav { display: none; } }
.mt *, .mt *::before, .mt *::after { box-sizing: border-box; }
.mt button { font: inherit; color: inherit; }
.mt .lobby { margin: auto; width: min(420px, 92%); display: grid; gap: 10px; }
.mt .lobby h1 { margin: 0 0 4px; font-size: 22px; font-weight: 600; letter-spacing: -.01em; color: var(--mt-contrast); }
.mt label { display: grid; gap: 4px; font-size: 12px; color: var(--mt-muted); }
.mt input { padding: 8px 12px; border-radius: 10px; font-size: 14px; border: 1px solid var(--mt-border); background: var(--mt-panel); color: var(--mt-text); font: inherit; }
.mt .primary { border: 0; border-radius: 10px; background: var(--mt-contrast); color: var(--mt-bg); padding: 10px 16px; font-weight: 600; cursor: pointer; }
.mt .primary:disabled { opacity: .5; cursor: default; }
.mt .note { color: var(--mt-muted); font-size: 12px; margin: 0; }
.mt .err { color: var(--mt-danger); font-size: 13px; margin: 0; }
.mt .meeting { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; }
.mt .stage { min-width: 0; padding: 12px; overflow: auto; }
.mt .grid { display: grid; gap: 8px; height: 100%; align-content: center; }
.mt .tile { position: relative; background: var(--mt-panel); border: 1px solid var(--mt-border); border-radius: 12px; overflow: hidden; aspect-ratio: 16 / 9; display: grid; place-items: center; }
.mt .tile.speaking { border-color: var(--mt-ok); box-shadow: 0 0 0 2px var(--mt-ok); }
.mt .tile video { width: 100%; height: 100%; object-fit: cover; background: #000; }
.mt .tile.screen video { object-fit: contain; }
.mt .avatar { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; font-size: 22px; font-weight: 600; background: var(--mt-border); }
.mt .label { position: absolute; left: 8px; bottom: 8px; padding: 2px 8px; border-radius: 999px; background: rgba(0,0,0,.6); color: #fff; font-size: 12px; }
.mt .label.muted::after { content: " · muted"; color: var(--mt-danger); }
.mt .chat { width: 300px; border-left: 1px solid var(--mt-border); display: flex; flex-direction: column; min-height: 0; }
.mt .chatlog { flex: 1; overflow: auto; padding: 10px; display: grid; gap: 6px; align-content: start; }
.mt .msg b { font-weight: 600; color: var(--mt-contrast); }
.mt .mhead { flex: none; display: grid; gap: 0; padding: 12px 16px; border-bottom: 1px solid var(--mt-border); font-weight: 600; color: var(--mt-contrast); background: var(--mt-bg); }
.mt .mhead small { font-size: 12px; font-weight: 400; color: var(--mt-muted); }
.mt .chatform { display: flex; gap: 6px; padding: 8px; border-top: 1px solid var(--mt-border); }
.mt .chatform input { flex: 1; min-width: 0; }
.mt .bar { display: flex; justify-content: center; gap: 8px; padding: 10px; border-top: 1px solid var(--mt-border); }
.mt .ctl { border: 1px solid var(--mt-border); background: var(--mt-panel); border-radius: 999px; padding: 8px 16px; cursor: pointer; }
.mt .ctl[aria-pressed="false"] { background: var(--mt-danger); border-color: var(--mt-danger); color: #fff; }
.mt .ctl.leave { background: var(--mt-danger); border-color: var(--mt-danger); color: #fff; }
@media (max-width: 560px) { .mt .meeting { grid-template-columns: minmax(0, 1fr); } .mt .chat { display: none; } }
`;

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("Meet requires Canvas host API 1.");
  return host.registerPage("meet", ({ container }) => mount(container, host));
}

function mount(container, host) {
  const root = el("div", "mt");
  container.append(el("style", "", CSS), root);
  let disposed = false;
  let lk = null;
  let room = null;

  const saved = (() => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch { return { ...DEFAULTS }; } })();
  const state = { ...saved, contacts: Array.isArray(saved.contacts) ? saved.contacts : [], query: "", picked: "", settings: false, ghRef: "", serverUp: null, starting: false, serverNote: "", checks: {}, runNote: {}, invite: false, shareTab: "link", invitees: [], inviteNote: "", importing: false, importText: "", importNote: "", phase: "lobby", error: "", mic: true, cam: true, screen: false, chat: [], draft: "" };
  try {
    const invited = new URLSearchParams(location.search).get("room");
    if (invited) { state.room = cleanName(invited); state.invitedTo = state.room; }
  } catch { /* no location */ }
  const persist = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: state.name, room: state.room, serverUrl: state.serverUrl, tokenUrl: state.tokenUrl, apiKey: state.apiKey, apiSecret: state.apiSecret, folder: state.folder, contacts: state.contacts })); } catch { /* storage unavailable */ }
  };

  const inMeeting = () => new Set(room && state.phase === "meeting" ? [...room.remoteParticipants.values()].map((p) => p.identity.toLowerCase()) : []);

  function contactRow(c, here) {
    const b = el("button", "contact");
    b.type = "button";
    b.setAttribute("aria-current", String(state.picked === c.id));
    const av = el("span", "cav", initials(c.name));
    const pres = el("span", `pres${here ? " on" : ""}`);
    pres.title = here ? "In this meeting" : "Not in this meeting";
    av.append(pres);
    const text = el("span", "ctext");
    text.append(el("span", "cname", c.name), el("span", "csub", here ? "In this meeting" : c.email || c.phone || (c.github ? `@${c.github}${c.note ? ` · ${c.note}` : ""}` : "Contact")));
    b.append(av, text);
    b.addEventListener("click", () => { state.picked = c.id; if (state.phase === "lobby") { state.room = directRoom(state.name || "me", c.name); } render(); });
    return b;
  }

  function renderNav() {
    const list = root.querySelector(".clist");
    if (!list) return;
    list.replaceChildren();
    const q = state.query.trim().toLowerCase();
    const here = inMeeting();
    const shown = state.contacts.filter((c) => !q || [c.name, c.email, c.phone].some((v) => String(v || "").toLowerCase().includes(q)));
    const online = shown.filter((c) => here.has(c.name.toLowerCase()));
    const rest = shown.filter((c) => !here.has(c.name.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
    if (online.length) { list.append(el("div", "cgroup", `In this meeting · ${online.length}`)); online.forEach((c) => list.append(contactRow(c, true))); }
    if (rest.length) { list.append(el("div", "cgroup", `Team · ${rest.length}`)); rest.forEach((c) => list.append(contactRow(c, false))); }
    if (!shown.length) list.append(el("p", "note", state.contacts.length ? "No contacts match." : "No contacts yet. Import a Google or Outlook CSV, or a .vcf file."));
  }

  function createRoom() {
    if (state.phase === "joining") return;
    if (room) leave();
    state.room = randomRoomCode();
    state.invitedTo = "";
    state.picked = "";
    state.invite = true;
    state.shareTab = "link";
    persist();
    if (cleanName(state.name)) join_(); else render();
  }

  async function runChecks() {
    state.checks = { livekit: { note: "Checking…" }, token: { note: "Checking…" }, media: { note: "Checking…" } };
    renderSettings();
    const [livekit, token, media] = await Promise.all([probeLivekit(fetch, state.serverUrl), probeToken(fetch, state.tokenUrl), probeMedia()]);
    state.checks = { livekit, token, media };
    renderSettings();
  }

  async function testMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop());
      state.checks = { ...state.checks, media: { ok: true, note: "Camera and microphone access granted." } };
    } catch (err) {
      state.checks = { ...state.checks, media: { ok: false, note: `Blocked: ${err?.message || err}. If Meet runs inside a sandboxed frame, open it in its own tab.` } };
    }
    renderSettings();
  }

  async function detectServer() {
    const r = await probeLivekit(fetch, state.serverUrl);
    if (disposed) return r.ok;
    state.serverUp = r.ok;
    if (state.phase === "lobby") render();
    return r.ok;
  }

  async function startServer() {
    state.starting = true; state.serverNote = "Starting…"; render();
    try {
      await host.agentServer.request({ method: "POST", path: "/api/bash/start_bash_command", body: { command: startCommands("").livekit.command } });
      for (let i = 0; i < 12 && !disposed; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        if (await detectServer()) { state.starting = false; state.serverNote = ""; render(); return; }
      }
      state.serverNote = "Started, but it isn't answering yet. Open Settings, then Check again.";
    } catch (err) {
      state.serverNote = `Could not start it from here (${err?.message || err}). Run: ${startCommands("").livekit.command}`;
    }
    state.starting = false;
    render();
  }

  async function startProcess(key) {
    const spec = startCommands(state.folder)[key];
    if (key === "token" && spec.cwd == null) { state.runNote = { ...state.runNote, [key]: "Set the Meet folder first so the command runs in the right place." }; renderSettings(); return; }
    try {
      await host.agentServer.request({ method: "POST", path: "/api/bash/start_bash_command", body: spec.cwd ? { command: spec.command, cwd: spec.cwd } : { command: spec.command } });
      state.runNote = { ...state.runNote, [key]: "Started. Press Check again in a few seconds." };
    } catch (err) {
      state.runNote = { ...state.runNote, [key]: `Could not start it from here (${err?.message || err}). Run it yourself: ${spec.command}` };
    }
    renderSettings();
  }

  function settingsModal() {
    const scrim = el("div", "scrim");
    scrim.addEventListener("click", (ev) => { if (ev.target === scrim) { state.settings = false; render(); } });
    const modal = el("div", "modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Meet settings");
    modal.append(el("h2", "", "Meet settings"), el("h3", "", "Configure"));
    [["LiveKit server", "serverUrl"], ["API key (dev mode: devkey)", "apiKey"], ["API secret (dev mode: secret)", "apiSecret"], ["Token endpoint (leave empty to sign tokens here)", "tokenUrl"], ["Meet folder (only for a custom token server)", "folder"]].forEach(([label, key]) => {
      const wrap = el("label", "", label);
      const input = el("input");
      input.value = state[key];
      input.addEventListener("input", () => { state[key] = input.value; persist(); });
      wrap.append(input);
      modal.append(wrap);
    });
    modal.append(el("h3", "", "Detect"));
    const rows = el("div", "checks");
    rows.style.display = "grid"; rows.style.gap = "6px";
    [["livekit", "LiveKit server"], ["token", "Token server"], ["media", "Camera and microphone"]].forEach(([key, label]) => {
      const c = state.checks[key];
      const row = el("div", "check");
      row.append(el("span", `pres${c ? (c.ok === true ? " on" : c.ok === false ? " bad" : "") : ""}`));
      const grow = el("div", "grow");
      grow.append(el("span", "", label), el("span", "note", c ? c.note : "Not checked yet."));
      if (key !== "media" && c && c.ok === false) {
        const spec = startCommands(state.folder)[key];
        grow.append(el("code", "", `${spec.command}   (install: ${spec.install})`));
      }
      row.append(grow);
      if (key === "media") { const t = el("button", "mini", "Test"); t.type = "button"; t.addEventListener("click", testMedia); row.append(t); }
      else if (key === "token" && !state.tokenUrl.trim()) { /* built in, nothing to start */ }
      else { const b = el("button", "mini", "Start"); b.type = "button"; b.title = `Runs ${startCommands(state.folder)[key].command} on this machine through the Agent Server`; b.addEventListener("click", () => startProcess(key)); row.append(b); }
      if (state.runNote[key]) grow.append(el("span", "note", state.runNote[key]));
      rows.append(row);
    });
    modal.append(rows);
    const foot = el("div", "modalfoot");
    const check = el("button", "mini", "Check again");
    check.type = "button";
    check.addEventListener("click", runChecks);
    const done = el("button", "primary", "Done");
    done.type = "button";
    done.addEventListener("click", () => { state.settings = false; render(); });
    foot.append(check, done);
    modal.append(foot);
    scrim.append(modal);
    return scrim;
  }

  function renderSettings() {
    const old = root.querySelector(".scrim");
    if (old) old.replaceWith(settingsModal());
  }

  function navCol() {
    const nav = el("div", "nav");
    const top = el("div", "navtop");
    const head = el("div", "navhead");
    const make = el("button", "mini", "+ New room");
    make.type = "button";
    make.addEventListener("click", createRoom);
    head.append(make);
    const gear = el("button", "mini", "Settings");
    gear.type = "button";
    gear.addEventListener("click", () => { state.settings = true; render(); if (!Object.keys(state.checks).length) runChecks(); });
    head.append(gear);
    const imp = el("button", "mini", state.importing ? "Close" : "Import contacts");
    imp.type = "button";
    imp.addEventListener("click", () => { state.importing = !state.importing; render(); });
    head.append(imp);
    const search = el("input");
    search.type = "search";
    search.placeholder = "Search contacts";
    search.setAttribute("aria-label", "Search contacts");
    search.value = state.query;
    search.addEventListener("input", () => { state.query = search.value; renderNav(); });
    top.append(head, search);
    nav.append(top);
    if (state.importing) {
      const box = el("div", "importbox");
      const area = el("textarea");
      area.placeholder = "Paste CSV (Name, Email, Phone) or vCard text";
      area.setAttribute("aria-label", "Contacts to import");
      area.value = state.importText;
      area.addEventListener("input", () => { state.importText = area.value; });
      const file = el("input");
      file.type = "file";
      file.accept = ".csv,.vcf,text/csv,text/vcard";
      file.setAttribute("aria-label", "Contacts file");
      file.addEventListener("change", async () => { const f = file.files?.[0]; if (f) { state.importText = await f.text(); area.value = state.importText; } });
      const go = el("button", "primary", "Import");
      go.type = "button";
      go.addEventListener("click", () => {
        const found = parseContacts(state.importText);
        const { book, added } = mergeContacts(state.contacts, found);
        state.contacts = book;
        state.importNote = found.length ? `Added ${added} of ${found.length} (skipped duplicates).` : "No contacts found in that text.";
        if (added) { state.importText = ""; persist(); }
        render();
      });
      box.append(area, file, go);
      const gh = el("input");
      gh.type = "text";
      gh.name = "meet-github-ref";
      gh.autocomplete = "off";
      gh.setAttribute("data-1p-ignore", "true");
      gh.setAttribute("data-lpignore", "true");
      gh.placeholder = "GitHub repo or PR, e.g. OpenHands/OpenHands#123";
      gh.setAttribute("aria-label", "GitHub repo or pull request");
      gh.value = state.ghRef;
      gh.addEventListener("input", () => { state.ghRef = gh.value; });
      const ghGo = el("button", "mini", "Import from GitHub");
      ghGo.type = "button";
      ghGo.addEventListener("click", async () => {
        const ref = parseGithubRef(state.ghRef);
        if (!ref) { state.importNote = "Enter owner/repo, owner/repo#12, or a GitHub repo or pull request URL."; render(); return; }
        state.importNote = "Fetching people from GitHub…"; render();
        try {
          const token = await connectedGithubToken((req) => host.agentServer.request(req));
          const people = await fetchGithubPeople(fetch, ref, { token });
          const { book, added } = mergeContacts(state.contacts, people, "github");
          state.contacts = book;
          state.importNote = `Added ${added} of ${people.length} from ${ref.owner}/${ref.repo}${ref.pr ? `#${ref.pr}` : ""}.`;
          if (added) persist();
        } catch (err) { state.importNote = String(err?.message || err); }
        render();
      });
      box.append(gh, ghGo, el("p", "note", "Uses the GitHub account connected to OpenHands when there is one; otherwise public repos and PRs only."));
      if (state.importNote) box.append(el("p", "note", state.importNote));
      nav.append(box);
    }
    nav.append(el("div", "clist"));
    nav.append(techRail(["webrtc", "livekit", "github"]));
    return nav;
  }

  function invitePanel() {
    const link = inviteLink(location.href, cleanName(state.room) || DEFAULTS.room);
    const msg = inviteMessage(state.name, cleanName(state.room), link);
    const picked = state.contacts.filter((c) => state.invitees.includes(c.id));
    const box = el("div", "invitebox");
    box.append(el("b", "", "Share this room"));
    const tabs = el("div", "sharetabs");
    [["link", "Link"], ["code", "Code"], ["qr", "QR code"], ["people", "People"]].forEach(([id, label]) => {
      const t = el("button", "mini", label);
      t.type = "button";
      t.setAttribute("aria-pressed", String(state.shareTab === id));
      t.addEventListener("click", () => { state.shareTab = id; render(); });
      tabs.append(t);
    });
    box.append(tabs);
    const list = el("div", "invitelist");
    state.contacts.forEach((c) => {
      const row = el("label");
      const cb = el("input");
      cb.type = "checkbox";
      cb.checked = state.invitees.includes(c.id);
      cb.addEventListener("change", () => { state.invitees = cb.checked ? [...state.invitees, c.id] : state.invitees.filter((x) => x !== c.id); render(); });
      row.append(cb, document.createTextNode(`${c.name}${c.email ? ` · ${c.email}` : ""}`));
      list.append(row);
    });
    if (!state.contacts.length) list.append(el("p", "note", "Import contacts to invite a group, or just copy the link."));
    const linkField = el("input");
    linkField.readOnly = true;
    linkField.value = link;
    linkField.setAttribute("aria-label", "Invite link");
    const acts = el("div", "inviteacts");
    const act = (label, fn) => { const b = el("button", "mini", label); b.type = "button"; b.addEventListener("click", fn); acts.append(b); return b; };
    const note = (t) => { state.inviteNote = t; const n = box.querySelector(".invitenote"); if (n) n.textContent = t; };
    act("Copy link", async () => { try { await navigator.clipboard.writeText(link); note("Link copied."); } catch { linkField.select(); note("Press Cmd/Ctrl+C to copy the link."); } });
    act(picked.length ? `Email ${picked.length}` : "Email", () => {
      const emails = picked.map((c) => c.email).filter(Boolean);
      if (!emails.length) { note(picked.length ? "None of the selected contacts has an email." : "Select people to email, or copy the link."); return; }
      const a = el("a");
      a.href = mailtoLink(emails, msg);
      a.click();
      note(`Opened your mail app with ${emails.length} recipient${emails.length === 1 ? "" : "s"} in Bcc${emails.length < picked.length ? `; ${picked.length - emails.length} had no email` : ""}.`);
    });
    act("SMS", () => {
      const phones = picked.map((c) => c.phone).filter(Boolean);
      if (!phones.length) { note(picked.length ? "None of the selected contacts has a phone number." : "Select people to text, or copy the link."); return; }
      const a = el("a");
      a.href = smsLink(phones, msg);
      a.click();
      note(`Opened your messages app for ${phones.length} number${phones.length === 1 ? "" : "s"}.`);
    });
    if (navigator.share) act("Share…", () => navigator.share({ title: msg.subject, text: msg.body, url: link }).catch(() => {}));
    act("WhatsApp", () => window.open(whatsappLink(msg), "_blank", "noopener"));
    const copy = async (text, done) => { try { await navigator.clipboard.writeText(text); note(done); } catch { note("Select the text and copy it."); } };
    if (state.shareTab === "code") {
      const code = cleanName(state.room) || DEFAULTS.room;
      box.append(el("div", "bigcode", code), el("p", "note", "Anyone can type this code into the Room field and press Join."));
      const row = el("div", "inviteacts");
      const b = el("button", "mini", "Copy code"); b.type = "button"; b.addEventListener("click", () => copy(code, "Code copied.")); row.append(b);
      box.append(row);
    } else if (state.shareTab === "qr") {
      const holder = el("div", "qrbox", "Loading…");
      box.append(holder, el("p", "note", "Point a phone camera at it to open this room."));
      qrSvg(link).then((svg) => { if (holder.isConnected || !disposed) holder.replaceChildren(...(svg ? [svg] : [document.createTextNode("QR unavailable offline")])); });
    } else if (state.shareTab === "people") {
      box.append(list, acts);
    } else {
      box.append(linkField, acts);
    }
    box.append(el("p", "note invitenote", state.inviteNote));
    return box;
  }

  function inviteToggle() {
    const b = el("button", "ctl", state.invite ? "Close share" : "Share");
    b.type = "button";
    b.addEventListener("click", () => { state.invite = !state.invite; state.inviteNote = ""; render(); });
    return b;
  }

  function field(label, key, type = "text") {
    const wrap = el("label", "", label);
    const input = el("input");
    input.type = type;
    input.value = state[key];
    input.addEventListener("input", () => { state[key] = input.value; });
    wrap.append(input);
    return wrap;
  }

  function lobby() {
    const box = el("form", "lobby");
    const who = state.contacts.find((c) => c.id === state.picked);
    box.append(el("h1", "", who ? `Call ${who.name}` : "Meet"), field("Your name", "name"), field("Room or code", "room"), field("LiveKit server", "serverUrl"), field("Token endpoint", "tokenUrl"));
    if (state.serverUp === false) {
      const warn = el("div", "check");
      warn.append(el("span", "pres bad"));
      const grow = el("div", "grow");
      grow.append(el("span", "", "The meeting server isn't running"), el("span", "note", state.serverNote || "Start it to join calls on this machine."));
      warn.append(grow);
      const go = el("button", "mini", state.starting ? "Starting…" : "Start it");
      go.type = "button";
      go.disabled = state.starting;
      go.addEventListener("click", startServer);
      warn.append(go);
      box.append(warn);
    }
    if (state.invitedTo) box.append(el("p", "note", `You were invited to "${state.invitedTo}". Enter your name and join.`));
    if (state.error) box.append(el("p", "err", state.error));
    const join = el("button", "primary", state.phase === "joining" ? "Joining…" : "Join");
    join.type = "submit";
    join.disabled = state.phase === "joining";
    box.append(join);
    box.append(inviteToggle());
    if (state.invite) box.append(invitePanel());
    box.append(el("p", "note", "Meet runs on a LiveKit server on this machine. If it is not running, use Start it above, or open Settings."));
    box.addEventListener("submit", (ev) => { ev.preventDefault(); join_(); });
    return box;
  }

  async function join_() {
    const name = cleanName(state.name);
    const roomName = cleanName(state.room);
    if (!name || !roomName) { state.error = "Enter your name and a room."; render(); return; }
    state.name = name; state.room = roomName; state.error = ""; state.phase = "joining";
    persist(); render();
    try {
      let token;
      if (state.tokenUrl.trim()) {
        const res = await fetch(`${state.tokenUrl}?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error(`Token endpoint answered ${res.status}`);
        ({ token } = await res.json());
      } else {
        token = await signToken({ key: state.apiKey, secret: state.apiSecret, room: roomName, identity: name });
      }
      lk = await loadLivekit();
      if (disposed) return;
      room = new lk.Room({ adaptiveStream: true, dynacast: true });
      const refresh = () => { if (!disposed) { renderStage(); renderNav(); } };
      Object.values({ a: "ParticipantConnected", b: "ParticipantDisconnected", c: "TrackSubscribed", d: "TrackUnsubscribed", e: "TrackMuted", f: "TrackUnmuted", g: "LocalTrackPublished", h: "LocalTrackUnpublished", i: "ActiveSpeakersChanged" })
        .forEach((ev) => room.on(lk.RoomEvent[ev], refresh));
      room.on(lk.RoomEvent.DataReceived, (bytes, participant) => {
        const text = decodeChat(bytes);
        if (text == null) return;
        state.chat.push({ from: participant?.identity || "Someone", text });
        renderChat();
      });
      room.on(lk.RoomEvent.Disconnected, () => { if (!disposed && state.phase === "meeting") leave(); });
      await room.connect(state.serverUrl, token);
      await Promise.allSettled([room.localParticipant.setMicrophoneEnabled(true), room.localParticipant.setCameraEnabled(true)]);
      state.phase = "meeting"; state.mic = true; state.cam = true; state.screen = false; state.chat = [];
      render();
    } catch (err) {
      room?.disconnect();
      room = null;
      state.phase = "lobby";
      state.error = `Could not join: ${err?.message || err}`;
      render();
    }
  }

  function leave() {
    room?.disconnect();
    room = null;
    state.phase = "lobby";
    render();
  }

  function tileFor(participant, source, label) {
    const pub = participant.getTrackPublication?.(source);
    const track = pub?.track;
    const isScreen = source === lk.Track.Source.ScreenShare;
    const tile = el("div", `tile${isScreen ? " screen" : ""}${participant.isSpeaking && !isScreen ? " speaking" : ""}`);
    if (track && !pub.isMuted) {
      const video = track.attach();
      video.muted = true;
      tile.append(video);
    } else {
      tile.append(el("div", "avatar", initials(participant.identity)));
    }
    const mic = participant.getTrackPublication?.(lk.Track.Source.Microphone);
    const muted = !isScreen && (!mic || mic.isMuted);
    tile.append(el("span", `label${muted ? " muted" : ""}`, label));
    return tile;
  }

  function renderStage() {
    const grid = root.querySelector(".grid");
    if (!grid || !room) return;
    grid.replaceChildren();
    const people = [room.localParticipant, ...room.remoteParticipants.values()];
    const tiles = [];
    people.forEach((p) => {
      const mine = p === room.localParticipant;
      if (p.getTrackPublication(lk.Track.Source.ScreenShare)) tiles.push(tileFor(p, lk.Track.Source.ScreenShare, `${p.identity}${mine ? " (you)" : ""}, screen`));
      tiles.push(tileFor(p, lk.Track.Source.Camera, `${p.identity}${mine ? " (you)" : ""}`));
    });
    grid.style.gridTemplateColumns = `repeat(${gridColumns(tiles.length)}, minmax(0, 1fr))`;
    grid.append(...tiles);
    // remote audio must be attached somewhere to play
    room.remoteParticipants.forEach((p) => {
      const audio = p.getTrackPublication(lk.Track.Source.Microphone)?.track;
      if (audio && !root.querySelector(`audio[data-id="${p.identity}"]`)) {
        const a = audio.attach();
        a.dataset.id = p.identity;
        root.append(a);
      }
    });
  }

  function renderChat() {
    const log = root.querySelector(".chatlog");
    if (!log) return;
    log.replaceChildren(...state.chat.map((m) => { const row = el("div", "msg"); row.append(el("b", "", `${m.from}: `), document.createTextNode(m.text)); return row; }));
    log.scrollTop = log.scrollHeight;
  }

  function control(label, key, onChange) {
    const b = el("button", "ctl", label);
    b.type = "button";
    b.setAttribute("aria-pressed", String(state[key]));
    b.addEventListener("click", async () => {
      state[key] = !state[key];
      try { await onChange(state[key]); } catch (err) { state[key] = !state[key]; state.error = String(err?.message || err); }
      render();
    });
    return b;
  }

  function meeting() {
    const wrap = el("div", "meeting");
    const stage = el("div", "stage");
    if (state.invite) stage.append(invitePanel());
    stage.append(el("div", "grid"));
    const chat = el("div", "chat");
    const form = el("form", "chatform");
    const input = el("input");
    input.placeholder = "Message the room";
    input.setAttribute("aria-label", "Message the room");
    input.value = state.draft;
    input.addEventListener("input", () => { state.draft = input.value; });
    const send = el("button", "ctl", "Send");
    send.type = "submit";
    form.append(input, send);
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const text = state.draft.trim();
      if (!text || !room) return;
      room.localParticipant.publishData(encodeChat(text), { reliable: true });
      state.chat.push({ from: "You", text });
      state.draft = ""; input.value = "";
      renderChat();
    });
    chat.append(el("div", "chatlog"), form);
    wrap.append(stage, chat);

    const bar = el("div", "bar");
    const lp = () => room.localParticipant;
    bar.append(
      control("Mic", "mic", (on) => lp().setMicrophoneEnabled(on)),
      control("Camera", "cam", (on) => lp().setCameraEnabled(on)),
      control("Share screen", "screen", (on) => lp().setScreenShareEnabled(on)),
    );
    bar.append(inviteToggle());
    const out = el("button", "ctl leave", "Leave");
    out.type = "button";
    out.addEventListener("click", leave);
    bar.append(out);
    if (state.error) bar.append(el("span", "err", state.error));
    return [wrap, bar];
  }

  function render() {
    if (disposed) return;
    root.replaceChildren();
    const main = el("div", "main");
    root.append(navCol(), main);
    if (state.phase === "meeting" && room) {
      const mh = el("div", "mhead");
      const n = room.remoteParticipants.size + 1;
      mh.append(el("span", "", state.room), el("small", "", `${n} ${n === 1 ? "person" : "people"} · ${state.name}`));
      main.append(mh, ...meeting());
      renderStage();
      renderChat();
    } else {
      main.append(lobby());
    }
    renderNav();
    if (state.settings) root.append(settingsModal());
  }

  render();
  detectServer();
  return () => { disposed = true; room?.disconnect(); root.remove(); };
}

/* Murmur: peer-to-peer rooms in Canvas, on OrbitDB (FraterCCCLXIII/holons-p2p fork).
 *
 * Each room is an OrbitDB events (append-only log) database. Its address is what you share.
 * Messages replicate between browsers directly (libp2p gossipsub + OrbitDB heads sync); a relay
 * only introduces peers. Styles are scoped under `.mr`; text is always set with textContent.
 */
import qrcode from "qrcode-generator";
import { gripColumns, GRIP_CSS } from "./grip.js";
import { createTransport as createOrbitTransport, parseRoomInput, validateRelay } from "./p2p.js";

export const STORAGE_KEY = "canvas-extension-murmur:v1";
export const RELAY_PLACEHOLDER = "/ip4/127.0.0.1/tcp/12345/ws/p2p/<peer id printed by `npm run relay`>";
const WORDS_A = ["amber", "brisk", "calm", "dusk", "ember", "fern", "gale", "hazel", "iris", "juniper", "kite", "lark"];
const WORDS_B = ["otter", "finch", "heron", "wren", "swift", "plover", "starling", "robin", "tern", "lapwing", "pipit", "swallow"];

export const randomRoomName = (rand = Math.random) => `${WORDS_A[Math.floor(rand() * 12)]}-${WORDS_B[Math.floor(rand() * 12)]}-${10 + Math.floor(rand() * 90)}`;
export const shortId = (id) => (id ? `${String(id).slice(0, 6)}…${String(id).slice(-4)}` : "");
export const timeLabel = (ts) => { try { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
export const STATUS_LABEL = { starting: "Starting", "no-relay": "No relay set", connecting: "Connecting to relay", relay: "Connected to relay", error: "Error", demo: "Demo mode" };

/** A QR code for text as an inline SVG (bundled encoder: no network, nothing leaves the page). */
export function qrSvg(text) {
  try {
    const qr = qrcode(0, "L");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) cells.push(`M${c + 4} ${r + 4}h1v1h-1z`);
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `0 0 ${n + 8} ${n + 8}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "QR code for the room address");
    const bg = document.createElementNS(ns, "rect");
    bg.setAttribute("width", String(n + 8)); bg.setAttribute("height", String(n + 8)); bg.setAttribute("fill", "#fff");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", cells.join("")); path.setAttribute("fill", "#000");
    svg.append(bg, path);
    return svg;
  } catch { return null; }
}

let transportFactory = (opts) => createOrbitTransport({ ...opts, directory: "murmur" });
/** Tests (and any alternative transport) plug in here. A transport implements the same surface as p2p.js. */
export function setTransportFactory(fn) { transportFactory = fn; }


const SVG_NS = "http://www.w3.org/2000/svg";
const KAMIJI_STROKES = ["M18 24V82M46 24L20 54M28 50L48 82", "M96 48V82", "M120 48V82M120 60Q120 48 134 48Q148 48 148 62V82M148 62Q148 48 162 48Q176 48 176 62V82", "M198 48V82M198 26V26", "M224 48V86Q224 98 210 98M224 26V26", "M250 48V82M250 26V26"];
const KOSMOS_PATHS = [
  "M79.81,54.47c-2.27-3.14-3.59-7.14-3.59-11.73,0-11.39,8.05-19.17,18.75-19.17,5.44,0,10.18,2.02,13.54,5.49,2.77-3.32,28.03-25.97,31.05-29.06-24.12,19.01-35.79,11.75-44.59,11.75-18.92,0-32.79,13.18-32.79,30.99,0,8.04,2.84,15.14,7.69,20.51",
  "M111.85,33.96c1.19,2.57,1.86,5.52,1.86,8.77,0,11.38-8.05,19.17-18.75,19.17-4.03,0-7.67-1.1-10.66-3.09-3.54,2.54-21.13,20.86-24.29,23.89,18.2-10.53,26.87-8.99,34.95-8.99,18.83,0,32.79-13.1,32.79-30.99,0-6.58-2.16-12.99-5.7-18.17l-10.2,9.4Z",
  "M137.56,66.79l4.71-10.44c5.05,3.68,12.58,6.25,19.77,6.25,8.22,0,11.56-2.74,11.56-6.42,0-11.21-34.84-3.51-34.84-25.77,0-10.19,8.22-18.66,25.25-18.66,7.53,0,15.24,1.8,20.8,5.31l-4.28,10.53c-5.56-3.17-11.3-4.71-16.61-4.71-8.22,0-11.39,3.08-11.39,6.85,0,11.04,34.84,3.42,34.84,25.42,0,10.02-8.3,18.58-25.42,18.58-9.5,0-19.09-2.83-24.4-6.93Z",
  "M254.75,72.7l-.09-35.95-17.63,29.62h-6.25l-17.55-28.85v35.18h-13.01V12.78h11.47l22.43,37.24,22.09-37.24h11.39l.17,59.92h-13.01Z",
  "M280.39,42.78c0-17.81,13.87-30.99,32.79-30.99s32.79,13.1,32.79,30.99-13.95,30.99-32.79,30.99-32.79-13.18-32.79-30.99ZM331.93,42.78c0-11.39-8.05-19.17-18.75-19.17s-18.75,7.79-18.75,19.17,8.05,19.17,18.75,19.17,18.75-7.79,18.75-19.17Z",
  "M355.48,66.84l4.71-10.44c5.05,3.68,12.58,6.25,19.77,6.25,8.22,0,11.56-2.74,11.56-6.42,0-11.21-34.84-3.51-34.84-25.77,0-10.19,8.22-18.66,25.25-18.66,7.53,0,15.24,1.8,20.8,5.31l-4.28,10.53c-5.56-3.17-11.3-4.71-16.61-4.71-8.22,0-11.39,3.08-11.39,6.85,0,11.04,34.84,3.42,34.84,25.42,0,10.02-8.3,18.58-25.42,18.58-9.5,0-19.09-2.83-24.4-6.93Z",
  "M13.78,39.15V12.78H0v59.92h13.78v-15.15l.03-.03M28.22,42.74 56.22,72.7H38.43L19.09,52.01 13.81,46.36 10.43,42.74 13.78,39.15 38.43,12.78H56.22L31.06,39.7Z",
];

function logoSvg(viewBox, label, paths, stroke) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", label);
  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = label;
  svg.append(title);
  paths.forEach((d) => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("aria-hidden", "true");
    if (stroke) Object.entries({ fill: "none", stroke: "currentColor", "stroke-width": stroke, "stroke-linecap": "round", "stroke-linejoin": "round" }).forEach(([k, v]) => path.setAttribute(k, v));
    else path.setAttribute("fill", "currentColor");
    svg.append(path);
  });
  return svg;
}

function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function btn(label, cls, onClick, aria) { const b = el("button", cls, label); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", onClick); return b; }

const ICONS = {
  plus: "M12 5v14M5 12h14",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  share: "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  send: "M12 19V5M5 12l7-7 7 7",
  back: "M15 18l-6-6 6-6",
  close: "M18 6L6 18M6 6l12 12",
  copy: "M9 9h11v11H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
};
function icon(name) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("class", "ic"); svg.setAttribute("aria-hidden", "true");
  for (const [k, v] of Object.entries({ fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" })) svg.setAttribute(k, v);
  const p = document.createElementNS(SVG_NS, "path"); p.setAttribute("d", ICONS[name]); svg.append(p);
  return svg;
}
function ibtn(name, label, cls, onClick) { const b = el("button", `ibtn ${cls || ""}`.trim()); b.type = "button"; b.setAttribute("aria-label", label); b.title = label; b.append(icon(name)); b.addEventListener("click", onClick); return b; }

/** The Murmur mark: three flowing lines and a few birds (same shapes as icon.svg). */
function markSvg() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true");
  for (const [k, v] of Object.entries({ fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" })) svg.setAttribute(k, v);
  for (const d of ["M2 14c3-1 4-4 6-4s2 3 4 3 3-5 6-5 3 2 4 2", "M4 19c2-.5 3-2 5-2s3 1.5 5 1.5 3-2 6-2", "M19 5.5v1M14 3.5v1M9 4.5v1"]) { const p = document.createElementNS(SVG_NS, "path"); p.setAttribute("d", d); svg.append(p); }
  return svg;
}

const hash = (str) => { let h = 0; for (const c of String(str)) h = (h * 31 + c.codePointAt(0)) >>> 0; return h; };
export const hueOf = (key) => hash(key) % 360;
export const initialsOf = (name) => {
  const parts = String(name || "").trim().split(/[\s\-_]+/).filter(Boolean);
  const out = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] || "?").slice(0, 2);
  return out.toUpperCase();
};
function avatar(name, key, cls = "") {
  const a = el("span", `av ${cls}`.trim(), initialsOf(name));
  a.style.setProperty("--h", String(hueOf(key || name))); a.setAttribute("aria-hidden", "true");
  return a;
}
export const dayLabel = (ts, now = Date.now()) => {
  const d = new Date(ts), t = new Date(now);
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(t) - start(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  try { return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", ...(d.getFullYear() !== t.getFullYear() ? { year: "numeric" } : {}) }); } catch { return ""; }
};
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const GROUP_MS = 5 * 60 * 1000;
const NARROW = "(max-width: 719px)";

const CSS = `
.mr{--mr-bg:var(--oh-color-base,#fff);--mr-panel:var(--oh-color-base-secondary,#f4f4f5);--mr-raised:var(--oh-surface-raised,#ececee);--mr-fg:var(--oh-foreground,#27272a);--mr-contrast:var(--oh-contrast,#111);--mr-muted:var(--oh-muted,#71717a);--mr-line:var(--oh-border-subtle,#e4e4e7);--mr-primary:var(--oh-color-primary,#111);--mr-fill:color-mix(in srgb,var(--mr-primary) 90%,#000);--mr-fill-hover:color-mix(in srgb,var(--mr-primary) 78%,#000);--mr-on-primary:var(--oh-accent-foreground,#fff);--mr-ok:var(--oh-success,#16a34a);--mr-bad:var(--oh-danger,#ef4444);--mr-warn:var(--oh-feedback-warning,#f2b51d);
position:relative;display:block;height:100%;min-height:480px;overflow:hidden;background:var(--mr-bg);color:var(--mr-fg);font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;overscroll-behavior:contain}
.mr *,.mr *::before,.mr *::after{box-sizing:border-box}
.mr button,.mr input,.mr textarea{font:inherit;color:inherit}
.mr button{cursor:pointer}
.mr [hidden]{display:none!important}
.mr :focus-visible{outline:2px solid var(--mr-primary);outline-offset:2px}
.mr .shell{position:relative;display:grid;grid-template-columns:var(--grip-0,280px) minmax(0,1fr);height:100%;min-height:0}
.mr .col{display:flex;flex-direction:column;min-height:0;min-width:0}
.mr .rail{background:var(--mr-bg);border-right:1px solid var(--mr-line)}
.mr .lhead,.mr .chead{flex:none;display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--mr-line);min-height:56px}
.mr .brand{display:flex;align-items:center;gap:8px;flex:1;min-width:0;margin:0;font-size:15px;font-weight:650;color:var(--mr-contrast)}
.mr .mark{flex:none;width:28px;height:28px;display:grid;place-items:center;border-radius:9px;background:var(--mr-fill);color:var(--mr-on-primary)}
.mr .mark svg{width:18px;height:18px}
.mr .pbtn{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:999px;background:var(--mr-fill);color:var(--mr-on-primary);padding:6px 12px;font-weight:500;white-space:nowrap}
.mr .pbtn:hover{background:var(--mr-fill-hover)}
.mr .gbtn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--mr-line);border-radius:999px;background:var(--mr-raised);padding:5px 12px;white-space:nowrap}
.mr .gbtn:hover{border-color:var(--mr-muted)}
.mr .ic{width:16px;height:16px;flex:none}
.mr .ibtn{display:inline-grid;place-items:center;width:32px;height:32px;border:0;border-radius:10px;background:transparent;color:var(--mr-muted);flex:none}
.mr .ibtn:hover{background:var(--mr-panel);color:var(--mr-contrast)}
.mr .search{flex:none;display:flex;gap:6px;padding:10px 12px 6px}
.mr input,.mr textarea{border:1px solid var(--mr-line);border-radius:10px;background:var(--mr-panel);padding:7px 10px;min-width:0}
.mr .search input{flex:1}
.mr input::placeholder,.mr textarea::placeholder{color:var(--mr-muted)}
.mr .scroll{flex:1;min-height:0;overflow-y:auto;padding:6px 8px}
.mr .sect{margin:8px 8px 4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mr-muted)}
.mr .row{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border:0;border-radius:12px;background:transparent;text-align:left}
.mr .row:hover{background:var(--mr-panel)}
.mr .row[aria-current=true]{background:var(--mr-raised)}
.mr .row .meta{min-width:0;flex:1;display:grid}
.mr .row .name{font-weight:550;color:var(--mr-contrast);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mr .row .prev{font-size:12px;color:var(--mr-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mr .dot{flex:none;width:9px;height:9px;border-radius:50%;background:var(--mr-primary)}
.mr .av{flex:none;width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:hsl(var(--h,200) 55% 42%);color:#fff;font-size:13px;font-weight:650;letter-spacing:.02em;user-select:none}
.mr .av.tile{border-radius:12px}
.mr .av.sm{width:32px;height:32px;font-size:12px}
.mr .hint{margin:8px 10px;color:var(--mr-muted);font-size:13px}
.mr .me{flex:none;display:flex;align-items:center;gap:10px;padding:10px 12px;border-top:1px solid var(--mr-line)}
.mr .me .meta{flex:1;min-width:0;display:grid}
.mr .me .name{font-weight:550;color:var(--mr-contrast);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mr .me small,.mr .chead small,.mr .muted{color:var(--mr-muted);font-size:12px}
.mr .main{background:var(--mr-bg);position:relative}
.mr .chead h2{margin:0;font-size:15px;font-weight:650;color:var(--mr-contrast);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mr .chead .title{flex:1;min-width:0;display:grid}
.mr .pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;border:1px solid var(--mr-line);border-radius:999px;padding:2px 10px;color:var(--mr-muted);white-space:nowrap}
.mr .pill::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--mr-muted)}
.mr .pill.ok{color:var(--mr-ok);border-color:var(--mr-ok)} .mr .pill.ok::before{background:var(--mr-ok)}
.mr .pill.warn{color:var(--mr-warn);border-color:var(--mr-warn)} .mr .pill.warn::before{background:var(--mr-warn)}
.mr .pill.bad{color:var(--mr-bad);border-color:var(--mr-bad)} .mr .pill.bad::before{background:var(--mr-bad)}
.mr .backbtn{display:none}
.mr .log{flex:1;min-height:0;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:2px;scroll-behavior:auto}
.mr .day{align-self:stretch;display:flex;align-items:center;gap:12px;margin:12px 0 8px;color:var(--mr-muted);font-size:12px}
.mr .day::before,.mr .day::after{content:"";flex:1;height:1px;background:var(--mr-line)}
.mr .msg{display:flex;gap:10px;align-items:flex-start;margin-top:12px;position:relative}
.mr .msg.cont{margin-top:2px}
.mr .msg .gut{flex:none;width:32px}
.mr .msg .mbody{min-width:0;flex:1}
.mr .msg .who{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.mr .msg .who b{color:var(--mr-contrast);font-weight:600}
.mr .msg .who small{color:var(--mr-muted);font-size:12px}
.mr .msg .who .sid{opacity:.8;font-family:ui-monospace,monospace;font-size:11px}
.mr .bubble{display:inline-block;max-width:min(100%,640px);margin-top:3px;padding:7px 14px;border-radius:16px;background:var(--mr-raised);overflow-wrap:anywhere;white-space:pre-wrap}
.mr .msg.mine .bubble{background:var(--mr-fill);color:var(--mr-on-primary)}
.mr .msg .hov{position:absolute;left:0;top:50%;transform:translateY(-50%);width:32px;text-align:center;font-size:10px;color:var(--mr-muted);opacity:0;pointer-events:none}
.mr .msg.cont:hover .hov{opacity:1}
.mr .empty{margin:auto;text-align:center;color:var(--mr-muted);max-width:360px;padding:24px;display:grid;gap:6px;justify-items:center}
.mr .empty .mark{width:44px;height:44px;border-radius:14px;margin-bottom:6px}.mr .empty .mark svg{width:26px;height:26px}
.mr .empty h3{margin:0;font-size:16px;color:var(--mr-contrast);font-weight:600}
.mr .empty p{margin:0}
.mr .note{flex:none;display:flex;align-items:center;gap:8px;margin:0 16px 6px;padding:6px 10px;border:1px solid var(--mr-bad);border-radius:10px;color:var(--mr-bad);font-size:13px}
.mr .note span{flex:1}
.mr .composerwrap{flex:none;padding:8px 16px 14px;background:var(--mr-bg)}
.mr .composer{display:flex;gap:8px;align-items:flex-end;border:1px solid var(--mr-line);border-radius:18px;background:var(--mr-panel);padding:6px 6px 6px 14px}
.mr .composer:focus-within{border-color:var(--mr-muted)}
.mr .composer textarea{flex:1;min-width:0;resize:none;border:0;outline:0;background:transparent;padding:6px 0;max-height:160px;line-height:1.4}
.mr .send{flex:none;display:inline-grid;place-items:center;width:34px;height:34px;border:0;border-radius:50%;background:var(--mr-fill);color:var(--mr-on-primary)}
.mr .send:disabled{background:var(--mr-raised);color:var(--mr-muted);cursor:not-allowed}
.mr .welcome{flex:1;min-height:0;position:relative;overflow-y:auto;display:grid;place-items:center;align-content:center;text-align:center;padding:24px 24px 64px}
.mr .welcome .wmark{width:84px;height:84px;margin:0 auto 18px;border-radius:26px}.mr .welcome .wmark svg{width:50px;height:50px}
.mr .welcome h1{margin:0 0 6px;font-size:40px;font-weight:300;letter-spacing:-.01em;color:var(--mr-contrast)}
.mr .welcome p{margin:0 auto 16px;max-width:380px;font-weight:300;color:var(--mr-muted)}
.mr .welcome .wactions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:14px}
.mr .welcome .wactions .pbtn,.mr .welcome .wactions .gbtn{padding:10px 20px}
.mr .welcome .wjoin{display:flex;gap:6px;justify-content:center;margin:0 auto 14px;max-width:420px}
.mr .welcome .wjoin input{flex:1}
.mr .welcome .help{max-width:420px;margin:0 auto;padding:10px 14px;border:1px solid var(--mr-line);border-radius:12px;background:var(--mr-panel);font-size:13px;color:var(--mr-muted);text-align:left}
.mr .welcome .help code{display:inline;padding:1px 5px}
.mr .powered{display:flex;align-items:center;gap:6px;color:var(--mr-muted);font-size:12px}
.mr .plogo{display:inline-flex;color:inherit}.mr .plogo:hover{color:var(--mr-contrast)}.mr .plogo svg{height:16px;width:auto}
.mr .welcome .wpowered{position:absolute;left:0;right:0;bottom:16px;justify-content:center}
.mr .back{position:absolute;inset:0;z-index:4;background:transparent}
.mr .pop{position:absolute;z-index:5;background:var(--mr-raised);border:1px solid var(--mr-line);border-radius:14px;padding:14px;box-shadow:0 12px 32px rgba(0,0,0,.28);width:min(420px,calc(100% - 24px));top:60px;right:12px;display:flex;flex-direction:column;gap:10px;max-height:calc(100% - 72px);overflow:auto}
.mr .pop.center{top:50%;left:50%;right:auto;transform:translate(-50%,-50%)}
.mr .pop header{display:flex;align-items:center;gap:8px}.mr .pop h3{margin:0;font-size:15px;flex:1;color:var(--mr-contrast)}
.mr .pop label{display:grid;gap:4px;font-size:13px;color:var(--mr-muted)}
.mr .pop textarea{width:100%;font:12px ui-monospace,monospace;resize:vertical}
.mr .pop .acts{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.mr .err{color:var(--mr-bad)} .mr .qr{width:176px;height:176px;align-self:center;border-radius:10px;overflow:hidden} .mr .qr svg{width:100%;height:100%;display:block}
.mr code{font:12px ui-monospace,monospace;overflow-wrap:anywhere;background:var(--mr-panel);padding:5px 8px;border-radius:8px;display:block;border:1px solid var(--mr-line)}
.mr .peer{display:flex;align-items:center;gap:10px}.mr .peer code{flex:1}
@media (prefers-reduced-motion:no-preference){.mr .row,.mr .ibtn,.mr .pbtn,.mr .gbtn,.mr .msg .hov{transition:background .12s,opacity .12s,border-color .12s}}
@media (max-width:719px){
.mr .shell{grid-template-columns:minmax(0,1fr)}
.mr .shell.v-main .rail{display:none}.mr .shell.v-list .main{display:none}
.mr .backbtn{display:inline-grid}
.mr .chead{padding:10px;gap:6px}.mr .chead .pill{display:none}
.mr .log{padding:12px}.mr .welcome h1{font-size:32px}
.mr .pop{right:8px;left:8px;width:auto}.mr .pop.center{left:8px;right:8px;transform:translateY(-50%);top:50%;width:auto}
}
` + GRIP_CSS;

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("Murmur requires Canvas host API 1.");
  return host.registerPage("murmur", ({ container }) => mount(container));
}

function load() {
  try { const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); return { name: String(v.name || ""), relays: Array.isArray(v.relays) ? v.relays.map(String) : [], rooms: Array.isArray(v.rooms) ? v.rooms.filter((r) => r && r.address) : [] }; } catch { return { name: "", relays: [], rooms: [] }; }
}

function mount(container) {
  const doc = container.ownerDocument;
  const win = doc.defaultView || window;
  const root = el("div", "mr");
  root.append(el("style", "", CSS));
  const shell = el("div", "shell v-list");
  root.append(shell);
  container.append(root);

  const saved = load();
  if (!saved.name) saved.name = `bird-${Math.floor(1000 + Math.random() * 9000)}`;
  const s = { ...saved, status: "starting", peers: [], identityId: "", current: "", msgs: {}, unread: new Set(), pop: "", note: "", settingsErr: "", joinText: "", wjoin: false, opener: null, view: saved.rooms.length ? "list" : "main" };
  let transport = null, disposed = false, offEvent = null;
  const live = new Map(); // address -> { room, off, ready }
  const persist = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: s.name, relays: s.relays, rooms: s.rooms })); } catch { /* storage unavailable */ } };
  const connected = () => s.status === "relay" || s.status === "demo";
  const curRoom = () => s.rooms.find((r) => r.address === s.current);
  const narrow = () => Boolean(win.matchMedia && win.matchMedia(NARROW).matches);

  /** Fill the visible page below wherever the host put us (hosts may not give a definite height). */
  function fit() {
    const top = Math.max(0, root.getBoundingClientRect().top);
    root.style.height = `${Math.max(480, (win.innerHeight || 800) - top)}px`;
  }

  // ── Stable skeleton: nodes with focus or text input (search, composer) are never rebuilt. ──
  const rail = el("aside", "col rail"); rail.setAttribute("aria-label", "Rooms");
  const main = el("main", "col main");
  const lhead = el("div", "lhead");
  const mk = el("span", "mark"); mk.append(markSvg());
  const brand = el("h1", "brand"); brand.append(mk, document.createTextNode("Murmur™"));
  lhead.append(brand);
  const newBtn = el("button", "pbtn"); newBtn.type = "button"; newBtn.append(icon("plus"), document.createTextNode("New room"));
  newBtn.addEventListener("click", () => open({ kind: "name", value: randomRoomName() }));
  lhead.append(newBtn);

  const search = el("div", "search");
  const ji = el("input"); ji.type = "text"; ji.placeholder = "Join or filter: name or address"; ji.setAttribute("aria-label", "Room name or address"); ji.autocomplete = "off"; ji.spellcheck = false;
  const joinNow = (t) => { const v = (t ?? ji.value); ji.value = ""; s.joinText = ""; renderRooms(); open(v); };
  ji.addEventListener("input", () => { s.joinText = ji.value; renderRooms(); });
  ji.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); joinNow(); } });
  const joinBtn = btn("Join", "gbtn", () => joinNow());
  search.append(ji, joinBtn);

  const roomsHost = el("div", "scroll"); roomsHost.setAttribute("role", "list"); roomsHost.setAttribute("aria-label", "Rooms");

  const me = el("div", "me");
  const meAv = avatar("", "me"); const meMeta = el("div", "meta"); const meName = el("span", "name"); const meId = el("small", "");
  meMeta.append(meName, meId);
  const gear = ibtn("gear", "Settings", "", () => togglePop("settings"));
  me.append(meAv, meMeta, gear);
  rail.append(lhead, search, roomsHost, me);

  // main: header + (welcome | thread + composer) + popover host
  const chead = el("header", "chead");
  const welcome = el("section", "welcome"); welcome.setAttribute("aria-label", "Welcome");
  const thread = el("div", "col"); thread.style.flex = "1"; thread.style.minHeight = "0";
  const log = el("div", "log"); log.setAttribute("role", "log"); log.setAttribute("aria-live", "polite"); log.setAttribute("aria-label", "Messages"); log.tabIndex = 0;
  const noteHost = el("div");
  const cw = el("div", "composerwrap");
  const form = el("form", "composer");
  const ta = el("textarea"); ta.rows = 1; ta.placeholder = "Write a message"; ta.setAttribute("aria-label", "Message");
  const sendBtn = el("button", "send"); sendBtn.type = "submit"; sendBtn.setAttribute("aria-label", "Send"); sendBtn.title = "Send"; sendBtn.append(icon("send")); sendBtn.disabled = true;
  form.append(ta, sendBtn); cw.append(form);
  thread.append(log, noteHost, cw);
  const popHost = el("div");
  main.append(chead, welcome, thread);
  shell.append(rail, main);
  root.append(popHost);

  const grip = gripColumns({ grid: shell, storageKey: "grip:murmur", narrowQuery: NARROW, columns: [{ el: rail, edge: "left", min: 220, max: 480, initial: 280, label: "rooms column" }] });

  const fit0 = () => { if (!disposed) fit(); };
  win.addEventListener("resize", fit0);
  const ro = typeof win.ResizeObserver === "function" && container.parentElement ? new win.ResizeObserver(fit0) : null;
  ro?.observe(container.parentElement || container);
  fit();
  win.requestAnimationFrame?.(fit0);

  // composer behaviour
  const autosize = () => { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`; };
  ta.addEventListener("input", () => { sendBtn.disabled = !ta.value.trim() || !live.has(s.current); autosize(); });
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : send(); } });
  form.addEventListener("submit", (e) => { e.preventDefault(); send(); });
  root.addEventListener("keydown", (e) => { if (e.key === "Escape" && s.pop) { e.stopPropagation(); closePop(); } });

  async function boot() {
    try { transport?.stop?.(); } catch { /* ignore */ }
    offEvent?.(); live.forEach((l) => l.off?.()); live.clear();
    s.status = "starting"; s.peers = []; renderAll();
    try {
      transport = transportFactory({ relays: s.relays, displayName: s.name });
      offEvent = transport.onEvent((e) => { if (e.type === "status" && !disposed) { s.status = e.status; s.peers = e.peers || []; renderStatus(); } });
      await transport.start();
      if (disposed) return;
      s.demo = !!transport.demo; s.identityId = transport.identityId; s.status = s.demo ? "demo" : transport.status;
      renderAll();
      for (const r of s.rooms) await open(r.address, false).catch(() => {});
      if (!s.current && s.rooms.length) { s.current = s.rooms[0].address; renderAll(); }
    } catch (e) { s.status = "error"; s.note = `Could not start: ${e?.message || e}`; renderAll(); }
  }

  async function open(input, select = true) {
    const parsed = typeof input === "string" ? parseRoomInput(input) : input;
    if (!parsed) { s.note = "Type a room name or paste a room address."; renderNote(); return; }
    s.note = ""; renderNote();
    if (!transport) return;
    try {
      const room = await transport.joinRoom(parsed);
      if (!live.has(room.address)) {
        s.msgs[room.address] = [];
        const entry = { room, off: null, ready: false };
        const add = (m) => {
          const list = s.msgs[room.address];
          if (list.some((x) => x.id === m.id)) return;
          const atEnd = !list.length || list[list.length - 1].ts <= m.ts;
          list.push(m); if (!atEnd) list.sort((a, b) => a.ts - b.ts);
          if (entry.ready && s.current !== room.address && m.authorId !== s.identityId) s.unread.add(room.address);
          if (s.current === room.address) { if (atEnd) appendMsg(list, list.length - 1); else renderLog(); }
          renderRooms();
        };
        entry.off = room.onMessage(add);
        live.set(room.address, entry);
        (await room.history()).forEach(add);
        entry.ready = true;
      }
      if (!s.rooms.some((r) => r.address === room.address)) { s.rooms.push({ address: room.address, name: String(room.name || parsed.value).replace(/^murmur\//, "") }); persist(); }
      if (select) { s.current = room.address; s.view = "main"; s.unread.delete(room.address); }
      renderAll();
      if (select) ta.focus();
    } catch (e) { s.note = `Could not open that room: ${e?.message || e}`; renderAll(); }
  }

  async function send() {
    const text = ta.value.trim();
    const l = live.get(s.current);
    if (!text || !l) return;
    ta.value = ""; sendBtn.disabled = true; autosize();
    try {
      const m = await l.room.send(text);
      const list = s.msgs[s.current];
      if (!list.some((x) => x.id === m.id)) { list.push(m); appendMsg(list, list.length - 1); renderRooms(); }
    } catch (e) { s.note = `Send failed: ${e?.message || e}`; renderNote(); }
    ta.focus();
  }

  function select(address) {
    s.current = address; s.view = "main"; s.unread.delete(address); s.pop = "";
    renderAll();
    if (!narrow()) ta.focus();
  }

  // ── Rendering ──
  function renderRooms() {
    const q = s.joinText.trim().toLowerCase();
    const items = s.rooms.filter((r) => !q || r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q));
    roomsHost.replaceChildren();
    if (!s.rooms.length) roomsHost.append(el("p", "hint", "No rooms yet. Start one, or paste an address above and press Enter."));
    else {
      roomsHost.append(el("div", "sect", "Rooms"));
      if (!items.length) roomsHost.append(el("p", "hint", `No room matches. Press Enter to join "${s.joinText.trim()}".`));
    }
    for (const r of items) {
      const b = el("button", "row"); b.type = "button"; b.setAttribute("role", "listitem"); b.setAttribute("aria-current", String(r.address === s.current));
      const list = s.msgs[r.address] || [];
      const last = list[list.length - 1];
      const unread = s.unread.has(r.address);
      const meta = el("span", "meta");
      meta.append(el("span", "name", r.name), el("span", "prev", last ? `${last.authorId === s.identityId ? "You: " : ""}${last.text}` : "No messages yet"));
      b.append(avatar(r.name, r.address, "tile"), meta);
      if (unread) { const d = el("span", "dot"); d.setAttribute("role", "img"); d.setAttribute("aria-label", "Unread messages"); b.append(d); }
      b.addEventListener("click", () => select(r.address));
      roomsHost.append(b);
    }
    meName.textContent = s.name; meId.textContent = s.identityId ? `id ${shortId(s.identityId)}` : "Creating your identity…";
    meId.title = s.identityId || "";
    meAv.textContent = initialsOf(s.name); meAv.style.setProperty("--h", String(hueOf(s.identityId || s.name)));
  }

  let pillEl = null, peersEl = null, helpEl = null;
  const pillClass = () => (connected() ? "ok" : s.status === "error" ? "bad" : s.status === "no-relay" ? "warn" : "");
  function renderStatus() {
    if (pillEl) { pillEl.textContent = STATUS_LABEL[s.status] || s.status; pillEl.className = `pill ${pillClass()}`.trim(); }
    if (peersEl) peersEl.textContent = `${s.peers.length} ${s.peers.length === 1 ? "peer" : "peers"}`;
    if (helpEl) fillHelp();
    if (s.pop === "peers") renderPop();
  }

  function renderHead() {
    const r = curRoom();
    chead.replaceChildren();
    if (s.rooms.length) chead.append(ibtn("back", "Back to rooms", "backbtn", () => { s.view = "list"; s.pop = ""; renderAll(); }));
    if (r) chead.append(avatar(r.name, r.address, "tile sm"));
    const t = el("div", "title");
    t.append(el("h2", "", r ? r.name : "Murmur"));
    if (r) t.append(el("small", "", `${s.msgs[r.address]?.length || 0} messages`));
    chead.append(t);
    pillEl = el("span", "pill"); pillEl.id = "mr-status"; pillEl.setAttribute("role", "status");
    peersEl = el("button", "gbtn"); peersEl.type = "button"; peersEl.setAttribute("aria-label", "Show connected peers"); peersEl.addEventListener("click", () => togglePop("peers"));
    chead.append(pillEl, peersEl);
    if (r) { const sh = el("button", "gbtn"); sh.type = "button"; sh.setAttribute("aria-label", "Share this room"); sh.append(icon("share"), document.createTextNode("Share")); sh.addEventListener("click", () => togglePop("share")); chead.append(sh); }
    renderStatus();
  }

  function msgRow(prev, m) {
    const mine = m.authorId === s.identityId;
    const cont = prev && prev.authorId === m.authorId && m.ts - prev.ts < GROUP_MS && sameDay(prev.ts, m.ts);
    const frag = document.createDocumentFragment();
    if (!prev || !sameDay(prev.ts, m.ts)) { const d = el("div", "day", dayLabel(m.ts)); d.setAttribute("role", "separator"); frag.append(d); }
    const row = el("div", `msg${mine ? " mine" : ""}${cont ? " cont" : ""}`);
    const gut = el("div", "gut");
    const body = el("div", "mbody");
    if (cont) { gut.append(el("span", "hov", timeLabel(m.ts))); }
    else {
      gut.append(avatar(m.author || "anon", m.authorId, "sm"));
      const who = el("div", "who"); who.append(el("b", "", m.author || "anon"));
      const sid = el("small", "sid", shortId(m.authorId)); sid.title = m.authorId || "";
      who.append(sid, el("small", "", timeLabel(m.ts)));
      body.append(who);
    }
    body.append(el("div", "bubble", m.text));
    row.append(gut, body); frag.append(row);
    return frag;
  }
  function appendMsg(list, i) {
    const empty = log.querySelector(".empty"); if (empty) { renderLog(); return; }
    const near = log.scrollHeight - log.scrollTop - log.clientHeight < 80 || list[i].authorId === s.identityId;
    log.append(msgRow(list[i - 1], list[i]));
    if (near) log.scrollTop = log.scrollHeight;
  }
  function renderLog() {
    log.replaceChildren();
    const list = s.msgs[s.current] || [];
    if (!list.length) {
      const e = el("div", "empty"); const m = el("span", "mark"); m.append(markSvg());
      e.append(m, el("h3", "", "Say hello"), el("p", "", "This room has no messages yet. Share its address (Share, top right) and anyone with it, plus a relay you both reach, can join. Messages go straight between browsers."));
      log.append(e);
    }
    list.forEach((m, i) => log.append(msgRow(list[i - 1], m)));
    log.scrollTop = log.scrollHeight;
  }

  function renderNote() {
    noteHost.replaceChildren();
    if (!s.note) return;
    const n = el("div", "note"); n.setAttribute("role", "alert");
    n.append(el("span", "", s.note), ibtn("close", "Dismiss", "", () => { s.note = ""; renderNote(); }));
    noteHost.append(n);
  }

  const poweredBy = (cls = "") => {
    const d = el("div", `powered${cls ? ` ${cls}` : ""}`);
    const logo = (href, svg) => { const a = el("a", "plogo"); a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.setAttribute("aria-label", svg.getAttribute("aria-label")); a.append(svg); return a; };
    d.append(el("span", "", "Built with"), logo("https://github.com/FraterCCCLXIII/kamiji", logoSvg("0 0 276 118", "Kamiji", KAMIJI_STROKES, 16)), logo("https://kosmos.computer", logoSvg("0 0 405.3 82.71", "Kosmos", KOSMOS_PATHS)));
    return d;
  };

  function fillHelp() {
    helpEl.replaceChildren();
    if (s.status === "no-relay") {
      helpEl.append(document.createTextNode("No relay yet. A relay only introduces browsers to each other; it never stores your messages. Run "), el("code", "", "npm run relay"), document.createTextNode(" in the Murmur folder, then paste an address it prints into Relay settings."));
    } else if (s.status === "error") helpEl.append(document.createTextNode("Could not connect. Check the relay address in Relay settings."));
    else if (connected()) helpEl.append(document.createTextNode("Connected. Start a room and share its address, or join a friend's room with theirs."));
    else helpEl.append(document.createTextNode("Connecting to your relay…"));
  }

  function buildWelcome() {
    welcome.replaceChildren();
    const w = el("div"); const m = el("div", "mark wmark"); m.append(markSvg());
    w.append(m, el("h2", "", "Murmur"));
    w.lastChild.style.cssText = "margin:0 0 6px;font-size:40px;font-weight:300;letter-spacing:-.01em;color:var(--mr-contrast)";
    w.append(el("p", "", "Peer-to-peer rooms with no server in the middle. Like a flock of starlings, everyone follows their neighbours."));
    const acts = el("div", "wactions");
    const go = el("button", "pbtn", "Start a room"); go.type = "button"; go.addEventListener("click", () => open({ kind: "name", value: randomRoomName() }));
    const jn = el("button", "gbtn", "Join with an address"); jn.type = "button"; jn.addEventListener("click", () => { s.wjoin = !s.wjoin; buildWelcome(); (welcome.querySelector(".wjoin input") || jn).focus(); });
    jn.setAttribute("aria-expanded", String(s.wjoin));
    const rs = el("button", "gbtn", "Relay settings"); rs.type = "button"; rs.addEventListener("click", () => togglePop("settings"));
    acts.append(go, jn, rs); w.append(acts);
    if (s.wjoin) {
      const f = el("form", "wjoin"); const i = el("input"); i.placeholder = "/orbitdb/… or a room name"; i.setAttribute("aria-label", "Room address to join");
      const j = el("button", "pbtn", "Join"); j.type = "submit"; f.append(i, j);
      f.addEventListener("submit", (e) => { e.preventDefault(); const v = i.value; s.wjoin = false; open(v); });
      w.append(f);
    }
    helpEl = el("div", "help"); helpEl.setAttribute("role", "note"); fillHelp(); w.append(helpEl);
    welcome.append(w, poweredBy("wpowered"));
  }

  function renderBody() {
    const showThread = Boolean(s.current && curRoom());
    welcome.hidden = showThread; thread.hidden = !showThread;
    if (!showThread) buildWelcome();
    ta.disabled = !showThread;
    sendBtn.disabled = !showThread || !ta.value.trim() || !live.has(s.current);
    shell.classList.toggle("v-main", s.view === "main"); shell.classList.toggle("v-list", s.view !== "main");
  }

  function renderAll() {
    if (disposed) return;
    fit();
    renderRooms(); renderHead(); renderBody(); renderLog(); renderNote(); renderPop();
    grip.refresh();
  }

  // ── Popovers: peers, share, settings ──
  function togglePop(kind) {
    if (s.pop === kind) { closePop(); return; }
    s.opener = doc.activeElement; s.pop = kind; s.settingsErr = ""; renderPop();
    popHost.querySelector("textarea,input,button")?.focus();
  }
  function closePop() { s.pop = ""; renderPop(); const o = s.opener; s.opener = null; if (o && o.isConnected) o.focus(); }

  function renderPop() {
    popHost.replaceChildren();
    if (!s.pop) return;
    const bd = el("div", "back"); bd.addEventListener("click", closePop);
    const p = el("div", `pop${s.pop === "settings" ? " center" : ""}`); p.setAttribute("role", "dialog"); p.setAttribute("aria-modal", "false");
    const hd = (title) => { const h = el("header"); h.append(el("h3", "", title), ibtn("close", "Close", "", closePop)); p.setAttribute("aria-label", title); return h; };
    if (s.pop === "peers") {
      p.append(hd("Connected peers"));
      if (!s.peers.length) p.append(el("div", "muted", "Nobody else is connected yet. Peers appear once someone else is on the same relay."));
      for (const x of s.peers) { const row = el("div", "peer"); row.append(avatar(x.id, x.id, "sm"), el("code", "", `${shortId(x.id)}${x.relayed ? "  (via relay)" : "  (direct)"}`)); p.append(row); }
    } else if (s.pop === "share") {
      const r = curRoom(); p.append(hd(`Share ${r?.name || "room"}`));
      p.append(el("div", "muted", "Anyone with this address can read and write the room. They also need to reach a relay that you share with them."), el("code", "", r?.address || ""));
      const qr = el("div", "qr"); const svg = r && qrSvg(r.address); qr.append(svg || document.createTextNode("QR unavailable")); p.append(qr);
      const copied = el("span", "muted"); copied.setAttribute("role", "status");
      const acts = el("div", "acts");
      const cp = el("button", "pbtn"); cp.type = "button"; cp.append(icon("copy"), document.createTextNode("Copy address"));
      cp.addEventListener("click", async () => { try { await navigator.clipboard.writeText(r.address); copied.textContent = "Copied."; } catch { copied.textContent = "Copy failed: select the address and copy it."; } });
      acts.append(cp, copied); p.append(acts);
    } else if (s.pop === "settings") {
      p.append(hd("Settings"));
      const nl = el("label", "", "Display name"); const ni = el("input"); ni.value = s.name; ni.maxLength = 32; ni.setAttribute("aria-label", "Display name"); ni.placeholder = "Display name"; nl.append(ni);
      const rl = el("label", "", "Relay addresses (one per line)");
      const rt = el("textarea"); rt.rows = 4; rt.value = s.relays.join("\n"); rt.placeholder = RELAY_PLACEHOLDER; rt.setAttribute("aria-label", "Relay multiaddrs"); rl.append(rt);
      p.append(nl, rl, el("div", "muted", "Run `npm run relay` in the Murmur folder and paste an address it prints. No public relay is enabled by default. Saving restarts your connection."));
      if (s.settingsErr) { const e = el("div", "err", s.settingsErr); e.setAttribute("role", "alert"); p.append(e); }
      const acts = el("div", "acts");
      acts.append(btn("Save and reconnect", "pbtn", () => {
        const lines = rt.value.split("\n").map((x) => x.trim()).filter(Boolean);
        const bad = lines.map((x) => ({ x, v: validateRelay(x) })).find((r) => !r.v.ok);
        if (bad) { s.settingsErr = `${bad.x}: ${bad.v.note}`; s.relays = s.relays; const keepName = ni.value; s.name = keepName.trim() || s.name; renderPop(); popHost.querySelector("textarea").value = rt.value; return; }
        s.name = ni.value.trim() || s.name; s.relays = lines; persist(); s.pop = ""; s.opener = null; boot();
      }), btn("Cancel", "gbtn", closePop));
      p.append(acts);
    }
    popHost.append(bd, p);
  }

  renderAll();
  boot();
  return () => { disposed = true; win.removeEventListener("resize", fit0); ro?.disconnect(); grip.dispose(); offEvent?.(); live.forEach((l) => l.off?.()); Promise.resolve(transport?.stop?.()).catch(() => {}); root.remove(); };
}

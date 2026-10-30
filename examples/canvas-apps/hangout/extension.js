/* Hangout — a Canvas App for talking to your agents like teammates: a list of agents
 * with their latest update, a chat with the one you pick, and their screen and routines
 * beside it.
 *
 * Browser-only, dependency-free ESM. Styles are scoped under `.hg`; text is always set
 * with textContent. Sample agents and threads are stored in this browser's localStorage.
 * With a reachable Agent Server it also lists your real conversations as agents, shows
 * their latest messages, and sends your message into the conversation.
 */

const STORAGE_KEY = "hangout:v1";

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

const SAMPLE_AGENTS = [
  { id: "chief", role: "Conductor", model: "Fable", name: "Chief of Staff", blob: "violet", time: "7:34 PM", unread: false,
    thread: [
      ["me", "Hey, what's the latest update we have on Brightside Health?"],
      ["agent", "From last meeting's call notes, they need to see support for Slack integration and SSO before they proceed with a pilot."],
      ["agent", "PG plan and Brightside Health's account notes in CRM are up to date with the latest."],
      ["file", { name: "Kickoff Agenda.pdf", meta: "12 pages · 1.2 MB" }],
      ["me", "Perfect, those shipped last week, post an update to let them know"],
      ["agent", "Got it! Product updates shared and linked in #brightside-shared slack channel"],
    ],
    routines: [["Morning briefing", "Every day at 8:00 AM", true], ["Inbox cleanup", "Weekdays at 6:00 PM", true], ["Weekly team update", "Paused", false]] },
  { id: "ea", role: "Dispatcher", model: "No model", name: "EA", blob: "blue", time: "", unread: false, thread: [["agent", "Responded in 3 threads, with two meetings moved to Thursday."]], routines: [["Calendar sweep", "Every day at 7:30 AM", true]] },
  { id: "inbox", parentId: "ea", role: "Janitor", model: "Haiku", name: "Inbox Manager", blob: "green", time: "7:34 PM", unread: false, thread: [["agent", "Inbox at zero. 2 replies ready."]], routines: [["Triage", "Every 30 minutes", true]] },
  { id: "sales", role: "Worker", model: "Sonnet", name: "Sales Outbound", blob: "teal", time: "11:18 AM", unread: false, thread: [["agent", "Outreach drafts queued for approval."]], routines: [["Lead refresh", "Weekdays at 9:00 AM", true]] },
  { id: "talent", role: "Scout", model: "Sonnet", name: "Talent Scout", blob: "brown", time: "", unread: true, thread: [["agent", "Shortlist of 6 candidates ready for review."]], routines: [["Sourcing run", "Mondays at 10:00 AM", true]] },
  { id: "growth", role: "Worker", model: "Sonnet", name: "Growth Marketer", blob: "orange", time: "9:04 AM", unread: false, thread: [["agent", "A/B copy variants ready to review."]], routines: [["Experiment readout", "Fridays at 4:00 PM", true]] },
  { id: "support", role: "Verifier", model: "Opus", name: "Customer Support", blob: "red", time: "2:20 PM", unread: false, thread: [["agent", "12 tickets resolved, 2 escalated."]], routines: [["Queue sweep", "Every hour", true]] },
  { id: "expense", role: "Janitor", model: "Haiku", name: "Expense Manager", blob: "pink", time: "Tuesday", unread: false, thread: [["agent", "Receipts coded. One needs a manager's approval."]], routines: [["Receipt coding", "Daily at 5:00 PM", true]] },
  { id: "invoice", role: "Worker", model: "Haiku", name: "Invoice Collector", blob: "indigo", time: "Yesterday", unread: false, thread: [["agent", "Pulled 9 invoices from vendor portals."]], routines: [["Vendor pull", "Weekdays at 8:30 AM", true]] },
];

// Names, roles and model tiers for conversations that carry no agent profile of their own.
const PERSONAS = [
  { name: "Atlas", role: "Conductor", model: "Fable" },
  { name: "Nova", role: "Scout", model: "Sonnet" },
  { name: "Sentinel", role: "Verifier", model: "Opus" },
  { name: "Forge", role: "Worker", model: "Opus" },
  { name: "Pixel", role: "Worker", model: "Sonnet" },
  { name: "Sage", role: "Janitor", model: "Haiku" },
  { name: "Botley", role: "Worker", model: "Haiku" },
];

const SVG_NS = "http://www.w3.org/2000/svg";

const mixHex = (hex, other, t) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const m = parseInt(other.replace("#", ""), 16);
  const ch = (shift) => Math.round(((n >> shift) & 255) * (1 - t) + ((m >> shift) & 255) * t);
  return `#${[16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, "0")).join("")}`;
};

// Fingers as fat round-capped strokes: [x1, y1, x2, y2, width], pinky to thumb.
const FINGERS = [[17, 40, 8.5, 23.5, 8.4], [24.5, 34, 21.5, 13, 9], [32, 32, 32, 8.5, 9.6], [39.5, 34, 43, 13.5, 9], [47, 44, 57.5, 33, 9.4]];
const PALM = "M14.5 41C14.5 32 21 29.5 32 29.5S49.5 32 49.5 41C49.5 53 42 59 32 59S14.5 53 14.5 41Z";

/** Draws the Kamiji hand into an svg: one smooth glossy piece with a shaded rim and highlights, like the 3D model. */
function drawHand(svg, color) {
  const dark = mixHex(color, "#000000", 0.3);
  const light = mixHex(color, "#ffffff", 0.45);
  const add = (parent, tag, attrs) => {
    const n = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v)));
    parent.append(n);
    return n;
  };
  const layer = (fill, attrs = {}) => {
    const g = add(svg, "g", { fill, stroke: fill, "stroke-linecap": "round", "stroke-linejoin": "round", ...attrs });
    add(g, "path", { d: PALM, stroke: "none" });
    FINGERS.forEach(([x1, y1, x2, y2, w]) => add(g, "line", { x1, y1, x2, y2, "stroke-width": w }));
    return g;
  };
  layer(dark, { transform: "translate(.9 1.2)" });
  layer(color);
  const hi = add(svg, "g", { stroke: light, "stroke-linecap": "round", opacity: 0.3, fill: "none" });
  FINGERS.forEach(([x1, y1, x2, y2, w]) => {
    const dx = (x2 - x1) * 0.8, dy = (y2 - y1) * 0.8;
    add(hi, "line", { x1: x1 + (x2 - x1) * 0.18 - w * 0.2, y1: y1 + (y2 - y1) * 0.18 - w * 0.1, x2: x1 + dx - w * 0.2, y2: y1 + dy - w * 0.1, "stroke-width": 2.2 });
  });
  add(svg, "ellipse", { cx: 25.5, cy: 36, rx: 6.5, ry: 3.4, fill: light, opacity: 0.18, transform: "rotate(-24 25.5 36)" });
}

/** The Kamiji hand avatar tinted per agent: glossy, chunky fingers and the friendly face of the 3D model. */
export function blobSvg(blobId) {
  const blob = BLOBS.find((b) => b.id === blobId) || BLOBS[0];
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("aria-hidden", "true");
  drawHand(svg, blob.fill);
  const add = (tag, attrs) => {
    const n = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v)));
    svg.append(n);
  };
  [[26.2, 43], [37.8, 43]].forEach(([cx, cy]) => {
    add("ellipse", { cx, cy, rx: 3.5, ry: 4.3, fill: "#eceff1", stroke: "rgba(0,0,0,.25)", "stroke-width": 0.5 });
    add("ellipse", { cx: cx + 0.2, cy: cy + 0.4, rx: 1.9, ry: 2.8, fill: "#15171a" });
    add("circle", { cx: cx + 0.9, cy: cy - 0.6, r: 0.75, fill: "#fff" });
  });
  [[26, 36.4, -5], [38, 36.4, 5]].forEach(([x, y, r]) => add("path", { d: `M${x - 3} ${y}H${x + 3}`, stroke: "rgba(60,30,20,.75)", "stroke-width": 1.1, "stroke-linecap": "round", transform: `rotate(${r} ${x} ${y})` }));
  add("path", { d: "M25.4 49.4Q32 58.4 38.6 49.4Q32 51.3 25.4 49.4Z", fill: "#3a1b1d" });
  add("ellipse", { cx: 32, cy: 53.2, rx: 3, ry: 1.5, fill: "#e58aa0" });
  return svg;
}

// ─── The Kamiji face engine: 8 body shapes × 16 expressions × a colour, drawn as SVG ──

export const LOOK_SHAPES = [
  ["circle", "Circle", "Basic"], ["pebble", "Pebble", "Basic"], ["squircle", "Squircle", "Basic"], ["capsule", "Capsule", "Basic"],
  ["triangle", "Triangle", "Basic"], ["hexagon", "Hexagon", "Basic"], ["pentagon", "Pentagon", "Basic"], ["octagon", "Octagon", "Basic"],
  ["diamond", "Diamond", "Basic"], ["egg", "Egg", "Basic"],
  ["cloud", "Cloud", "Organic"], ["droplet", "Droplet", "Organic"], ["bean", "Bean", "Organic"], ["blob", "Blob", "Organic"],
  ["flower", "Flower", "Organic"], ["leaf", "Leaf", "Organic"],
  ["star", "Star", "Symbols"], ["heart", "Heart", "Symbols"], ["burst", "Burst", "Symbols"], ["shield", "Shield", "Symbols"],
  ["bubble", "Bubble", "Symbols"], ["ghost", "Ghost", "Symbols"],
  ["hand", "Hand", "Characters"], ["bunny", "Bunny", "Characters"], ["cat", "Cat", "Characters"], ["bear", "Bear", "Characters"],
];
export const LOOK_EXPRESSIONS = [
  ["neutral", "Neutral"], ["attentive", "Attentive"], ["surprised", "Surprised"], ["excited", "Excited"],
  ["happy", "Happy"], ["laughing", "Laughing"], ["angry", "Angry"], ["sad", "Sad"],
  ["scared", "Scared"], ["suspicious", "Suspicious"], ["confused", "Confused"], ["curious", "Curious"],
  ["proud", "Proud"], ["shy", "Shy"], ["unimpressed", "Unimpressed"], ["sleepy", "Sleepy"],
];
export const LOOK_COLORS = ["#0b0b0c", "#8a5a3c", "#ef4444", "#f5760a", "#f2b51d", "#34d399", "#19b5a5", "#3b82f6", "#8b5cf6", "#ec4899", "#9a9a9a", "#efece4"];
export const LOOK_EYES = [
  ["oval", "Oval"], ["round", "Round"], ["dot", "Dot"], ["cartoon", "Cartoon"], ["glossy", "Glossy"],
  ["cat", "Cat"], ["sparkle", "Sparkle"], ["heart", "Heart"], ["cross", "Cross"], ["dizzy", "Dizzy"], ["lashes", "Lashes"],
];
export const LOOK_GAZES = [["center", "Center"], ["left", "Left"], ["right", "Right"], ["up", "Up"], ["down", "Down"]];
export const LOOK_TOGGLES = [["brows", "Brows"], ["mouth", "Mouth"], ["effects", "Effects"], ["shine", "Shine"], ["glasses", "Glasses"]];
export const DEFAULT_LOOK = {
  shape: "circle", expression: "neutral", color: LOOK_COLORS[0],
  eyeStyle: "oval", gaze: "center", eyeSize: 1, eyeSpacing: 1,
  brows: true, mouth: true, effects: true, shine: false, glasses: false, blush: "auto",
};
const GAZE = { center: [0, 0], left: [-1.5, 0], right: [1.5, 0], up: [0, -1.3], down: [0, 1.3] };

// Body outline per shape, with where the face sits and how big it is.
const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const poly = (n, r, rot = -90, cx = 32, cy = 34) => `M${Array.from({ length: n }, (_, i) => `${(cx + r * Math.cos(((rot + (360 / n) * i) * Math.PI) / 180)).toFixed(1)} ${(cy + r * Math.sin(((rot + (360 / n) * i) * Math.PI) / 180)).toFixed(1)}`).join("L")}Z`;
const starPath = (n, R, r, cx = 32, cy = 34) => `M${Array.from({ length: n * 2 }, (_, i) => { const rad = i % 2 ? r : R; const a = ((-90 + (180 / n) * i) * Math.PI) / 180; return `${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`; }).join("L")}Z`;
const BODIES = {
  circle: { d: circ(32, 32, 26), fy: 34, k: 1 },
  pebble: { d: "M32 7C47 6 58 17 57 32c-1 15-12 25-26 25C17 56 7 45 7 31 7 17 18 8 32 7Z", fy: 34, k: 1 },
  squircle: { d: "M25 7h14c13 0 18 5 18 18v14c0 13-5 18-18 18H25C12 57 7 52 7 39V25C7 12 12 7 25 7Z", fy: 33, k: 1 },
  capsule: { d: "M32 4c10 0 18 8 18 18v20c0 10-8 18-18 18S14 52 14 42V22C14 12 22 4 32 4Z", fy: 32, k: 0.92 },
  triangle: { d: "M32 7Q35 7 37 11L58 49Q61 56 53 56H11Q3 56 6 49L27 11Q29 7 32 7Z", fy: 42, k: 0.82 },
  hexagon: { d: "M32 6 55 19v26L32 58 9 45V19Z", fy: 33, k: 1, round: true },
  pentagon: { d: poly(5, 24, -90, 32, 36), fy: 37, k: 0.95, round: true },
  octagon: { d: poly(8, 24, -67.5, 32, 32), fy: 33, k: 1, round: true },
  diamond: { d: "M32 7 56 32 32 57 8 32Z", fy: 33, k: 0.9, round: true },
  egg: { d: "M32 5C44 5 52 22 52 36c0 13-9 22-20 22S12 49 12 36C12 22 20 5 32 5Z", fy: 38, k: 0.95 },
  cloud: { d: "M20 50a14 14 0 0 1-1-28 14 14 0 0 1 14-9 14 14 0 0 1 14 11 13 13 0 0 1-3 26Z", fy: 36, k: 0.95 },
  droplet: { d: "M32 4C26 14 12 28 12 41a20 20 0 0 0 40 0C52 28 38 14 32 4Z", fy: 42, k: 0.88 },
  bean: { d: "M19 12C30 4 52 8 55 26c2 14-7 22-18 24-9 2-12 8-20 6C6 53 4 42 8 31 10 23 12 17 19 12Z", fy: 32, k: 0.9 },
  blob: { d: "M32 6C42 4 54 12 56 24c2 10-4 14-3 22 1 8-9 13-19 12C22 57 8 54 7 42 6 32 14 28 12 20 11 12 22 8 32 6Z", fy: 33, k: 0.95 },
  flower: { d: [circ(32, 33, 15), ...Array.from({ length: 6 }, (_, i) => circ(+(32 + 17 * Math.cos(((i * 60 - 90) * Math.PI) / 180)).toFixed(1), +(33 + 17 * Math.sin(((i * 60 - 90) * Math.PI) / 180)).toFixed(1), 11))].join(""), fy: 34, k: 0.9 },
  leaf: { d: "M10 54C8 28 24 8 55 8c0 30-16 48-45 46Z", fy: 34, k: 0.85 },
  star: { d: starPath(5, 28, 15, 32, 35), fy: 38, k: 0.7, round: true },
  heart: { d: "M32 56C14 44 6 33 6 22 6 13 13 7 21 7c5 0 9 3 11 7 2-4 6-7 11-7 8 0 15 6 15 15 0 11-8 22-26 34Z", fy: 30, k: 0.9 },
  burst: { d: starPath(10, 29, 22, 32, 32), fy: 33, k: 0.95, round: true },
  shield: { d: "M32 5 54 12v18c0 14-10 24-22 29C20 54 10 44 10 30V12Z", fy: 30, k: 0.95, round: true },
  bubble: { d: "M12 8h40c4 0 7 3 7 7v26c0 4-3 7-7 7H28L16 58V48h-4c-4 0-7-3-7-7V15c0-4 3-7 7-7Z", fy: 27, k: 0.95 },
  ghost: { d: "M32 5C18 5 10 15 10 29v28l7-6 7 6 8-6 8 6 7-6 7 6V29C54 15 46 5 32 5Z", fy: 29, k: 0.95 },
  bunny: { d: `${"M10 38a22 20 0 1 0 44 0a22 20 0 1 0-44 0Z"}${"M14 17a6 10 0 1 0 12 0a6 10 0 1 0-12 0Z"}${"M38 17a6 10 0 1 0 12 0a6 10 0 1 0-12 0Z"}`, fy: 40, k: 0.9 },
  cat: { d: `${circ(32, 38, 22)}M11 30 12 6 28 17ZM53 30 52 6 36 17Z`, fy: 40, k: 0.9, round: true },
  bear: { d: `${circ(32, 37, 22)}${circ(14, 16, 8)}${circ(50, 16, 8)}`, fy: 39, k: 0.9 },
  hand: { d: "", hand: true, fy: 44, k: 0.8 },
};

// Eyes: oval [rx, ry, tilt], arc (^), smile-arc (‿), line, wide. Brows: [y, tiltLeft, tiltRight].
const FACES = {
  neutral: { eye: ["oval", 2.4, 4.4, 14] },
  attentive: { eye: ["oval", 2.6, 5, 0], brow: [-9, -6, 6] },
  surprised: { eye: ["oval", 3.4, 5.4, 0], mouth: "o", brow: [-11, -8, 8] },
  excited: { eye: ["oval", 3, 4.8, 0], mouth: "M-7 7Q0 17 7 7Z", sparkle: true },
  happy: { eye: ["arc"], mouth: "M-6 7Q0 13 6 7", blush: true },
  laughing: { eye: ["arc"], mouth: "M-8 6Q0 18 8 6Z", blush: true },
  angry: { eye: ["oval", 2.6, 3.4, -24], mouth: "M-6 11Q0 6 6 11", brow: [-8, 22, -22] },
  sad: { eye: ["oval", 2.4, 4.4, 24], mouth: "M-6 11Q0 6 6 11", brow: [-8, -20, 20], tear: true },
  scared: { eye: ["oval", 3.4, 5.6, 0], mouth: "M-7 10l2-3 2 3 2-3 2 3 2-3 2 3", brow: [-11, -12, 12], sweat: true },
  suspicious: { eye: ["oval", 3.2, 1.7, 0], mouth: "M-5 9H5", brow: [-7, 10, -4] },
  confused: { eye: ["oval", 2.2, 3.4, 0], eye2: ["oval", 3, 5, 0], mouth: "M-6 9q3-4 6 0t6 0", brow: [-9, 0, -12] },
  curious: { eye: ["oval", 2.4, 4.4, 0], eye2: ["oval", 3.2, 5.6, 0], mouth: "o", small: true, brow: [-9, 0, -10] },
  proud: { eye: ["smile"], mouth: "M-5 8Q0 11 6 6", blush: true },
  shy: { eye: ["oval", 2.2, 3, 0], mouth: "M-3 9Q0 11 3 9", blush: true, down: true },
  unimpressed: { eye: ["line"], mouth: "M-5 9H5", brow: [-7, 0, 0] },
  sleepy: { eye: ["line"], mouth: "o", small: true, zz: true },
};

const luminance = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};

/** Draws one Kamiji face: body shape, expression, eye style and options. Returns an <svg> element. */
export function kamijiFace(input = DEFAULT_LOOK) {
  const look = { ...DEFAULT_LOOK, ...input };
  const body = BODIES[look.shape] || BODIES.circle;
  const face = FACES[look.expression] || FACES.neutral;
  const color = /^#[0-9a-f]{6}$/i.test(look.color) ? look.color : DEFAULT_LOOK.color;
  const dark = luminance(color) < 0.5;
  const ink = dark ? "#ffffff" : "rgba(0,0,0,.82)";
  const pupil = "#15171a";
  const size = Math.max(0.6, Math.min(1.5, Number(look.eyeSize) || 1));
  const spread = Math.max(0.7, Math.min(1.4, Number(look.eyeSpacing) || 1));
  const [gx, gy] = GAZE[look.gaze] || GAZE.center;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("aria-hidden", "true");
  const add = (parent, tag, attrs) => {
    const n = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v)));
    parent.append(n);
    return n;
  };
  if (body.hand) drawHand(svg, color);
  const shape = body.hand ? null : add(svg, "path", { d: body.d, fill: color });
  if (shape && body.round) { shape.setAttribute("stroke", color); shape.setAttribute("stroke-width", "6"); shape.setAttribute("stroke-linejoin", "round"); }
  if (look.shine && shape) {
    const id = `kclip${Math.random().toString(36).slice(2, 8)}`;
    const clip = add(svg, "clipPath", { id });
    add(clip, "path", { d: body.d });
    add(svg, "ellipse", { cx: 24, cy: 20, rx: 14, ry: 8, fill: "#ffffff", opacity: dark ? 0.16 : 0.4, "clip-path": `url(#${id})`, transform: "rotate(-28 24 20)" });
  }
  const g = add(svg, "g", { transform: `translate(32 ${body.fy}) scale(${body.k})` });
  const stroke = { fill: "none", stroke: ink, "stroke-width": 2.4, "stroke-linecap": "round", "stroke-linejoin": "round" };
  const eyeX = 8 * spread;

  const ovalEye = (x, y, rx, ry, tilt) => {
    const grp = add(g, "g", { transform: `rotate(${x < 0 ? tilt : -tilt} ${x} ${y})` });
    rx *= size; ry *= size;
    switch (look.eyeStyle) {
      case "round": add(grp, "circle", { cx: x + gx * 0.4, cy: y + gy * 0.4, r: ((rx + ry) / 2) * 1.05, fill: ink }); break;
      case "dot": add(grp, "circle", { cx: x + gx * 0.5, cy: y + gy * 0.5, r: 1.9 * size, fill: ink }); break;
      case "cartoon":
        add(grp, "ellipse", { cx: x, cy: y, rx: rx * 1.45, ry: ry * 1.2, fill: "#f4f6f7", stroke: "rgba(0,0,0,.28)", "stroke-width": 0.5 });
        add(grp, "ellipse", { cx: x + gx, cy: y + gy + 0.4, rx: rx * 0.72, ry: ry * 0.8, fill: pupil });
        add(grp, "circle", { cx: x + gx + rx * 0.35, cy: y + gy - ry * 0.25, r: 0.75, fill: "#fff" });
        break;
      case "glossy":
        add(grp, "ellipse", { cx: x + gx * 0.5, cy: y + gy * 0.5, rx, ry, fill: ink });
        add(grp, "circle", { cx: x + gx * 0.5 + rx * 0.3, cy: y + gy * 0.5 - ry * 0.35, r: 0.95, fill: dark ? color : "#fff" });
        break;
      case "cat":
        add(grp, "ellipse", { cx: x, cy: y, rx: rx * 1.4, ry: ry * 1.1, fill: "#e9e2a8", stroke: "rgba(0,0,0,.25)", "stroke-width": 0.5 });
        add(grp, "ellipse", { cx: x + gx, cy: y + gy, rx: 0.8, ry: ry * 0.95, fill: pupil });
        break;
      case "sparkle": add(grp, "path", { d: `M${x} ${y - ry * 1.3}Q${x + 0.6} ${y - 0.6} ${x + rx * 1.4} ${y}Q${x + 0.6} ${y + 0.6} ${x} ${y + ry * 1.3}Q${x - 0.6} ${y + 0.6} ${x - rx * 1.4} ${y}Q${x - 0.6} ${y - 0.6} ${x} ${y - ry * 1.3}Z`, fill: ink }); break;
      case "heart": add(grp, "path", { d: `M${x} ${y + ry}C${x - rx * 3} ${y - 1} ${x - rx * 1.3} ${y - ry * 1.3} ${x} ${y - ry * 0.35}C${x + rx * 1.3} ${y - ry * 1.3} ${x + rx * 3} ${y - 1} ${x} ${y + ry}Z`, fill: "#ff5a7a" }); break;
      case "cross": add(grp, "path", { d: `M${x - rx * 1.4} ${y - ry * 0.8}L${x + rx * 1.4} ${y + ry * 0.8}M${x + rx * 1.4} ${y - ry * 0.8}L${x - rx * 1.4} ${y + ry * 0.8}`, ...stroke }); break;
      case "dizzy":
        add(grp, "circle", { cx: x, cy: y, r: ry * 1.1, ...stroke, "stroke-width": 1.6 });
        add(grp, "circle", { cx: x, cy: y, r: ry * 0.45, ...stroke, "stroke-width": 1.6 });
        break;
      case "lashes":
        add(grp, "ellipse", { cx: x + gx * 0.5, cy: y + gy * 0.5, rx, ry, fill: ink });
        [-1, 0, 1].forEach((i) => add(grp, "path", { d: `M${x + i * 2.2} ${y - ry - 0.6}l${i * 1.6} -2.2`, ...stroke, "stroke-width": 1.3 }));
        break;
      default: add(grp, "ellipse", { cx: x + gx * 0.5, cy: y + gy * 0.5, rx, ry, fill: ink });
    }
  };
  const eyeAt = (spec, x) => {
    const [kind, rx, ry, tilt] = spec;
    const y = face.down ? 1 : -1;
    if (kind === "oval") ovalEye(x, y, rx, ry, tilt);
    else if (kind === "arc") add(g, "path", { d: `M${x - 4} ${y + 2}Q${x} ${y - 5} ${x + 4} ${y + 2}`, ...stroke });
    else if (kind === "smile") add(g, "path", { d: `M${x - 4} ${y - 1}Q${x} ${y + 5} ${x + 4} ${y - 1}`, ...stroke });
    else add(g, "path", { d: `M${x - 4} ${y}H${x + 4}`, ...stroke });
  };
  eyeAt(face.eye, -eyeX);
  eyeAt(face.eye2 || face.eye, eyeX);
  if (look.glasses) {
    [-eyeX, eyeX].forEach((x) => add(g, "circle", { cx: x, cy: -1, r: 7.6 * Math.max(size, 0.9), ...stroke, "stroke-width": 1.5 }));
    add(g, "path", { d: `M${-eyeX + 7.4} -1Q0 -4 ${eyeX - 7.4} -1`, ...stroke, "stroke-width": 1.5 });
  }
  if (face.brow && look.brows) {
    const [by, tl, tr] = face.brow;
    add(g, "path", { d: "M-12 0H-4", ...stroke, transform: `translate(0 ${by}) rotate(${tl} -8 0)` });
    add(g, "path", { d: "M4 0H12", ...stroke, transform: `translate(0 ${by}) rotate(${tr} 8 0)` });
  }
  if (look.blush === "on" || (look.blush === "auto" && face.blush)) [-14, 14].forEach((x) => add(g, "ellipse", { cx: x * spread, cy: 6, rx: 4, ry: 2.4, fill: "#ff7a8a", opacity: 0.45 }));
  if (look.mouth) {
    if (face.mouth === "o") add(g, "ellipse", { cx: 0, cy: 9, rx: face.small ? 2 : 3, ry: face.small ? 2.4 : 4, fill: ink });
    else if (face.mouth) add(g, "path", { d: face.mouth, ...stroke, fill: /Z$/.test(face.mouth) ? ink : "none" });
    else add(g, "path", { d: "M-5 9Q0 12 5 9", ...stroke });
  }
  if (look.effects) {
    if (face.sparkle) [[-17, -9], [17, -9]].forEach(([x, y]) => add(g, "path", { d: `M${x} ${y - 3}V${y + 3}M${x - 3} ${y}H${x + 3}`, ...stroke, "stroke-width": 1.6 }));
    if (face.tear) add(g, "path", { d: "M-12 5q-2 4 0 6 2-2 0-6Z", fill: "#7dd3fc", stroke: "none" });
    if (face.sweat) add(g, "path", { d: "M15 -8q-3 5 0 7 3-2 0-7Z", fill: "#7dd3fc", stroke: "none" });
    if (face.zz) add(g, "path", { d: "M14 -12h6l-6 6h6", ...stroke, "stroke-width": 1.6 });
  }
  return svg;
}

/** The face as a PNG blob, drawn from its SVG, for the Export button. */
export function faceToPng(look, size = 512) {
  const svg = kamijiFace(look);
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      canvas.getContext("2d").drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("PNG export failed")); };
    img.src = url;
  });
}

/** Text of a MessageEvent from the Agent Server, or "". */
export function messageText(event) {
  if (!event || event.kind !== "MessageEvent") return "";
  const parts = event.llm_message?.content;
  if (!Array.isArray(parts)) return "";
  return parts.map((p) => (p && p.type === "text" ? p.text : "")).join("").trim();
}

/** The model a conversation runs, from whichever field the server reports it in. */
export function modelOf(conversation) {
  const usage = conversation.stats?.usage_to_metrics;
  const fromUsage = usage ? Object.values(usage).map((u) => u?.model_name).find(Boolean) : null;
  const raw = conversation.current_model_name || conversation.current_model_id || conversation.agent?.llm?.model || fromUsage || "";
  return String(raw).replace(/^.*\//, "");
}

const titleCase = (text) => String(text).replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Turns a conversation list item and its newest events into an agent row. */
export function liveAgent(conversation, events = [], profiles = []) {
  const activity = activityOf(events);
  const messages = events
    .map((e) => ({ who: e.source === "user" ? "me" : "agent", text: messageText(e) }))
    .filter((m) => m.text);
  const last = messages.at(-1);
  const profileId = conversation.launched_agent_profile?.agent_profile_id;
  const profile = profiles.find((p) => p && (p.id === profileId || p.agent_profile_id === profileId));
  const persona = PERSONAS[hashOf(conversation.id) % PERSONAS.length];
  const tags = conversation.tags || {};
  const tagRole = tags.role || tags.agent_role;
  const dir = String(conversation.workspace?.working_dir || "").replace(/\/+$/, "");
  return {
    id: `live:${conversation.id}`,
    conversationId: conversation.id,
    live: true,
    name: profile?.name || persona.name,
    role: tagRole ? titleCase(tagRole) : profile?.role ? titleCase(profile.role) : persona.role,
    model: modelOf(conversation) || persona.model,
    title: conversation.title || `Conversation ${String(conversation.id).slice(0, 6)}`,
    blob: BLOBS[hashOf(conversation.id) % BLOBS.length].id,
    time: shortTime(conversation.updated_at || conversation.created_at),
    updatedAt: Date.parse(conversation.updated_at || conversation.created_at) || 0,
    createdAt: Date.parse(conversation.created_at) || 0,
    workspace: conversation.selected_repository || dir.split("/").filter(Boolean).at(-1) || "",
    parentId: conversation.parent_conversation_id ? `live:${conversation.parent_conversation_id}` : "",
    childIds: list(conversation.sub_conversation_ids).map((id) => `live:${id}`),
    tags: Object.entries(tags).map(([k, v]) => (v ? `${k}:${v}` : k)),
    automation: Object.keys(tags).some((k) => /automation/i.test(k)),
    unread: false,
    thread: messages.map((m) => [m.who, m.text]),
    preview: last?.text || "",
    activity,
    work: workOf(events, conversation, activity),
    cards: messages.filter((m) => m.who === "agent").flatMap((m) => extractBlocks(m.text)),
    routines: [],
  };
}

function hashOf(text) {
  let h = 0;
  for (let i = 0; i < String(text).length; i += 1) h = (h * 31 + String(text).charCodeAt(i)) >>> 0;
  return h;
}

export function shortTime(iso, now = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = 86_400_000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (d.getTime() >= startOfToday) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (d.getTime() >= startOfToday - day) return "Yesterday";
  if (d.getTime() >= startOfToday - 6 * day) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}


// ─── Arco blocks: the typed cards an agent can generate ───────────────────────

export const BLOCK_TYPES = ["weatherCard", "taskCard", "statCard", "calendarCard", "musicPlayerCard", "codeBlock", "terminalBlock", "textBlock", "formBlock"];
const FENCE = /```(?:json|openui-lang|blocks|arco)?\s*\n([\s\S]*?)```/g;

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
const text = (v) => (typeof v === "string" || typeof v === "number" ? String(v) : "");
const list = (v) => (Array.isArray(v) ? v : []);

/** Checks and repairs one block: unknown types and non-objects return null; fields are coerced. */
export function validateBlock(raw) {
  if (!isObject(raw) || !BLOCK_TYPES.includes(raw.type)) return null;
  const base = { type: raw.type, title: text(raw.title), badge: text(raw.badge) };
  switch (raw.type) {
    case "weatherCard":
      return { ...base, location: text(raw.location), temperature: text(raw.temperature), condition: text(raw.condition),
        forecast: list(raw.forecast).filter(isObject).slice(0, 7).map((f) => ({ day: text(f.day), high: text(f.high), low: text(f.low), condition: text(f.condition) })) };
    case "taskCard":
      return { ...base, tasks: list(raw.tasks).filter(isObject).slice(0, 30).map((t, i) => ({ id: text(t.id) || String(i), label: text(t.label || t.title), done: Boolean(t.done) })) };
    case "statCard":
      return { ...base, stats: list(raw.stats).filter(isObject).slice(0, 8).map((x) => ({ label: text(x.label), value: text(x.value), delta: text(x.delta) })) };
    case "calendarCard":
      return { ...base, events: list(raw.events).filter(isObject).slice(0, 20).map((e) => ({ time: text(e.time), title: text(e.title), note: text(e.note) })) };
    case "musicPlayerCard":
      return { ...base, track: text(raw.track || raw.title), artist: text(raw.artist), progress: Math.max(0, Math.min(100, Number(raw.progress) || 0)) };
    case "codeBlock":
      return { ...base, language: text(raw.language), filename: text(raw.filename), code: text(raw.code) };
    case "terminalBlock":
      return { ...base, lines: list(raw.lines).map(text).slice(0, 200) };
    case "textBlock":
      return { ...base, body: text(raw.body || raw.text) };
    case "formBlock":
      return { ...base, fields: list(raw.fields).filter(isObject).slice(0, 12).map((f, i) => ({ name: text(f.name) || `field${i}`, label: text(f.label || f.name), type: f.type === "textarea" ? "textarea" : "text" })), submitLabel: text(raw.submitLabel) || "Submit" };
    default:
      return null;
  }
}

/** Valid blocks found in fenced JSON in a message: a block, an array of blocks, or a surface { blocks }. */
export function extractBlocks(message) {
  const out = [];
  const source = String(message || "");
  for (const match of source.matchAll(FENCE)) {
    let data;
    try { data = JSON.parse(match[1]); } catch { continue; }
    const items = Array.isArray(data) ? data : isObject(data) && Array.isArray(data.blocks) ? data.blocks : [data];
    items.forEach((item) => { const block = validateBlock(item); if (block) out.push(block); });
  }
  return out;
}

// ─── What an agent did, from its events: the conversation drawer's own tabs ──

const obsText = (e) => {
  const o = e?.observation;
  if (!o) return "";
  if (typeof o.text === "string") return o.text;
  if (typeof o.output === "string") return o.output;
  if (Array.isArray(o.content)) return o.content.map((c) => (c && c.type === "text" ? c.text : "")).join("");
  if (typeof o.content === "string") return o.content;
  return "";
};

/** Terminal commands, files, browser pages, plan and task list found in an agent's events. */
export function activityOf(events = []) {
  const byAction = new Map();
  events.filter((e) => e.kind === "ObservationEvent" && e.action_id).forEach((e) => byAction.set(e.action_id, e));
  const out = { commands: [], files: [], pages: [], tasks: [], plan: "" };
  const files = new Map();
  events.filter((e) => e.kind === "ActionEvent").forEach((e) => {
    const tool = String(e.tool_name || "");
    const a = isObject(e.action) ? e.action : {};
    if (tool === "terminal" && a.command) {
      const obs = byAction.get(e.id);
      out.commands.push({ command: text(a.command), output: obsText(obs).slice(0, 2000), exit: obs?.observation?.exit_code ?? null });
    } else if (/editor/.test(tool) && a.path) {
      const f = files.get(a.path) || { path: a.path, ops: [], added: 0, removed: 0 };
      f.ops.push(text(a.command) || "edit");
      const lines = (v) => (typeof v === "string" && v ? v.split("\n").length : 0);
      if (a.command === "create") f.added += lines(a.file_text);
      else if (a.command === "str_replace") { f.removed += lines(a.old_str); f.added += lines(a.new_str); }
      else if (a.command === "insert") f.added += lines(a.new_str);
      files.set(a.path, f);
      if (/PLAN\.md$/i.test(a.path) && a.command === "create" && a.file_text) out.plan = text(a.file_text);
    } else if (tool.startsWith("browser")) {
      const url = text(a.url);
      out.pages.push({ url, action: text(a.command) || tool.replace(/^browser_?/, "") || "browse", note: obsText(byAction.get(e.id)).slice(0, 300) });
    } else if (tool === "task_tracker" && Array.isArray(a.task_list)) {
      out.tasks = a.task_list.filter(isObject).map((t) => ({ title: text(t.title), status: text(t.status) || "todo", notes: text(t.notes) }));
    }
  });
  out.files = [...files.values()];
  out.diff = { files: out.files.length, added: out.files.reduce((n, f) => n + f.added, 0), removed: out.files.reduce((n, f) => n + f.removed, 0) };
  return out;
}

export const emptyActivity = () => ({ commands: [], files: [], pages: [], tasks: [], plan: "", diff: { files: 0, added: 0, removed: 0 } });


// ─── The PR or ticket an agent is working on: source, number, state and diff ──

const SOURCES = {
  github: { label: "GitHub", color: "#e6edf3" },
  gitlab: { label: "GitLab", color: "#fc6d26" },
  jira: { label: "Jira", color: "#2684ff" },
  linear: { label: "Linear", color: "#7b83eb" },
  ticket: { label: "Ticket", color: "#9a9a9a" },
};
const KEY_STOPLIST = new Set(["UTF", "ISO", "SHA", "TLS", "RFC", "HTTP", "GPT", "AES", "RSA", "MD", "SQL", "IPV", "PDF", "CVE", "USB", "API", "CSS", "HTML", "ASCII", "BASE", "COVID"]);
const LINKS = [
  { source: "github", kind: "pr", re: /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/g, id: (m) => `#${m[2]}`, repo: (m) => m[1] },
  { source: "gitlab", kind: "pr", re: /https:\/\/gitlab\.[\w.-]+\/(.+?)\/-\/merge_requests\/(\d+)/g, id: (m) => `!${m[2]}`, repo: (m) => m[1] },
  { source: "jira", kind: "ticket", re: /https:\/\/[\w.-]+\.atlassian\.net\/browse\/([A-Z][A-Z0-9]+-\d+)/g, id: (m) => m[1], repo: () => "" },
  { source: "linear", kind: "ticket", re: /https:\/\/linear\.app\/[\w-]+\/issue\/([A-Z][A-Z0-9]*-\d+)/g, id: (m) => m[1], repo: () => "" },
];

/** The state a pull request or ticket is in, from words near its mention. */
export function stateNear(textBlob, id, url = "") {
  const window = String(textBlob).split(/\n|(?<=[.!?])\s+/).filter((part) => part.includes(id) || (url && part.includes(url))).join(" ");
  if (/\bmerged\b/i.test(window)) return "merged";
  if (/\b(closed|abandoned|cancell?ed)\b/i.test(window)) return "closed";
  if (/\b(done|resolved|shipped)\b/i.test(window)) return "done";
  if (/\bdraft\b/i.test(window)) return "draft";
  if (/\b(in review|review requested)\b/i.test(window)) return "in review";
  if (/\b(in progress|started)\b/i.test(window)) return "in progress";
  return "";
}

/** PRs and tickets mentioned in a conversation's messages and tool output, plus its diff and run state. */
export function workOf(events = [], conversation = {}, activity = emptyActivity()) {
  const chunks = [conversation.title || ""];
  events.forEach((e) => {
    if (e.kind === "MessageEvent") chunks.push(messageText(e));
    else if (e.kind === "ObservationEvent") chunks.push(obsText(e));
    else if (e.kind === "ActionEvent" && isObject(e.action)) chunks.push(text(e.action.command), text(e.action.url));
  });
  const blob = chunks.join("\n");
  const items = [];
  const seen = new Set();
  LINKS.forEach((link) => {
    for (const m of blob.matchAll(link.re)) {
      const id = link.id(m);
      const key = `${link.source}:${link.repo(m)}:${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const state = stateNear(blob, id, m[0]) || (link.kind === "pr" ? "open" : "");
      items.push({ source: link.source, kind: link.kind, id, repo: link.repo(m), url: m[0], state });
    }
  });
  if (!items.length) {
    for (const m of blob.matchAll(/\b([A-Z]{2,6})-(\d{1,6})\b/g)) {
      if (KEY_STOPLIST.has(m[1]) || seen.has(m[0])) continue;
      seen.add(m[0]);
      items.push({ source: "ticket", kind: "ticket", id: m[0], repo: "", url: "", state: stateNear(blob, m[0]) });
    }
  }
  const raw = String(conversation.execution_status || "").toLowerCase();
  const run = /run|work/.test(raw) ? "running" : /confirm|wait|pause/.test(raw) ? "waiting" : /error|stuck|fail/.test(raw) ? "error" : /finish|idle|done|complete/.test(raw) ? "idle" : "";
  return { items: items.slice(0, 4), diff: activity.diff || { files: 0, added: 0, removed: 0 }, run };
}

export const STATE_TONE = { open: "ok", merged: "merged", closed: "bad", draft: "dim", done: "merged", "in review": "warn", "in progress": "ok", "": "dim" };

/** A small icon for where a PR or ticket lives. */
export function sourceIcon(source) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", `srcicon ${source}`);
  const path = (d, fill) => { const n = document.createElementNS(SVG_NS, "path"); n.setAttribute("d", d); n.setAttribute("fill", fill); svg.append(n); };
  const color = (SOURCES[source] || SOURCES.ticket).color;
  if (source === "github") path("M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z", color);
  else if (source === "gitlab") path("M8 15 1.2 9.9 2.6 5.5l1.7 4h7.4l1.7-4 1.4 4.4Z", color);
  else if (source === "jira") { path("M8 1 15 8 8 15 1 8Z", color); path("M8 5 11 8 8 11 5 8Z", "#171717"); }
  else if (source === "linear") { path("M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Z", color); path("M2.7 9.6 6.4 13.3 7.2 12.5 3.5 8.8ZM3 7.4 8.6 13 9.4 12.2 3.8 6.6ZM4.6 5.3 10.7 11.4 11.5 10.6 5.4 4.5Z", "#171717"); }
  else path("M2 2h6.5L14 7.5 8.5 13 3 7.5ZM5 4.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z", color);
  return svg;
}

/** The PR/ticket chips and diff for a row or header, or null when there is nothing to show. */
export function workLine(work, limit = 2) {
  if (!work || (!work.items.length && !work.diff.added && !work.diff.removed)) return null;
  const line = document.createElement("span");
  line.className = "work";
  work.items.slice(0, limit).forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "witem";
    chip.title = `${(SOURCES[item.source] || SOURCES.ticket).label} ${item.id}${item.repo ? ` · ${item.repo}` : ""}${item.state ? ` · ${item.state}` : ""}`;
    chip.append(sourceIcon(item.source));
    const num = document.createElement("span");
    num.className = "wnum";
    num.textContent = item.id;
    chip.append(num);
    if (item.state) {
      const st = document.createElement("span");
      st.className = `wstate ${STATE_TONE[item.state] || "dim"}`;
      st.textContent = item.state;
      chip.append(st);
    }
    line.append(chip);
  });
  if (work.items.length > limit) { const more = document.createElement("span"); more.className = "wmore"; more.textContent = `+${work.items.length - limit}`; line.append(more); }
  if (work.diff.added || work.diff.removed) {
    const d = document.createElement("span");
    d.className = "wdiff";
    d.title = `${work.diff.files} file${work.diff.files === 1 ? "" : "s"} changed`;
    const plus = document.createElement("b"); plus.className = "add"; plus.textContent = `+${work.diff.added}`;
    const minus = document.createElement("b"); minus.className = "del"; minus.textContent = `−${work.diff.removed}`;
    d.append(plus, minus);
    line.append(d);
  }
  return line;
}

const SAMPLE_CARDS = {
  chief: [
    { type: "statCard", title: "Brightside Health pilot", badge: "Account", stats: [{ label: "Stage", value: "Pilot prep" }, { label: "Open asks", value: "2", delta: "Slack, SSO" }, { label: "Updated", value: "Today" }] },
    { type: "taskCard", title: "Before the pilot", badge: "2 open", tasks: [{ id: "1", label: "Ship Slack integration", done: true }, { id: "2", label: "Ship SSO", done: true }, { id: "3", label: "Post update in #brightside-shared", done: true }, { id: "4", label: "Schedule pilot kickoff", done: false }] },
    { type: "calendarCard", title: "Today", events: [{ time: "9:00", title: "Product sync" }, { time: "11:30", title: "Brightside check-in", note: "Share updates first" }, { time: "4:00", title: "Weekly team update", note: "Paused" }] },
    { type: "formBlock", title: "Ask for a draft", fields: [{ name: "topic", label: "What should I write?" }], submitLabel: "Ask Chief of Staff" },
  ],
  inbox: [
    { type: "statCard", title: "Inbox", stats: [{ label: "Unread", value: "0" }, { label: "Replies ready", value: "2" }] },
    { type: "textBlock", title: "Reply drafts", body: "Two replies are ready for review: the vendor renewal and the design offsite." },
  ],
  sales: [{ type: "taskCard", title: "Outreach queue", badge: "Approval", tasks: [{ id: "a", label: "Acme: intro email", done: false }, { id: "b", label: "Globex: follow-up", done: false }] }],
  support: [{ type: "statCard", title: "Support today", stats: [{ label: "Resolved", value: "12" }, { label: "Escalated", value: "2", delta: "needs you" }] }],
  growth: [{ type: "codeBlock", title: "Variant B", language: "text", code: "Ship agents, not tickets.\nStart free with OpenHands." }],
};
const NO_DIFF = { files: 0, added: 0, removed: 0 };
const SAMPLE_WORK = {
  chief: { items: [{ source: "linear", kind: "ticket", id: "PLAT-482", repo: "", url: "", state: "in progress" }], diff: NO_DIFF, run: "running" },
  ea: { items: [], diff: NO_DIFF, run: "idle" },
  inbox: { items: [{ source: "jira", kind: "ticket", id: "OPS-317", repo: "", url: "", state: "done" }], diff: NO_DIFF, run: "idle" },
  sales: { items: [{ source: "linear", kind: "ticket", id: "SAL-142", repo: "", url: "", state: "in review" }], diff: NO_DIFF, run: "waiting" },
  talent: { items: [{ source: "jira", kind: "ticket", id: "HR-88", repo: "", url: "", state: "in progress" }], diff: NO_DIFF, run: "running" },
  growth: { items: [{ source: "github", kind: "pr", id: "#88", repo: "acme/site", url: "", state: "open" }], diff: { files: 4, added: 126, removed: 31 }, run: "running" },
  support: { items: [{ source: "github", kind: "pr", id: "#4521", repo: "acme/app", url: "", state: "merged" }], diff: { files: 6, added: 212, removed: 47 }, run: "idle" },
  expense: { items: [{ source: "gitlab", kind: "pr", id: "!19", repo: "acme/finance", url: "", state: "draft" }], diff: { files: 2, added: 18, removed: 4 }, run: "waiting" },
  invoice: { items: [{ source: "github", kind: "pr", id: "#903", repo: "acme/billing", url: "", state: "closed" }], diff: { files: 1, added: 3, removed: 9 }, run: "idle" },
};
const SAMPLE_ACTIVITY = {
  commands: [{ command: "git status --short", output: " M docs/launch.md\n?? notes/brightside.md", exit: 0 }, { command: "npm test", output: "Tests  42 passed", exit: 0 }],
  files: [{ path: "docs/launch.md", ops: ["str_replace"] }, { path: "notes/brightside.md", ops: ["create"] }],
  pages: [{ url: "https://docs.openhands.dev", action: "navigate", note: "Canvas extensions reference" }],
  tasks: [{ title: "Draft the update", status: "done", notes: "" }, { title: "Post to Slack", status: "in_progress", notes: "" }, { title: "Log it in CRM", status: "todo", notes: "" }],
  plan: "# Plan\n\n1. Draft the product update\n2. Post to #brightside-shared\n3. Log it in the CRM",
};

export const VIEWS = [["chat", "Chat"], ["preview", "Preview"], ["computer", "Computer"], ["studio", "Studio"]];

const SAMPLE_APP = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;font:14px system-ui;color:#eee;background:radial-gradient(circle at 80% 0,#3b2a6e,#14101f 60%);min-height:100vh}
main{max-width:640px;margin:0 auto;padding:28px 24px}h1{font-size:34px;margin:0}small{color:#a9a3c4}
.next{margin:20px 0;padding:18px;border:1px solid #ffffff22;border-radius:14px;background:#ffffff0d}
.next b{display:block;font-size:22px;margin:6px 0 14px}.bar{height:4px;border-radius:4px;background:#ffffff22}.bar i{display:block;width:33%;height:100%;background:#a78bfa;border-radius:4px}
h2{margin:26px 0 8px}.step{display:flex;gap:12px;padding:14px 0;border-top:1px solid #ffffff14}.step span{width:16px;height:16px;border:2px solid #ffffff55;border-radius:4px;flex:none;margin-top:3px}.step small{display:block}
</style><main><h1>iOS beta</h1><small>Version 1.8.0 · TestFlight</small>
<div class="next"><small>Up next</small><b>Upload build to TestFlight</b><div class="bar"><i></i></div><small>2 of 6 steps complete</small></div>
<h2>Release checklist</h2>
<div class="step"><span></span><div>Upload build to TestFlight<small>Upload the signed build to App Store Connect.</small></div></div>
<div class="step"><span></span><div>Add beta testing notes<small>Highlight the new checklist and ask testers to try shared links.</small></div></div>
<div class="step"><span></span><div>Invite external testers<small>Send the TestFlight link to the private group.</small></div></div></main>`;

export const DRAWER_TABS = [["cards", "Cards"], ["screen", "Screen"], ["files", "Files"], ["terminal", "Terminal"], ["browser", "Browser"], ["webview", "Webview"], ["vscode", "VS Code"], ["planner", "Planner"], ["tasks", "Tasks"]];

export const SLASH_COMMANDS = [
  { name: "/card", hint: "Ask for a card", text: "Show your answer as a card. Reply with one fenced json block like {\"type\":\"statCard\",\"title\":\"...\",\"stats\":[{\"label\":\"...\",\"value\":\"...\"}]}. Block types: " + BLOCK_TYPES.join(", ") + "." },
  { name: "/status", hint: "Ask for a status update", text: "Give me a short status update on what you are working on." },
  { name: "/plan", hint: "Ask for a plan", text: "Write out your plan as a short checklist before you continue." },
  { name: "/file", hint: "Attach a file", text: "" },
];

export const MODEL_CHOICES = ["Haiku", "Sonnet", "Opus", "Fable"];


/** Sample agents with recent-first timestamps so sorting and age filters work on them too. */
export function sampleAgents(now = Date.now()) {
  return SAMPLE_AGENTS.map((a, i) => ({
    ...a,
    parentId: a.parentId || "",
    childIds: SAMPLE_AGENTS.filter((c) => c.parentId === a.id).map((c) => c.id),
    workspace: "Sample agents",
    tags: i % 3 === 0 ? ["team:ops"] : [],
    automation: a.id === "invoice" || a.id === "expense",
    updatedAt: now - 365 * 86_400_000 - i * 5 * 3_600_000,
    createdAt: now - 400 * 86_400_000 - i * 86_400_000,
    cards: SAMPLE_CARDS[a.id] || [],
    activity: SAMPLE_ACTIVITY,
    work: SAMPLE_WORK[a.id] || { items: [], diff: { files: 0, added: 0, removed: 0 }, run: "idle" },
  }));
}

export const DEFAULT_PREFS = { organize: "workspace", sort: "updated", older: "all", subagents: "nested", automations: "all", source: "all", tags: [] };
const OLDER_MS = { "1h": 3_600_000, "1d": 86_400_000, "7d": 7 * 86_400_000, "30d": 30 * 86_400_000 };

/**
 * The list the way the left nav lays out conversations: filter (search, source, age,
 * automations, tags, subagents), sort, nest subagents under their parent, then group by workspace.
 */
export function organizeAgents(agents, prefs = DEFAULT_PREFS, query = "", collapsed = {}, now = Date.now()) {
  const q = query.trim().toLowerCase();
  const ids = new Set(agents.map((a) => a.id));
  let rows = agents.filter((a) => {
    if (q && ![a.name, a.title, a.role, a.model, a.workspace].some((v) => String(v || "").toLowerCase().includes(q))) return false;
    if (prefs.source === "live" && !a.live) return false;
    if (prefs.source === "sample" && a.live) return false;
    if (prefs.older !== "all" && a.live && now - a.updatedAt > OLDER_MS[prefs.older]) return false;
    if (prefs.automations === "hide" && a.automation) return false;
    if (prefs.automations === "only" && !a.automation) return false;
    if (prefs.tags.length && !prefs.tags.every((t) => (a.tags || []).includes(t))) return false;
    if (prefs.subagents === "hide" && a.parentId && ids.has(a.parentId)) return false;
    return true;
  });
  const key = { updated: (a) => -a.updatedAt, created: (a) => -a.createdAt, name: (a) => a.name.toLowerCase() }[prefs.sort] || ((a) => -a.updatedAt);
  rows = [...rows].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
  const present = new Set(rows.map((a) => a.id));
  const nest = prefs.subagents === "nested";
  const children = new Map();
  rows.forEach((a) => { if (nest && a.parentId && present.has(a.parentId)) children.set(a.parentId, [...(children.get(a.parentId) || []), a]); });
  const roots = rows.filter((a) => !(nest && a.parentId && present.has(a.parentId)));
  const flatten = (a, depth, out) => {
    const kids = children.get(a.id) || [];
    out.push({ agent: a, depth, hasChildren: kids.length > 0, collapsed: Boolean(collapsed[a.id]) });
    if (!collapsed[a.id]) kids.forEach((k) => flatten(k, depth + 1, out));
    return out;
  };
  const groups = new Map();
  roots.forEach((a) => {
    const label = prefs.organize === "workspace" ? a.workspace || "No workspace" : "";
    if (!groups.has(label)) groups.set(label, []);
    flatten(a, 0, groups.get(label));
  });
  return [...groups.entries()].map(([label, items]) => ({ key: label || "all", label, rows: items }));
}

/** Tag facets present across agents, for the filter menu. */
export const tagFacets = (agents) => [...new Set(agents.flatMap((a) => a.tags || []))].sort();

const CSS = `
.hg { --hg-bg: var(--oh-color-base, #171717); --hg-panel: var(--oh-color-base-secondary, #212121); --hg-raised: var(--oh-surface-raised, #2a2a2a);
  --hg-text: var(--oh-foreground, #eee); --hg-contrast: var(--oh-contrast, #fff); --hg-muted: var(--oh-muted, #9a9a9a);
  --hg-border: var(--oh-border-subtle, #3a3a3a); --hg-primary: var(--oh-color-primary, #fff); --hg-on-primary: var(--oh-accent-foreground, #111);
  --hg-success: var(--oh-success, #34d399);
  box-sizing: border-box; position: sticky; top: 0; color: var(--hg-text); background: var(--hg-bg); font: 14px/1.45 system-ui, sans-serif;
  height: 100dvh; max-height: 100dvh; min-height: 480px; overflow: hidden; overscroll-behavior: contain; }
.hg *, .hg *::before, .hg *::after { box-sizing: border-box; }
.hg button { font: inherit; color: inherit; }
.hg .shell { display: grid; grid-template-columns: 320px minmax(0, 1fr) 360px; height: 100%; min-height: 0; }
.hg .shell.nodrawer { grid-template-columns: 320px minmax(0, 1fr); }
.hg .shell.view-studio { grid-template-columns: minmax(0, 1fr); }
.hg .studio { display: grid; grid-template-columns: minmax(0, 1fr) 340px; height: 100%; min-height: 0; background: var(--hg-bg); }
.hg .sstage { align-items: center; padding: 12px 20px 16px; gap: 18px; }
.hg .stop { align-self: stretch; display: flex; align-items: center; gap: 10px; }
.hg .stitle { font-weight: 600; color: var(--hg-contrast); }
.hg .spick { background: var(--hg-panel); color: var(--hg-text); border: 1px solid var(--hg-border); border-radius: 8px; padding: 4px 8px; font: inherit; max-width: 260px; }
.hg .stop .viewswitch { margin-left: auto; }
.hg .sbig { flex: 1; min-height: 0; width: 100%; display: grid; place-items: center; }
.hg .sbig svg { width: min(52vh, 340px); height: min(52vh, 340px); filter: drop-shadow(0 18px 24px rgba(0,0,0,.35)); }
.hg .sactions { display: flex; gap: 8px; }
.hg .sexport { border: 0; border-radius: 10px; background: var(--hg-contrast); color: var(--hg-bg); padding: 8px 16px; font-weight: 600; cursor: pointer; }
.hg .sreset { border: 1px solid var(--hg-border); border-radius: 10px; background: transparent; padding: 8px 14px; cursor: pointer; }
.hg .powered { display: flex; align-items: center; gap: 6px; color: var(--hg-muted); font-size: 12px; }
.hg .powered b { color: var(--hg-text); font-weight: 600; }
.hg .poweredmark { width: 18px; height: 18px; display: inline-block; }
.hg .poweredmark svg { width: 100%; height: 100%; }
.hg .kosmos { letter-spacing: .06em; }
.hg .spanel { border-left: 1px solid var(--hg-border); padding: 16px; overflow: auto; background: var(--hg-bg); }
.hg .spanel h4 { margin: 14px 0 8px; font-size: 12px; font-weight: 600; color: var(--hg-text); }
.hg .ssub { margin: 10px 0 4px; font-size: 11px; color: var(--hg-muted); text-transform: uppercase; letter-spacing: .06em; }
.hg .spanel h4:first-child { margin-top: 0; }
.hg .sgrid { display: grid; gap: 6px; }
.hg .sgrid.c4 { grid-template-columns: repeat(4, 1fr); }
.hg .sopt { border: 1px solid transparent; background: transparent; border-radius: 10px; padding: 6px 2px; cursor: pointer; }
.hg .sopt:hover { background: var(--hg-panel); }
.hg .sopt[aria-pressed="true"] { border-color: var(--hg-text); background: var(--hg-panel); }
.hg .scell { display: grid; justify-items: center; gap: 4px; font-size: 10.5px; color: var(--hg-muted); }
.hg .smini { width: 34px; height: 34px; display: block; }
.hg .smini svg { width: 100%; height: 100%; }
.hg .sswitch { display: flex; align-items: center; justify-content: space-between; padding: 5px 2px; cursor: pointer; font-size: 13px; }
.hg .sswitch input { appearance: none; width: 34px; height: 20px; border-radius: 999px; background: var(--hg-border); position: relative; cursor: pointer; transition: background .15s; }
.hg .sswitch input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--hg-bg); transition: transform .15s; }
.hg .sswitch input:checked { background: var(--hg-primary); }
.hg .sswitch input:checked::after { transform: translateX(14px); }
.hg .sslider { display: grid; grid-template-columns: 96px 1fr; align-items: center; gap: 8px; padding: 4px 2px; font-size: 13px; }
.hg .sslider input { width: 100%; accent-color: var(--hg-primary); }
.hg .spanel .seg { margin-bottom: 2px; }
.hg .sswatches { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
.hg .swatch { width: 100%; aspect-ratio: 1; border-radius: 50%; border: 2px solid var(--hg-bg); outline: 1px solid var(--hg-border); cursor: pointer; }
.hg .swatch[aria-pressed="true"] { outline: 2px solid var(--hg-text); }
.hg .shell.view-preview { grid-template-columns: minmax(340px, 5fr) minmax(0, 6fr); }
.hg .shell.view-computer { grid-template-columns: minmax(340px, 4fr) minmax(0, 8fr); }
.hg .viewswitch { display: inline-flex; gap: 2px; padding: 2px; border: 1px solid var(--hg-border); border-radius: 10px; background: var(--hg-panel); margin-left: 8px; font-weight: 400; }
.hg .headwork + .viewswitch { margin-left: 8px; }
.hg .chathead > .viewswitch:last-child { margin-left: auto; }
.hg .vbtn { border: 0; background: transparent; border-radius: 8px; padding: 3px 10px; cursor: pointer; font-size: 12px; color: var(--hg-muted); }
.hg .vbtn[aria-pressed="true"] { background: var(--hg-raised); color: var(--hg-contrast); }
.hg .namebox { white-space: nowrap; display: flex; align-items: baseline; gap: 8px; }
.hg .presence { font-size: 12px; font-weight: 400; color: var(--hg-muted); }
.hg .presence.running { color: var(--hg-success); }
.hg .presence.waiting { color: #e5b567; }
.hg .presence.error { color: #f87171; }
.hg .previewcol { border-left: 1px solid var(--hg-border); }
.hg .urlbar { flex: none; display: flex; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--arco-border); background: var(--arco-bg-surface-solid); }
.hg .navbtn { flex: none; width: 30px; height: 30px; border: 0; border-radius: 8px; background: transparent; color: var(--arco-text-secondary); cursor: pointer; }
.hg .navbtn:hover:not(:disabled) { background: var(--arco-bg-hover); color: var(--arco-text-primary); }
.hg .navbtn:disabled { opacity: .35; cursor: default; }
.hg .urlinput { flex: 1; min-width: 0; border: 1px solid var(--arco-border-strong); border-radius: 999px; background: var(--arco-bg-sunk); color: var(--arco-text-primary); padding: 0 14px; font: inherit; text-align: center; }
.hg .pstage { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; align-items: center; justify-content: center; background: var(--arco-bg-sunk); padding: 0; }
.hg .pframe { width: 100%; height: 100%; border: 0; background: #fff; }
.hg .computercol { padding: 16px 20px 12px; gap: 12px; align-items: center; justify-content: center; background: var(--hg-bg); }
.hg .cframe { width: 100%; max-width: 960px; flex: 1; min-height: 0; border-radius: 28px; padding: 22px; background: var(--tint, #f7c948); display: flex; flex-direction: column; gap: 12px; }
.hg .cdesk { flex: 1; min-height: 0; position: relative; border-radius: 14px; background: #fbf6f1; color: #5a4036; display: flex; flex-direction: column; align-items: center; padding: 70px 20px 16px; overflow: hidden; }
.hg .cbubble { position: absolute; top: 18px; left: 50%; transform: translateX(-60%); width: 230px; background: #fff; border-radius: 12px; padding: 8px 12px; font-size: 12px; box-shadow: 0 4px 14px rgba(0,0,0,.12); }
.hg .cface { width: 74px; height: 74px; margin-top: 56px; }
.hg .cface svg { width: 100%; height: 100%; }
.hg .cclock { font-size: 56px; font-weight: 300; letter-spacing: -.02em; }
.hg .chello { margin-bottom: 16px; font-size: 18px; }
.hg .capps { display: grid; grid-template-columns: repeat(5, 72px); gap: 10px 14px; justify-content: center; overflow: hidden; }
.hg .capp { display: grid; justify-items: center; gap: 4px; font-size: 11px; }
.hg .capic { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; color: #fff; font-weight: 700; }
.hg .cdock { align-self: center; padding: 8px 18px; border-radius: 16px; background: rgba(255,255,255,.7); color: #333; font: 12px ui-monospace, Menlo, monospace; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hg .ccontrol { display: flex; align-items: center; gap: 10px; padding: 6px 8px 6px 14px; border-radius: 999px; background: var(--hg-panel); border: 1px solid var(--hg-border); }
.hg .takeover { border: 0; border-radius: 999px; background: var(--hg-contrast); color: var(--hg-bg); padding: 5px 12px; cursor: pointer; font-weight: 600; }
.hg .cnote { max-width: 560px; text-align: center; color: var(--hg-muted); }
.hg .col {  display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.hg .list { border-right: 1px solid var(--hg-border); }
.hg .listtop { flex: none; padding: 12px 10px 8px; background: var(--hg-bg); border-bottom: 1px solid var(--hg-border); position: relative; z-index: 3; }
.hg .searchrow { display: flex; gap: 6px; }
.hg .search { flex: 1; min-width: 0; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--hg-border); background: var(--hg-panel); color: var(--hg-text); font: inherit; }
.hg .iconbtn { flex: none; display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--hg-border); background: var(--hg-panel); border-radius: 10px; padding: 0 10px; cursor: pointer; }
.hg .iconbtn[aria-expanded="true"] { background: var(--hg-raised); }
.hg .chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.hg .chip { border: 1px solid var(--hg-border); background: var(--hg-panel); border-radius: 999px; padding: 1px 8px; font-size: 12px; cursor: pointer; }
.hg .chip::after { content: " ×"; color: var(--hg-muted); }
.hg .menu { position: absolute; left: 10px; right: 10px; top: calc(100% - 4px); max-height: 70vh; overflow: auto; background: var(--hg-panel); border: 1px solid var(--hg-border); border-radius: 12px; padding: 10px; box-shadow: 0 12px 32px rgba(0,0,0,.45); }
.hg .menu h4 { margin: 8px 0 4px; font-size: 11px; font-weight: 600; color: var(--hg-muted); text-transform: uppercase; letter-spacing: .06em; }
.hg .menu h4:first-child { margin-top: 0; }
.hg .seg { display: flex; flex-wrap: wrap; gap: 4px; }
.hg .seg button { border: 1px solid var(--hg-border); background: transparent; border-radius: 8px; padding: 3px 9px; cursor: pointer; font-size: 13px; }
.hg .seg button[aria-pressed="true"] { background: var(--hg-primary); color: var(--hg-on-primary); border-color: var(--hg-primary); }
.hg .rows { flex: 1; min-height: 0; overflow: auto; padding: 6px 8px 12px; display: flex; flex-direction: column; gap: 2px; }
.hg .group { margin: 10px 4px 2px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--hg-muted); display: flex; justify-content: space-between; }
.hg .row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 8px; border: 0; border-radius: 12px; background: transparent; text-align: left; cursor: pointer; }
.hg .row:hover { background: var(--hg-panel); }
.hg .row[aria-current="true"] { background: var(--hg-raised); }
.hg .twist { flex: none; width: 18px; height: 18px; border: 0; background: transparent; color: var(--hg-muted); cursor: pointer; padding: 0; }
.hg .avatar { flex: none; width: 40px; height: 40px; }
.hg .avatar svg { width: 100%; height: 100%; display: block; }
.hg .avatar.sm { width: 28px; height: 28px; }
.hg .rowtext { min-width: 0; flex: 1; }
.hg .rowtop { display: flex; justify-content: space-between; gap: 8px; }
.hg .rowright { display: flex; align-items: center; gap: 6px; flex: none; }
.hg .name { font-weight: 600; color: var(--hg-contrast); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hg .time { color: var(--hg-muted); font-size: 12px; flex: none; }
.hg .meta { display: flex; gap: 6px; font-size: 12px; color: var(--hg-muted); white-space: nowrap; overflow: hidden; }
.hg .role { color: var(--hg-text); }
.hg .model { overflow: hidden; text-overflow: ellipsis; }
.hg .preview { display: block; color: var(--hg-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hg .work { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; margin: 2px 0; font-size: 12px; }
.hg .headwork { margin-left: auto; font-weight: 400; justify-content: flex-end; }
.hg .witem { display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
.hg .srcicon { flex: none; width: 13px; height: 13px; }
.hg .wnum { font-family: ui-monospace, Menlo, monospace; color: var(--hg-text); }
.hg .wstate { border-radius: 999px; padding: 0 6px; font-size: 11px; border: 1px solid var(--hg-border); }
.hg .wstate.ok { color: var(--hg-success); border-color: color-mix(in srgb, var(--hg-success) 45%, transparent); }
.hg .wstate.merged { color: #a371f7; border-color: color-mix(in srgb, #a371f7 45%, transparent); }
.hg .wstate.bad { color: #f87171; border-color: color-mix(in srgb, #f87171 45%, transparent); }
.hg .wstate.warn { color: #e5b567; border-color: color-mix(in srgb, #e5b567 45%, transparent); }
.hg .wstate.dim { color: var(--hg-muted); }
.hg .wmore { color: var(--hg-muted); }
.hg .wdiff { display: inline-flex; gap: 5px; font-family: ui-monospace, Menlo, monospace; }
.hg .wdiff .add { color: var(--hg-success); font-weight: 500; }
.hg .wdiff .del { color: #f87171; font-weight: 500; }
.hg .dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; flex: none; }
.hg .dot.live { background: var(--hg-success); }
.hg .note { color: var(--hg-muted); font-size: 12px; padding: 4px 8px; }
.hg .chat { background: var(--hg-bg); }
.hg .chathead { flex: none; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding: 12px 16px; border-bottom: 1px solid var(--hg-border); font-weight: 600; color: var(--hg-contrast); background: var(--hg-bg); position: relative; z-index: 2; }
.hg .headmeta { display: block; font-size: 12px; font-weight: 400; color: var(--hg-muted); }
.hg .msgs { flex: 1; min-height: 0; overflow: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 8px; }
.hg .bubble { max-width: 78%; padding: 10px 16px; border-radius: 18px; white-space: pre-wrap; overflow-wrap: anywhere; }
.hg .bubble.agent { align-self: flex-start; background: var(--hg-raised); }
.hg .bubble.me { align-self: flex-end; background: var(--hg-primary); color: var(--hg-on-primary); }
.hg .file { align-self: flex-start; display: flex; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid var(--hg-border); border-radius: 14px; background: var(--hg-panel); }
.hg .fileicon { width: 36px; height: 40px; border-radius: 6px; background: color-mix(in srgb, #ef4444 18%, transparent); color: #ef4444; font-size: 10px; font-weight: 700; display: grid; place-items: center; }
.hg .rtitle { color: var(--hg-contrast); }
.hg .rsub { color: var(--hg-muted); }
.hg .empty { margin: auto; color: var(--hg-muted); }
/* composer: the factory composer, pinned under the chat */
.hg .composerwrap { flex: none; padding: 8px 16px 14px; background: var(--hg-bg); position: relative; z-index: 2; }
.hg .composerbox { position: relative; border: 1px solid var(--hg-border); border-radius: 18px; background: var(--hg-panel); padding: 0 10px 8px; }
.hg .composerbox:focus-within { border-color: var(--hg-muted); }
.hg .grip { height: 14px; display: grid; place-items: center; cursor: ns-resize; touch-action: none; }
.hg .grip::after { content: ""; width: 36px; height: 4px; border-radius: 4px; background: var(--hg-border); }
.hg .attached { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 4px 0; }
.hg .attached .chip::after { content: " ×"; }
.hg textarea.field { width: 100%; resize: none; border: 0; outline: 0; background: transparent; color: var(--hg-text); font: inherit; padding: 6px 6px; min-height: 44px; max-height: 320px; }
.hg .toolbar { display: flex; align-items: center; gap: 6px; }
.hg .tool { display: inline-flex; align-items: center; gap: 6px; max-width: 220px; border: 0; border-radius: 12px; background: var(--hg-bg); padding: 6px 10px; font-size: 12px; cursor: pointer; white-space: nowrap; }
.hg .tool:hover { background: var(--hg-raised); }
.hg .tool.round { width: 32px; height: 32px; padding: 0; justify-content: center; border-radius: 50%; font-size: 16px; }
.hg .tool.on { background: var(--hg-primary); color: var(--hg-on-primary); }
.hg .tool span.t { overflow: hidden; text-overflow: ellipsis; }
.hg .spacer { flex: 1; }
.hg .send { border: 0; border-radius: 50%; width: 34px; height: 34px; background: var(--hg-primary); color: var(--hg-on-primary); cursor: pointer; font-weight: 700; }
.hg .send:disabled { opacity: .4; cursor: default; }
.hg .pop { position: absolute; bottom: calc(100% + 6px); left: 0; z-index: 5; min-width: 240px; max-width: 360px; max-height: 280px; overflow: auto; background: var(--hg-panel); border: 1px solid var(--hg-border); border-radius: 12px; padding: 6px; box-shadow: 0 12px 32px rgba(0,0,0,.45); }
.hg .pop h4 { margin: 6px 6px 2px; font-size: 11px; color: var(--hg-muted); text-transform: uppercase; letter-spacing: .06em; }
.hg .popitem { display: flex; width: 100%; gap: 8px; align-items: center; border: 0; background: transparent; padding: 7px 8px; border-radius: 8px; cursor: pointer; text-align: left; }
.hg .popitem:hover, .hg .popitem[aria-selected="true"] { background: var(--hg-raised); }
.hg .popitem small { color: var(--hg-muted); margin-left: auto; }
/* drawer: Arco UI tokens and cards */
.hg .drawer { --arco-font-mono: "SF Mono", ui-monospace, Menlo, Consolas, monospace; --arco-text-xs: 11px; --arco-text-sm: 12.5px; --arco-text-md: 14px;
  --arco-space-s: 8px; --arco-space-m: 12px; --arco-space-l: 16px; --arco-radius-s: 6px; --arco-radius-m: 10px; --arco-radius-l: 14px;
  --arco-bg-surface-solid: #1a1a1c; --arco-bg-sunk: #0e0e10; --arco-bg-elevated: #28282c; --arco-bg-hover: rgba(255,255,255,.06);
  --arco-text-primary: #ececee; --arco-text-secondary: #a8a8ae; --arco-text-tertiary: #717178; --arco-text-inverted: #121214;
  --arco-accent: #7c9dff; --arco-accent-soft: rgba(124,157,255,.16); --arco-success: #58c98b; --arco-warning: #e5b567; --arco-danger: #e5737d;
  --arco-border: rgba(255,255,255,.09); --arco-border-strong: rgba(255,255,255,.16);
  border-left: 1px solid var(--hg-border); background: var(--arco-bg-surface-solid); color: var(--arco-text-primary); }
.hg .tabs { flex: none; display: flex; gap: 2px; padding: 8px 8px 0; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid var(--arco-border); background: var(--arco-bg-surface-solid); position: relative; z-index: 2; }
.hg .tabs::-webkit-scrollbar { display: none; }
.hg .tab { flex: none; border: 0; background: transparent; color: var(--arco-text-secondary); padding: 8px 10px; border-bottom: 2px solid transparent; cursor: pointer; font-size: var(--arco-text-sm); }
.hg .tab[aria-selected="true"] { color: var(--arco-text-primary); border-bottom-color: var(--arco-accent); }
.hg .pane { flex: 1; min-height: 0; overflow: auto; padding: var(--arco-space-l); display: flex; flex-direction: column; gap: var(--arco-space-m); }
.hg .acard { background: var(--arco-bg-elevated); border: 1px solid var(--arco-border); border-radius: var(--arco-radius-l); overflow: hidden; }
.hg .achead { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--arco-border); }
.hg .aicon { flex: none; width: 22px; height: 22px; border-radius: 6px; background: var(--arco-accent-soft); color: var(--arco-accent); display: grid; place-items: center; font-size: 11px; font-weight: 700; }
.hg .atitle { font-weight: 600; font-size: var(--arco-text-md); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hg .abadge { margin-left: auto; font: 11px/1 var(--arco-font-mono); text-transform: uppercase; letter-spacing: .08em; color: var(--arco-accent); white-space: nowrap; }
.hg .abody { padding: 12px; display: grid; gap: 8px; }
.hg .afoot { display: flex; gap: 8px; padding: 8px 12px 12px; }
.hg .abtn { border: 1px solid var(--arco-border-strong); background: transparent; color: var(--arco-text-primary); border-radius: 999px; padding: 5px 12px; cursor: pointer; font-size: var(--arco-text-sm); }
.hg .abtn.primary { background: var(--arco-accent); border-color: var(--arco-accent); color: var(--arco-text-inverted); }
.hg .astats { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 10px; }
.hg .aval { font-size: 20px; font-weight: 600; }
.hg .alabel { font-size: var(--arco-text-xs); color: var(--arco-text-secondary); }
.hg .adelta { font-size: var(--arco-text-xs); color: var(--arco-warning); }
.hg .atask { display: flex; gap: 8px; align-items: flex-start; cursor: pointer; }
.hg .atask.done span { color: var(--arco-text-tertiary); text-decoration: line-through; }
.hg .aevent { display: grid; grid-template-columns: 52px 1fr; gap: 8px; }
.hg .aevent time { font: 12px var(--arco-font-mono); color: var(--arco-accent); }
.hg pre.acode { margin: 0; padding: 10px; border-radius: var(--arco-radius-m); background: var(--arco-bg-sunk); font: 12px/1.5 var(--arco-font-mono); overflow: auto; white-space: pre; }
.hg .aform label { display: grid; gap: 4px; font-size: var(--arco-text-sm); color: var(--arco-text-secondary); }
.hg .aform input, .hg .aform textarea { border: 1px solid var(--arco-border-strong); background: var(--arco-bg-sunk); color: var(--arco-text-primary); border-radius: var(--arco-radius-s); padding: 7px 9px; font: inherit; }
.hg .abar { height: 4px; border-radius: 4px; background: var(--arco-bg-sunk); overflow: hidden; }
.hg .abar i { display: block; height: 100%; background: var(--arco-accent); }
.hg .screen { border-radius: var(--arco-radius-l); overflow: hidden; border: 1px solid var(--arco-border); aspect-ratio: 16 / 10; }
.hg .screen svg { width: 100%; height: 100%; display: block; }
.hg .caption { text-align: center; color: var(--arco-text-secondary); font-size: var(--arco-text-sm); }
.hg .routine { display: flex; gap: 10px; }
.hg .ricon { flex: none; width: 16px; height: 16px; margin-top: 3px; border-radius: 50%; border: 2px solid var(--arco-success); }
.hg .ricon.off { border-color: var(--arco-text-tertiary); }
.hg .status { font: 11px/1 var(--arco-font-mono); text-transform: uppercase; color: var(--arco-text-secondary); border: 1px solid var(--arco-border-strong); border-radius: 999px; padding: 2px 7px; margin-left: auto; }
.hg .status.done { color: var(--arco-success); } .hg .status.in_progress { color: var(--arco-accent); }
.hg .lhint { color: var(--arco-text-secondary); font-size: var(--arco-text-sm); }
@media (max-width: 1100px) { .hg .shell, .hg .shell.nodrawer { grid-template-columns: 280px minmax(0, 1fr); } .hg .drawer:not(.previewcol) { display: none; } .hg .shell.view-preview, .hg .shell.view-computer { grid-template-columns: minmax(0, 1fr); } .hg .previewcol, .hg .computercol { display: none; } }
@media (max-width: 900px) { .hg .studio { grid-template-columns: minmax(0, 1fr); overflow: auto; } .hg .spanel { border-left: 0; border-top: 1px solid var(--hg-border); } }
@media (max-width: 640px) { .hg .shell { grid-template-columns: minmax(0, 1fr); } .hg .list { display: none; } }
`;

function el(tag, cls, content) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (content !== undefined) node.textContent = content;
  return node;
}

function avatar(blobId, small, look) {
  const wrap = el("span", `avatar${small ? " sm" : ""}`);
  wrap.append(look ? kamijiFace(look) : blobSvg(blobId));
  return wrap;
}

function screenArt(blobId) {
  const blob = BLOBS.find((b) => b.id === blobId) || BLOBS[0];
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 160 100");
  svg.setAttribute("aria-hidden", "true");
  const add = (tag, attrs) => {
    const n = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    svg.append(n);
  };
  add("rect", { x: 0, y: 0, width: 160, height: 100, fill: "#e9edf3" });
  add("rect", { x: 10, y: 8, width: 140, height: 84, rx: 4, fill: "#fff" });
  add("rect", { x: 10, y: 8, width: 140, height: 9, rx: 4, fill: "#d9dee7" });
  [[18, 24, 20, 28, "#2d9cf0"], [42, 24, 20, 16, "#2fbf71"], [66, 30, 20, 34, "#2d9cf0"], [90, 24, 20, 22, "#ef7c72"], [114, 28, 20, 40, "#2fbf71"]].forEach(([x, y, w, h, fill]) =>
    add("rect", { x, y, width: w, height: h, rx: 2, fill }));
  add("circle", { cx: 138, cy: 78, r: 8, fill: blob.fill, opacity: 0.9 });
  return svg;
}

const CARD_ICON = { weatherCard: "W", taskCard: "T", statCard: "#", calendarCard: "C", musicPlayerCard: "♪", codeBlock: "</>", terminalBlock: ">_", textBlock: "Aa", formBlock: "F" };

/** Draws one Arco block as a card: header (icon, title, badge), body, optional footer actions. */
export function renderBlock(block, ctx = {}) {
  const card = el("section", "acard");
  card.dataset.block = block.type;
  const head = el("div", "achead");
  head.append(el("span", "aicon", CARD_ICON[block.type] || "·"), el("span", "atitle", block.title || block.location || block.track || block.type));
  if (block.badge) head.append(el("span", "abadge", block.badge));
  const body = el("div", "abody");
  const foot = el("div", "afoot");
  switch (block.type) {
    case "statCard": {
      const grid = el("div", "astats");
      block.stats.forEach((x) => {
        const cell = el("div");
        cell.append(el("div", "aval", x.value), el("div", "alabel", x.label));
        if (x.delta) cell.append(el("div", "adelta", x.delta));
        grid.append(cell);
      });
      body.append(grid);
      break;
    }
    case "taskCard":
      block.tasks.forEach((t) => {
        const done = ctx.isDone ? ctx.isDone(t) : t.done;
        const row = el("label", `atask${done ? " done" : ""}`);
        const box = el("input");
        box.type = "checkbox";
        box.checked = done;
        box.addEventListener("change", () => ctx.onToggle?.(t, box.checked));
        row.append(box, el("span", "", t.label));
        body.append(row);
      });
      break;
    case "calendarCard":
      block.events.forEach((e) => {
        const row = el("div", "aevent");
        const what = el("div");
        what.append(el("div", "", e.title));
        if (e.note) what.append(el("div", "alabel", e.note));
        row.append(el("time", "", e.time), what);
        body.append(row);
      });
      break;
    case "weatherCard":
      body.append(el("div", "aval", `${block.temperature} ${block.condition}`.trim()));
      block.forecast.forEach((f) => body.append(el("div", "alabel", `${f.day}: ${f.high}/${f.low} ${f.condition}`)));
      break;
    case "musicPlayerCard": {
      body.append(el("div", "", block.track), el("div", "alabel", block.artist));
      const bar = el("div", "abar");
      const fill = el("i");
      fill.style.width = `${block.progress}%`;
      bar.append(fill);
      body.append(bar);
      break;
    }
    case "codeBlock": {
      body.append(el("pre", "acode", block.code));
      const copy = el("button", "abtn", "Copy");
      copy.type = "button";
      copy.addEventListener("click", () => navigator.clipboard?.writeText(block.code).catch(() => {}));
      foot.append(copy);
      break;
    }
    case "terminalBlock":
      body.append(el("pre", "acode", block.lines.join("\n")));
      break;
    case "textBlock":
      body.append(el("div", "", block.body));
      break;
    case "formBlock": {
      const form = el("form", "aform");
      form.style.display = "grid";
      form.style.gap = "8px";
      const inputs = block.fields.map((f) => {
        const label = el("label", "", f.label);
        const input = el(f.type === "textarea" ? "textarea" : "input");
        input.name = f.name;
        label.append(input);
        form.append(label);
        return input;
      });
      const submit = el("button", "abtn primary", block.submitLabel);
      submit.type = "submit";
      form.append(submit);
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const answers = inputs.map((i) => `${i.name}: ${i.value}`).join("\n");
        ctx.onSubmit?.(`${block.title || "Form"}\n${answers}`);
        form.reset();
      });
      body.append(form);
      break;
    }
    default:
      break;
  }
  card.append(head, body);
  if (foot.childNodes.length) card.append(foot);
  return card;
}

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("Hangout requires Canvas host API 1.");
  return host.registerPage("hangout", ({ container }) => mount(host, container));
}

function mount(host, container) {
  const style = el("style", "", CSS);
  const root = el("div", "hg");
  container.append(style, root);
  let disposed = false;

  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  })();
  const state = {
    selected: saved.selected || "chief",
    query: "",
    threads: saved.threads || {},
    prefs: { ...DEFAULT_PREFS, ...(saved.prefs || {}) },
    collapsed: saved.collapsed || {},
    tab: saved.tab || "cards",
    cardState: saved.cardState || {},
    models: saved.models || {},
    live: [],
    liveNote: "",
    draft: "",
    attachments: [],
    busy: false,
    menu: "",
    view: saved.view || "chat",
    looks: saved.looks || {},
    drawerOpen: saved.drawerOpen !== false,
    control: {},
    previews: {},
    gripHeight: 0,
    slashIndex: 0,
  };
  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ selected: state.selected, threads: state.threads, prefs: state.prefs, collapsed: state.collapsed, tab: state.tab, cardState: state.cardState, models: state.models, view: state.view, drawerOpen: state.drawerOpen, looks: state.looks }));
    } catch { /* storage unavailable */ }
  };

  const samples = sampleAgents();
  const agents = () => [...state.live, ...samples];
  const current = () => agents().find((a) => a.id === state.selected) || agents()[0];
  const threadOf = (agent) => (agent.live ? agent.thread : [...agent.thread, ...(state.threads[agent.id] || [])]);
  const avatarFor = (agent, small) => avatar(agent.blob, small, state.looks[agent.id]);
  const modelOfAgent = (agent) => state.models[agent.id] || agent.model || "No model";

  async function loadLive() {
    try {
      const page = await host.agentServer.request({ path: "/api/conversations/search?limit=40" });
      const items = Array.isArray(page?.items) ? page.items : [];
      const profileRes = await host.agentServer.request({ path: "/api/agent-profiles" }).catch(() => null);
      const profiles = Array.isArray(profileRes) ? profileRes : profileRes?.items || profileRes?.profiles || [];
      const loaded = await Promise.all(items.map(async (c) => {
        const res = await host.agentServer.request({ path: `/api/conversations/${c.id}/events/search?limit=100&sort_order=TIMESTAMP_DESC` }).catch(() => null);
        const events = Array.isArray(res?.items) ? [...res.items].reverse() : [];
        return liveAgent(c, events, profiles);
      }));
      state.live = loaded;
      state.liveNote = loaded.length ? "" : "No conversations on this Agent Server yet.";
    } catch {
      state.liveNote = "Agent Server not reachable: showing sample agents.";
    }
    if (!disposed) render();
  }

  async function send(override) {
    const agent = current();
    let message = (override ?? state.draft).trim();
    if (state.attachments.length && override === undefined) {
      message += state.attachments.map((f) => `\n\n[${f.name}]${f.text ? `\n\`\`\`\n${f.text}\n\`\`\`` : " (binary file not included)"}`).join("");
    }
    message = message.trim();
    if (!message || state.busy) return;
    if (override === undefined) { state.draft = ""; state.attachments = []; }
    if (agent.live) {
      state.busy = true;
      agent.thread.push(["me", message]);
      render();
      try {
        await host.agentServer.request({ path: `/api/conversations/${agent.conversationId}/events`, method: "POST", body: { role: "user", content: [{ type: "text", text: message }], run: true } });
      } catch {
        agent.thread.push(["agent", "That message could not be delivered to the Agent Server."]);
      }
      state.busy = false;
    } else {
      state.threads[agent.id] = [...(state.threads[agent.id] || []), ["me", message]];
      persist();
    }
    render();
    const box = root.querySelector(".msgs");
    if (box) box.scrollTop = box.scrollHeight;
  }

  const setPref = (key, value) => { state.prefs = { ...state.prefs, [key]: value }; persist(); render(); };

  // ── left: search, view menu, filter chips, grouped rows ──
  function viewMenu() {
    const menu = el("div", "menu");
    const section = (title, key, options) => {
      menu.append(el("h4", "", title));
      const seg = el("div", "seg");
      options.forEach(([value, label]) => {
        const b = el("button", "", label);
        b.type = "button";
        b.setAttribute("aria-pressed", String(state.prefs[key] === value));
        b.addEventListener("click", () => setPref(key, value));
        seg.append(b);
      });
      menu.append(seg);
    };
    section("Organize", "organize", [["workspace", "By workspace"], ["recent", "Recent activity"]]);
    section("Sort", "sort", [["updated", "Last updated"], ["created", "Created"], ["name", "Name"]]);
    section("Subagents", "subagents", [["nested", "Nested under parent"], ["flat", "Flat"], ["hide", "Hide"]]);
    section("Show", "source", [["all", "All"], ["live", "Conversations"], ["sample", "Samples"]]);
    section("Older than", "older", [["all", "Show all"], ["1h", "Hide after 1h"], ["1d", "1 day"], ["7d", "7 days"], ["30d", "30 days"]]);
    section("Automations", "automations", [["all", "All"], ["hide", "Hide"], ["only", "Only"]]);
    const facets = tagFacets(agents());
    if (facets.length) {
      menu.append(el("h4", "", "Tags"));
      const seg = el("div", "seg");
      facets.forEach((tag) => {
        const b = el("button", "", tag);
        b.type = "button";
        b.setAttribute("aria-pressed", String(state.prefs.tags.includes(tag)));
        b.addEventListener("click", () => setPref("tags", state.prefs.tags.includes(tag) ? state.prefs.tags.filter((t) => t !== tag) : [...state.prefs.tags, tag]));
        seg.append(b);
      });
      menu.append(seg);
    }
    const reset = el("button", "abtn", "Reset view");
    reset.type = "button";
    reset.style.marginTop = "10px";
    reset.addEventListener("click", () => { state.prefs = { ...DEFAULT_PREFS }; persist(); render(); });
    menu.append(reset);
    return menu;
  }

  function activeChips() {
    const chips = el("div", "chips");
    const add = (label, clear) => {
      const c = el("button", "chip", label);
      c.type = "button";
      c.title = "Clear this filter";
      c.addEventListener("click", clear);
      chips.append(c);
    };
    const p = state.prefs;
    if (p.source !== "all") add(p.source === "live" ? "Conversations" : "Samples", () => setPref("source", "all"));
    if (p.older !== "all") add(`Newer than ${p.older}`, () => setPref("older", "all"));
    if (p.automations !== "all") add(p.automations === "hide" ? "No automations" : "Automations only", () => setPref("automations", "all"));
    if (p.subagents === "hide") add("Subagents hidden", () => setPref("subagents", "nested"));
    p.tags.forEach((t) => add(t, () => setPref("tags", p.tags.filter((x) => x !== t))));
    return chips.childNodes.length ? chips : null;
  }

  function listCol() {
    const col = el("div", "col list");
    const top = el("div", "listtop");
    const row = el("div", "searchrow");
    const search = el("input", "search");
    search.type = "search";
    search.placeholder = "Search";
    search.setAttribute("aria-label", "Search agents");
    search.value = state.query;
    search.addEventListener("input", () => {
      state.query = search.value;
      render();
      const again = root.querySelector(".search");
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    });
    const view = el("button", "iconbtn", "View");
    view.type = "button";
    view.setAttribute("aria-haspopup", "menu");
    view.setAttribute("aria-expanded", String(state.menu === "view"));
    view.addEventListener("click", () => { state.menu = state.menu === "view" ? "" : "view"; render(); });
    row.append(search, view);
    top.append(row);
    const chips = activeChips();
    if (chips) top.append(chips);
    if (state.menu === "view") top.append(viewMenu());
    const rows = el("div", "rows");
    const groups = organizeAgents(agents(), state.prefs, state.query, state.collapsed);
    const total = groups.reduce((n, g) => n + g.rows.length, 0);
    groups.forEach((group) => {
      if (group.label) rows.append(el("div", "group", group.label));
      group.rows.forEach(({ agent, depth, hasChildren, collapsed }) => {
        const btn = el("button", "row");
        btn.type = "button";
        btn.style.paddingLeft = `${8 + depth * 22}px`;
        btn.setAttribute("aria-current", String(agent.id === current().id));
        if (hasChildren) {
          const tw = el("span", "twist", collapsed ? "▸" : "▾");
          tw.setAttribute("role", "button");
          tw.setAttribute("aria-label", collapsed ? "Expand subagents" : "Collapse subagents");
          tw.addEventListener("click", (ev) => { ev.stopPropagation(); state.collapsed = { ...state.collapsed, [agent.id]: !collapsed }; persist(); render(); });
          btn.append(tw);
        }
        const text = el("span", "rowtext");
        const topLine = el("span", "rowtop");
        const right = el("span", "rowright");
        if (agent.live) { const live = el("span", "dot live"); live.title = "Live conversation"; right.append(live); }
        if (agent.unread) right.append(el("span", "dot"));
        right.append(el("span", "time", agent.time));
        topLine.append(el("span", "name", agent.name), right);
        const meta = el("span", "meta");
        meta.append(el("span", "role", agent.role || "Agent"), el("span", "sep", "·"), el("span", "model", modelOfAgent(agent)));
        const last = threadOf(agent).filter((m) => m[0] !== "file").at(-1);
        text.append(topLine, meta);
        const wl = workLine(agent.work);
        if (wl) text.append(wl);
        text.append(el("span", "preview", agent.title || agent.preview || (last ? last[1] : "")));
        btn.append(avatarFor(agent), text);
        btn.addEventListener("click", () => { state.selected = agent.id; persist(); render(); });
        rows.append(btn);
      });
    });
    if (!total) rows.append(el("p", "note", "No agents match this view."));
    if (state.liveNote) rows.append(el("p", "note", state.liveNote));
    col.append(top, rows);
    return col;
  }

  // ── middle: chat + the factory composer, pinned ──
  function composer(agent) {
    const wrap = el("div", "composerwrap");
    const box = el("div", "composerbox");
    const grip = el("div", "grip");
    grip.setAttribute("role", "separator");
    grip.setAttribute("aria-label", "Resize message box");
    grip.addEventListener("pointerdown", (ev) => {
      const startY = ev.clientY;
      const startH = field.offsetHeight;
      grip.setPointerCapture?.(ev.pointerId);
      const move = (e) => { state.gripHeight = Math.max(44, Math.min(320, startH + (startY - e.clientY))); field.style.height = `${state.gripHeight}px`; };
      const up = () => { grip.removeEventListener("pointermove", move); grip.removeEventListener("pointerup", up); };
      grip.addEventListener("pointermove", move);
      grip.addEventListener("pointerup", up);
    });
    box.append(grip);
    if (state.attachments.length) {
      const att = el("div", "attached");
      state.attachments.forEach((f, i) => {
        const chip = el("button", "chip", f.name);
        chip.type = "button";
        chip.title = "Remove attachment";
        chip.addEventListener("click", () => { state.attachments.splice(i, 1); render(); });
        att.append(chip);
      });
      box.append(att);
    }
    const field = el("textarea", "field");
    field.rows = 1;
    field.placeholder = `Message ${agent.name}`;
    field.setAttribute("aria-label", `Message ${agent.name}`);
    field.value = state.draft;
    if (state.gripHeight) field.style.height = `${state.gripHeight}px`;
    const fit = () => { if (!state.gripHeight) { field.style.height = "auto"; field.style.height = `${Math.min(field.scrollHeight, 320)}px`; } };
    const slashMatches = () => (state.draft.startsWith("/") && !/\s/.test(state.draft) ? SLASH_COMMANDS.filter((c) => c.name.startsWith(state.draft.toLowerCase())) : []);
    const runSlash = (cmd) => {
      if (cmd.name === "/file") { state.draft = ""; fileInput.click(); render(); return; }
      state.draft = cmd.text;
      render();
      root.querySelector(".field")?.focus();
    };
    field.addEventListener("input", () => { state.draft = field.value; state.slashIndex = 0; fit(); sendBtn.disabled = !state.draft.trim() && !state.attachments.length; if (state.draft.startsWith("/") || state.menu === "slash") { state.menu = slashMatches().length ? "slash" : ""; render(); const f = root.querySelector(".field"); f?.focus(); f?.setSelectionRange(f.value.length, f.value.length); } });
    field.addEventListener("keydown", (ev) => {
      const matches = state.menu === "slash" ? slashMatches() : [];
      if (matches.length && (ev.key === "ArrowDown" || ev.key === "ArrowUp")) { ev.preventDefault(); state.slashIndex = (state.slashIndex + (ev.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length; render(); root.querySelector(".field")?.focus(); return; }
      if (matches.length && (ev.key === "Enter" || ev.key === "Tab")) { ev.preventDefault(); runSlash(matches[state.slashIndex] || matches[0]); return; }
      if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); send(); }
    });
    box.append(field);

    if (state.menu === "slash") {
      const matches = slashMatches();
      if (matches.length) {
        const pop = el("div", "pop");
        pop.setAttribute("role", "listbox");
        matches.forEach((cmd, i) => {
          const item = el("button", "popitem");
          item.type = "button";
          item.setAttribute("aria-selected", String(i === state.slashIndex));
          item.append(el("span", "", cmd.name), el("small", "", cmd.hint));
          item.addEventListener("click", () => runSlash(cmd));
          pop.append(item);
        });
        box.append(pop);
      }
    }

    const fileInput = el("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.hidden = true;
    fileInput.addEventListener("change", async () => {
      for (const file of [...fileInput.files]) {
        let body = "";
        if (file.size <= 100_000 && (file.type.startsWith("text/") || /\.(md|json|js|ts|tsx|py|txt|csv|yml|yaml|html|css)$/i.test(file.name))) body = await file.text();
        state.attachments.push({ name: file.name, text: body });
      }
      render();
    });
    box.append(fileInput);

    const bar = el("div", "toolbar");
    // target: where the message goes (switching it switches the chat)
    const target = el("button", "tool");
    target.type = "button";
    target.setAttribute("aria-haspopup", "menu");
    target.setAttribute("aria-expanded", String(state.menu === "target"));
    target.append(avatarFor(agent, true), el("span", "t", agent.name));
    target.querySelector(".avatar").style.cssText = "width:18px;height:18px";
    target.addEventListener("click", () => { state.menu = state.menu === "target" ? "" : "target"; render(); });
    const addFile = el("button", "tool round", "+");
    addFile.type = "button";
    addFile.title = "Attach files";
    addFile.setAttribute("aria-label", "Attach files");
    addFile.addEventListener("click", () => fileInput.click());
    const model = el("button", "tool");
    model.type = "button";
    model.title = agent.live ? "The conversation's model" : "Model for this agent";
    model.append(el("span", "t", modelOfAgent(agent)));
    if (!agent.live) model.addEventListener("click", () => { state.menu = state.menu === "model" ? "" : "model"; render(); });
    else model.disabled = true;
    bar.append(target, addFile, model);
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Speech) {
      const mic = el("button", `tool round${state.listening ? " on" : ""}`, "🎙");
      mic.type = "button";
      mic.setAttribute("aria-label", "Dictate");
      mic.addEventListener("click", () => {
        if (state.listening) { state.recognizer?.stop(); return; }
        const rec = new Speech();
        rec.interimResults = false;
        rec.onresult = (e) => { state.draft = `${state.draft} ${[...e.results].map((r) => r[0].transcript).join(" ")}`.trim(); };
        rec.onend = () => { state.listening = false; render(); };
        state.recognizer = rec;
        state.listening = true;
        rec.start();
        render();
      });
      bar.append(mic);
    }
    const sendBtn = el("button", "send", "↑");
    sendBtn.type = "button";
    sendBtn.setAttribute("aria-label", "Send");
    sendBtn.disabled = (!state.draft.trim() && !state.attachments.length) || state.busy;
    sendBtn.addEventListener("click", () => send());
    bar.append(el("span", "spacer"), sendBtn);
    box.append(bar);

    if (state.menu === "target" || state.menu === "model") {
      const pop = el("div", "pop");
      pop.setAttribute("role", "menu");
      if (state.menu === "target") {
        pop.append(el("h4", "", "Send to"));
        agents().slice(0, 40).forEach((a) => {
          const item = el("button", "popitem");
          item.type = "button";
          item.append(avatarFor(a, true), el("span", "", a.name), el("small", "", a.role || ""));
          item.querySelector(".avatar").style.cssText = "width:20px;height:20px";
          item.addEventListener("click", () => { state.selected = a.id; state.menu = ""; persist(); render(); });
          pop.append(item);
        });
      } else {
        pop.append(el("h4", "", "Model"));
        MODEL_CHOICES.forEach((m) => {
          const item = el("button", "popitem", m);
          item.type = "button";
          item.addEventListener("click", () => { state.models = { ...state.models, [agent.id]: m }; state.menu = ""; persist(); render(); });
          pop.append(item);
        });
      }
      box.append(pop);
    }
    wrap.append(box);
    requestAnimationFrame(fit);
    return wrap;
  }

  function chatCol() {
    const agent = current();
    const col = el("div", "col chat");
    const head = el("div", "chathead");
    const who = el("span");
    const presence = { running: "Thinking…", waiting: "Waiting for you", error: "Needs attention" }[agent.work?.run] || "Idle";
    const nameLine = el("span", "namebox");
    nameLine.append(el("span", "", agent.name), el("span", `presence ${agent.work?.run || "idle"}`, presence));
    who.append(nameLine, el("span", "headmeta", `${agent.role || "Agent"} · ${modelOfAgent(agent)}${agent.workspace ? ` · ${agent.workspace}` : ""}`));
    head.append(avatarFor(agent, true), who);
    const hw = workLine(agent.work, 4);
    if (hw) { hw.classList.add("headwork"); head.append(hw); }
    head.append(viewSwitch());
    const msgs = el("div", "msgs");
    msgs.setAttribute("role", "log");
    const thread = threadOf(agent);
    if (!thread.length) msgs.append(el("p", "empty", "No messages yet. Say hello."));
    thread.forEach(([who2, body]) => {
      if (who2 === "file") {
        const card = el("div", "file");
        const info = el("div");
        info.append(el("div", "rtitle", body.name), el("div", "rsub", body.meta));
        card.append(el("span", "fileicon", "PDF"), info);
        msgs.append(card);
      } else {
        msgs.append(el("div", `bubble ${who2}`, body));
      }
    });
    col.append(head, msgs, composer(agent));
    requestAnimationFrame(() => { msgs.scrollTop = msgs.scrollHeight; });
    return col;
  }

  function viewSwitch() {
    const box = el("span", "viewswitch");
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "View");
    VIEWS.forEach(([id, label]) => {
      const b = el("button", "vbtn", label);
      b.type = "button";
      b.setAttribute("aria-pressed", String(state.view === id));
      b.addEventListener("click", () => { state.view = id; persist(); render(); });
      box.append(b);
    });
    if (state.view === "chat") {
      const d = el("button", "vbtn", "Drawer");
      d.type = "button";
      d.setAttribute("aria-pressed", String(state.drawerOpen));
      d.title = "Show or hide the drawer";
      d.addEventListener("click", () => { state.drawerOpen = !state.drawerOpen; persist(); render(); });
      box.append(d);
    }
    return box;
  }

  const previewUrlOf = (agent) => state.previews[agent.id]?.url ?? (agent.live ? [...(agent.activity?.pages || [])].reverse().find((p) => /^https?:/.test(p.url))?.url || agent.work?.items.find((i) => i.url)?.url || "" : "");

  // ── preview: a browser pane beside the chat ──
  function previewCol() {
    const agent = current();
    const col = el("div", "col drawer previewcol");
    const hist = state.previews[agent.id] || { url: previewUrlOf(agent), back: [], fwd: [] };
    const go = (url, push = true) => {
      const next = { url, back: push && hist.url ? [...hist.back, hist.url] : hist.back, fwd: push ? [] : hist.fwd };
      state.previews = { ...state.previews, [agent.id]: next };
      render();
    };
    const bar = el("form", "urlbar");
    const mk = (label, aria, fn, disabled) => { const b = el("button", "navbtn", label); b.type = "button"; b.setAttribute("aria-label", aria); b.disabled = Boolean(disabled); b.addEventListener("click", fn); return b; };
    const back = mk("←", "Back", () => { const prev = hist.back.at(-1); state.previews = { ...state.previews, [agent.id]: { url: prev, back: hist.back.slice(0, -1), fwd: [hist.url, ...hist.fwd] } }; render(); }, !hist.back.length);
    const fwd = mk("→", "Forward", () => { const nxt = hist.fwd[0]; state.previews = { ...state.previews, [agent.id]: { url: nxt, back: [...hist.back, hist.url], fwd: hist.fwd.slice(1) } }; render(); }, !hist.fwd.length);
    const reload = mk("↻", "Reload", () => render());
    const input = el("input", "urlinput");
    input.value = hist.url === "sample:app" ? "127.0.0.1:47920/?project=ios" : hist.url;
    input.placeholder = "Type a URL, for example http://localhost:5173";
    input.setAttribute("aria-label", "Address");
    bar.append(back, fwd, reload, input);
    bar.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const raw = input.value.trim();
      if (!raw) return;
      go(/^https?:\/\//i.test(raw) ? raw : `http://${raw}`);
    });
    const open = el("button", "navbtn", "↗");
    open.type = "button";
    open.title = "Open in a new tab";
    open.setAttribute("aria-label", "Open in a new tab");
    open.disabled = !/^https?:/.test(hist.url);
    open.addEventListener("click", () => window.open(hist.url, "_blank", "noopener,noreferrer"));
    bar.append(open);
    const stage = el("div", "pstage");
    if (!hist.url && !agent.live) {
      const sample = el("button", "abtn primary", "Show the sample app");
      sample.type = "button";
      sample.addEventListener("click", () => go("sample:app"));
      stage.append(el("p", "lhint", "No page to show yet."), sample);
    } else if (!hist.url) {
      stage.append(el("p", "lhint", "Nothing to preview yet. Type a URL above, or the page the agent opens will show here."));
    } else {
      const frame = el("iframe", "pframe");
      frame.title = `${agent.name}'s preview`;
      if (hist.url === "sample:app") { frame.setAttribute("sandbox", ""); frame.srcdoc = SAMPLE_APP; } else { frame.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin allow-popups"); frame.src = hist.url; }
      stage.append(frame);
    }
    col.append(bar, stage);
    return col;
  }

  // ── computer: the agent's desktop, with who has control ──
  function computerCol() {
    const agent = current();
    const col = el("div", "col computercol");
    const blob = BLOBS.find((b) => b.id === agent.blob) || BLOBS[0];
    const frame = el("div", "cframe");
    frame.style.setProperty("--tint", blob.fill);
    const desk = el("div", "cdesk");
    const bubble = el("div", "cbubble", "This is my computer. Watch me work, or take control when you need to.");
    const face = el("div", "cface");
    face.append(blobSvg(agent.blob));
    const now = new Date();
    const clock = el("div", "cclock", now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
    const hello = el("div", "chello", `Welcome back, ${agent.name}`);
    const apps = el("div", "capps");
    ["Browser", "Terminal", "Files", "Editor", "Notes", "Mail", "Calendar", "Slides", "Sheets", "Draw"].forEach((name, i) => {
      const a = el("div", "capp");
      const ic = el("span", "capic", name.slice(0, 1));
      ic.style.background = `hsl(${(i * 47) % 360} 55% 55%)`;
      a.append(ic, el("span", "", name));
      apps.append(a);
    });
    desk.append(bubble, face, clock, hello, apps);
    const now2 = (agent.activity?.commands || []).at(-1);
    const dock = el("div", "cdock", now2 ? `Now: ${now2.command}` : agent.work?.run === "running" ? "Working…" : "Idle");
    frame.append(desk, dock);
    const you = state.control[agent.id] === "you";
    const bar = el("div", "ccontrol");
    bar.append(el("span", "", you ? "You have control" : `${agent.name} has control`));
    const take = el("button", "takeover", you ? "Give back" : "Take over");
    take.type = "button";
    take.addEventListener("click", () => { state.control = { ...state.control, [agent.id]: you ? "agent" : "you" }; render(); });
    bar.append(take);
    col.append(frame, bar, el("p", "lhint cnote", "A preview of the agent's desktop. Live screen sharing arrives when agents publish their screen."));
    return col;
  }

  // ── studio: edit an agent's Kamiji face, with the original engine ──
  function studioCol() {
    const agent = current();
    const look = { ...DEFAULT_LOOK, ...(state.looks[agent.id] || {}) };
    const set = (patch) => { state.looks = { ...state.looks, [agent.id]: { ...look, ...patch } }; persist(); render(); };
    const wrap = el("div", "studio");
    const stage = el("div", "col sstage");
    const top = el("div", "stop");
    const pick = el("select", "spick");
    pick.setAttribute("aria-label", "Agent");
    agents().slice(0, 60).forEach((a) => { const o = el("option", "", `${a.name} · ${a.role || "Agent"}`); o.value = a.id; o.selected = a.id === agent.id; pick.append(o); });
    pick.addEventListener("change", () => { state.selected = pick.value; persist(); render(); });
    top.append(el("span", "stitle", "Look"), pick, viewSwitch());
    const big = el("div", "sbig");
    big.append(kamijiFace(look));
    const exp = el("button", "sexport", "Export as PNG");
    exp.type = "button";
    exp.addEventListener("click", async () => {
      try {
        const blob = await faceToPng(look);
        const a = el("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${agent.name.replace(/\W+/g, "-").toLowerCase()}-kamiji.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      } catch { exp.textContent = "Export failed"; }
    });
    const reset = el("button", "sreset", "Use the hand");
    reset.type = "button";
    reset.title = "Go back to the Kamiji hand avatar";
    reset.addEventListener("click", () => { const next = { ...state.looks }; delete next[agent.id]; state.looks = next; persist(); render(); });
    const actions = el("div", "sactions");
    actions.append(exp, reset);
    const powered = el("div", "powered");
    const hand = el("span", "poweredmark");
    hand.append(blobSvg(agent.blob));
    powered.append(el("span", "", "Powered by"), hand, el("b", "", "Kamiji"), el("span", "", "and"), el("b", "kosmos", "Kosmos"));
    stage.append(top, big, actions, powered);

    const panel = el("div", "col spanel");
    const grid = (title, cols, items, isOn, onPick, draw, sub = "") => {
      if (title) panel.append(el("h4", "", title));
      if (sub) panel.append(el("div", "ssub", sub));
      const g = el("div", `sgrid c${cols}`);
      items.forEach((item) => {
        const b = el("button", "sopt");
        b.type = "button";
        b.setAttribute("aria-pressed", String(isOn(item)));
        b.append(draw(item));
        b.addEventListener("click", () => onPick(item));
        g.append(b);
      });
      panel.append(g);
    };
    [...new Set(LOOK_SHAPES.map((x) => x[2]))].forEach((group) => {
      grid(group === "Basic" ? "Shape" : "", 4, LOOK_SHAPES.filter((x) => x[2] === group), ([id]) => look.shape === id, ([id]) => set({ shape: id }), ([id, label]) => {
        const cell = el("span", "scell");
        const mini = el("span", "smini");
        mini.append(kamijiFace({ ...look, shape: id }));
        cell.append(mini, el("span", "", label));
        return cell;
      }, group === "Basic" ? "" : group);
    });
    grid("Expression", 4, LOOK_EXPRESSIONS, ([id]) => look.expression === id, ([id]) => set({ expression: id }), ([id, label]) => {
      const cell = el("span", "scell");
      const mini = el("span", "smini");
      mini.append(kamijiFace({ ...look, expression: id }));
      cell.append(mini, el("span", "", label));
      return cell;
    });
    grid("Eyes", 4, LOOK_EYES, ([id]) => look.eyeStyle === id, ([id]) => set({ eyeStyle: id }), ([id, label]) => {
      const cell = el("span", "scell");
      const mini = el("span", "smini");
      mini.append(kamijiFace({ ...look, eyeStyle: id, expression: look.expression === "happy" || look.expression === "laughing" ? "neutral" : look.expression }));
      cell.append(mini, el("span", "", label));
      return cell;
    });
    const segmented = (title, items, value, onPick) => {
      panel.append(el("h4", "", title));
      const seg = el("div", "seg");
      items.forEach(([id, label]) => {
        const b = el("button", "", label);
        b.type = "button";
        b.setAttribute("aria-pressed", String(value === id));
        b.addEventListener("click", () => onPick(id));
        seg.append(b);
      });
      panel.append(seg);
    };
    segmented("Gaze", LOOK_GAZES, look.gaze, (gaze) => set({ gaze }));
    segmented("Blush", [["auto", "Auto"], ["on", "On"], ["off", "Off"]], look.blush, (blush) => set({ blush }));
    panel.append(el("h4", "", "Face"));
    LOOK_TOGGLES.forEach(([key, label]) => {
      const row = el("label", "sswitch");
      const input = el("input");
      input.type = "checkbox";
      input.setAttribute("role", "switch");
      input.checked = Boolean(look[key]);
      input.addEventListener("change", () => set({ [key]: input.checked }));
      row.append(el("span", "", label), input);
      panel.append(row);
    });
    [["eyeSize", "Eye size", 0.7, 1.4], ["eyeSpacing", "Eye spacing", 0.8, 1.3]].forEach(([key, label, min, max]) => {
      const row = el("label", "sslider");
      const input = el("input");
      input.type = "range";
      input.min = String(min); input.max = String(max); input.step = "0.05";
      input.value = String(look[key]);
      input.setAttribute("aria-label", label);
      input.addEventListener("change", () => set({ [key]: Number(input.value) }));
      row.append(el("span", "", label), input);
      panel.append(row);
    });
    panel.append(el("h4", "", "Colour"));
    const sw = el("div", "sswatches");
    LOOK_COLORS.forEach((c) => {
      const b = el("button", "swatch");
      b.type = "button";
      b.style.background = c;
      b.setAttribute("aria-label", c);
      b.setAttribute("aria-pressed", String(look.color === c));
      b.addEventListener("click", () => set({ color: c }));
      sw.append(b);
    });
    panel.append(sw);
    wrap.append(stage, panel);
    return wrap;
  }

  // ── right: the drawer, Arco cards plus the conversation drawer's own tabs ──
  function drawerCol() {
    const agent = current();
    const col = el("div", "col drawer");
    const tabs = el("div", "tabs");
    tabs.setAttribute("role", "tablist");
    DRAWER_TABS.forEach(([id, label]) => {
      const t = el("button", "tab", label);
      t.type = "button";
      t.setAttribute("role", "tab");
      t.setAttribute("aria-selected", String(state.tab === id));
      t.addEventListener("click", () => { state.tab = id; persist(); render(); });
      tabs.append(t);
    });
    const pane = el("div", "pane");
    pane.setAttribute("role", "tabpanel");
    const act = agent.activity || emptyActivity();
    const empty = (msg) => pane.append(el("p", "lhint", msg));
    const openInConversation = (what) => {
      pane.append(el("p", "lhint", `${what} runs in the conversation's own panel.`));
      const b = el("button", "abtn primary", agent.live ? "Open conversation" : "Sample agent");
      b.type = "button";
      b.disabled = !agent.live;
      b.addEventListener("click", () => host.navigate(`/conversations/${agent.conversationId}`));
      pane.append(b);
    };
    switch (state.tab) {
      case "cards": {
        const ask = el("button", "abtn", "Ask for a card");
        ask.type = "button";
        ask.addEventListener("click", () => send(SLASH_COMMANDS[0].text));
        ask.style.alignSelf = "flex-start";
        pane.append(ask);
        const cards = agent.cards || [];
        if (!cards.length) empty("No cards yet. Ask the agent to answer as a card, or paste a fenced JSON block of a typed block into the chat.");
        cards.forEach((block, i) => pane.append(renderBlock(block, {
          isDone: (t) => (`${agent.id}:${i}:${t.id}` in state.cardState ? state.cardState[`${agent.id}:${i}:${t.id}`] : t.done),
          onToggle: (t, value) => { state.cardState = { ...state.cardState, [`${agent.id}:${i}:${t.id}`]: value }; persist(); render(); },
          onSubmit: (message) => send(message),
        })));
        break;
      }
      case "screen": {
        const screen = el("div", "screen");
        screen.append(screenArt(agent.blob));
        pane.append(screen, el("div", "caption", `${agent.name}'s screen`));
        (agent.routines || []).forEach(([title, when, on]) => {
          const r = el("div", "routine");
          const txt = el("div");
          txt.append(el("div", "", title), el("div", "lhint", when));
          r.append(el("span", `ricon${on ? "" : " off"}`), txt);
          pane.append(r);
        });
        empty("Screen and routines are a preview until agents publish them.");
        break;
      }
      case "files":
        if (!act.files.length) empty("No files touched yet.");
        act.files.forEach((f) => { const c = el("div", "acard"); const b = el("div", "abody"); b.append(el("code", "", f.path), el("div", "alabel", [...new Set(f.ops)].join(", "))); c.append(b); pane.append(c); });
        break;
      case "terminal":
        if (!act.commands.length) empty("No commands run yet.");
        act.commands.slice(-30).forEach((c) => pane.append(renderBlock({ type: "terminalBlock", title: c.command, badge: c.exit === null ? "" : `exit ${c.exit}`, lines: [`$ ${c.command}`, c.output].filter(Boolean) })));
        break;
      case "browser":
        if (!act.pages.length) empty("No pages visited yet.");
        act.pages.slice(-20).forEach((p) => { const c = el("div", "acard"); const b = el("div", "abody"); b.append(el("div", "", p.url || p.action), el("div", "alabel", p.note || p.action)); c.append(b); pane.append(c); });
        break;
      case "webview":
        openInConversation("The live webview");
        break;
      case "vscode":
        openInConversation("VS Code");
        break;
      case "planner":
        if (act.plan) pane.append(renderBlock({ type: "textBlock", title: "Plan", badge: "PLAN.md", body: act.plan }));
        else empty("No plan written yet.");
        break;
      case "tasks":
        if (!act.tasks.length) empty("No task list yet.");
        act.tasks.forEach((t) => { const c = el("div", "acard"); const h = el("div", "achead"); h.append(el("span", "", t.title), el("span", `status ${t.status}`, t.status.replace("_", " "))); c.append(h); if (t.notes) { const b = el("div", "abody"); b.append(el("div", "alabel", t.notes)); c.append(b); } pane.append(c); });
        break;
      default:
        break;
    }
    col.append(tabs, pane);
    return col;
  }

  function render() {
    if (disposed) return;
    const activeEl = document.activeElement;
    const hadField = activeEl && activeEl.classList?.contains("field");
    const hadSearch = activeEl && activeEl.classList?.contains("search");
    const listScroll = root.querySelector(".rows")?.scrollTop || 0;
    const paneScroll = root.querySelector(".pane")?.scrollTop || 0;
    root.replaceChildren();
    const shell = el("div");
    shell.className = `shell view-${state.view}${state.view === "chat" && !state.drawerOpen ? " nodrawer" : ""}`;
    if (state.view === "chat") shell.append(listCol(), chatCol(), ...(state.drawerOpen ? [drawerCol()] : []));
    else if (state.view === "studio") shell.append(studioCol());
    else if (state.view === "preview") shell.append(chatCol(), previewCol());
    else shell.append(chatCol(), computerCol());
    root.append(shell);
    const rows = root.querySelector(".rows");
    if (rows) rows.scrollTop = listScroll;
    const pane = root.querySelector(".pane");
    if (pane) pane.scrollTop = paneScroll;
    if (hadField) { const f = root.querySelector(".field"); f?.focus(); f?.setSelectionRange(f.value.length, f.value.length); }
    if (hadSearch) { const s = root.querySelector(".search"); s?.focus(); s?.setSelectionRange(s.value.length, s.value.length); }
  }

  const onDocClick = (ev) => {
    if (state.menu && !root.querySelector(".menu, .pop")?.contains(ev.target) && !ev.target.closest?.(".iconbtn, .tool, .field")) { state.menu = ""; render(); }
  };
  const onKey = (ev) => { if (ev.key === "Escape" && state.menu) { state.menu = ""; render(); } };
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);

  render();
  loadLive();
  return () => {
    disposed = true;
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onKey);
    style.remove();
    root.remove();
  };
}

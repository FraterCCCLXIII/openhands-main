// Kamiji creature builder: a dependency-free Canvas Extension (manifest schema 1, host API 1).
// A 2D, self-contained version of the Studio creature builder in FraterCCCLXIII/kamiji
// (site/studio). It saves characters in the same `kamiji.studio.character/1` JSON shape,
// so a creature built here can be carried over; part ids here are the simple 2D ones.

const STORAGE_KEY = "canvas-extension-kamiji:v1";
const SCHEMA = "kamiji.studio.character/1";
const LIBRARY_SCHEMA = "kamiji.studio.library/1";
const NEW_CREATURE_INTENT = "create:creature";
/** New Chat icon: a creature head with a plus, drawn with strokes in currentColor. */
const NEW_CREATURE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10 3 4l5 3"/><path d="m19 10 2-6-5 3"/><path d="M11 9c4.5 0 7 2.5 7 6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5c0-3.5 2.5-6 7-6Z"/><path d="M19 18v4M17 20h4"/></svg>';

/** Slot -> part ids. The first id in each list is "none" or the plain option. */
export const PARTS = {
  ears: ["none", "round", "pointy", "long", "floppy"],
  tail: ["none", "short", "long", "fluffy"],
  horns: ["none", "small", "curved"],
  wings: ["none", "small", "large"],
};

/** Slider id -> [min, max, label]. 0 is the default for each. */
export const MORPHS = {
  width: [-1, 1, "Width"],
  height: [-1, 1, "Height"],
  eyeSize: [-1, 1, "Eye size"],
  eyeGap: [-1, 1, "Eye gap"],
};

export const EXPRESSIONS = ["happy", "neutral", "sleepy", "surprised", "mischief"];

/** Body plans: starting parts and colours. */
export const PLANS = {
  slime: { label: "Slime", parts: { ears: "none", tail: "none", horns: "none", wings: "none" }, body: "#7dd3fc", belly: "#e0f2fe", accent: "#38bdf8" },
  cat: { label: "Cat", parts: { ears: "pointy", tail: "long", horns: "none", wings: "none" }, body: "#fbbf24", belly: "#fef3c7", accent: "#f59e0b" },
  fox: { label: "Fox", parts: { ears: "pointy", tail: "fluffy", horns: "none", wings: "none" }, body: "#fb923c", belly: "#ffedd5", accent: "#ea580c" },
  bunny: { label: "Bunny", parts: { ears: "long", tail: "short", horns: "none", wings: "none" }, body: "#f9a8d4", belly: "#fdf2f8", accent: "#ec4899" },
  bear: { label: "Bear", parts: { ears: "round", tail: "short", horns: "none", wings: "none" }, body: "#a8a29e", belly: "#e7e5e4", accent: "#78716c" },
  dragon: { label: "Dragon", parts: { ears: "none", tail: "long", horns: "small", wings: "small" }, body: "#86efac", belly: "#dcfce7", accent: "#22c55e" },
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

export function defaultCharacter(plan = "slime") {
  const p = PLANS[plan] || PLANS.slime;
  return {
    schema: SCHEMA,
    name: "New creature",
    style: "creature",
    plan: PLANS[plan] ? plan : "slime",
    parts: { ...p.parts },
    morphs: { width: 0, height: 0, eyeSize: 0, eyeGap: 0 },
    materials: { body: { color: p.body }, belly: { color: p.belly }, accent: { color: p.accent }, eyes: { color: "#1f1235" } },
    face: { expression: "happy" },
  };
}

/** Turns untrusted input into a valid character: unknown ids and bad values fall back to defaults. */
export function sanitizeCharacter(input) {
  const src = input && typeof input === "object" ? input : {};
  const plan = PLANS[src.plan] ? src.plan : "slime";
  const out = defaultCharacter(plan);
  if (typeof src.name === "string") out.name = src.name.trim().slice(0, 48) || out.name;
  Object.keys(PARTS).forEach((slot) => {
    const id = src.parts?.[slot];
    if (PARTS[slot].includes(id)) out.parts[slot] = id;
  });
  Object.entries(MORPHS).forEach(([id, [lo, hi]]) => {
    const v = Number(src.morphs?.[id]);
    if (Number.isFinite(v)) out.morphs[id] = clamp(v, lo, hi);
  });
  Object.keys(out.materials).forEach((region) => {
    const c = src.materials?.[region]?.color;
    if (isHex(c)) out.materials[region].color = c.toLowerCase();
  });
  if (EXPRESSIONS.includes(src.face?.expression)) out.face.expression = src.face.expression;
  return out;
}

/** A random creature; `rand` is injectable so tests are deterministic. */
export function randomCharacter(rand = Math.random) {
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const plan = pick(Object.keys(PLANS));
  const c = defaultCharacter(plan);
  Object.keys(PARTS).forEach((slot) => { c.parts[slot] = pick(PARTS[slot]); });
  Object.entries(MORPHS).forEach(([id, [lo, hi]]) => { c.morphs[id] = Math.round((lo + rand() * (hi - lo)) * 20) / 20; });
  const hue = Math.floor(rand() * 360);
  const hsl = (h, s, l) => {
    const a = (s * Math.min(l, 1 - l)) / 1;
    const f = (n) => { const k = (n + h / 30) % 12; const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(v * 255).toString(16).padStart(2, "0"); };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  c.materials.body.color = hsl(hue, 0.75, 0.72);
  c.materials.belly.color = hsl(hue, 0.7, 0.92);
  c.materials.accent.color = hsl((hue + 20) % 360, 0.75, 0.55);
  c.face.expression = pick(EXPRESSIONS);
  c.name = `${PLANS[plan].label} ${Math.floor(rand() * 900 + 100)}`;
  return c;
}

export const characterToJson = (c) => JSON.stringify(sanitizeCharacter(c), null, 2);

/** Parses a single character or a library file; returns characters or throws a readable error. */
export function importCharacters(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("That is not valid JSON."); }
  if (data && data.schema === LIBRARY_SCHEMA && Array.isArray(data.characters)) return data.characters.map(sanitizeCharacter);
  if (data && typeof data === "object" && (data.schema === SCHEMA || data.parts || data.plan)) return [sanitizeCharacter(data)];
  throw new Error("No Kamiji character found in that JSON.");
}

export const libraryToJson = (list) => JSON.stringify({ schema: LIBRARY_SCHEMA, characters: list.map(sanitizeCharacter) }, null, 2);

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

function earPath(kind, side, cx, topY, rx) {
  const x = cx + side * rx * 0.62;
  const sx = side;
  switch (kind) {
    case "round": return `<circle cx="${x}" cy="${topY + 8}" r="${rx * 0.26}" />`;
    case "pointy": return `<path d="M${x - sx * 26} ${topY + 22} L${x + sx * 4} ${topY - 38} L${x + sx * 30} ${topY + 18} Z" />`;
    case "long": return `<ellipse cx="${x}" cy="${topY - 34}" rx="${rx * 0.17}" ry="${rx * 0.62}" transform="rotate(${sx * 8} ${x} ${topY})" />`;
    case "floppy": return `<ellipse cx="${x + sx * 14}" cy="${topY + 38}" rx="${rx * 0.19}" ry="${rx * 0.42}" transform="rotate(${sx * -18} ${x} ${topY + 20})" />`;
    default: return "";
  }
}

/** The creature as an SVG string (300x300). Pure, so it can be tested and exported. */
export function creatureSvg(character, { size = 300 } = {}) {
  const c = sanitizeCharacter(character);
  const m = c.morphs;
  const col = (r) => c.materials[r].color;
  const cx = 150;
  const rx = 76 * (1 + 0.28 * m.width);
  const ry = 68 * (1 + 0.28 * m.height);
  const cy = 176;
  const topY = cy - ry;
  const eyeR = 9 * (1 + 0.55 * m.eyeSize);
  const eyeDx = 27 * (1 + 0.45 * m.eyeGap);
  const eyeY = cy - ry * 0.18;
  const ex = c.face.expression;
  const parts = [];
  const accentFill = `fill="${col("accent")}"`;

  // Behind the body: wings, tail.
  if (c.parts.wings !== "none") {
    const big = c.parts.wings === "large";
    [-1, 1].forEach((s) => parts.push(`<path ${accentFill} opacity="0.85" d="M${cx + s * rx * 0.7} ${cy - 10} Q${cx + s * (rx + (big ? 78 : 44))} ${cy - (big ? 96 : 56)} ${cx + s * (rx + (big ? 62 : 36))} ${cy + 14} Q${cx + s * (rx + 10)} ${cy + 6} ${cx + s * rx * 0.7} ${cy + 18} Z" />`));
  }
  if (c.parts.tail !== "none") {
    const t = c.parts.tail;
    const bx = cx + rx * 0.85;
    const by = cy + ry * 0.55;
    if (t === "fluffy") parts.push(`<ellipse ${accentFill} cx="${bx + 30}" cy="${by - 22}" rx="22" ry="40" transform="rotate(28 ${bx + 30} ${by - 22})" />`);
    else if (t === "long") parts.push(`<path d="M${bx - 6} ${by} Q${bx + 60} ${by + 6} ${bx + 52} ${by - 54}" fill="none" stroke="${col("accent")}" stroke-width="13" stroke-linecap="round" />`);
    else parts.push(`<circle ${accentFill} cx="${bx + 8}" cy="${by - 4}" r="13" />`);
  }

  // Ears and horns sit behind the head outline.
  [-1, 1].forEach((s) => {
    const e = earPath(c.parts.ears, s, cx, topY, rx);
    if (e) parts.push(`<g ${accentFill}>${e}</g>`);
    if (c.parts.horns !== "none") {
      const curved = c.parts.horns === "curved";
      const hx = cx + s * rx * 0.36;
      parts.push(curved
        ? `<path d="M${hx} ${topY + 12} Q${hx + s * 30} ${topY - 22} ${hx + s * 8} ${topY - 46}" fill="none" stroke="#f5f0e6" stroke-width="11" stroke-linecap="round" />`
        : `<path d="M${hx - 9} ${topY + 12} L${hx + s * 3} ${topY - 26} L${hx + 11} ${topY + 12} Z" fill="#f5f0e6" />`);
    }
  });

  // Body, feet, belly.
  parts.push(`<ellipse cx="${cx - rx * 0.4}" cy="${cy + ry - 2}" rx="${rx * 0.22}" ry="9" ${accentFill} />`);
  parts.push(`<ellipse cx="${cx + rx * 0.4}" cy="${cy + ry - 2}" rx="${rx * 0.22}" ry="9" ${accentFill} />`);
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${col("body")}" />`);
  parts.push(`<ellipse cx="${cx}" cy="${cy + ry * 0.38}" rx="${rx * 0.58}" ry="${ry * 0.5}" fill="${col("belly")}" opacity="0.9" />`);

  // Face.
  const eyes = col("eyes");
  const eye = (s) => {
    const x = cx + s * eyeDx;
    if (ex === "sleepy") return `<path d="M${x - eyeR} ${eyeY} Q${x} ${eyeY + eyeR * 0.9} ${x + eyeR} ${eyeY}" fill="none" stroke="${eyes}" stroke-width="4" stroke-linecap="round" />`;
    if (ex === "happy") return `<path d="M${x - eyeR} ${eyeY + 3} Q${x} ${eyeY - eyeR * 1.3} ${x + eyeR} ${eyeY + 3}" fill="none" stroke="${eyes}" stroke-width="4.5" stroke-linecap="round" />`;
    const r = ex === "surprised" ? eyeR * 1.25 : eyeR;
    const lid = ex === "mischief" && s === 1 ? `<path d="M${x - r - 3} ${eyeY - r - 2} L${x + r + 3} ${eyeY - r + 5}" stroke="${eyes}" stroke-width="4" stroke-linecap="round" />` : "";
    return `<ellipse cx="${x}" cy="${eyeY}" rx="${r * 0.82}" ry="${r * 1.15}" fill="${eyes}" /><circle cx="${x + 2}" cy="${eyeY - r * 0.4}" r="${Math.max(2, r * 0.3)}" fill="#fff" />${lid}`;
  };
  parts.push(eye(-1), eye(1));
  const my = eyeY + 24;
  const mouth = {
    happy: `<path d="M${cx - 13} ${my} Q${cx} ${my + 14} ${cx + 13} ${my}" fill="none" stroke="${eyes}" stroke-width="3.5" stroke-linecap="round" />`,
    neutral: `<path d="M${cx - 9} ${my + 4} L${cx + 9} ${my + 4}" stroke="${eyes}" stroke-width="3.5" stroke-linecap="round" />`,
    sleepy: `<ellipse cx="${cx}" cy="${my + 5}" rx="5" ry="3.5" fill="${eyes}" opacity="0.8" />`,
    surprised: `<ellipse cx="${cx}" cy="${my + 6}" rx="6" ry="8" fill="${eyes}" />`,
    mischief: `<path d="M${cx - 13} ${my + 2} Q${cx - 2} ${my + 14} ${cx + 14} ${my - 2}" fill="none" stroke="${eyes}" stroke-width="3.5" stroke-linecap="round" />`,
  }[ex];
  parts.push(mouth);
  parts.push(`<ellipse cx="${cx - eyeDx - 12}" cy="${eyeY + 17}" rx="9" ry="5.5" fill="${col("accent")}" opacity="0.35" /><ellipse cx="${cx + eyeDx + 12}" cy="${eyeY + 17}" rx="9" ry="5.5" fill="${col("accent")}" opacity="0.35" />`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="${size}" height="${size}" role="img" aria-label="${esc(c.name)}">${parts.join("")}</svg>`;
}

/**
 * Drag handles for the outer columns of a page's grid (a left list and/or a right panel).
 *
 * `columns` is a list of `{ el, edge, min, max, initial, label }`: `el` is the column's element,
 * `edge` is "left" for a column on the left side (its handle sits on its right edge) or "right"
 * for one on the right side. The app's CSS must read each width from a variable, for example
 * `grid-template-columns: var(--grip-0, 300px) minmax(0, 1fr) var(--grip-1, 280px)`, where the
 * number is the column's position in the `columns` list. Widths are saved per `storageKey`.
 * Call `refresh()` after the app shows or hides a column; call `dispose()` on unmount.
 */
function gripColumns({ grid, columns, storageKey, centerMin = 320, narrowQuery = "(max-width: 720px)" }) {
  const win = grid.ownerDocument.defaultView || globalThis;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const saved = (() => {
    try { return JSON.parse(win.localStorage.getItem(storageKey) || "{}") || {}; } catch { return {}; }
  })();
  const widths = columns.map((c, i) => (Number.isFinite(saved[i]) ? clamp(saved[i], c.min, c.max) : c.initial));
  const handles = [];
  const cleanups = [];

  const narrow = () => Boolean(win.matchMedia && win.matchMedia(narrowQuery).matches);
  const shown = (i) => !narrow() && columns[i].el.isConnected && win.getComputedStyle(columns[i].el).display !== "none";
  const save = () => { try { win.localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(widths.map((w, i) => [i, w])))); } catch { /* storage unavailable */ } };
  // The widest a column may get while the middle keeps `centerMin` and the other grips keep their widths.
  const limit = (i) => {
    const total = grid.clientWidth;
    if (!total) return columns[i].max;
    const others = widths.reduce((sum, w, j) => (j !== i && shown(j) ? sum + w : sum), 0);
    return clamp(total - others - centerMin, columns[i].min, columns[i].max);
  };

  function apply() {
    columns.forEach((c, i) => {
      if (narrow()) grid.style.removeProperty(`--grip-${i}`);
      else grid.style.setProperty(`--grip-${i}`, `${widths[i]}px`);
      const h = handles[i];
      h.hidden = !shown(i);
      h.setAttribute("aria-valuenow", String(Math.round(widths[i])));
      h.setAttribute("aria-valuemax", String(Math.round(limit(i))));
    });
  }

  function set(i, width, persist = true) {
    widths[i] = clamp(Math.round(width), columns[i].min, limit(i));
    apply();
    if (persist) save();
  }

  columns.forEach((c, i) => {
    const h = grid.ownerDocument.createElement("div");
    h.className = `grip grip-${c.edge}`;
    h.dataset.grip = String(i);
    h.setAttribute("role", "separator");
    h.setAttribute("aria-orientation", "vertical");
    h.setAttribute("aria-label", `Resize ${c.label || "column"}`);
    h.setAttribute("aria-valuemin", String(c.min));
    h.tabIndex = 0;
    h.style[c.edge === "left" ? "left" : "right"] = `var(--grip-${i}, ${c.initial}px)`;
    const dir = c.edge === "left" ? 1 : -1;
    let startX = 0;
    let startW = 0;
    const move = (e) => { set(i, startW + dir * (e.clientX - startX), false); };
    const up = () => {
      grid.classList.remove("gripping");
      h.classList.remove("on");
      grid.ownerDocument.removeEventListener("pointermove", move);
      grid.ownerDocument.removeEventListener("pointerup", up);
      save();
    };
    h.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      startX = e.clientX;
      startW = widths[i];
      grid.classList.add("gripping");
      h.classList.add("on");
      grid.ownerDocument.addEventListener("pointermove", move);
      grid.ownerDocument.addEventListener("pointerup", up);
    });
    h.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 64 : 16;
      const grow = (e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0) * dir;
      if (grow) set(i, widths[i] + grow * step);
      else if (e.key === "Home") set(i, c.min);
      else if (e.key === "End") set(i, limit(i));
      else return;
      e.preventDefault();
    });
    h.addEventListener("dblclick", () => set(i, c.initial));
    cleanups.push(() => { grid.ownerDocument.removeEventListener("pointermove", move); grid.ownerDocument.removeEventListener("pointerup", up); h.remove(); });
    handles.push(h);
    grid.append(h);
  });

  win.addEventListener("resize", apply);
  cleanups.push(() => win.removeEventListener("resize", apply));
  apply();
  return { refresh: apply, widths: () => [...widths], dispose: () => cleanups.forEach((fn) => fn()) };
}

/** CSS for the handles; add it to the app's stylesheet and make the grid `position: relative`. */
const GRIP_CSS = `
.grip { position: absolute; top: 0; bottom: 0; width: 11px; z-index: 6; cursor: col-resize; touch-action: none; outline: 0; }
.grip-left { transform: translateX(-50%); }
.grip-right { transform: translateX(50%); }
.grip::after { content: ""; position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px; border-radius: 2px; background: transparent; transition: background .12s; }
.grip:hover::after, .grip:focus-visible::after, .grip.on::after { background: var(--oh-color-primary, #7c9dff); }
.gripping { user-select: none; cursor: col-resize; }
.gripping * { pointer-events: none; }
.gripping .grip { pointer-events: auto; }
@media (max-width: 720px) { .grip { display: none; } }
`;

const CSS = `
.kj { --kj-bg: var(--oh-color-base, #171717); --kj-panel: var(--oh-color-base-secondary, #212121); --kj-text: var(--oh-foreground, #eee);
  --kj-muted: var(--oh-muted, #9a9a9a); --kj-border: var(--oh-border-subtle, #3a3a3a); --kj-contrast: var(--oh-contrast, #fff); --kj-on-contrast: var(--oh-contrast-foreground, #111);
  box-sizing: border-box; color: var(--kj-text); background: var(--kj-bg); font: 14px/1.45 system-ui, sans-serif; height: 100%; min-height: 480px; padding: 20px; display: grid; gap: 20px; grid-template-columns: minmax(260px, 1fr) var(--grip-0, 380px); align-items: start; position: relative; }
.kj > .grip-right { margin-right: 30px; }
.kj * { box-sizing: border-box; }
.kj h1 { margin: 0 0 4px; font-size: 20px; font-weight: 600; }
.kj .stage { display: grid; gap: 12px; justify-items: center; background: var(--kj-panel); border: 1px solid var(--kj-border); border-radius: 16px; padding: 20px; }
.kj .stage .art { width: min(100%, 360px); }
.kj .stage .art svg { width: 100%; height: auto; display: block; }
.kj .panel { display: grid; gap: 14px; }
.kj .group { display: grid; gap: 6px; }
.kj .group > b { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--kj-muted); font-weight: 600; }
.kj .row { display: flex; flex-wrap: wrap; gap: 6px; }
.kj button { font: inherit; color: inherit; cursor: pointer; border: 1px solid var(--kj-border); background: var(--kj-panel); border-radius: 999px; padding: 5px 12px; }
.kj button[aria-pressed="true"] { background: var(--kj-contrast); color: var(--kj-on-contrast); border-color: var(--kj-contrast); }
.kj button.primary { background: var(--kj-contrast); color: var(--kj-on-contrast); border-color: var(--kj-contrast); }
.kj label.slider { display: grid; grid-template-columns: 90px 1fr; gap: 8px; align-items: center; color: var(--kj-muted); }
.kj input[type="range"] { width: 100%; }
.kj input[type="text"], .kj textarea { font: inherit; color: inherit; background: var(--kj-panel); border: 1px solid var(--kj-border); border-radius: 10px; padding: 7px 10px; width: 100%; }
.kj textarea { min-height: 110px; font: 12px ui-monospace, monospace; }
.kj .colors { display: flex; gap: 12px; flex-wrap: wrap; }
.kj .colors label { display: grid; gap: 4px; justify-items: center; color: var(--kj-muted); font-size: 12px; }
.kj input[type="color"] { width: 40px; height: 32px; padding: 0; border: 1px solid var(--kj-border); border-radius: 8px; background: none; }
.kj .roster { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 8px; }
.kj .card { background: var(--kj-panel); border: 1px solid var(--kj-border); border-radius: 12px; padding: 6px; display: grid; gap: 4px; justify-items: center; font-size: 12px; }
.kj .card svg { width: 64px; height: 64px; }
.kj .card .acts { display: flex; gap: 4px; }
.kj .card .acts button { padding: 2px 8px; font-size: 11px; }
.kj .note { color: var(--kj-muted); font-size: 12px; margin: 0; }
.kj .err { color: #ef4444; font-size: 12px; margin: 0; }
@media (max-width: 720px) { .kj { grid-template-columns: 1fr; } }
` + GRIP_CSS;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function readStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { current: sanitizeCharacter(raw.current), roster: Array.isArray(raw.roster) ? raw.roster.map(sanitizeCharacter) : [] };
  } catch {
    return { current: defaultCharacter(), roster: [] };
  }
}

/** Mounted builders, so a subscribed `onIntent` reaches the page that is already open. */
const openMounts = new Set();

function mount(container, { intent = null } = {}) {
  const win = container.ownerDocument.defaultView || window;
  const root = el("div", "kj");
  container.append(el("style", "", CSS), root);
  let disposed = false;
  let grip = null;
  const state = { ...readStore(), importing: false, importText: "", note: "", error: "" };
  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ current: state.current, roster: state.roster })); } catch { /* storage unavailable */ } };
  const change = (fn) => { fn(state.current); state.current = sanitizeCharacter(state.current); state.note = ""; state.error = ""; save(); render(); };
  // New Chat "New Kamiji": a fresh default creature. The roster is kept.
  const startFresh = () => { state.current = defaultCharacter(); state.importing = false; state.importText = ""; state.note = ""; state.error = ""; save(); render(); };
  const openIntent = (next) => {
    if (next?.action !== NEW_CREATURE_INTENT || disposed) return false;
    startFresh();
    return true;
  };

  /** Fill the visible page below wherever the host put us (hosts may not give a definite height). */
  function fit() {
    const top = Math.max(0, root.getBoundingClientRect().top);
    root.style.height = `${Math.max(480, (win.innerHeight || 800) - top)}px`;
  }
  const onResize = () => fit();
  win.addEventListener("resize", onResize);
  const observer = typeof win.ResizeObserver === "function" ? new win.ResizeObserver(() => fit()) : null;
  observer?.observe(container);

  const group = (title, ...children) => { const g = el("div", "group"); g.append(el("b", "", title), ...children); return g; };
  const choice = (items, isOn, onPick) => {
    const row = el("div", "row");
    items.forEach(([id, label]) => {
      const b = el("button", "", label);
      b.type = "button";
      b.setAttribute("aria-pressed", String(isOn(id)));
      b.addEventListener("click", () => onPick(id));
      row.append(b);
    });
    return row;
  };
  const action = (label, fn, cls = "") => { const b = el("button", cls, label); b.type = "button"; b.addEventListener("click", fn); return b; };

  const download = (name, text, type) => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = el("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const fileName = () => (state.current.name || "creature").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "creature";

  function render() {
    if (disposed) return;
    fit();
    const c = state.current;
    root.replaceChildren();

    const stage = el("div", "stage");
    const art = el("div", "art");
    art.innerHTML = creatureSvg(c);
    const name = el("input");
    name.type = "text";
    name.value = c.name;
    name.setAttribute("aria-label", "Creature name");
    name.addEventListener("change", () => change((x) => { x.name = name.value; }));
    stage.append(art, name);

    const panel = el("div", "panel");
    panel.append(el("h1", "", "Creature builder"));
    panel.append(group("Body plan", choice(Object.entries(PLANS).map(([id, p]) => [id, p.label]), (id) => c.plan === id, (id) => { state.current = defaultCharacter(id); state.current.name = c.name; save(); render(); })));
    Object.entries(PARTS).forEach(([slot, ids]) => {
      panel.append(group(slot[0].toUpperCase() + slot.slice(1), choice(ids.map((id) => [id, id]), (id) => c.parts[slot] === id, (id) => change((x) => { x.parts[slot] = id; }))));
    });
    const sliders = el("div", "group");
    sliders.append(el("b", "", "Shape"));
    Object.entries(MORPHS).forEach(([id, [lo, hi, label]]) => {
      const row = el("label", "slider", label);
      const range = el("input");
      range.type = "range"; range.min = String(lo); range.max = String(hi); range.step = "0.05"; range.value = String(c.morphs[id]);
      range.setAttribute("aria-label", label);
      range.addEventListener("input", () => { state.current.morphs[id] = Number(range.value); state.current = sanitizeCharacter(state.current); art.innerHTML = creatureSvg(state.current); save(); });
      row.append(range);
      sliders.append(row);
    });
    panel.append(sliders);
    const colors = el("div", "colors");
    [["body", "Body"], ["belly", "Belly"], ["accent", "Accent"], ["eyes", "Eyes"]].forEach(([region, label]) => {
      const wrap = el("label", "", label);
      const input = el("input");
      input.type = "color"; input.value = c.materials[region].color;
      input.setAttribute("aria-label", `${label} colour`);
      input.addEventListener("input", () => { state.current.materials[region].color = input.value; state.current = sanitizeCharacter(state.current); art.innerHTML = creatureSvg(state.current); save(); });
      wrap.append(input);
      colors.append(wrap);
    });
    panel.append(group("Colours", colors));
    panel.append(group("Face", choice(EXPRESSIONS.map((id) => [id, id]), (id) => c.face.expression === id, (id) => change((x) => { x.face.expression = id; }))));

    const acts = el("div", "row");
    acts.append(
      action("Randomise", () => { state.current = randomCharacter(); save(); render(); }, "primary"),
      action("Reset", () => { state.current = defaultCharacter(); save(); render(); }),
      action("Save to roster", () => { state.roster = [sanitizeCharacter(c), ...state.roster].slice(0, 60); state.note = "Saved to the roster."; save(); render(); }),
      action("Copy JSON", async () => { try { await navigator.clipboard.writeText(characterToJson(c)); state.note = "Character JSON copied."; } catch { state.note = "Could not copy; use Download."; } render(); }),
      action("Download JSON", () => download(`${fileName()}.json`, characterToJson(c), "application/json")),
      action("Download SVG", () => download(`${fileName()}.svg`, creatureSvg(c), "image/svg+xml")),
      action(state.importing ? "Close import" : "Import JSON", () => { state.importing = !state.importing; state.error = ""; render(); }),
    );
    panel.append(acts);
    if (state.importing) {
      const box = el("div", "group");
      const ta = el("textarea");
      ta.placeholder = "Paste character or library JSON";
      ta.value = state.importText;
      ta.addEventListener("input", () => { state.importText = ta.value; });
      box.append(ta, action("Import", () => {
        try {
          const list = importCharacters(state.importText);
          state.current = list[0];
          if (list.length > 1) state.roster = [...list.slice(1), ...state.roster].slice(0, 60);
          state.importing = false; state.importText = ""; state.note = `Imported ${list.length} character${list.length === 1 ? "" : "s"}.`; state.error = "";
          save();
        } catch (err) { state.error = err.message; }
        render();
      }, "primary"));
      panel.append(box);
    }
    if (state.note) panel.append(el("p", "note", state.note));
    if (state.error) panel.append(el("p", "err", state.error));

    const rosterBox = el("div", "group");
    rosterBox.append(el("b", "", `Roster (${state.roster.length})`));
    if (!state.roster.length) rosterBox.append(el("p", "note", "Save a creature to keep it here."));
    const grid = el("div", "roster");
    state.roster.forEach((member, i) => {
      const card = el("div", "card");
      const thumb = el("div");
      thumb.innerHTML = creatureSvg(member, { size: 64 });
      const acts2 = el("div", "acts");
      acts2.append(
        action("Open", () => { state.current = sanitizeCharacter(member); save(); render(); }),
        action("Delete", () => { state.roster = state.roster.filter((_, j) => j !== i); save(); render(); }),
      );
      card.append(thumb, el("span", "", member.name), acts2);
      grid.append(card);
    });
    rosterBox.append(grid);
    if (state.roster.length) rosterBox.append(action("Download roster", () => download("kamiji-roster.json", libraryToJson(state.roster), "application/json")));
    panel.append(rosterBox);
    panel.append(el("p", "note", "A 2D version of the Studio creature builder in FraterCCCLXIII/kamiji. Characters use the same kamiji.studio.character/1 JSON."));

    root.append(stage, panel);
    grip?.dispose();
    grip = gripColumns({ grid: root, columns: [{ el: panel, edge: "right", min: 280, max: 520, initial: 380, label: "panel" }], storageKey: "grip:kamiji" });
  }

  const instance = { openIntent };
  openMounts.add(instance);
  if (!openIntent(intent)) render();
  return () => {
    disposed = true;
    openMounts.delete(instance);
    observer?.disconnect();
    win.removeEventListener("resize", onResize);
    grip?.dispose();
    root.remove();
  };
}

export function activate(host) {
  const disposers = [host.registerPage("creature-builder", ({ container, intent }) => mount(container, { intent }))];
  // Host API additions; an older host has neither, and the page still works.
  if (typeof host.onIntent === "function") {
    disposers.push(host.onIntent((intent) => openMounts.forEach((m) => m.openIntent(intent))));
  }
  if (typeof host.registerCreateAction === "function") {
    disposers.push(host.registerCreateAction({
      id: "new-kamiji",
      label: "New Kamiji",
      description: "Start a fresh creature in the builder",
      icon: { svg: NEW_CREATURE_ICON },
      pageId: "creature-builder",
      intent: NEW_CREATURE_INTENT,
    }));
  }
  return () => disposers.forEach((dispose) => dispose?.());
}

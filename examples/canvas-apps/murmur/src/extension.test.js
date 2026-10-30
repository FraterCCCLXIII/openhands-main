import { afterEach, describe, expect, it, vi } from "vitest";
import { activate, setTransportFactory, randomRoomName, shortId, qrSvg, initialsOf, hueOf, dayLabel, STORAGE_KEY } from "./extension.js";
import { parseRoomInput, validateRelay } from "./p2p.js";

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const ADDR = "/orbitdb/zdpuAzsg8c4s4QiP9LXshwv2zFF4iueuz1V4YDgqukfqreR2k";
const RELAY = "/ip4/127.0.0.1/tcp/12345/ws/p2p/12D3KooWQP4HDzZRANvcxQmpsW1go9t7pWELnUkxxpk9DLGADCnP";

/** A fake transport: rooms live in memory, and tests push "remote" messages and status changes. */
function fakeTransport() {
  const listeners = new Set(); const rooms = new Map();
  const t = {
    opts: null, status: "relay", demo: false, identityId: "a".repeat(64), stopped: false,
    start: vi.fn(async () => t), stop: vi.fn(async () => { t.stopped = true; }),
    onEvent: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    peers: () => [],
    joinRoom: vi.fn(async (input) => {
      const name = input.kind === "name" ? input.value : "shared";
      const address = input.kind === "address" ? input.value : `/orbitdb/zdpu-${name}`;
      if (!rooms.has(address)) {
        const subs = new Set(); const log = [];
        rooms.set(address, { address, name, history: async () => [...log], send: async (text) => { const m = { id: `h${log.length}`, author: t.opts.displayName, authorId: t.identityId, text, ts: 1000 + log.length }; log.push(m); return m; }, onMessage: (fn) => { subs.add(fn); return () => subs.delete(fn); }, receive: (m) => { log.push(m); subs.forEach((f) => f(m)); } });
      }
      return rooms.get(address);
    }),
    emit: (e) => listeners.forEach((f) => f(e)), rooms,
  };
  return t;
}

let current;
function mountApp(saved) {
  localStorage.clear();
  if (saved) localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  setTransportFactory((opts) => { current = fakeTransport(); current.opts = opts; return current; });
  let mountFn;
  activate({ apiVersion: "1", registerPage: (_id, fn) => { mountFn = fn; return () => {}; } });
  const container = document.createElement("div");
  document.body.append(container);
  return { container, dispose: mountFn({ container }) };
}
const byText = (c, sel, t) => [...c.querySelectorAll(sel)].find((n) => n.textContent.includes(t));
afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });

describe("helpers", () => {
  it("parses names and addresses, and rejects empty input", () => {
    expect(parseRoomInput("  my room ")).toEqual({ kind: "name", value: "my-room" });
    expect(parseRoomInput(ADDR)).toEqual({ kind: "address", value: ADDR });
    expect(parseRoomInput("   ")).toBeNull();
  });
  it("validates relay multiaddrs", () => {
    expect(validateRelay(RELAY).ok).toBe(true);
    expect(validateRelay("nonsense").ok).toBe(false);
    expect(validateRelay("/ip4/1.2.3.4/tcp/4001/p2p/12D3KooWQP4HDzZRANvcxQmpsW1go9t7pWELnUkxxpk9DLGADCnP").ok).toBe(false); // not a websocket address
    expect(validateRelay("/ip4/127.0.0.1/tcp/1/ws").ok).toBe(false); // no peer id
  });
  it("makes room names and short ids", () => {
    expect(randomRoomName(() => 0)).toMatch(/^amber-otter-\d\d$/);
    expect(shortId("abcdefghijklmnop")).toBe("abcdef…mnop");
    expect(qrSvg(ADDR).getAttribute("role")).toBe("img");
  });
});

describe("Murmur UI", () => {
  it("shows identity, starts the transport with saved relays and name, and reports status", async () => {
    const { container } = mountApp({ name: "ada", relays: [RELAY], rooms: [] });
    await tick();
    expect(current.opts).toMatchObject({ relays: [RELAY], displayName: "ada" });
    expect(container.textContent).toContain("id aaaaaa…aaaa");
    expect(container.querySelector("#mr-status").textContent).toBe("Connected to relay");
    current.emit({ type: "status", status: "connecting", peers: [] });
    expect(container.querySelector("#mr-status").textContent).toBe("Connecting to relay");
  });

  it("creates a room, sends a message, and persists the room list", async () => {
    const { container } = mountApp({ name: "ada" });
    await tick();
    byText(container, "button", "New room").click(); await tick();
    const ta = container.querySelector(".composer textarea");
    ta.value = "hello"; ta.dispatchEvent(new Event("input"));
    container.querySelector(".composer").dispatchEvent(new Event("submit", { cancelable: true })); await tick();
    expect(container.querySelector(".log").textContent).toContain("hello");
    expect(container.querySelector(".msg.mine")).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).rooms).toHaveLength(1);
  });

  it("joins by shared address and shows messages that arrive from another peer", async () => {
    const { container } = mountApp({ name: "ada" });
    await tick();
    const ji = container.querySelector('input[aria-label="Room name or address"]');
    ji.value = ADDR; ji.dispatchEvent(new Event("input"));
    byText(container, "button", "Join").click(); await tick();
    expect(current.joinRoom).toHaveBeenCalledWith({ kind: "address", value: ADDR });
    current.rooms.get(ADDR).receive({ id: "x1", author: "bo", authorId: "b".repeat(64), text: "hi from afar", ts: 5 });
    expect(container.querySelector(".log").textContent).toContain("hi from afar");
    expect(container.querySelector(".log .msg:not(.mine)").textContent).toContain("bo");
    expect(container.querySelector(".rail .row .prev").textContent).toBe("hi from afar");
  });

  it("shows the room address and a QR code in the share popover", async () => {
    const { container } = mountApp({ name: "ada" });
    await tick();
    byText(container, "button", "New room").click(); await tick();
    container.querySelector('button[aria-label="Share this room"]').click();
    expect(container.querySelector(".pop code").textContent).toMatch(/^\/orbitdb\//);
    expect(container.querySelector('.pop svg[role="img"]')).toBeTruthy();
    const writeText = vi.fn(async () => {}); vi.stubGlobal("navigator", { clipboard: { writeText } });
    byText(container, "button", "Copy address").click(); await tick();
    expect(writeText).toHaveBeenCalled();
  });

  it("validates relay settings before saving, then restarts the transport", async () => {
    const { container } = mountApp({ name: "ada" });
    await tick();
    const first = current;
    container.querySelector('button[aria-label="Settings"]').click();
    const ta = container.querySelector(".pop textarea");
    ta.value = "not-a-relay"; ta.dispatchEvent(new Event("input"));
    byText(container, "button", "Save and reconnect").click();
    expect(container.querySelector('.pop [role="alert"]').textContent).toContain("not-a-relay");
    expect(current).toBe(first);
    const ta2 = container.querySelector(".pop textarea");
    ta2.value = RELAY; ta2.dispatchEvent(new Event("input"));
    byText(container, "button", "Save and reconnect").click(); await tick();
    expect(first.stopped).toBe(true);
    expect(current.opts.relays).toEqual([RELAY]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).relays).toEqual([RELAY]);
  });

  it("says 'No relay set' when none is configured and the transport reports it", async () => {
    // the fake reports "relay"; a real transport with no relays reports no-relay
    const { container } = mountApp({ name: "ada", relays: [] });
    current.status = "no-relay";
    current.emit({ type: "status", status: "no-relay", peers: [] });
    expect(container.querySelector("#mr-status").textContent).toBe("No relay set");
  });
});

describe("Murmur layout", () => {
  const key = (el, k, shiftKey = false) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, shiftKey, bubbles: true, cancelable: true }));
  const drag = (h, from, to) => {
    h.dispatchEvent(new MouseEvent("pointerdown", { clientX: from, bubbles: true }));
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: to, bubbles: true }));
    document.dispatchEvent(new MouseEvent("pointerup", { clientX: to, bubbles: true }));
  };

  it("sizes its root to the window below its own top, with a 480px floor", async () => {
    vi.stubGlobal("innerHeight", 900);
    const { container } = mountApp({ name: "ada" });
    await tick();
    const root = container.querySelector(".mr");
    root.getBoundingClientRect = () => ({ top: 120 });
    window.dispatchEvent(new Event("resize"));
    expect(root.style.height).toBe("780px");
    vi.stubGlobal("innerHeight", 300);
    window.dispatchEvent(new Event("resize"));
    expect(root.style.height).toBe("480px");
  });

  it("welcomes a new user with start/join actions, relay help and the Built with row", async () => {
    const { container } = mountApp({ name: "ada" });
    await tick();
    const w = container.querySelector(".welcome");
    expect(w.hidden).toBe(false);
    expect(byText(w, "button", "Start a room")).toBeTruthy();
    expect(w.querySelector(".powered").textContent).toContain("Built with");
    expect(w.querySelectorAll(".powered a[href]")).toHaveLength(2);
    byText(w, "button", "Join with an address").click();
    expect(w.querySelector('input[aria-label="Room address to join"]')).toBeTruthy();
    byText(w, "button", "Start a room").click(); await tick();
    expect(container.querySelector(".welcome").hidden).toBe(true);
    expect(container.querySelectorAll(".rail .row")).toHaveLength(1);
  });

  it("lists rooms with a preview and an unread dot, which clears when the room is opened", async () => {
    const { container } = mountApp({ name: "ada" });
    await tick();
    byText(container, "button", "New room").click(); await tick();
    const first = [...current.rooms.values()][0].address;
    byText(container, "button", "New room").click(); await tick();
    expect(container.querySelectorAll(".rail .row")).toHaveLength(2);
    current.rooms.get(first).receive({ id: "u1", author: "bo", authorId: "b".repeat(64), text: "ping", ts: 9 });
    const row = () => container.querySelector(`.rail .row:nth-child(2)`);
    expect(row().querySelector(".dot")).toBeTruthy();
    expect(row().textContent).toContain("ping");
    row().click();
    expect(container.querySelector(".rail .row .dot")).toBeNull();
  });

  it("groups consecutive messages from one author and separates days", async () => {
    const { container } = mountApp({ name: "ada" });
    await tick();
    byText(container, "button", "New room").click(); await tick();
    const room = [...current.rooms.values()][0];
    const b = "b".repeat(64);
    const day = 86400000;
    room.receive({ id: "g1", author: "bo", authorId: b, text: "one", ts: day });
    room.receive({ id: "g2", author: "bo", authorId: b, text: "two", ts: day + 1000 });
    room.receive({ id: "g3", author: "bo", authorId: b, text: "three", ts: 3 * day });
    const rows = [...container.querySelectorAll(".log .msg")];
    expect(rows.map((r) => r.classList.contains("cont"))).toEqual([false, true, false]);
    expect(container.querySelectorAll(".log .who b")).toHaveLength(2);
    expect(container.querySelectorAll('.log [role="separator"]')).toHaveLength(2);
  });

  it("sends on Enter, keeps a newline on Shift+Enter, and disables Send when empty", async () => {
    const { container } = mountApp({ name: "ada" });
    await tick();
    byText(container, "button", "New room").click(); await tick();
    const ta = container.querySelector(".composer textarea");
    const send = container.querySelector('button[aria-label="Send"]');
    expect(send.disabled).toBe(true);
    ta.value = "line one"; ta.dispatchEvent(new Event("input"));
    expect(send.disabled).toBe(false);
    key(ta, "Enter", true);
    expect(container.querySelector(".log").textContent).not.toContain("line one");
    key(ta, "Enter"); await tick();
    expect(container.querySelector(".log").textContent).toContain("line one");
    expect(ta.value).toBe("");
    expect(send.disabled).toBe(true);
  });

  it("filters rooms as you type in the join box, and Enter joins", async () => {
    const { container } = mountApp({ name: "ada" });
    await tick();
    const ji = container.querySelector('input[aria-label="Room name or address"]');
    for (const n of ["alpha", "beta"]) { ji.value = n; ji.dispatchEvent(new Event("input")); key(ji, "Enter"); await tick(); }
    expect(container.querySelectorAll(".rail .row")).toHaveLength(2);
    ji.value = "bet"; ji.dispatchEvent(new Event("input"));
    expect([...container.querySelectorAll(".rail .row .name")].map((n) => n.textContent)).toEqual(["beta"]);
    ji.value = "gamma"; ji.dispatchEvent(new Event("input"));
    key(ji, "Enter"); await tick();
    expect(current.joinRoom).toHaveBeenCalledWith({ kind: "name", value: "gamma" });
  });

  it("has a rooms-column grip that resizes by drag and keyboard and persists", async () => {
    const first = mountApp({ name: "ada" });
    await tick();
    const grip = first.container.querySelector('.shell > .grip[data-grip="0"]');
    expect(grip.getAttribute("role")).toBe("separator");
    drag(grip, 280, 340);
    expect(first.container.querySelector(".shell").style.getPropertyValue("--grip-0")).toBe("340px");
    key(grip, "ArrowRight");
    expect(first.container.querySelector(".shell").style.getPropertyValue("--grip-0")).toBe("356px");
    expect(JSON.parse(localStorage.getItem("grip:murmur"))).toEqual({ 0: 356 });
    first.dispose(); document.body.replaceChildren();
    const saved = localStorage.getItem("grip:murmur");
    setTransportFactory((opts) => { current = fakeTransport(); current.opts = opts; return current; });
    let mountFn; activate({ apiVersion: "1", registerPage: (_id, fn) => { mountFn = fn; return () => {}; } });
    const container = document.createElement("div"); document.body.append(container); mountFn({ container });
    expect(localStorage.getItem("grip:murmur")).toBe(saved);
    expect(container.querySelector(".shell").style.getPropertyValue("--grip-0")).toBe("356px");
  });

  it("derives stable avatar initials and tints", () => {
    expect(initialsOf("bird-1234")).toBe("B1");
    expect(initialsOf("ada")).toBe("AD");
    expect(hueOf("abc")).toBe(hueOf("abc"));
    expect(dayLabel(Date.now())).toBe("Today");
  });
});

// --- text/background legibility of solid buttons, resolved through the real cascade ---
// The host's own tokens for dark and light (src/tailwind.css, light-plus.ts); jsdom resolves the
// cascade but not var(), so chains are followed by hand.
const HOST_THEMES = {
  dark: { "--oh-contrast": "#ffffff", "--oh-contrast-foreground": "#000000", "--oh-color-base": "#0b0e14", "--oh-color-base-secondary": "#21252f", "--oh-foreground": "#eef2f7", "--oh-muted": "#a3b0c4", "--oh-border-subtle": "#383f50", "--oh-danger": "#e76a5e", "--oh-color-primary": "#c9b974", "--oh-accent-foreground": "#0b0e14", "--oh-surface-raised": "#2c313f", "--oh-feedback-warning": "#c9b974" },
  light: { "--oh-contrast": "#1f1f1f", "--oh-contrast-foreground": "#ffffff", "--oh-color-base": "#ffffff", "--oh-color-base-secondary": "#f3f3f3", "--oh-foreground": "#1f1f1f", "--oh-muted": "#616161", "--oh-border-subtle": "#d1d1d1", "--oh-danger": "#c12a1c", "--oh-color-primary": "#007acc", "--oh-accent-foreground": "#ffffff", "--oh-surface-raised": "#ececec", "--oh-feedback-warning": "#7d5d08" },
};
function resolveVars(el, value, depth = 0) {
  return value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (_m, name, fallback) => {
    let v = "";
    for (let e = el; e && !v; e = e.parentElement) v = getComputedStyle(e).getPropertyValue(name).trim();
    v = v || (fallback || "").trim();
    return depth < 10 ? resolveVars(el, v, depth + 1) : v;
  });
}
function toRgb(css) {
  const mix = css.match(/^color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+)\)$/);
  if (mix) { const [x, y, p] = [toRgb(mix[1]), toRgb(mix[3]), +mix[2] / 100]; return x.map((v, i) => v * p + y[i] * (1 - p)); }
  const rgb = css.match(/rgba?\(([^)]+)\)/);
  if (rgb) return rgb[1].split(",").slice(0, 3).map(parseFloat);
  const h = css.replace("#", "").replace(/^(.)(.)(.)$/, "$1$1$2$2$3$3");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function luminance(css) {
  const [r, g, bl] = toRgb(css).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}
function contrastRatio(el) {
  const cs = getComputedStyle(el);
  const color = resolveVars(el, cs.color).trim();
  const background = resolveVars(el, cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : cs.getPropertyValue("background")).trim();
  const [a, b] = [luminance(color), luminance(background)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
const useHostTheme = (name) => Object.entries(HOST_THEMES[name]).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));

describe("solid button legibility", () => {
  afterEach(() => document.documentElement.removeAttribute("style"));

  it.each(["dark", "light"])("keeps the primary button and the send button readable in the %s host theme", (theme) => {
    useHostTheme(theme);
    const { container, dispose } = mountApp();
    const primary = container.querySelector(".pbtn");
    const send = container.querySelector(".send");
    expect(primary).not.toBeNull();
    expect(contrastRatio(primary)).toBeGreaterThanOrEqual(4.5);
    expect(send.disabled).toBe(true);
    expect(contrastRatio(send)).toBeGreaterThanOrEqual(3);
    // fading a solid button with opacity blends its glyph into the page (it measured 2.1:1); disabled is shown with muted colours instead
    expect(Number(getComputedStyle(send).opacity || 1)).toBe(1);
    dispose();
  });
});

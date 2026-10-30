import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ALLOW, GAMES, SANDBOX, activate } from "./extension.js";

const STORAGE_KEY = "canvas-extension-arcade:v1";

function mountPage() {
  let mount;
  activate({ registerPage: (_id, fn) => { mount = fn; return () => {}; } });
  const container = document.createElement("div");
  document.body.append(container);
  return { container, dispose: mount({ container }) };
}
const pick = (container, id) => container.querySelector(`[data-game="${id}"]`).click();

beforeEach(() => localStorage.clear());
afterEach(() => { document.body.innerHTML = ""; });

describe("arcade", () => {
  it("lists every game with its status and does not load a frame for coming-soon games", () => {
    const { container, dispose } = mountPage();
    for (const g of GAMES) expect(container.querySelector(`[data-game="${g.id}"]`).textContent).toContain(g.title);

    pick(container, "kamikin");
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.textContent).toContain("no web build");
    pick(container, "kosmica");
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.textContent).toContain("coming soon");
    dispose();
  });

  it("runs a ready game in a sandboxed iframe with reload and open-in-new-tab controls", () => {
    const { container, dispose } = mountPage();
    const frame = container.querySelector("iframe");
    expect(frame.getAttribute("src")).toBe("/kamiji-experiments/kamiji-game/index.html");
    expect(frame.getAttribute("sandbox")).toBe(SANDBOX);
    expect(frame.getAttribute("allow")).toBe(ALLOW);
    expect(frame.getAttribute("title")).toMatch(/^Kamiji.? pet game$/);

    const open = container.querySelector('[data-action="open"]');
    expect(open.getAttribute("href")).toBe("/kamiji-experiments/kamiji-game/index.html");
    expect(open.getAttribute("target")).toBe("_blank");
    expect(open.getAttribute("rel")).toContain("noopener");

    expect(container.querySelector(".loading").hidden).toBe(false);
    frame.dispatchEvent(new Event("load"));
    expect(container.querySelector(".loading").hidden).toBe(true);
    container.querySelector('[data-action="reload"]').click();
    expect(container.querySelector(".loading").hidden).toBe(false);
    dispose();
  });

  it("does not focus the game until Play is pressed", () => {
    const { container, dispose } = mountPage();
    const frame = container.querySelector("iframe");
    expect(document.activeElement).not.toBe(frame);
    container.querySelector('[data-action="play"]').click();
    expect(document.activeElement).toBe(frame);
    dispose();
  });

  it("opens Yakopop in a new tab instead of framing a site that refuses framing", () => {
    const { container, dispose } = mountPage();
    pick(container, "yakopop");
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector('[data-action="open"]').getAttribute("href")).toBe("https://yakopop.com");
    dispose();
  });

  it("remembers the last played game across mounts and ignores coming-soon picks", () => {
    const first = mountPage();
    pick(first.container, "kamikin");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    pick(first.container, "yakopop");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).lastPlayed).toBe("yakopop");
    first.dispose();

    const second = mountPage();
    expect(second.container.querySelector('[data-game="yakopop"]').getAttribute("aria-pressed")).toBe("true");
    second.dispose();

    localStorage.setItem(STORAGE_KEY, "{not json");
    const third = mountPage();
    expect(third.container.querySelector("iframe")).not.toBeNull();
    third.dispose();
  });

  it("removes its markup on unmount", () => {
    const { container, dispose } = mountPage();
    expect(container.querySelector(".ar")).not.toBeNull();
    dispose();
    expect(container.querySelector(".ar")).toBeNull();
    expect(container.querySelector("style")).toBeNull();
  });
});

describe("page height", () => {
  afterEach(() => { window.innerHeight = 768; });

  it("fills the viewport below the app's top edge and follows window resizes, never below 480px", () => {
    window.innerHeight = 900;
    const { container, dispose } = mountPage();
    const root = container.querySelector(".ar");
    expect(root.style.height).toBe("900px");

    window.innerHeight = 1000;
    window.dispatchEvent(new Event("resize"));
    expect(root.style.height).toBe("1000px");

    window.innerHeight = 300;
    window.dispatchEvent(new Event("resize"));
    expect(root.style.height).toBe("480px");
    dispose();
  });
});

// --- text/background legibility of solid buttons, resolved through the real cascade ---
// The host's own tokens for dark and light (src/tailwind.css, light-plus.ts); jsdom resolves the
// cascade but not var(), so chains are followed by hand.
const HOST_THEMES = {
  dark: { "--oh-contrast": "#ffffff", "--oh-contrast-foreground": "#000000", "--oh-color-base": "#0b0e14", "--oh-color-base-secondary": "#21252f", "--oh-foreground": "#eef2f7", "--oh-muted": "#a3b0c4", "--oh-border-subtle": "#383f50", "--oh-danger": "#e76a5e" },
  light: { "--oh-contrast": "#1f1f1f", "--oh-contrast-foreground": "#ffffff", "--oh-color-base": "#ffffff", "--oh-color-base-secondary": "#f3f3f3", "--oh-foreground": "#1f1f1f", "--oh-muted": "#616161", "--oh-border-subtle": "#d1d1d1", "--oh-danger": "#c12a1c" },
};
function resolveVars(el, value, depth = 0) {
  return value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (_m, name, fallback) => {
    let v = "";
    for (let e = el; e && !v; e = e.parentElement) v = getComputedStyle(e).getPropertyValue(name).trim();
    v = v || (fallback || "").trim();
    return depth < 10 ? resolveVars(el, v, depth + 1) : v;
  });
}
function luminance(css) {
  const rgb = css.match(/rgba?\(([^)]+)\)/);
  const parts = rgb ? rgb[1].split(",").map((n) => parseFloat(n) / 255)
    : (() => { const h = css.replace("#", "").replace(/^(.)(.)(.)$/, "$1$1$2$2$3$3"); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); })();
  const [r, g, bl] = parts.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
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

describe("button legibility", () => {
  afterEach(() => document.documentElement.removeAttribute("style"));

  it.each(["dark", "light"])("keeps every button label readable on its background in the %s host theme", (theme) => {
    useHostTheme(theme);
    const { container, dispose } = mountPage();
    pick(container, GAMES.find((g) => g.url).id);
    const buttons = [...container.querySelectorAll(".btn, .game")];
    expect(buttons.length).toBeGreaterThan(2);
    for (const b of buttons) expect(contrastRatio(b), b.textContent).toBeGreaterThanOrEqual(4.5);
    dispose();
  });
});

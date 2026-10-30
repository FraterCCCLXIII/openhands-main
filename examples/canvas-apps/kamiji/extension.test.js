import { afterEach, describe, expect, it } from "vitest";
import {
  PARTS,
  activate,
  characterToJson,
  creatureSvg,
  defaultCharacter,
  importCharacters,
  libraryToJson,
  randomCharacter,
  sanitizeCharacter,
} from "./extension.js";

describe("characters", () => {
  it("drops unknown parts, clamps sliders and rejects bad colours", () => {
    const c = sanitizeCharacter({
      name: "  Mira  ",
      plan: "fox",
      parts: { ears: "antlers", tail: "long" },
      morphs: { width: 9, height: "wide" },
      materials: { body: { color: "red" }, belly: { color: "#ABCDEF" } },
      face: { expression: "furious" },
    });

    expect(c.name).toBe("Mira");
    expect(c.parts.ears).toBe(defaultCharacter("fox").parts.ears);
    expect(c.parts.tail).toBe("long");
    expect(c.morphs.width).toBe(1);
    expect(c.morphs.height).toBe(0);
    expect(c.materials.body.color).toBe(defaultCharacter("fox").materials.body.color);
    expect(c.materials.belly.color).toBe("#abcdef");
    expect(c.face.expression).toBe("happy");
  });

  it("builds a valid random creature from an injected random source", () => {
    let n = 0;
    const rand = () => { n = (n + 0.37) % 1; return n; };
    const c = randomCharacter(rand);

    expect(c).toEqual(sanitizeCharacter(c));
    Object.keys(PARTS).forEach((slot) => expect(PARTS[slot]).toContain(c.parts[slot]));
  });

  it("round-trips single characters and libraries through JSON", () => {
    const c = sanitizeCharacter({ ...defaultCharacter("bunny"), name: "Pip" });

    expect(importCharacters(characterToJson(c))).toEqual([c]);
    expect(importCharacters(libraryToJson([c, c])).length).toBe(2);
  });

  it("explains why an import failed", () => {
    expect(() => importCharacters("nope")).toThrow(/valid JSON/);
    expect(() => importCharacters('{"hello":1}')).toThrow(/No Kamiji character/);
  });
});

describe("drawing", () => {
  it("draws the chosen parts and colours", () => {
    const c = sanitizeCharacter({ ...defaultCharacter("dragon"), materials: { body: { color: "#112233" } } });
    const svg = creatureSvg(c);

    expect(svg).toContain("#112233");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(creatureSvg({ ...c, parts: { ...c.parts, wings: "none" } }).length).toBeLessThan(svg.length);
  });

  it("escapes a creature's name in its label", () => {
    expect(creatureSvg({ ...defaultCharacter(), name: '<b>"x"</b>' })).not.toContain("<b>");
  });
});

describe("the page", () => {
  it("mounts, switches body plan, and saves to the roster", async () => {
    localStorage.clear();
    let mount;
    activate({ registerPage: (_id, fn) => { mount = fn; return () => {}; } });
    const container = document.createElement("div");
    document.body.append(container);

    const dispose = mount({ container });
    expect(container.querySelector(".stage svg")).not.toBeNull();
    const fox = [...container.querySelectorAll("button")].find((b) => b.textContent === "Fox");
    fox.click();
    [...container.querySelectorAll("button")].find((b) => b.textContent === "Save to roster").click();

    expect(container.querySelectorAll(".roster .card").length).toBe(1);
    dispose();
    expect(container.querySelector(".kj")).toBeNull();
  });
});

describe("resizable panel", () => {
  const drag = (handle, from, to) => {
    handle.dispatchEvent(new MouseEvent("pointerdown", { clientX: from, bubbles: true }));
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: to, bubbles: true }));
    document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
  };
  const mountPage = () => {
    let mount;
    activate({ registerPage: (_id, fn) => { mount = fn; return () => {}; } });
    const container = document.createElement("div");
    document.body.append(container);
    return { container, dispose: mount({ container }) };
  };

  it("drags the panel edge, keeps one handle across renders, and restores the width on remount", () => {
    localStorage.clear();
    const first = mountPage();
    const root = first.container.querySelector(".kj");
    const handle = root.querySelector(".grip");
    expect(handle.getAttribute("role")).toBe("separator");

    drag(handle, 500, 450);
    expect(root.style.getPropertyValue("--grip-0")).toBe("430px");

    [...first.container.querySelectorAll("button")].find((b) => b.textContent === "Fox").click();
    expect(first.container.querySelectorAll(".grip").length).toBe(1);
    first.dispose();

    const second = mountPage();
    expect(second.container.querySelector(".kj").style.getPropertyValue("--grip-0")).toBe("430px");
    second.dispose();
    document.body.replaceChildren();
  });
});

// --- text/background legibility of solid buttons, resolved through the real cascade ---
// The host's own tokens for dark and light (src/tailwind.css, light-plus.ts); jsdom resolves the
// cascade but not var(), so chains are followed by hand.
const HOST_THEMES = {
  dark: { "--oh-contrast": "#ffffff", "--oh-contrast-foreground": "#000000", "--oh-color-base": "#0b0e14", "--oh-color-base-secondary": "#21252f", "--oh-foreground": "#eef2f7", "--oh-muted": "#a3b0c4", "--oh-border-subtle": "#383f50", "--oh-danger": "#e76a5e" },
  "inverted-page": { "--oh-contrast": "#ffffff", "--oh-contrast-foreground": "#000000", "--oh-color-base": "#ffffff", "--oh-color-base-secondary": "#eeeeee", "--oh-foreground": "#111111", "--oh-muted": "#555555", "--oh-border-subtle": "#cccccc", "--oh-danger": "#c12a1c" },
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

describe("solid button legibility", () => {
  afterEach(() => { document.documentElement.removeAttribute("style"); document.body.replaceChildren(); });

  it.each(["dark", "light", "inverted-page"])("keeps pressed and primary buttons readable on their contrast fill in the %s host theme", (theme) => {
    useHostTheme(theme);
    localStorage.clear();
    let mount;
    activate({ registerPage: (_id, fn) => { mount = fn; return () => {}; } });
    const container = document.createElement("div");
    document.body.append(container);
    mount({ container });
    const solid = [...container.querySelectorAll('button[aria-pressed="true"], button.primary')];
    expect(solid.length).toBeGreaterThan(1);
    for (const b of solid) expect(contrastRatio(b), b.textContent).toBeGreaterThanOrEqual(4.5);
  });
});

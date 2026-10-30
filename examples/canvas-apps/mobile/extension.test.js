import { afterEach, describe, expect, it, vi } from "vitest";
import { FALLBACKS, FEATURES, PAIR_ROUTE, SETUP_ROUTE, STEPS, activate, maskUrl, mountPage } from "./extension.js";

function fakeHost() {
  const pages = new Map();
  return { pages, navigate: vi.fn(), registerPage: vi.fn((id, mount) => { pages.set(id, mount); return () => pages.delete(id); }) };
}
function mount() {
  const host = fakeHost();
  const dispose = activate(host);
  const container = document.createElement("div");
  document.body.append(container);
  const cleanup = host.pages.get("mobile")({ container, path: "/mobile", navigate: host.navigate });
  return { host, container, cleanup, dispose };
}
afterEach(() => { document.body.replaceChildren(); });

describe("activate", () => {
  it("registers the page declared in the manifest and unregisters on dispose", () => {
    const { host, dispose } = mount();
    expect(host.registerPage).toHaveBeenCalledWith("mobile", expect.any(Function));
    dispose();
    expect(host.pages.has("mobile")).toBe(false);
  });
});

describe("page content", () => {
  it("renders the hero with the app name, icon and honest status", () => {
    const { container } = mount();
    expect(container.querySelector("h1").textContent).toBe("OpenHands Mobile");
    expect(container.querySelector(".brand img").src).toMatch(/^data:image\/png;base64,/);
    expect(container.querySelector(".status").textContent).toMatch(/build and run it from source/);
    expect(container.textContent).not.toMatch(/App Store|Google Play|rating|downloads/i);
  });
  it("renders every feature with a labelled illustration", () => {
    const { container } = mount();
    const articles = [...container.querySelectorAll("article.feature")];
    expect(articles.map((a) => a.querySelector("h3").textContent)).toEqual(FEATURES.map((f) => f.title));
    articles.forEach((a) => {
      expect(a.querySelector("[role=img]").getAttribute("aria-label")).toMatch(/^Illustration of/);
      expect(a.querySelector("figcaption").textContent).toBe("Illustration, not a screenshot");
    });
  });
  it("renders the pairing steps as an ordered list under a heading", () => {
    const { container } = mount();
    expect([...container.querySelectorAll("h2")].map((h) => h.textContent)).toContain("How pairing works");
    expect(container.querySelectorAll("ol.steps > li")).toHaveLength(STEPS.length);
  });
  it("builds icons from data-URL masks, not markup", () => {
    const { container } = mount();
    const ico = container.querySelector(".ico");
    expect(ico.style.getPropertyValue("--mb-mask")).toBe(maskUrl("qr"));
    expect(ico.children).toHaveLength(0);
  });
});

describe("buttons", () => {
  it("Pair your phone navigates to the Settings Mobile page", () => {
    const { host, container } = mount();
    const btn = container.querySelector("[data-action=pair]");
    expect(btn.textContent).toBe("Pair your phone");
    btn.click();
    expect(host.navigate).toHaveBeenCalledWith("/settings/mobile");
    expect(PAIR_ROUTE).toBe("/settings/mobile");
  });
  it("Mobile app setup navigates to the Settings App page", () => {
    const { host, container } = mount();
    container.querySelector("[data-action=setup]").click();
    expect(host.navigate).toHaveBeenCalledWith(SETUP_ROUTE);
  });
});

describe("page height", () => {
  it("fills the visible page on mount, follows resizes, and stops after cleanup", () => {
    const original = window.innerHeight;
    try {
      window.innerHeight = 900;
      const { container, cleanup } = mount();
      const root = container.querySelector(".mb");
      expect(root.style.height).toBe("900px");
      window.innerHeight = 1200;
      window.dispatchEvent(new Event("resize"));
      expect(root.style.height).toBe("1200px");
      window.innerHeight = 300;
      window.dispatchEvent(new Event("resize"));
      expect(root.style.height).toBe("480px");
      cleanup();
      window.innerHeight = 700;
      window.dispatchEvent(new Event("resize"));
      expect(root.style.height).toBe("480px");
    } finally {
      window.innerHeight = original;
    }
  });
  it("has a CSS fallback height and a hidden rule", () => {
    const css = mount().container.querySelector("style").textContent;
    expect(css).toMatch(/height: 100%; min-height: 480px/);
    expect(css).toMatch(/\.mb\[hidden\] \{ display: none; \}/);
  });
});

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

describe("contrast", () => {
  it("keeps every text and background token pair at 4.5:1 or better", () => {
    const F = FALLBACKS;
    const pairs = [["text", "bg"], ["muted", "bg"], ["text", "panel"], ["muted", "panel"], ["onContrast", "contrast"], ["onAccent", "accent"], ["phoneText", "phoneBg"], ["phoneMuted", "phoneBg"], ["phoneText", "phoneRaised"], ["phoneMuted", "phoneRaised"]];
    for (const [fg, bg] of pairs) expect(ratio(F[fg], F[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
  it("gives every solid fill its own foreground token", () => {
    const css = mount().container.querySelector("style").textContent;
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim(), body }));
    const decl = (body, prop) => new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;]+)`).exec(body)?.[1].trim();
    for (const { sel, body } of rules) {
      if (/::|qrbox/.test(sel)) continue; // pseudo-elements and the text-free QR drawing
      const bg = decl(body, "background");
      const color = decl(body, "color");
      if (bg === "var(--mb-contrast)") expect(color, sel).toBe("var(--mb-on-contrast)");
      if (bg === "var(--mb-accent)") expect(color, sel).toBe("var(--mb-on-accent)");
      if (bg === "#FFFFFF") expect(color, sel).toBe("#000000");
    }
  });
});

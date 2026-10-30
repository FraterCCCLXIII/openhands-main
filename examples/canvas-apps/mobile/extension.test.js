import { afterEach, describe, expect, it, vi } from "vitest";
import { CLONE_COMMAND, FALLBACKS, FEATURES, INSTALL_BLOCKS, PAIR_ROUTE, REPO_URL, SETUP_ROUTE, SPECS, STEPS, activate, maskUrl, qrCells } from "./extension.js";

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
afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); vi.restoreAllMocks(); delete Element.prototype.scrollIntoView; });

describe("activate", () => {
  it("registers the page declared in the manifest and unregisters on dispose", () => {
    const { host, dispose } = mount();
    expect(host.registerPage).toHaveBeenCalledWith("mobile", expect.any(Function));
    dispose();
    expect(host.pages.has("mobile")).toBe(false);
  });
});

describe("hero", () => {
  it("has one h1, the OpenHands logo, a Download button and an honest status line", () => {
    const { container } = mount();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1").textContent).toMatch(/OpenHands/);
    const logo = container.querySelector(".brand img");
    expect(logo.alt).toBe("OpenHands logo");
    expect(logo.src).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(container.querySelector(".hero [data-action=download]").textContent).toBe("Download");
    expect(container.querySelector(".hero").textContent).toMatch(/Not in any app store yet/);
  });
  it("shows no store badges, ratings or remote images", () => {
    const { container } = mount();
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.textContent).not.toMatch(/\d\.\d ?(stars|\/ ?5)|\bratings?\b|\d+k? downloads/i);
    const hrefs = [...container.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([REPO_URL]);
    expect(container.querySelector("style").textContent).not.toMatch(/https?:\/\/|@import/);
  });
});

describe("feature sections", () => {
  it("renders every feature as a heading with a labelled illustration", () => {
    const { container } = mount();
    const secs = [...container.querySelectorAll("section.fx")];
    expect(secs.map((a) => a.querySelector("h2").textContent)).toEqual(FEATURES.map((f) => f.title));
    secs.forEach((a) => {
      expect(a.querySelector("[role=img]").getAttribute("aria-label")).toMatch(/^Illustration of/);
      expect(a.querySelector("figcaption").textContent).toBe("Illustration, not a screenshot");
    });
  });
  it("renders the specs strip and pairing steps", () => {
    const { container } = mount();
    expect(container.querySelectorAll(".specs > li")).toHaveLength(SPECS.length);
    expect(container.querySelector(".specs").textContent).toMatch(/0\.1\.0/);
    expect(container.querySelectorAll("ol.steps > li")).toHaveLength(STEPS.length);
  });
  it("builds icons from data-URL masks, not markup", () => {
    const { container } = mount();
    const ico = container.querySelector(".ico");
    expect(ico.style.getPropertyValue("--mb-mask")).toMatch(/^url\("data:image\/svg\+xml,/);
    expect(maskUrl("qr")).toMatch(/^url\("data:image\/svg\+xml,/);
    expect(ico.children).toHaveLength(0);
    expect(qrCells()).toHaveLength(121);
  });
});

describe("download", () => {
  it("the hero Download button scrolls to the #download section", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const { container } = mount();
    container.querySelector(".hero [data-action=download]").click();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(container.querySelector("section#download"));
  });
  it("says plainly that no prebuilt app exists and links only to the source repository", () => {
    const { container } = mount();
    const sec = container.querySelector("#download");
    expect(sec.textContent).toMatch(/No prebuilt app is published yet\. Build it from source in about 3 steps\./);
    const link = sec.querySelector("a[data-action=repo]");
    expect(link.href).toBe(`${REPO_URL}`);
    expect(link.rel).toMatch(/noopener/);
    expect(link.textContent).toBe("Download from GitHub");
    expect(sec.querySelectorAll("article.card")).toHaveLength(INSTALL_BLOCKS.length);
  });
  it("shows the clone command and Copy writes it to the clipboard with a live 'Copied'", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { container } = mount();
    const card = container.querySelector("[data-install=source]");
    expect(card.querySelector("pre").textContent).toBe(CLONE_COMMAND);
    expect(CLONE_COMMAND.split("\n")[0]).toBe("git clone https://github.com/OpenHands/openhands-mobile.git");
    const btn = card.querySelector("button.copy");
    btn.click();
    await vi.waitFor(() => expect(btn.textContent).toBe("Copied"));
    expect(writeText).toHaveBeenCalledWith(CLONE_COMMAND);
    const live = card.querySelector("[aria-live=polite]");
    expect(live.getAttribute("role")).toBe("status");
    expect(live.textContent).toBe("Copied");
  });
  it("falls back to execCommand when the async clipboard is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    document.execCommand = vi.fn(() => true);
    const { container } = mount();
    const btn = container.querySelector("[data-install=ios] button.copy");
    btn.click();
    await vi.waitFor(() => expect(btn.textContent).toBe("Copied"));
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    delete document.execCommand;
  });
  it("documents only the repo's own device commands", () => {
    const { container } = mount();
    const cmds = [...container.querySelectorAll("#download pre")].map((p) => p.textContent);
    expect(cmds).toContain("npm run ios:device");
    expect(cmds).toContain("npm run android:device");
    expect(cmds).toContain("npx eas build -p android --profile development");
  });
});

describe("buttons", () => {
  it("Pair your phone navigates to the Settings Mobile page from the hero and the closing call to action", () => {
    const { host, container } = mount();
    const buttons = container.querySelectorAll("[data-action=pair]");
    expect(buttons).toHaveLength(2);
    buttons.forEach((b) => { expect(b.textContent).toBe("Pair your phone"); b.click(); });
    expect(host.navigate).toHaveBeenCalledTimes(2);
    expect(host.navigate).toHaveBeenCalledWith("/settings/mobile");
    expect(PAIR_ROUTE).toBe("/settings/mobile");
  });
  it("Mobile app setup navigates to the Settings App page", () => {
    const { host, container } = mount();
    container.querySelector("[data-action=setup]").click();
    expect(host.navigate).toHaveBeenCalledWith(SETUP_ROUTE);
  });
});

describe("motion", () => {
  it("reveals sections with IntersectionObserver and stops observing on cleanup", () => {
    const observed = [];
    let cb;
    const disconnect = vi.fn();
    vi.stubGlobal("IntersectionObserver", class { constructor(fn) { cb = fn; } observe(n) { observed.push(n); } unobserve() {} disconnect() { disconnect(); } });
    const { container, cleanup } = mount();
    const root = container.querySelector(".mb");
    expect(root.classList.contains("js")).toBe(true);
    expect(observed.length).toBeGreaterThan(10);
    cb([{ isIntersecting: true, target: observed[0] }]);
    expect(observed[0].classList.contains("in2")).toBe(true);
    cleanup();
    expect(disconnect).toHaveBeenCalled();
  });
  it("keeps everything visible when IntersectionObserver is missing", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = mount();
    expect(container.querySelector(".mb").classList.contains("js")).toBe(false);
    expect(container.querySelector("#download")).not.toBeNull();
  });
  it("renders all content with no hidden-until-reveal state and no observer under prefers-reduced-motion", () => {
    const ctor = vi.fn();
    vi.stubGlobal("IntersectionObserver", ctor);
    vi.stubGlobal("matchMedia", (q) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} }));
    const { container } = mount();
    const root = container.querySelector(".mb");
    expect(ctor).not.toHaveBeenCalled();
    expect(root.classList.contains("js")).toBe(false);
    expect(root.querySelectorAll("section")).toHaveLength(1 + FEATURES.length + 4);
    expect(root.querySelector("style").textContent).toMatch(/prefers-reduced-motion: reduce\) \{[^}]*animation: none/);
    expect(root.querySelector(".par").style.transform).toBe("");
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

describe("type weight", () => {
  it("sets all page text to normal weight, with only buttons allowed to be medium", () => {
    const css = mount().container.querySelector("style").textContent;
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, sel]) => !/btn|button/.test(sel));
    const weights = rules.flatMap(([, , body]) => [...body.matchAll(/font-weight:\s*(\d+)/g)].map((m) => m[1]));
    expect(weights.length).toBeGreaterThan(0);
    expect(new Set(weights)).toEqual(new Set(["400"]));
  });
});

describe("contrast", () => {
  it("keeps every text and background token pair at 4.5:1 or better", () => {
    const F = FALLBACKS;
    const pairs = [["text", "bg"], ["muted", "bg"], ["text", "panel"], ["muted", "panel"], ["onContrast", "contrast"], ["onAccent", "accent"], ["stageText", "stageBg"], ["stageMuted", "stageBg"], ["onBtnFill", "btnFill"], ["phoneText", "phoneBg"], ["phoneMuted", "phoneBg"], ["phoneText", "phoneRaised"], ["phoneMuted", "phoneRaised"], ["stageText", "grad3"], ["stageMuted", "grad3"]];
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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ROUTES, activate, authHeaders, createBody, documentsUrl, errorMessage, filterDocuments,
  isHttpUrl, maskKey, normalizeAppUrl, parseDocuments, parseMe, parseSignerLines, relativeTime, statusLabel, summarize,
} from "./extension.js";

const STORE = "canvas-extension-doctransit:v1";
const KEY = "dt_secret_key_123";

const DOCS = {
  documents: [
    { document_id: "d1", name: "NDA Acme", status: "sent", created_at: "2026-10-01T10:00:00Z", updated_at: "2026-10-02T10:00:00Z",
      signers: [{ id: "c1", name: "Ada", email: "ada@x.com", role: "signer", order: 1, sign_url: "https://app.doctransit.com/s/1" }], next_actions: ["get_sign_links"] },
    { document_id: "d2", name: "Lease", status: "completed", created_at: "2026-09-01T10:00:00Z", updated_at: "2026-09-02T10:00:00Z",
      signers: [{ email: "bob@x.com" }, { email: "cy@x.com" }], next_actions: ["download"] },
  ],
  next_cursor: null,
};

const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); await new Promise((r) => setTimeout(r, 0)); };

function mountPage() {
  let mount;
  activate({ registerPage: (_id, fn) => { mount = fn; return () => {}; } });
  const container = document.createElement("div");
  document.body.append(container);
  return { container, dispose: mount({ container }) };
}
const btn = (c, text) => [...c.querySelectorAll("button")].find((b) => b.textContent === text);
const tab = (c, text) => [...c.querySelectorAll("[role=tab]")].find((b) => b.textContent === text);

beforeEach(() => { localStorage.clear(); });
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("helpers", () => {
  it("accepts only http(s) URLs", () => {
    expect(isHttpUrl("https://a.com")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("ftp://a.com")).toBe(false);
    expect(normalizeAppUrl("http://localhost:3000/")).toBe("http://localhost:3000");
    expect(normalizeAppUrl("file:///etc")).toBeNull();
  });

  it("parses document pages and tolerates junk", () => {
    const p = parseDocuments({ documents: [...DOCS.documents, null, {}], next_cursor: "abc" });
    expect(p.documents.map((d) => d.id)).toEqual(["d1", "d2"]);
    expect(p.nextCursor).toBe("abc");
    expect(p.documents[0].signers[0].signUrl).toBe("https://app.doctransit.com/s/1");
    expect(parseDocuments(null)).toEqual({ documents: [], nextCursor: null });
  });

  it("labels statuses, builds headers and urls, and maps errors", () => {
    expect(statusLabel("sent")).toBe("Out for signature");
    expect(statusLabel("weird")).toBe("weird");
    expect(authHeaders(" k ").Authorization).toBe("Bearer k");
    expect(documentsUrl({ status: "sent", cursor: "c" })).toContain("status=sent");
    expect(documentsUrl({ status: "bogus" })).not.toContain("status=");
    expect(errorMessage({ status: 401 })).toBe("That API key was not accepted.");
    expect(errorMessage({ status: 503 })).toMatch(/problem/);
    expect(errorMessage(new TypeError("x"))).toBe("Could not reach api.doctransit.com.");
  });

  it("filters by name or signer and never sends unless asked", () => {
    const docs = parseDocuments(DOCS).documents;
    expect(filterDocuments(docs, "lease").map((d) => d.id)).toEqual(["d2"]);
    expect(filterDocuments(docs, "ada@").map((d) => d.id)).toEqual(["d1"]);
    const signers = parseSignerLines("Ada <ada@x.com>\nbob@x.com");
    expect(signers).toEqual([{ name: "Ada", email: "ada@x.com" }, { email: "bob@x.com" }]);
    expect(() => parseSignerLines("nope")).toThrow(/valid email/);
    expect(createBody({ templateId: "t", signers }).send).toBe(false);
  });
});

describe("tabs and embedded pages", () => {
  it("shows the real DocTransit route for each page tab, safely framed", () => {
    const { container, dispose } = mountPage();
    expect(tab(container, "Documents").getAttribute("aria-selected")).toBe("true");

    const expected = { Dashboard: ROUTES.dashboard, "Sign in": "/login", "Create account": "/create-account" };
    for (const [label, path] of Object.entries(expected)) {
      tab(container, label).click();
      expect(tab(container, label).getAttribute("aria-selected")).toBe("true");
      const panel = container.querySelector("[role=tabpanel]:not([hidden])");
      const frame = panel.querySelector("iframe");
      expect(frame.getAttribute("src")).toBe(`https://app.doctransit.com${path}`);
      expect(frame.title).toMatch(/DocTransit/);
      expect(frame.getAttribute("referrerpolicy")).toBe("strict-origin-when-cross-origin");
      expect(frame.getAttribute("sandbox")).not.toContain("allow-top-navigation");
      expect(panel.textContent).toContain("Loading DocTransit...");
      expect(panel.querySelector("a[href][rel~=noopener]").textContent).toBe("Open in browser");
    }
    dispose();
  });

  it("keeps an iframe element when switching tabs (no reload)", () => {
    const { container, dispose } = mountPage();
    tab(container, "Sign in").click();
    const frame = container.querySelector("iframe");
    tab(container, "Documents").click();
    tab(container, "Sign in").click();
    expect(container.querySelector("iframe")).toBe(frame);
    dispose();
  });

  it("rejects non-http(s) addresses in settings and saves valid ones", () => {
    const { container, dispose } = mountPage();
    btn(container, "Settings").click();
    const input = container.querySelector("#dt-app-url");
    input.value = "javascript:alert(1)";
    btn(container, "Save").click();
    expect(container.querySelector("[role=alert]").textContent).toMatch(/http/);
    expect(localStorage.getItem(STORE)).toBeNull();

    container.querySelector("#dt-app-url").value = "http://localhost:3000";
    btn(container, "Save").click();
    expect(JSON.parse(localStorage.getItem(STORE)).appUrl).toBe("http://localhost:3000");
    tab(container, "Sign in").click();
    expect(container.querySelector("iframe").getAttribute("src")).toBe("http://localhost:3000/login");
    dispose();
  });
});

describe("documents", () => {
  const ME = { name: "Ada Owner", email: "owner@x.com" };
  const router = (extra = {}) => vi.fn(async (url, init) => {
    const u = String(url);
    if (extra[u]) return extra[u](init);
    if (u.endsWith("/me")) return json(ME);
    if (u.includes("/links")) return json({ status: "sent", signers: DOCS.documents[0].signers, next_actions: ["get_sign_links", "download"] });
    if (init?.method === "POST") return json({ document_id: "n" }, 201);
    return json(DOCS);
  });
  const dialog = (c) => c.querySelector("[role=dialog][aria-modal]");
  async function connect(c, key = KEY) {
    btn(c, "Connect").click();
    c.querySelector("#dt-step-3").click();
    const input = c.querySelector("#dt-key");
    input.value = key;
    input.dispatchEvent(new Event("input"));
    dialog(c).querySelector("button[type=submit]").click();
    await flush();
  }

  it("lists documents after connecting, with summary cards and status chips", async () => {
    const fetchMock = router();
    vi.stubGlobal("fetch", fetchMock);
    const { container, dispose } = mountPage();
    await connect(container);

    const urls = fetchMock.mock.calls.map(([u]) => String(u));
    expect(urls[0]).toBe("https://api.doctransit.com/v1/me");
    expect(urls[1]).toMatch(/^https:\/\/api\.doctransit\.com\/v1\/documents\?/);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe(`Bearer ${KEY}`);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain("NDA Acme");
    expect(rows[0].querySelector(".chip.sent").textContent).toBe("Out for signature");
    expect(rows[1].textContent).toContain("2 signers");
    const stats = [...container.querySelectorAll(".stat")].map((n) => n.textContent);
    expect(stats).toEqual(["2Total", "1Awaiting signature", "1Completed", "0Declined or expired"]);
    expect(container.textContent).toContain("of loaded documents");
    dispose();
  });

  it("filters by status on the server and by search in the browser", async () => {
    const fetchMock = router();
    vi.stubGlobal("fetch", fetchMock);
    const { container, dispose } = mountPage();
    await connect(container);

    const select = container.querySelector("#dt-status");
    select.value = "completed";
    select.dispatchEvent(new Event("change"));
    await flush();
    expect(fetchMock.mock.calls.at(-1)[0]).toContain("status=completed");

    const search = container.querySelector("#dt-search");
    search.value = "lease";
    search.dispatchEvent(new Event("input"));
    expect(container.querySelectorAll("tbody tr").length).toBe(1);
    dispose();
  });

  it("shows a friendly error with a retry button when documents fail to load", async () => {
    localStorage.setItem(STORE, JSON.stringify({ apiKey: KEY }));
    let fail = true;
    vi.stubGlobal("fetch", vi.fn(async () => (fail ? json({}, 503) : json(DOCS))));
    const { container, dispose } = mountPage();
    await flush();
    expect(container.querySelector("[role=alert]").textContent).toMatch(/problem/);
    fail = false;
    btn(container, "Try again").click();
    await flush();
    expect(container.querySelectorAll("tbody tr").length).toBe(2);
    dispose();
  });

  it("loads documents for a key saved in the older storage shape", async () => {
    localStorage.setItem(STORE, JSON.stringify({ appUrl: "https://app.doctransit.com", apiKey: KEY }));
    const fetchMock = router();
    vi.stubGlobal("fetch", fetchMock);
    const { container, dispose } = mountPage();
    await flush();
    expect(btn(container, "Connected")).toBeTruthy();
    expect(container.querySelectorAll("tbody tr").length).toBe(2);
    dispose();
  });

  it("opens a drawer with a signer timeline and copies a sign link", async () => {
    const fetchMock = router();
    vi.stubGlobal("fetch", fetchMock);
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { container, dispose } = mountPage();
    await connect(container);

    container.querySelector("tbody tr").click();
    await flush();
    expect(fetchMock.mock.calls.at(-1)[0]).toBe("https://api.doctransit.com/v1/documents/d1/links");
    const drawer = container.querySelector(".drawer");
    expect(drawer.querySelector(".tl").textContent).toContain("Ada");
    expect(drawer.querySelector("a").getAttribute("href")).toBe("https://app.doctransit.com/s/1");
    expect(drawer.textContent).toContain("get_sign_links");
    expect(btn(drawer, "Download signed PDF")).toBeTruthy();

    btn(drawer, "Copy link").click();
    await flush();
    expect(writeText).toHaveBeenCalledWith("https://app.doctransit.com/s/1");
    expect(btn(container.querySelector(".drawer"), "Copied")).toBeTruthy();

    container.querySelector(".dt").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(container.querySelector(".drawer")).toBeNull();
    dispose();
  });

  it("does not send when creating unless the box is ticked and confirmed", async () => {
    const fetchMock = router();
    vi.stubGlobal("fetch", fetchMock);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { container, dispose } = mountPage();
    await connect(container);

    container.querySelector("#dt-template").value = "tpl1";
    container.querySelector("#dt-signers").value = "Ada <ada@x.com>";
    container.querySelector("form").requestSubmit();
    await flush();
    const post = fetchMock.mock.calls.find(([, i]) => i?.method === "POST");
    expect(JSON.parse(post[1].body)).toMatchObject({ template_id: "tpl1", send: false });
    expect(confirm).not.toHaveBeenCalled();

    fetchMock.mockClear();
    container.querySelector("#dt-template").value = "tpl1";
    container.querySelector("#dt-signers").value = "Ada <ada@x.com>";
    container.querySelector("#dt-send").checked = true;
    container.querySelector("form").requestSubmit();
    await flush();
    expect(confirm).toHaveBeenCalled();
    expect(fetchMock.mock.calls.some(([, i]) => i?.method === "POST")).toBe(false);
    dispose();
  });

  it("aborts in-flight requests on unmount", async () => {
    let signal;
    vi.stubGlobal("fetch", vi.fn((url, init) => { signal = init.signal; return new Promise(() => {}); }));
    const { container, dispose } = mountPage();
    await connect(container);
    expect(signal.aborted).toBe(false);
    dispose();
    expect(signal.aborted).toBe(true);
    expect(container.querySelector(".dt")).toBeNull();
  });
});

describe("connect", () => {
  const ME = { account: { name: "Ada Owner", email: "owner@x.com" } };
  const dialog = (c) => c.querySelector("[role=dialog][aria-modal]");
  const submitKey = async (c, key) => {
    const input = c.querySelector("#dt-key");
    input.value = key;
    input.dispatchEvent(new Event("input"));
    dialog(c).querySelector("button[type=submit]").click();
    await flush();
  };
  const okFetch = () => vi.fn(async (url) => json(String(url).endsWith("/me") ? ME : DOCS));

  it("shows a hero with Connect when not connected, and the header Connect opens a labelled dialog", () => {
    const { container, dispose } = mountPage();
    expect(container.querySelector(".hero")).toBeTruthy();
    expect(container.querySelectorAll(".steps3 li").length).toBe(3);
    const header = container.querySelector("#dt-connect");
    expect(header.textContent).toBe("Connect");
    expect(dialog(container)).toBeNull();
    header.click();
    const dlg = dialog(container);
    expect(dlg.getAttribute("role")).toBe("dialog");
    expect(container.querySelector(`#${dlg.getAttribute("aria-labelledby")}`).textContent).toBe("Connect DocTransit");
    expect(container.querySelector(".prog").getAttribute("aria-valuenow")).toBe("1");
    dispose();
  });

  it("opens the real DocTransit pages in new tabs and can switch to the embedded page", async () => {
    const { container, dispose } = mountPage();
    btn(container, "Connect").click();
    const link = (text) => [...dialog(container).querySelectorAll("a")].find((a) => a.textContent === text);
    for (const [text, href] of [["Sign in", "https://app.doctransit.com/login"], ["Create account", "https://app.doctransit.com/create-account"]]) {
      const a = link(text);
      expect(a.getAttribute("href")).toBe(href);
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    }
    link("Sign in").click();
    await new Promise((r) => setTimeout(r, 5));
    expect(container.querySelector(".prog").getAttribute("aria-valuenow")).toBe("2");
    expect(link("Open API Keys").getAttribute("href")).toBe("https://app.doctransit.com/generatetoken");
    expect(link("Open API Keys").getAttribute("rel")).toBe("noopener noreferrer");

    btn(dialog(container), "I already have an API key"); // only on step 1; step 2 is open now
    container.querySelector("#dt-step-1").click();
    btn(dialog(container), "Use the embedded page instead").click();
    expect(dialog(container)).toBeNull();
    expect(tab(container, "Sign in").getAttribute("aria-selected")).toBe("true");
    dispose();
  });

  it("shows the exact error for a rejected key and saves nothing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({}, 401)));
    const { container, dispose } = mountPage();
    btn(container, "Connect").click();
    container.querySelector("#dt-step-3").click();
    await submitKey(container, KEY);
    expect(dialog(container).querySelector("[role=alert]").textContent).toBe("That API key was not accepted.");
    expect(localStorage.getItem(STORE)).toBeNull();
    expect(container.textContent).not.toContain(KEY);
    expect(container.querySelector("#dt-connect").textContent).toBe("Connect");
    dispose();
  });

  it("reports a network failure plainly and saves nothing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const { container, dispose } = mountPage();
    btn(container, "Connect").click();
    container.querySelector("#dt-step-3").click();
    await submitKey(container, KEY);
    expect(container.querySelector("[role=alert]").textContent).toBe("Could not reach api.doctransit.com.");
    expect(localStorage.getItem(STORE)).toBeNull();
    dispose();
  });

  it("verifies with /me, saves only the key and account, hides the key, closes and loads documents", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { container, dispose } = mountPage();
    btn(container, "Connect").click();
    container.querySelector("#dt-step-3").click();
    const input = container.querySelector("#dt-key");
    expect(input.type).toBe("password");
    container.querySelector("[aria-label='Show API key']").click();
    expect(container.querySelector("#dt-key").type).toBe("text");
    container.querySelector("[aria-label='Hide API key']").click();
    await submitKey(container, KEY);

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.doctransit.com/v1/me");
    expect(dialog(container)).toBeNull();
    const saved = JSON.parse(localStorage.getItem(STORE));
    expect(saved.apiKey).toBe(KEY);
    expect(saved.account).toEqual({ name: "Ada Owner", email: "owner@x.com" });
    expect(container.querySelector("#dt-connect").textContent).toBe("Connected");
    expect(container.querySelectorAll("tbody tr").length).toBe(2);
    expect(container.querySelector("[role=status]").textContent).toContain("Ada Owner");
    expect(container.textContent).not.toContain(KEY);
    expect(container.innerHTML).not.toContain(KEY);
    expect(fetchMock.mock.calls.every(([u]) => !String(u).includes(KEY))).toBe(true);

    container.querySelector("#dt-connect").click();
    expect(container.querySelector("[role=menu]").textContent).toContain(maskKey(KEY));
    expect(maskKey(KEY)).toBe("dt_••••_123"); // last four only
    dispose();
  });

  it("manages and disconnects", async () => {
    vi.stubGlobal("fetch", okFetch());
    const { container, dispose } = mountPage();
    btn(container, "Connect").click();
    container.querySelector("#dt-step-3").click();
    await submitKey(container, KEY);

    container.querySelector("#dt-connect").click();
    container.querySelector("#dt-menu-manage").click();
    const dlg = dialog(container);
    expect(dlg.textContent).toContain("Manage connection");
    expect(dlg.textContent).toContain("owner@x.com");
    expect(dlg.textContent).toContain("dt_••••_123");
    expect(dlg.textContent).not.toContain(KEY);
    btn(dlg, "Replace key").click();
    expect(container.querySelector("#dt-key").value).toBe("");
    container.querySelector("#dt-dlg-close").click();

    container.querySelector("#dt-connect").click();
    container.querySelector("#dt-menu-disconnect").click();
    expect(JSON.parse(localStorage.getItem(STORE)).apiKey).toBe("");
    expect(container.querySelector("#dt-connect").textContent).toBe("Connect");
    expect(container.querySelector(".hero")).toBeTruthy();
    dispose();
  });

  it("closes on Escape, keeps focus inside, and returns focus to Connect", () => {
    const { container, dispose } = mountPage();
    const header = container.querySelector("#dt-connect");
    header.focus();
    header.click();
    const dlg = dialog(container);
    expect(dlg.contains(document.activeElement)).toBe(true);
    const focusables = [...dlg.querySelectorAll("a[href],button:not(:disabled),input")];
    focusables.at(-1).focus();
    dlg.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(focusables[0]);
    dlg.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(dialog(container)).toBeNull();
    expect(document.activeElement).toBe(container.querySelector("#dt-connect"));
    dispose();
  });

  it("derives summary counts and readable dates and names", () => {
    const docs = parseDocuments({ documents: [...DOCS.documents, { document_id: "d3", status: "declined" }] }).documents;
    expect(summarize(docs)).toEqual({ total: 3, awaiting: 1, completed: 1, closed: 1 });
    expect(relativeTime("2026-10-01T10:00:00Z", Date.parse("2026-10-01T10:05:00Z"))).toBe("5 mins ago");
    expect(relativeTime("2026-10-01T10:00:00Z", Date.parse("2026-10-03T10:00:00Z"))).toBe("2 days ago");
    expect(parseMe({ user: { email: "a@b.co" } })).toEqual({ name: "", email: "a@b.co" });
    expect(parseMe(null)).toEqual({ name: "", email: "" });
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

describe("solid button legibility", () => {
  afterEach(() => document.documentElement.removeAttribute("style"));
  it.each(["dark", "light"])("keeps the primary button's label readable on its fill in the %s host theme", (theme) => {
    useHostTheme(theme);
    const { container, dispose } = mountPage();
    const connect = [...container.querySelectorAll("button.btn.primary")].find((b) => b.textContent === "Connect");
    expect(contrastRatio(connect)).toBeGreaterThanOrEqual(4.5);
    dispose();
  });
});

describe("New Chat actions", () => {
  const hostMock = () => {
    const host = { registerPage: vi.fn(() => () => {}), onIntent: vi.fn(() => () => {}), registerCreateAction: vi.fn(() => () => {}) };
    activate(host);
    return { host, mount: host.registerPage.mock.calls[0][1] };
  };
  const mountConnected = (mount, intent = null) => {
    localStorage.setItem(STORE, JSON.stringify({ appUrl: "https://app.doctransit.com", apiKey: KEY }));
    vi.stubGlobal("fetch", vi.fn(async () => json(DOCS)));
    const container = document.createElement("div");
    document.body.append(container);
    return { container, dispose: mount({ container, intent }) };
  };

  it("registers New document and New contract with labels, icons and intents", () => {
    const { host } = hostMock();
    expect(host.registerCreateAction.mock.calls.map(([a]) => [a.id, a.label, a.pageId, a.intent])).toEqual([
      ["new-document", "New document", "doctransit", "create:document"],
      ["new-contract", "New contract", "doctransit", "create:contract"],
    ]);
    host.registerCreateAction.mock.calls.forEach(([a]) => expect(a.icon.svg.startsWith("<svg")).toBe(true));
  });

  it("opens the New contract form when a mounted page receives that intent", async () => {
    const { host, mount } = hostMock();
    const { container, dispose } = mountConnected(mount);
    await flush();
    host.onIntent.mock.calls[0][0]({ id: "new-contract", action: "create:contract", at: Date.now() });

    expect(container.querySelector("details").open).toBe(true);
    expect(container.querySelector("details summary").textContent).toBe("New contract from a template");
    expect(container.querySelector("form[aria-label='New contract']")).not.toBeNull();
    expect(document.activeElement).toBe(container.querySelector("#dt-template"));
    dispose();
  });

  it("opens the New document form when the page is mounted with that intent", async () => {
    const { mount } = hostMock();
    const { container, dispose } = mountConnected(mount, { action: "create:document" });
    await flush();

    expect(container.querySelector("details summary").textContent).toBe("New document from a template");
    expect(container.querySelector("form[aria-label='New document']")).not.toBeNull();
    dispose();
  });
});

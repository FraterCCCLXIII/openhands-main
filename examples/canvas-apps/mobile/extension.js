/* Mobile — a Canvas App that is a landing page for the OpenHands mobile app.
 *
 * Everything on the page is taken from the openhands-mobile repository (its
 * README, app.json and src/). There are no store links, ratings or download
 * counts because none exist: the app is an Expo project you build and run from
 * source. The phone pictures are drawn with CSS and labelled as illustrations;
 * the repository has no screenshots. The only embedded image is the app's own
 * icon (assets/icon.png scaled to 96px).
 *
 * Browser-only, dependency-free ESM. Styles are scoped under `.mb`. Text is
 * always set with textContent; icons are SVG data-URL masks.
 */

export const PAIR_ROUTE = "/settings/mobile";
export const SETUP_ROUTE = "/settings/app";
export const REPO_NAME = "OpenHands/openhands-mobile";

const APP_ICON = "data:image/png;base64,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";

/** Fallback colours behind the --mb-* aliases; tests check their contrast. */
export const FALLBACKS = {
  bg: "#0B0E14", panel: "#21252F", text: "#EEF2F7", muted: "#A3B0C4", contrast: "#FFFFFF", onContrast: "#000000",
  accent: "#C9B974", onAccent: "#0B0E14", phoneBg: "#181818", phoneText: "#EEF2F7", phoneMuted: "#A3B0C4", phoneRaised: "#2A2A2A",
};

export const FEATURES = [
  {
    id: "pairing",
    title: "Pair by scanning a QR code",
    body: "Open Settings → Mobile in Agent Canvas on your laptop and scan the code with the phone camera, or photograph it and let the app read it from the picture. The phone can be on any network. If you prefer, type a name, host and session API key yourself.",
    mock: "connect",
  },
  {
    id: "conversations",
    title: "Your conversations, live",
    body: "See the conversations on the paired agent server, open one to load recent history, and watch new events stream in. Send messages into an existing thread or start a new chat. The chat shows Live while the event socket is up. Wide screens get a list and chat side by side. Dictate a message with the microphone in the composer.",
    mock: "chat",
  },
  {
    id: "customize",
    title: "Customize from the phone",
    body: "A Customize screen lists the laptop’s MCP servers, skills and plugins, so you can look at them and change them from the phone. Changes go to the same OpenHands backend the laptop uses.",
    mock: "customize",
  },
  {
    id: "automations",
    title: "Automations and templates",
    body: "An Automations screen has a Dashboard and a Templates tab. Open an automation to see its trigger, last run and prompt, switch it on or off, or run it now. Recommended templates, such as GitHub code review, AGENTS.md Maintainer and Daily news digest, start a chat that sets them up. Create an automation starts that same kind of chat from scratch.",
    mock: "automations",
  },
];

export const STEPS = [
  { title: "Get the app", body: "Clone the openhands-mobile repository, run npm install, then build a development client with npm run ios:device or npm run android:device. Expo Go is not supported." },
  { title: "Open the pairing page", body: "In Agent Canvas go to Settings → Mobile. Canvas shows a QR code for this computer." },
  { title: "Scan it", body: "In the app choose Open camera scanner, or Take photo of QR. The app saves the host and session key in the phone’s secure storage and connects." },
  { title: "Work from anywhere", body: "Your conversations, Customize and Automations appear on the phone, backed by the laptop’s OpenHands. If the laptop sleeps or OpenHands quits, the phone shows Offline." },
];

export const STATUS = [
  "Early MVP (version 0.1.0)",
  "Expo app: build and run it from source",
  "No store listing or TestFlight build is described in the repository",
];

// ─── Icons (SVG data-URL masks) ────────────────────────────────────────────

const ICON_PATHS = {
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
};
export function maskUrl(name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ""}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// ─── View ─────────────────────────────────────────────────────────────────────

const F = FALLBACKS;
const STYLE = `
.mb { --mb-bg: var(--oh-color-base, ${F.bg}); --mb-panel: var(--oh-color-base-secondary, ${F.panel}); --mb-text: var(--oh-foreground, ${F.text});
  --mb-muted: var(--oh-muted, ${F.muted}); --mb-border: var(--oh-border-subtle, #383F50); --mb-contrast: var(--oh-contrast, ${F.contrast});
  --mb-on-contrast: var(--oh-contrast-foreground, ${F.onContrast}); --mb-accent: var(--oh-accent, ${F.accent}); --mb-on-accent: var(--oh-accent-foreground, ${F.onAccent});
  --mb-phone-bg: ${F.phoneBg}; --mb-phone-text: ${F.phoneText}; --mb-phone-muted: ${F.phoneMuted}; --mb-phone-raised: ${F.phoneRaised};
  box-sizing: border-box; height: 100%; min-height: 480px; overflow: auto; background: var(--mb-bg); color: var(--mb-text); font: 15px/1.5 system-ui, sans-serif; }
.mb[hidden] { display: none; }
.mb *, .mb *::before, .mb *::after { box-sizing: border-box; }
.mb .wrap { max-width: 1040px; margin: 0 auto; padding: 32px 24px 64px; display: flex; flex-direction: column; gap: 56px; }
.mb h1, .mb h2, .mb h3, .mb p, .mb ol, .mb ul { margin: 0; }
.mb h1 { font-size: 34px; line-height: 1.15; font-weight: 500; color: var(--mb-contrast); }
.mb h2 { font-size: 22px; font-weight: 500; color: var(--mb-contrast); }
.mb h3 { font-size: 17px; font-weight: 600; color: var(--mb-contrast); }
.mb .muted { color: var(--mb-muted); }
.mb .hero { display: flex; gap: 32px; align-items: center; flex-wrap: wrap; }
.mb .hero-text { flex: 1 1 320px; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.mb .brand { display: flex; align-items: center; gap: 14px; }
.mb .brand img { width: 64px; height: 64px; border-radius: 14px; border: 1px solid var(--mb-border); }
.mb .pitch { font-size: 18px; color: var(--mb-text); }
.mb .status { display: flex; flex-wrap: wrap; gap: 8px; padding: 0; list-style: none; }
.mb .status li { padding: 3px 10px; border: 1px solid var(--mb-border); border-radius: 999px; background: var(--mb-panel); color: var(--mb-text); font-size: 13px; }
.mb .actions { display: flex; flex-wrap: wrap; gap: 12px; }
.mb button.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 8px; border: 1px solid var(--mb-border); background: transparent; color: var(--mb-text); font: inherit; font-weight: 600; cursor: pointer; }
.mb button.btn:hover { border-color: var(--mb-contrast); }
.mb button.btn.primary { background: var(--mb-contrast); color: var(--mb-on-contrast); border-color: var(--mb-contrast); }
.mb button.btn.primary:hover { opacity: 0.9; }
.mb button:focus-visible { outline: 2px solid var(--mb-accent); outline-offset: 2px; }
.mb .ico { display: inline-block; width: 18px; height: 18px; flex: none; background: currentColor; -webkit-mask: var(--mb-mask) center / contain no-repeat; mask: var(--mb-mask) center / contain no-repeat; }
.mb .repo { font-size: 14px; color: var(--mb-muted); }
.mb code { padding: 1px 6px; border-radius: 4px; background: var(--mb-panel); color: var(--mb-text); font: 13px ui-monospace, monospace; overflow-wrap: anywhere; }
.mb .feature { display: flex; gap: 40px; align-items: center; flex-wrap: wrap; }
.mb .feature:nth-child(even) { flex-direction: row-reverse; }
.mb .feature .copy { flex: 1 1 300px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.mb .feature .kicker { display: flex; align-items: center; gap: 8px; color: var(--mb-muted); font-size: 13px; }
.mb .features { display: flex; flex-direction: column; gap: 56px; }
.mb .mockwrap { flex: 0 1 240px; display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 0 auto; }
.mb figure { margin: 0; }
.mb figcaption { font-size: 12px; color: var(--mb-muted); text-align: center; }
.mb .phone { width: 220px; height: 440px; padding: 10px; border-radius: 30px; border: 2px solid var(--mb-border); background: #000; }
.mb .screen { height: 100%; border-radius: 22px; overflow: hidden; background: var(--mb-phone-bg); color: var(--mb-phone-text); padding: 16px 12px; display: flex; flex-direction: column; gap: 10px; font-size: 12px; line-height: 1.35; }
.mb .screen .st { font-size: 14px; font-weight: 600; color: var(--mb-phone-text); }
.mb .screen .sm { color: var(--mb-phone-muted); }
.mb .screen .row { padding: 9px 10px; border-radius: 8px; background: var(--mb-phone-raised); color: var(--mb-phone-text); display: flex; justify-content: space-between; gap: 6px; }
.mb .screen .row .sm { font-size: 11px; }
.mb .screen .pill { padding: 8px 10px; border-radius: 8px; text-align: center; font-weight: 600; background: #FFFFFF; color: #000000; }
.mb .screen .pill.alt { background: transparent; color: var(--mb-phone-text); border: 1px solid #555; }
.mb .screen .tabs { display: flex; gap: 6px; }
.mb .screen .tabs span { padding: 4px 10px; border-radius: 999px; border: 1px solid #555; color: var(--mb-phone-text); }
.mb .screen .tabs span.on { background: #FFFFFF; color: #000000; border-color: #FFFFFF; }
.mb .screen .bubble { padding: 8px 10px; border-radius: 10px; background: var(--mb-phone-raised); color: var(--mb-phone-text); }
.mb .screen .bubble.me { align-self: flex-end; background: #FFFFFF; color: #000000; }
.mb .screen .grow { flex: 1; }
.mb .screen .field { padding: 7px 9px; border-radius: 8px; border: 1px solid #555; color: var(--mb-phone-muted); }
.mb .screen .composer { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-radius: 999px; border: 1px solid #555; color: var(--mb-phone-muted); }
.mb .qrbox { align-self: center; width: 64px; height: 64px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; padding: 4px; background: #FFFFFF; border-radius: 6px; }
.mb .qrbox i { background: #000000; }
.mb .qrbox i.o { background: #FFFFFF; }
.mb .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; padding: 0; list-style: none; counter-reset: step; }
.mb .steps li { counter-increment: step; display: flex; flex-direction: column; gap: 8px; padding: 16px; border: 1px solid var(--mb-border); border-radius: 12px; background: var(--mb-panel); }
.mb .steps li::before { content: counter(step); width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: var(--mb-accent); color: var(--mb-on-accent); font-weight: 700; }
.mb .section { display: flex; flex-direction: column; gap: 16px; }
.mb .note { padding: 14px 16px; border: 1px solid var(--mb-border); border-radius: 12px; background: var(--mb-panel); color: var(--mb-text); }
@media (max-width: 520px) { .mb .wrap { padding: 20px 16px 48px; gap: 40px; } .mb h1 { font-size: 28px; } .mb .feature:nth-child(even) { flex-direction: row; } }
`;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function icon(name) {
  const node = el("span", "ico");
  node.setAttribute("aria-hidden", "true");
  node.style.setProperty("--mb-mask", maskUrl(name));
  return node;
}
function row(label, sub) {
  const r = el("div", "row");
  r.append(el("span", "", label));
  if (sub) r.append(el("span", "sm", sub));
  return r;
}

function mockScreen(kind) {
  const s = el("div", "screen");
  if (kind === "connect") {
    s.append(el("div", "sm", "OpenHands Mobile"), el("div", "st", "Connect to a running agent server"));
    const qr = el("div", "qrbox");
    qr.setAttribute("aria-hidden", "true");
    "1110111011010111101001011".split("").forEach((c) => qr.append(el("i", c === "1" ? "" : "o")));
    s.append(qr, el("div", "pill", "Take photo of QR"), el("div", "pill alt", "Open camera scanner"));
    for (const label of ["Name", "Host", "Session API key"]) s.append(el("div", "field", label));
  } else if (kind === "chat") {
    s.append(el("div", "st", "Conversation"), el("div", "sm", "Live"));
    s.append(el("div", "bubble me", "Add tests for the parser"), el("div", "bubble", "Working on it. Reading the existing tests first."), el("div", "grow"));
    const c = el("div", "composer");
    c.append(el("span", "", "Message"), icon("mic"));
    s.append(c);
  } else if (kind === "customize") {
    s.append(el("div", "st", "Customize"), el("div", "sm", "Skills, MCP servers, and plugins from the laptop."));
    for (const label of ["MCP Servers", "Skills", "Plugins"]) s.append(row(label, "›"));
  } else {
    s.append(el("div", "st", "Automations"));
    const tabs = el("div", "tabs");
    tabs.append(el("span", "", "Dashboard"), el("span", "on", "Templates"));
    s.append(tabs);
    for (const [name, cat] of [["GitHub code review", "Code review"], ["AGENTS.md Maintainer", "Documentation"], ["Daily news digest", "Research"]]) s.append(row(name, cat));
    s.append(el("div", "grow"), el("div", "pill", "Create an automation"));
  }
  return s;
}
function phone(kind, label) {
  const wrap = el("figure", "mockwrap");
  const p = el("div", "phone");
  p.setAttribute("role", "img");
  p.setAttribute("aria-label", `Illustration of the ${label} screen`);
  p.append(mockScreen(kind));
  wrap.append(p, el("figcaption", "", "Illustration, not a screenshot"));
  return wrap;
}

export function mountPage(container, host) {
  const root = el("div", "mb");
  root.append(el("style", "", STYLE));
  const wrap = el("div", "wrap");
  root.append(wrap);

  // Hero
  const hero = el("section", "hero");
  hero.setAttribute("aria-labelledby", "mb-title");
  const text = el("div", "hero-text");
  const brand = el("div", "brand");
  const logo = el("img");
  logo.src = APP_ICON;
  logo.alt = "OpenHands app icon";
  const h1 = el("h1", "", "OpenHands Mobile");
  h1.id = "mb-title";
  brand.append(logo, h1);
  const status = el("ul", "status");
  status.setAttribute("aria-label", "Status");
  STATUS.forEach((s) => status.append(el("li", "", s)));
  const actions = el("div", "actions");
  const pair = el("button", "btn primary");
  pair.type = "button";
  pair.dataset.action = "pair";
  pair.append(icon("qr"), el("span", "", "Pair your phone"));
  pair.addEventListener("click", () => host.navigate(PAIR_ROUTE));
  const setup = el("button", "btn");
  setup.type = "button";
  setup.dataset.action = "setup";
  setup.append(icon("phone"), el("span", "", "Mobile app setup"));
  setup.addEventListener("click", () => host.navigate(SETUP_ROUTE));
  actions.append(pair, setup);
  const repo = el("p", "repo");
  repo.append("Source and build instructions: the ", el("code", "", REPO_NAME), " repository, README.md, “Sideload on a device”.");
  text.append(brand, el("p", "pitch", "A second screen for the OpenHands that is already running on your laptop. Pair by QR code, then follow conversations and manage Customize and Automations from your phone."), status, actions, repo);
  hero.append(text, phone("connect", "pairing"));
  wrap.append(hero);

  // Features
  const features = el("section", "section");
  features.setAttribute("aria-labelledby", "mb-features");
  const fh = el("h2", "", "What it does today");
  fh.id = "mb-features";
  const list = el("div", "features");
  const ICONS = { pairing: "qr", conversations: "chat", customize: "sliders", automations: "clock" };
  FEATURES.forEach((f) => {
    const art = el("article", "feature");
    art.dataset.feature = f.id;
    const copy = el("div", "copy");
    const k = el("div", "kicker");
    k.append(icon(ICONS[f.id]));
    copy.append(k, el("h3", "", f.title), el("p", "muted", f.body));
    art.append(copy, phone(f.mock, f.title));
    list.append(art);
  });
  features.append(fh, list);
  wrap.append(features);

  // Pairing steps
  const how = el("section", "section");
  how.setAttribute("aria-labelledby", "mb-how");
  const hh = el("h2", "", "How pairing works");
  hh.id = "mb-how";
  const ol = el("ol", "steps");
  STEPS.forEach((s) => {
    const li = el("li");
    li.append(el("h3", "", s.title), el("p", "muted", s.body));
    ol.append(li);
  });
  how.append(hh, ol);
  wrap.append(how);

  // Honest limits
  const limits = el("section", "section");
  limits.setAttribute("aria-labelledby", "mb-limits");
  const lh = el("h2", "", "Good to know");
  lh.id = "mb-limits";
  limits.append(lh, el("p", "note", "The app does not choose a model or store LLM provider keys; the laptop keeps its backend and active LLM. Files, Terminal, Browser and OpenHands Cloud login are not part of it yet. The phone cannot use localhost, so it needs a host it can reach: the laptop’s LAN address, Tailscale, or a tunnel URL. The QR code from Canvas carries a short-lived public link, so pairing works from any network."));
  wrap.append(limits);

  // Full-height fit.
  function fit() {
    const top = Math.max(0, root.getBoundingClientRect().top);
    root.style.height = `${Math.max(480, (window.innerHeight || 800) - top)}px`;
  }
  const onResize = () => fit();
  window.addEventListener("resize", onResize);
  let ro = null;
  if (typeof ResizeObserver === "function") {
    ro = new ResizeObserver(() => fit());
    if (container.parentElement) ro.observe(container.parentElement);
  }
  container.replaceChildren(root);
  fit();
  return () => {
    window.removeEventListener("resize", onResize);
    ro?.disconnect();
    container.replaceChildren();
  };
}

export function activate(host) {
  return host.registerPage("mobile", ({ container }) => mountPage(container, host));
}

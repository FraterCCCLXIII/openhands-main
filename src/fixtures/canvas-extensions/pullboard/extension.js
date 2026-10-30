// Pullboard: a dependency-free Canvas Extension (manifest schema 1, host API 1).
// Summarizes https://github.com/pullboard-dev/pullboard and launches its local view.
// Pullboard's own view refuses to be framed (frame-ancestors 'none'), so the
// board opens in its own tab instead of an iframe.

const REPO_URL = "https://github.com/pullboard-dev/pullboard";
const SITE_URL = "https://pullboard.dev";
const LIVE_URL = "https://pullboard.dev/live/";
const VIEW_PORT_KEY = "canvas-extension-pullboard:view-port:v1";
const DEFAULT_VIEW_PORT = "4890";

const LOOP = [
  ["Vision", "What you want."],
  ["Specification", "Your vision written down; you approve the requirements."],
  ["Inspection", "A second agent verifies every change against that spec before it merges."],
];

const STATES = ["open", "claimed", "submitted", "verified", "merged"];

const STEPS = [
  { label: "Install and initialise in your repo", command: "npx pullboard init --blueprint web-app" },
  { label: "Open the board for every project on this machine", command: "pullboard view" },
  { label: "See what needs you", command: "pullboard decisions --as person" },
];

function readPort() {
  try {
    return localStorage.getItem(VIEW_PORT_KEY) || DEFAULT_VIEW_PORT;
  } catch {
    return DEFAULT_VIEW_PORT;
  }
}

function writePort(value) {
  try {
    localStorage.setItem(VIEW_PORT_KEY, value);
  } catch {
    // Storage can be unavailable; the field still works for this session.
  }
}

function el(tag, css, text) {
  const node = document.createElement(tag);
  if (css) node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

function link(label, href) {
  const a = el(
    "a",
    "display:inline-block;padding:0.5rem 0.9rem;border:1px solid currentColor;border-radius:0.5rem;text-decoration:none;color:inherit;opacity:0.9;",
    label,
  );
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

function card(title, ...children) {
  const box = el("section", "border:1px solid rgba(127,127,127,0.35);border-radius:0.75rem;padding:1rem 1.25rem;");
  box.append(el("h2", "font-size:1rem;font-weight:600;margin-bottom:0.6rem;", title), ...children);
  return box;
}

function commandRow({ label, command }) {
  const row = el("div", "display:flex;flex-direction:column;gap:0.25rem;margin-top:0.6rem;");
  const code = el(
    "code",
    "display:block;padding:0.5rem 0.75rem;border-radius:0.5rem;background:rgba(127,127,127,0.18);font-size:0.85rem;overflow-x:auto;white-space:pre;",
    command,
  );
  const copy = el("button", "align-self:flex-start;font-size:0.75rem;opacity:0.75;cursor:pointer;background:none;border:0;color:inherit;text-decoration:underline;", "Copy");
  copy.type = "button";
  copy.addEventListener("click", () => {
    void navigator.clipboard?.writeText(command).then(() => {
      copy.textContent = "Copied";
      setTimeout(() => {
        copy.textContent = "Copy";
      }, 1200);
    });
  });
  row.append(el("span", "font-size:0.85rem;opacity:0.8;", label), code, copy);
  return row;
}

function mount(container) {
  const page = el(
    "section",
    "min-height:100%;padding:2rem;display:flex;flex-direction:column;gap:1.25rem;max-width:56rem;color:var(--oh-foreground,#fff);background:var(--oh-color-base,#111);",
  );

  const header = el("div");
  header.append(
    el("h1", "font-size:1.6rem;font-weight:600;", "Pullboard"),
    el("p", "margin-top:0.4rem;opacity:0.8;", "Walk away, and it builds. Agents work from a spec you approve, and nothing merges until another agent verifies it."),
  );
  const links = el("div", "display:flex;gap:0.6rem;flex-wrap:wrap;margin-top:0.9rem;");
  links.append(link("GitHub repo", REPO_URL), link("pullboard.dev", SITE_URL), link("Watch it build itself", LIVE_URL));
  header.append(links);

  const loop = card("How it holds");
  const list = el("ol", "margin:0;padding-left:1.2rem;display:flex;flex-direction:column;gap:0.3rem;");
  for (const [name, text] of LOOP) {
    const item = el("li");
    item.append(el("strong", "", `${name}: `), document.createTextNode(text));
    list.append(item);
  }
  loop.append(list);
  const flow = el("div", "display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.8rem;");
  for (const state of STATES) {
    flow.append(el("span", "padding:0.15rem 0.6rem;border-radius:999px;background:rgba(127,127,127,0.2);font-size:0.8rem;", state));
  }
  loop.append(el("p", "margin-top:0.8rem;font-size:0.85rem;opacity:0.8;", "Every item moves through these states; the board refuses any move the declaration does not allow."), flow);

  const start = card("Get started");
  for (const step of STEPS) start.append(commandRow(step));

  const board = card("Open your board");
  board.append(el("p", "font-size:0.85rem;opacity:0.8;", "Pullboard keeps its view running in the background after init or resume. It opens in its own tab because the view cannot be embedded."));
  const controls = el("div", "display:flex;gap:0.6rem;align-items:center;margin-top:0.7rem;flex-wrap:wrap;");
  const label = el("label", "font-size:0.85rem;opacity:0.8;", "View port ");
  const input = el("input", "width:5rem;padding:0.3rem 0.5rem;border-radius:0.4rem;border:1px solid rgba(127,127,127,0.5);background:transparent;color:inherit;");
  input.value = readPort();
  input.inputMode = "numeric";
  label.append(input);
  const open = el("a", "padding:0.5rem 0.9rem;border-radius:0.5rem;background:var(--oh-contrast,#fff);color:var(--oh-contrast-foreground,#111);text-decoration:none;font-weight:500;", "Open board view");
  open.target = "_blank";
  open.rel = "noopener noreferrer";
  const sync = () => {
    const port = /^\d{2,5}$/.test(input.value.trim()) ? input.value.trim() : DEFAULT_VIEW_PORT;
    open.href = `http://127.0.0.1:${port}/`;
    writePort(port);
  };
  input.addEventListener("input", sync);
  sync();
  controls.append(label, open);
  board.append(controls);

  page.append(header, loop, start, board);
  container.append(page);
  return () => page.remove();
}

export function activate(host) {
  return host.registerPage("pullboard", ({ container }) => mount(container));
}

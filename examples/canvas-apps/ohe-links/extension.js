/* OHE and Superadmin: two pages that point at addresses you set. Dependency-free ESM.
 *
 * Each page keeps one address in this browser (localStorage), opens it in a new tab, and can show it
 * beside the app in a frame when the site allows framing. Only http and https addresses are accepted.
 * Nothing is sent anywhere by this app.
 */

const STORAGE_KEY = "ohe-links:v1";

export const TARGETS = Object.freeze({
  ohe: { title: "OpenHands Enterprise", blurb: "Your OpenHands Enterprise backend.", placeholder: "https://ohe.example.com" },
  superadmin: { title: "Superadmin", blurb: "The Superadmin console for your OpenHands Enterprise.", placeholder: "https://ohe.example.com/superadmin" },
});

/** The address as a safe http(s) URL string, or null when it is empty or not a web address. */
export function cleanAddress(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

const CSS = `
.ol { font: 14px/20px system-ui, sans-serif; color: var(--oh-foreground, #eee); background: var(--oh-color-base, #171717); height: 100%; min-height: 480px; padding: 32px 16px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 16px; overflow: auto; }
.ol * { box-sizing: border-box; }
.ol .card { width: min(560px, 100%); display: grid; gap: 12px; }
.ol h1 { margin: 0; font-size: 20px; font-weight: 600; color: var(--oh-contrast, #fff); }
.ol p { margin: 0; color: var(--oh-muted, #9a9a9a); }
.ol label { display: grid; gap: 6px; font-size: 12px; color: var(--oh-muted, #9a9a9a); }
.ol input[type=text] { width: 100%; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--oh-border-subtle, #3a3a3a); background: var(--oh-color-base-secondary, #212121); color: inherit; font: inherit; }
.ol .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.ol button { padding: 8px 14px; border-radius: 10px; border: 1px solid var(--oh-border-subtle, #3a3a3a); background: transparent; color: inherit; font: inherit; cursor: pointer; }
.ol button.primary { background: var(--oh-color-primary, #fff); color: var(--oh-accent-foreground, #111); border-color: transparent; }
.ol button:disabled { opacity: .4; cursor: default; }
.ol .err { color: #f87171; font-size: 12px; min-height: 16px; }
.ol .holder { flex: 1; min-height: 0; width: min(1100px, 100%); display: flex; }
.ol iframe { flex: 1; width: 100%; min-height: 240px; border: 1px solid var(--oh-border-subtle, #3a3a3a); border-radius: 12px; background: #fff; }
.ol [hidden] { display: none !important; }
`;

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function writeSaved(next) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* no storage */ }
}

export function mountTarget(container, id) {
  const target = TARGETS[id];
  const root = el("div", "ol");
  container.append(el("style", "", CSS), root);
  let address = readSaved()[id] || "";
  let framed = false;

  const card = el("div", "card");
  const label = el("label", "", "Address");
  const input = el("input");
  input.type = "text";
  input.placeholder = target.placeholder;
  input.value = address;
  input.setAttribute("aria-label", `${target.title} address`);
  label.append(input);
  const err = el("div", "err");
  err.setAttribute("role", "alert");
  const row = el("div", "row");
  const save = el("button", "primary", "Save");
  save.type = "button";
  const open = el("button", "", "Open in new tab");
  open.type = "button";
  const embed = el("button", "", "Show here");
  embed.type = "button";
  row.append(save, open, embed);
  card.append(el("h1", "", target.title), el("p", "", target.blurb), label, row, err);
  root.append(card);
  const holder = el("div", "holder");
  root.append(holder);

  // Fill the visible page below wherever the host put us (hosts may not give a definite height).
  function fit() {
    const top = Math.max(0, root.getBoundingClientRect().top);
    root.style.height = `${Math.max(480, (window.innerHeight || 800) - top)}px`;
  }
  const current = () => cleanAddress(input.value);
  const refresh = () => {
    const ok = Boolean(cleanAddress(address));
    open.disabled = !ok;
    embed.disabled = !ok;
    embed.textContent = framed ? "Hide" : "Show here";
    holder.replaceChildren();
    fit();
    if (framed && ok) {
      const frame = el("iframe");
      frame.src = cleanAddress(address);
      frame.title = target.title;
      frame.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin allow-popups");
      holder.append(frame);
    }
  };
  save.addEventListener("click", () => {
    const next = current();
    if (input.value.trim() && !next) { err.textContent = "Enter a web address that starts with http or https."; return; }
    err.textContent = "";
    address = next || "";
    input.value = address;
    writeSaved({ ...readSaved(), [id]: address });
    refresh();
  });
  open.addEventListener("click", () => {
    const url = cleanAddress(address);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });
  embed.addEventListener("click", () => { framed = !framed; refresh(); });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") save.click(); });
  const onResize = () => fit();
  window.addEventListener("resize", onResize);
  const ro = typeof window.ResizeObserver === "function" && container.parentElement ? new window.ResizeObserver(onResize) : null;
  ro?.observe(container.parentElement || container);
  refresh();
  return () => {
    window.removeEventListener("resize", onResize);
    ro?.disconnect();
    root.remove();
  };
}

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("OHE and Superadmin requires Canvas host API 1.");
  const disposers = Object.keys(TARGETS).map((id) => host.registerPage(id, ({ container }) => mountTarget(container, id)));
  return () => disposers.forEach((d) => typeof d === "function" && d());
}

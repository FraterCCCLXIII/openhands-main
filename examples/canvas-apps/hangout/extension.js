/* Hangout — a Canvas App for talking to your agents like teammates: a list of agents
 * with their latest update, a chat with the one you pick, and their screen and routines
 * beside it.
 *
 * Browser-only, dependency-free ESM. Styles are scoped under `.hg`; text is always set
 * with textContent. Sample agents and threads are stored in this browser's localStorage.
 * With a reachable Agent Server it also lists your real conversations as agents, shows
 * their latest messages, and sends your message into the conversation.
 */

const STORAGE_KEY = "hangout:v1";

const BLOBS = [
  { id: "violet", fill: "#8B5CF6", path: "M32 6c14 0 24 10 24 24 0 16-11 28-24 28S8 46 8 30C8 16 18 6 32 6Z" },
  { id: "blue", fill: "#2D9CF0", path: "M32 4c9 14 22 22 22 36 0 11-10 20-22 20S10 51 10 40C10 26 23 18 32 4Z" },
  { id: "green", fill: "#2FBF71", path: "M18 18c4-8 12-8 14-2 3-6 12-6 15 2 7 1 12 9 8 17-3 7-10 9-16 8-6 4-14 4-19-2-7-3-9-12-5-18 0-2 1-4 3-5Z" },
  { id: "teal", fill: "#19B5A5", path: "M10 14c0-5 4-8 9-8h14c9 0 15 7 15 16s-6 14-14 14H21c-6 0-11-4-11-10Z" },
  { id: "brown", fill: "#8A5A3C", path: "M32 6c15 0 26 10 26 25S47 58 32 58 6 46 6 31 17 6 32 6Z" },
  { id: "orange", fill: "#F5760A", path: "M32 5c14 0 25 11 25 26 0 14-10 26-25 26S7 45 7 31C7 16 18 5 32 5Z" },
  { id: "red", fill: "#EF4444", path: "M12 22c0-8 6-14 14-14h12c8 0 14 6 14 14v10c0 8-6 14-14 14H26c-8 0-14-6-14-14Z" },
  { id: "pink", fill: "#EC4899", path: "M32 6 58 52H6Z" },
  { id: "indigo", fill: "#5B5BF0", path: "M14 12h36c3 0 6 3 6 6v28c0 3-3 6-6 6H14c-3 0-6-3-6-6V18c0-3 3-6 6-6Z" },
];

const SAMPLE_AGENTS = [
  { id: "chief", name: "Chief of Staff", blob: "violet", time: "7:34 PM", unread: false,
    thread: [
      ["me", "Hey, what's the latest update we have on Brightside Health?"],
      ["agent", "From last meeting's call notes, they need to see support for Slack integration and SSO before they proceed with a pilot."],
      ["agent", "PG plan and Brightside Health's account notes in CRM are up to date with the latest."],
      ["file", { name: "Kickoff Agenda.pdf", meta: "12 pages · 1.2 MB" }],
      ["me", "Perfect, those shipped last week, post an update to let them know"],
      ["agent", "Got it! Product updates shared and linked in #brightside-shared slack channel"],
    ],
    routines: [["Morning briefing", "Every day at 8:00 AM", true], ["Inbox cleanup", "Weekdays at 6:00 PM", true], ["Weekly team update", "Paused", false]] },
  { id: "ea", name: "EA", blob: "blue", time: "", unread: false, thread: [["agent", "Responded in 3 threads, with two meetings moved to Thursday."]], routines: [["Calendar sweep", "Every day at 7:30 AM", true]] },
  { id: "inbox", name: "Inbox Manager", blob: "green", time: "7:34 PM", unread: false, thread: [["agent", "Inbox at zero. 2 replies ready."]], routines: [["Triage", "Every 30 minutes", true]] },
  { id: "sales", name: "Sales Outbound", blob: "teal", time: "11:18 AM", unread: false, thread: [["agent", "Outreach drafts queued for approval."]], routines: [["Lead refresh", "Weekdays at 9:00 AM", true]] },
  { id: "talent", name: "Talent Scout", blob: "brown", time: "", unread: true, thread: [["agent", "Shortlist of 6 candidates ready for review."]], routines: [["Sourcing run", "Mondays at 10:00 AM", true]] },
  { id: "growth", name: "Growth Marketer", blob: "orange", time: "9:04 AM", unread: false, thread: [["agent", "A/B copy variants ready to review."]], routines: [["Experiment readout", "Fridays at 4:00 PM", true]] },
  { id: "support", name: "Customer Support", blob: "red", time: "2:20 PM", unread: false, thread: [["agent", "12 tickets resolved, 2 escalated."]], routines: [["Queue sweep", "Every hour", true]] },
  { id: "expense", name: "Expense Manager", blob: "pink", time: "Tuesday", unread: false, thread: [["agent", "Receipts coded. One needs a manager's approval."]], routines: [["Receipt coding", "Daily at 5:00 PM", true]] },
  { id: "invoice", name: "Invoice Collector", blob: "indigo", time: "Yesterday", unread: false, thread: [["agent", "Pulled 9 invoices from vendor portals."]], routines: [["Vendor pull", "Weekdays at 8:30 AM", true]] },
];

const SVG_NS = "http://www.w3.org/2000/svg";

export function blobSvg(blobId) {
  const blob = BLOBS.find((b) => b.id === blobId) || BLOBS[0];
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("aria-hidden", "true");
  const shape = document.createElementNS(SVG_NS, "path");
  shape.setAttribute("d", blob.path);
  shape.setAttribute("fill", blob.fill);
  svg.append(shape);
  [[24, 30], [40, 30]].forEach(([cx, cy]) => {
    const eye = document.createElementNS(SVG_NS, "ellipse");
    eye.setAttribute("cx", cx); eye.setAttribute("cy", cy); eye.setAttribute("rx", 2.4); eye.setAttribute("ry", 3.6);
    eye.setAttribute("fill", "#fff");
    svg.append(eye);
  });
  return svg;
}

/** Text of a MessageEvent from the Agent Server, or "". */
export function messageText(event) {
  if (!event || event.kind !== "MessageEvent") return "";
  const parts = event.llm_message?.content;
  if (!Array.isArray(parts)) return "";
  return parts.map((p) => (p && p.type === "text" ? p.text : "")).join("").trim();
}

/** Turns a conversation list item and its newest events into an agent row. */
export function liveAgent(conversation, events = []) {
  const messages = events
    .map((e) => ({ who: e.source === "user" ? "me" : "agent", text: messageText(e) }))
    .filter((m) => m.text);
  const last = messages.at(-1);
  return {
    id: `live:${conversation.id}`,
    conversationId: conversation.id,
    live: true,
    name: conversation.title || `Conversation ${String(conversation.id).slice(0, 6)}`,
    blob: BLOBS[hashOf(conversation.id) % BLOBS.length].id,
    time: shortTime(conversation.updated_at || conversation.created_at),
    unread: false,
    thread: messages.map((m) => [m.who, m.text]),
    preview: last?.text || "",
    routines: [],
  };
}

function hashOf(text) {
  let h = 0;
  for (let i = 0; i < String(text).length; i += 1) h = (h * 31 + String(text).charCodeAt(i)) >>> 0;
  return h;
}

export function shortTime(iso, now = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = 86_400_000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (d.getTime() >= startOfToday) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (d.getTime() >= startOfToday - day) return "Yesterday";
  if (d.getTime() >= startOfToday - 6 * day) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const CSS = `
.hg { --hg-bg: var(--oh-color-base, #171717); --hg-panel: var(--oh-color-base-secondary, #212121); --hg-raised: var(--oh-surface-raised, #2a2a2a);
  --hg-text: var(--oh-foreground, #eee); --hg-contrast: var(--oh-contrast, #fff); --hg-muted: var(--oh-muted, #9a9a9a);
  --hg-border: var(--oh-border-subtle, #3a3a3a); --hg-primary: var(--oh-color-primary, #fff); --hg-on-primary: var(--oh-accent-foreground, #111);
  --hg-success: var(--oh-success, #34d399);
  box-sizing: border-box; color: var(--hg-text); background: var(--hg-bg); font: 14px/1.45 system-ui, sans-serif; height: 100%; min-height: 560px; overflow: hidden; overscroll-behavior-x: contain; }
.hg *, .hg *::before, .hg *::after { box-sizing: border-box; }
.hg .shell { display: grid; grid-template-columns: 300px minmax(0, 1fr) 300px; height: 100%; min-height: 560px; }
.hg .col { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.hg .list { border-right: 1px solid var(--hg-border); padding: 12px 8px; gap: 4px; overflow: auto; }
.hg .search { width: 100%; margin: 0 0 8px; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--hg-border); background: var(--hg-panel); color: var(--hg-text); font: inherit; }
.hg .row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px; border: 0; border-radius: 12px; background: transparent; color: inherit; text-align: left; cursor: pointer; font: inherit; }
.hg .row:hover { background: var(--hg-panel); }
.hg .row[aria-current="true"] { background: var(--hg-raised); }
.hg .avatar { flex: none; width: 44px; height: 44px; }
.hg .avatar svg { width: 100%; height: 100%; display: block; }
.hg .avatar.sm { width: 28px; height: 28px; }
.hg .rowtext { min-width: 0; flex: 1; }
.hg .rowtop { display: flex; justify-content: space-between; gap: 8px; }
.hg .name { font-weight: 600; color: var(--hg-contrast); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hg .time { color: var(--hg-muted); font-size: 12px; flex: none; }
.hg .preview { color: var(--hg-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hg .dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; flex: none; }
.hg .tag { font-size: 11px; color: var(--hg-muted); border: 1px solid var(--hg-border); border-radius: 999px; padding: 0 6px; }
.hg .chat { background: var(--hg-bg); }
.hg .chathead { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--hg-border); font-weight: 600; color: var(--hg-contrast); }
.hg .msgs { flex: 1; overflow: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 8px; }
.hg .stamp { align-self: center; color: var(--hg-muted); font-size: 12px; margin-bottom: 4px; }
.hg .bubble { max-width: 78%; padding: 10px 16px; border-radius: 18px; white-space: pre-wrap; overflow-wrap: anywhere; }
.hg .bubble.agent { align-self: flex-start; background: var(--hg-raised); }
.hg .bubble.me { align-self: flex-end; background: var(--hg-primary); color: var(--hg-on-primary); }
.hg .file { align-self: flex-start; display: flex; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid var(--hg-border); border-radius: 14px; background: var(--hg-panel); }
.hg .fileicon { width: 36px; height: 40px; border-radius: 6px; background: color-mix(in srgb, #ef4444 18%, transparent); color: #ef4444; font-size: 10px; font-weight: 700; display: grid; place-items: center; }
.hg .composer { display: flex; align-items: center; gap: 8px; margin: 12px 16px 16px; padding: 6px 6px 6px 14px; border: 1px solid var(--hg-border); border-radius: 999px; background: var(--hg-panel); }
.hg .composer input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--hg-text); font: inherit; padding: 8px 0; }
.hg .send { border: 0; border-radius: 50%; width: 36px; height: 36px; background: var(--hg-primary); color: var(--hg-on-primary); cursor: pointer; font-weight: 700; }
.hg .send:disabled { opacity: .4; cursor: default; }
.hg .side { border-left: 1px solid var(--hg-border); padding: 16px; gap: 14px; overflow: auto; }
.hg .screen { border-radius: 14px; overflow: hidden; border: 1px solid var(--hg-border); background: var(--hg-panel); aspect-ratio: 16 / 10; display: grid; place-items: center; }
.hg .screen svg { width: 100%; height: 100%; display: block; }
.hg .caption { text-align: center; color: var(--hg-muted); margin-top: -6px; }
.hg h3 { margin: 6px 0 0; font-size: 13px; font-weight: 500; color: var(--hg-muted); }
.hg .routine { display: flex; gap: 10px; padding: 6px 0; }
.hg .rtitle { color: var(--hg-contrast); }
.hg .rsub { color: var(--hg-muted); }
.hg .ricon { flex: none; width: 18px; height: 18px; margin-top: 2px; border-radius: 50%; border: 2px solid var(--hg-success); }
.hg .ricon.off { border-color: var(--hg-muted); }
.hg .note { color: var(--hg-muted); font-size: 12px; padding: 4px 8px; }
.hg .empty { margin: auto; color: var(--hg-muted); }
@media (max-width: 1100px) { .hg .shell { grid-template-columns: 260px minmax(0, 1fr); } .hg .side { display: none; } }
@media (max-width: 640px) { .hg .shell { grid-template-columns: minmax(0, 1fr); } .hg .list { display: none; } }
`;

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function avatar(blobId, small) {
  const wrap = el("span", `avatar${small ? " sm" : ""}`);
  wrap.append(blobSvg(blobId));
  return wrap;
}

function screenArt(blobId) {
  const blob = BLOBS.find((b) => b.id === blobId) || BLOBS[0];
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 160 100");
  svg.setAttribute("aria-hidden", "true");
  const add = (tag, attrs) => {
    const n = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    svg.append(n);
  };
  add("rect", { x: 0, y: 0, width: 160, height: 100, fill: "#e9edf3" });
  add("rect", { x: 10, y: 8, width: 140, height: 84, rx: 4, fill: "#fff" });
  add("rect", { x: 10, y: 8, width: 140, height: 9, rx: 4, fill: "#d9dee7" });
  [[18, 24, 20, 28, "#2d9cf0"], [42, 24, 20, 16, "#2fbf71"], [66, 30, 20, 34, "#2d9cf0"], [90, 24, 20, 22, "#ef7c72"], [114, 28, 20, 40, "#2fbf71"]].forEach(([x, y, w, h, fill]) =>
    add("rect", { x, y, width: w, height: h, rx: 2, fill }));
  add("circle", { cx: 138, cy: 78, r: 8, fill: blob.fill, opacity: 0.9 });
  return svg;
}

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("Hangout requires Canvas host API 1.");
  return host.registerPage("hangout", ({ container }) => mount(host, container));
}

function mount(host, container) {
  const style = el("style", "", CSS);
  const root = el("div", "hg");
  container.append(style, root);
  let disposed = false;

  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  })();
  const state = {
    selected: saved.selected || "chief",
    query: "",
    threads: saved.threads || {},
    live: [],
    liveNote: "",
    draft: "",
    busy: false,
  };
  const persist = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ selected: state.selected, threads: state.threads })); } catch { /* storage unavailable */ }
  };

  const agents = () => [...state.live, ...SAMPLE_AGENTS];
  const current = () => agents().find((a) => a.id === state.selected) || agents()[0];
  const threadOf = (agent) => (agent.live ? agent.thread : [...agent.thread, ...(state.threads[agent.id] || [])]);

  async function loadLive() {
    try {
      const page = await host.agentServer.request({ path: "/api/conversations/search?limit=20" });
      const items = Array.isArray(page?.items) ? page.items : [];
      const loaded = await Promise.all(items.map(async (c) => {
        const res = await host.agentServer.request({ path: `/api/conversations/${c.id}/events/search?limit=30&sort_order=TIMESTAMP_DESC` }).catch(() => null);
        const events = Array.isArray(res?.items) ? [...res.items].reverse() : [];
        return liveAgent(c, events);
      }));
      state.live = loaded;
      state.liveNote = loaded.length ? "" : "No conversations on this Agent Server yet.";
    } catch {
      state.liveNote = "Agent Server not reachable: showing sample agents.";
    }
    if (!disposed) render();
  }

  async function send() {
    const text = state.draft.trim();
    const agent = current();
    if (!text || state.busy) return;
    state.draft = "";
    if (agent.live) {
      state.busy = true;
      agent.thread.push(["me", text]);
      render();
      try {
        await host.agentServer.request({ path: `/api/conversations/${agent.conversationId}/events`, method: "POST", body: { role: "user", content: [{ type: "text", text }], run: true } });
      } catch {
        agent.thread.push(["agent", "That message could not be delivered to the Agent Server."]);
      }
      state.busy = false;
    } else {
      state.threads[agent.id] = [...(state.threads[agent.id] || []), ["me", text]];
      persist();
    }
    render();
    const box = root.querySelector(".msgs");
    if (box) box.scrollTop = box.scrollHeight;
  }

  function listCol() {
    const col = el("div", "col list");
    const search = el("input", "search");
    search.type = "search";
    search.placeholder = "Search";
    search.setAttribute("aria-label", "Search agents");
    search.value = state.query;
    search.addEventListener("input", () => {
      state.query = search.value;
      render();
      const again = root.querySelector(".search");
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    });
    col.append(search);
    const q = state.query.trim().toLowerCase();
    agents().filter((a) => !q || a.name.toLowerCase().includes(q)).forEach((agent) => {
      const row = el("button", "row");
      row.type = "button";
      row.setAttribute("aria-current", String(agent.id === current().id));
      const text = el("span", "rowtext");
      const top = el("span", "rowtop");
      top.append(el("span", "name", agent.name), el("span", "time", agent.time));
      const last = threadOf(agent).filter((m) => m[0] !== "file").at(-1);
      const preview = el("span", "preview", agent.preview || (last ? last[1] : ""));
      text.append(top, preview);
      row.append(avatar(agent.blob), text);
      if (agent.unread) row.append(el("span", "dot"));
      if (agent.live) row.append(el("span", "tag", "live"));
      row.addEventListener("click", () => { state.selected = agent.id; persist(); render(); });
      col.append(row);
    });
    if (state.liveNote) col.append(el("p", "note", state.liveNote));
    return col;
  }

  function chatCol() {
    const agent = current();
    const col = el("div", "col chat");
    const head = el("div", "chathead");
    head.append(avatar(agent.blob, true), el("span", "", agent.name));
    const msgs = el("div", "msgs");
    msgs.setAttribute("role", "log");
    const thread = threadOf(agent);
    if (!thread.length) msgs.append(el("p", "empty", "No messages yet. Say hello."));
    thread.forEach(([who, body]) => {
      if (who === "file") {
        const card = el("div", "file");
        const info = el("div");
        info.append(el("div", "rtitle", body.name), el("div", "rsub", body.meta));
        card.append(el("span", "fileicon", "PDF"), info);
        msgs.append(card);
      } else {
        msgs.append(el("div", `bubble ${who}`, body));
      }
    });
    const composer = el("form", "composer");
    const input = el("input");
    input.placeholder = `Message ${agent.name}`;
    input.setAttribute("aria-label", `Message ${agent.name}`);
    input.value = state.draft;
    input.addEventListener("input", () => { state.draft = input.value; sendBtn.disabled = !state.draft.trim() || state.busy; });
    const sendBtn = el("button", "send", "↑");
    sendBtn.type = "submit";
    sendBtn.setAttribute("aria-label", "Send");
    sendBtn.disabled = !state.draft.trim() || state.busy;
    composer.append(input, sendBtn);
    composer.addEventListener("submit", (ev) => { ev.preventDefault(); send(); });
    col.append(head, msgs, composer);
    requestAnimationFrame(() => { msgs.scrollTop = msgs.scrollHeight; });
    return col;
  }

  function sideCol() {
    const agent = current();
    const col = el("div", "col side");
    const screen = el("div", "screen");
    screen.append(screenArt(agent.blob));
    col.append(screen, el("div", "caption", `${agent.name}'s screen`), el("h3", "", "Routines"));
    if (!agent.routines.length) col.append(el("p", "note", agent.live ? "Routines come from automations; none are linked to this conversation." : "No routines yet."));
    agent.routines.forEach(([title, when, on]) => {
      const row = el("div", "routine");
      const text = el("div");
      text.append(el("div", "rtitle", title), el("div", "rsub", when));
      row.append(el("span", `ricon${on ? "" : " off"}`), text);
      col.append(row);
    });
    col.append(el("p", "note", "Screen and routines are a preview until agents publish them."));
    return col;
  }

  function render() {
    if (disposed) return;
    const keep = root.querySelector(".composer input") === document.activeElement;
    root.replaceChildren();
    const shell = el("div", "shell");
    shell.append(listCol(), chatCol(), sideCol());
    root.append(shell);
    if (keep) root.querySelector(".composer input")?.focus();
  }

  render();
  loadLive();
  return () => {
    disposed = true;
    style.remove();
    root.remove();
  };
}

// Issue queue Canvas Extension (host API 1).
// Dependency-free ESM: the entrypoint must be one self-contained bundle.

const PRIORITY_ORDER = ["high", "normal", "low"];
const PRIORITY_RANK = { high: 0, normal: 1, low: 2 };
const STATUSES = ["queued", "running", "done", "failed"];
const DEFAULT_STATE = {
  projects: ["OpenHands", "software-agent-sdk"],
  agents: ["OpenHands Agent", "Claude Code (ACP)"],
  items: [],
};

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "text") node.textContent = value;
    else if (key === "on") {
      for (const [type, handler] of Object.entries(value)) {
        node.addEventListener(type, handler);
      }
    } else if (value !== undefined && value !== null) node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
}

function option(value, label = value, selected = false) {
  return el("option", { value, text: label, ...(selected ? { selected: "" } : {}) });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Storage is per backend so each Agent Server keeps its own queue.
function storageKey(host) {
  return `openhands-queue:v1:${host.backend.id}`;
}

function loadState(host) {
  try {
    const raw = localStorage.getItem(storageKey(host));
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : structuredClone(DEFAULT_STATE);
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(host, state) {
  try {
    localStorage.setItem(storageKey(host), JSON.stringify(state));
  } catch {
    /* storage unavailable: keep working in memory for this page view */
  }
}

function mountQueue(container, host) {
  const state = loadState(host);

  const projectSelect = el("select", { name: "project", required: "" });
  const agentSelect = el("select", { name: "agent", required: "" });
  const titleInput = el("input", { name: "title", required: "", maxlength: "200", placeholder: "e.g. Fix flaky settings test" });
  const urlInput = el("input", { name: "url", type: "url", placeholder: "https://github.com/…/issues/123" });
  const bodyInput = el("textarea", { name: "body", placeholder: "Context for the agent" });
  const prioritySelect = el("select", { name: "priority" }, PRIORITY_ORDER.map((p) => option(p, p[0].toUpperCase() + p.slice(1), p === "normal")));

  const statsRow = el("div", { class: "oq-stats" });
  const filterProject = el("select", { "aria-label": "Filter by project" });
  const filterAgent = el("select", { "aria-label": "Filter by agent" });
  const filterStatus = el("select", { "aria-label": "Filter by status" }, [option("", "All statuses"), ...STATUSES.map((s) => option(s, s[0].toUpperCase() + s.slice(1)))]);
  const queueBody = el("tbody");
  const emptyMessage = el("p", { class: "oq-empty", text: "Nothing queued for this filter.", hidden: "" });

  const projectList = el("ul", { class: "oq-list" });
  const agentList = el("ul", { class: "oq-list" });
  const newProjectInput = el("input", { placeholder: "Project name" });
  const newAgentInput = el("input", { placeholder: "Agent name" });

  function persistAndRender() {
    saveState(host, state);
    render();
  }

  function fillSelect(select, values, { placeholder, keep } = {}) {
    const previous = keep ?? select.value;
    select.replaceChildren(
      ...(placeholder !== undefined ? [option("", placeholder)] : []),
      ...values.map((v) => option(v, v, v === previous)),
    );
    if (values.includes(previous)) select.value = previous;
  }

  function removeItem(item) {
    state.items = state.items.filter((it) => it !== item);
  }

  function bumpPriority(item, delta) {
    const next = PRIORITY_ORDER.indexOf(item.priority) + delta;
    if (next >= 0 && next < PRIORITY_ORDER.length) item.priority = PRIORITY_ORDER[next];
  }

  function visibleItems() {
    const project = filterProject.value;
    const agent = filterAgent.value;
    const status = filterStatus.value;
    return state.items
      .filter((it) => (!project || it.project === project) && (!agent || it.agent === agent) && (!status || it.status === status))
      .sort((a, b) => {
        const byStatus = (a.status === "queued" ? 0 : 1) - (b.status === "queued" ? 0 : 1);
        if (byStatus) return byStatus;
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.createdAt - b.createdAt;
      });
  }

  function actionButton(label, onClick, extra = {}) {
    return el("button", { type: "button", text: label, ...extra, on: { click: onClick } });
  }

  function rowActions(item) {
    const buttons = [];
    if (item.status === "queued") buttons.push(actionButton("Start", () => { item.status = "running"; item.startedAt = Date.now(); persistAndRender(); }));
    if (item.status === "running") {
      buttons.push(actionButton("Done", () => { item.status = "done"; persistAndRender(); }));
      buttons.push(actionButton("Failed", () => { item.status = "failed"; persistAndRender(); }));
    }
    if (item.status === "failed") buttons.push(actionButton("Requeue", () => { item.status = "queued"; persistAndRender(); }));
    buttons.push(actionButton("↑", () => { bumpPriority(item, 1); persistAndRender(); }, { title: "Raise priority" }));
    buttons.push(actionButton("↓", () => { bumpPriority(item, -1); persistAndRender(); }, { title: "Lower priority" }));
    buttons.push(actionButton("Remove", () => { removeItem(item); persistAndRender(); }, { class: "oq-danger" }));
    return el("div", { class: "oq-actions" }, buttons);
  }

  function renderQueue() {
    const items = visibleItems();
    emptyMessage.hidden = items.length > 0;
    queueBody.replaceChildren(
      ...items.map((it, i) =>
        el("tr", {}, [
          el("td", { text: String(i + 1) }),
          el("td", {}, [
            el("div", { class: "oq-issue-title", text: it.title }),
            ...(it.body ? [el("div", { class: "oq-muted", text: it.body })] : []),
            ...(it.url ? [el("a", { href: it.url, target: "_blank", rel: "noopener noreferrer", text: "Open issue ↗" })] : []),
          ]),
          el("td", { text: it.project }),
          el("td", { text: it.agent }),
          el("td", { text: it.priority }),
          el("td", {}, [el("span", { class: `oq-badge oq-${it.status}`, text: it.status })]),
          el("td", {}, [rowActions(it)]),
        ]),
      ),
    );
  }

  function renderLists() {
    const listItem = (label, onRemove) =>
      el("li", {}, [el("span", { text: label }), actionButton("✕", onRemove, { class: "oq-danger", title: "Remove" })]);
    projectList.replaceChildren(
      ...state.projects.map((p) => listItem(p, () => {
        state.projects = state.projects.filter((x) => x !== p);
        state.items = state.items.filter((it) => it.project !== p);
        persistAndRender();
      })),
    );
    agentList.replaceChildren(
      ...state.agents.map((a) => listItem(a, () => {
        state.agents = state.agents.filter((x) => x !== a);
        state.items = state.items.filter((it) => it.agent !== a);
        persistAndRender();
      })),
    );
  }

  function renderStats() {
    const count = (s) => state.items.filter((it) => it.status === s).length;
    const stat = (label, n) => el("div", { class: "oq-stat" }, [el("b", { text: String(n) }), document.createTextNode(label)]);
    statsRow.replaceChildren(
      stat("Total", state.items.length),
      ...STATUSES.map((s) => stat(s[0].toUpperCase() + s.slice(1), count(s))),
    );
  }

  function render() {
    fillSelect(projectSelect, state.projects);
    fillSelect(agentSelect, state.agents);
    fillSelect(filterProject, state.projects, { placeholder: "All projects" });
    fillSelect(filterAgent, state.agents, { placeholder: "All agents" });
    renderLists();
    renderStats();
    renderQueue();
  }

  const enqueueForm = el("form", { class: "oq-panel", on: {
    submit: (event) => {
      event.preventDefault();
      state.items.push({
        id: uid(),
        project: projectSelect.value,
        agent: agentSelect.value,
        title: titleInput.value.trim(),
        url: urlInput.value.trim(),
        body: bodyInput.value.trim(),
        priority: prioritySelect.value,
        status: "queued",
        createdAt: Date.now(),
      });
      enqueueForm.reset();
      persistAndRender();
    },
  } }, [
    el("h2", { text: "Queue an issue" }),
    el("label", {}, [el("span", { text: "Project" }), projectSelect]),
    el("label", {}, [el("span", { text: "Agent" }), agentSelect]),
    el("label", {}, [el("span", { text: "Issue title" }), titleInput]),
    el("label", {}, [el("span", { text: "Issue URL (optional)" }), urlInput]),
    el("label", {}, [el("span", { text: "Details (optional)" }), bodyInput]),
    el("label", {}, [el("span", { text: "Priority" }), prioritySelect]),
    el("button", { type: "submit", class: "oq-primary", text: "Add to queue" }),
  ]);

  const addRow = (input, onAdd) =>
    el("div", { class: "oq-row" }, [input, actionButton("Add", () => {
      const value = input.value.trim();
      if (value) onAdd(value);
      input.value = "";
      persistAndRender();
    })]);

  const sidebar = el("div", { class: "oq-stack" }, [
    enqueueForm,
    el("section", { class: "oq-panel" }, [
      el("h2", { text: "Projects" }),
      projectList,
      addRow(newProjectInput, (name) => { if (!state.projects.includes(name)) state.projects.push(name); }),
    ]),
    el("section", { class: "oq-panel" }, [
      el("h2", { text: "Agents" }),
      agentList,
      addRow(newAgentInput, (name) => { if (!state.agents.includes(name)) state.agents.push(name); }),
    ]),
  ]);

  const queuePanel = el("section", { class: "oq-panel" }, [
    el("h2", { text: "Full issue queue" }),
    el("div", { class: "oq-filters" }, [filterProject, filterAgent, filterStatus]),
    el("div", { class: "oq-table-wrap" }, [
      el("table", {}, [
        el("thead", {}, [el("tr", {}, ["#", "Issue", "Project", "Agent", "Priority", "Status", "Actions"].map((h) => el("th", { text: h })))]),
        queueBody,
      ]),
    ]),
    emptyMessage,
  ]);

  [filterProject, filterAgent, filterStatus].forEach((select) => select.addEventListener("change", renderQueue));

  const style = el("style", { text: STYLE });
  const root = el("div", { class: "oq-root" }, [
    el("header", { class: "oq-header" }, [el("h1", { text: "Issue queue" }), statsRow]),
    el("main", { class: "oq-main" }, [sidebar, queuePanel]),
  ]);

  container.replaceChildren(style, root);
  render();
  return () => container.replaceChildren();
}

const STYLE = `
.oq-root { font: 14px/1.45 system-ui, sans-serif; color: var(--oh-text-primary, #e6e8eb); background: var(--oh-color-base, #0f1115); min-height: 100%; }
.oq-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 14px 20px; border-bottom: 1px solid #2a2e37; }
.oq-header h1 { font-size: 16px; margin: 0; }
.oq-main { display: grid; grid-template-columns: 340px 1fr; gap: 16px; padding: 16px 20px; }
@media (max-width: 860px) { .oq-main { grid-template-columns: 1fr; } }
.oq-stack > * + * { margin-top: 14px; }
.oq-panel { background: rgba(255,255,255,0.03); border: 1px solid #2a2e37; border-radius: 10px; padding: 14px; }
.oq-panel h2 { font-size: 14px; margin: 0 0 10px; }
.oq-panel label { display: block; font-size: 12px; opacity: .75; margin: 8px 0 4px; }
.oq-panel label span { display: block; margin-bottom: 4px; }
input, select, textarea { width: 100%; box-sizing: border-box; padding: 7px 9px; border: 1px solid #2a2e37; border-radius: 6px; background: transparent; color: inherit; font: inherit; }
textarea { min-height: 70px; resize: vertical; }
button { padding: 6px 10px; border: 1px solid #2a2e37; border-radius: 6px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
button:hover { border-color: #60a5fa; }
button.oq-primary { background: #2563eb; border-color: #2563eb; color: #fff; width: 100%; margin-top: 12px; }
button.oq-danger { color: #f87171; }
.oq-row { display: flex; gap: 6px; margin-top: 10px; } .oq-row input { flex: 1; }
.oq-list { list-style: none; padding: 0; margin: 0; }
.oq-list li { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #2a2e37; }
.oq-stats { display: flex; gap: 8px; flex-wrap: wrap; }
.oq-stat { padding: 6px 10px; border: 1px solid #2a2e37; border-radius: 8px; font-size: 12px; }
.oq-stat b { display: block; font-size: 16px; }
.oq-filters { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
@media (max-width: 600px) { .oq-filters { grid-template-columns: 1fr; } }
.oq-table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #2a2e37; vertical-align: top; }
th { font-size: 12px; opacity: .7; font-weight: 500; }
.oq-issue-title { font-weight: 600; }
.oq-muted { opacity: .7; font-size: 12px; }
.oq-badge { display: inline-block; padding: 1px 8px; border: 1px solid currentColor; border-radius: 999px; font-size: 11px; }
.oq-queued { color: #9ca3af; } .oq-running { color: #60a5fa; } .oq-done { color: #4ade80; } .oq-failed { color: #f87171; }
.oq-actions { display: flex; gap: 4px; flex-wrap: wrap; }
.oq-actions button { padding: 3px 7px; font-size: 12px; }
.oq-empty { opacity: .7; text-align: center; padding: 24px 0; }
`;

export function activate(host) {
  return host.registerPage("queue", ({ container }) => mountQueue(container, host));
}

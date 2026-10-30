/**
 * Connectome memory — an App for Agent Canvas.
 *
 * The page shows the options the overlap index reads, the Canvas
 * conversations on the active Agent Server, and the local indexes and
 * eval files the sidecar summarizes. The chat model is display-only:
 * Opus (or whichever profile is saved) keeps talking. This file is the
 * Blob entrypoint, so it has no imports. The sidecar at 127.0.0.1:8765
 * is a local-only bridge; a portable Agent Server does not expose it.
 */

const SIDECAR_ORIGIN = "http://127.0.0.1:8765";

const STYLE = `
.connectome-memory {
  --cm-bg: var(--oh-color-base, #0B0E14); --cm-panel: var(--oh-color-base-secondary, #21252F); --cm-raised: var(--oh-surface-raised, #2C313F);
  --cm-text: var(--oh-foreground, #EEF2F7); --cm-contrast: var(--oh-contrast, #FFFFFF); --cm-muted: var(--oh-muted, #A3B0C4);
  --cm-border: var(--oh-border-subtle, #383F50); --cm-primary: var(--oh-color-primary, #C9B974); --cm-on-primary: var(--oh-accent-foreground, #0B0E14);
  --cm-danger: var(--oh-danger, #E76A5E); --cm-success: var(--oh-success, #A5E75E);
  color: var(--cm-text); font: 14px/1.45 system-ui, sans-serif; display: flex; flex-direction: column; gap: 16px;
  box-sizing: border-box; height: 100%; min-height: 480px; overflow-y: auto; padding: 24px 12px 32px 24px; scrollbar-color: var(--cm-border) var(--cm-panel); overscroll-behavior-x: contain;
}
.connectome-memory *, .connectome-memory *::before, .connectome-memory *::after { box-sizing: border-box; }
.connectome-memory > * { width: 100%; }
.connectome-memory [hidden] { display: none !important; }
.connectome-memory h1 { font-size: 22px; margin: 0; font-weight: 600; color: var(--cm-contrast); }
.connectome-memory h2 { font-size: 15px; margin: 0; font-weight: 600; color: var(--cm-contrast); }
.connectome-memory p { margin: 0; }
.connectome-memory .cm-muted { color: var(--cm-muted); }
.connectome-memory .cm-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.connectome-memory button {
  background: var(--cm-raised); color: var(--cm-text); border: 1px solid var(--cm-border); border-radius: 8px;
  padding: 6px 14px; cursor: pointer; font: inherit;
}
.connectome-memory button:hover { border-color: var(--cm-muted); }
.connectome-memory button:disabled { opacity: .5; cursor: default; }
.connectome-memory button.cm-primary, .connectome-memory button[data-action="save"] { background: var(--cm-primary); color: var(--cm-on-primary); border-color: transparent; font-weight: 600; }
.connectome-memory .cm-nav { display: inline-flex; width: fit-content; padding: 3px; gap: 2px; background: var(--cm-panel); border: 1px solid var(--cm-border); border-radius: 10px; }
.connectome-memory .cm-nav button { border: 0; background: transparent; color: var(--cm-muted); padding: 5px 16px; }
.connectome-memory .cm-nav button:hover { color: var(--cm-contrast); }
.connectome-memory .cm-nav button[aria-current="page"] { background: var(--cm-raised); color: var(--cm-contrast); font-weight: 600; }
.connectome-memory button:focus-visible, .connectome-memory input:focus-visible, .connectome-memory a:focus-visible { outline: 2px solid var(--cm-contrast); outline-offset: 2px; }
.connectome-memory .cm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 12px; }
.connectome-memory .cm-card, .connectome-memory form {
  background: var(--cm-panel); border: 1px solid var(--cm-border); border-radius: 12px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 10px;
}
.connectome-memory .cm-card > h2 { padding-bottom: 8px; border-bottom: 1px solid var(--cm-border); }
.connectome-memory .cm-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px 16px; }
.connectome-memory label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--cm-muted); }
.connectome-memory label.cm-check { flex-direction: row; align-items: center; gap: 8px; font-size: 13px; color: var(--cm-text); }
.connectome-memory input[type="text"], .connectome-memory input[type="number"] {
  font: inherit; font-size: 14px; color: var(--cm-text); background: var(--cm-bg);
  border: 1px solid var(--cm-border); border-radius: 8px; padding: 7px 10px; width: 100%;
}
.connectome-memory input[type="text"]:hover, .connectome-memory input[type="number"]:hover { border-color: var(--cm-muted); }
.connectome-memory input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--cm-primary); margin: 0; }
.connectome-memory table { width: 100%; border-collapse: collapse; font-size: 13px; }
.connectome-memory th { color: var(--cm-muted); font-weight: 500; font-size: 12px; }
.connectome-memory th, .connectome-memory td { text-align: left; padding: 8px 10px; vertical-align: top; border-bottom: 1px solid var(--cm-border); }
.connectome-memory tr:last-child td { border-bottom: 0; }
.connectome-memory .cm-error { color: var(--cm-danger); border-color: var(--cm-danger); }
.connectome-memory .cm-error:empty { display: none; }
.connectome-memory ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; }
.connectome-memory a { color: var(--cm-primary); }
.connectome-memory code { background: var(--cm-bg); border: 1px solid var(--cm-border); border-radius: 6px; padding: 1px 6px; font-size: 12px; }
@media (prefers-reduced-motion: reduce) { .connectome-memory * { transition: none !important; } }
`;

export function activate(host) {
  if (host.apiVersion !== "1") {
    throw new Error("This app requires host API 1.");
  }
  const base = `/extensions/${host.extension.name}/memory`;
  return host.registerPage("memory", ({ container, path, navigate }) =>
    mountMemory({ container, path, navigate, base, host, fetchImpl: globalThis.fetch }),
  );
}

/**
 * Draw one visit to the memory page.
 *
 * Canvas remounts on every nested route, so this function owns the DOM
 * for ``path`` and returns a disposer. ``fetchImpl`` is the sidecar
 * client; tests pass a stub. Agent Server calls go through ``host``.
 */
export function mountMemory({ container, path, navigate, base, host, fetchImpl }) {
  const style = document.createElement("style");
  style.setAttribute("data-app", "connectome-memory");
  style.textContent = STYLE;
  document.head ? document.head.append(style) : container.append(style);

  const root = document.createElement("section");
  root.className = "connectome-memory";
  container.append(root);

  const screen = routeScreen(path);
  const state = { disposed: false, timer: 0, controllers: [] };
  drawShell(root, screen, base, navigate);
  const regions = {
    status: root.querySelector('[data-region="status"]'),
    model: root.querySelector('[data-region="model"]'),
    options: root.querySelector('[data-region="options"]'),
    conversations: root.querySelector('[data-region="conversations"]'),
    memory: root.querySelector('[data-region="memory"]'),
    tests: root.querySelector('[data-region="tests"]'),
    detail: root.querySelector('[data-region="detail"]'),
  };

  fillText(regions.status, "Checking the local memory service…");
  // Fill the visible page below wherever the host put us (hosts may not give a definite height).
  const fit = () => {
    const top = Math.max(0, root.getBoundingClientRect().top);
    root.style.height = `${Math.max(480, (globalThis.innerHeight || 800) - top)}px`;
  };
  const onResize = () => fit();
  if (typeof globalThis.addEventListener === "function") globalThis.addEventListener("resize", onResize);
  const ro = typeof globalThis.ResizeObserver === "function" && container.parentElement ? new globalThis.ResizeObserver(onResize) : null;
  ro?.observe(container.parentElement || container);
  const refresh = () => {
    fit();
    return loadAll({ regions, screen, host, fetchImpl, state, base, navigate }).then(() => { if (!state.disposed) fit(); });
  };
  root.addEventListener("click", (event) => onClick(event, { regions, refresh, fetchImpl, state, base, navigate }));
  refresh();
  state.timer = setInterval(() => {
    if (document.visibilityState === "hidden") return;
    refresh();
  }, 15000);

  return () => {
    state.disposed = true;
    clearInterval(state.timer);
    if (typeof globalThis.removeEventListener === "function") globalThis.removeEventListener("resize", onResize);
    ro?.disconnect();
    for (const controller of state.controllers) controller.abort();
    root.remove();
    style.remove();
  };
}

export function routeScreen(path) {
  const rest = (path || "").replace(/^\/+|\/+$/g, "");
  if (!rest) return { name: "dashboard" };
  if (rest === "options") return { name: "options" };
  if (rest === "tests") return { name: "tests" };
  const conversation = rest.match(/^conversations\/([^/]+)$/);
  if (conversation) return { name: "conversation", id: decodeURIComponent(conversation[1]) };
  return { name: "unknown", raw: rest };
}

export function readModel(settings) {
  const llm = settings && settings.agent_settings && settings.agent_settings.llm;
  const condenser = settings && settings.agent_settings && settings.agent_settings.condenser;
  return {
    model: (llm && llm.model) || "unavailable",
    condenser: (condenser && condenser.condenser_kind) || "unavailable",
    condenserEnabled: Boolean(condenser && condenser.enabled),
  };
}

export function readConversations(page) {
  const items = page && Array.isArray(page.items) ? page.items : [];
  return items.map((item) => {
    const usage = item && item.stats && item.stats.usage_to_metrics && item.stats.usage_to_metrics.default;
    const tokens = usage && usage.accumulated_token_usage;
    return {
      id: item && item.id ? String(item.id) : "",
      title: (item && item.title) || "Untitled",
      status: (item && item.execution_status) || "",
      model: (usage && usage.model_name) || "",
      promptTokens: tokens && Number.isFinite(tokens.prompt_tokens) ? tokens.prompt_tokens : null,
      completionTokens: tokens && Number.isFinite(tokens.completion_tokens) ? tokens.completion_tokens : null,
      cost: usage && Number.isFinite(usage.accumulated_cost) ? usage.accumulated_cost : null,
    };
  });
}

function drawShell(root, screen, base, navigate) {
  const title = document.createElement("h1");
  title.textContent = "Connectome memory";
  const lead = document.createElement("p");
  lead.className = "cm-muted";
  lead.textContent =
    "The Agent Canvas model keeps writing. These controls change the overlap index that replaces the summarizer: what is stored, and what is recalled into the prompt.";
  root.append(title, lead, navRow(base, navigate, screen));

  if (screen.name === "unknown") {
    const missing = document.createElement("p");
    missing.dataset.region = "unknown";
    missing.textContent = "That page is not part of Connectome memory.";
    root.append(missing);
    return;
  }

  root.append(card("Service", "status", "Loading…"));
  root.append(card("Canvas model", "model", "Loading the active profile…"));
  if (screen.name === "dashboard" || screen.name === "options") root.append(optionsForm());
  if (screen.name === "dashboard" || screen.name === "conversation") {
    root.append(card("Canvas conversations", "conversations", "Loading conversations…"));
    root.append(card("Memory indexes", "memory", "Loading indexes…"));
  }
  if (screen.name === "conversation") root.append(card("Index", "detail", "Loading notes…"));
  if (screen.name === "dashboard" || screen.name === "tests") root.append(testsCard());
}

function navRow(base, navigate, screen) {
  const row = document.createElement("div");
  row.className = "cm-row cm-nav";
  for (const [label, suffix] of [
    ["Dashboard", ""],
    ["Options", "/options"],
    ["Tests", "/tests"],
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.nav = suffix || "/";
    if ((screen.name === "dashboard" && !suffix) || (screen.name === "options" && suffix === "/options") || (screen.name === "tests" && suffix === "/tests")) button.setAttribute("aria-current", "page");
    button.textContent = label;
    button.addEventListener("click", () => navigate(base + suffix));
    row.append(button);
  }
  return row;
}

function card(heading, region, placeholder) {
  const section = document.createElement("section");
  section.className = "cm-card";
  const h2 = document.createElement("h2");
  h2.textContent = heading;
  const body = document.createElement("div");
  body.dataset.region = region;
  body.textContent = placeholder;
  section.append(h2, body);
  return section;
}

function optionsForm() {
  const form = document.createElement("form");
  form.dataset.region = "options";
  form.addEventListener("submit", (event) => event.preventDefault());
  const heading = document.createElement("h2");
  heading.textContent = "Memory options";
  const note = document.createElement("p");
  note.className = "cm-muted";
  note.textContent =
    "Saved here and read on the next condensation. The Canvas profile is not changed. The local service must be running for a save to stick.";
  form.append(heading, note);
  const fields = document.createElement("div");
  fields.className = "cm-fields";
  fields.append(
    field("max_size", "Max events before recall", "number"),
    field("keep_first", "Events kept at the start", "number"),
    field("top_k", "Notes recalled into the prompt", "number"),
    field("memory_root", "Index directory", "text"),
    field("embed_model", "Embedding model", "text"),
    field("ollama_base_url", "Ollama URL", "text"),
  );
  form.append(fields);
  const fit = document.createElement("label");
  fit.className = "cm-check";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.name = "fit_corpus";
  fit.append(box, document.createTextNode(" Center keys on the eval corpus"));
  const actions = document.createElement("div");
  actions.className = "cm-row";
  const save = document.createElement("button");
  save.type = "submit";
  save.dataset.action = "save";
  save.textContent = "Save options";
  const error = document.createElement("p");
  error.dataset.region = "form-error";
  error.className = "cm-error";
  actions.append(save);
  form.append(fit, actions, error);
  return form;
}

function field(name, label, type) {
  const wrap = document.createElement("label");
  wrap.textContent = label;
  const input = document.createElement("input");
  input.name = name;
  input.type = type;
  if (type === "number") input.min = "0";
  wrap.append(input);
  return wrap;
}

function testsCard() {
  const section = card("Tests and measurements", "tests", "Loading saved results…");
  const run = document.createElement("button");
  run.type = "button";
  run.dataset.action = "run-tests";
  run.textContent = "Run memory unit tests";
  section.append(run);
  return section;
}

function onClick(event, ctx) {
  const target = event.target;
  if (!target || !target.dataset) return;
  if (target.dataset.action === "save") {
    event.preventDefault();
    saveOptions(ctx);
  }
  if (target.dataset.action === "run-tests") runTests(ctx);
  if (target.dataset.memoryId && ctx.navigate) {
    ctx.navigate(`${ctx.base}/conversations/${encodeURIComponent(target.dataset.memoryId)}`);
  }
}

async function loadAll(ctx) {
  const controller = new AbortController();
  ctx.state.controllers.push(controller);
  const [health, metrics, settings, conversations] = await Promise.all([
    sidecarGet("/health", ctx.fetchImpl, controller.signal),
    sidecarGet("/metrics", ctx.fetchImpl, controller.signal),
    agentGet(ctx.host, "/api/settings"),
    agentGet(ctx.host, "/api/conversations/search?limit=20"),
  ]);
  if (ctx.state.disposed) return;
  paintStatus(ctx.regions.status, health, metrics);
  paintModel(ctx.regions.model, settings);
  if (ctx.regions.options && metrics && metrics.ok) fillOptions(ctx.regions.options, await sidecarGet("/options", ctx.fetchImpl, controller.signal));
  paintConversations(ctx.regions.conversations, conversations, metrics);
  paintMemory(ctx.regions.memory, metrics);
  paintDetail(ctx.regions.detail, metrics, ctx.screen);
  paintTests(ctx.regions.tests, metrics);
}

function paintStatus(region, health, metrics) {
  if (!region) return;
  clear(region);
  if (!health.ok) {
    const p = document.createElement("p");
    p.textContent =
      "The local memory service is not running. From the Connectome-Alpha repo: PYTHONPATH=. python -m openhands_app.sidecar";
    region.append(p);
    return;
  }
  const ollama = metrics.ok && metrics.body && metrics.body.ollama;
  const line = document.createElement("p");
  line.textContent = ollama && ollama.ok
    ? `Memory service ${health.body.version}. Embedding model is available at Ollama.`
    : `Memory service ${health.body.version}. Ollama does not list the embedding model yet.`;
  region.append(line);
}

function paintModel(region, settings) {
  if (!region) return;
  clear(region);
  if (!settings.ok) {
    fillText(region, "The Agent Server did not return settings.");
    return;
  }
  const model = readModel(settings.body);
  const p = document.createElement("p");
  p.textContent = `${model.model}. Condenser in settings: ${model.condenser}${model.condenserEnabled ? "" : " (off)"}.`;
  const hint = document.createElement("p");
  hint.className = "cm-muted";
  hint.textContent =
    "Conversations use the overlap condenser. Settings still name the built-in summarizer, because Canvas cannot store a custom condenser kind. The chat model stays the one above.";
  region.append(p, hint);
}

function fillOptions(form, response) {
  if (!response.ok || !response.body) {
    const error = form.querySelector('[data-region="form-error"]');
    if (error) error.textContent = "Could not load saved options.";
    return;
  }
  const body = response.body;
  for (const input of form.querySelectorAll("input")) {
    if (input.type === "checkbox") input.checked = Boolean(body[input.name]);
    else if (body[input.name] != null) input.value = String(body[input.name]);
  }
}

function paintConversations(region, conversations, metrics) {
  if (!region) return;
  clear(region);
  if (!conversations.ok) {
    fillText(region, "Could not list Canvas conversations.");
    return;
  }
  const rows = readConversations(conversations.body);
  const indexes = new Set(((metrics.body && metrics.body.conversations) || []).map((item) => item.id));
  if (!rows.length) {
    fillText(region, "No conversations on this Agent Server yet.");
    return;
  }
  const table = document.createElement("table");
  table.append(headerRow(["Title", "Status", "Prompt tokens", "Output tokens", "Cost", "Memory"]));
  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.append(
      cell(row.title),
      cell(row.status),
      cell(row.promptTokens == null ? "—" : String(row.promptTokens)),
      cell(row.completionTokens == null ? "—" : String(row.completionTokens)),
      cell(row.cost == null ? "—" : `$${row.cost.toFixed(4)}`),
      cell(indexes.has(row.id) ? "index" : "no index"),
    );
    table.append(tr);
  }
  region.append(table);
}

function paintMemory(region, metrics) {
  if (!region) return;
  clear(region);
  if (!metrics.ok) {
    fillText(region, "Indexes appear here once the local memory service is running.");
    return;
  }
  const rows = (metrics.body && metrics.body.conversations) || [];
  if (!rows.length) {
    fillText(region, `No index under ${metrics.body.memory_root}. A conversation using the overlap condenser writes one.`);
    return;
  }
  const table = document.createElement("table");
  table.append(headerRow(["Index", "Notes", "Characters", "Roles", "Centered"]));
  for (const row of rows) {
    const tr = document.createElement("tr");
    const open = document.createElement("button");
    open.type = "button";
    open.dataset.memoryId = row.id;
    open.textContent = row.id;
    const idCell = document.createElement("td");
    idCell.append(open);
    tr.append(
      idCell,
      cell(String(row.note_count)),
      cell(String(row.characters)),
      cell(Object.entries(row.roles || {}).map(([role, count]) => `${role} ${count}`).join(", ") || "—"),
      cell(row.fitted ? "yes" : "no"),
    );
    table.append(tr);
  }
  region.append(table);
}

function paintDetail(region, metrics, screen) {
  if (!region || screen.name !== "conversation") return;
  clear(region);
  const rows = (metrics.ok && metrics.body && metrics.body.conversations) || [];
  const match = rows.find((row) => row.id === screen.id);
  if (!match) {
    fillText(region, `No index named ${screen.id}.`);
    return;
  }
  const list = document.createElement("ul");
  for (const line of match.preview || []) {
    const item = document.createElement("li");
    item.textContent = line;
    list.append(item);
  }
  if (!list.childNodes.length) fillText(region, "This index has no notes yet.");
  else region.append(list);
}

function paintTests(region, metrics) {
  if (!region) return;
  clear(region);
  if (!metrics.ok) {
    fillText(region, "Saved measurements show up when the local memory service can read the results directory.");
    return;
  }
  const tests = metrics.body.tests || [];
  const lastRun = metrics.body.last_run;
  if (lastRun) {
    const banner = document.createElement("p");
    banner.dataset.region = "last-run";
    banner.textContent = lastRun.ok
      ? "Latest unit test passed."
      : "Latest unit test failed.";
    region.append(banner);
    const list = document.createElement("ul");
    for (const line of lastRun.tail || []) {
      const item = document.createElement("li");
      item.textContent = line;
      list.append(item);
    }
    region.append(list);
  }
  if (!tests.length && !lastRun) {
    fillText(region, "No measurement files in the results directory.");
    return;
  }
  const grid = document.createElement("div");
  grid.className = "cm-grid";
  for (const test of tests) {
    const card = document.createElement("article");
    card.className = "cm-card";
    const title = document.createElement("h2");
    title.textContent = test.name;
    card.append(title);
    for (const figure of test.figures || []) {
      const line = document.createElement("p");
      line.textContent = `${figure.label}: ${figure.value}`;
      card.append(line);
    }
    grid.append(card);
  }
  region.append(grid);
}

async function saveOptions(ctx) {
  const form = ctx.regions.options;
  const error = form && form.querySelector('[data-region="form-error"]');
  if (!form) return;
  const payload = {};
  for (const input of form.querySelectorAll("input")) {
    if (input.type === "checkbox") payload[input.name] = input.checked;
    else if (input.type === "number") payload[input.name] = Number(input.value);
    else payload[input.name] = input.value.trim();
  }
  const result = await sidecarSend("/options", "PUT", payload, ctx.fetchImpl);
  if (error) error.textContent = result.ok ? "Saved. The next condensation uses these values." : (result.error || "Save failed.");
}

async function runTests(ctx) {
  if (ctx.regions.tests) fillText(ctx.regions.tests, "Running the memory unit tests…");
  const result = await sidecarSend("/tests/run", "POST", { suite: "memory" }, ctx.fetchImpl);
  if (!ctx.regions.tests) return;
  clear(ctx.regions.tests);
  const p = document.createElement("p");
  if (!result.ok && result.error) {
    p.textContent = result.error;
  } else {
    const body = result.body || {};
    p.textContent = body.ok ? "Memory unit tests passed." : "Memory unit tests failed.";
    ctx.regions.tests.append(p);
    const list = document.createElement("ul");
    for (const line of body.tail || []) {
      const item = document.createElement("li");
      item.textContent = line;
      list.append(item);
    }
    ctx.regions.tests.append(list);
    return;
  }
  ctx.regions.tests.append(p);
}

function headerRow(labels) {
  const tr = document.createElement("tr");
  for (const label of labels) {
    const th = document.createElement("th");
    th.textContent = label;
    tr.append(th);
  }
  return tr;
}

function cell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

function clear(node) {
  node.textContent = "";
}

function fillText(node, text) {
  if (node) node.textContent = text;
}

async function agentGet(host, path) {
  try {
    const body = await host.agentServer.request({ path });
    return { ok: true, body };
  } catch (error) {
    return { ok: false, error: error && error.message ? error.message : "Agent Server request failed." };
  }
}

async function sidecarGet(path, fetchImpl, signal) {
  try {
    const response = await fetchImpl(`${SIDECAR_ORIGIN}${path}`, { signal });
    const body = await response.json();
    return { ok: response.ok, body, error: body && body.error };
  } catch (error) {
    return { ok: false, error: error && error.name === "AbortError" ? "aborted" : "memory service unavailable" };
  }
}

async function sidecarSend(path, method, payload, fetchImpl) {
  try {
    const response = await fetchImpl(`${SIDECAR_ORIGIN}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    return { ok: response.ok, body, error: body && body.error };
  } catch (_error) {
    return { ok: false, error: "memory service unavailable" };
  }
}

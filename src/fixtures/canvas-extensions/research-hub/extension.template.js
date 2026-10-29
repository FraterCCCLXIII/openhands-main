// Source for extension.js. Do not edit extension.js directly: run
// scripts/build-research-hub-snapshot.mjs, which inlines the scraped data below.
const DATA = /*__DATA__*/null;

const css = `
.rh{min-height:100%;padding:1.5rem 2rem;color:var(--oh-text-primary,#fff);background:var(--oh-color-base,#111);font:14px/1.5 system-ui,sans-serif;box-sizing:border-box}
.rh *{box-sizing:border-box}
.rh h1{font-size:1.5rem;font-weight:600;margin:0}
.rh .sub{opacity:.65;margin:.25rem 0 1rem}
.rh .tabs{display:flex;gap:.5rem;margin-bottom:1rem}
.rh button,.rh select,.rh input{font:inherit;color:inherit;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);border-radius:6px;padding:.35rem .7rem}
.rh button{cursor:pointer}
.rh button[aria-pressed="true"]{background:rgba(255,255,255,.2)}
.rh .bar{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem}
.rh .bar input{flex:1;min-width:14rem}
.rh .card{border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:.9rem 1rem;margin-bottom:.8rem}
.rh .card h2{font-size:1rem;font-weight:600;margin:0}
.rh .card a{color:inherit}
.rh .meta{opacity:.6;font-size:12px;margin:.15rem 0 .5rem}
.rh ul{margin:.5rem 0 0;padding-left:1.1rem}
.rh li{margin:.3rem 0}
.rh .pill{display:inline-block;font-size:11px;padding:0 .45rem;margin-right:.35rem;border-radius:999px;background:rgba(255,255,255,.14)}
.rh table{border-collapse:collapse;width:100%}
.rh th,.rh td{text-align:right;padding:.4rem .6rem;border-bottom:1px solid rgba(255,255,255,.1);white-space:nowrap}
.rh th:first-child,.rh td:first-child,.rh th:nth-child(2),.rh td:nth-child(2){text-align:left}
.rh th{cursor:pointer;position:sticky;top:0;background:var(--oh-color-base,#111)}
.rh .scroll{overflow:auto;max-height:70vh}
.rh .empty{opacity:.6;padding:2rem 0}
`;

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  node.append(...kids.filter((k) => k != null));
  return node;
}

function findingsView() {
  const articles = DATA.articles;
  const categories = [...new Set(articles.map((a) => a.category))].sort();
  const kinds = [...new Set(articles.flatMap((a) => a.findings.map((f) => f.kind)))].sort();
  const state = { q: "", category: "", kind: "" };
  const list = el("div");
  const count = el("div", { class: "meta" });

  const matches = (a, f) =>
    (!state.kind || f.kind === state.kind) &&
    (!state.q ||
      [f.claim, f.value, f.metric, f.benchmark, f.model, a.title, a.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(state.q));

  function render() {
    list.replaceChildren();
    let shown = 0;
    let total = 0;
    for (const a of articles) {
      if (state.category && a.category !== state.category) continue;
      const fs = a.findings.filter((f) => matches(a, f));
      const titleHit = state.q && a.title.toLowerCase().includes(state.q) && !a.findings.length;
      if (!fs.length && !titleHit) continue;
      shown += 1;
      total += fs.length;
      list.append(
        el(
          "div",
          { class: "card" },
          el("h2", {}, el("a", { href: a.url, target: "_blank", rel: "noreferrer" }, a.title)),
          el("div", { class: "meta" }, `${a.date || "undated"} · ${a.category}`),
          el("div", {}, a.summary),
          fs.length
            ? el(
                "ul",
                {},
                ...fs.map((f) =>
                  el(
                    "li",
                    {},
                    el("span", { class: "pill" }, f.kind),
                    f.claim,
                    f.value ? el("strong", {}, ` ${f.value}`) : null,
                    f.benchmark || f.model
                      ? el("span", { class: "meta" }, ` (${[f.benchmark, f.model].filter(Boolean).join(" · ")})`)
                      : null,
                  ),
                ),
              )
            : null,
        ),
      );
    }
    count.textContent = `${total} findings across ${shown} articles`;
    if (!shown) list.append(el("div", { class: "empty" }, "No findings match."));
  }

  const select = (label, opts, key) => {
    const s = el("select", { "aria-label": label }, el("option", { value: "" }, `All ${label}`));
    for (const o of opts) s.append(el("option", { value: o }, o));
    s.addEventListener("change", () => {
      state[key] = s.value;
      render();
    });
    return s;
  };
  const search = el("input", { type: "search", placeholder: "Search findings, models, benchmarks…" });
  search.addEventListener("input", () => {
    state.q = search.value.trim().toLowerCase();
    render();
  });
  render();
  return el(
    "div",
    {},
    el("div", { class: "bar" }, search, select("categories", categories, "category"), select("kinds", kinds, "kind")),
    count,
    list,
  );
}

function indexView() {
  const { benchmarks, entries } = DATA.index;
  const rows = entries.map((e) => {
    const by = Object.fromEntries(e.scores.map((s) => [s.benchmark, s]));
    const have = e.scores.filter((s) => typeof s.score === "number");
    const costs = e.scores.map((s) => s.cost_per_instance).filter((c) => typeof c === "number");
    return {
      e,
      by,
      avg: have.length === benchmarks.length ? have.reduce((n, s) => n + s.score, 0) / have.length : null,
      cost: costs.length ? costs.reduce((n, c) => n + c, 0) / costs.length : null,
    };
  });
  const state = { key: "avg", dir: -1, open: false };
  const holder = el("div", { class: "scroll" });
  const fmt = (n, d = 1) => (typeof n === "number" ? n.toFixed(d) : "–");

  const value = (r, key) =>
    key === "avg" ? r.avg : key === "cost" ? r.cost : key === "model" ? r.e.model : r.by[key]?.score ?? null;

  function render() {
    const data = rows
      .filter((r) => !state.open || (r.e.openness || "").startsWith("open"))
      .sort((a, b) => {
        const x = value(a, state.key);
        const y = value(b, state.key);
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "string" ? x.localeCompare(y) : x - y) * state.dir;
      });
    const head = el(
      "tr",
      {},
      ...[
        ["model", "Model"],
        ["agent", "Agent"],
        ["avg", "Average"],
        ["cost", "Avg $/instance"],
        ...benchmarks.map((b) => [b, b]),
      ].map(([key, label]) =>
        el(
          "th",
          {
            onclick: () => {
              state.dir = state.key === key ? -state.dir : -1;
              state.key = key;
              render();
            },
          },
          label,
        ),
      ),
    );
    holder.replaceChildren(
      el(
        "table",
        {},
        el("thead", {}, head),
        el(
          "tbody",
          {},
          ...data.map((r) =>
            el(
              "tr",
              {},
              el("td", {}, r.e.model),
              el("td", {}, r.e.agent),
              el("td", {}, fmt(r.avg)),
              el("td", {}, typeof r.cost === "number" ? `$${r.cost.toFixed(2)}` : "–"),
              ...benchmarks.map((b) => el("td", {}, fmt(r.by[b]?.score))),
            ),
          ),
        ),
      ),
    );
  }
  const open = el("button", {
    "aria-pressed": "false",
    onclick: () => {
      state.open = !state.open;
      open.setAttribute("aria-pressed", String(state.open));
      render();
    },
  }, "Open models only");
  render();
  return el(
    "div",
    {},
    el("div", { class: "bar" }, open),
    el(
      "div",
      { class: "meta" },
      "Average is shown only for entries scored on every benchmark. Scores are accuracy percentages as published in openhands-index-results.",
    ),
    holder,
  );
}

export function activate(host) {
  return host.registerPage("research", ({ container }) => {
    const style = el("style", {}, css);
    const body = el("div");
    const tabs = [
      ["Findings", findingsView],
      ["OpenHands Index", indexView],
    ];
    const buttons = tabs.map(([label, build], i) =>
      el("button", {
        "aria-pressed": String(i === 0),
        onclick: () => {
          buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
          body.replaceChildren(build());
        },
      }, label),
    );
    body.append(tabs[0][1]());
    const root = el(
      "section",
      { class: "rh" },
      el("h1", {}, "Research hub"),
      el(
        "p",
        { class: "sub" },
        `Snapshot of ${DATA.sources.articles} and ${DATA.sources.index}, generated ${DATA.generated_at.slice(0, 10)}.`,
      ),
      el("div", { class: "tabs" }, ...buttons),
      body,
    );
    container.append(style, root);
    return () => {
      style.remove();
      root.remove();
    };
  });
}

// Source for extension.js. Do not edit extension.js directly: run
// scripts/build-research-hub-snapshot.mjs, which inlines the scraped data below.
const DATA = /*__DATA__*/null;

const css = `
.rh{min-height:100%;padding:1.5rem 2rem;color:var(--oh-foreground,#fff);background:var(--oh-color-base,#111);font:14px/1.5 system-ui,sans-serif;box-sizing:border-box}
.rh *{box-sizing:border-box}
.rh h1{font-size:1.5rem;font-weight:600;margin:0}
.rh .sub{opacity:.65;margin:.25rem 0 1rem}
.rh .tabs{display:flex;gap:.5rem;margin-bottom:1rem}
.rh button,.rh select,.rh input{font:inherit;color:inherit;background:color-mix(in srgb,currentColor 6%,transparent);border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:6px;padding:.35rem .7rem}
.rh button{cursor:pointer}
.rh button[aria-pressed="true"]{background:color-mix(in srgb,currentColor 20%,transparent)}
.rh .bar{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem}
.rh .bar input{flex:1;min-width:14rem}
.rh .card{border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:8px;padding:.9rem 1rem;margin-bottom:.8rem}
.rh .card h2{font-size:1rem;font-weight:600;margin:0}
.rh .card a{color:inherit}
.rh .meta{opacity:.7;font-size:12px;margin:.15rem 0 .5rem}
.rh ul{margin:.5rem 0 0;padding-left:1.1rem}
.rh li{margin:.3rem 0}
.rh .pill{display:inline-block;font-size:11px;padding:0 .45rem;margin-right:.35rem;border-radius:999px;background:color-mix(in srgb,currentColor 14%,transparent)}
.rh table{border-collapse:collapse;width:100%}
.rh th,.rh td{text-align:right;padding:.4rem .6rem;border-bottom:1px solid color-mix(in srgb,currentColor 10%,transparent);white-space:nowrap}
.rh th:first-child,.rh td:first-child,.rh th:nth-child(2),.rh td:nth-child(2){text-align:left}
.rh th{cursor:pointer;position:sticky;top:0;background:var(--oh-color-base,#111)}
.rh .scroll{overflow:auto;max-height:70vh}
.rh .empty{opacity:.6;padding:2rem 0}
.rh .charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:1rem;margin-bottom:1.25rem}
.rh .chart{border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:8px;padding:.8rem 1rem}
.rh .chart h3{font-size:.9rem;font-weight:600;margin:0}
.rh .chart svg{width:100%;height:auto;display:block;margin-top:.4rem;overflow:visible}
.rh .chart svg text{fill:currentColor;font-size:11px;opacity:.7}
.rh .legend{display:flex;gap:1rem;font-size:12px;opacity:.75;margin-top:.3rem}
.rh .dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:.35rem}
.rh .brow{display:grid;grid-template-columns:minmax(7rem,11rem) 1fr 3.2rem;gap:.5rem;align-items:center;margin:.3rem 0;font-size:12px}
.rh .blabel{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rh .btrack{height:10px;background:color-mix(in srgb,currentColor 8%,transparent);border-radius:5px;overflow:hidden}
.rh .bfill{display:block;height:100%;border-radius:5px}
.rh .bval{text-align:right;opacity:.75}
.rh .pair{margin:.5rem 0}
.rh .pair .blabel{display:block;font-size:12px;margin-bottom:.1rem}
.rh .pair .brow{grid-template-columns:1fr 5rem;margin:.1rem 0}
.rh .sources{margin-top:.5rem}
.rh .sources a{color:inherit}
.rh .section{font-size:1rem;font-weight:600;margin:1.25rem 0 .25rem}
`;

const NS = "http://www.w3.org/2000/svg";
const COLOR = { open: "#4ade80", closed: "#60a5fa", neutral: "#a78bfa" };
const isOpen = (e) => (e.openness || "").startsWith("open");

function svg(tag, attrs = {}, ...kids) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  node.append(...kids.filter((k) => k != null));
  return node;
}

function niceTicks(min, max, count = 5) {
  const raw = (max - min || 1) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

function monthTicks(min, max, step = 2) {
  const out = [];
  const d = new Date(min);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  for (; d.getTime() <= max; d.setUTCMonth(d.getUTCMonth() + step)) out.push(d.getTime());
  return out;
}

const monthLabel = (ts) =>
  new Date(ts).toLocaleDateString("en", { month: "short", year: "2-digit", timeZone: "UTC" });

function chartCard(title, note, body, legend, sources) {
  const unique = sources ? [...new Map(sources.map((s) => [s.url, s])).values()] : [];
  return el(
    "div",
    { class: "chart" },
    el("h3", {}, title),
    note ? el("div", { class: "meta" }, note) : null,
    body,
    legend
      ? el(
          "div",
          { class: "legend" },
          ...legend.map(([label, color]) =>
            el("span", {}, el("span", { class: "dot", style: `background:${color}` }), label),
          ),
        )
      : null,
    unique.length
      ? el(
          "div",
          { class: "meta sources" },
          "Sources: ",
          ...unique.flatMap((s, i) => [
            i ? ", " : null,
            el("a", { href: s.url, target: "_blank", rel: "noreferrer" }, s.title),
          ]),
        )
      : null,
  );
}

const OPEN_CLOSED = [
  ["Open weights", COLOR.open],
  ["Closed API", COLOR.closed],
];

// points: [{x, y, label, open}]; frontier: sorted-by-x subset drawn as a line.
function scatter({ points, xTicks, xFmt, yFmt = (v) => v.toFixed(0), xScale = (v) => v, frontier = [], labelFrontier = false }) {
  const W = 640;
  const H = 300;
  const m = { l: 40, r: 14, t: 10, b: 32 };
  const xs = points.map((p) => xScale(p.x));
  const ys = points.map((p) => p.y);
  const pad = (Math.max(...xs) - Math.min(...xs)) * 0.05 || 1;
  const xmin = Math.min(...xs) - pad;
  const xmax = Math.max(...xs) + pad;
  const ymin = Math.floor(Math.min(...ys) / 5) * 5;
  const ymax = Math.ceil(Math.max(...ys) / 5) * 5;
  const sx = (v) => m.l + ((xScale(v) - xmin) / (xmax - xmin)) * (W - m.l - m.r);
  const sy = (v) => H - m.b - ((v - ymin) / (ymax - ymin)) * (H - m.t - m.b);
  const grid = niceTicks(ymin, ymax, 5).map((v) =>
    svg(
      "g",
      {},
      svg("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), stroke: "currentColor", "stroke-opacity": 0.12 }),
      svg("text", { x: m.l - 6, y: sy(v) + 4, "text-anchor": "end" }, yFmt(v)),
    ),
  );
  const xAxis = xTicks
    .filter((t) => xScale(t) >= xmin && xScale(t) <= xmax)
    .map((t) => svg("text", { x: sx(t), y: H - m.b + 16, "text-anchor": "middle" }, xFmt(t)));
  const line = frontier.length > 1
    ? svg("polyline", {
        points: frontier.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" "),
        fill: "none",
        stroke: "currentColor",
        "stroke-opacity": 0.4,
        "stroke-dasharray": "4 3",
      })
    : null;
  const dots = points.map((p) =>
    svg(
      "circle",
      { cx: sx(p.x), cy: sy(p.y), r: 5, fill: p.color || (p.open ? COLOR.open : COLOR.closed), "fill-opacity": 0.85 },
      svg("title", {}, p.label),
    ),
  );
  // Label only frontier points that are not crowded by the previous label.
  const labels = [];
  let last = null;
  for (const p of labelFrontier ? frontier : []) {
    const x = sx(p.x);
    const y = sy(p.y);
    if (last && Math.hypot(x - last.x, y - last.y) < 70) continue;
    labels.push(svg("text", { x: x + 8, y: y - 6 }, p.name));
    last = { x, y };
  }
  return svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" }, ...grid, ...xAxis, line, ...dots, ...labels);
}

function barList(items, fmt = (v) => String(v)) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return el(
    "div",
    {},
    ...items.map((i) =>
      el(
        "div",
        { class: "brow" },
        el("span", { class: "blabel", title: i.label }, i.label),
        el("span", { class: "btrack" }, el("span", { class: "bfill", style: `width:${(i.value / max) * 100}%;background:${i.color || COLOR.neutral}` })),
        el("span", { class: "bval" }, fmt(i.value)),
      ),
    ),
  );
}

function columns(items) {
  const W = 640;
  const H = 150;
  const m = { l: 24, r: 8, t: 8, b: 24 };
  const max = Math.max(...items.map((i) => i.value), 1);
  const bw = (W - m.l - m.r) / items.length;
  return svg(
    "svg",
    { viewBox: `0 0 ${W} ${H}`, role: "img" },
    svg("text", { x: m.l - 4, y: m.t + 8, "text-anchor": "end" }, max),
    ...items.map((i, n) => {
      const h = (i.value / max) * (H - m.t - m.b);
      return svg(
        "g",
        {},
        svg("rect", { x: m.l + n * bw + 1, y: H - m.b - h, width: Math.max(bw - 2, 1), height: h, fill: COLOR.neutral, "fill-opacity": 0.85 }, svg("title", {}, `${i.label}: ${i.value}`)),
        n % 4 === 0 ? svg("text", { x: m.l + n * bw + bw / 2, y: H - 8, "text-anchor": "middle" }, i.label) : null,
      );
    }),
  );
}

function frontierOf(points, better) {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const out = [];
  for (const p of sorted) {
    if (!out.length || better(p, out[out.length - 1])) out.push(p);
  }
  return out;
}

const GREY = "#94a3b8";
const trim = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// rows: [{entity, baseline, value}]; two thin bars per row, baseline first.
function pairedBars(rows, fmt, labels) {
  const max = Math.max(...rows.flatMap((r) => [r.baseline, r.value]), 1);
  const bar = (v, color, title) =>
    el(
      "div",
      { class: "brow", title },
      el("span", { class: "btrack" }, el("span", { class: "bfill", style: `width:${(v / max) * 100}%;background:${color}` })),
      el("span", { class: "bval" }, fmt(v)),
    );
  return el(
    "div",
    {},
    ...rows.map((r) =>
      el(
        "div",
        { class: "pair" },
        el("span", { class: "blabel", title: r.entity }, r.entity),
        bar(r.baseline, GREY, labels[0]),
        bar(r.value, COLOR.neutral, labels[1]),
      ),
    ),
  );
}

// rows: [{label, baseline, value, baseline_label, tip}] on a 0-100 percent axis.
function dumbbell(rows) {
  const W = 560;
  const rowH = 34;
  const left = 340;
  const plotW = 200;
  const H = rows.length * rowH + 26;
  const x = (v) => left + (v / 100) * plotW;
  const grid = [0, 25, 50, 75, 100].map((t) =>
    svg(
      "g",
      {},
      svg("line", { x1: x(t), x2: x(t), y1: 0, y2: H - 22, stroke: "currentColor", "stroke-opacity": 0.12 }),
      svg("text", { x: x(t), y: H - 6, "text-anchor": "middle" }, `${t}%`),
    ),
  );
  const body = rows.map((r, i) => {
    const y = i * rowH + 14;
    return svg(
      "g",
      {},
      svg("title", {}, r.tip),
      svg("text", { x: 0, y: y + 3 }, trim(r.label, 56)),
      svg("text", { x: 0, y: y + 16, "fill-opacity": 0.6, style: "font-size:10px" }, `vs ${trim(r.baseline_label || "comparison", 54)}`),
      svg("line", { x1: x(r.baseline), x2: x(r.value), y1: y, y2: y, stroke: "currentColor", "stroke-opacity": 0.35, "stroke-width": 2 }),
      svg("circle", { cx: x(r.baseline), cy: y, r: 4.5, fill: GREY }),
      svg("circle", { cx: x(r.value), cy: y, r: 4.5, fill: COLOR.neutral }),
    );
  });
  return svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" }, ...grid, ...body);
}

const dedupeBy = (rows, key) => [...new Map(rows.map((r) => [key(r), r])).values()];

// Charts of the numbers the articles themselves report (DATA.datapoints).
function resultCharts(dps) {
  const by = (re, unit) => dps.filter((d) => re.test(d.metric) && (!unit || d.unit === unit));
  const src = (rows) => rows.map((r) => ({ title: r.title, url: r.url }));
  const cards = [];

  const swe = by(/^SWE-bench (Verified|Pro) resolve rate/i, "%").filter((d) => !/subset/i.test(d.metric));
  if (swe.length > 2) {
    const pts = swe.map((d) => ({
      x: Date.parse(d.date),
      y: d.value,
      color: /pro/i.test(d.metric) ? COLOR.neutral : COLOR.closed,
      label: `${d.entity}: ${d.value}% (${/pro/i.test(d.metric) ? "Pro" : "Verified"}), ${d.title}, ${d.date}`,
    }));
    const xs = pts.map((p) => p.x);
    cards.push(
      chartCard(
        "SWE-bench resolve rates, as published",
        "Each point is a number an article reported, plotted at the article's date. Scaffolds and subsets differ between posts.",
        scatter({ points: pts, xTicks: monthTicks(Math.min(...xs), Math.max(...xs), 4), xFmt: monthLabel }),
        [["SWE-bench Verified", COLOR.closed], ["SWE-bench Pro", COLOR.neutral]],
        src(swe),
      ),
    );
  }

  const gap = swe.filter((d) => d.slug === "open-models-are-closing-the-coding-gap-2");
  if (gap.length) {
    const list = (re) =>
      barList(
        gap
          .filter((d) => re.test(d.metric))
          .sort((a, b) => b.value - a.value)
          .map((d) => ({ label: d.entity, value: d.value, color: /\(open\)/i.test(d.entity) ? COLOR.open : COLOR.closed })),
        (v) => `${v}%`,
      );
    cards.push(
      chartCard(
        "Open vs closed models on SWE-bench",
        "Resolve rates compared in \"Open Models Are Closing the Coding Gap\".",
        el("div", {}, el("div", { class: "meta" }, "Verified"), list(/verified/i), el("div", { class: "meta" }, "Pro"), list(/pro/i)),
        OPEN_CLOSED,
        src(gap),
      ),
    );
  }

  const c0 = (re) => by(re).filter((d) => d.baseline != null);
  const c0score = c0(/^Commit0 score/i);
  const c0time = c0(/^Commit0 runtime/i);
  if (c0score.length) {
    const labels = ["Before the fix (full git history visible)", "After the fix"];
    const rows = (list) => list.map((d) => ({ entity: d.entity, baseline: d.baseline, value: d.value }));
    cards.push(
      chartCard(
        "Commit0 before and after the git-history fix",
        "Scores dropped once agents could no longer read the full git history.",
        el(
          "div",
          {},
          pairedBars(rows(c0score), (v) => `${v}%`, labels),
          c0time.length ? el("div", { class: "meta" }, "Average runtime") : null,
          c0time.length ? pairedBars(rows(c0time), (v) => `${Math.round(v)}s`, labels) : null,
        ),
        labels.map((l, i) => [l, i ? COLOR.neutral : GREY]),
        src(c0score),
      ),
    );
  }

  const skills = by(/^Skill pass rate/i, "%").filter((d) => d.baseline != null);
  if (skills.length) {
    const labels = ["Without the skill", "With the skill"];
    cards.push(
      chartCard(
        "Agent skills: pass rate with and without",
        "Skill evaluation tutorial, three tasks.",
        pairedBars(skills.map((d) => ({ entity: d.entity, baseline: d.baseline, value: d.value })), (v) => `${v}%`, labels),
        labels.map((l, i) => [l, i ? COLOR.neutral : GREY]),
        src(skills),
      ),
    );
  }

  const taken = /^(Commit0 score|Skill pass rate)/i;
  const pairs = dps
    .filter((d) => d.unit === "%" && d.baseline != null && d.baseline <= 100 && d.value <= 100 && !taken.test(d.metric))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 22);
  if (pairs.length > 2) {
    cards.push(
      chartCard(
        "Before vs after, in percent",
        "Grey: the comparison value the article gives (named under each row). Purple: the reported value. Hover for the source.",
        dumbbell(
          pairs.map((d) => ({
            label: `${d.metric} · ${d.entity}`,
            baseline: d.baseline,
            value: d.value,
            baseline_label: d.baseline_label,
            tip: `${d.metric} (${d.entity}): ${d.baseline}% → ${d.value}%. ${d.note} ${d.title}`,
          })),
        ),
        [["Comparison value", GREY], ["Reported value", COLOR.neutral]],
        src(pairs),
      ),
    );
  }

  const unitP = dps.filter((d) => d.unit === "usd per million tokens");
  const priceIn = new Map(unitP.filter((d) => /input/i.test(d.metric) && !/cache/i.test(d.metric)).map((d) => [d.entity, d]));
  const priceOut = new Map(unitP.filter((d) => /output/i.test(d.metric)).map((d) => [d.entity, d]));
  const prices = [...priceIn.keys()]
    .filter((k) => priceOut.has(k))
    .map((k) => ({ entity: k, baseline: priceIn.get(k).value, value: priceOut.get(k).value, d: priceOut.get(k) }))
    .sort((a, b) => b.value - a.value);
  if (prices.length) {
    const labels = ["Input per 1M tokens", "Output per 1M tokens"];
    cards.push(
      chartCard(
        "LLM token prices",
        "List prices quoted at the time of each article, in US dollars.",
        pairedBars(prices, (v) => `$${v}`, labels),
        labels.map((l, i) => [l, i ? COLOR.neutral : GREY]),
        src(prices.map((p) => p.d)),
      ),
    );
  }

  const stars = by(/^GitHub stars$/i, "count").filter((d) => d.entity === "OpenHands");
  if (stars.length > 2) {
    const pts = stars.map((d) => ({ x: Date.parse(d.date), y: d.value, color: COLOR.neutral, label: `${d.value.toLocaleString("en")} stars, ${d.title}, ${d.date}` }));
    const xs = pts.map((p) => p.x);
    cards.push(
      chartCard(
        "OpenHands GitHub stars, as quoted over time",
        "Rounded figures as each article states them.",
        scatter({ points: pts, xTicks: monthTicks(Math.min(...xs), Math.max(...xs), 4), xFmt: monthLabel, yFmt: (v) => `${v / 1000}k` }),
        null,
        src(stars),
      ),
    );
  }

  const plans = dedupeBy(by(/^Monthly plan price \(entry paid/i, "usd"), (d) => d.entity).sort((a, b) => b.value - a.value);
  if (plans.length > 2) {
    cards.push(
      chartCard(
        "Entry paid plan price per month",
        "As listed in the comparison articles.",
        barList(plans.map((d) => ({ label: d.entity, value: d.value })), (v) => `$${v}`),
        null,
        src(plans),
      ),
    );
  }

  const speed = dedupeBy(by(/inference speed/i, "tokens/s"), (d) => d.entity).sort((a, b) => b.value - a.value);
  if (speed.length > 2) {
    cards.push(
      chartCard(
        "Reported inference speed",
        "Tokens per second, under each article's stated hardware and setup.",
        barList(speed.map((d) => ({ label: d.entity, value: d.value })), (v) => `${v}`),
        null,
        src(speed),
      ),
    );
  }

  return el(
    "div",
    {},
    el("h2", { class: "section" }, "Results reported in the articles"),
    el(
      "div",
      { class: "meta" },
      `${dps.length} numbers extracted from article text. Values are as each article states them; compare within a chart, not across charts. Numbers shown only in an article's images are not included.`,
    ),
    el("div", { class: "charts" }, ...cards),
  );
}

function findingsCharts(articles) {
  const byMonth = new Map();
  const byKind = new Map();
  for (const a of articles) {
    if (a.date) byMonth.set(a.date.slice(0, 7), (byMonth.get(a.date.slice(0, 7)) || 0) + 1);
    for (const f of a.findings) byKind.set(f.kind, (byKind.get(f.kind) || 0) + 1);
  }
  const months = [...byMonth.keys()].sort();
  const all = [];
  const [y0, m0] = months[0].split("-").map(Number);
  const [y1, m1] = months[months.length - 1].split("-").map(Number);
  for (let y = y0, mo = m0; y < y1 || (y === y1 && mo <= m1); mo += 1) {
    if (mo > 12) {
      y += 1;
      mo = 1;
    }
    const key = `${y}-${String(mo).padStart(2, "0")}`;
    all.push({ label: monthLabel(Date.parse(`${key}-01`)), value: byMonth.get(key) || 0 });
  }
  const kinds = [...byKind].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  return el(
    "div",
    { class: "charts" },
    chartCard("Articles per month", "Posts on openhands.dev/blog by publish date.", columns(all)),
    chartCard("Findings by kind", "What the extracted findings are.", barList(kinds)),
  );
}

function indexCharts(rows, benchmarks) {
  const named = (r) => (r.e.agent === "OpenHands" ? r.e.model : `${r.e.model} (${r.e.agent})`);
  const complete = rows.filter((r) => r.avg != null);
  const withCost = complete.filter((r) => r.cost != null);
  const costPts = withCost.map((r) => ({
    x: r.cost,
    y: r.avg,
    open: isOpen(r.e),
    name: named(r),
    label: `${named(r)}: ${r.avg.toFixed(1)} avg at $${r.cost.toFixed(2)}/instance`,
  }));
  const dated = complete.filter((r) => r.e.release_date);
  const timePts = dated.map((r) => ({
    x: Date.parse(r.e.release_date),
    y: r.avg,
    open: isOpen(r.e),
    name: named(r),
    label: `${named(r)}: ${r.avg.toFixed(1)} avg, released ${r.e.release_date}`,
  }));
  const sized = complete.filter((r) => isOpen(r.e) && r.e.parameter_count_b);
  const sizePts = sized.map((r) => ({
    x: r.e.parameter_count_b,
    y: r.avg,
    open: true,
    name: named(r),
    label: `${named(r)}: ${r.avg.toFixed(1)} avg, ${r.e.parameter_count_b}B params${r.e.active_parameter_count_b ? ` (${r.e.active_parameter_count_b}B active)` : ""}`,
  }));
  const tMin = Math.min(...timePts.map((p) => p.x));
  const tMax = Math.max(...timePts.map((p) => p.x));

  const leaders = el("div");
  const select = el("select", { "aria-label": "benchmark" }, ...benchmarks.map((b) => el("option", { value: b }, b)));
  const drawLeaders = () => {
    const b = select.value;
    const items = rows
      .filter((r) => typeof r.by[b]?.score === "number")
      .sort((x, y) => y.by[b].score - x.by[b].score)
      .slice(0, 10)
      .map((r) => ({ label: named(r), value: r.by[b].score, color: isOpen(r.e) ? COLOR.open : COLOR.closed }));
    leaders.replaceChildren(barList(items, (v) => v.toFixed(1)));
  };
  select.addEventListener("change", drawLeaders);
  drawLeaders();

  return el(
    "div",
    { class: "charts" },
    chartCard(
      "Accuracy vs cost",
      "Average score against average cost per instance. Dashed line: best score reachable at each cost.",
      scatter({
        points: costPts,
        xTicks: niceTicks(0, Math.max(...costPts.map((p) => p.x)), 6),
        xFmt: (v) => `$${v}`,
        frontier: frontierOf(costPts, (p, last) => p.y > last.y),
        labelFrontier: true,
      }),
      OPEN_CLOSED,
    ),
    chartCard(
      "Evolution over time",
      "Average score by model release date. Dashed line: running best.",
      scatter({
        points: timePts,
        xTicks: monthTicks(tMin, tMax),
        xFmt: monthLabel,
        frontier: frontierOf(timePts, (p, last) => p.y > last.y),
      }),
      OPEN_CLOSED,
    ),
    sizePts.length > 1
      ? chartCard(
          "Open model accuracy by size",
          "Average score against total parameters (log scale), open-weights models only.",
          scatter({
            points: sizePts,
            xTicks: [1, 3, 10, 30, 100, 300, 1000],
            xFmt: (v) => `${v}B`,
            xScale: Math.log10,
          }),
        )
      : null,
    chartCard("Benchmark leaders", "Top 10 entries for one benchmark.", el("div", {}, el("div", { class: "bar" }, select), leaders), OPEN_CLOSED),
  );
}

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
    DATA.datapoints.length ? resultCharts(DATA.datapoints) : null,
    el("h2", { class: "section" }, "About the articles"),
    findingsCharts(articles),
    el("h2", { class: "section" }, "All findings"),
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
    indexCharts(rows, benchmarks),
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

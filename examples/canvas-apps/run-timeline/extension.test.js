import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { activate, buildTimeline, costShort, costText, PRICES, repriceRun, activePreset, ageShort, applyNav, DEFAULT_NAV, displayTags, groupByWorkspace, tagFacets, describeRow, estimateCost, extractRefs, priceFor, runCost, fmtDuration, linesOf, parseImport, parseTime, summarize } from "./extension.js";

const action = (id, ts, over = {}) => ({ id, timestamp: ts, source: "agent", tool_name: "terminal", tool_call_id: `call-${id}`, action: { kind: "TerminalAction", command: "ls" }, security_risk: "LOW", ...over });
const obs = (id, actionId, ts, over = {}) => ({ id, timestamp: ts, source: "environment", action_id: actionId, tool_name: "terminal", observation: { kind: "TerminalObservation", content: [{ type: "text", text: "ok" }], exit_code: 0, is_error: false, ...over } });
const msg = (id, ts, role = "assistant", text = "hello") => ({ id, timestamp: ts, source: role === "user" ? "user" : "agent", llm_message: { role, content: [{ type: "text", text }] } });

describe("time", () => {
  it("trusts an offset, uses a capture time for a naive value, and skips otherwise", () => {
    expect(parseTime("2026-10-29T10:00:00Z")).toMatchObject({ basis: "producer" });
    expect(parseTime("2026-10-29T10:00:00", "2026-10-29T10:00:05Z")).toMatchObject({ basis: "observed", t: Date.parse("2026-10-29T10:00:05Z") });
    expect(parseTime("2026-10-29T10:00:00")).toBeNull();
    expect(parseTime("2026-10-29T10:00:00", undefined, true)).toMatchObject({ basis: "assumed-utc" });
  });

  it("formats durations", () => {
    expect(fmtDuration(250)).toBe("250 ms");
    expect(fmtDuration(2500)).toBe("2.50 s");
    expect(fmtDuration(null)).toBe("no result");
  });
});

describe("buildTimeline", () => {
  it("pairs an action with its observation into a span", () => {
    const tl = buildTimeline([action("a1", "2026-10-29T10:00:00Z"), obs("o1", "a1", "2026-10-29T10:00:02Z")]);
    expect(tl.spans).toHaveLength(1);
    expect(tl.spans[0]).toMatchObject({ status: "ok", end: Date.parse("2026-10-29T10:00:02Z") });
    expect(tl.spans[0].args).toContain("command: ls");
  });

  it("leaves an unanswered action open and creates no interval for an orphan result", () => {
    const tl = buildTimeline([action("a1", "2026-10-29T10:00:00Z"), obs("o9", "missing", "2026-10-29T10:00:03Z")]);
    expect(tl.spans[0]).toMatchObject({ status: "open", end: null });
    expect(tl.warnings.join(" ")).toMatch(/no matching action/);
  });

  it("marks a nonzero exit code or an error flag as an error, and a rejection as rejected", () => {
    const tl = buildTimeline([
      action("a1", "2026-10-29T10:00:00Z"), obs("o1", "a1", "2026-10-29T10:00:01Z", { exit_code: 2 }),
      action("a2", "2026-10-29T10:00:02Z"), { id: "r2", timestamp: "2026-10-29T10:00:03Z", source: "environment", action_id: "a2", rejection_reason: "blocked by hook" },
    ]);
    expect(tl.spans.map((s) => s.status)).toEqual(["error", "rejected"]);
  });

  it("never reads success or failure from message text", () => {
    const tl = buildTimeline([action("a1", "2026-10-29T10:00:00Z"), obs("o1", "a1", "2026-10-29T10:00:01Z", { content: [{ type: "text", text: "Error: it failed" }] })]);
    expect(tl.spans[0].status).toBe("ok");
  });

  it("skips events with naive timestamps unless a capture time is present", () => {
    const naive = action("a1", "2026-10-29T10:00:00");
    expect(buildTimeline([naive]).spans).toHaveLength(0);
    expect(buildTimeline([naive]).warnings.join(" ")).toMatch(/no timezone/);
    expect(buildTimeline([{ ...naive, runwardObservedAt: "2026-10-29T10:00:01Z" }]).spans).toHaveLength(1);
  });

  it("keeps messages as instants", () => {
    const tl = buildTimeline([msg("m1", "2026-10-29T10:00:00Z", "user", "do it")]);
    expect(tl.instants[0]).toMatchObject({ kind: "message", role: "user" });
  });
});

describe("summarize", () => {
  it("separates time inside steps from time between them, merging overlaps", () => {
    const tl = buildTimeline([
      action("a1", "2026-10-29T10:00:00Z"), obs("o1", "a1", "2026-10-29T10:00:04Z"),
      action("a2", "2026-10-29T10:00:02Z"), obs("o2", "a2", "2026-10-29T10:00:05Z"),
      action("a3", "2026-10-29T10:00:10Z"), obs("o3", "a3", "2026-10-29T10:00:11Z"),
    ]);
    const s = summarize(tl);
    expect(s.total).toBe(11_000);
    expect(s.inSteps).toBe(6_000);
    expect(s.longestGap.ms).toBe(5_000);
  });
});

describe("parseImport", () => {
  it("reads JSONL, a JSON array, an events object and a single event, and counts bad lines", () => {
    const e = msg("m1", "2026-10-29T10:00:00Z");
    expect(parseImport(`${JSON.stringify(e)}\nnot json\n${JSON.stringify(e)}`)).toMatchObject({ events: [e, e], warnings: [expect.stringMatching(/1 lines/)] });
    expect(parseImport(JSON.stringify([e])).events).toHaveLength(1);
    expect(parseImport(JSON.stringify({ events: [e, e] })).events).toHaveLength(2);
    expect(parseImport(JSON.stringify(e)).events).toHaveLength(1);
  });

  it("unwraps an event that carries a capture time beside it", () => {
    const wrapped = { event: action("a1", "2026-10-29T10:00:00"), runwardObservedAt: "2026-10-29T10:00:01Z" };
    expect(buildTimeline(parseImport(JSON.stringify(wrapped)).events).spans).toHaveLength(1);
  });
});

const stats = (id, ts, cost, prompt, completion, model = "anthropic/claude-sonnet") => ({
  id, timestamp: ts, source: "environment", kind: "ConversationStateUpdateEvent", key: "stats",
  value: { usage_to_metrics: { default: { model_name: model, accumulated_cost: cost, accumulated_token_usage: { prompt_tokens: prompt, completion_tokens: completion, cache_read_tokens: 0, reasoning_tokens: 0 } } } },
});

describe("references, lines and usage", () => {
  it("finds tickets, pull requests and repositories and ignores look-alikes", () => {
    const r = extractRefs("Analyze OSS-7564 and UTF-8 text; see https://github.com/OpenHands/OpenHands/pull/18887 and PR #12");
    expect(r.tickets).toEqual(["OSS-7564"]);
    expect(r.prs).toEqual(["OpenHands/OpenHands#18887", "#12"]);
    expect(r.repos).toEqual(["OpenHands/OpenHands"]);
  });

  it("counts the lines a file edit adds and removes", () => {
    expect(linesOf({ command: "str_replace", old_str: "a\nb", new_str: "c\nd\ne", path: "/x.js" })).toEqual({ added: 3, removed: 2, path: "/x.js" });
    expect(linesOf({ command: "create", file_text: "1\n2" })).toMatchObject({ added: 2, removed: 0 });
    expect(linesOf({ command: "view" })).toBeNull();
  });

  it("gives each model call its own cost and tokens from the stats snapshots before it", () => {
    const tl = buildTimeline([
      stats("s0", "2026-10-29T10:00:00Z", 0, 0, 0),
      stats("s1", "2026-10-29T10:00:05Z", 0.02, 1000, 200),
      action("a1", "2026-10-29T10:00:05.001Z", { action: { kind: "FileEditorAction", command: "create", file_text: "x\ny", path: "/a.js" } }),
      obs("o1", "a1", "2026-10-29T10:00:06Z"),
      stats("s2", "2026-10-29T10:00:09Z", 0.05, 2500, 500),
      action("a2", "2026-10-29T10:00:09.001Z"),
    ]);
    const [a1, a2] = tl.spans;
    expect(a1.usage).toMatchObject({ cost: 0.02, prompt: 1000, completion: 200, models: ["anthropic/claude-sonnet"] });
    expect(a2.usage.cost).toBeCloseTo(0.03);
    expect(tl.usage.cost).toBeCloseTo(0.05);
    expect(tl.lines).toEqual({ added: 2, removed: 0 });
  });

  it("marks a second action of the same model call as sharing it", () => {
    const tl = buildTimeline([stats("s1", "2026-10-29T10:00:05Z", 0.02, 1000, 200), action("a1", "2026-10-29T10:00:05.001Z"), action("a2", "2026-10-29T10:00:05.002Z")]);
    expect(tl.spans[1].usage).toEqual({ shared: true });
  });

  it("describes a row with its step, its mentions and the whole run", () => {
    const tl = buildTimeline([msg("m0", "2026-10-29T10:00:00Z", "user", "Analyze OSS-7564"), stats("s1", "2026-10-29T10:00:05Z", 0.02, 1000, 200), action("a1", "2026-10-29T10:00:05.001Z")]);
    const text = JSON.stringify(describeRow(tl.spans[0], tl, { id: "c1", tags: { pm_project: "web" }, launched_agent_profile: "default" }));
    expect(text).toContain("OSS-7564");
    expect(text).toContain("pm_project: web");
    expect(text).toContain("$0.02");
    expect(text).toContain("default");
  });
});

describe("cost from our prices", () => {
  it("matches a model by id, else by family, and not at all for an unknown model", () => {
    expect(priceFor("anthropic/claude-opus-5-5")).toMatchObject({ family: false, row: { id: "claude-opus-5-5" } });
    expect(priceFor("litellm_proxy/claude-opus-4-5-20251101")).toMatchObject({ family: false, row: { id: "claude-opus-4-5", input: 5, output: 25, cacheRead: 0.5 } });
    expect(priceFor("claude-opus-9-9")).toMatchObject({ family: true, row: { id: "claude-opus-5-5" } });
    expect(priceFor("ollama_chat/gpt-oss:20b")).toBeNull();
  });

  it("prices cached tokens at the cache rate and the rest of the prompt at the input rate", () => {
    const part = { model: "claude-sonnet-5-5", prompt: 1_000_000, completion: 100_000, cache: 600_000, cacheWrite: 0 };
    // 400k fresh at $2, 100k out at $10, 600k cached at $0.20 per million.
    expect(estimateCost({ parts: [part] }).cost).toBeCloseTo(0.8 + 1 + 0.12);
  });

  it("returns no cost for an unpriced model and flags family matches", () => {
    expect(estimateCost({ parts: [{ model: "ollama_chat/gpt-oss:20b", prompt: 10, completion: 1, cache: 0, cacheWrite: 0 }] })).toMatchObject({ cost: null, unpriced: ["ollama_chat/gpt-oss:20b"] });
    expect(estimateCost({ parts: [{ model: "litellm_proxy/claude-opus-9-9", prompt: 10, completion: 1, cache: 0, cacheWrite: 0 }] }).family).toBe(true);
  });

  it("carries first-party public prices and keeps ours ahead of them", () => {
    expect(PRICES.length).toBeGreaterThan(100);
    expect(new Set(PRICES.filter((r) => !r.ours).map((r) => r.provider)).size).toBeGreaterThan(3);
    expect(new Set(PRICES.map((r) => r.id)).size).toBe(PRICES.length);
    expect(PRICES.filter((r) => r.ours)).toHaveLength(7);
  });

  it("re-prices a run's tokens on another model", () => {
    const tl = buildTimeline([stats("s1", "2026-10-29T10:00:05Z", 0, 1_000_000, 100_000, "claude-sonnet-5-5")]);
    const opus = PRICES.find((r) => r.id === "claude-opus-5-5");
    expect(repriceRun(tl, opus)).toBeCloseTo(4 + 2);
  });

  it("shows the chosen basis first and the other in brackets", () => {
    expect(costText(0, 0.5, "reported")).toBe("not reported (≈ $0.50 estimated)");
    expect(costText(0.4, 0.5, "estimated")).toBe("≈ $0.50 ($0.40 reported)");
  });

  it("keeps a step's cost short for the side column in either basis", () => {
    const usage = { cost: 0, prompt: 1000, completion: 100, cache: 0, cacheWrite: 0, models: ["claude-sonnet-5-5"], parts: [{ model: "claude-sonnet-5-5", prompt: 1000, completion: 100, cache: 0, cacheWrite: 0 }] };
    expect(costShort(usage, "reported")).toMatch(/^n\/r \(≈ \$/);
    expect(costShort(usage, "estimated")).toMatch(/^≈ \$/);
    expect(costShort({ shared: true }, "reported")).toBe("same call");
    expect(costShort(null, "reported")).toBe("");
  });

  it("totals a run's estimate over its calls, so an unreported cost still gets a figure", () => {
    const tl = buildTimeline([stats("s1", "2026-10-29T10:00:05Z", 0, 1000, 200, "claude-sonnet-5-5"), stats("s2", "2026-10-29T10:00:09Z", 0, 2000, 500, "claude-sonnet-5-5")]);
    const rc = runCost(tl);
    expect(rc.reported).toBe(0);
    expect(rc.estimate).toBeCloseTo((2000 * 2 + 500 * 10) / 1e6);
  });
});

describe("conversation nav", () => {
  it("shows ages like the sidebar", () => {
    const now = Date.parse("2026-10-29T12:00:00Z");
    expect(ageShort("2026-10-29T11:30:00Z", now)).toBe("30m");
    expect(ageShort("2026-10-29T06:00:00Z", now)).toBe("6h");
    expect(ageShort("2026-10-24T12:00:00Z", now)).toBe("5d");
    expect(ageShort("nope", now)).toBe("");
  });
});

describe("info note", () => {
  it("keeps the evidence note behind an info icon instead of a banner", () => {
    let mount;
    const c = document.createElement("div");
    document.body.append(c);
    activate({ apiVersion: "1", navigate() {}, registerPage: (_, m) => { mount = m; return () => {}; }, agentServer: { request: () => Promise.resolve({ items: [] }) } });
    mount({ container: c });
    const icon = c.querySelector(".info");
    const note = c.querySelector(".infobox");
    expect(c.querySelector(".banner")).toBeNull();
    expect(note.hidden).toBe(true);
    icon.dispatchEvent(new Event("mouseenter"));
    expect(note.hidden).toBe(false);
    expect(note.textContent).toContain("no result was observed");
    icon.dispatchEvent(new Event("mouseleave"));
    expect(note.hidden).toBe(true);
    c.remove();
  });
});

describe("conversation list sorting and filtering", () => {
  const now = Date.parse("2026-10-29T12:00:00Z");
  const c = (id, over = {}) => ({ id, title: id, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-28T00:00:00Z", execution_status: "finished", tags: {}, ...over });
  const list = [
    c("old", { updated_at: "2026-09-01T00:00:00Z", created_at: "2026-10-10T00:00:00Z", execution_status: "paused" }),
    c("new", { updated_at: "2026-10-28T00:00:00Z", created_at: "2026-10-02T00:00:00Z", tags: { workspace: "/work/web", team: "growth", clientsource: "agentcanvas" } }),
    c("auto", { updated_at: "2026-10-27T00:00:00Z", created_at: "2026-10-05T00:00:00Z", tags: { automationname: "nightly", workspace: "/work/api" } }),
  ];
  const ids = (nav, q) => applyNav(list, { ...DEFAULT_NAV, ...nav }, q, now).rows.map((x) => x.id);

  it("sorts by updated or created, newest first", () => {
    expect(ids({ sort: "updated" })).toEqual(["new", "auto", "old"]);
    expect(ids({ sort: "created" })).toEqual(["old", "auto", "new"]);
  });

  it("filters to active threads, hides older ones by cutoff, and filters automations", () => {
    expect(ids({ scope: "relevant" })).toEqual(["new", "auto"]);
    expect(ids({ showOlder: false, cutoff: "7d" })).toEqual(["new", "auto"]);
    expect(ids({ automations: "hide-automations" })).toEqual(["new", "old"]);
    expect(ids({ automations: "only-automations" })).toEqual(["auto"]);
  });

  it("filters by tag, ignoring machine tags, and by search text", () => {
    expect(displayTags(list[1].tags)).toEqual([["team", "growth"]]);
    expect(tagFacets(list)).toEqual(["team=growth"]);
    expect(ids({ tags: ["team=growth"] })).toEqual(["new"]);
    expect(ids({}, "AUT")).toEqual(["auto"]);
  });

  it("groups by workspace folder with unassigned last, and reads presets", () => {
    const groups = groupByWorkspace(applyNav(list, DEFAULT_NAV, "", now).rows);
    expect(groups.map((g) => g.label)).toEqual(["web", "api", "No workspace"]);
    expect(activePreset(DEFAULT_NAV).id).toBe("recent");
    expect(activePreset({ ...DEFAULT_NAV, organize: "grouped" }).id).toBe("workspace");
    expect(activePreset({ ...DEFAULT_NAV, sort: "created" })).toBeNull();
  });
});

describe("conversation list menu", () => {
  it("opens the view menu and applies a sort that survives re-rendering", async () => {
    let mount;
    const c = document.createElement("div");
    document.body.append(c);
    window.localStorage.clear();
    const items = [{ id: "a", title: "Alpha", created_at: "2026-10-20T00:00:00Z", updated_at: "2026-10-28T00:00:00Z", execution_status: "finished" }, { id: "b", title: "Beta", created_at: "2026-10-25T00:00:00Z", updated_at: "2026-10-21T00:00:00Z", execution_status: "finished" }];
    activate({ apiVersion: "1", navigate() {}, registerPage: (_, m) => { mount = m; return () => {}; }, agentServer: { request: vi.fn(({ path }) => Promise.resolve(path.startsWith("/api/conversations/search") ? { items } : { items: [] })) } });
    mount({ container: c });
    await vi.waitFor(() => expect(c.querySelectorAll('[data-testid="rt-conv"]')).toHaveLength(2));
    expect([...c.querySelectorAll('[data-testid="rt-conv"] .nm')].map((n) => n.textContent)).toEqual(["Alpha", "Beta"]);

    c.querySelector('[data-testid="rt-nav-menu-toggle"]').click();
    [...c.querySelectorAll('[data-testid="rt-nav-menu"] .mrow')].find((r) => r.textContent.includes("Created")).click();
    expect([...c.querySelectorAll('[data-testid="rt-conv"] .nm')].map((n) => n.textContent)).toEqual(["Beta", "Alpha"]);
    expect(JSON.parse(window.localStorage.getItem("run-timeline:nav")).sort).toBe("created");
    c.remove();
  });
});

describe("about page", () => {
  it("is one click from the conversation list and leaves for the timeline when one is chosen", async () => {
    let mount;
    const c = document.createElement("div");
    document.body.append(c);
    activate({ apiVersion: "1", navigate() {}, registerPage: (_, m) => { mount = m; return () => {}; }, agentServer: { request: vi.fn(({ path }) => Promise.resolve(path.startsWith("/api/conversations/search") ? { items: [{ id: "c1", title: "Fix build", execution_status: "finished", updated_at: "2026-10-29T10:05:00Z" }] } : { items: [] })) } });
    mount({ container: c });
    await vi.waitFor(() => expect(c.querySelectorAll('[data-testid="rt-conv"]')).toHaveLength(1));
    [...c.querySelectorAll(".linkbtn")].find((b) => b.textContent === "About").click();
    expect(c.querySelector('[data-testid="rt-about"]').textContent).toContain("Reading the waterfall");
    expect(c.querySelector('[data-testid="rt-about"]').textContent).toContain("Runward");
    c.querySelector('[data-testid="rt-conv"]').click();
    await vi.waitFor(() => expect(c.querySelector('[data-testid="rt-about"]')).toBeNull());
    c.remove();
  });
});

describe("page", () => {
  let container;
  beforeEach(() => { container = document.createElement("div"); document.body.append(container); });
  afterEach(() => container.remove());

  it("opens the price matrix with every provider", () => {
    let mount;
    activate({ apiVersion: "1", navigate() {}, registerPage: (_, m) => { mount = m; return () => {}; }, agentServer: { request: () => Promise.resolve({ items: [] }) } });
    mount({ container });
    [...container.querySelectorAll(".seg button")].find((b) => b.textContent === "Prices").click();
    const table = container.querySelector('[data-testid="rt-price-matrix"]');
    expect(table.textContent).toContain("Claude Opus 5.5");
    expect(table.textContent).toContain("claude-opus-4-5");
    expect(container.querySelectorAll(".chip").length).toBeGreaterThan(5);

    // Sorting by output price, high to low, flattens the list.
    const header = [...container.querySelectorAll(".pm th button")].find((b) => b.textContent.startsWith("Output"));
    header.click();
    const outputs = [...container.querySelectorAll(".pm tr:not(.grp)")].slice(1, 6).map((tr) => Number(tr.children[3].textContent.replace(/[$,]/g, "")));
    expect(container.querySelector(".pm tr.grp")).toBeNull();
    expect(container.querySelector('.pm th[aria-sort="descending"]').textContent).toContain("Output");
    expect(outputs).toEqual([...outputs].sort((a, b) => b - a));
    // A second click reverses it; a third restores the grouped list.
    [...container.querySelectorAll(".pm th button")].find((b) => b.textContent.startsWith("Output")).click();
    expect(container.querySelector('.pm th[aria-sort="ascending"]')).not.toBeNull();
    [...container.querySelectorAll(".pm th button")].find((b) => b.textContent.startsWith("Output")).click();
    expect(container.querySelector(".pm tr.grp")).not.toBeNull();
  });

  it("lists conversations, loads one's events and draws the waterfall", async () => {
    let mount;
    const events = [msg("m1", "2026-10-29T10:00:00", "user", "go"), action("a1", "2026-10-29T10:00:01"), obs("o1", "a1", "2026-10-29T10:00:03")];
    const host = {
      apiVersion: "1", navigate: vi.fn(),
      registerPage: (_, m) => { mount = m; return () => {}; },
      agentServer: { request: vi.fn(({ path }) => Promise.resolve(path.startsWith("/api/conversations/search") ? { items: [{ id: "c1", title: "Fix build", execution_status: "finished", updated_at: "2026-10-29T10:05:00Z" }] } : { items: events })) },
    };
    activate(host);
    mount({ container });
    await vi.waitFor(() => expect(container.querySelectorAll('[data-testid="rt-conv"]')).toHaveLength(1));
    expect(container.querySelector('[data-testid="rt-conv"]').textContent).toContain("Fix build");

    // The newest conversation opens by itself: the page never starts empty.
    await vi.waitFor(() => expect(container.querySelector('[data-testid="rt-waterfall"]')).not.toBeNull());
    expect(container.querySelectorAll('[data-testid="rt-row"]')).toHaveLength(2);
    expect(container.textContent).toContain("terminal");

    container.querySelectorAll('[data-testid="rt-row"]')[1].click();
    expect(container.querySelector('[data-testid="rt-detail"]').textContent).toContain("command: ls");
  });
});

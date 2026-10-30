import { describe, expect, it, vi } from "vitest";
import {
  activate, activityOf, renderMarkdown, unwrapMessage, plainText, factoriesOf, factoryName, factoryIcon, factoryIconKey, kamijiFace, LOOK_EYES, LOOK_TOGGLES, LOOK_SHAPES, LOOK_EXPRESSIONS, LOOK_COLORS, stateNear, workOf, workLine, DEFAULT_PREFS, extractBlocks, liveAgent, messageText, modelOf, organizeAgents, renderBlock, sampleAgents, shortTime, validateBlock,
} from "./extension.js";

function mountWith(request) {
  localStorage.clear();
  localStorage.setItem("hangout:v1", JSON.stringify({ welcomed: true }));
  let mountFn;
  const host = { apiVersion: "1", navigate: vi.fn(), agentServer: { request }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } };
  activate(host);
  const container = document.createElement("div");
  document.body.append(container);
  const dispose = mountFn({ container });
  return { container, dispose, host };
}
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const submit = (container, value) => {
  const field = container.querySelector(".field");
  field.value = value;
  field.dispatchEvent(new Event("input"));
  container.querySelector(".send").click();
};

describe("message and agent helpers", () => {
  it("reads only text from a MessageEvent", () => {
    expect(messageText({ kind: "MessageEvent", llm_message: { content: [{ type: "text", text: "hi " }, { type: "image" }] } })).toBe("hi");
    expect(messageText({ kind: "ActionEvent" })).toBe("");
  });

  it("names a live agent from its profile, role tag and reported model, with workspace and parent", () => {
    const agent = liveAgent({
      id: "c9", title: "Ship docs", tags: { role: "worker" }, launched_agent_profile: { agent_profile_id: "p1" },
      parent_conversation_id: "c1", workspace: { working_dir: "/work/site/" },
      stats: { usage_to_metrics: { default: { model_name: "ollama/qwen3:32b" } } },
    }, [], [{ id: "p1", name: "Docs Bot" }]);
    expect(agent).toMatchObject({ name: "Docs Bot", role: "Worker", model: "qwen3:32b", workspace: "site", parentId: "live:c1", title: "Ship docs" });
    expect(modelOf({ current_model_id: "anthropic/claude-sonnet-5-5" })).toBe("claude-sonnet-5-5");
  });

  it("labels yesterday by name and ignores bad dates", () => {
    const now = new Date(2026, 9, 29, 15, 0);
    expect(shortTime(new Date(2026, 9, 28, 9, 0).toISOString(), now)).toBe("Yesterday");
    expect(shortTime("not a date", now)).toBe("");
  });
});

describe("Arco blocks", () => {
  it("accepts the known block types and repairs fields", () => {
    expect(validateBlock({ type: "statCard", title: "T", stats: [{ label: "A", value: 3 }, "junk"] })).toMatchObject({ type: "statCard", stats: [{ label: "A", value: "3", delta: "" }] });
    expect(validateBlock({ type: "scriptTag" })).toBeNull();
    expect(validateBlock("nope")).toBeNull();
  });

  it("finds blocks in fenced JSON: one block, an array, or a surface", () => {
    const message = [
      "Here you go",
      "```json", JSON.stringify({ type: "textBlock", body: "hello" }), "```",
      "```openui-lang", JSON.stringify({ id: "s", blocks: [{ type: "taskCard", tasks: [{ label: "a" }] }, { type: "bogus" }] }), "```",
      "```json", "{not json", "```",
    ].join("\n");
    expect(extractBlocks(message).map((b) => b.type)).toEqual(["textBlock", "taskCard"]);
  });

  it("renders text safely and reports a form's answers", () => {
    const onSubmit = vi.fn();
    const card = renderBlock(validateBlock({ type: "formBlock", title: "Ask", fields: [{ name: "q", label: "<b>Question</b>" }] }), { onSubmit });
    expect(card.querySelector("b")).toBeNull();
    card.querySelector("input").value = "why?";
    card.querySelector("form").dispatchEvent(new Event("submit", { cancelable: true }));
    expect(onSubmit).toHaveBeenCalledWith("Ask\nq: why?");
  });
});

describe("markdown in messages", () => {
  const html = (source) => renderMarkdown(source).innerHTML;

  it("renders bold, code, italics, links and lists as elements", () => {
    const md = renderMarkdown("The only card is **small (S)** with `clamp(n)` and *care*.\n\n- one\n- two\n  - nested\n\n1. first\n2. second");
    expect(md.querySelector("strong").textContent).toBe("small (S)");
    expect(md.querySelector("p code").textContent).toBe("clamp(n)");
    expect(md.querySelector("em").textContent).toBe("care");
    expect(md.querySelectorAll("ul > li").length).toBe(3);
    expect(md.querySelector("ul ul li").textContent).toBe("nested");
    expect(md.querySelectorAll("ol > li").length).toBe(2);
  });

  it("draws fenced code with a language label and a copy button, and tolerates a fence still streaming", () => {
    const done = renderMarkdown("Here:\n```js\nconst a = 1;\n```\nDone");
    expect(done.querySelector(".mdcodebar span").textContent).toBe("js");
    expect(done.querySelector("pre code").textContent).toBe("const a = 1;");
    expect(done.querySelector("p:last-child").textContent).toBe("Done");
    const streaming = renderMarkdown("Working:\n```bash\nnpm test");
    expect(streaming.querySelector("pre code").textContent).toBe("npm test");
  });

  it("renders task lists, tables, headings and quotes", () => {
    const md = renderMarkdown("## Plan\n- [x] done\n- [ ] todo\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n> quoted");
    expect(md.querySelector("h4").textContent).toBe("Plan");
    expect([...md.querySelectorAll("input[type=checkbox]")].map((c) => c.checked)).toEqual([true, false]);
    expect(md.querySelector("th").textContent).toBe("a");
    expect(md.querySelector("td").textContent).toBe("1");
    expect(md.querySelector("blockquote").textContent).toBe("quoted");
  });

  it("never turns message text into markup, and only links to safe URLs", () => {
    const md = renderMarkdown("<img src=x onerror=alert(1)> [bad](javascript:alert(1)) [ok](https://example.com) https://openhands.dev/docs.");
    expect(md.querySelector("img")).toBeNull();
    const hrefs = [...md.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["https://example.com", "https://openhands.dev/docs"]);
    expect(md.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("unwraps a JSON reply envelope into its message with the summary as a note", () => {
    const envelope = JSON.stringify({ message: "Three items:\n- CARD-1\n- CARD-2", summary: "Inform user" });
    expect(unwrapMessage(envelope)).toEqual({ body: "Three items:\n- CARD-1\n- CARD-2", note: "Inform user" });
    const md = renderMarkdown(envelope);
    expect(md.querySelectorAll("li").length).toBe(2);
    expect(md.querySelector(".mdnote").textContent).toBe("Inform user");
    expect(html("plain {not json}")).toContain("plain {not json}");
  });

  it("makes a one-line preview without markdown marks", () => {
    expect(plainText("**Done** — see `util.mjs`\n```\ncode\n```\n- [x] item")).toBe("Done — see util.mjs item");
  });
});

describe("factory names", () => {
  it("keeps real project names and folds scratch folders into one factory", () => {
    expect(factoryName("OpenHands")).toBe("OpenHands");
    expect(factoryName("3313e89a2c2d4c12b55a2d89fc8f25b0")).toBe("Scratch workspaces");
    expect(factoryName("tmp")).toBe("Scratch workspaces");
    expect(factoryName("")).toBe("Unassigned");
  });
});

describe("conversation activity", () => {
  it("collects commands with their output, files, pages and tasks", () => {
    const events = [
      { kind: "ActionEvent", id: "a1", tool_name: "terminal", action: { command: "npm test" } },
      { kind: "ObservationEvent", action_id: "a1", observation: { content: [{ type: "text", text: "42 passed" }], exit_code: 0 } },
      { kind: "ActionEvent", id: "a2", tool_name: "file_editor", action: { command: "create", path: "/w/PLAN.md", file_text: "# Plan" } },
      { kind: "ActionEvent", id: "a3", tool_name: "file_editor", action: { command: "str_replace", path: "/w/a.ts" } },
      { kind: "ActionEvent", id: "a4", tool_name: "browser_navigate", action: { url: "https://example.com" } },
      { kind: "ActionEvent", id: "a5", tool_name: "task_tracker", action: { task_list: [{ title: "Do it", status: "done" }] } },
    ];
    const a = activityOf(events);
    expect(a.commands).toEqual([{ command: "npm test", output: "42 passed", exit: 0 }]);
    expect(a.files.map((f) => f.path)).toEqual(["/w/PLAN.md", "/w/a.ts"]);
    expect(a.plan).toBe("# Plan");
    expect(a.pages[0].url).toBe("https://example.com");
    expect(a.tasks).toEqual([{ title: "Do it", status: "done", notes: "" }]);
  });
});

describe("work items", () => {
  it("finds PRs and tickets by source, with state and the diff", () => {
    const events = [
      { kind: "MessageEvent", source: "agent", llm_message: { content: [{ type: "text", text: "Opened https://github.com/acme/app/pull/12 as a draft. Tracking https://linear.app/acme/issue/ENG-45 today. https://acme.atlassian.net/browse/OPS-7 is done." }] } },
      { kind: "ActionEvent", id: "e1", tool_name: "file_editor", action: { command: "str_replace", path: "/a.ts", old_str: "a\nb", new_str: "a\nb\nc" } },
      { kind: "ActionEvent", id: "e2", tool_name: "file_editor", action: { command: "create", path: "/b.ts", file_text: "x\ny\nz" } },
    ];
    const work = workOf(events, { execution_status: "running" }, activityOf(events));
    expect(work.items.map((i) => [i.source, i.id])).toEqual([["github", "#12"], ["jira", "OPS-7"], ["linear", "ENG-45"]]);
    expect(work.items.find((i) => i.source === "github").state).toBe("draft");
    expect(work.items.find((i) => i.source === "jira").state).toBe("done");
    expect(work.diff).toEqual({ files: 2, added: 6, removed: 2 });
    expect(work.run).toBe("running");
  });

  it("keeps each mention's state to its own sentence", () => {
    const events = [{ kind: "MessageEvent", source: "agent", llm_message: { content: [{ type: "text", text: "Opened https://github.com/acme/app/pull/12 as a draft. Tracking https://linear.app/acme/issue/ENG-45 today. https://acme.atlassian.net/browse/OPS-7 is done." }] } }];
    const byId = Object.fromEntries(workOf(events).items.map((i) => [i.id, i.state]));
    expect(byId).toEqual({ "#12": "draft", "ENG-45": "", "OPS-7": "done" });
  });

  it("does not mistake encodings for tickets, and reads merged state", () => {
    const events = [{ kind: "MessageEvent", source: "agent", llm_message: { content: [{ type: "text", text: "Saved as UTF-8 per ISO-8601." }] } }];
    expect(workOf(events).items).toEqual([]);
    expect(stateNear("PR #5 was merged yesterday", "#5")).toBe("merged");
  });

  it("draws the source icon, number, state and diff", () => {
    const line = workLine({ items: [{ source: "github", kind: "pr", id: "#9", repo: "a/b", state: "open" }], diff: { files: 2, added: 10, removed: 3 }, run: "idle" });
    expect(line.querySelector(".srcicon.github")).toBeTruthy();
    expect(line.querySelector(".wnum").textContent).toBe("#9");
    expect(line.querySelector(".wstate").textContent).toBe("open");
    expect(line.querySelector(".wdiff").textContent).toBe("+10−3");
    expect(workLine({ items: [], diff: { files: 0, added: 0, removed: 0 }, run: "" })).toBeNull();
  });
});

describe("list organising", () => {
  const now = Date.parse("2026-10-30T12:00:00Z");
  const mk = (id, extra = {}) => ({ id, name: id, title: id, role: "Worker", model: "m", live: true, workspace: "w1", parentId: "", tags: [], automation: false, updatedAt: now - 1000, createdAt: now - 5000, ...extra });
  const flat = (groups) => groups.flatMap((g) => g.rows.map((r) => `${r.depth}:${r.agent.id}`));

  it("nests subagents under their parent and can flatten or hide them", () => {
    const agents = [mk("p"), mk("c", { parentId: "p", updatedAt: now - 2000 })];
    expect(flat(organizeAgents(agents, DEFAULT_PREFS, "", {}, now))).toEqual(["0:p", "1:c"]);
    expect(flat(organizeAgents(agents, { ...DEFAULT_PREFS, subagents: "flat" }, "", {}, now))).toEqual(["0:p", "0:c"]);
    expect(flat(organizeAgents(agents, { ...DEFAULT_PREFS, subagents: "hide" }, "", {}, now))).toEqual(["0:p"]);
    expect(flat(organizeAgents(agents, DEFAULT_PREFS, "", { p: true }, now))).toEqual(["0:p"]);
  });

  it("groups by workspace, sorts, and filters by age, automations and tags", () => {
    const agents = [mk("a", { workspace: "w1", updatedAt: now - 10 * 86_400_000, createdAt: now - 1 }), mk("b", { workspace: "w2", automation: true, tags: ["team:ops"] }), mk("c", { workspace: "w1" })];
    const groups = organizeAgents(agents, DEFAULT_PREFS, "", {}, now);
    expect(groups.map((g) => g.label).sort()).toEqual(["w1", "w2"]);
    expect(flat(organizeAgents(agents, { ...DEFAULT_PREFS, organize: "recent", sort: "created" }, "", {}, now))).toEqual(["0:a", "0:b", "0:c"].sort((x, y) => ({ a: 0, b: 1, c: 1 }[x[2]] - { a: 0, b: 1, c: 1 }[y[2]])));
    expect(flat(organizeAgents(agents, { ...DEFAULT_PREFS, older: "7d" }, "", {}, now))).not.toContain("0:a");
    expect(flat(organizeAgents(agents, { ...DEFAULT_PREFS, automations: "only" }, "", {}, now))).toEqual(["0:b"]);
    expect(flat(organizeAgents(agents, { ...DEFAULT_PREFS, tags: ["team:ops"] }, "", {}, now))).toEqual(["0:b"]);
    expect(flat(organizeAgents(agents, { ...DEFAULT_PREFS, source: "sample" }, "", {}, now))).toEqual([]);
  });

  it("nests the sample agents in a three-level tree", () => {
    const rows = organizeAgents(sampleAgents(now), DEFAULT_PREFS, "", {}, now).flatMap((g) => g.rows);
    expect(rows.find((r) => r.agent.id === "ea").depth).toBe(1);
    expect(rows.find((r) => r.agent.id === "inbox").depth).toBe(2);
  });

  it("lists factories with live and subagent counts, and filters by factory or trees", () => {
    const agents = sampleAgents(now);
    const factories = factoriesOf([...agents, mk("x", { factory: "kosmos", live: true }), mk("y", { factory: "kosmos", live: true, parentId: "x" })]);
    expect(factories[0]).toMatchObject({ name: "kosmos", agents: 2, live: 2, trees: 1 });
    expect(factories.find((f) => f.name === "Web Platform")).toMatchObject({ agents: 3, trees: 2 });
    const inFactory = organizeAgents(agents, { ...DEFAULT_PREFS, factory: "Data Pipeline" }, "", {}, now).flatMap((g) => g.rows.map((r) => r.agent.id));
    expect(inFactory.sort()).toEqual(["expense", "support"]);
    const trees = organizeAgents(agents, { ...DEFAULT_PREFS, trees: true }, "", {}, now).flatMap((g) => g.rows.map((r) => r.agent.id));
    expect(trees.sort()).toEqual(["chief", "ea", "expense", "inbox", "support"]);
  });
});

describe("Hangout page", () => {
  it("lists agents, switches the drawer tab, and sends from the pinned composer", async () => {
    const { container, dispose } = mountWith(vi.fn().mockRejectedValue(new Error("offline")));
    await tick();
    expect(container.querySelectorAll(".row").length).toBe(9);
    container.querySelector(".tab[aria-selected='true']").textContent === "Cards";
    expect(container.querySelectorAll(".acard").length).toBeGreaterThan(0);
    [...container.querySelectorAll(".tab")].find((t) => t.textContent === "Terminal").click();
    expect(container.querySelector("[data-block='terminalBlock']")).toBeTruthy();
    submit(container, "status?");
    await tick();
    expect([...container.querySelectorAll(".bubble.me")].map((n) => n.textContent)).toContain("status?");
    expect(container.textContent).toContain("not reachable");
    dispose();
  });

  it("shows live conversations with their cards, and posts messages into them", async () => {
    const reply = "```json\n" + JSON.stringify({ type: "statCard", title: "Tests", stats: [{ label: "passed", value: "42" }] }) + "\n```";
    const request = vi.fn(async ({ path }) => {
      if (path.startsWith("/api/conversations/search")) return { items: [{ id: "c1", title: "Docs agent", updated_at: "2026-10-30T10:00:00Z", workspace: { working_dir: "/work/docs" } }] };
      if (path.includes("/events/search")) return { items: [{ kind: "MessageEvent", source: "agent", llm_message: { content: [{ type: "text", text: reply }] } }] };
      return {};
    });
    const { container, dispose } = mountWith(request);
    await tick(10);
    expect(container.querySelector(".group").textContent).toBe("docs");
    const first = container.querySelector(".row");
    expect(first.textContent).toContain("Docs agent");
    first.click();
    expect(container.querySelector("[data-block='statCard']")).toBeTruthy();
    submit(container, "ship it");
    await tick(10);
    const post = request.mock.calls.find(([arg]) => arg.method === "POST");
    expect(post[0].path).toBe("/api/conversations/c1/events");
    expect(post[0].body).toMatchObject({ role: "user", run: true });
    dispose();
  });

  it("opens the view menu and narrows the list with a filter chip", async () => {
    const { container, dispose } = mountWith(vi.fn().mockRejectedValue(new Error("offline")));
    await tick();
    container.querySelector(".iconbtn").click();
    const automations = [...container.querySelectorAll(".menu h4")].find((h) => h.textContent === "Automations").nextSibling;
    [...automations.querySelectorAll("button")].find((b) => b.textContent === "Hide").click();
    expect(container.querySelectorAll(".row").length).toBe(7);
    expect(container.querySelector(".chips .chip").textContent).toContain("No automations");
    dispose();
  });

  it("toggles between chat, preview and computer views", async () => {
    const { container, dispose } = mountWith(vi.fn().mockRejectedValue(new Error("offline")));
    await tick();
    const view = (label) => container.querySelector(`.rail [aria-label="${label}"]`);
    expect(container.querySelector(".shell").classList.contains("view-chat")).toBe(true);
    view("Drawer").click();
    expect(container.querySelector(".drawer")).toBeNull();
    view("Preview").click();
    expect(container.querySelector(".urlbar")).toBeTruthy();
    container.querySelector(".pstage .abtn").click();
    expect(container.querySelector("iframe").getAttribute("sandbox")).toBe("");
    view("Computer").click();
    expect(container.querySelector(".ccontrol").textContent).toContain("has control");
    container.querySelector(".takeover").click();
    expect(container.querySelector(".ccontrol").textContent).toContain("You have control");
    view("Chat").click();
    expect(container.querySelector(".row")).toBeTruthy();
    dispose();
  });

  it("edits an agent's Kamiji face in the Studio and shows it as their avatar", async () => {
    const { container, dispose } = mountWith(vi.fn().mockRejectedValue(new Error("offline")));
    await tick();
    container.querySelector('.rail [aria-label="Studio"]').click();
    expect(container.querySelector(".powered").textContent).toContain("Powered by");
    expect(container.querySelector(".powered").textContent).toContain("Kamiji");
    expect(container.querySelector(".powered").textContent).toContain("Kosmos");
    const options = [...container.querySelectorAll(".sopt")];
    expect(options.length).toBe(LOOK_SHAPES.length + LOOK_EXPRESSIONS.length + LOOK_EYES.length);
    expect(LOOK_SHAPES.length).toBeGreaterThanOrEqual(24);
    expect(new Set(LOOK_SHAPES.map((x) => x[2])).size).toBeGreaterThanOrEqual(4);
    options.find((o) => o.textContent === "Hexagon").click();
    container.querySelectorAll(".swatch")[2].click();
    container.querySelector('.rail [aria-label="Chat"]').click();
    const mark = container.querySelector(".chathead .avatar svg path");
    expect(mark.getAttribute("fill")).toBe(LOOK_COLORS[2]);
    dispose();
  });
});

describe("Kamiji face engine", () => {
  it("draws every shape and expression, with eyes that read on dark and light bodies", () => {
    LOOK_SHAPES.forEach(([shape]) => LOOK_EXPRESSIONS.forEach(([expression]) => {
      const svg = kamijiFace({ shape, expression, color: LOOK_COLORS[0] });
      expect(svg.querySelectorAll("path, ellipse").length).toBeGreaterThan(2);
    }));
    expect(kamijiFace({ shape: "circle", expression: "neutral", color: "#0b0b0c" }).querySelector("ellipse").getAttribute("fill")).toBe("#ffffff");
    expect(kamijiFace({ shape: "circle", expression: "neutral", color: "#efece4" }).querySelector("ellipse").getAttribute("fill")).toContain("rgba(0,0,0");
    expect(kamijiFace({ shape: "nope", expression: "nope", color: "javascript:x" }).querySelector("path").getAttribute("fill")).toBe(LOOK_COLORS[0]);
  });

  it("changes the eyes with style, gaze, size and the face switches", () => {
    expect(LOOK_EYES.length).toBeGreaterThanOrEqual(10);
    const base = { shape: "circle", expression: "attentive", color: LOOK_COLORS[0] };
    LOOK_EYES.forEach(([eyeStyle]) => expect(kamijiFace({ ...base, eyeStyle }).querySelectorAll("path, ellipse, circle").length).toBeGreaterThan(2));
    const big = kamijiFace({ ...base, eyeSize: 1.4 }).querySelector("g ellipse");
    const small = kamijiFace({ ...base, eyeSize: 0.7 }).querySelector("g ellipse");
    expect(Number(big.getAttribute("rx"))).toBeGreaterThan(Number(small.getAttribute("rx")));
    const left = kamijiFace({ ...base, gaze: "left" }).querySelector("g ellipse").getAttribute("cx");
    const right = kamijiFace({ ...base, gaze: "right" }).querySelector("g ellipse").getAttribute("cx");
    expect(Number(left)).toBeLessThan(Number(right));
    const count = (look) => kamijiFace({ ...base, ...look }).querySelectorAll("path, ellipse, circle").length;
    expect(count({ glasses: true })).toBeGreaterThan(count({}));
    expect(count({ brows: false })).toBeLessThan(count({}));
    expect(count({ mouth: false })).toBeLessThan(count({}));
    expect(count({ blush: "on" })).toBeGreaterThan(count({}));
  });

  it("offers eye styles and face switches in the Studio and applies them", async () => {
    const { container, dispose } = mountWith(vi.fn().mockRejectedValue(new Error("offline")));
    await tick();
    container.querySelector('.rail [aria-label="Studio"]').click();
    [...container.querySelectorAll(".sopt")].find((o) => o.textContent === "Cartoon").click();
    expect(container.querySelector(".sbig svg ellipse[fill='#f4f6f7']")).toBeTruthy();
    const glasses = [...container.querySelectorAll(".sswitch")].find((r) => r.textContent === "Glasses").querySelector("input");
    const before = container.querySelectorAll(".sbig svg circle").length;
    glasses.checked = true;
    glasses.dispatchEvent(new Event("change"));
    expect(container.querySelectorAll(".sbig svg circle").length).toBeGreaterThan(before);
    expect(LOOK_TOGGLES.length).toBeGreaterThanOrEqual(5);
    dispose();
  });
});

describe("factories strip", () => {
  it("shows factories as a list of objects, and keeps the card grid as an alternative", async () => {
    const { container, dispose } = mountWith(vi.fn().mockRejectedValue(new Error("offline")));
    await tick();
    expect(container.querySelector(".listtop .factories")).toBeTruthy();
    expect(container.querySelectorAll(".frow").length).toBe(4);
    expect(container.querySelectorAll(".fcard").length).toBe(0);
    expect([...container.querySelectorAll(".ficon")].map((i) => i.dataset.icon)).toEqual(["phone", "globe", "database", "server"]);
    const list = () => container.querySelector(".flist");
    expect(list().classList.contains("open")).toBe(false);
    container.querySelector(".fmore").click();
    expect(list().classList.contains("open")).toBe(true);
    [...container.querySelectorAll(".frow")].find((r) => r.textContent.includes("Data Pipeline")).click();
    expect(container.querySelectorAll(".row").length).toBe(2);
    expect(container.querySelector(".chips").textContent).toContain("Factory: Data Pipeline");
    [...container.querySelectorAll(".fchip")].find((c) => c.textContent === "All").click();
    [...container.querySelectorAll(".fchip")].find((c) => c.textContent === "Multi-agent").click();
    expect(container.querySelectorAll(".row").length).toBe(5);
    [...container.querySelectorAll(".fviewbtn")].find((b) => b.textContent === "Grid").click();
    expect(container.querySelectorAll(".fcard").length).toBe(4);
    expect(container.querySelectorAll(".frow").length).toBe(0);
    dispose();
  });

  it("gives factories things to look like, not faces", () => {
    expect(factoryIconKey("Web Platform")).toBe("globe");
    expect(factoryIconKey("Mobile Apps")).toBe("phone");
    expect(factoryIconKey("Scratch workspaces")).toBe("box");
    expect(factoryIconKey("some-unknown-repo")).toBeTruthy();
    const tile = factoryIcon("Infrastructure");
    expect(tile.querySelector("svg")).toBeTruthy();
    expect(tile.querySelectorAll("ellipse").length).toBe(0);
    expect(tile.getAttribute("class")).not.toContain("avatar");
  });
});

describe("mobile views", () => {
  it("shows the welcome screen on first run and the list after signing in", () => {
    localStorage.clear();
    let mountFn;
    activate({ apiVersion: "1", navigate: vi.fn(), agentServer: { request: async () => ({ items: [] }) }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } });
    const container = document.createElement("div");
    document.body.append(container);
    mountFn({ container });
    expect(container.querySelector(".list")).toBeNull();
    container.querySelector(".wgo").click();
    expect(container.querySelector(".list")).not.toBeNull();
    expect(container.querySelector(".pinned .pin")).not.toBeNull();
  });

  it("opens a chat from the list, goes back, and resolves an email draft card", () => {
    const { container } = mountWith(async () => ({ items: [] }));
    const inbox = [...container.querySelectorAll(".row")].find((r) => r.textContent.includes("Inbox Manager"));
    inbox.click();
    expect(container.querySelector(".shell").classList.contains("pane-chat")).toBe(true);
    container.querySelector(".action .go").click();
    expect(container.querySelector(".action .arow")).toBeNull();
    expect([...container.querySelectorAll(".bubble.agent")].some((b) => b.textContent === "Sent")).toBe(true);
    container.querySelector(".mback").click();
    expect(container.querySelector(".shell").classList.contains("pane-list")).toBe(true);
  });
});

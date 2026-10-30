import { describe, expect, it, vi } from "vitest";
import {
  activate, activityOf, createBlobScene, stepBlobScene, blobField, seededRandom, eyesOf, eyeOutline, blobColorAt, TEAM_HUMANS, humansOnAgent, teamAgents, ownerOf, renderMarkdown, unwrapMessage, plainText, factoriesOf, factoryName, factoryIcon, factoryIconKey, kamijiFace, LOOK_EYES, LOOK_TOGGLES, LOOK_SHAPES, LOOK_EXPRESSIONS, LOOK_COLORS, stateNear, workOf, workLine, DEFAULT_PREFS, extractBlocks, liveAgent, messageText, modelOf, organizeAgents, renderBlock, sampleAgents, shortTime, validateBlock,
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

describe("team in the drawer", () => {
  it("opens on the Team tab with the humans on the selected agent first, then everyone", async () => {
    localStorage.clear();
    let mountFn;
    const host = { apiVersion: "1", navigate: vi.fn(), agentServer: { request: vi.fn().mockRejectedValue(new Error("offline")) }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } };
    activate(host);
    const container = document.createElement("div");
    document.body.append(container);
    const dispose = mountFn({ container });
    await new Promise((r) => setTimeout(r, 0));
    const welcome = container.querySelector(".wgo");
    if (welcome) welcome.click();
    expect(container.querySelector(".tab[aria-selected='true']").textContent).toBe("Team");
    expect(humansOnAgent("chief").map((h) => h.name)).toEqual(["Maya Chen"]);
    const here = [...container.querySelectorAll(".person.here:not(.agentrow) .pname")].map((n) => n.textContent);
    expect(here).toEqual(["Maya Chen"]);
    const humanRows = [...container.querySelectorAll(".person:not(.agentrow)")];
    expect(humanRows.length).toBe(1 + TEAM_HUMANS.length);
    const agentRows = [...container.querySelectorAll(".agentrow")];
    expect(agentRows.length).toBe(6);
    expect(agentRows[0].classList.contains("here")).toBe(true);
    expect(container.querySelector(".psec:last-of-type, .pane .psec:nth-last-of-type(1)").textContent).toContain("AI agents");
    [...container.querySelectorAll(".person")].find((r) => r.textContent.includes("Omar")).querySelector("button").click();
    expect(container.querySelector(".field").value).toBe("@Omar ");
    dispose();
  });
});

describe("welcome from the rail", () => {
  it("reopens the welcome screen from the bottom of the rail and returns on sign in", async () => {
    localStorage.clear();
    let mountFn;
    const host = { apiVersion: "1", navigate: vi.fn(), agentServer: { request: vi.fn().mockRejectedValue(new Error("offline")) }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } };
    activate(host);
    const container = document.createElement("div");
    document.body.append(container);
    const dispose = mountFn({ container });
    expect(container.querySelector(".welcome .wpowered").textContent).toBe("Powered byKamijiandKosmos");
    container.querySelector(".wgo").click();
    expect(container.querySelector(".welcome")).toBeNull();
    expect(container.querySelector(".list .lpowered").textContent).toContain("Kosmos");
    const buttons = [...container.querySelectorAll(".rail .rbtn")];
    expect(buttons.at(-1).getAttribute("aria-label")).toBe("Welcome");
    buttons.at(-1).click();
    expect(container.querySelector(".welcome .wcanvas")).toBeTruthy();
    container.querySelector(".wgo").click();
    expect(container.querySelector(".shell")).toBeTruthy();
    dispose();
  });
});

describe("blob eyes", () => {
  const scene = () => createBlobScene(1200, 800, seededRandom(5));
  const width = (pts) => Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
  const height = (pts) => Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y));

  it("draws two pill-shaped eyes that sit on the blob", () => {
    const s = scene();
    const [left, right] = eyesOf(s);
    expect(left.length).toBeGreaterThan(20);
    expect(height(left)).toBeGreaterThan(width(left) * 2);
    expect(Math.abs(width(left) - width(right))).toBeLessThan(2);
    expect(blobField(s.balls, (Math.min(...left.map((p) => p.x)) + Math.max(...right.map((p) => p.x))) / 2, s.fy)).toBeGreaterThan(1);
  });

  it("bends onto a sphere: an eye turned toward the edge narrows and curves", () => {
    const s = scene();
    const front = eyeOutline(s, 0, 0);
    const turned = eyeOutline(s, 0.8, 0);
    expect(width(turned)).toBeLessThan(width(front) * 0.85);
    const top = turned.slice(0, 15).map((p) => p.y);
    expect(Math.max(...top) - Math.min(...top)).toBeGreaterThan(1);
  });

  it("blinks and looks around over time, always staying on the front of the sphere", () => {
    const s = scene();
    let sawBlink = false, minYaw = 0, maxYaw = 0;
    for (let t = 0; t < 30; t += 0.02) {
      stepBlobScene(s, 0.02);
      if (s.eyes.closed > 0.9) sawBlink = true;
      minYaw = Math.min(minYaw, s.eyes.yaw); maxYaw = Math.max(maxYaw, s.eyes.yaw);
      expect(Math.abs(s.eyes.yaw)).toBeLessThan(1.2);
    }
    expect(sawBlink).toBe(true);
    expect(maxYaw - minYaw).toBeGreaterThan(0.4);
  });

  it("centres the eye sphere on the mass itself, however lopsided it gets", () => {
    const s = scene();
    for (let t = 0; t < 30; t += 0.05) {
      stepBlobScene(s, 0.05);
      if (Math.round(t * 20) % 20 === 0) {
        const mass = s.balls.slice(0, 7);
        let sx = 0, sy = 0, n = 0;
        for (let y = 0; y < 800; y += 4) for (let x = 0; x < 1200; x += 4) if (blobField(mass, x, y) >= 1) { sx += x; sy += y; n += 1; }
        expect(Math.abs(sx / n - s.fx)).toBeLessThan(s.eyeR * 0.08);
        expect(Math.abs(sy / n - s.fy)).toBeLessThan(s.eyeR * 0.08);
      }
    }
  });

  it("keeps both eyes inside the blob as it jiggles and they look around", () => {
    const s = scene();
    let worst = Infinity;
    for (let t = 0; t < 40; t += 0.05) {
      stepBlobScene(s, 0.05);
      if (Math.round(t * 20) % 8 === 0) {
        eyesOf(s).flat().forEach((p) => { worst = Math.min(worst, blobField(s.balls.slice(0, 7), p.x, p.y)); });
      }
    }
    expect(worst).toBeGreaterThan(0.85);
  });

  it("shuts the eyes to a slit in a blink, and follows the pointer", () => {
    const s = scene();
    stepBlobScene(s, 0.02);
    const open = height(eyesOf(s)[0]);
    s.eyes.closed = 1;
    expect(height(eyesOf(s)[0])).toBeLessThan(open * 0.35);
    s.eyes.closed = 0;
    s.eyes.pointer = { x: s.fx + 400, y: s.fy, at: s.t };
    for (let t = 0; t < 1; t += 0.02) stepBlobScene(s, 0.02);
    expect(s.eyes.yaw).toBeGreaterThan(0.3);
  });
});

describe("welcome blob", () => {
  const run = (seconds, seed = 3) => {
    const scene = createBlobScene(1200, 800, seededRandom(seed));
    for (let t = 0; t < seconds; t += 0.05) stepBlobScene(scene, 0.05);
    return scene;
  };

  it("is one solid mass in the middle with empty space around it", () => {
    const scene = run(4);
    expect(blobField(scene.balls, 600, 400)).toBeGreaterThan(1);
    expect(blobField(scene.balls, 4, 4)).toBeLessThan(1);
    expect(scene.balls.length).toBeGreaterThanOrEqual(7);
  });

  it("sheds small blobs and melts them back in, never piling up", () => {
    const scene = run(40);
    expect(scene.shed).toBeGreaterThan(20);
    expect(scene.melted).toBeGreaterThan(10);
    expect(scene.minis.length).toBeLessThanOrEqual(16);
    expect(scene.minis.every((m) => Number.isFinite(m.x) && Number.isFinite(m.y) && m.r > 0)).toBe(true);
  });

  it("gives the small blobs their own hues away from the mass, and the mass one violet", () => {
    const s = createBlobScene(1200, 800, seededRandom(9));
    const seen = new Set();
    let wasViolet = false;
    for (let t = 0; t < 40; t += 0.05) {
      stepBlobScene(s, 0.05);
      s.minis.forEach((m) => { if (m.rgb && m.rgb.join() !== "139,92,246") seen.add(m.rgb.join()); });
      if (s.minis.some((m) => m.rgb && m.rgb.join() === "139,92,246")) wasViolet = true;
    }
    expect(seen.size).toBeGreaterThan(8);
    expect(wasViolet).toBe(true);
    expect(blobColorAt(s.balls, s.fx, s.fy)).toEqual([139, 92, 246]);
  });

  it("colours a point by the blob that supplies it", () => {
    const balls = [{ x: 0, y: 0, r: 10, rgb: [0, 0, 0] }, { x: 100, y: 0, r: 10, rgb: [200, 100, 50] }];
    expect(blobColorAt(balls, 1, 0)).toEqual([0, 0, 0].map((v, i) => blobColorAt(balls, 1, 0)[i]));
    expect(blobColorAt(balls, 99, 0)[0]).toBeGreaterThan(190);
    expect(blobColorAt(balls, 1, 0)[0]).toBeLessThan(10);
    expect(blobColorAt([], 0, 0)).toEqual([139, 92, 246]);
  });

  it("is a smaller mass that fills only the middle of the screen", () => {
    const scene = run(6);
    const area = (() => { let n = 0; for (let y = 0; y < 800; y += 8) for (let x = 0; x < 1200; x += 8) if (blobField(scene.balls, x, y) > 1) n += 1; return n / ((800 / 8) * (1200 / 8)); })();
    expect(area).toBeGreaterThan(0.01);
    expect(area).toBeLessThan(0.16);
  });

  it("plays back the same way for the same seed", () => {
    expect(run(10).balls.map((b) => Math.round(b.x))).toEqual(run(10).balls.map((b) => Math.round(b.x)));
  });

  it("shows the blob and a Smooth/Voxel choice instead of hands, and remembers the choice", async () => {
    localStorage.clear();
    let mountFn;
    const host = { apiVersion: "1", navigate: vi.fn(), agentServer: { request: vi.fn().mockRejectedValue(new Error("offline")) }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } };
    activate(host);
    const container = document.createElement("div");
    document.body.append(container);
    const dispose = mountFn({ container });
    expect(container.querySelector(".wcanvas")).toBeTruthy();
    expect(container.querySelector(".wblob")).toBeNull();
    [...container.querySelectorAll(".wmode")].find((b) => b.textContent === "Voxel").click();
    expect(JSON.parse(localStorage.getItem("hangout:v1")).welcomeStyle).toBe("voxel");
    expect([...container.querySelectorAll(".wmode")].find((b) => b.textContent === "Voxel").getAttribute("aria-pressed")).toBe("true");
    dispose();
  });
});

describe("agents in the team list", () => {
  const mk = (id, factory, run, name = id) => ({ id, name, factory, work: { run } });
  it("puts the selected agent's factory first, then working before idle", () => {
    const all = [mk("a", "x", "idle"), mk("b", "y", "running"), mk("c", "y", "idle"), mk("d", "x", "running")];
    expect(teamAgents(all, mk("sel", "y", "idle")).map((a) => a.id)).toEqual(["b", "c", "d", "a"]);
  });

  it("names who runs a sample agent", () => {
    expect(ownerOf("chief").name).toBe("Maya Chen");
    expect(ownerOf("nobody")).toBeUndefined();
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
    [...container.querySelectorAll(".tab")].find((x) => x.textContent === "Cards").click();
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
    [...container.querySelectorAll(".tab")].find((x) => x.textContent === "Cards").click();
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

import { describe, expect, it, vi } from "vitest";
import {
  activate, techRail, activityOf, createBlobScene, stepBlobScene, blobField, seededRandom, eyesOf, eyeOutline, blobColorAt, BLOB_VARIANTS, setBlobVariant, variantColorAt, sphereCoords, BLOB_SHAPES, setBlobShape, shapeIcon, blobSvg, TEAM_HUMANS, humansOnAgent, teamAgents, ownerOf, renderMarkdown, unwrapMessage, plainText, factoriesOf, factoryName, factoryIcon, factoryIconKey, kamijiFace, fluxOrb, pipelineAssignments, PIPELINE_STEPS, PIPELINE_LINKS, LOOK_EYES, LOOK_TOGGLES, LOOK_SHAPES, LOOK_EXPRESSIONS, LOOK_COLORS, stateNear, workOf, workLine, DEFAULT_PREFS, extractBlocks, liveAgent, messageText, modelOf, organizeAgents, renderBlock, sampleAgents, shortTime, validateBlock,
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
    expect(container.querySelector(".welcome .wpowered span").textContent).toBe("Built with");
    const built = container.querySelector(".welcome .wpowered");
    expect(built.textContent).toContain("Built with");
    expect(built.textContent).not.toContain("Powered by");
    const kamiji = built.querySelector('a[aria-label="Kamiji"]');
    const kosmos = built.querySelector('a[aria-label="Kosmos"]');
    expect(kamiji.getAttribute("href")).toBe("https://github.com/FraterCCCLXIII/kamiji");
    expect(kosmos.getAttribute("href")).toBe("https://kosmos.computer");
    expect(kamiji.querySelector("svg")).not.toBeNull();
    expect(kosmos.querySelector("svg")).not.toBeNull();

    container.querySelector(".wgo").click();
    expect(container.querySelector(".welcome")).toBeNull();
    expect(container.querySelector(".list .lpowered a[aria-label=\"Kosmos\"]")).not.toBeNull();
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
        const mass = s.balls.slice(0, 1 + s.lobes.length);
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
        eyesOf(s).flat().forEach((p) => { worst = Math.min(worst, blobField(s.balls.slice(0, 1 + s.lobes.length), p.x, p.y)); });
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

const BLOBS_FOR_TEST = ["violet", "blue", "green", "teal", "brown", "orange", "red", "pink", "indigo"];

describe("smooth hands", () => {
  it("draws the Hand shape in the Studio as smooth curves, with no cube grid", () => {
    const svg = kamijiFace({ shape: "hand", expression: "neutral", color: "#3b82f6", eyeStyle: "oval", gaze: "center", eyeSize: 1, eyeSpacing: 1, brows: true, mouth: true, effects: true, shine: false, glasses: false, blush: "auto" });
    expect(svg.querySelectorAll("line").length).toBeGreaterThan(4);
    expect(svg.querySelectorAll("rect").length).toBeLessThan(10);
  });
});
describe("avatar alignment", () => {
  it("puts every avatar first in its row, with the expand arrow on the right", async () => {
    localStorage.clear();
    let mountFn;
    const host = { apiVersion: "1", navigate: vi.fn(), agentServer: { request: vi.fn().mockRejectedValue(new Error("offline")) }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } };
    activate(host);
    const container = document.createElement("div");
    document.body.append(container);
    const dispose = mountFn({ container });
    container.querySelector(".wgo").click();
    const rows = [...container.querySelectorAll(".rows .row")];
    expect(rows.length).toBeGreaterThan(5);
    rows.forEach((r) => expect(r.firstElementChild.classList.contains("avatar")).toBe(true));
    const withArrow = rows.filter((r) => r.querySelector(".twist"));
    expect(withArrow.length).toBeGreaterThan(0);
    withArrow.forEach((r) => expect(r.querySelector(".rowright .twist")).toBeTruthy());
    dispose();
  });
});

describe("orb avatars", () => {
  it("is the default avatar: a flat blob with two pill eyes that glance and blink", () => {
    const orb = blobSvg("violet");
    expect(orb.getAttribute("data-style")).toBe("orb");
    expect(orb.querySelectorAll("rect.pill-eye")).toHaveLength(2);
    expect(orb.querySelector("path").getAttribute("fill").toLowerCase()).toBe("#8b5cf6");
    expect(orb.querySelector(".orb-body .orb-look .orb-blink")).toBeTruthy();
    expect(orb.querySelectorAll("rect:not(.pill-eye)")).toHaveLength(0);
    expect(blobSvg("pink").querySelector("path").getAttribute("fill").toLowerCase()).not.toBe("#8b5cf6");
  });

  it("is out of step with the others, so a column of them does not move as one", () => {
    const delays = BLOBS_FOR_TEST.map((id) => blobSvg(id).querySelector(".orb-body").style.animationDelay);
    expect(new Set(delays).size).toBeGreaterThan(5);
  });

  it("uses the orb for every avatar, including the ones in the list", async () => {
    localStorage.clear();
    let mountFn;
    const host = { apiVersion: "1", navigate: vi.fn(), agentServer: { request: vi.fn().mockRejectedValue(new Error("offline")) }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } };
    activate(host);
    const container = document.createElement("div");
    document.body.append(container);
    const dispose = mountFn({ container });
    container.querySelector(".wgo").click();
    const avatars = [...container.querySelectorAll(".row .avatar svg")];
    expect(avatars.length).toBeGreaterThan(5);
    expect(avatars.every((s) => s.getAttribute("data-style") === "orb")).toBe(true);
    dispose();
  });
});

describe("blob shapes", () => {
  const shaped = (id) => { const s = createBlobScene(1200, 800, seededRandom(6)); setBlobShape(s, id); for (let t = 0; t < 5; t += 0.05) stepBlobScene(s, 0.05); return s; };
  const extent = (s) => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const mass = s.balls.slice(0, 1 + s.lobes.length);
    for (let y = 0; y < 800; y += 5) for (let x = 0; x < 1200; x += 5) if (blobField(mass, x, y) >= 1) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return { w: x1 - x0, h: y1 - y0 };
  };

  it("has at least nine shapes, each an SVG outline with points for the lobes", () => {
    expect(BLOB_SHAPES.length).toBeGreaterThanOrEqual(9);
    BLOB_SHAPES.slice(1).forEach((sh) => { expect(sh.poly.length).toBeGreaterThanOrEqual(3); expect(sh.pts).toHaveLength(10); });
    BLOB_SHAPES.forEach((sh) => { const svg = shapeIcon(sh); expect(svg.querySelector("polygon, path")).toBeTruthy(); });
  });

  it("morphs the mass into the chosen outline and stays one solid body", () => {
    const pill = extent(shaped("pill"));
    expect(pill.w).toBeGreaterThan(pill.h * 1.35);
    const square = extent(shaped("square"));
    expect(Math.abs(square.w - square.h)).toBeLessThan(square.w * 0.25);
    BLOB_SHAPES.forEach((sh) => {
      const s = shaped(sh.id);
      expect(blobField(s.balls, s.fx, s.fy)).toBeGreaterThan(1);
      expect(s.eyeR).toBeGreaterThan(s.base * 0.8);
    });
  });

  it("glides rather than jumping when the shape changes", () => {
    const s = shaped("blob");
    const before = s.lobes.map((l) => [l.ox, l.oy]);
    setBlobShape(s, "star");
    stepBlobScene(s, 0.016);
    const moved = s.lobes.map((l, i) => Math.hypot(l.ox - before[i][0], l.oy - before[i][1]));
    expect(Math.max(...moved)).toBeLessThan(s.base * 0.9);
    expect(Math.max(...moved)).toBeGreaterThan(0);
  });
});

describe("blob variations", () => {
  const sceneWith = (id) => { const s = createBlobScene(1200, 800, seededRandom(4)); setBlobVariant(s, id); for (let t = 0; t < 3; t += 0.05) stepBlobScene(s, 0.05); return s; };

  it("offers at least eight distinct variations, each giving valid colours", () => {
    expect(BLOB_VARIANTS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(BLOB_VARIANTS.map((v) => v.id)).size).toBe(BLOB_VARIANTS.length);
    BLOB_VARIANTS.forEach((v) => {
      const s = sceneWith(v.id);
      for (const [x, y] of [[s.fx, s.fy], [s.fx + 90, s.fy - 40], [s.fx - 120, s.fy + 100]]) {
        const c = variantColorAt(s, x, y);
        expect(c).toHaveLength(3);
        c.forEach((n) => { expect(Number.isFinite(n)).toBe(true); expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThanOrEqual(255); });
      }
    });
  });

  it("rainbow and prism change across the mass and over time; solid does not", () => {
    ["rainbow", "prism", "gradient", "aurora", "sunset"].forEach((id) => {
      const s = sceneWith(id);
      const a = variantColorAt(s, s.fx - 80, s.fy - 50).join();
      const b = variantColorAt(s, s.fx + 80, s.fy + 60).join();
      expect(a).not.toBe(b);
    });
    const r = sceneWith("rainbow");
    const before = variantColorAt(r, r.fx, r.fy).join();
    for (let t = 0; t < 2; t += 0.05) stepBlobScene(r, 0.05);
    expect(variantColorAt(r, r.fx, r.fy).join()).not.toBe(before);
    const solid = sceneWith("solid");
    expect(variantColorAt(solid, solid.fx, solid.fy)).toEqual(variantColorAt(solid, solid.fx + 60, solid.fy + 30));
  });

  it("maps the mass onto a sphere, and bunches the gradient bands toward its edge", () => {
    const s = sceneWith("rainbow");
    const R = s.eyeR / 0.9;
    const mid = sphereCoords(s, s.fx, s.fy);
    expect(mid.w).toBeCloseTo(1, 5);
    const edge = sphereCoords(s, s.fx + R * 0.97, s.fy);
    expect(edge.w).toBeLessThan(0.3);
    const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    const change = (x) => dist(variantColorAt(s, x, s.fy), variantColorAt(s, x + 4, s.fy));
    expect(change(s.fx + R * 0.88)).toBeGreaterThan(change(s.fx) * 1.5);
    const out = sphereCoords(s, s.fx + R * 3, s.fy);
    expect(Math.hypot(out.u, out.v)).toBeLessThanOrEqual(1.0001);
  });

  it("vibrates: fizz and neon shake the radii faster than the calm violet", () => {
    const shake = (id) => {
      const s = sceneWith(id);
      let total = 0, prev = s.balls[0].r;
      for (let i = 0; i < 80; i += 1) { stepBlobScene(s, 0.01); total += Math.abs(s.balls[0].r - prev); prev = s.balls[0].r; }
      return total;
    };
    expect(shake("fizz")).toBeGreaterThan(shake("solid") * 2);
    expect(shake("neon")).toBeGreaterThan(shake("solid"));
  });

  it("shows a dot for each variation, switches live, and remembers the choice", () => {
    localStorage.clear();
    let mountFn;
    const host = { apiVersion: "1", navigate: vi.fn(), agentServer: { request: vi.fn().mockRejectedValue(new Error("offline")) }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } };
    activate(host);
    const container = document.createElement("div");
    document.body.append(container);
    const dispose = mountFn({ container });
    const dots = [...container.querySelectorAll(".wdot")];
    expect(dots.length).toBe(BLOB_VARIANTS.length);
    expect(dots[0].getAttribute("aria-pressed")).toBe("true");
    container.querySelector('.wdot[data-variant="rainbow"]').click();
    expect(container.querySelector('.wdot[data-variant="rainbow"]').getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector(".wdot[data-variant='solid']").getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelector(".wvariant").textContent).toBe("Rainbow");
    expect(JSON.parse(localStorage.getItem("hangout:v1")).welcomeVariant).toBe("rainbow");
    dispose();
  });

  it("puts the controls in the lower-left corner with a rail of SVG shapes that changes the blob", () => {
    localStorage.clear();
    let mountFn;
    const host = { apiVersion: "1", navigate: vi.fn(), agentServer: { request: vi.fn().mockRejectedValue(new Error("offline")) }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } };
    activate(host);
    const container = document.createElement("div");
    document.body.append(container);
    const dispose = mountFn({ container });
    const corner = container.querySelector(".welcome .wcorner");
    expect(corner.querySelector(".wmodes")).toBeTruthy();
    expect(corner.querySelector(".wdots")).toBeTruthy();
    expect(container.querySelector(".wbox .wmodes")).toBeNull();
    const buttons = [...corner.querySelectorAll(".wshape")];
    expect(buttons.length).toBe(BLOB_SHAPES.length);
    buttons.forEach((b) => expect(b.querySelector("svg")).toBeTruthy());
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    corner.querySelector('.wshape[data-shape="heart"]').click();
    expect(corner.querySelector('.wshape[data-shape="heart"]').getAttribute("aria-pressed")).toBe("true");
    expect(JSON.parse(localStorage.getItem("hangout:v1")).welcomeShape).toBe("heart");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(corner.querySelector(".wshape[aria-pressed='true']").dataset.shape).toBe(BLOB_SHAPES[BLOB_SHAPES.findIndex((x) => x.id === "heart") + 1].id);
    dispose();
  });

  it("uses small single-colour dots, and the arrow keys cycle through the variations", () => {
    localStorage.clear();
    let mountFn;
    const host = { apiVersion: "1", navigate: vi.fn(), agentServer: { request: vi.fn().mockRejectedValue(new Error("offline")) }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } };
    activate(host);
    const container = document.createElement("div");
    document.body.append(container);
    const dispose = mountFn({ container });
    BLOB_VARIANTS.forEach((v) => expect(v.dot).toMatch(/^#[0-9a-f]{6}$/i));
    expect(new Set(BLOB_VARIANTS.map((v) => v.dot)).size).toBe(BLOB_VARIANTS.length);
    const pressed = () => container.querySelector(".wdot[aria-pressed='true']").dataset.variant;
    expect(pressed()).toBe("solid");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(pressed()).toBe("rainbow");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(pressed()).toBe("paper");
    expect(container.querySelector(".wvariant").textContent).toBe("Paper");
    expect(JSON.parse(localStorage.getItem("hangout:v1")).welcomeVariant).toBe("paper");
    dispose();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(JSON.parse(localStorage.getItem("hangout:v1")).welcomeVariant).toBe("paper");
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
    expect(container.querySelector(".powered").textContent).toContain("Built with");
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

const DEFAULT_LOOK_FOR_TEST = { shape: "circle", expression: "neutral", color: "#8b5cf6", eyeStyle: "oval", gaze: "center", eyeSize: 1, eyeSpacing: 1, brows: true, mouth: true, effects: true, shine: false, glasses: false, blush: "auto" };
describe("wisp in the Studio", () => {
  it("offers the wisp as a shape that draws with any expression", () => {
    expect(LOOK_SHAPES.some(([id]) => id === "wisp")).toBe(true);
    const svg = kamijiFace({ ...DEFAULT_LOOK_FOR_TEST, shape: "wisp" });
    expect(svg.querySelector("path").getAttribute("d")).toContain("M32 6C45 5");
  });
});

describe("flux orbs", () => {
  it("gives each human their own orb in the Team tab, not initials", () => {
    localStorage.clear();
    localStorage.setItem("hangout:v1", JSON.stringify({ welcomed: true, tab: "team", tabv: 2 }));
    let mountFn;
    activate({ apiVersion: "1", navigate: vi.fn(), agentServer: { request: async () => ({ items: [] }) }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } });
    const container = document.createElement("div");
    document.body.append(container);
    mountFn({ container });
    const badges = [...container.querySelectorAll(".pbadge")];
    expect(badges.length).toBeGreaterThan(3);
    badges.forEach((b) => { expect(b.querySelector("canvas.flux")).not.toBeNull(); expect(b.textContent).toBe(""); });
    expect(new Set(badges.map((b) => `${b.querySelector("canvas").dataset.variant}/${b.querySelector("canvas").dataset.shape}`)).size).toBeGreaterThan(2);
  });

  it("is a Studio shape whose colours and shape follow the look", () => {
    expect(LOOK_SHAPES.some(([id]) => id === "flux")).toBe(true);
    expect(fluxOrb({ variant: "sunset", shape: "blob" }).dataset.variant).toBe("sunset");
  });
});

describe("pipeline tab", () => {
  it("assigns the people to person-led steps and an agent by role to the rest, steadily", () => {
    const asg = pipelineAssignments(sampleAgents());
    expect(asg.t1.humans.map((h) => h.name)).toEqual(["Omar Haddad"]);
    expect(asg.hitl2.humans.map((h) => h.name)).toEqual(["Maya Chen"]);
    expect(asg.plan.agent.role.toLowerCase()).toBe("conductor");
    expect(asg.ci.agent.role.toLowerCase()).toBe("verifier");
    expect(pipelineAssignments(sampleAgents()).code.agent.id).toBe(asg.code.agent.id);
    PIPELINE_LINKS.forEach((l) => { expect(PIPELINE_STEPS.some((x) => x.id === l.source)).toBe(true); expect(PIPELINE_STEPS.some((x) => x.id === l.target)).toBe(true); });
  });

  it("opens a wide Pipeline tab with every step, and selecting one shows who works it", () => {
    localStorage.clear();
    localStorage.setItem("hangout:v1", JSON.stringify({ welcomed: true, tab: "pipeline", tabv: 2 }));
    let mountFn;
    activate({ apiVersion: "1", navigate: vi.fn(), agentServer: { request: async () => ({ items: [] }) }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } });
    const container = document.createElement("div");
    document.body.append(container);
    mountFn({ container });
    expect(container.querySelector(".shell").classList.contains("pipewide")).toBe(true);
    expect(container.querySelectorAll(".pnode")).toHaveLength(PIPELINE_STEPS.length);
    [...container.querySelectorAll(".pnode")].find((n) => n.textContent.startsWith("Jira ticket")).click();
    expect(container.querySelector(".pdetail").textContent).toContain("Dev Patel");
  });
});

describe("built-with rail", () => {
  it("links each technology by name, and falls back to a letter when its logo cannot load", () => {
    const rail = techRail(["webrtc", "nostr", "unknown"]);
    const links = [...rail.querySelectorAll("a.tech")];
    expect(links.map((a) => a.title)).toEqual(["WebRTC", "Nostr"]);
    expect(links.every((a) => a.rel.includes("noopener"))).toBe(true);
    expect(links[1].textContent).toBe("N");
    links[0].querySelector("img").dispatchEvent(new Event("error"));
    expect(links[0].querySelector("img")).toBeNull();
    expect(links[0].textContent).toBe("W");
  });
});

describe("draggable column dividers", () => {
  it("renders separators, resizes a column by dragging and restores the saved width after a remount", async () => {
    const { container, dispose } = mountWith(async () => ({ ok: true, json: async () => ({}) }));
    await tick();
    const grid = container.querySelector(".shell");
    const handle = grid.querySelector(":scope > .colgrip");
    expect(handle.getAttribute("role")).toBe("separator");
    expect(grid.style.getPropertyValue("--grip-0")).toBe("320px");
    handle.dispatchEvent(new MouseEvent("pointerdown", { clientX: 100, bubbles: true }));
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: 150, bubbles: true }));
    document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    expect(grid.style.getPropertyValue("--grip-0")).toBe("370px");
    const handleCount = grid.querySelectorAll(".colgrip").length;
    dispose();
    container.remove();
    // The mount helper clears storage first; keep the saved width for the remount.
    vi.spyOn(Storage.prototype, "clear").mockImplementation(() => {});
    const again = mountWith(async () => ({ ok: true, json: async () => ({}) }));
    await tick();
    const grid2 = again.container.querySelector(".shell");
    expect(grid2.style.getPropertyValue("--grip-0")).toBe("370px");
    expect(grid2.querySelectorAll(".colgrip").length).toBe(handleCount);
    vi.restoreAllMocks();
  });
});

describe("button colours", () => {
  it("gives every solid contrast or primary fill its own foreground token, and fixed dark panels their own text colour", () => {
    const { container } = mountWith(async () => ({ ok: false, status: 404, json: async () => ({}) }));
    const css = container.querySelector("style").textContent;
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim(), body }));
    const decl = (body, prop) => new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;]+)`).exec(body)?.[1].trim();
    const darkHex = (v) => /^#[0-9a-f]{6}$/i.test(v || "") && [1, 3, 5].reduce((n, i) => n + parseInt(v.slice(i, i + 2), 16), 0) < 150;
    for (const { sel, body } of rules) {
      if (/::|\binput\b/.test(sel)) continue; // pseudo-element marks and switch tracks carry no text
      const bg = decl(body, "background");
      const color = decl(body, "color");
      if (bg === "var(--hg-contrast)") expect(color, sel).toBe("var(--hg-on-contrast)");
      if (bg === "var(--hg-primary)") expect(color, sel).toBe("var(--hg-on-primary)");
      if (darkHex(bg)) expect(color, sel).toMatch(/^#[0-9a-f]{3,6}$/i);
    }
  });
});

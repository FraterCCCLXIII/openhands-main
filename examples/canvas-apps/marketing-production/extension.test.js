import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activate, applyPlan, assetCost, launchLead, projectReleases, quarterCoverage, releaseItems, TEMPLATES, toT, validateItem,
} from "./extension.js";

const DAY = 86_400_000;

function hostWith(onRegister) {
  return {
    apiVersion: "1",
    navigate: vi.fn(),
    agentServer: { request: vi.fn() },
    registerPage: (id, mount) => { onRegister(id, mount); return () => {}; },
  };
}

describe("release schedule", () => {
  it("projects weekly releases after the last shipped one", () => {
    const out = projectReleases([{ tag: "v1.34.0", date: "2026-10-27" }], 2);
    expect(out.map((r) => [r.tag, r.date])).toEqual([["v1.35.0", "2026-11-03"], ["v1.36.0", "2026-11-10"]]);
    expect(out.every((r) => r.projected)).toBe(true);
  });

  it("marks shipped releases shipped and projected ones planned", () => {
    const items = releaseItems([{ tag: "v1.34.0", date: "2026-10-27" }]);
    expect(items[0]).toMatchObject({ lane: "release", status: "shipped", projected: false });
    expect(items.at(-1)).toMatchObject({ status: "planned", projected: true });
  });
});

describe("plan logic", () => {
  it("finds a quarter with no campaign", () => {
    const items = [{ lane: "campaign", start: "2026-10-01", end: "2026-12-31" }];
    const [q4, q1] = quarterCoverage(items, toT("2026-10-29"), 2);
    expect(q4.campaigns).toHaveLength(1);
    expect(q1.campaigns).toHaveLength(0);
  });

  it("reports how long before a campaign starts its feature ships", () => {
    expect(launchLead({ start: "2026-11-09" }, { end: "2026-11-14" })).toBe(5);
    expect(launchLead({ start: "2026-11-09" }, { end: "2026-11-01" })).toBe(-8);
  });

  it("prices video by the second and other assets each", () => {
    const rates = { image2d: 1, model3d: 2, video: 0.5 };
    expect(assetCost([{ kind: "image2d" }, { kind: "model3d" }, { kind: "video", seconds: 10 }], rates)).toBe(8);
  });

  it("rejects items without a title or a valid lane and drops unknown channels", () => {
    expect(validateItem({ lane: "campaign", title: "", start: "2026-11-01" })).toBeNull();
    expect(validateItem({ lane: "release", title: "x", start: "2026-11-01" })).toBeNull();
    expect(validateItem({ lane: "campaign", title: "A", start: "2026-11-01", channels: ["x", "resend"] }).channels).toEqual(["x"]);
  });

  it("applies an agent's plan JSON and refuses an empty one", () => {
    const state = { items: [], assets: [] };
    const n = applyPlan(state, JSON.stringify({ items: [{ lane: "project", title: "Video", start: "2026-11-01", end: "2026-11-05" }], assets: [{ kind: "video", name: "Teaser", seconds: 15 }] }));
    expect(n).toEqual({ items: 1, assets: 1 });
    expect(() => applyPlan(state, "{}")).toThrow(/No valid/);
    expect(() => applyPlan(state, "nope")).toThrow(/valid JSON/);
  });

  it("ships a Markdown and a JSON file for every template", () => {
    TEMPLATES.forEach((t) => {
      expect(t.md.length).toBeGreaterThan(50);
      expect(t.json.template).toBe(t.id);
    });
  });
});

describe("page", () => {
  let container;
  beforeEach(() => { window.localStorage.clear(); container = document.createElement("div"); document.body.append(container); });
  afterEach(() => { container.remove(); });

  it("registers the page and renders the timeline lanes, tabs and a campaign link", () => {
    let mount;
    activate(hostWith((id, m) => { expect(id).toBe("production"); mount = m; }));
    const cleanup = mount({ container });

    expect(container.textContent).toContain("Release train");
    expect(container.textContent).toContain("Quarterly campaigns");
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(10);
    expect(container.querySelectorAll(".links line").length).toBeGreaterThan(0);
    cleanup();
    expect(container.querySelector(".mp")).toBeNull();
  });

  it("switches views from the tabs", () => {
    let mount;
    activate(hostWith((_, m) => { mount = m; }));
    mount({ container });
    const tab = (name) => [...container.querySelectorAll('[role="tab"]')].find((t) => t.textContent === name);

    tab("Connectors").click();
    expect(container.textContent).toContain("Google Search Console");
    expect(container.textContent).toContain("Resend");
    expect(container.textContent).toContain("Not using");
    tab("Assets").click();
    expect(container.textContent).toContain("Seedance");
    tab("Templates").click();
    expect(container.textContent).toContain("quarterly-campaign.md");
  });

  it("starts an agent conversation only when the person confirms", async () => {
    let mount;
    const host = hostWith((_, m) => { mount = m; });
    host.agentServer.request.mockImplementation(({ path }) => Promise.resolve(path === "/api/agent-profiles" ? { profiles: [{ id: "a1", name: "default" }], active_agent_profile_id: "a1" } : { id: "c-9" }));
    activate(host);
    mount({ container });

    [...container.querySelectorAll("button")].find((b) => b.textContent === "Plan with AI").click();
    expect(host.agentServer.request).not.toHaveBeenCalled();
    [...container.querySelectorAll("button")].find((b) => b.textContent === "Start conversation").click();
    await vi.waitFor(() => expect(host.navigate).toHaveBeenCalledWith("/conversations/c-9"));
    const post = host.agentServer.request.mock.calls.find(([r]) => r.method === "POST")[0];
    expect(post.body.initial_message.content[0].text).toContain("Goal:");
  });

  it("maps each campaign to the generators and connectors it uses, and toggles a connector", () => {
    let mount;
    activate(hostWith((_, m) => { mount = m; }));
    mount({ container });
    const click = (el) => el.click();
    click([...container.querySelectorAll('[role="tab"]')].find((t) => t.textContent === "Map"));

    const modules = container.querySelectorAll(".node.mod");
    expect(modules.length).toBeGreaterThan(3);
    expect(container.querySelectorAll(".node.gen")).toHaveLength(3);
    expect(container.querySelectorAll(".node.con")).toHaveLength(8);

    click(modules[0]);
    const before = container.querySelectorAll(".node.con.on").length;
    const off = [...container.querySelectorAll(".node.con:not(.on)")][0];
    click(off);
    expect(container.querySelectorAll(".node.con.on").length).toBe(before + 1);
  });
});

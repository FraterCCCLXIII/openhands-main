import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activate, adMatrix, applyPlan, funnelMatrix, revenueMatrix, teamsMonthly, assetCost, forecastMetric, growthMatrix, olsFit, sampleAds, sampleGrowth, SITES, weeklySpend, launchLead, projectReleases, quarterCoverage, releaseItems, TEMPLATES, toT, validateItem,
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

describe("ad efficiency and growth", () => {
  const now = Date.parse("2026-10-29T00:00:00Z");

  it("recovers a trend and a spend effect exactly from clean data", () => {
    const spend = [100, 200, 150, 300, 250, 400];
    const y = spend.map((s, t) => 10 + 2 * t + 0.5 * s);
    const { beta } = olsFit(spend.map((s, t) => [1, t, s]), y);
    expect(beta.map((b) => Math.round(b * 1000) / 1000)).toEqual([10, 2, 0.5]);
    expect(forecastMetric(y, spend, [500]).future[0].value).toBeCloseTo(10 + 2 * 6 + 250, 3);
  });

  it("projects more growth when ad spend is raised", () => {
    const ads = sampleAds(now);
    const growth = sampleGrowth(ads);
    const hold = growthMatrix(ads, growth, 1);
    const more = growthMatrix(ads, growth, 1.5);
    hold.forEach((row, i) => expect(more[i].at12).toBeGreaterThan(row.at12));
  });

  it("applies each conversion percent down the Teams and Enterprise funnels", () => {
    const rows = [{ id: "activated", last4: 1000, at4: 1100, at12: 1200, lift12: 100 }];
    const [teams, ent] = funnelMatrix(rows, { teamCreate: 10, teamPaid: 50, entLead: 2, entQualified: 50, entWon: 20 });
    expect(teams.stages.map((s) => s.now)).toEqual([100, 50]);
    expect(teams.stages[1].fromActivated).toBeCloseTo(5);
    expect(ent.stages.map((s) => Math.round(s.at12 * 100) / 100)).toEqual([24, 12, 2.4]);
    expect(funnelMatrix([{ id: "visitors" }])).toEqual([]);
  });

  it("prices Teams from the pricing page and values Enterprise at an assumed contract", () => {
    expect(teamsMonthly(10)).toBe(500);
    expect(teamsMonthly(14)).toBe(700);
    const future = [{ value: 1000 }, { value: 1000 }];
    const rows = [{ id: "activated", last4: 1000, at4: 1000, at12: 1000, lift12: 0, future, hold: future }];
    const funnels = funnelMatrix(rows, { teamCreate: 10, teamPaid: 50, entLead: 2, entQualified: 50, entWon: 20 });
    const r = revenueMatrix(funnels, { seats: 10, entAcv: 40000 });
    // 1000 activated: 10% make a team, 50% of those pay -> 50 accounts a week at $500.
    expect(r.teams.nowMrr).toBe(50 * 500);
    // 1000 * 2% * 50% * 20% = 2 enterprise wins a week at $40,000.
    expect(r.enterprise.nowAcv).toBe(2 * 40000);
    expect(r.addedAnnual).toBe(2 * 50 * 500 * 12 + 2 * 2 * 40000);
    expect(r.liftAnnual).toBe(0);
  });

  it("is stable and its totals add up", () => {
    const a = sampleAds(now);
    expect(sampleAds(now)).toEqual(a);
    const m = adMatrix(a);
    const bySite = SITES.reduce((s, site) => s + m.cols[site.id].spend, 0);
    expect(Math.round(bySite)).toBe(Math.round(m.total.spend));
    expect(weeklySpend(a)).toHaveLength(12);
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
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(11);
    expect(container.querySelectorAll(".links line").length).toBeGreaterThan(0);
    cleanup();
    expect(container.querySelector(".mp")).toBeNull();
  });

  it("inks the planned and in-progress chips so they stay readable on a light theme", () => {
    let mount;
    activate(hostWith((_, m) => { mount = m; }));
    const cleanup = mount({ container });
    const css = [...document.head.querySelectorAll("style")].map((s) => s.textContent).join("\n");
    for (const status of ["s-planned", "s-in_progress"]) {
      const rule = css.match(new RegExp(`\\.chip\\.${status}\\s*\\{([^}]*)\\}`))[1];
      expect(rule).toMatch(/color:\s*color-mix\(.*,\s*var\(--mp-contrast\)\)/);
    }
    cleanup();
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

  it("shows the growth matrix under the timeline and the ad efficiency matrix", () => {
    let mount;
    activate(hostWith((_, m) => { mount = m; }));
    mount({ container });
    expect(container.querySelector('[data-testid="mp-growth"]').textContent).toContain("Weekly active users");
    const funnel = container.querySelector('[data-testid="mp-funnel"]');
    expect(funnel.textContent).toContain("Closed-won accounts");
    const rate = funnel.querySelector("input");
    rate.value = "20";
    rate.dispatchEvent(new Event("change"));
    expect(container.querySelector('[data-testid="mp-funnel"] input').value).toBe("20");

    [...container.querySelectorAll('[role="tab"]')].find((t) => t.textContent === "Ad spend").click();
    const matrix = container.querySelector('[data-testid="mp-ad-matrix"]');
    expect(matrix.textContent).toContain("openhands.dev");
    expect(matrix.textContent).toContain("Spotify Ads");
    expect(matrix.textContent).toContain("All networks");
  });
});

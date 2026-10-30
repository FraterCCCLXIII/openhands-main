import { describe, expect, it } from "vitest";
import {
  assignNumbers,
  buildSnapshot,
  itemId,
  parseStashes,
  parseWorktrees,
  processSteps,
  readCards,
  ticketItems,
  pushState,
} from "./sync.mjs";

describe("pushState", () => {
  it("separates never-pushed, gone, unpushed and pushed branches", () => {
    expect(pushState({ upstream: "", track: "", ahead: 3, unpushed: 3 })).toBe("never");
    expect(pushState({ upstream: "origin/a", track: "[gone]", ahead: 3, unpushed: 3 })).toBe("gone");
    expect(pushState({ upstream: "origin/a", track: "[ahead 2]", ahead: 5, unpushed: 2 })).toBe("unpushed");
    expect(pushState({ upstream: "origin/a", track: "", ahead: 5, unpushed: 0 })).toBe("pushed");
  });
});

describe("parsers", () => {
  it("reads worktrees, flagging prunable ones and detached heads", () => {
    const trees = parseWorktrees(
      [
        "worktree /repo",
        "HEAD abc",
        "branch refs/heads/main",
        "",
        "worktree /tmp/gone",
        "HEAD def",
        "detached",
        "prunable gitdir file points to non-existent location",
      ].join("\n"),
    );
    expect(trees).toEqual([
      { path: "/repo", branch: "main", prunable: false },
      { path: "/tmp/gone", branch: null, prunable: true },
    ]);
  });

  it("reads the branch a stash was made on", () => {
    expect(
      parseStashes("stash@{0}|2026-10-24|aaa|WIP on feat/x: abc1234 subject\nstash@{1}|2026-08-18|bbb|lint-staged automatic backup"),
    ).toEqual([
      { ref: "stash@{0}", date: "2026-10-24", sha: "aaa", subject: "WIP on feat/x: abc1234 subject", branch: "feat/x" },
      { ref: "stash@{1}", date: "2026-08-18", sha: "bbb", subject: "lint-staged automatic backup", branch: null },
    ]);
  });
});

describe("buildSnapshot", () => {
  it("keeps only seed notes whose item still exists", () => {
    const items = { [itemId("stash", "stash@{0}")]: { kind: "stash" } };
    const snapshot = buildSnapshot(items, {
      "stash:stash@{0}": { status: "explore" },
      "stash:stash@{9}": { status: "drop" },
    });
    expect(snapshot.collections.meta).toEqual({
      [itemId("stash", "stash@{0}")]: { status: "explore" },
    });
  });
});

describe("assignNumbers", () => {
  const item = (kind, lastCommit, extra = {}) => ({ kind, lastCommit, ...extra });

  it("numbers newest first, then keeps every number on the next run", () => {
    const first = assignNumbers({
      "branch:a": item("branch", "2026-10-01"),
      "branch:b": item("branch", "2026-10-02"),
    });
    expect(first.items["branch:b"].num).toBe(1);
    expect(first.items["branch:a"].num).toBe(2);

    const second = assignNumbers(
      { "branch:a": item("branch", "2026-10-01"), "branch:c": item("branch", "2026-10-09") },
      first.registry,
    );
    expect(second.items["branch:a"].num).toBe(2);
    expect(second.items["branch:c"].num).toBe(3);
  });

  it("never reuses the number of an item that disappeared", () => {
    const first = assignNumbers({ "branch:a": item("branch", "2026-10-01") });
    const second = assignNumbers({}, first.registry);
    const third = assignNumbers({ "branch:z": item("branch", "2026-10-02") }, second.registry);
    expect(third.items["branch:z"].num).toBe(2);
  });

  it("follows a stash by commit when its stash@{n} index shifts", () => {
    const first = assignNumbers({ "stash:stash@{1}": item("stash", "2026-08-18", { sha: "bbb" }) });
    const shifted = assignNumbers({ "stash:stash@{0}": item("stash", "2026-08-18", { sha: "bbb" }) }, first.registry);
    expect(shifted.items["stash:stash@{0}"].num).toBe(1);
  });
});

describe("readCards", () => {
  it("flattens every registry chunk of the roadmap snapshot", () => {
    const text = JSON.stringify({
      collections: {
        registry: {
          "chunk-1": { cards: [{ id: "AIR.1", t: "Deck geometry", s: "done", track: "a-airship", tier: 2 }] },
          "chunk-2": { cards: [{ id: "PLG.31", t: "Plugin host", s: "todo", track: "plugins" }] },
        },
      },
    });
    expect(readCards(text)).toEqual({
      "AIR.1": { id: "AIR.1", t: "Deck geometry", s: "done", track: "a-airship" },
      "PLG.31": { id: "PLG.31", t: "Plugin host", s: "todo", track: "plugins" },
    });
  });

  it("returns no cards when the roadmap has not been synced", () => {
    expect(readCards(null)).toEqual({});
  });
});

describe("tickets", () => {
  it("builds numbered future-work items with their stage and category", () => {
    const { items, meta } = ticketItems(
      [{ num: 7, title: "Do it", stage: "ready", category: "chore", tags: ["x"] }],
      "2026-10-26",
    );
    expect(items["ticket:T-007"]).toMatchObject({ kind: "ticket", name: "Do it", num: 7 });
    expect(meta["ticket:T-007"]).toMatchObject({ stage: "ready", category: "chore", tags: ["x"] });
  });

  it("keeps a ticket's own number and leaves the WI sequence alone", () => {
    const { items } = ticketItems([{ num: 3, title: "t", stage: "intake", category: "chore" }], "2026-10-26");
    const out = assignNumbers({ ...items, "branch:a": { kind: "branch", lastCommit: "2026-10-01" } });
    expect(out.items["ticket:T-003"].num).toBe(3);
    expect(out.items["branch:a"].num).toBe(1);
  });
});

describe("processSteps", () => {
  it("keys the design-process steps by id", () => {
    expect(processSteps([{ id: "intake", order: 1 }, { id: "build", order: 5 }])).toEqual({
      intake: { id: "intake", order: 1 },
      build: { id: "build", order: 5 },
    });
  });
});

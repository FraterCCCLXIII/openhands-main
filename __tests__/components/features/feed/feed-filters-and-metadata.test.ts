import { describe, expect, it } from "vitest";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import {
  ALL_FEED_FILTER,
  countFeedProjects,
  matchesFeedFilter,
} from "#/utils/feed-filters";
import { getFeedMetadata } from "#/utils/feed-metadata";
import { sortForNotifications } from "#/utils/feed-notifications";
import { groupConsecutive } from "#/utils/feed-stacks";
import { getFeedAgentRole } from "#/utils/feed-agent-role";
import { toFeedUsage } from "#/utils/feed-usage";
import {
  orderSubagentTree,
  summarizeSubagents,
  type FeedSubagentNode,
} from "#/utils/feed-subagents";

const conv = (overrides: Partial<AppConversation>) =>
  ({
    id: "c",
    selected_repository: null,
    selected_branch: null,
    git_provider: null,
    pr_number: [],
    tags: null,
    ...overrides,
  }) as unknown as AppConversation;

describe("feed filters", () => {
  const a = conv({
    selected_repository: "acme/app",
    launched_agent_profile: { agent_profile_id: "p1", revision: 1 },
  });
  const b = conv({
    selected_workspace: "/Users/me/code/site/",
    launched_agent_profile: { agent_profile_id: "p2", revision: 1 },
  });

  it("combines project and agent profile, with All matching everything", () => {
    expect(matchesFeedFilter(a, ALL_FEED_FILTER)).toBe(true);
    expect(
      matchesFeedFilter(b, {
        ...ALL_FEED_FILTER,
        project: "site",
        agentProfileId: "p2",
      }),
    ).toBe(true);
    expect(
      matchesFeedFilter(a, {
        ...ALL_FEED_FILTER,
        project: "acme/app",
        agentProfileId: "p2",
      }),
    ).toBe(false);
  });

  it("lists repositories and workspace folders as projects with counts", () => {
    expect(countFeedProjects([a, a, b])).toEqual([
      { project: "acme/app", count: 2 },
      { project: "site", count: 1 },
    ]);
  });
});

describe("feed metadata", () => {
  it("links the repo, branch, PRs and issue-tracker tags", () => {
    const meta = getFeedMetadata(
      conv({
        selected_repository: "acme/app",
        selected_branch: "fix/bug",
        git_provider: "github",
        pr_number: [42],
        tags: { issue: "7", linear: "ENG-12", unrelated: "x" },
      }),
    );

    expect(meta.repo?.url).toBe("https://github.com/acme/app");
    expect(meta.branch?.url).toBe("https://github.com/acme/app/tree/fix/bug");
    expect(meta.pullRequests).toEqual([
      { label: "#42", url: "https://github.com/acme/app/pull/42" },
    ]);
    expect(meta.tickets.map((t) => t.url)).toEqual([
      "https://github.com/acme/app/issues/7",
      "https://linear.app/issue/ENG-12",
    ]);
  });

  it("reports a worktree only when the working dir differs from the attached folder", () => {
    const inWorktree = getFeedMetadata(
      conv({
        selected_workspace: "/code/site",
        workspace: { working_dir: "/code/.worktrees/site-1/" },
      }),
    );
    const inPlace = getFeedMetadata(
      conv({
        selected_workspace: "/code/site",
        workspace: { working_dir: "/code/site" },
      }),
    );

    expect(inWorktree.worktree).toMatchObject({
      label: "site-1",
      path: "/code/.worktrees/site-1",
    });
    expect(inPlace.worktree).toBeNull();
  });
});

describe("feed cost source", () => {
  const usage = {
    prompt_tokens: 900,
    completion_tokens: 100,
    cache_read_tokens: 40,
    cache_write_tokens: 10,
    context_window: 200_000,
    per_turn_token: 1_000,
  };
  const metrics = (cost: number | null, budget: number | null) => ({
    accumulated_cost: cost,
    max_budget_per_task: budget,
    accumulated_token_usage: usage,
  });

  it("shows only the server's reported cost", () => {
    expect(toFeedUsage(metrics(0.42, null))).toMatchObject({
      costSource: "reported",
      cost: 0.42,
    });
  });

  it("marks tokens with no reported cost as unpriced, not free", () => {
    expect(toFeedUsage(metrics(0, null))?.costSource).toBe("unpriced");
    expect(toFeedUsage(metrics(null, null))?.costSource).toBe("unpriced");
  });

  it("keeps cache tokens and ignores a zero budget", () => {
    expect(toFeedUsage(metrics(1, 0))).toMatchObject({
      cacheReadTokens: 40,
      cacheWriteTokens: 10,
      budget: null,
    });
    expect(toFeedUsage(metrics(1, 5))?.budget).toBe(5);
  });
});

describe("feed usage", () => {
  it("totals tokens and reports the share of the context window in use", () => {
    const usage = toFeedUsage({
      accumulated_cost: null,
      max_budget_per_task: null,
      accumulated_token_usage: {
        prompt_tokens: 900,
        completion_tokens: 100,
        cache_read_tokens: 0,
        cache_write_tokens: 0,
        context_window: 200_000,
        per_turn_token: 50_000,
      },
    });

    expect(usage).toMatchObject({ totalTokens: 1000, contextPercent: 25 });
  });

  it("has no context percentage when the window is unknown", () => {
    const usage = toFeedUsage({
      accumulated_cost: null,
      max_budget_per_task: null,
      accumulated_token_usage: {
        prompt_tokens: 1,
        completion_tokens: 1,
        cache_read_tokens: 0,
        cache_write_tokens: 0,
        context_window: 0,
        per_turn_token: 0,
      },
    });

    expect(usage?.contextPercent).toBeNull();
  });
});

describe("feed subagents", () => {
  const node = (id: string, parentId: string, depth: number, status?: string) =>
    ({
      conversation: { id, execution_status: status ?? null },
      parentId,
      depth,
    }) as unknown as FeedSubagentNode;

  const nodes = [
    node("a", "root", 1, "running"),
    node("b", "root", 1),
    node("a1", "a", 2, "running"),
    node("a1x", "a1", 3),
  ];

  it("summarizes how many subagents, how deep and how many are running", () => {
    expect(summarizeSubagents(nodes)).toEqual({
      total: 4,
      levels: 3,
      running: 2,
    });
  });

  it("orders children right after their parent", () => {
    expect(
      orderSubagentTree(nodes, "root").map((n) => n.conversation.id),
    ).toEqual(["a", "a1", "a1x", "b"]);
  });
});

describe("feed notifications", () => {
  it("sorts what needs a person first, then by recency", () => {
    const c = (id: string, status: string, updated: string) =>
      ({
        id,
        execution_status: status,
        updated_at: updated,
      }) as AppConversation;

    const sorted = sortForNotifications([
      c("finished-new", "finished", "2026-01-03"),
      c("error-old", "error", "2026-01-01"),
      c("input", "waiting_for_confirmation", "2026-01-02"),
      c("finished-old", "finished", "2026-01-01"),
    ]);

    expect(sorted.map((x) => x.id)).toEqual([
      "input",
      "error-old",
      "finished-new",
      "finished-old",
    ]);
  });
});

describe("feed stacks and roles", () => {
  it("groups only neighbours that share a key, keeping the order", () => {
    const groups = groupConsecutive(
      ["a1", "a2", "b1", "a3"],
      (value) => value[0],
    );

    expect(groups).toEqual([
      { key: "a", items: ["a1", "a2"] },
      { key: "b", items: ["b1"] },
      { key: "a", items: ["a3"] },
    ]);
  });

  it("reads role and tier from tags, else from subagents and model", () => {
    const base = { sub_conversation_ids: [], tags: null, llm_model: null };
    const role = (overrides: object) =>
      getFeedAgentRole({ ...base, ...overrides } as unknown as AppConversation);

    expect(role({ tags: { role: "Verifier", tier: "T3" } })).toEqual({
      role: "verifier",
      tier: 3,
      model: "Opus",
    });
    expect(role({ sub_conversation_ids: ["x"] }).role).toBe("conductor");
    expect(role({ llm_model: "claude-sonnet-5-5" })).toMatchObject({
      role: "worker",
      tier: 2,
    });
    expect(role({ tags: { role: "dispatcher" } }).tier).toBeNull();
  });
});

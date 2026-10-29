import { describe, expect, it } from "vitest";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { summarizeFactory } from "#/components/features/automations/factory/use-factory-data";
import { ExecutionStatus } from "#/types/agent-server/core";
import { FEED_FACTORIES, getFeedFactory } from "#/utils/feed-team-demo";

const [factory, other] = FEED_FACTORIES;

// Conversation ids hash to a simulated factory, so look one up per factory.
const idFor = (factoryId: string, nth: number): string => {
  const matches: string[] = [];
  for (let i = 0; matches.length <= nth; i += 1) {
    if (getFeedFactory(`c${i}`).id === factoryId) matches.push(`c${i}`);
  }
  return matches[nth];
};

const conv = (
  id: string,
  overrides: Partial<AppConversation> = {},
): AppConversation =>
  ({
    id,
    title: id,
    selected_repository: null,
    updated_at: "2026-08-01T12:00:00.000Z",
    execution_status: ExecutionStatus.IDLE,
    ...overrides,
  }) as unknown as AppConversation;

describe("summarizeFactory", () => {
  it("rolls up only the factory's own conversations", () => {
    const summary = summarizeFactory(
      [
        conv(idFor(factory.id, 0), {
          selected_repository: "acme/app",
          execution_status: ExecutionStatus.RUNNING,
          updated_at: "2026-08-03T00:00:00.000Z",
        }),
        conv(idFor(factory.id, 1), { selected_repository: "acme/app" }),
        conv(idFor(factory.id, 2), { selected_repository: "acme/site" }),
        conv(idFor(other.id, 0), { execution_status: ExecutionStatus.RUNNING }),
      ],
      factory.id,
    );

    expect(summary.conversations).toHaveLength(3);
    expect(summary.live).toBe(1);
    expect(summary.projects).toEqual([
      { project: "acme/app", conversations: 2 },
      { project: "acme/site", conversations: 1 },
    ]);
    expect(summary.lastActivity).toBe("2026-08-03T00:00:00.000Z");
    // Every conversation belongs to exactly one simulated agent.
    expect(
      summary.agents.reduce((total, a) => total + a.conversations, 0),
    ).toBe(3);
  });

  it("is empty for a factory with no conversations", () => {
    expect(summarizeFactory([], factory.id)).toEqual({
      conversations: [],
      live: 0,
      agents: [],
      projects: [],
      lastActivity: null,
    });
  });
});

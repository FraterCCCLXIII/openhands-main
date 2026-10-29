import { describe, expect, it } from "vitest";
import { toFeedUpdates } from "#/utils/feed-updates";
import type { OpenHandsEvent } from "#/types/agent-server/core";

const action = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "a1",
    timestamp: "2026-01-01T00:01:00Z",
    source: "agent",
    action: { kind: "TerminalAction" },
    tool_call_id: "t1",
    thought: [],
    thinking_blocks: [],
    tool_name: "terminal",
    security_risk: "UNKNOWN",
    ...overrides,
  }) as unknown as OpenHandsEvent;

const observation = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "o1",
    timestamp: "2026-01-01T00:02:00Z",
    source: "environment",
    kind: "ObservationEvent",
    tool_name: "terminal",
    action_id: "a1",
    observation: { kind: "TerminalObservation", is_error: false, exit_code: 0 },
    ...overrides,
  }) as unknown as OpenHandsEvent;

describe("toFeedUpdates details", () => {
  it("attaches reasoning, summary and the paired outcome to an action", () => {
    const [update] = toFeedUpdates([
      action({
        summary: "Run the tests",
        reasoning_content: "Tests first.",
        security_risk: "LOW",
      }),
      observation({
        observation: {
          kind: "TerminalObservation",
          is_error: true,
          exit_code: 2,
        },
      }),
    ]).filter((u) => u.kind === "action");

    expect(update.text).toBe("Run the tests");
    expect(update.details).toEqual({
      reasoning: "Tests first.",
      redacted: false,
      thought: undefined,
      risk: "LOW",
      outcome: { isError: true, exitCode: 2 },
    });
  });

  it("flags reasoning the provider redacted and falls back to the tool name", () => {
    const [update] = toFeedUpdates([
      action({ thinking_blocks: [{ type: "redacted_thinking", data: "x" }] }),
    ]);

    expect(update.text).toBe("terminal");
    expect(update.details).toMatchObject({ redacted: true });
    expect(update.details?.reasoning).toBeUndefined();
  });

  it("leaves details off an action with nothing to show", () => {
    const [update] = toFeedUpdates([action()]);
    expect(update.details).toBeUndefined();
  });
});

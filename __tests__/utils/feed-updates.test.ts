import { describe, expect, it } from "vitest";
import {
  getMessageDetails,
  getTurnContext,
  resultText,
  toFeedUpdates,
} from "#/utils/feed-updates";
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
    expect(update.details).toMatchObject({
      reasoning: "Tests first.",
      redacted: false,
      risk: "LOW",
      outcome: { isError: true, exitCode: 2 },
      durationMs: 60_000,
      eventId: "a1",
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

describe("getMessageDetails", () => {
  it("reports reasoning, the skills a message loaded and its event id", () => {
    const details = getMessageDetails({
      id: "m1",
      llm_message: {
        role: "assistant",
        content: [],
        reasoning_content: "Why.",
      },
      activated_skills: ["git"],
    } as unknown as Parameters<typeof getMessageDetails>[0]);

    expect(details).toMatchObject({
      reasoning: "Why.",
      skills: ["git"],
      eventId: "m1",
    });
  });
});

describe("resultText", () => {
  it("returns what a tool printed so a conclusion can be traced to it", () => {
    const text = resultText(
      observation({
        observation: {
          kind: "FileEditorObservation",
          content: [{ type: "text", text: "- [x] CARD-1 (S)" }],
        },
      }),
    );
    expect(text).toBe("- [x] CARD-1 (S)");
  });

  it("is empty for an event that is not an observation", () => {
    expect(resultText(action())).toBeUndefined();
  });
});

const stats = (id: string, prompt: number, completion: number, cost = 0) =>
  ({
    id,
    timestamp: "2026-01-01T00:00:00Z",
    source: "environment",
    kind: "ConversationStateUpdateEvent",
    key: "stats",
    value: {
      usage_to_metrics: {
        default: {
          model_name: "m",
          accumulated_cost: cost,
          max_budget_per_task: null,
          accumulated_token_usage: {
            model: "m",
            prompt_tokens: prompt,
            completion_tokens: completion,
            cache_read_tokens: 0,
            cache_write_tokens: 0,
            reasoning_tokens: 0,
            context_window: 0,
            per_turn_token: prompt - 0,
            response_id: "",
          },
        },
      },
    },
  }) as unknown as OpenHandsEvent;

describe("step context", () => {
  it("reports arguments, subagent, hooks and the call's own token usage", () => {
    const [update] = toFeedUpdates([
      stats("s1", 100, 10, 0.5),
      action({ id: "a0", llm_response_id: "r0" }),
      observation({ id: "o0", action_id: "a0" }),
      stats("s2", 250, 30, 0.75),
      action({
        llm_response_id: "r1",
        action: {
          kind: "TaskAction",
          prompt: "Audit the repo",
          subagent_type: "explore",
          description: "Audit",
          resume: null,
        },
      }),
      {
        id: "h1",
        kind: "HookExecutionEvent",
        source: "hook",
        timestamp: "2026-01-01T00:01:30Z",
        hook_event_type: "PreToolUse",
        action_id: "a1",
        blocked: false,
        success: true,
        exit_code: 0,
        reason: null,
        tool_name: "task",
      },
      observation({
        observation: { kind: "TaskObservation", status: "completed" },
      }),
    ] as OpenHandsEvent[]).filter((u) => u.id === "a1");

    expect(update.details).toMatchObject({
      args: [{ key: "prompt", value: "Audit the repo" }],
      subagent: { type: "explore", description: "Audit", status: "completed" },
      hooks: [{ type: "PreToolUse", blocked: false, exitCode: 0 }],
      usage: {
        model: "m",
        promptTokens: 150,
        completionTokens: 20,
        cost: 0.25,
      },
    });
  });
});

describe("getTurnContext", () => {
  const message = (id: string, source: string, text: string) =>
    ({
      id,
      source,
      kind: "MessageEvent",
      timestamp: "2026-01-01T00:00:00Z",
      llm_message: {
        role: source === "agent" ? "assistant" : "user",
        content: [{ type: "text", text }],
      },
    }) as unknown as OpenHandsEvent;

  it("collects the nudge, condensations and hooks since the last user message", () => {
    const context = getTurnContext(
      [
        message("u0", "user", "earlier"),
        {
          id: "c0",
          kind: "Condensation",
          forgotten_event_ids: ["x"],
          summary: "old",
        } as unknown as OpenHandsEvent,
        message("u1", "user", "go"),
        {
          id: "c1",
          kind: "Condensation",
          forgotten_event_ids: ["a", "b"],
          summary: "short",
        } as unknown as OpenHandsEvent,
        message(
          "n1",
          "environment",
          "Your last response did not include a function call or a message. Try again.",
        ),
        message("m1", "agent", "done"),
      ],
      "m1",
    );

    expect(context.promptedBy).toContain("did not include a function call");
    expect(context.condensations).toEqual([{ dropped: 2, summary: "short" }]);
  });
});

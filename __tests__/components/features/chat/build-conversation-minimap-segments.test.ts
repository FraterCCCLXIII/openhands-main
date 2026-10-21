import { describe, expect, it } from "vitest";
import { buildConversationMinimapSegments } from "#/components/features/chat/conversation-minimap/build-conversation-minimap-segments";
import type { OpenHandsEvent } from "#/types/agent-server/core";

function userMessage(id: string, text: string): OpenHandsEvent {
  return {
    id,
    timestamp: "2026-08-20T10:00:00.000Z",
    source: "user",
    llm_message: {
      role: "user",
      content: [{ type: "text", text }],
    },
  } as OpenHandsEvent;
}

function assistantMessage(id: string, text: string): OpenHandsEvent {
  return {
    id,
    timestamp: "2026-08-20T10:00:01.000Z",
    source: "agent",
    llm_message: {
      role: "assistant",
      content: [{ type: "text", text }],
    },
  } as OpenHandsEvent;
}

describe("buildConversationMinimapSegments", () => {
  it("creates one segment per user turn with accumulated agent response length", () => {
    const segments = buildConversationMinimapSegments([
      userMessage("u1", "Fix the flaky test"),
      assistantMessage("a1", "I'll inspect the CI logs and patch the test."),
      userMessage("u2", "Also update the docs"),
      assistantMessage("a2", "Done."),
    ]);

    expect(segments).toHaveLength(2);
    expect(segments[0]?.userEventId).toBe("u1");
    expect(segments[0]?.userPreview).toBe("Fix the flaky test");
    expect(segments[0]?.agentResponseLength).toBeGreaterThan(
      segments[1]?.agentResponseLength ?? 0,
    );
    expect(segments[1]?.userPreview).toBe("Also update the docs");
  });

  it("skips hidden goal-loop reprompt user messages", () => {
    const segments = buildConversationMinimapSegments([
      userMessage("u1", "Real user prompt"),
      assistantMessage("a1", "Working on it"),
      userMessage(
        "u-hidden",
        "The goal is NOT yet complete (audit iteration 2). Keep going.",
      ),
    ]);

    expect(segments).toHaveLength(1);
    expect(segments[0]?.userEventId).toBe("u1");
  });
});

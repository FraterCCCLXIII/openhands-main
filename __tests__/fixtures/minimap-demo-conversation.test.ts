import { describe, expect, it } from "vitest";
import {
  MINIMAP_DEMO_CONVERSATION_ID,
  MINIMAP_DEMO_EVENTS,
  MINIMAP_DEMO_TURN_COUNT,
  getMinimapDemoSegmentCount,
} from "#/fixtures/minimap-demo-conversation";
import { buildConversationMinimapSegments } from "#/components/features/chat/conversation-minimap/build-conversation-minimap-segments";

describe("minimap demo conversation fixture", () => {
  it("defines more than fifty user/agent turn pairs", () => {
    expect(MINIMAP_DEMO_TURN_COUNT).toBeGreaterThan(50);
    expect(MINIMAP_DEMO_EVENTS).toHaveLength(MINIMAP_DEMO_TURN_COUNT * 2);
  });

  it("builds one minimap segment per user turn with varied agent weights", () => {
    const segments = buildConversationMinimapSegments(MINIMAP_DEMO_EVENTS);

    expect(segments).toHaveLength(MINIMAP_DEMO_TURN_COUNT);
    expect(getMinimapDemoSegmentCount()).toBe(MINIMAP_DEMO_TURN_COUNT);
    expect(segments[0]?.userPreview).toContain("Turn 1:");
    expect(segments.at(-1)?.userPreview).toContain(
      `Turn ${MINIMAP_DEMO_TURN_COUNT}:`,
    );

    const lengths = segments.map((segment) => segment.agentResponseLength);
    expect(new Set(lengths).size).toBeGreaterThan(5);
  });

  it("uses a stable conversation id for mock navigation", () => {
    expect(MINIMAP_DEMO_CONVERSATION_ID).toBe("minimap-demo");
  });
});

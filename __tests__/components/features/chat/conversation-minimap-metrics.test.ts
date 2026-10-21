import { describe, expect, it } from "vitest";
import {
  CONVERSATION_MINIMAP_MAX_BAR_WIDTH_PX,
  CONVERSATION_MINIMAP_MIN_BAR_WIDTH_PX,
  CONVERSATION_MINIMAP_TRACK_WIDTH_PX,
  CONVERSATION_MINIMAP_BAR_HORIZONTAL_INSET_PX,
  agentResponseLengthToMinimapBarWidthPx,
  minimapBarHoverWidthPx,
} from "#/components/features/chat/conversation-minimap/conversation-minimap-metrics";

describe("agentResponseLengthToMinimapBarWidthPx", () => {
  it("returns the minimum width when the agent produced nothing", () => {
    expect(agentResponseLengthToMinimapBarWidthPx(0)).toBe(
      CONVERSATION_MINIMAP_MIN_BAR_WIDTH_PX,
    );
  });

  it("scales wider bars for longer agent replies", () => {
    const short = agentResponseLengthToMinimapBarWidthPx(80);
    const long = agentResponseLengthToMinimapBarWidthPx(4_000);
    expect(long).toBeGreaterThan(short);
    expect(long).toBeLessThanOrEqual(CONVERSATION_MINIMAP_MAX_BAR_WIDTH_PX);
  });
});

describe("minimapBarHoverWidthPx", () => {
  it("never exceeds the usable track width", () => {
    const maxUsable =
      CONVERSATION_MINIMAP_TRACK_WIDTH_PX -
      CONVERSATION_MINIMAP_BAR_HORIZONTAL_INSET_PX;

    expect(minimapBarHoverWidthPx(CONVERSATION_MINIMAP_MAX_BAR_WIDTH_PX)).toBe(
      maxUsable,
    );
    expect(minimapBarHoverWidthPx(12)).toBeLessThanOrEqual(maxUsable);
  });

  it("widens shorter bars on hover without overflowing the track", () => {
    expect(minimapBarHoverWidthPx(12)).toBeGreaterThan(12);
  });
});

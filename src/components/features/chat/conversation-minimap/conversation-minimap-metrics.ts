/** Horizontal track width; bars grow leftward from the right edge. */
export const CONVERSATION_MINIMAP_TRACK_WIDTH_PX = 28;
export const CONVERSATION_MINIMAP_MIN_BAR_WIDTH_PX = 6;
export const CONVERSATION_MINIMAP_MAX_BAR_WIDTH_PX = 24;
export const CONVERSATION_MINIMAP_BAR_HEIGHT_PX = 2;
export const CONVERSATION_MINIMAP_BAR_HOVER_HEIGHT_PX = 3;
/** Hover/active width multiplier; capped so bars stay inside the track. */
export const CONVERSATION_MINIMAP_BAR_HOVER_SCALE = 1.15;
/** Horizontal padding inside each bar button (`px-[2px]` × 2). */
export const CONVERSATION_MINIMAP_BAR_HORIZONTAL_INSET_PX = 4;

const MIN_RESPONSE_CHARS = 24;
/** Log-scale ceiling so very long agent turns still fit the track. */
const MAX_RESPONSE_CHARS = 12_000;

/** Map agent response character count → horizontal bar width (log-scaled). */
export function agentResponseLengthToMinimapBarWidthPx(
  agentResponseLength: number,
): number {
  if (agentResponseLength <= 0) {
    return CONVERSATION_MINIMAP_MIN_BAR_WIDTH_PX;
  }

  const clamped = Math.min(
    MAX_RESPONSE_CHARS,
    Math.max(MIN_RESPONSE_CHARS, agentResponseLength),
  );
  const t =
    Math.log(clamped / MIN_RESPONSE_CHARS) /
    Math.log(MAX_RESPONSE_CHARS / MIN_RESPONSE_CHARS);

  return Math.round(
    CONVERSATION_MINIMAP_MIN_BAR_WIDTH_PX +
      t *
        (CONVERSATION_MINIMAP_MAX_BAR_WIDTH_PX -
          CONVERSATION_MINIMAP_MIN_BAR_WIDTH_PX),
  );
}

/** Width on hover/focus/active, clamped to the usable track interior. */
export function minimapBarHoverWidthPx(barWidthPx: number): number {
  const maxUsableWidthPx =
    CONVERSATION_MINIMAP_TRACK_WIDTH_PX -
    CONVERSATION_MINIMAP_BAR_HORIZONTAL_INSET_PX;

  return Math.min(
    maxUsableWidthPx,
    Math.round(barWidthPx * CONVERSATION_MINIMAP_BAR_HOVER_SCALE),
  );
}

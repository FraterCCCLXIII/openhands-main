/** How far (radians) the hand turns toward the pointer at the window edge. */
const FOLLOW_MAX_YAW = 0.7;
const FOLLOW_MAX_PITCH = 0.45;
const MAX_PITCH = 0.9;
const DRAG_RADIANS_PER_PIXEL = 0.012;
const KEY_STEP = 0.3;

export interface HandView {
  yaw: number;
  pitch: number;
}

export const FRONT_VIEW: HandView = { yaw: 0, pitch: 0 };

const clamp = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value));

/** The turn that makes the hand look at a pointer, from its offset to the hand's centre. */
export function getFollowView(
  offsetX: number,
  offsetY: number,
  halfWidth: number,
  halfHeight: number,
): HandView {
  return {
    yaw: clamp(offsetX / Math.max(1, halfWidth), 1) * FOLLOW_MAX_YAW,
    pitch: clamp(offsetY / Math.max(1, halfHeight), 1) * FOLLOW_MAX_PITCH,
  };
}

/** Dragging right spins the front to the right; dragging down tips the head down. */
export function getDragView(
  start: HandView,
  deltaX: number,
  deltaY: number,
): HandView {
  return {
    yaw: start.yaw + deltaX * DRAG_RADIANS_PER_PIXEL,
    pitch: clamp(start.pitch + deltaY * DRAG_RADIANS_PER_PIXEL, MAX_PITCH),
  };
}

/** Arrow keys turn the hand, Home faces it forward; other keys return null. */
export function getKeyView(view: HandView, key: string): HandView | null {
  switch (key) {
    case "ArrowLeft":
      return { ...view, yaw: view.yaw - KEY_STEP };
    case "ArrowRight":
      return { ...view, yaw: view.yaw + KEY_STEP };
    case "ArrowUp":
      return { ...view, pitch: clamp(view.pitch - KEY_STEP, MAX_PITCH) };
    case "ArrowDown":
      return { ...view, pitch: clamp(view.pitch + KEY_STEP, MAX_PITCH) };
    case "Home":
      return FRONT_VIEW;
    default:
      return null;
  }
}

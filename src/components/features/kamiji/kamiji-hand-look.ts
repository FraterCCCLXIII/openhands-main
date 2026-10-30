import type { KamijiPropName } from "./kamiji-catalog";
import {
  DEFAULT_KAMIJI_COLOR,
  KAMIJI_COLOR_PRESETS,
  type KamijiAnimation,
  type KamijiExpression,
  type KamijiPose,
} from "./kamiji-expressions";
import { KAMIJI_SHAPES, type KamijiShape } from "./kamiji-shape";

/** Everything a user can customise about their own Hand avatar. */
export interface KamijiHandLook {
  /** Skin colour as `#rrggbb`. */
  color: string;
  expression: KamijiExpression;
  /** The hand's mouth is hidden by default; this brings it back. */
  mouth: boolean;
  shape: KamijiShape;
  /** Looping clip; ignored while `pose` is set. */
  animation: KamijiAnimation;
  /** Static finger pose; replaces the clip while set. */
  pose: KamijiPose | null;
  /** A 3D prop worn on the hand, if any. */
  accessory: KamijiPropName | null;
  /** Toon outline around the silhouette. */
  outline: boolean;
}

export const KAMIJI_HAND_EXPRESSIONS: readonly KamijiExpression[] = [
  "neutral",
  "happy",
  "excited",
  "thinking",
  "sad",
  "angry",
  "surprised",
  "sleepy",
];

export const KAMIJI_HAND_ANIMATIONS: readonly KamijiAnimation[] = [
  "Idle",
  "Wave",
  "Hello",
  "Think",
  "Celebrate",
];

export const KAMIJI_HAND_POSES: readonly KamijiPose[] = [
  "open",
  "peace",
  "point",
  "thumbsUp",
  "fist",
];

export const KAMIJI_HAND_ACCESSORIES: readonly KamijiPropName[] = [
  "heart",
  "star",
  "sparkle",
  "lightbulb",
  "fire",
  "branch",
  "pull_request",
  "merge",
];

export const KAMIJI_HAND_COLOR_PRESETS = KAMIJI_COLOR_PRESETS;

export const DEFAULT_KAMIJI_HAND_LOOK: KamijiHandLook = {
  color: DEFAULT_KAMIJI_COLOR,
  expression: "happy",
  mouth: false,
  shape: "hand",
  animation: "Idle",
  pose: null,
  accessory: null,
  outline: false,
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isKamijiHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/**
 * Turns anything read from storage (older versions, hand-edited or corrupt
 * values) into a valid look: unknown fields are dropped and invalid ones fall
 * back to the default, so a bad blob can never break rendering.
 */
export function sanitizeKamijiHandLook(raw: unknown): KamijiHandLook {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const defaults = DEFAULT_KAMIJI_HAND_LOOK;
  return {
    color: isKamijiHexColor(source.color)
      ? source.color.toLowerCase()
      : defaults.color,
    expression: oneOf(
      source.expression,
      KAMIJI_HAND_EXPRESSIONS,
      defaults.expression,
    ),
    mouth: typeof source.mouth === "boolean" ? source.mouth : defaults.mouth,
    shape: oneOf(source.shape, KAMIJI_SHAPES, defaults.shape),
    animation: oneOf(
      source.animation,
      KAMIJI_HAND_ANIMATIONS,
      defaults.animation,
    ),
    pose: KAMIJI_HAND_POSES.includes(source.pose as KamijiPose)
      ? (source.pose as KamijiPose)
      : null,
    accessory: KAMIJI_HAND_ACCESSORIES.includes(
      source.accessory as KamijiPropName,
    )
      ? (source.accessory as KamijiPropName)
      : null,
    outline:
      typeof source.outline === "boolean" ? source.outline : defaults.outline,
  };
}

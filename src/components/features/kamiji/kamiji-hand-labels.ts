import { I18nKey } from "#/i18n/declaration";
import type { KamijiPropName } from "./kamiji-catalog";
import type {
  KamijiAnimation,
  KamijiExpression,
  KamijiPose,
} from "./kamiji-expressions";
import type { KamijiShape } from "./kamiji-shape";

export const EXPRESSION_LABELS: Record<KamijiExpression, I18nKey> = {
  neutral: I18nKey.KAMIJI$EXPRESSION_NEUTRAL,
  happy: I18nKey.KAMIJI$EXPRESSION_HAPPY,
  excited: I18nKey.KAMIJI$EXPRESSION_EXCITED,
  thinking: I18nKey.KAMIJI$EXPRESSION_THINKING,
  sad: I18nKey.KAMIJI$EXPRESSION_SAD,
  angry: I18nKey.KAMIJI$EXPRESSION_ANGRY,
  surprised: I18nKey.KAMIJI$EXPRESSION_SURPRISED,
  sleepy: I18nKey.KAMIJI$EXPRESSION_SLEEPY,
};

export const SHAPE_LABELS: Record<KamijiShape, I18nKey> = {
  hand: I18nKey.KAMIJI$SHAPE_HAND,
  sphere: I18nKey.KAMIJI$SHAPE_SPHERE,
  cube: I18nKey.KAMIJI$SHAPE_CUBE,
};

/** Only the clips the editor offers; the rest of `KamijiAnimation` has no label. */
export const ANIMATION_LABELS: Partial<Record<KamijiAnimation, I18nKey>> = {
  Idle: I18nKey.KAMIJI$ANIMATION_IDLE,
  Wave: I18nKey.KAMIJI$ANIMATION_WAVE,
  Hello: I18nKey.KAMIJI$ANIMATION_HELLO,
  Think: I18nKey.KAMIJI$ANIMATION_THINK,
  Celebrate: I18nKey.KAMIJI$ANIMATION_CELEBRATE,
};

export const POSE_LABELS: Partial<Record<KamijiPose, I18nKey>> = {
  open: I18nKey.KAMIJI$POSE_OPEN,
  peace: I18nKey.KAMIJI$POSE_PEACE,
  point: I18nKey.KAMIJI$POSE_POINT,
  thumbsUp: I18nKey.KAMIJI$POSE_THUMBS_UP,
  fist: I18nKey.KAMIJI$POSE_FIST,
};

export const ACCESSORY_LABELS: Partial<Record<KamijiPropName, I18nKey>> = {
  heart: I18nKey.KAMIJI$ACCESSORY_HEART,
  star: I18nKey.KAMIJI$ACCESSORY_STAR,
  sparkle: I18nKey.KAMIJI$ACCESSORY_SPARKLE,
  lightbulb: I18nKey.KAMIJI$ACCESSORY_LIGHTBULB,
  fire: I18nKey.KAMIJI$ACCESSORY_FIRE,
  branch: I18nKey.KAMIJI$ACCESSORY_BRANCH,
  pull_request: I18nKey.KAMIJI$ACCESSORY_PULL_REQUEST,
  merge: I18nKey.KAMIJI$ACCESSORY_MERGE,
};

/** Preset swatch hex to its colour-name key (the first presets reuse COLOR$ keys). */
export const COLOR_LABELS: Record<string, I18nKey> = {
  Yellow: I18nKey.COLOR$YELLOW,
  Orange: I18nKey.COLOR$ORANGE,
  Coral: I18nKey.COLOR$CORAL,
  Pink: I18nKey.COLOR$PINK,
  Purple: I18nKey.COLOR$VIOLET,
  Blue: I18nKey.COLOR$BLUE,
  Teal: I18nKey.COLOR$TEAL,
  Green: I18nKey.COLOR$GREEN,
};

/** Decorative glyph shown before each accessory name; not translated. */
export const ACCESSORY_EMOJI: Partial<Record<KamijiPropName, string>> = {
  heart: "❤️",
  star: "⭐",
  sparkle: "✨",
  lightbulb: "💡",
  fire: "🔥",
  branch: "🌿",
  pull_request: "🔀",
  merge: "🔗",
};

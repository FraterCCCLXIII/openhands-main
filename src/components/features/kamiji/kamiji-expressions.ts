// Face morph targets and animation clips baked into src/assets/kamiji/kamiji.glb.
// "Left"/"Right" are screen-left/screen-right.

export type KamijiExpression =
  | "neutral"
  | "happy"
  | "excited"
  | "thinking"
  | "sad"
  | "angry"
  | "surprised"
  | "sleepy";

export type KamijiAnimation =
  | "Idle"
  | "Wave"
  | "Think"
  | "Celebrate"
  | "Spin"
  | "Bounce"
  | "TurnPoint"
  | "Hello"
  | "Typing";

export type KamijiMorph =
  | "eyeBlinkLeft"
  | "eyeBlinkRight"
  | "eyeWideLeft"
  | "eyeWideRight"
  | "eyeLookLeft"
  | "eyeLookRight"
  | "eyeLookUp"
  | "eyeLookDown"
  | "browUpLeft"
  | "browUpRight"
  | "browDownLeft"
  | "browDownRight"
  | "browAngryLeft"
  | "browAngryRight"
  | "browSadLeft"
  | "browSadRight"
  | "mouthSmile"
  | "mouthFrown"
  | "mouthOpen"
  | "mouthO";

export type KamijiMorphWeights = Partial<Record<KamijiMorph, number>>;

export const KAMIJI_EXPRESSIONS: Record<KamijiExpression, KamijiMorphWeights> =
  {
    neutral: {},
    happy: { mouthSmile: 1, browUpLeft: 0.3, browUpRight: 0.3 },
    excited: {
      mouthSmile: 1,
      mouthOpen: 0.7,
      eyeWideLeft: 0.6,
      eyeWideRight: 0.6,
      browUpLeft: 1,
      browUpRight: 1,
    },
    thinking: {
      browUpLeft: 1,
      browDownRight: 0.5,
      eyeLookUp: 0.8,
      eyeLookLeft: 0.5,
      mouthFrown: 0.2,
    },
    sad: {
      mouthFrown: 1,
      browSadLeft: 1,
      browSadRight: 1,
      eyeLookDown: 0.5,
    },
    angry: {
      mouthFrown: 0.7,
      browAngryLeft: 1,
      browAngryRight: 1,
    },
    surprised: {
      mouthO: 1,
      eyeWideLeft: 1,
      eyeWideRight: 1,
      browUpLeft: 1,
      browUpRight: 1,
    },
    sleepy: {
      eyeBlinkLeft: 0.8,
      eyeBlinkRight: 0.8,
      browDownLeft: 0.3,
      browDownRight: 0.3,
      mouthFrown: 0.15,
    },
  };

/** Mouth and tongue are hidden for now; flip to bring them back. */
export const KAMIJI_SHOW_MOUTH = false;

/** Eye glints (the white dots) are hidden for now. */
export const KAMIJI_SHOW_GLINTS = false;

/** Eyebrows are hidden for now. */
export const KAMIJI_SHOW_BROWS = false;

export const DEFAULT_KAMIJI_COLOR = "#ffd23f";

export const KAMIJI_COLOR_PRESETS: readonly {
  name: string;
  color: string;
}[] = [
  { name: "Yellow", color: DEFAULT_KAMIJI_COLOR },
  { name: "Orange", color: "#ff9f43" },
  { name: "Coral", color: "#ff6b6b" },
  { name: "Pink", color: "#ff8fc7" },
  { name: "Purple", color: "#a77bff" },
  { name: "Blue", color: "#4f9dff" },
  { name: "Teal", color: "#2ec4b6" },
  { name: "Green", color: "#6bd66b" },
];

const HUE_DEGREES = 360;
const HASH_MULTIPLIER = 31;

/** Deterministic, readable hand colour for an agent id or name. */
export function getKamijiColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * HASH_MULTIPLIER + seed.charCodeAt(i)) >>> 0;
  }
  return `hsl(${hash % HUE_DEGREES}, 70%, 55%)`;
}

/** Static hand shapes; KamijiAvatar tweens finger bones between them. */
export type KamijiPose =
  | "open"
  | "fist"
  | "point"
  | "peace"
  | "thumbsUp"
  | "rock"
  | "three"
  | "one"
  | "two"
  | "four"
  | "five";

/** Counting 1 to 5 with a raised hand, thumb tucked until five. */
export const KAMIJI_COUNT_POSES: readonly KamijiPose[] = [
  "one",
  "two",
  "three",
  "four",
  "five",
];

export const KAMIJI_POSES: readonly KamijiPose[] = [
  "open",
  "peace",
  "point",
  "three",
  "rock",
  "thumbsUp",
  "fist",
];

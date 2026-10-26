import type { KamijiExpression } from "./kamiji-expressions";

/** The face textures baked into every Kamikin mochi GLB. */
export const KAMIJI_MOCHI_FACE_STATES = [
  "neutral",
  "blink",
  "happy",
  "joy",
  "surprised",
  "sad",
] as const;

export type KamijiMochiFaceState = (typeof KAMIJI_MOCHI_FACE_STATES)[number];

/** Animation clips baked into every Kamikin mochi GLB. */
export const KAMIJI_MOCHI_CLIPS = [
  "idle",
  "walk",
  "run",
  "hop",
  "happy",
  "wave",
  "sad",
  "sit",
  "dance",
] as const;

export type KamijiMochiClip = (typeof KAMIJI_MOCHI_CLIPS)[number];

/**
 * Kamiji's 8 hand expressions onto the mochi's 6 face states. Mochi have no
 * thinking, angry or sleepy face, so those take the closest read: thinking is
 * a calm neutral, angry is the sad face, and sleepy is closed eyes.
 */
const FACE_FOR_EXPRESSION: Record<KamijiExpression, KamijiMochiFaceState> = {
  neutral: "neutral",
  happy: "happy",
  excited: "joy",
  thinking: "neutral",
  sad: "sad",
  angry: "sad",
  surprised: "surprised",
  sleepy: "blink",
};

export function getMochiFaceState(
  expression: KamijiExpression,
): KamijiMochiFaceState {
  return FACE_FOR_EXPRESSION[expression] ?? "neutral";
}

export function isMochiClip(name: string): name is KamijiMochiClip {
  return (KAMIJI_MOCHI_CLIPS as readonly string[]).includes(name);
}

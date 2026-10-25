import { KamijiPose } from "./kamiji-expressions";

export type KamijiFinger = "Thumb" | "Index" | "Middle" | "Ring" | "Pinky";

export const KAMIJI_FINGERS: readonly KamijiFinger[] = [
  "Thumb",
  "Index",
  "Middle",
  "Ring",
  "Pinky",
];

const SEGMENTS = [1, 2, 3] as const;

export type KamijiBoneName = `${KamijiFinger}_${1 | 2 | 3}`;

/** Curl in degrees per finger bone; 0 is straight, positive curls toward the front. */
export type KamijiCurls = Record<KamijiBoneName, number>;

export const KAMIJI_BONES: readonly KamijiBoneName[] = KAMIJI_FINGERS.flatMap(
  (finger) =>
    SEGMENTS.map((segment) => `${finger}_${segment}` as KamijiBoneName),
);

type FingerCurl = readonly [number, number, number];

const STRAIGHT: FingerCurl = [0, 0, 0];
// Closed fingers rest on top of the palm and stop above the eyes (the face sits
// mid-palm), so index/middle curl deeper than the shorter ring and pinky.
const CURLED_LONG: FingerCurl = [50, 70, 50];
const CURLED_RING: FingerCurl = [50, 45, 45];
const CURLED_PINKY: FingerCurl = [50, 40, 35];
const THUMB_TUCKED: FingerCurl = [45, 40, 25];
const THUMB_UP: FingerCurl = [0, 0, 0];

type PoseFingers = Record<KamijiFinger, FingerCurl>;

const POSE_FINGERS: Record<KamijiPose, PoseFingers> = {
  open: {
    Thumb: STRAIGHT,
    Index: STRAIGHT,
    Middle: STRAIGHT,
    Ring: STRAIGHT,
    Pinky: STRAIGHT,
  },
  fist: {
    Thumb: THUMB_TUCKED,
    Index: CURLED_LONG,
    Middle: CURLED_LONG,
    Ring: CURLED_RING,
    Pinky: CURLED_PINKY,
  },
  point: {
    Thumb: THUMB_TUCKED,
    Index: STRAIGHT,
    Middle: CURLED_LONG,
    Ring: CURLED_RING,
    Pinky: CURLED_PINKY,
  },
  peace: {
    Thumb: THUMB_TUCKED,
    Index: STRAIGHT,
    Middle: STRAIGHT,
    Ring: CURLED_RING,
    Pinky: CURLED_PINKY,
  },
  thumbsUp: {
    Thumb: THUMB_UP,
    Index: CURLED_LONG,
    Middle: CURLED_LONG,
    Ring: CURLED_RING,
    Pinky: CURLED_PINKY,
  },
  rock: {
    Thumb: THUMB_TUCKED,
    Index: STRAIGHT,
    Middle: CURLED_LONG,
    Ring: CURLED_RING,
    Pinky: STRAIGHT,
  },
  three: {
    Thumb: THUMB_TUCKED,
    Index: STRAIGHT,
    Middle: STRAIGHT,
    Ring: STRAIGHT,
    Pinky: CURLED_PINKY,
  },
  one: {
    Thumb: THUMB_TUCKED,
    Index: STRAIGHT,
    Middle: CURLED_LONG,
    Ring: CURLED_RING,
    Pinky: CURLED_PINKY,
  },
  two: {
    Thumb: THUMB_TUCKED,
    Index: STRAIGHT,
    Middle: STRAIGHT,
    Ring: CURLED_RING,
    Pinky: CURLED_PINKY,
  },
  four: {
    Thumb: THUMB_TUCKED,
    Index: STRAIGHT,
    Middle: STRAIGHT,
    Ring: STRAIGHT,
    Pinky: STRAIGHT,
  },
  five: {
    Thumb: STRAIGHT,
    Index: STRAIGHT,
    Middle: STRAIGHT,
    Ring: STRAIGHT,
    Pinky: STRAIGHT,
  },
};

function toCurls(fingers: PoseFingers): KamijiCurls {
  const curls = {} as KamijiCurls;
  KAMIJI_FINGERS.forEach((finger) => {
    SEGMENTS.forEach((segment, i) => {
      curls[`${finger}_${segment}`] = fingers[finger][i];
    });
  });
  return curls;
}

export function getPoseCurls(pose: KamijiPose): KamijiCurls {
  return toCurls(POSE_FINGERS[pose]);
}

export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

export interface PoseTween {
  from: KamijiCurls;
  to: KamijiCurls;
  elapsedMs: number;
  durationMs: number;
}

/** Start a tween from the curls currently shown; mid-tween callers pass the interpolated curls. */
export function startPoseTween(
  from: KamijiCurls,
  to: KamijiCurls,
  durationMs: number,
): PoseTween {
  return { from: { ...from }, to: { ...to }, elapsedMs: 0, durationMs };
}

export function stepPoseTween(
  tween: PoseTween,
  deltaMs: number,
): { curls: KamijiCurls; done: boolean } {
  const elapsedMs = Math.min(tween.durationMs, tween.elapsedMs + deltaMs);
  // eslint-disable-next-line no-param-reassign -- tween state is advanced in place
  tween.elapsedMs = elapsedMs;
  const progress =
    tween.durationMs <= 0 ? 1 : easeInOutCubic(elapsedMs / tween.durationMs);
  const curls = {} as KamijiCurls;
  KAMIJI_BONES.forEach((bone) => {
    curls[bone] =
      tween.from[bone] + (tween.to[bone] - tween.from[bone]) * progress;
  });
  return { curls, done: elapsedMs >= tween.durationMs };
}

const KNUCKLE_LIFT = 0.25;
const FULL_LIFT_CURL_DEG = 60;

/**
 * How far a finger's first bone moves toward the palm front for a given
 * knuckle curl. The bones pivot at the palm mid-plane, so without this lift a
 * curling finger sweeps through the palm surface and gets sliced.
 */
export function getKnuckleLift(curlDegrees: number): number {
  return KNUCKLE_LIFT * Math.min(1, Math.abs(curlDegrees) / FULL_LIFT_CURL_DEG);
}

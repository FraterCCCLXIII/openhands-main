import { KamijiAnimation, KamijiPose } from "./kamiji-expressions";

/** Whole-hand motions layered on top of a baked clip; they move the hand as a rigid body. */
export type KamijiMotion = "Spin" | "Bounce" | "TurnPoint" | "Hello" | "Typing";

export interface MotionTransform {
  rotX: number;
  rotY: number;
  rotZ: number;
  posY: number;
  scaleX: number;
  scaleY: number;
}

export const IDENTITY_MOTION: MotionTransform = {
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  posY: 0,
  scaleX: 1,
  scaleY: 1,
};

/** Baked clip that animates the fingers underneath each motion. */
export const MOTION_BASE_CLIP: Record<KamijiMotion, KamijiAnimation> = {
  Spin: "Idle",
  Bounce: "Idle",
  TurnPoint: "Idle",
  Hello: "Wave",
  Typing: "Think",
};

/** Playback speed of the base clip while a motion runs (default 1). */
export const MOTION_CLIP_SPEED: Partial<Record<KamijiMotion, number>> = {
  Typing: 2.6,
};

/** Pose used while a motion plays and the caller has not chosen one. */
export const MOTION_DEFAULT_POSE: Partial<Record<KamijiMotion, KamijiPose>> = {
  TurnPoint: "point",
};

export function isKamijiMotion(
  animation: KamijiAnimation,
): animation is KamijiMotion {
  return animation in MOTION_BASE_CLIP;
}

const TAU = Math.PI * 2;
const SPIN_PERIOD = 2.2;
const SPIN_ACTIVE = 0.75;
const SPIN_HOP = 0.08;
const BOUNCE_PERIOD = 0.8;
const BOUNCE_HEIGHT = 0.2;
const BOUNCE_SQUASH = 0.18;
const POINT_PERIOD = 3.2;
const POINT_TURN = 0.55;
const POINT_HOLD_END = 2.35;
const POINT_ANGLE = -Math.PI / 2;
const POINT_BOB = 0.05;
const HELLO_PERIOD = 1.1;
const HELLO_YAW = 0.6;
const HELLO_ROLL = 0.12;
const TYPING_TILT = (50 * Math.PI) / 180;
const TYPING_BOB = 0.012;
const TYPING_BOB_SPEED = 14;

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Rigid transform of the hand at time `t` (seconds) into the motion. */
export function evaluateMotion(
  motion: KamijiMotion,
  t: number,
): MotionTransform {
  switch (motion) {
    case "Spin": {
      const u = (t % SPIN_PERIOD) / SPIN_PERIOD;
      const k = clamp01(u / SPIN_ACTIVE);
      return {
        ...IDENTITY_MOTION,
        rotY: easeInOutCubic(k) * TAU,
        posY: SPIN_HOP * Math.sin(Math.PI * k),
      };
    }
    case "Bounce": {
      const lift = Math.abs(Math.sin((Math.PI * t) / BOUNCE_PERIOD));
      const grounded = (1 - lift) ** 3;
      return {
        ...IDENTITY_MOTION,
        posY: BOUNCE_HEIGHT * lift,
        scaleY: 1 - BOUNCE_SQUASH * grounded,
        scaleX: 1 + BOUNCE_SQUASH * 0.65 * grounded,
      };
    }
    case "TurnPoint": {
      const s = t % POINT_PERIOD;
      let turn: number;
      if (s < POINT_TURN) turn = easeInOutCubic(s / POINT_TURN);
      else if (s < POINT_HOLD_END) turn = 1;
      else
        turn = 1 - easeInOutCubic(clamp01((s - POINT_HOLD_END) / POINT_TURN));
      const holding = s >= POINT_TURN && s < POINT_HOLD_END ? 1 : 0;
      return {
        ...IDENTITY_MOTION,
        rotZ:
          POINT_ANGLE * turn +
          holding * POINT_BOB * Math.sin((s - POINT_TURN) * 9),
      };
    }
    case "Hello": {
      const phase = (TAU * t) / HELLO_PERIOD;
      return {
        ...IDENTITY_MOTION,
        rotY: HELLO_YAW * Math.sin(phase),
        rotZ: HELLO_ROLL * Math.sin(phase + Math.PI / 2),
      };
    }
    case "Typing":
      return {
        ...IDENTITY_MOTION,
        rotX: TYPING_TILT,
        posY: TYPING_BOB * Math.sin(t * TYPING_BOB_SPEED),
      };
    default:
      return IDENTITY_MOTION;
  }
}

/** Shortest signed difference between two angles, in (-PI, PI]. */
export function wrapAngle(radians: number): number {
  const wrapped = ((((radians + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  return wrapped === -Math.PI ? Math.PI : wrapped;
}

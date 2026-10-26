import { easeInOutCubic } from "./kamiji-pose-tween";

/** Hand mesh, or the sphere / rounded cube it morphs into. */
export type KamijiShape = "hand" | "sphere" | "cube";

export const KAMIJI_SHAPES: readonly KamijiShape[] = ["hand", "sphere", "cube"];

/** Morph target weights of the baked shapeSphere / shapeCube targets. */
export interface ShapeWeights {
  sphere: number;
  cube: number;
}

export const SHAPE_TARGETS: Record<KamijiShape, ShapeWeights> = {
  hand: { sphere: 0, cube: 0 },
  sphere: { sphere: 1, cube: 0 },
  cube: { sphere: 0, cube: 1 },
};

export interface ShapeTween {
  from: ShapeWeights;
  to: ShapeWeights;
  elapsedMs: number;
  durationMs: number;
}

export function startShapeTween(
  from: ShapeWeights,
  to: ShapeWeights,
  durationMs: number,
): ShapeTween {
  return { from: { ...from }, to: { ...to }, elapsedMs: 0, durationMs };
}

export function stepShapeTween(
  tween: ShapeTween,
  deltaMs: number,
): { weights: ShapeWeights; done: boolean } {
  const elapsedMs = tween.elapsedMs + deltaMs;
  Object.assign(tween, { elapsedMs });
  const t =
    tween.durationMs <= 0 ? 1 : Math.min(1, elapsedMs / tween.durationMs);
  const k = easeInOutCubic(t);
  return {
    weights: {
      sphere: tween.from.sphere + (tween.to.sphere - tween.from.sphere) * k,
      cube: tween.from.cube + (tween.to.cube - tween.from.cube) * k,
    },
    done: t >= 1,
  };
}

/** How much finger motion is left (1 = full hand, 0 = ball or cube). */
export function getFingerScale(weights: ShapeWeights): number {
  return 1 - Math.min(1, weights.sphere + weights.cube);
}

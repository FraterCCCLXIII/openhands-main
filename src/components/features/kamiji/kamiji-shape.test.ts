import { describe, expect, it } from "vitest";
import {
  SHAPE_TARGETS,
  getFingerScale,
  startShapeTween,
  stepShapeTween,
} from "./kamiji-shape";

describe("agent hand shape tween", () => {
  it("eases from the hand to the sphere and lands exactly on the target", () => {
    const tween = startShapeTween(
      SHAPE_TARGETS.hand,
      SHAPE_TARGETS.sphere,
      400,
    );

    const halfway = stepShapeTween(tween, 200);
    const end = stepShapeTween(tween, 400);

    expect(halfway.done).toBe(false);
    expect(halfway.weights.sphere).toBeCloseTo(0.5, 5);
    expect(end).toEqual({ weights: SHAPE_TARGETS.sphere, done: true });
  });

  it("scales finger motion to zero once the hand is a solid shape", () => {
    expect(getFingerScale(SHAPE_TARGETS.hand)).toBe(1);
    expect(getFingerScale({ sphere: 0.25, cube: 0.25 })).toBeCloseTo(0.5, 5);
    expect(getFingerScale(SHAPE_TARGETS.cube)).toBe(0);
  });
});

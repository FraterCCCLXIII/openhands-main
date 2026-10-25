import { describe, expect, it } from "vitest";
import { evaluateMotion, wrapAngle } from "./kamiji-motion";

describe("agent hand motions", () => {
  it("spins one full turn and settles back facing front", () => {
    const start = evaluateMotion("Spin", 0).rotY;
    const end = evaluateMotion("Spin", 1.65).rotY;

    expect(wrapAngle(end - start)).toBeCloseTo(0, 5);
    expect(evaluateMotion("Spin", 0.8).rotY).toBeGreaterThan(1);
  });

  it("turns to point sideways, holds, then returns", () => {
    expect(evaluateMotion("TurnPoint", 0).rotZ).toBe(0);
    expect(evaluateMotion("TurnPoint", 1.2).rotZ).toBeLessThan(-1.4);
    expect(evaluateMotion("TurnPoint", 3.1).rotZ).toBeCloseTo(0, 1);
  });

  it("wraps angles to the shortest signed difference", () => {
    expect(wrapAngle(Math.PI * 2 + 0.1)).toBeCloseTo(0.1, 5);
    expect(wrapAngle(-Math.PI * 2 - 0.1)).toBeCloseTo(-0.1, 5);
  });
});

import { describe, expect, it } from "vitest";
import {
  easeInOutCubic,
  getKnuckleLift,
  getPoseCurls,
  startPoseTween,
  stepPoseTween,
} from "#/components/features/kamiji/kamiji-pose-tween";

describe("pose tween", () => {
  it("eases from 0 to 1 and is symmetric around the midpoint", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
  });

  it("reaches the target pose exactly when the duration elapses", () => {
    const tween = startPoseTween(
      getPoseCurls("open"),
      getPoseCurls("fist"),
      400,
    );

    const halfway = stepPoseTween(tween, 200);
    const end = stepPoseTween(tween, 500);

    expect(halfway.done).toBe(false);
    expect(halfway.curls.Index_2).toBeCloseTo(getPoseCurls("fist").Index_2 / 2);
    expect(end.done).toBe(true);
    expect(end.curls).toEqual(getPoseCurls("fist"));
  });

  it("retargets from the interpolated curls instead of the old start", () => {
    const first = startPoseTween(
      getPoseCurls("open"),
      getPoseCurls("fist"),
      400,
    );
    const { curls: mid } = stepPoseTween(first, 100);

    const retarget = startPoseTween(mid, getPoseCurls("open"), 400);

    expect(retarget.from.Middle_1).toBe(mid.Middle_1);
    expect(stepPoseTween(retarget, 0).curls.Middle_1).toBe(mid.Middle_1);
  });
});

describe("knuckle lift", () => {
  it("keeps open fingers at the rest pivot and lifts curled ones onto the palm", () => {
    const open = getKnuckleLift(getPoseCurls("open").Index_1);
    const half = getKnuckleLift(getPoseCurls("fist").Index_1 / 2);
    const closed = getKnuckleLift(getPoseCurls("fist").Index_1);

    expect(open).toBe(0);
    expect(half).toBeGreaterThan(0);
    expect(closed).toBeGreaterThan(half);
  });
});

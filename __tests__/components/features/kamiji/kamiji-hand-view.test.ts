import { describe, expect, it } from "vitest";
import {
  FRONT_VIEW,
  getDragView,
  getFollowView,
  getKeyView,
} from "#/components/features/kamiji/kamiji-hand-view";

describe("kamiji hand view", () => {
  it("turns toward the pointer and stops at the edge of the window", () => {
    const right = getFollowView(100, 0, 400, 300);
    const farRight = getFollowView(5000, 0, 400, 300);

    expect(right.yaw).toBeGreaterThan(0);
    expect(farRight.yaw).toBeGreaterThan(right.yaw);
    expect(getFollowView(9000, 0, 400, 300).yaw).toBe(farRight.yaw);
    expect(getFollowView(0, 100, 400, 300).pitch).toBeGreaterThan(0);
  });

  it("spins with the drag from where it started", () => {
    const start = { yaw: 1, pitch: 0 };

    expect(getDragView(start, 50, 0).yaw).toBeGreaterThan(1);
    expect(getDragView(start, -50, 0).yaw).toBeLessThan(1);
    expect(getDragView(start, 0, 100000).pitch).toBeLessThan(1);
  });

  it("turns with the arrow keys and faces forward on Home", () => {
    const turned = getKeyView(FRONT_VIEW, "ArrowRight");

    expect(turned?.yaw).toBeGreaterThan(0);
    expect(getKeyView(turned ?? FRONT_VIEW, "Home")).toEqual(FRONT_VIEW);
    expect(getKeyView(FRONT_VIEW, "a")).toBeNull();
  });
});

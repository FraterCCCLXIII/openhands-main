import { describe, expect, it } from "vitest";
import {
  createSpriteScene,
  seededRandom,
  stepSpriteScene,
} from "./team-chat-sprites";

const run = (seconds: number, seed = 3) => {
  const s = createSpriteScene(1200, 800, seededRandom(seed));
  for (let t = 0; t < seconds; t += 0.05) stepSpriteScene(s, 0.05);
  return s;
};

describe("team chat sprite scene", () => {
  it("is a crew of people and agents that stay on the screen", () => {
    const s = run(60);
    expect(
      s.sprites.filter((p) => p.kind === "person").length,
    ).toBeGreaterThanOrEqual(4);
    expect(
      s.sprites.filter((p) => p.kind === "agent").length,
    ).toBeGreaterThanOrEqual(3);
    s.sprites.forEach((p) => {
      expect(p.x).toBeGreaterThanOrEqual(30);
      expect(p.x).toBeLessThanOrEqual(1200 - 30);
      expect(p.y).toBeGreaterThanOrEqual(50);
      expect(p.y).toBeLessThanOrEqual(800 - 35);
      expect(Number.isFinite(p.vx + p.vy)).toBe(true);
    });
  });

  it("pairs sprites up, shows speech bubbles, and links the pair while they talk", () => {
    const s = createSpriteScene(1200, 800, seededRandom(5));
    let sawBubble = false;
    let sawLink = false;
    let sawMeeting = false;
    for (let t = 0; t < 40; t += 0.05) {
      stepSpriteScene(s, 0.05);
      if (s.sprites.some((p) => p.bubble)) sawBubble = true;
      if (s.links.length) sawLink = true;
      if (s.sprites.some((p) => p.mode === "meet")) sawMeeting = true;
    }
    expect(sawMeeting).toBe(true);
    expect(sawBubble).toBe(true);
    expect(sawLink).toBe(true);
  });

  it("plays the agent asks, person answers exchange, and lets everyone go again", () => {
    const s = run(120, 9);
    expect(s.stories).toBeGreaterThan(2);
    for (let t = 0; t < 30; t += 0.05) stepSpriteScene(s, 0.05);
    expect(s.sprites.filter((p) => p.mode === "wander").length).toBeGreaterThan(
      0,
    );
    expect(s.scripts.size).toBeLessThanOrEqual(4);
  });

  it("keeps out of the middle where the title is", () => {
    const s = createSpriteScene(1200, 800, seededRandom(2));
    let inside = 0;
    let samples = 0;
    for (let t = 0; t < 60; t += 0.1) {
      stepSpriteScene(s, 0.1);
      s.sprites
        .filter((p) => p.mode === "wander")
        .forEach((p) => {
          samples += 1;
          const cx = (p.x - 600) / (1200 * 0.12),
            cy = (p.y - 800 * 0.46) / (800 * 0.13);
          if (cx * cx + cy * cy < 1) inside += 1;
        });
    }
    expect(inside / samples).toBeLessThan(0.05);
  });

  it("plays back the same way for the same seed", () => {
    expect(run(15).sprites.map((p) => Math.round(p.x))).toEqual(
      run(15).sprites.map((p) => Math.round(p.x)),
    );
  });
});

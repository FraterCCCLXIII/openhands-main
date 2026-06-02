import { describe, expect, it } from 'vitest';
import { computeHeroPreviewScrollEffect } from '../../src/components/hero-app-preview';

describe('computeHeroPreviewScrollEffect', () => {
  const viewportHeight = 800;

  const makeRect = (top: number, height = 700) =>
    ({
      top,
      height,
      bottom: top + height,
      left: 0,
      right: 0,
      width: 1000,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;

  it('ramps up while scrolling down toward the viewport center', () => {
    const entering = makeRect(700);
    const centered = makeRect(50);

    expect(computeHeroPreviewScrollEffect(entering, viewportHeight, 'down').scale).toBeCloseTo(
      0.92,
      2,
    );
    expect(computeHeroPreviewScrollEffect(centered, viewportHeight, 'down').scale).toBeCloseTo(
      1.12,
      2,
    );
  });

  it('holds peak scale after scrolling down past the preview', () => {
    const exiting = makeRect(-650);

    const result = computeHeroPreviewScrollEffect(exiting, viewportHeight, 'down');
    expect(result.scale).toBeCloseTo(1.12, 2);
    expect(result.shadow).toBeCloseTo(0.22, 2);
  });

  it('shrinks back while scrolling up through the preview', () => {
    const mid = makeRect(300);

    const result = computeHeroPreviewScrollEffect(mid, viewportHeight, 'up');
    expect(result.scale).toBeCloseTo(0.995, 2);
    expect(result.shadow).toBeGreaterThan(0);
    expect(result.shadow).toBeLessThan(0.22);
  });

  it('returns to resting scale at the top of the page when scrolling up', () => {
    const initial = makeRect(1168);

    const result = computeHeroPreviewScrollEffect(initial, viewportHeight, 'up');
    expect(result.scale).toBeCloseTo(0.92, 2);
    expect(result.shadow).toBe(0);
  });
});

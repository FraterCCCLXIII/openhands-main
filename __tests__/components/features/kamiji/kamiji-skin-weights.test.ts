import { BufferAttribute, BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import { isolateFingerWeights } from "#/components/features/kamiji/kamiji-skin-weights";

const BONES = ["Palm", "Middle_3", "Ring_3"];

function geometryWith(rows: Array<[number[], number[]]>) {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "skinIndex",
    new BufferAttribute(new Uint16Array(rows.flatMap(([i]) => i)), 4),
  );
  geometry.setAttribute(
    "skinWeight",
    new BufferAttribute(new Float32Array(rows.flatMap(([, w]) => w)), 4),
  );
  return geometry;
}

describe("isolateFingerWeights", () => {
  it("drops a neighbouring finger's small pull and keeps real blends", () => {
    // Arrange: a fingertip dragged 3% by the ring finger, and a web vertex shared evenly.
    const geometry = geometryWith([
      [
        [1, 2, 0, 0],
        [0.97, 0.03, 0, 0],
      ],
      [
        [1, 2, 0, 0],
        [0.5, 0.5, 0, 0],
      ],
    ]);

    // Act
    isolateFingerWeights(geometry, BONES);

    // Assert
    const weights = geometry.getAttribute("skinWeight");
    expect([weights.getX(0), weights.getY(0)]).toEqual([1, 0]);
    expect([weights.getX(1), weights.getY(1)]).toEqual([0.5, 0.5]);
  });
});

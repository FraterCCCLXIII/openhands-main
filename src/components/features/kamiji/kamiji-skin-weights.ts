import { BufferGeometry, SkinnedMesh } from "three";
import { KAMIJI_FINGERS } from "./kamiji-pose-tween";

// A vertex whose weight on other fingers is below this share is treated as
// authoring noise (a fingertip dragged by its neighbour); larger shares are real
// blends in the web between fingers and are kept.
const NOISE_SHARE = 0.15;

function fingerOf(boneName: string): string | null {
  const finger = boneName.split("_")[0];
  return (KAMIJI_FINGERS as readonly string[]).includes(finger) ? finger : null;
}

/**
 * Remove small cross-finger skin weights in place. Without this a curled ring
 * finger tugs a few percent of the middle fingertip and tears a spike in it.
 */
export function isolateFingerWeights(
  geometry: BufferGeometry,
  boneNames: readonly string[],
) {
  const indices = geometry.getAttribute("skinIndex");
  const weights = geometry.getAttribute("skinWeight");
  if (!indices || !weights) return;
  const fingers = boneNames.map(fingerOf);
  const bones = [0, 0, 0, 0];
  const kept = [0, 0, 0, 0];
  for (let v = 0; v < indices.count; v += 1) {
    const totals = new Map<string, number>();
    for (let k = 0; k < 4; k += 1) {
      bones[k] = indices.getComponent(v, k);
      const finger = fingers[bones[k]];
      if (finger) {
        totals.set(
          finger,
          (totals.get(finger) ?? 0) + weights.getComponent(v, k),
        );
      }
    }
    let dominant = "";
    let dominantWeight = 0;
    let fingerTotal = 0;
    totals.forEach((weight, finger) => {
      fingerTotal += weight;
      if (weight > dominantWeight) {
        dominant = finger;
        dominantWeight = weight;
      }
    });
    if (
      dominant &&
      (fingerTotal - dominantWeight) / fingerTotal < NOISE_SHARE
    ) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) {
        const finger = fingers[bones[k]];
        kept[k] =
          finger && finger !== dominant ? 0 : weights.getComponent(v, k);
        sum += kept[k];
      }
      if (sum > 0) {
        weights.setXYZW(
          v,
          kept[0] / sum,
          kept[1] / sum,
          kept[2] / sum,
          kept[3] / sum,
        );
      }
    }
  }
  weights.needsUpdate = true;
}

export function isolateHandSkinWeights(mesh: SkinnedMesh) {
  isolateFingerWeights(
    mesh.geometry,
    mesh.skeleton.bones.map((bone) => bone.name),
  );
}

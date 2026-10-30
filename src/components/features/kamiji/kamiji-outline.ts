/** Outline thickness as a share of the canvas width (about 3px at 256px). */
const OUTLINE_WIDTH_RATIO = 0.012;
const OUTLINE_STEPS = 12;
const OUTLINE_COLOR = "#1c1a22";

let scratch: HTMLCanvasElement | null = null;

/**
 * Paints `source` into `context` with a toon outline: the silhouette is
 * stamped around a ring of offsets, flattened to the outline colour, and the
 * image is drawn on top. It works on any render (skinned, morphed), unlike an
 * inverted-hull mesh.
 */
export function drawWithOutline(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
) {
  scratch ??= document.createElement("canvas");
  scratch.width = width;
  scratch.height = height;
  const ink = scratch.getContext("2d");
  if (!ink) {
    context.drawImage(source, 0, 0, width, height);
    return;
  }
  const radius = Math.max(1, width * OUTLINE_WIDTH_RATIO);
  for (let step = 0; step < OUTLINE_STEPS; step += 1) {
    const angle = (step / OUTLINE_STEPS) * Math.PI * 2;
    ink.drawImage(
      source,
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      width,
      height,
    );
  }
  ink.globalCompositeOperation = "source-in";
  ink.fillStyle = OUTLINE_COLOR;
  ink.fillRect(0, 0, width, height);
  ink.globalCompositeOperation = "source-over";
  context.drawImage(scratch, 0, 0);
  context.drawImage(source, 0, 0, width, height);
}

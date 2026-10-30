const WHITE = "#FFFFFF";
const INK = "#0F1115";

/** Relative luminance (WCAG) of an sRGB color given as 0-255 channels. */
function relativeLuminance([r, g, b]: readonly [number, number, number]) {
  const [R, G, B] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Text color that stays legible on a button background: white on darker
 * fills, near-black on lighter ones.
 */
export function pickAccentForeground(
  rgb: readonly [number, number, number],
): string {
  return relativeLuminance(rgb) < 0.45 ? WHITE : INK;
}

/** Parse a computed `rgb()` / `rgba()` string; fully transparent yields null. */
export function parseComputedRgb(
  value: string,
): [number, number, number] | null {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);
  const [r, g, b, alpha = 1] = parts;
  if (alpha === 0) return null;
  return [r, g, b];
}

/**
 * Resolve a CSS background (which may reference theme variables) inside the
 * agent-server UI scope and pick the foreground that reads on it.
 */
export function accentForegroundFor(cssBackground: string): string | null {
  if (typeof document === "undefined") return null;
  const probe = document.createElement("div");
  probe.setAttribute("data-agent-server-ui", "");
  probe.style.background = cssBackground;
  document.body.appendChild(probe);
  const rgb = parseComputedRgb(getComputedStyle(probe).backgroundColor);
  probe.remove();
  return rgb ? pickAccentForeground(rgb) : null;
}

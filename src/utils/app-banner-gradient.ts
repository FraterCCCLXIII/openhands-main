/** Curated banner gradients: every stop keeps a white logo at >= 3:1 contrast. */
export const APP_BANNER_PALETTE: readonly (readonly string[])[] = [
  ["#6d28d9", "#3730a3"], // violet -> indigo
  ["#c2410c", "#a21caf"], // coral -> magenta
  ["#0f766e", "#1d4ed8"], // teal -> blue
  ["#b45309", "#b91c1c"], // amber -> red
  ["#047857", "#0e7490"], // emerald -> cyan
  ["#be123c", "#7e22ce"], // rose -> purple
  ["#334155", "#1d4ed8"], // slate -> blue
  ["#4338ca", "#7e22ce"], // indigo -> purple
  ["#0369a1", "#4338ca"], // sky -> indigo
  ["#a21caf", "#be123c"], // fuchsia -> rose
  ["#15803d", "#0f766e"], // green -> teal
  ["#9a3412", "#9f1239"], // rust -> crimson
];

type Rgb = [number, number, number];

function parseHex(color: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

const toHex = (rgb: Rgb) =>
  `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/** WCAG relative luminance of a #rgb / #rrggbb colour (1 when unparseable). */
export function relativeLuminance(color: string): number {
  const rgb = parseHex(color);
  if (!rgb) return 1;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of a colour against white. */
export function contrastWithWhite(color: string): number {
  return 1.05 / (relativeLuminance(color) + 0.05);
}

/** Rotates hue with the standard colour-matrix approximation. */
function rotateHue([r, g, b]: Rgb, degrees: number): Rgb {
  const rad = (degrees * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const rows = [
    [
      0.213 + c * 0.787 - s * 0.213,
      0.715 - c * 0.715 - s * 0.715,
      0.072 - c * 0.072 + s * 0.928,
    ],
    [
      0.213 - c * 0.213 + s * 0.143,
      0.715 + c * 0.285 + s * 0.14,
      0.072 - c * 0.072 - s * 0.283,
    ],
    [
      0.213 - c * 0.213 - s * 0.787,
      0.715 - c * 0.715 + s * 0.715,
      0.072 + c * 0.928 + s * 0.072,
    ],
  ];
  return rows.map((row) =>
    Math.min(255, Math.max(0, row[0] * r + row[1] * g + row[2] * b)),
  ) as Rgb;
}

/** Mixes towards black until a white logo reads on it. */
function darkenToContrast(rgb: Rgb): string {
  let current = rgb;
  for (let i = 0; i < 30 && contrastWithWhite(toHex(current)) < 3.6; i += 1) {
    current = current.map((v) => v * 0.93) as Rgb;
  }
  return toHex(current);
}

/** Stable hash of an app name. */
export function hashAppName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Gradient stops: from the app's hex accent colour when it has one, else from a palette pick by name. */
export function appBannerStops(name: string, accent?: string | null): string[] {
  const rgb = accent ? parseHex(accent) : null;
  if (rgb) {
    return [0, 40, 80].map((deg) => darkenToContrast(rotateHue(rgb, deg)));
  }
  return [...APP_BANNER_PALETTE[hashAppName(name) % APP_BANNER_PALETTE.length]];
}

/** CSS `background` value: a 135deg gradient under a soft radial highlight. */
export function appBannerBackground(
  name: string,
  accent?: string | null,
): string {
  const stops = appBannerStops(name, accent);
  return `radial-gradient(120% 90% at 85% 0%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(135deg, ${stops.join(", ")})`;
}

/**
 * Neutral grey scale from agent-canvas `openhands-neutral`
 * (`src/themes/color-themes.ts` → NEUTRAL_SCALE).
 */
export const NEUTRAL_PALETTE = {
  50: '#F7F7F7',
  100: '#ECECEC',
  200: '#DCDCDC',
  300: '#BEBEBE',
  400: '#979797',
  500: '#737373',
  600: '#565656',
  700: '#404040',
  800: '#313131',
  900: '#282828',
  950: '#181818',
  975: '#101010',
} as const;

/** Semantic marketing tokens (replaces legacy brown foreground accents). */
export const MARKETING_NEUTRAL = {
  fg: NEUTRAL_PALETTE[950],
  accent: NEUTRAL_PALETTE[600],
  muted: NEUTRAL_PALETTE[500],
  borderRgb: '24, 24, 24',
  fgRgb: '24, 24, 24',
} as const;

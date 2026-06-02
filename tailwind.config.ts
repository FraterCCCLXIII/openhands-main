import { MARKETING_NEUTRAL, NEUTRAL_PALETTE } from './src/constants/marketing-neutral-colors';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy colors (kept for backward compatibility)
        description: "#292A36",
        placeholder: "#D4CABD",
        party: "#FFE165",
        // Modern Webflow design system
        brand: {
          bg: "#f9f0d9",
          fg: MARKETING_NEUTRAL.fg,
          accent: "#ffff8b",
          "accent-hover": "#e6e67a",
          brown: MARKETING_NEUTRAL.accent,
          muted: MARKETING_NEUTRAL.muted,
          border: `rgba(${MARKETING_NEUTRAL.borderRgb}, 0.1)`,
        },
        card: {
          bg: NEUTRAL_PALETTE[950],
          text: "#f9f0d9",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        quincy: ["Quincy CF", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        'sohne': ['"Sohne Kraftig"', "Arial", "sans-serif"],
        'sohne-buch': ['"Sohne Buch"', "Arial", "sans-serif"],
        'mono': ['"Geistmono"', "Arial", "sans-serif"],
      },
      screens: {
        'monitor': '1800px',
      },
      listStyleType: {
        alpha: 'lower-alpha',
      },
      borderRadius: {
        'pill': '9999px',
      },
    },
  },
  plugins: [],
}

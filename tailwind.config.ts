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
          fg: "#22150d",
          accent: "#ffff8b",
          "accent-hover": "#e6e67a",
          brown: "#8a5f45",
          muted: "rgba(34, 21, 13, 0.7)",
          border: "rgba(34, 21, 13, 0.1)",
        },
        card: {
          bg: "#22150d",
          text: "#f9f0d9",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        quincy: ["Quincy CF", "sans-serif"],
        inter: ["Inter", "sans-serif"],
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

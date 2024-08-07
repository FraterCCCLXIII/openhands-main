import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        description: "#292A36",
        placeholder: "#D4CABD",
        party: "#FFE165",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        quincy: ["Quincy CF", "sans-serif"],
      }
    },
  },
  plugins: [],
} satisfies Config;

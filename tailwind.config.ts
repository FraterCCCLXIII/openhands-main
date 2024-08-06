import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        quincy: ["Quincy CF", "sans-serif"],
      }
    },
  },
  plugins: [],
} satisfies Config;

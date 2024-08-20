export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
      },
      screens: {
        'monitor': '2000px',
      },
    },
  },
  plugins: [],
}

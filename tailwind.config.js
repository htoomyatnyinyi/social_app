/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "var(--accent-color)",
        accent: "var(--accent-color)",
        x: {
          blue: "#1d9bf0",
          black: "#000000",
          darkGray: "#16181c",
          gray: "#71767b",
          border: "#2f3336",
        },
      },
      fontSize: {
        dynamic: "calc(16px * var(--font-scale))",
      },
    },
  },
  plugins: [],
};

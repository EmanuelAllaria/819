/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        ink: "#000000",
        primary: "#E00000",
        "primary-bright": "#FF0000",
        accent: "#FF4040",
        "accent-soft": "#FF7676",
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#E00000",
          primaryBright: "#FF0000",
          accent: "#FF4040",
          accentSoft: "#FF7676",
          paper: "#FFFFFF",
          ink: "#000000",
        },
      },
      boxShadow: {
        card: "0 10px 24px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

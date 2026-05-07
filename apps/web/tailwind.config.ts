import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mint: "#1f9d7a",
        coral: "#e25d4f"
      }
    }
  },
  plugins: []
};

export default config;


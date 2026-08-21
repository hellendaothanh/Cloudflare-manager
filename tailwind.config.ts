import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cf: {
          orange: "#F6821F",
          darkorange: "#FAAD3F",
          navy: "#1D2B3A",
          dark: "#0F172A",
          card: "#1E293B",
          border: "#334155",
          accent: "#38BDF8",
          emerald: "#10B981",
          rose: "#F43F5E",
          amber: "#F59E0B",
          purple: "#8B5CF6",
        }
      },
    },
  },
  plugins: [],
};
export default config;

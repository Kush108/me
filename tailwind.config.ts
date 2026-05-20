import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          card: "var(--bg-card)",
        },
        border: "var(--border)",
        accent: {
          DEFAULT: "var(--accent)",
          dim: "var(--accent-dim)",
        },
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        score: {
          green: "var(--green)",
          yellow: "var(--yellow)",
          red: "var(--red)",
        },
      },
      fontFamily: {
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
      },
      animation: {
        pulseScore: "pulseScore 2s ease-in-out infinite",
      },
      keyframes: {
        pulseScore: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 229, 255, 0.4)" },
          "50%": { boxShadow: "0 0 12px 4px rgba(0, 229, 255, 0.25)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

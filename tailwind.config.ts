import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // Israel flag accents
        israel: {
          blue: "#0038B8",
          white: "#FFFFFF",
        },
        // Powertrain palette — flat, solid, AA-contrast on white.
        pt: {
          BEV: "#10B981",   // emerald 500
          PHEV: "#2563EB",  // blue 600
          HEV: "#F59E0B",   // amber 500
          MHEV: "#7C3AED",  // violet 600
          ICE: "#EF4444",   // red 500
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Apple-style multi-layer soft shadow
        elevated: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        // Retained name so existing classnames keep working, but softened.
        glow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "pulse-dot": "pulseDot 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

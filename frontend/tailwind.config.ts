import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ── Tahoe Refined Color System ────────────────────────────────────
      colors: {
        // Backgrounds
        background: {
          DEFAULT: "#0A0F1E",
          surface: "#111827",
          surface2: "#1C2333",
          card: "rgba(17, 24, 39, 0.8)",
        },
        // Brand Primary (Indigo)
        primary: {
          DEFAULT: "#6366F1",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          glow: "rgba(99, 102, 241, 0.3)",
          foreground: "#FFFFFF",
        },
        // Accent Gold (Amber)
        accent: {
          DEFAULT: "#F59E0B",
          foreground: "#0A0F1E",
          glow: "rgba(245, 158, 11, 0.3)",
        },
        // Text
        foreground: {
          DEFAULT: "#F9FAFB",
          secondary: "#9CA3AF",
          muted: "#6B7280",
        },
        // Status
        success: {
          DEFAULT: "#10B981",
          foreground: "#FFFFFF",
        },
        error: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#0A0F1E",
        },
        // Border
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          subtle: "rgba(255, 255, 255, 0.04)",
          active: "rgba(99, 102, 241, 0.5)",
        },
        // shadcn/ui compatibility tokens
        card: {
          DEFAULT: "#111827",
          foreground: "#F9FAFB",
        },
        popover: {
          DEFAULT: "#111827",
          foreground: "#F9FAFB",
        },
        secondary: {
          DEFAULT: "#1C2333",
          foreground: "#F9FAFB",
        },
        muted: {
          DEFAULT: "#1C2333",
          foreground: "#9CA3AF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        input: "rgba(255, 255, 255, 0.08)",
        ring: "#6366F1",
      },
      // ── Typography ────────────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        display: ["var(--font-playfair)", ...fontFamily.serif],
        mono: ["var(--font-jetbrains)", ...fontFamily.mono],
      },
      // ── Border Radius ────────────────────────────────────────────────
      borderRadius: {
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        card: "16px",
        pill: "9999px",
      },
      // ── Spacing Extras ────────────────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      // ── Animations ────────────────────────────────────────────────────
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(99, 102, 241, 0.6)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "scroll-indicator": {
          "0%, 100%": { opacity: "1", transform: "translateY(0)" },
          "50%": { opacity: "0.3", transform: "translateY(8px)" },
        },
        blob: {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "50%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        glow: "glow 2s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "scroll-indicator": "scroll-indicator 1.5s ease-in-out infinite",
        blob: "blob 8s ease-in-out infinite",
      },
      // ── Backdrop Blur ──────────────────────────────────────────────────
      backdropBlur: {
        xs: "2px",
        glass: "16px",
        heavy: "32px",
      },
      // ── Box Shadow (Glow effects) ──────────────────────────────────────
      boxShadow: {
        glow: "0 0 20px rgba(99, 102, 241, 0.3)",
        "glow-lg": "0 0 40px rgba(99, 102, 241, 0.4)",
        "glow-gold": "0 0 20px rgba(245, 158, 11, 0.3)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.15)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)",
      },
      // ── Background Gradients ──────────────────────────────────────────
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
        "gradient-gold": "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
        "gradient-dark": "linear-gradient(180deg, #0A0F1E 0%, #111827 100%)",
        "gradient-card": "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)",
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
        "hero-overlay": "linear-gradient(to bottom, rgba(10,15,30,0.6) 0%, rgba(10,15,30,0.9) 100%)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};

export default config;

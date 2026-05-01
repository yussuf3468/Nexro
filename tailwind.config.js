/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nexro design system
        background: "#09090F",
        surface: "#111118",
        "surface-2": "#18181F",
        border: "#1E1E2A",
        "border-2": "#2A2A38",
        accent: {
          DEFAULT: "#7C6EFF",
          hover: "#6B5EEE",
          subtle: "rgba(124, 110, 255, 0.12)",
        },
        success: {
          DEFAULT: "#00D26A",
          subtle: "rgba(0, 210, 106, 0.12)",
        },
        warning: {
          DEFAULT: "#FFB800",
          subtle: "rgba(255, 184, 0, 0.12)",
        },
        danger: {
          DEFAULT: "#FF4444",
          subtle: "rgba(255, 68, 68, 0.12)",
        },
        muted: "#6B6B80",
        "text-secondary": "#9999AA",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow": "spin 2s linear infinite",
        shimmer: "shimmer 2s infinite",
        "shimmer-slide": "shimmerSlide 1.8s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.9" },
        },
        scaleIn: {
          from: { opacity: 0, transform: "scale(0.95)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
        shimmerSlide: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "grid-pattern":
          "linear-gradient(rgba(124,110,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,110,255,0.04) 1px, transparent 1px)",
        shimmer:
          "linear-gradient(90deg, transparent 0%, rgba(124,110,255,0.08) 50%, transparent 100%)",
        "accent-gradient": "linear-gradient(135deg, #7C6EFF 0%, #9B6EFF 100%)",
        "accent-gradient-soft":
          "linear-gradient(135deg, rgba(124,110,255,0.15) 0%, rgba(155,110,255,0.06) 100%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      boxShadow: {
        glow: "0 0 30px rgba(124, 110, 255, 0.3), 0 0 60px rgba(124, 110, 255, 0.12)",
        "glow-sm": "0 0 15px rgba(124, 110, 255, 0.2)",
        "glow-lg":
          "0 0 60px rgba(124, 110, 255, 0.4), 0 0 120px rgba(124, 110, 255, 0.18)",
        card: "0 4px 32px rgba(0, 0, 0, 0.5)",
        "card-hover":
          "0 8px 48px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(124,110,255,0.12)",
      },
      screens: {
        xs: "400px",
      },
    },
  },
  plugins: [],
};

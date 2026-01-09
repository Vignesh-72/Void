/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TRUE VOID BLACK SCALE
        space: {
          950: '#000000',
          900: '#050505',
          800: '#121212',
        },
        nebula: {
          400: '#a855f7',
          500: '#8b5cf6',
        },
        cyan: {
          400: '#00f0ff',
        }
      },
      backgroundImage: {
        'void-gradient': 'radial-gradient(circle at 50% 0%, #111111 0%, #000000 70%)',
        // NEW: Subtle film grain noise texture
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E\")",
        // NEW: Complex multi-layered star pattern
        'stars': 'radial-gradient(white, rgba(255,255,255,.1) 1px, transparent 1px), radial-gradient(white, rgba(255,255,255,.05) 1px, transparent 1px), radial-gradient(white, rgba(255,255,255,.03) 2px, transparent 2px)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
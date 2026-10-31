/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
        },
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#64748B',
          400: '#94A3B8',
        },
        research: {
          cerulean: '#0284C7',
          teal: '#0D9488',
          lightCerulean: '#F0FDFA',
        },
        safe: {
          emerald: '#059669',
          lightEmerald: '#ECFDF5',
        },
        drift: {
          amber: '#D97706',
          lightAmber: '#FFFBEB',
        },
        violation: {
          crimson: '#DC2626',
          lightCrimson: '#FEF2F2',
        },
        adaptive: {
          violet: '#7C3AED',
          lightViolet: '#F5F3FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'Crimson Pro', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'academic': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'academic-card': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'academic-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Values come from CSS variables in src/index.css (the design brief's
        // palette), stored as "R G B" so opacity modifiers (bg-primary/10) work.
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          foreground: 'rgb(var(--color-on-primary) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          foreground: 'rgb(var(--color-on-accent) / <alpha-value>)',
        },
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        },
        // Fixed translucent border per the brief (rgba(255,255,255,0.08)) — not
        // meant to take further opacity modifiers.
        border: 'rgba(255, 255, 255, 0.08)',
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive) / <alpha-value>)',
          foreground: '#FFFFFF',
        },
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '10px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -4px rgba(0,0,0,0.45)',
        'soft-sm': '0 1px 3px rgba(0,0,0,0.35)',
        'soft-lg': '0 4px 12px rgba(0,0,0,0.35), 0 16px 40px -8px rgba(0,0,0,0.5)',
        glow: '0 0 0 4px rgba(236,72,153,0.18)',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      transitionDuration: {
        DEFAULT: '250ms',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out both',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}

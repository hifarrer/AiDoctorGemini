import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  safelist: [
    // Background color classes for dynamic hero backgrounds
    'bg-gradient-to-br',
    'from-blue-500', 'to-blue-700',
    'from-purple-500', 'to-purple-700',
    'from-green-500', 'to-green-700',
    'from-orange-500', 'to-orange-700',
    'from-pink-500', 'to-pink-700',
    'bg-white', 'bg-gray-200', 'bg-gray-800', 'bg-blue-600', 'bg-green-600',
    'text-white', 'text-gray-900', 'text-gray-600', 'text-gray-700', 'text-gray-300',
    'text-blue-100', 'text-purple-100', 'text-green-100', 'text-orange-100', 'text-pink-100',
    // Card background classes
    'bg-gradient-to-b', 'from-blue-600/20', 'to-blue-800/20',
    'from-purple-600/20', 'to-purple-800/20',
    'from-green-600/20', 'to-green-800/20',
    'from-orange-600/20', 'to-orange-800/20',
    'from-pink-600/20', 'to-pink-800/20',
    'bg-gray-50', 'bg-gray-100', 'bg-gray-700/50', 'bg-blue-500/20', 'bg-green-500/20',
    // Border classes
    'border-blue-400/30', 'border-purple-400/30', 'border-green-400/30',
    'border-orange-400/30', 'border-pink-400/30',
    'border-gray-200', 'border-gray-300', 'border-gray-400', 'border-gray-600',
    // Icon background classes
    'bg-gradient-to-br', 'from-blue-500/30', 'to-blue-700/30',
    'from-purple-500/30', 'to-purple-700/30',
    'from-green-500/30', 'to-green-700/30',
    'from-orange-500/30', 'to-orange-700/30',
    'from-pink-500/30', 'to-pink-700/30',
    'border-blue-400/50', 'border-purple-400/50', 'border-green-400/50',
    'border-orange-400/50', 'border-pink-400/50',
    'border-gray-500'
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        teal: {
          '50': '#f0fdfa',
          '100': '#ccfbf1',
          '200': '#99f6e4',
          '300': '#5eead4',
          '400': '#2dd4bf',
          '500': '#14b8a6',
          '600': '#0d9488',
          '700': '#0f766e',
          '800': '#115e59',
          '900': '#134e4a',
          '950': '#042f2e',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config 
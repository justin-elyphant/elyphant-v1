
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			backgroundImage: {
				'elyphant-gradient': 'linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%)',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				surface: {
					primary: 'hsl(var(--surface-primary))',
					secondary: 'hsl(var(--surface-secondary))',
					elevated: 'hsl(var(--surface-elevated))',
					sunken: 'hsl(var(--surface-sunken))'
				},
				// Elyphant Brand Colors - E-commerce Minimalism
				elyphant: {
					// Foundation (80% of UI) - Monochromatic base
					grey: '#F7F7F7',       // Page background
					white: '#FFFFFF',      // Card backgrounds
					black: '#2B2B2B',      // Primary text
					'grey-text': '#6B7280', // Secondary text
					// Brand Accent (20% of UI) - Strategic use only
					purple: '#9333ea',     // Purple from logo gradient
					blue: '#0ea5e9',       // Sky blue from logo gradient
					// Semantic
					success: '#10B981',    // Order success, delivery confirmed
				},
				slate: {
					50: '#f8fafc',
					100: '#f1f5f9',
					200: '#e2e8f0',
					300: '#cbd5e1',
					400: '#94a3b8',
					500: '#64748b',
					600: '#475569',
					700: '#334155',
					800: '#1e293b',
					900: '#0f172a',
					950: '#020617',
				},
				indigo: {
					50: '#eef2ff',
					100: '#e0e7ff',
					200: '#c7d2fe',
					300: '#a5b4fc',
					400: '#818cf8',
					500: '#6366f1',
					600: '#4f46e5',
					700: '#4338ca',
					800: '#3730a3',
					900: '#312e81',
					950: '#1e1b4b',
				},
				teal: {
					50: '#f0fdfa',
					100: '#ccfbf1',
					200: '#99f6e4',
					300: '#5eead4',
					400: '#2dd4bf',
					500: '#14b8a6',
					600: '#0d9488',
					700: '#0f766e',
					800: '#115e59',
					900: '#134e4a',
					950: '#042f2e',
				},
				blue: {
					50: '#eff6ff',
					100: '#dbeafe',
					200: '#bfdbfe',
					300: '#93c5fd',
					400: '#60a5fa',
					500: '#3b82f6',
					600: '#2563eb',
					700: '#1d4ed8',
					800: '#1e40af',
					900: '#1e3a8a',
					950: '#172554',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
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
				},
				'shimmer': {
					'0%': {
						transform: 'translateX(-100%)'
					},
					'100%': {
						transform: 'translateX(100%)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'shimmer': 'shimmer 3s ease-in-out infinite'
			},
		fontFamily: {
			sans: ['Inter', 'system-ui', 'sans-serif'],
			// Holiday themed fonts
			'halloween': ['Creepster', 'cursive'],
			'christmas': ['Mountains of Christmas', 'cursive'],
			'holidays': ['Great Vibes', 'cursive'],
			'valentines': ['Dancing Script', 'cursive'],
			'easter': ['Satisfy', 'cursive'],
			'mothers': ['Pacifico', 'cursive'],
			'fathers': ['Playfair Display', 'serif'],
			'graduation': ['Cinzel', 'serif'],
			'school': ['Bubblegum Sans', 'cursive'],
			'blackfriday': ['Bebas Neue', 'sans-serif'],
			'cybermonday': ['Orbitron', 'sans-serif'],
		},
			boxShadow: {
				'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
				'card': '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 1px 4px -1px rgba(0, 0, 0, 0.06)',
				'floating': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
			},
			spacing: {
				'0': 'var(--space-0)',
				'1': 'var(--space-1)',
				'2': 'var(--space-2)',
				'3': 'var(--space-3)',
				'4': 'var(--space-4)',
				'5': 'var(--space-5)',
				'6': 'var(--space-6)',
				'8': 'var(--space-8)',
				'10': 'var(--space-10)',
				'12': 'var(--space-12)',
				'16': 'var(--space-16)',
				'20': 'var(--space-20)',
				'24': 'var(--space-24)',
				// iOS Safe Area Insets
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)',
			},
			padding: {
				'safe': 'env(safe-area-inset-bottom)',
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)',
			},
			fontSize: {
				'xs': ['var(--text-xs)', { lineHeight: 'var(--leading-normal)' }],
				'sm': ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],
				'base': ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
				'lg': ['var(--text-lg)', { lineHeight: 'var(--leading-relaxed)' }],
				'xl': ['var(--text-xl)', { lineHeight: 'var(--leading-snug)' }],
				'2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-snug)' }],
				'3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
				'4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)' }],
			},
			fontWeight: {
				'normal': 'var(--font-normal)',
				'medium': 'var(--font-medium)',
				'semibold': 'var(--font-semibold)',
				'bold': 'var(--font-bold)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

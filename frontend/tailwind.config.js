/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'system-cyan': '#2dd4ff',
        'system-cyan-dim': '#0ea5c7',
        'system-bg-deep': '#05070d',
        'system-bg-dark': '#020306',
        'system-panel': '#060b17',
        'system-panel-2': '#091224',
        'system-gold': '#fbbf24',
        'system-purple': '#8b5cf6',
        'system-line': '#16263d'
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace']
      },
      boxShadow: {
        'system-cyan-glow': '0 0 20px rgba(45, 212, 255, 0.25), inset 0 0 12px rgba(45, 212, 255, 0.05)',
        'system-gold-glow': '0 0 20px rgba(251, 191, 36, 0.3), inset 0 0 12px rgba(251, 191, 36, 0.05)',
        'system-purple-glow': '0 0 20px rgba(139, 92, 246, 0.35), inset 0 0 12px rgba(139, 92, 246, 0.05)'
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        redact: {
          bg:          '#0d0d0d',
          surface:     '#161616',
          border:      '#2a2a2a',
          accent:      '#ff3b3b',
          'accent-dim':'#cc2e2e',
          muted:       '#555555',
          text:        '#e8e8e8',
          'text-dim':  '#888888',
        },
      },
    },
  },
  plugins: [],
};

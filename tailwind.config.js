// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5e3a87', // Roxo principal para botões e menus
          dark: '#4c2d6e',   // Roxo mais escuro para hover
          light: '#7e57c2',  // Roxo mais claro (opcional)
        },
        secondary: '#ede7f6', // Lilás bem claro para fundos de página
      },
    },
  },
  plugins: [],
}
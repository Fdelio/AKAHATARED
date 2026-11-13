import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: la app funciona igual en un dominio propio o en una subcarpeta (GitHub Pages).
  base: './',
  plugins: [react(), tailwindcss()],
});

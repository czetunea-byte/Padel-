import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativo: funciona en GitHub Pages (/Padel-/) y en local
export default defineConfig({
  base: './',
  plugins: [react()],
});

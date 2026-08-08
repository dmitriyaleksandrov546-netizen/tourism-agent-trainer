import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'automatic'
  },
  base: '/',
  server: {
    host: '0.0.0.0'
  },
  preview: {
    host: '0.0.0.0'
  }
});

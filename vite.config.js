import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];

export default defineConfig({
  plugins: [react()],
  base: repoName ? `/${repoName}/` : '/',
  server: {
    host: '0.0.0.0',
    allowedHosts: ['localhost', '127.0.0.1', '89.127.206.120', '.loca.lt']
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['localhost', '127.0.0.1', '89.127.206.120', '.loca.lt']
  }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' -> path tương đối, chạy được trên static host (GitHub/Cloudflare Pages).
export default defineConfig({
  plugins: [react()],
  base: './',
});

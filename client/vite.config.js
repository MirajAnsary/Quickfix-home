import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Dev proxy: the browser talks to the same origin, so the httpOnly auth cookie just works.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});

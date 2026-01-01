
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use process.cwd() with a type cast to any to resolve property 'cwd' not existing on type 'Process' in some environments
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
    },
    build: {
      target: 'esnext',
      outDir: 'dist'
    },
    server: {
      port: 5173
    }
  };
});

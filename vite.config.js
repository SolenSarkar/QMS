import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Base path for production deployment
    base: './',
    
    // Mode configurations
    mode: mode,
    
    // Define global environment variables
    // Supports both localhost:5000 and qms-sjuv.onrender.com backends
    define: {
      'import.meta.env.MODE': JSON.stringify(mode),
      'import.meta.env.PROD': JSON.stringify(mode === 'production'),
      'import.meta.env.DEV': JSON.stringify(mode === 'development'),
      // VITE_PREFERRED_API: 'local' for localhost, 'production' or 'render' for Render backend
      'import.meta.env.VITE_PREFERRED_API': JSON.stringify(env.VITE_PREFERRED_API || ''),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:5000'),
      'import.meta.env.VITE_DEPLOYMENT_URL': JSON.stringify(env.VITE_DEPLOYMENT_URL || ''),
      'import.meta.env.VITE_APP_MODE': JSON.stringify(env.VITE_APP_MODE || mode),
      'import.meta.env.VITE_ENABLE_LOGGING': JSON.stringify(env.VITE_ENABLE_LOGGING || (mode === 'development')),
    },
    
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      // Build output directory
      outDir: 'dist',
      emptyOutDir: true,
      
      // Build optimizations based on mode
      minify: mode === 'production' ? 'esbuild' : false,
      sourcemap: mode === 'development'
    }
  };
});

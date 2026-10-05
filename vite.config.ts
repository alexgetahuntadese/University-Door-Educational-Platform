import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  preview: {
    host: "::",
    port: 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // fast-equals@5.4.0 ships without the expected ESM entry in this install,
      // so we pin Vite to the working CJS build.
      "fast-equals": path.resolve(
        __dirname,
        "./node_modules/react-smooth/node_modules/fast-equals/dist/cjs/index.cjs",
      ),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('@radix-ui') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'ui';
            }
            if (id.includes('recharts') || id.includes('framer-motion')) {
              return 'charts';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('date-fns') || id.includes('zod') || id.includes('cmdk')) {
              return 'utils';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
          }
          // Split large data files into separate chunks
          if (id.includes('/data/')) {
            if (id.includes('grade12')) {
              return 'data-grade12';
            }
            if (id.includes('grade11')) {
              return 'data-grade11';
            }
            if (id.includes('grade10')) {
              return 'data-grade10';
            }
            if (id.includes('grade9')) {
              return 'data-grade9';
            }
            if (id.includes('matric')) {
              return 'data-matric';
            }
            return 'data';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: mode === 'development',
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
      },
    },
    cssCodeSplit: true,
    reportCompressedSize: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'lucide-react'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
}));

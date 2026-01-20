
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ command }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    command === 'serve' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize bundle splitting with enhanced performance chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunk for essential libraries
          vendor: ['react', 'react-dom'],
          // Router chunk for navigation
          router: ['react-router-dom'],
          // UI library chunks
          radix: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-avatar', '@radix-ui/react-popover'],
          // Form and validation
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Icons and styling utilities
          styling: ['lucide-react', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          // Heavy marketplace components
          marketplace: ['recharts'],
          // Query and state management
          query: ['@tanstack/react-query'],
          // Date utilities
          dates: ['date-fns']
        },
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId;
          const moduleName = facadeModuleId ? 
            facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') || 'chunk' : 
            'chunk';
          return `js/${moduleName}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Optimize build performance
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    // Set chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select'
    ],
    exclude: ['lucide-react']
  },
  // Enable experimental features for better performance
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Strip console logs in production for better performance
    drop: command === 'build' ? ['console', 'debugger'] : []
  }
}));

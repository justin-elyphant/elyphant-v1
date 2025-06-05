
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
    // Optimize bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for large libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
          marketplace: [
            'src/components/marketplace',
            'src/contexts/ProductContext',
            'src/services/enhancedZincApiService'
          ]
        },
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? 
            chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '') : 
            'chunk';
          return `js/${facadeModuleId}-[hash].js`;
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
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}));

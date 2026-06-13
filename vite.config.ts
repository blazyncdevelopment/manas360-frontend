import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'

const hmrProtocol = (process.env.VITE_HMR_PROTOCOL as 'ws' | 'wss' | undefined) || 'ws'
const hmrHost = process.env.VITE_HMR_HOST || undefined
const hmrPort = Number(process.env.VITE_HMR_PORT || process.env.PORT || 4501)
const hmrClientPort = Number(process.env.VITE_HMR_CLIENT_PORT || process.env.VITE_HMR_PORT || process.env.PORT || 4501)

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils.tsx'],
  },
  server: {
  host: '0.0.0.0',
  port: Number(process.env.PORT || 4501),
    strictPort: true,
    allowedHosts: true, // ✅ CORRECT: Must be boolean true, not 'all'
    open: false,
    cors: true,
    hmr: {
      // Explicit HMR websocket settings fix common localhost/proxy websocket failures.
      protocol: hmrProtocol,
      // Keep host undefined by default so browser hostname is used (works for localhost/LAN/tunnels).
      host: hmrHost,
      port: hmrPort,
      clientPort: hmrClientPort,
    },
    proxy: {
      '/api': {
        // Backend runs on port 4000 locally. Change VITE_BACKEND_URL in .env.local to override.
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Use esbuild minifier which is faster and avoids some terser hoisting bugs
    // that can surface as "Cannot access 'l' before initialization" in bundled
    // vendor chunks for certain chart libraries.
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      onwarn(warning, warn) {
        const message = String(warning?.message || '')
        const source = String((warning as any)?.id || '')
        const isReactHelmetPureAnnotationWarning =
          warning?.code === 'INVALID_ANNOTATION' &&
          source.includes('react-helmet-async/lib/index.module.js') &&
          message.includes('annotation that Rollup cannot interpret')

        // Known upstream package annotation placement warning; safe to ignore.
        if (isReactHelmetPureAnnotationWarning) return
        warn(warning)
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('@tanstack/react-query')) return 'vendor-query'
            if (id.includes('firebase')) return 'vendor-firebase'
            if (id.includes('axios')) return 'vendor-network'
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) return 'vendor-date'
            if (id.includes('framer-motion')) return 'vendor-motion'
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('pdfmake')) return 'vendor-pdf'
            if (id.includes('agora-rtc-sdk-ng')) return 'vendor-agora'
            // Avoid splitting lucide-react into a separate chunk to prevent cross-chunk circular
            // execution order issues in production that cause "TypeError: Cannot read properties of undefined (reading 'forwardRef')".
            // Keep it in the main 'vendor' chunk alongside React.
            // if (id.includes('lucide-react')) return 'vendor-icons'
            // Avoid creating a separate 'vendor-charts' chunk — keep chart libraries
            // in the generic vendor bundle to prevent problematic minification
            // ordering that can cause runtime ReferenceErrors in certain builds.
            if (id.includes('socket.io') || id.includes('engine.io')) return 'vendor-realtime'
            if (id.includes('pdfkit')) return 'vendor-pdf'
            return 'vendor'
          }

          // Let Rollup decide app-source chunking to avoid circular chunk
          // dependencies between page/component groups.
        },
      },
    },
    chunkSizeWarningLimit: 1400,
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT || 4501),
    strictPort: true,
    allowedHosts: true, // ✅ CORRECT: Must be boolean true, not 'all'
    cors: true,
  },
})

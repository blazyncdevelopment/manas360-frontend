import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  const hmrProtocol = (env.VITE_HMR_PROTOCOL as 'ws' | 'wss' | undefined) || 'ws'
  const hmrHost = env.VITE_HMR_HOST || undefined
  const hmrPort = Number(env.VITE_HMR_PORT || env.PORT || 5173)
  const hmrClientPort = Number(env.VITE_HMR_CLIENT_PORT || env.VITE_HMR_PORT || env.PORT || 5173)

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [
      react(),
      Sitemap({
        hostname: 'https://manas360.com',
        robots: [{ userAgent: '*', allow: '/' }],
        dynamicRoutes: [
          '/',
          '/about',
          '/contact',
          '/how-it-works',
          '/intro',
          '/landing',
          '/plans',
          '/crisis',
          '/specialized-care',
          '/blogs'
        ]
      })
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test-utils.tsx'],
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.PORT || 5173),
      strictPort: true,
      allowedHosts: true,
      open: false,
      cors: true,
      hmr: {
        protocol: hmrProtocol,
        host: hmrHost,
        port: hmrPort,
        clientPort: hmrClientPort,
      },
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:4502',
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
      port: Number(env.PORT || 5173),
      strictPort: true,
      allowedHosts: true,
      cors: true,
    },
  }
})

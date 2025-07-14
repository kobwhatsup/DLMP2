import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@services': resolve(__dirname, 'src/services'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@types': resolve(__dirname, 'src/types'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@hooks': resolve(__dirname, 'src/hooks'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url)
          })
        }
      }
    }
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // 第三方库分包策略
          if (id.includes('node_modules')) {
            // React核心包
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            // Ant Design
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'antd-vendor'
            }
            // 图表库
            if (id.includes('echarts') || id.includes('chart')) {
              return 'chart-vendor'
            }
            // 工具库
            if (id.includes('lodash') || id.includes('dayjs') || id.includes('axios')) {
              return 'utils-vendor'
            }
            // 其他第三方库
            return 'vendor'
          }
          // 业务代码分包
          if (id.includes('/src/pages/')) {
            const dirs = id.split('/src/pages/')[1].split('/')
            return `page-${dirs[0]}`
          }
          if (id.includes('/src/components/')) {
            return 'components'
          }
          if (id.includes('/src/utils/') || id.includes('/src/hooks/')) {
            return 'shared'
          }
        }
      },
      external: (id) => {
        // CDN外部化的包
        if (process.env.VITE_USE_CDN === 'true') {
          return ['react', 'react-dom', 'antd'].includes(id)
        }
        return false
      }
    },
    // 构建优化
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
    reportCompressedSize: false
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
})
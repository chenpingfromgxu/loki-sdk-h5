import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5174, // 使用不同的端口避免冲突
    proxy: {
      // 代理SDK的Loki请求，解决CORS问题
      '/api/loki': {
        target: 'http://47.77.196.223:3100',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/loki/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      // 直接引用 SDK 源码，不依赖发布的包
      '@ppyuesheng/loki-sdk-h5-core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@ppyuesheng/loki-sdk-h5-transport-loki': resolve(__dirname, '../../packages/transport-loki/src/index.ts'),
      '@ppyuesheng/loki-sdk-h5-adapter-js': resolve(__dirname, '../../packages/adapter-js/src/index.ts'),
      '@ppyuesheng/loki-sdk-h5-adapter-vue': resolve(__dirname, '../../packages/adapter-vue/src/index.ts'),
      '@ppyuesheng/loki-sdk-h5-adapter-rn': resolve(__dirname, '../../packages/adapter-rn/src/index.ts'),
    },
  },
  optimizeDeps: {
    include: [
      // 预构建 SDK 源码
      '../../packages/core/src/index.ts',
      '../../packages/transport-loki/src/index.ts',
      '../../packages/adapter-js/src/index.ts',
      '../../packages/adapter-vue/src/index.ts',
      '../../packages/adapter-rn/src/index.ts',
    ],
  },
});

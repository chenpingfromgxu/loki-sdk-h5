import { defineConfig } from 'vite';

export default defineConfig({
  server: {
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
});
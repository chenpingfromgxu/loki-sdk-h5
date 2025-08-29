/**
 * CORS代理服务 - 解决SDK到Loki的CORS问题
 * 
 * 部署方式：
 * 1. 部署到云服务（如Vercel、Netlify、阿里云等）
 * 2. 或者部署到自己的服务器
 * 
 * 使用方法：
 * 在SDK配置中设置：
 * {
 *   transportMode: 'cors-proxy',
 *   corsProxyUrl: 'https://your-cors-proxy-domain.com'
 * }
 */

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// 基础CORS配置
app.use(cors({
  origin: '*', // 生产环境建议限制具体域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

// 速率限制 - 防止滥用
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
});

app.use(limiter);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'loki-cors-proxy'
  });
});

// 代理端点 - 支持查询参数指定目标
app.use('/proxy', createProxyMiddleware({
  target: 'http://localhost:3001', // 默认目标，会被查询参数覆盖
  changeOrigin: true,
  pathRewrite: {
    '^/proxy': '' // 移除/proxy前缀
  },
  onProxyReq: (proxyReq, req, res) => {
    // 从查询参数获取目标URL
    const target = req.query.target;
    if (target) {
      try {
        const targetUrl = new URL(target);
        proxyReq.setHeader('Host', targetUrl.host);
        // 更新代理目标
        proxyReq.path = targetUrl.pathname + targetUrl.search;
      } catch (error) {
        console.error('Invalid target URL:', target);
        res.status(400).json({ error: 'Invalid target URL' });
        return;
      }
    }
    
    // 添加安全头
    proxyReq.setHeader('X-Forwarded-By', 'loki-cors-proxy');
    proxyReq.setHeader('User-Agent', 'Loki-SDK-CORS-Proxy/1.0');
  },
  onProxyRes: (proxyRes, req, res) => {
    // 确保CORS头被正确设置
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ 
      error: '代理服务错误',
      message: err.message 
    });
  }
}));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后再试'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: '接口不存在',
    available: ['/health', '/proxy']
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CORS代理服务启动成功`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
  console.log(`📡 代理端点: http://localhost:${PORT}/proxy?target=<loki-url>`);
});

module.exports = app;

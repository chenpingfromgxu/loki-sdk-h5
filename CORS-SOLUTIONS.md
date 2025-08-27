# SDK-H5 CORS跨域问题解决方案

当SDK直连Loki时出现CORS错误是常见问题。以下提供了多种解决方案。

## 问题原因

浏览器的同源策略限制了从一个域向另一个域发送HTTP请求。当前端应用向Loki服务发送日志时，如果两者不在同一域名下，就会出现CORS错误。

## 解决方案

### 方案1：Nginx反向代理（推荐）

#### 1.1 Nginx配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端应用
    location / {
        root /path/to/your/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Loki代理端点
    location /api/loki/ {
        rewrite ^/api/loki/(.*) /$1 break;
        
        proxy_pass http://47.77.196.223:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS头设置
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
        add_header Access-Control-Max-Age 86400 always;
        
        # 处理预检请求
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
}
```

#### 1.2 SDK配置（代理模式）

```typescript
import { sdkH5, installAutoCapture } from '@sdk-h5/core';

sdkH5.init({
  appName: 'your-app',
  environment: 'prod',
  endpoints: { 
    loki: 'unused-in-proxy-mode' 
  },
  // 启用代理模式
  useProxy: true,
  proxyPath: '/api/loki',
  corsMode: 'same-origin'
});

installAutoCapture(sdkH5);
```

### 方案2：Node.js/Express后端代理

#### 2.1 Express代理中间件

```javascript
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// 启用CORS
app.use(cors());

// Loki代理
app.use('/api/loki', createProxyMiddleware({
  target: 'http://47.77.196.223:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/loki': ''
  },
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With';
  }
}));

app.listen(3000);
```

#### 2.2 SDK配置

```typescript
sdkH5.init({
  appName: 'your-app',
  endpoints: { loki: 'unused' },
  useProxy: true,
  proxyPath: '/api/loki'
});
```

### 方案3：Vite开发代理

#### 3.1 vite.config.ts

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api/loki': {
        target: 'http://47.77.196.223:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/loki/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
          });
        }
      }
    }
  }
});
```

#### 3.2 SDK配置

```typescript
sdkH5.init({
  appName: 'your-app',
  endpoints: { loki: 'unused' },
  useProxy: true,
  proxyPath: '/api/loki'
});
```

### 方案4：直连模式 + Loki CORS配置（不推荐）

如果你可以控制Loki服务器，可以配置Loki允许CORS：

#### 4.1 Loki配置

```yaml
# loki.yaml
server:
  http_listen_port: 3100
  grpc_listen_port: 9096
  # 添加CORS配置
  http_server_read_timeout: 30s
  http_server_write_timeout: 30s
  
# 在Loki前面加Nginx或API Gateway处理CORS
```

#### 4.2 SDK配置

```typescript
sdkH5.init({
  appName: 'your-app',
  endpoints: { 
    loki: 'http://47.77.196.223:3001/loki/api/v1/push' 
  },
  corsMode: 'cors' // 默认值
});
```

## SDK新增CORS相关配置

SDK现在支持以下CORS相关配置：

```typescript
type SdkH5Config = {
  // ... 其他配置
  
  // CORS模式
  corsMode?: "cors" | "no-cors" | "same-origin"; // 默认 "cors"
  
  // 是否使用代理模式
  useProxy?: boolean; // 默认 false
  
  // 代理路径前缀
  proxyPath?: string; // 默认 "/api/loki"
}
```

## 推荐配置

### 开发环境
使用Vite代理（方案3）

### 生产环境  
使用Nginx反向代理（方案1）

### 临时测试
使用Express代理（方案2）

## 故障排查

1. **检查浏览器控制台错误**
   - CORS错误通常显示 "Access to fetch at ... has been blocked by CORS policy"

2. **检查网络请求**
   - 查看是否有OPTIONS预检请求
   - 检查响应头是否包含正确的CORS头

3. **验证代理配置**
   - 确认代理路径是否正确
   - 测试代理端点是否可访问

4. **SDK配置检查**
   - 确认 `useProxy: true` 时 `endpoints.loki` 被忽略
   - 检查 `proxyPath` 配置是否与代理配置匹配

## 示例完整配置

### Nginx + SDK代理模式

```nginx
# nginx.conf
location /api/loki/ {
    rewrite ^/api/loki/(.*) /$1 break;
    proxy_pass http://your-loki-server:3100;
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type" always;
}
```

```typescript
// SDK配置
sdkH5.init({
  appName: 'production-app',
  environment: 'prod',
  endpoints: { loki: 'unused' },
  useProxy: true,
  proxyPath: '/api/loki',
  corsMode: 'same-origin'
});
```

这样配置后，SDK会向 `/api/loki/loki/api/v1/push` 发送请求，Nginx会将其代理到实际的Loki服务，完全避免了CORS问题。
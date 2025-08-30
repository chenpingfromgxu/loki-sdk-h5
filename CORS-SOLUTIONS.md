# CORS 解决方案指南

## 🎯 概述

在使用 Loki SDK 时，可能会遇到 CORS（跨域资源共享）问题。本文档提供了多种解决方案，从简单到复杂，帮助您在不同环境下成功推送日志到 Loki 服务器。

## 🚀 推荐方案：智能 CORS 策略（1.0.0+）

**SDK 1.0.0 版本引入了智能 CORS 策略，这是最推荐的解决方案。**

### 配置示例

```typescript
import { sdkH5, installAutoCapture } from '@ppyuesheng/loki-sdk-h5-core';

sdkH5.init({
  appName: 'my-app',
  environment: 'prod',
  endpoints: { 
    loki: 'http://your-loki-server:3100'
  },
  // 🎯 智能 CORS 策略 - 自动处理所有 CORS 问题
  corsStrategy: 'auto',
  enableBeaconFallback: true,
  enableOfflineQueue: true,
  onError: (err) => console.error('SDK Error:', err)
});

installAutoCapture(sdkH5);
```

### 工作原理

智能 CORS 策略会按以下顺序尝试发送日志：

1. **直接发送**：首先尝试直接发送到 Loki 服务器（如果服务器支持 CORS）
2. **Beacon 发送**：如果直接发送失败，使用 `navigator.sendBeacon`（绕过 CORS 限制）
3. **代理发送**：如果 Beacon 也失败，尝试通过配置的代理发送
4. **离线队列**：如果所有方式都失败，将数据存储在本地，等待下次发送

### 策略选项

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `auto` | 自动选择最佳方式（推荐） | 生产环境 |
| `beacon` | 仅使用 Beacon API | 简单场景 |
| `proxy` | 仅使用代理模式 | 有代理服务器 |
| `direct` | 仅直接发送 | Loki 支持 CORS |
| `fallback` | 依次尝试所有方式 | 兼容性要求高 |

## 🔧 其他解决方案

### 1. 开发环境：Vite 代理

在开发环境中，可以使用 Vite 的代理功能：

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api/loki': {
        target: 'http://your-loki-server:3100',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/loki/, ''),
      },
    },
  },
});
```

然后配置 SDK：

```typescript
sdkH5.init({
  appName: 'my-app',
  endpoints: { loki: 'http://your-loki-server:3100' },
  corsStrategy: 'proxy',
  proxyPath: '/api/loki'
});
```

### 2. 生产环境：Nginx 反向代理

在生产环境中，推荐使用 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/loki/ {
        # 处理 OPTIONS 预检请求
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # 代理到 Loki
        proxy_pass http://your-loki-server:3100/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 添加 CORS 头
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
    }
}
```

### 3. Node.js 代理服务

如果需要更灵活的控制，可以创建自定义的 Node.js 代理服务：

```javascript
// cors-proxy.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// 启用 CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 代理到 Loki
app.use('/loki', createProxyMiddleware({
  target: 'http://your-loki-server:3100',
  changeOrigin: true,
  pathRewrite: {
    '^/loki': ''
  }
}));

app.listen(3000, () => {
  console.log('CORS proxy running on port 3000');
});
```

## 📊 方案对比

| 方案 | 复杂度 | 可靠性 | 维护成本 | 推荐度 |
|------|--------|--------|----------|--------|
| 智能 CORS 策略 | ⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| Vite 代理 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Nginx 代理 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Node.js 代理 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

## 🛠️ 故障排除

### 常见错误

1. **405 Method Not Allowed**
   - 原因：Loki 服务器不支持 OPTIONS 预检请求
   - 解决：使用智能 CORS 策略或配置代理

2. **CORS 错误**
   - 原因：浏览器阻止跨域请求
   - 解决：使用 Beacon API 或代理

3. **网络错误**
   - 原因：网络连接问题
   - 解决：启用离线队列功能

### 调试技巧

1. **检查浏览器控制台**
   ```javascript
   sdkH5.init({
     onError: (err) => {
       console.error('SDK Error:', err);
       // 查看详细错误信息
     }
   });
   ```

2. **监控网络请求**
   - 在浏览器开发者工具的 Network 面板中查看请求
   - 检查请求头和响应头

3. **测试不同策略**
   ```javascript
   // 测试直接模式
   corsStrategy: 'direct'
   
   // 测试 Beacon 模式
   corsStrategy: 'beacon'
   
   // 测试代理模式
   corsStrategy: 'proxy'
   ```

## 📝 最佳实践

1. **生产环境**：使用智能 CORS 策略（`corsStrategy: 'auto'`）
2. **开发环境**：使用 Vite 代理或智能 CORS 策略
3. **高可靠性要求**：启用离线队列（`enableOfflineQueue: true`）
4. **性能优化**：启用 Beacon 降级（`enableBeaconFallback: true`）

## 🔄 升级指南

### 从旧版本升级

如果您使用的是 SDK 0.x 版本，建议升级到 1.0.0+ 并使用智能 CORS 策略：

```typescript
// 旧版本配置
sdkH5.init({
  transportMode: 'proxy',
  proxyPath: '/api/loki',
  corsMode: 'same-origin'
});

// 新版本配置（推荐）
sdkH5.init({
  corsStrategy: 'auto',
  enableBeaconFallback: true,
  enableOfflineQueue: true
});
```

智能 CORS 策略会自动处理所有 CORS 问题，无需手动配置代理或担心兼容性问题。

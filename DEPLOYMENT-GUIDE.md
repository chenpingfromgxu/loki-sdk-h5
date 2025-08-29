# Loki SDK H5 部署指南

## 问题背景

由于浏览器的同源策略（CORS），前端应用无法直接向不同域的Loki服务器发送请求。本指南提供了多种解决方案，用户可以根据自己的部署环境选择最适合的方式。

## 解决方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **直接模式** | 配置简单，性能最好 | 需要Loki服务器支持CORS | Loki服务器已配置CORS |
| **本地代理** | 完全控制，安全性高 | 需要配置Nginx等 | 有服务器控制权 |
| **CORS代理服务** | 零配置，即开即用 | 依赖第三方服务 | 快速部署，无服务器 |

## 方案1: 直接模式（推荐用于开发环境）

### 适用条件
- Loki服务器已正确配置CORS头
- 或者使用开发环境的代理（如Vite、Webpack等）

### 配置示例
```javascript
sdkH5.init({
  appName: 'my-app',
  environment: 'dev',
  endpoints: { 
    loki: 'http://your-loki-server:3100'
  },
  transportMode: 'direct',
  corsMode: 'cors',
  onError: (err) => {
    console.error('SDK Error:', err);
  }
});
```

### Loki服务器CORS配置
如果使用Grafana Loki，可以在配置文件中添加：
```yaml
server:
  http_listen_port: 3100
  cors:
    allowed_origins:
      - "*"  # 生产环境建议限制具体域名
    allowed_methods:
      - GET
      - POST
      - PUT
      - DELETE
      - OPTIONS
    allowed_headers:
      - Content-Type
      - Authorization
      - X-Requested-With
```

## 方案2: 本地代理模式

### 适用条件
- 有自己的服务器或云服务器
- 可以配置Nginx、Apache等反向代理

### 配置示例
```javascript
sdkH5.init({
  appName: 'my-app',
  environment: 'prod',
  endpoints: { 
    loki: 'http://your-loki-server:3100'
  },
  transportMode: 'proxy',
  proxyPath: '/api/loki',
  corsMode: 'same-origin',
  onError: (err) => {
    console.error('SDK Error:', err);
  }
});
```

### Nginx配置
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
        proxy_pass http://your-loki-server:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS头
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

## 方案3: CORS代理服务（推荐用于生产环境）

### 适用条件
- 希望零配置部署
- 无服务器控制权
- 快速上线需求

### 配置示例

#### 自动检测模式（推荐）
```javascript
sdkH5.init({
  appName: 'my-app',
  environment: 'prod',
  endpoints: { 
    loki: 'http://your-loki-server:3100'
  },
  transportMode: 'cors-proxy',
  // autoDetectCorsProxy: true, // 默认true，可省略
  corsMode: 'cors',
  onError: (err) => {
    console.error('SDK Error:', err);
  }
});
```

#### 手动指定模式
```javascript
sdkH5.init({
  appName: 'my-app',
  environment: 'prod',
  endpoints: { 
    loki: 'http://your-loki-server:3100'
  },
  transportMode: 'cors-proxy',
  corsProxyUrl: 'https://your-cors-proxy-domain.com',
  autoDetectCorsProxy: false,
  corsMode: 'cors',
  onError: (err) => {
    console.error('SDK Error:', err);
  }
});
```

### 部署CORS代理服务

#### 自动检测规则
SDK会根据当前环境自动检测CORS代理服务URL：

**开发环境检测**（自动使用 `http://localhost:3000`）：
- `localhost` 或 `127.0.0.1`
- 开发端口：`3000`, `3001`, `5173`, `5174`, `8080`, `8081`, `4200`, `4201`
- 开发域名：`.local`, `.dev`, `.test`, `dev.`, `staging.`
- 环境变量：`NODE_ENV=development` 或 `NODE_ENV=dev`

**生产环境检测**（自动使用 `https://cors-proxy.{域名}`）：
- `https://example.com` → `https://cors-proxy.example.com`
- `https://app.example.com` → `https://cors-proxy.example.com`
- `https://www.example.com` → `https://cors-proxy.example.com`

#### 方式1: 部署到Vercel（推荐）
1. 创建Vercel项目
2. 上传`cors-proxy-server.js`和`cors-proxy-package.json`
3. 部署后获得域名如：`https://your-proxy.vercel.app`

#### 方式2: 部署到Netlify
1. 创建Netlify项目
2. 上传代理服务文件
3. 配置构建命令和发布目录

#### 方式3: 部署到自己的服务器
```bash
# 安装依赖
npm install

# 启动服务
npm start

# 使用PM2管理进程
pm2 start cors-proxy-server.js --name "loki-cors-proxy"
```

### 公共CORS代理服务
你也可以使用我们提供的公共CORS代理服务：
```javascript
corsProxyUrl: 'https://loki-cors-proxy.vercel.app'
```

## 方案4: 混合模式（智能选择）

### 配置示例
```javascript
// 根据环境自动选择最佳传输模式
const isDev = process.env.NODE_ENV === 'development';
const hasProxy = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

sdkH5.init({
  appName: 'my-app',
  environment: isDev ? 'dev' : 'prod',
  endpoints: { 
    loki: 'http://your-loki-server:3100'
  },
  // 开发环境使用代理，生产环境使用CORS代理服务
  transportMode: isDev ? 'proxy' : 'cors-proxy',
  proxyPath: '/api/loki',
  corsProxyUrl: 'https://your-cors-proxy-domain.com',
  corsMode: isDev ? 'same-origin' : 'cors',
  onError: (err) => {
    console.error('SDK Error:', err);
  }
});
```

## 安全考虑

### 1. CORS代理服务安全
- 限制允许的域名
- 添加速率限制
- 监控异常请求
- 使用HTTPS

### 2. 本地代理安全
- 限制代理路径
- 添加认证机制
- 监控访问日志

### 3. 直接模式安全
- 限制Loki服务器的CORS配置
- 使用防火墙保护Loki服务
- 定期更新Loki版本

## 故障排除

### 常见错误及解决方案

#### 1. CORS错误
```
Access to fetch at 'http://loki-server:3100/loki/api/v1/push' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**解决方案**: 使用代理模式或CORS代理服务

#### 2. 网络错误
```
Failed to fetch: NetworkError when attempting to fetch resource
```
**解决方案**: 检查网络连接和防火墙设置

#### 3. 代理服务错误
```
Proxy error: ECONNREFUSED
```
**解决方案**: 检查Loki服务器是否正常运行

### 调试技巧
1. 打开浏览器开发者工具查看网络请求
2. 检查控制台错误信息
3. 验证Loki服务器端点是否可访问
4. 测试代理服务是否正常工作

## 最佳实践

1. **开发环境**: 使用本地代理或直接模式
2. **生产环境**: 使用CORS代理服务或本地代理
3. **安全要求高**: 使用本地代理模式
4. **快速部署**: 使用CORS代理服务
5. **成本敏感**: 使用直接模式（需要Loki支持CORS）

## 总结

通过提供多种传输模式，用户可以根据自己的部署环境和需求选择最适合的解决方案：

- **零配置**: 使用CORS代理服务
- **完全控制**: 使用本地代理模式  
- **最佳性能**: 使用直接模式
- **灵活部署**: 使用混合模式

这样既解决了CORS问题，又给用户提供了最大的灵活性。

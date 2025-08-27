# SDK发布和使用指南

## 📦 发布方案

### 方案1：GitHub Packages（推荐）

#### 自动发布
每次推送到 `main` 或 `feature-dev` 分支时，GitHub Actions会自动：
1. 构建所有包
2. 自动生成版本号（基于git commit数量）
3. 发布到GitHub Packages

#### 手动发布
也可以手动触发发布：
1. 进入仓库的Actions页面
2. 选择"Publish SDK Packages"工作流
3. 点击"Run workflow"

### 方案2：简单文件服务器

如果不想用GitHub Packages，可以搭建简单的文件服务器：

```bash
# 构建SDK
pnpm run build

# 创建发布目录
mkdir -p /var/www/sdk-releases/latest

# 复制构建产物
cp -r packages/*/dist /var/www/sdk-releases/latest/
```

## 🚀 在其他应用中使用

### 使用GitHub Packages

#### 1. 配置NPM认证

在你的应用项目中创建 `.npmrc` 文件：

```
@ppyuesheng.org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

#### 2. 安装SDK

```bash
# 安装核心包
npm install @ppyuesheng.org/sdk-h5-core

# 按需安装适配器
npm install @ppyuesheng.org/sdk-h5-adapter-js
npm install @ppyuesheng.org/sdk-h5-adapter-vue
```

#### 3. 使用示例

##### Vue 3应用
```typescript
import { sdkH5, installAutoCapture } from '@ppyuesheng.org/sdk-h5-core';
import { createSdkVuePlugin } from '@ppyuesheng.org/sdk-h5-adapter-vue';

// 初始化SDK（使用代理模式）
sdkH5.init({
  appName: 'my-vue-app',
  environment: 'prod',
  endpoints: { loki: 'unused-in-proxy-mode' },
  useProxy: true,
  proxyPath: '/api/loki',
  corsMode: 'same-origin'
});

// 安装自动错误捕获
installAutoCapture(sdkH5);

// Vue集成
const app = createApp(App);
app.use(createSdkVuePlugin(sdkH5));
```

##### 普通JS应用
```typescript
import { sdkH5, installAutoCapture } from '@ppyuesheng.org/sdk-h5-core';

sdkH5.init({
  appName: 'my-js-app',
  environment: 'prod',
  endpoints: { loki: 'unused-in-proxy-mode' },
  useProxy: true,
  proxyPath: '/api/loki'
});

installAutoCapture(sdkH5);

// 手动发送日志
sdkH5.log('info', 'User action', { action: 'click_button' });
```

### 使用CDN方式（UMD）

```html
<!-- 引入UMD构建版本 -->
<script src="https://your-cdn.com/sdk-h5.umd.js"></script>
<script>
  // 全局变量 sdkH5 可用
  sdkH5.init({
    appName: 'my-app',
    useProxy: true,
    proxyPath: '/api/loki'
  });
  sdkH5.installAutoCapture();
</script>
```

## 🔄 版本管理

### 版本号规则
- 主版本号：重大破坏性更改
- 次版本号：新功能添加
- 补丁版本号：bug修复

当前使用自动版本号：`1.0.{git_commit_count}`

### 更新依赖

```bash
# 更新到最新版本
npm update @ppyuesheng.org/sdk-h5-core

# 或指定版本
npm install @ppyuesheng.org/sdk-h5-core@1.0.25
```

## 🌐 生产环境代理配置

### Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-app.com;
    
    # 你的应用
    location / {
        root /var/www/your-app;
        try_files $uri $uri/ /index.html;
    }
    
    # SDK日志代理
    location /api/loki/ {
        rewrite ^/api/loki/(.*) /$1 break;
        proxy_pass http://47.77.196.223:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # CORS头
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;
        
        # 预检请求处理
        if ($request_method = OPTIONS) {
            return 204;
        }
    }
}
```

### Docker Compose示例

```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./dist:/var/www/your-app
  
  app:
    image: your-app:latest
    environment:
      - SDK_PROXY_PATH=/api/loki
```

## 📋 最佳实践

### 1. 环境配置
```typescript
const config = {
  appName: process.env.VUE_APP_NAME || 'my-app',
  environment: process.env.NODE_ENV as 'dev' | 'prod',
  useProxy: true,
  proxyPath: process.env.VUE_APP_LOG_PROXY || '/api/loki'
};
```

### 2. 错误边界
```typescript
sdkH5.init({
  // ...其他配置
  onError: (err) => {
    console.error('SDK Error:', err);
    // 可以发送到其他监控服务
  }
});
```

### 3. 开发环境调试
```typescript
if (process.env.NODE_ENV === 'development') {
  // 启用更详细的日志
  sdkH5.setContext({
    app: { version: process.env.VUE_APP_VERSION }
  });
}
```

## 🛠️ 故障排查

### 1. 包安装失败
- 检查GitHub token权限
- 确认`.npmrc`配置正确
- 尝试清除npm缓存：`npm cache clean --force`

### 2. 导入错误
- 确认包名正确：`@ppyuesheng.org/sdk-h5-core`
- 检查TypeScript配置
- 确保安装了所需的适配器包

### 3. 日志不上报
- 检查代理配置是否正确
- 验证网络请求路径
- 查看浏览器控制台错误信息

### 4. CORS问题
- 确认启用了代理模式：`useProxy: true`
- 检查服务器代理配置
- 验证代理路径匹配：`proxyPath`

## 📱 移动端使用

### React Native
```typescript
import { sdkH5 } from '@ppyuesheng.org/sdk-h5-core';
import { installRnGlobalHandlers } from '@ppyuesheng.org/sdk-h5-adapter-rn';

sdkH5.init({
  appName: 'my-rn-app',
  endpoints: { loki: 'https://your-api.com/loki/api/v1/push' },
  // RN环境通常直连，不需要代理
  useProxy: false
});

installRnGlobalHandlers(sdkH5);
```

### 混合应用（Cordova/Ionic）
```typescript
// 可以使用普通JS适配器
import { sdkH5, installAutoCapture } from '@ppyuesheng.org/sdk-h5-core';

sdkH5.init({
  appName: 'my-hybrid-app',
  // 根据平台选择配置
  useProxy: window.location.protocol === 'file:' ? false : true
});
```
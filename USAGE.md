# H5 SDK 使用指南

## 快速开始

### 1. 安装SDK

```bash
# 安装核心包
npm install @chenpingfromgxu/sdk-h5-core

# 按需安装适配器
npm install @chenpingfromgxu/sdk-h5-adapter-vue    # Vue应用
npm install @chenpingfromgxu/sdk-h5-adapter-js     # 普通JS应用
npm install @chenpingfromgxu/sdk-h5-adapter-rn     # React Native应用
```

### 2. 配置NPM认证

在项目根目录创建 `.npmrc` 文件：

```
@chenpingfromgxu:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

### 3. 使用示例

#### Vue 3 应用
```typescript
import { sdkH5, installAutoCapture } from '@chenpingfromgxu/sdk-h5-core';
import { createSdkVuePlugin } from '@chenpingfromgxu/sdk-h5-adapter-vue';

// 初始化SDK
sdkH5.init({
  appName: 'my-vue-app',
  environment: 'prod',
  useProxy: true,
  proxyPath: '/api/loki'
});

// 安装自动错误捕获
installAutoCapture(sdkH5);

// Vue集成
const app = createApp(App);
app.use(createSdkVuePlugin(sdkH5));
```

#### 普通JS应用
```typescript
import { sdkH5, installAutoCapture } from '@chenpingfromgxu/sdk-h5-core';

sdkH5.init({
  appName: 'my-js-app',
  environment: 'prod',
  useProxy: true,
  proxyPath: '/api/loki'
});

installAutoCapture(sdkH5);

// 手动发送日志
sdkH5.log('info', 'User action', { action: 'click_button' });
```

#### React Native应用
```typescript
import { sdkH5 } from '@chenpingfromgxu/sdk-h5-core';
import { installRnGlobalHandlers } from '@chenpingfromgxu/sdk-h5-adapter-rn';

sdkH5.init({
  appName: 'my-rn-app',
  endpoints: { loki: 'https://your-api.com/loki/api/v1/push' },
  useProxy: false
});

installRnGlobalHandlers(sdkH5);
```

## 配置说明

### 核心配置
- `appName`: 应用名称
- `environment`: 环境（'dev' | 'prod'）
- `useProxy`: 是否使用代理模式
- `proxyPath`: 代理路径（如：'/api/loki'）

### 代理模式
推荐使用代理模式避免CORS问题，需要在服务器配置代理：

```nginx
location /api/loki/ {
    rewrite ^/api/loki/(.*) /$1 break;
    proxy_pass http://your-loki-server:3100;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 更多信息

- [完整文档](./README.md)
- [发布指南](./PUBLISH-GUIDE.md)
- [迁移指南](./MIGRATION-GUIDE.md)
- [CORS解决方案](./CORS-SOLUTIONS.md)

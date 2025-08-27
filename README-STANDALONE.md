# SDK-H5

<div align="center">

[![npm version](https://img.shields.io/npm/v/@chenpingfromgxu/sdk-h5-core.svg)](https://npm.pkg.github.com/package/@chenpingfromgxu/sdk-h5-core)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/chenpingfromgxu/sdk-h5/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**轻量级前端错误采集和日志上报SDK**

🚀 开箱即用 | 📦 模块化设计 | 🔒 隐私安全 | 🌐 跨平台支持

</div>

## ✨ 特性

- **🎯 轻量级**: 核心包仅 ~10KB，按需加载适配器
- **🔧 易集成**: 一行代码完成初始化，支持多种框架
- **🛡️ 可靠传输**: 批量上报 + 重试机制 + 离线缓存
- **🔒 隐私保护**: 数据脱敏 + 采样控制 + 自定义过滤
- **🌐 跨平台**: 支持 Web、Vue、React Native
- **⚡ 高性能**: 异步处理 + 智能防抖 + 内存优化

## 🚀 快速开始

### 安装

```bash
# NPM
npm install @chenpingfromgxu/sdk-h5-core

# 按需安装适配器
npm install @chenpingfromgxu/sdk-h5-adapter-vue
npm install @chenpingfromgxu/sdk-h5-adapter-js
```

### 基础使用

```typescript
import { sdkH5, installAutoCapture } from '@chenpingfromgxu/sdk-h5-core';

// 初始化SDK
sdkH5.init({
  appName: 'my-awesome-app',
  environment: 'production',
  endpoints: { loki: 'https://loki.example.com/loki/api/v1/push' }
});

// 启用自动错误捕获
installAutoCapture(sdkH5);

// 手动发送日志
sdkH5.log('info', '用户操作', { action: 'click_button', page: '/home' });
```

### Vue 3集成

```typescript
import { createApp } from 'vue';
import { sdkH5, installAutoCapture } from '@chenpingfromgxu/sdk-h5-core';
import { createSdkVuePlugin } from '@chenpingfromgxu/sdk-h5-adapter-vue';

// 初始化SDK
sdkH5.init({
  appName: 'vue-app',
  environment: 'production',
  endpoints: { loki: 'https://loki.example.com/loki/api/v1/push' }
});

installAutoCapture(sdkH5);

// Vue应用集成
const app = createApp(App);
app.use(createSdkVuePlugin(sdkH5));
app.mount('#app');
```

## 📖 文档

- [📚 完整文档](./docs/guide.md)
- [🔧 API参考](./docs/api.md)
- [🌐 CORS解决方案](./docs/cors-solutions.md)
- [📦 迁移指南](./docs/migration.md)
- [💡 示例项目](./examples/)

## 🎯 核心功能

### 自动错误捕获

```typescript
// 自动捕获以下错误类型：
// ✅ JavaScript运行时错误
// ✅ 未处理的Promise拒绝  
// ✅ 资源加载失败
// ✅ Vue组件错误（需适配器）
// ✅ React组件错误（需适配器）

installAutoCapture(sdkH5);
```

### 手动日志记录

```typescript
// 不同级别的日志
sdkH5.log('debug', '调试信息', { userId: 123 });
sdkH5.log('info', '用户登录', { method: 'email' });
sdkH5.log('warn', '性能警告', { loadTime: 3000 });
sdkH5.log('error', '操作失败', { error: 'network_timeout' });

// 错误捕获
try {
  riskyOperation();
} catch (error) {
  sdkH5.captureError(error, { context: 'user_action' });
}
```

### 上下文管理

```typescript
// 设置用户信息
sdkH5.setUser('user-123');

// 设置全局上下文
sdkH5.setContext({
  app: { version: '2.1.0' },
  user: { role: 'admin' },
  page: { section: 'dashboard' }
});
```

## ⚙️ 配置选项

```typescript
sdkH5.init({
  // 基础配置
  appName: 'my-app',                    // 应用名称
  appVersion: '1.0.0',                  // 应用版本
  environment: 'production',            // 环境：dev/test/staging/prod
  
  // 传输配置
  endpoints: { 
    loki: 'https://loki.example.com/loki/api/v1/push'
  },
  
  // 性能配置
  batchMaxRecords: 100,                 // 批量大小
  flushIntervalMs: 5000,                // 上报间隔
  maxRetries: 3,                        // 重试次数
  
  // 采样和限流
  sampleRate: 1.0,                      // 采样率 (0-1)
  rateLimitPerMin: 300,                 // 每分钟限制
  
  // 隐私保护
  redact: {
    urlQuery: true,                     // 移除URL查询参数
    headers: ['authorization'],         // 过滤敏感头
    custom: (envelope) => {             // 自定义过滤器
      // 返回null丢弃，返回修改后的envelope保留
      return envelope;
    }
  },
  
  // 离线支持
  enableOfflineBuffer: true,            // 启用离线缓存
  useSendBeacon: true,                  // 页面卸载时使用sendBeacon
  
  // 错误处理
  onError: (err) => {
    console.error('SDK Error:', err);
  }
});
```

## 🌐 CORS解决方案

生产环境推荐使用代理模式避免CORS问题：

```typescript
// SDK配置
sdkH5.init({
  appName: 'my-app',
  useProxy: true,                       // 启用代理模式
  proxyPath: '/api/loki',              // 代理路径
  corsMode: 'same-origin'              // 同源模式
});
```

```nginx
# Nginx代理配置
location /api/loki/ {
    rewrite ^/api/loki/(.*) /$1 break;
    proxy_pass http://your-loki-server:3100;
    
    # CORS headers
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type" always;
}
```

详细CORS解决方案请查看：[CORS Solutions](./docs/cors-solutions.md)

## 📦 包结构

| 包名 | 描述 | 大小 |
|------|------|------|
| `@chenpingfromgxu/sdk-h5-core` | 核心SDK功能 | ~10KB |
| `@chenpingfromgxu/sdk-h5-transport-loki` | Loki传输层 | ~3KB |
| `@chenpingfromgxu/sdk-h5-adapter-js` | 原生JS适配器 | ~1KB |
| `@chenpingfromgxu/sdk-h5-adapter-vue` | Vue.js适配器 | ~1KB |
| `@chenpingfromgxu/sdk-h5-adapter-rn` | React Native适配器 | ~1KB |

## 🔧 开发

```bash
# 克隆仓库
git clone https://github.com/chenpingfromgxu/sdk-h5.git
cd sdk-h5

# 安装依赖
pnpm install

# 构建所有包
pnpm run build

# 运行示例
cd examples/vanilla-js
pnpm run dev

# 运行测试
pnpm run test

# 代码检查
pnpm run lint
```

## 🌟 示例项目

- [Vanilla JS](./examples/vanilla-js/) - 原生JavaScript使用
- [Vue 3](./examples/vue3/) - Vue 3 + Vite
- [React](./examples/react/) - React + Webpack  
- [Nuxt](./examples/nuxt/) - Nuxt.js全栈
- [React Native](./examples/react-native/) - RN移动应用

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](./CONTRIBUTING.md) 了解详情。

### 开发流程

1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE)。

## 🆘 支持

- 📖 [文档中心](./docs/)
- 🐛 [问题反馈](https://github.com/chenpingfromgxu/sdk-h5/issues)
- 💬 [讨论区](https://github.com/chenpingfromgxu/sdk-h5/discussions)

## 🗺️ 路线图

- [ ] 📱 支持更多前端框架（Angular、Svelte）
- [ ] 🔍 Source Maps集成
- [ ] 📊 性能监控功能
- [ ] 🔄 更多传输方式（OTLP、Sentry）
- [ ] 📈 实时监控面板
- [ ] 🛡️ 更强的隐私保护功能

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star！**

Made with ❤️ by [chenpingfromgxu](https://github.com/chenpingfromgxu)

</div>
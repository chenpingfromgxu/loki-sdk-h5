# sdk-h5：前端错误与日志采集 SDK

<div align="center">

**轻量级前端错误采集和日志上报SDK**

🚀 开箱即用 | 📦 模块化设计 | 🔒 隐私安全 | 🌐 跨平台支持

</div>

一个轻量、易接入的 H5/Web SDK（包含 Vue 适配器与 RN 基础支持），用于自动捕获常见前端错误，同时提供简单的手动日志能力，将数据直接推送到 Loki 的 `/loki/api/v1/push` 接口。

## ✨ 特性

- **🎯 轻量级**: 核心包仅 ~10KB，按需加载适配器
- **🔧 易集成**: 一行代码完成初始化，支持多种框架
- **🛡️ 可靠传输**: 批量上报 + 重试机制 + 离线缓存
- **🔒 隐私保护**: 数据脱敏 + 采样控制 + 自定义过滤
- **🌐 跨平台**: 支持 Web、Vue、React Native
- **⚡ 高性能**: 异步处理 + 智能防抖 + 内存优化
- 简单接入：一次 `init`，可选 `installAutoCapture`，最小配置
- 自动采集：JS 全局错误、未处理 Promise 拒绝、资源加载错误；Vue 插件
- 手动日志：`log()` 与 `captureError()`，支持标题和日志级别
- 浏览器检测：自动识别浏览器类型（Chrome、Firefox、Safari、Edge等）
- 可靠传输：小队列 + 批量 + 重试 + 页面卸载时 sendBeacon
- 隐私控制：基础脱敏钩子

## 🚀 快速开始

### 安装

```bash
# 安装核心包
npm install @ppyuesheng/loki-sdk-h5-core

# 按需安装适配器
npm install @ppyuesheng/loki-sdk-h5-adapter-vue    # Vue应用
npm install @ppyuesheng/loki-sdk-h5-adapter-js     # 普通JS应用
npm install @ppyuesheng/loki-sdk-h5-adapter-rn     # React Native应用
```

### 基础使用

```typescript
import { sdkH5, installAutoCapture } from '@ppyuesheng/loki-sdk-h5-core';

// 初始化SDK
sdkH5.init({
  appName: "demo-h5",
  environment: "staging",
  endpoints: { loki: "https://loki.example.com/loki/api/v1/push" },
  useSendBeacon: true,
  enableOfflineBuffer: true,
});

// 启用自动错误捕获
installAutoCapture(sdkH5);

// 手动日志
sdkH5.log("info", "page_loaded", { path: location.pathname }, "页面加载");
```

### Vue 3 集成

```typescript
import { createApp } from "vue";
import App from "./App.vue";
import { sdkH5 } from "@ppyuesheng/loki-sdk-h5-core";
import { installAutoCapture } from "@ppyuesheng/loki-sdk-h5-core";
import { createSdkVuePlugin } from "@ppyuesheng/loki-sdk-h5-adapter-vue";

sdkH5.init({ 
  appName: "demo-vue", 
  endpoints: { loki: "/loki/api/v1/push" } 
});
installAutoCapture(sdkH5);

const app = createApp(App);
app.use(createSdkVuePlugin(sdkH5));
app.mount("#app");
```

### React Native

```typescript
import { sdkH5 } from '@ppyuesheng/loki-sdk-h5-core';
import { installRnGlobalHandlers } from '@ppyuesheng/loki-sdk-h5-adapter-rn';

sdkH5.init({
  appName: 'my-rn-app',
  endpoints: { loki: 'https://your-api.com/loki/api/v1/push' },
  useProxy: false
});

installRnGlobalHandlers(sdkH5);
```

## 🎯 核心功能

### 自动错误捕获

```typescript
// 安装自动错误捕获
installAutoCapture(sdkH5);

// 自动捕获以下错误类型：
// ✅ JavaScript运行时错误
// ✅ 未处理的Promise拒绝  
// ✅ 资源加载失败
// ✅ Vue组件错误（需适配器）
// ✅ React组件错误（需适配器）
// - JavaScript运行时错误
// - 未处理的Promise拒绝
// - 资源加载错误（图片、脚本等）
```

### 手动日志记录

```typescript
// 记录不同级别的日志
sdkH5.log('info', '用户登录', { userId: '123', method: 'password' });
sdkH5.log('warn', 'API响应慢', { endpoint: '/api/users', duration: 5000 });
sdkH5.log('error', '支付失败', { orderId: '456', reason: 'insufficient_funds' });

// 手动捕获错误
try {
  // 一些可能出错的操作
} catch (error) {
  sdkH5.captureError(error, { context: 'payment_process' });
}
```

### 上下文管理

```typescript
// 设置用户信息
sdkH5.setUser('user-123');

// 更新全局上下文
sdkH5.setContext({
  app: { version: '1.2.3' },
  user: { sessionId: 'session-456' }
});
```

## 📦 包结构

| 包名 | 功能 | 大小 |
|------|------|------|
| `@ppyuesheng/loki-sdk-h5-core` | 核心SDK功能 | ~10KB |
| `@ppyuesheng/loki-sdk-h5-transport-loki` | Loki传输层 | ~3KB |
| `@ppyuesheng/loki-sdk-h5-adapter-js` | 原生JS适配器 | ~1KB |
| `@ppyuesheng/loki-sdk-h5-adapter-vue` | Vue.js适配器 | ~1KB |
| `@ppyuesheng/loki-sdk-h5-adapter-rn` | React Native适配器 | ~1KB |

## 🔧 配置选项

### 核心配置
```typescript
interface SdkH5Config {
  appName: string;                    // 必需：应用名称
  environment?: 'dev' | 'prod';       // 环境
  endpoints: {
    loki: string;                     // Loki 推送端点
  };
  useProxy?: boolean;                 // 启用代理模式
  proxyPath?: string;                 // 代理路径前缀
  corsMode?: 'cors' | 'same-origin';  // CORS 模式
  useSendBeacon?: boolean;            // 使用 sendBeacon 进行最终刷新
  enableOfflineBuffer?: boolean;      // 启用离线缓冲
  sampleRate?: number;                // 采样率 (0-1)
  rateLimitPerMin?: number;           // 速率限制
  flushIntervalMs?: number;           // 刷新间隔
  maxRetries?: number;                // 最大重试次数
  onError?: (error: Error) => void;   // 错误回调
}
```

### 高级配置
```typescript
sdkH5.init({
  appName: "my-app",
  environment: "prod",
  endpoints: { loki: "https://loki.example.com/loki/api/v1/push" },
  
  // 可靠性设置
  useSendBeacon: true,
  enableOfflineBuffer: true,
  maxRetries: 3,
  
  // 性能设置
  sampleRate: 1.0,
  rateLimitPerMin: 1000,
  flushIntervalMs: 5000,
  
  // 错误处理
  onError: (err) => console.error('SDK Error:', err)
});
```

## API 参考

### 核心方法

#### `sdkH5.init(config)`
使用配置初始化 SDK。

#### `sdkH5.log(level, message, attributes?, title?)`
发送手动日志条目。
```typescript
sdkH5.log('info', '用户操作', { action: 'click_button', userId: '123' });
sdkH5.log('error', 'API 调用失败', { endpoint: '/api/users', status: 500 });
```

#### `sdkH5.captureError(error, attributes?, title?)`
手动捕获错误。
```typescript
try {
  // 一些有风险的操作
} catch (error) {
  sdkH5.captureError(error, { context: 'user_login' }, '登录失败');
}
```

#### `sdkH5.setUser(userId?)`
为所有后续日志设置当前用户 ID。
```typescript
sdkH5.setUser('user-123');
```

#### `sdkH5.setContext(context)`
更新所有后续日志的全局上下文。
```typescript
sdkH5.setContext({
  app: { version: '1.2.3' },
  user: { sessionId: 'session-456' }
});
```

#### `sdkH5.flush()`
手动刷新当前队列。
```typescript
await sdkH5.flush();
```

#### `sdkH5.shutdown()`
优雅地关闭 SDK。
```typescript
await sdkH5.shutdown();
```

### 自动捕获

#### `installAutoCapture(sdk?)`
安装自动错误捕获，包括：
- JavaScript 错误
- 未处理的 Promise 拒绝
- 资源加载错误

```typescript
import { installAutoCapture } from '@ppyuesheng/loki-sdk-h5-core';
installAutoCapture(sdkH5);
```

## 🌐 CORS 跨域解决方案

如果遇到连接 Loki 时的 CORS 跨域错误，请参考 [CORS-SOLUTIONS.md](./CORS-SOLUTIONS.md) 获取详细解决方案，包括：

- **Nginx 反向代理**（生产环境推荐）
- **SDK 代理模式**配置
- **Vite 开发代理**设置
- **Express/Node.js 代理**配置

### 快速解决 - 代理模式

```typescript
import { sdkH5, installAutoCapture } from "@ppyuesheng/loki-sdk-h5-core";

sdkH5.init({
  appName: "demo-h5",
  endpoints: { loki: "代理模式下不使用" },
  // 启用代理模式避免 CORS 问题
  useProxy: true,
  proxyPath: "/api/loki",
  corsMode: "same-origin"
});
installAutoCapture(sdkH5);
```

配置你的服务器将 `/api/loki/*` 代理到实际的 Loki 实例。

### 代理模式配置
推荐使用代理模式避免CORS问题，需要在服务器配置代理：

```nginx
location /api/loki/ {
    rewrite ^/api/loki/(.*) /$1 break;
    proxy_pass http://your-loki-server:3100;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 数据模型

每个日志条目都作为 JSON 信封发送到 Loki：

```json
{
  "timestampNs": "1700000000000000000",
  "level": "error",
  "type": "js_error",
  "message": "TypeError: Cannot read property 'x' of undefined",
  "attributes": {
    "error": {
      "name": "TypeError",
      "message": "Cannot read property 'x' of undefined",
      "stack": "TypeError: Cannot read property 'x' of undefined\n    at ..."
    },
    "context": "user_login"
  },
  "context": {
    "app": {
      "name": "demo-h5",
      "version": "1.0.0",
      "env": "staging"
    },
    "user": {
      "id": "user-123",
      "sessionId": "session-456"
    },
    "page": {
      "url": "https://example.com/login",
      "path": "/login",
      "referrer": "https://example.com/"
    },
    "device": {
      "ua": "Mozilla/5.0...",
      "platform": "web",
      "language": "zh-CN",
      "viewport": "1920x1080"
    }
  }
}
```

## 🔒 安全与隐私

- 建议在 Loki 前放置网关以集中管理 CORS/认证/限流
- 默认脱敏敏感头信息（`authorization`、`cookie` 等）和 URL 查询参数
- 除非绝对必要，否则避免发送 PII；使用 `redact.custom` 删除或转换
- 默认脱敏敏感头信息（`authorization`、`cookie`等）
- 支持自定义数据过滤和转换
- 避免发送PII（个人身份信息）
- 建议在生产环境使用代理网关

## Demo

查看 [demo](./demo/h5/) 获取完整的工作示例，包括：
- 错误触发按钮
- 实时日志查看
- 配置示例

## 🛠️ 故障排除

- **4xx 错误**：检查 Loki/网关的 CORS 和认证
- **429/5xx**：SDK 会进行退避重试；考虑降低采样率或增加网关限制
- **Grafana 中没有日志**：验证 Loki 标签匹配查询（`{app="demo-h5"}`）和时间范围
- **4xx错误**: 检查CORS和认证配置
- **429/5xx错误**: SDK会自动重试，可调整采样率
- **无日志显示**: 检查Loki查询标签和时间范围

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

# sdk-h5：前端错误与日志采集 SDK（直连 Loki）

一个轻量、易接入的 H5/Web SDK（包含 Vue 适配器与 RN 基础支持），用于自动捕获常见前端错误，同时提供简单的手动日志能力，将数据直接推送到 Loki 的 `/loki/api/v1/push` 接口。

- 简单接入：一次 `init`，可选 `installAutoCapture`，最小配置
- 自动采集：JS 全局错误、未处理 Promise 拒绝、资源加载错误；Vue 插件
- 手动日志：`log()` 与 `captureError()`，支持标题和日志级别
- 浏览器检测：自动识别浏览器类型（Chrome、Firefox、Safari、Edge等）
- 可靠传输：小队列 + 批量 + 重试 + 页面卸载时 sendBeacon
- 隐私控制：基础脱敏钩子


## 快速开始（TL;DR）

### CDN/UMD（原生 JS）
```html
<script src="/path/to/sdk-h5.umd.js"></script>
<script>
  sdkH5.init({
    appName: "demo-h5",
    environment: "staging",
    endpoints: { loki: "https://loki.example.com/loki/api/v1/push" },
    transport: "loki", // 默认
    useSendBeacon: true,
    enableOfflineBuffer: true,
  });
  sdkH5.installAutoCapture();

  // 手动日志（支持title参数）
  sdkH5.log("info", "page_loaded", { path: location.pathname }, "页面加载");
  
  // 错误捕获（支持title参数）
  try {
    // 一些可能出错的代码
  } catch (error) {
    sdkH5.captureError(error, { source: "user_action" }, "用户操作错误");
  }
</script>
```

### NPM（ESM）
```ts
import { sdkH5 } from "@sdk-h5/core";
import { installAutoCapture } from "@sdk-h5/adapter-js";

sdkH5.init({
  appName: "demo-h5",
  endpoints: { loki: "https://loki.example.com/loki/api/v1/push" },
});
installAutoCapture(sdkH5);
```

### Vue 3
```ts
import { createApp } from "vue";
import App from "./App.vue";
import { sdkH5 } from "@sdk-h5/core";
import { installAutoCapture } from "@sdk-h5/adapter-js";
import { createSdkVuePlugin } from "@sdk-h5/adapter-vue";

sdkH5.init({ appName: "demo-vue", endpoints: { loki: "/loki/api/v1/push" } });
installAutoCapture(sdkH5);

const app = createApp(App);
app.use(createSdkVuePlugin(sdkH5));
app.mount("#app");
```


## 前置要求
- Loki 需暴露 `/loki/api/v1/push`，并开启 CORS；或通过网关/代理处理 CORS 与鉴权。
- 生产环境建议在 Loki 前增加网关（如 Nginx/Envoy/API GW）统一管理 CORS、鉴权与限流。

## CORS 跨域解决方案

如果遇到连接 Loki 时的 CORS 跨域错误，请参考 [CORS-SOLUTIONS.md](./CORS-SOLUTIONS.md) 获取详细解决方案，包括：

- **Nginx 反向代理**（生产环境推荐）
- **SDK 代理模式**配置
- **Vite 开发代理**设置
- **Express/Node.js 代理**配置

### 快速解决 - 代理模式

```ts
import { sdkH5, installAutoCapture } from "@sdk-h5/core";

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


## 数据模型（写入 Loki 的 JSON 行）
- 每条记录的 envelope（作为字符串写入 Loki `streams.values[][1]`）：
```json
{
  "timestampNs": "1700000000000000000",
  "level": "error",
  "type": "js_error",
  "message": "ReferenceError: foo is not defined",
  "stack": "Error: ...",
  "attributes": {"origin":"window.onerror"},
  "context": {
    "app": {"name":"demo-h5","version":"1.0.0","env":"staging","release":"1.0.0+001"},
    "user": {"id":"u-123","sessionId":"s-456"},
    "page": {"url":"https://example.com/x","path":"/x","referrer":""},
    "device": {"ua":"...","platform":"web","language":"zh-CN","viewport":"1920x1080","dpi":2}
  }
}
```

- Loki 流标签（客户端尽量精简）：
  - `app`、`env`、`platform`、`release`、`sdk`（如 `sdk-h5@1.0.0`）

- SDK 发送的 Loki Push 示例：
```json
{
  "streams": [
    {
      "stream": {"app":"demo-h5","env":"staging","platform":"web","release":"1.0.0","sdk":"sdk-h5@1.0.0"},
      "values": [["1700000000000000000", "{\"level\":\"error\",\"message\":\"...\"}"]]
    }
  ]
}
```


## 公共 API（TypeScript）
```ts
type LogLevel = "debug" | "info" | "warn" | "error";

type SdkH5Config = {
  appName: string;
  appVersion?: string;
  release?: string;
  environment?: "dev" | "test" | "staging" | "prod";
  endpoints: { loki: string };
  headers?: Record<string, string>;
  transport?: "loki"; // 目前仅 loki，预留扩展
  batchMaxBytes?: number;      // 默认 512*1024
  batchMaxRecords?: number;    // 默认 100
  flushIntervalMs?: number;    // 默认 2000
  maxRetries?: number;         // 默认 3
  backoffMs?: number;          // 默认 1000
  useSendBeacon?: boolean;     // 默认 true
  enableOfflineBuffer?: boolean; // 默认 true（localStorage）
  sampleRate?: number;         // 默认 1
  rateLimitPerMin?: number;    // 默认 300
  redact?: {
    urlQuery?: boolean;        // 默认 true
    headers?: string[];        // 例如 ["authorization", "cookie"]
    custom?: (envelope: LogEnvelope) => LogEnvelope | null;
  };
  onError?: (err: Error) => void;
};

interface SdkH5 {
  init(config: SdkH5Config): void;
  installAutoCapture(): void; // 适配器快捷安装
  captureError(error: unknown, attributes?: Record<string, any>, title?: string): void;
  log(level: LogLevel, message: string, attributes?: Record<string, any>, title?: string): void;
  setUser(userId?: string): void;
  setContext(context: Partial<LogEnvelope["context"]>): void;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}
```


## 新增功能

### 日志标题支持
可以为每条日志添加可选的标题，便于在日志系统中快速识别和分类：

```js
// 带标题的日志记录
sdkH5.log("info", "用户登录成功", { userId: "12345" }, "用户认证");
sdkH5.log("warn", "API响应缓慢", { duration: 3000 }, "性能警告");

// 带标题的错误捕获
sdkH5.captureError(error, { component: "PaymentForm" }, "支付异常");
```

### 浏览器类型自动检测
SDK会自动检测并记录用户的浏览器类型，支持：
- `chrome` - Google Chrome
- `firefox` - Mozilla Firefox  
- `safari` - Apple Safari
- `edge` - Microsoft Edge
- `opera` - Opera
- `ie` - Internet Explorer
- `unknown` - 无法识别的浏览器

浏览器信息会自动添加到设备上下文中：
```json
{
  "context": {
    "device": {
      "browser": "chrome",
      "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
      "platform": "web"
    }
  }
}
```

## 自动采集行为
- `window.onerror`：捕获未处理运行时错误
- `window.onunhandledrejection`：捕获未处理 Promise 拒绝
- 资源错误：`addEventListener('error', ..., true)` 捕获 `<img>/<script>/<link>` 加载错误
- Vue 插件：接入 `app.config.errorHandler`（Vue 3）或 `Vue.config.errorHandler`（Vue 2）
- 可选：console 面包屑（默认关闭）


## 最小化默认配置
- `flushIntervalMs`：2000 ms
- `batchMaxRecords`：100；`batchMaxBytes`：512 KB
- `maxRetries`：3（指数退避，`backoffMs`=1000 + 抖动）
- `useSendBeacon`：true（页面卸载时优先）；若不可用则回退同步 `fetch`
- `enableOfflineBuffer`：true（localStorage 小型环形缓冲）
- `sampleRate`：1（对高频事件建议 < 1）；`rateLimitPerMin`：300
- 脱敏：默认移除 URL 查询串；按配置剔除敏感头；提供自定义过滤


## 传输细节（直连 Loki）
- Endpoint：`POST {loki}/loki/api/v1/push`
- Content-Type：`application/json`
- Body：Loki Push 负载（见上）
- 时间戳：纳秒字符串
- `keepalive`：`fetch(..., { keepalive: true })` 支持页面卸载时仍可上报
- 生命周期事件：`visibilitychange`/`pagehide`/`beforeunload` 尝试 `navigator.sendBeacon` 最终冲刷
- 重试：对 5xx/429 指数退避重试；对 4xx（除 429）不重试
- CORS：需允许浏览器域；或通过网关代理


## 核心伪代码
```ts
class SdkH5Impl implements SdkH5 {
  private cfg!: SdkH5Config;
  private queue: LogEnvelope[] = [];
  private timer: number | undefined;
  private context: GlobalContext;
  private limiter: RateLimiter;

  init(cfg: SdkH5Config) {
    this.cfg = withDefaults(cfg);
    this.context = buildInitialContext(cfg);
    this.limiter = new RateLimiter(this.cfg.rateLimitPerMin);
    this.timer = window.setInterval(() => this.flush(), this.cfg.flushIntervalMs);
    if (this.cfg.enableOfflineBuffer) restoreFromStorage(this.queue);
    bindLifecycleEvents(() => this.flush());
  }

  installAutoCapture() { installAutoCapture(this); }

  captureError(error: unknown, attributes?: Record<string, any>, title?: string) {
    if (!sample(this.cfg.sampleRate)) return;
    const env = buildErrorEnvelope(error, this.context, attributes, title);
    this.enqueue(env);
  }

  log(level: LogLevel, message: string, attributes?: Record<string, any>, title?: string) {
    const env = buildLogEnvelope(level, message, this.context, attributes, title);
    this.enqueue(env);
  }

  private enqueue(env: LogEnvelope) {
    const filtered = applyRedaction(env, this.cfg.redact);
    if (!filtered) return;
    if (!this.limiter.allow()) return;
    this.queue.push(filtered);
    if (shouldFlush(this.queue, this.cfg)) this.flush();
    if (this.cfg.enableOfflineBuffer) persistToStorage(this.queue);
  }

  async flush() {
    const batch = drainBatch(this.queue, this.cfg);
    if (batch.length === 0) return;
    const payload = toLokiPayload(batch, this.context, this.cfg);
    try {
      await retry(() => httpPost(this.cfg.endpoints.loki, payload, this.cfg), this.cfg.maxRetries, this.cfg.backoffMs);
    } catch (err) {
      this.cfg.onError?.(err as Error);
      // 可选：若启用存储，可将批处理头部回灌队列
    }
  }

  async shutdown() {
    window.clearInterval(this.timer);
    await this.flush();
  }
}
```


## Vue 插件伪代码
```ts
export function createSdkVuePlugin(sdk: SdkH5) {
  return {
    install(app) {
      const prev = app.config.errorHandler;
      app.config.errorHandler = (err, instance, info) => {
        sdk.captureError(err, { vueInfo: info });
        prev?.(err, instance, info);
      };
      app.provide("$sdkH5", sdk);
    }
  };
}
```


## RN 全局错误伪代码（可选）
```ts
export function installRnGlobalHandlers(sdk: SdkH5) {
  const prev = (global as any).ErrorUtils?.getGlobalHandler?.();
  (global as any).ErrorUtils?.setGlobalHandler?.((error: any, isFatal: boolean) => {
    sdk.captureError(error, { rnIsFatal: isFatal });
    prev?.(error, isFatal);
  });
}
```


## 安全与隐私
- 推荐在 Loki 前设置网关，集中处理 CORS/鉴权/限流。
- 默认脱敏 URL 查询串；可配置移除敏感头（`authorization`、`cookie` 等）。
- 尽量避免传输 PII；如需，可通过 `redact.custom` 做二次过滤或直接丢弃。


## Demo 应用（计划）
- 简单 H5 页：按钮触发以下场景
  - 抛出 JS 错误
  - 未处理 Promise 拒绝
  - 加载不存在图片（资源错误）
  - 自定义 info 日志
- 通过查询串/环境变量配置 Loki endpoint
- 展示页面关闭时的最终 flush 行为


## 路线图
- IndexedDB 大容量离线缓冲
- 面包屑（console/XHR/fetch）开关
- OTLP/HTTP（可选）经 Collector 转发到 Loki
- Source maps 集成（服务端符号化）


## 故障排查
- 4xx：检查 CORS 与鉴权（Loki/网关）
- 429/5xx：SDK 会退避重试；考虑降低采样率或放宽限流
- Grafana 无日志：确认查询标签（如 `{app="demo-h5"}`）与时间范围是否正确
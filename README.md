# sdk-h5: Frontend Error & Log Collection SDK

<div align="center">

**Lightweight Frontend Error Collection and Log Reporting SDK**

🚀 Ready to Use | 📦 Modular Design | 🔒 Privacy Secure | 🌐 Cross-Platform Support

</div>

A lightweight, easy-to-integrate H5/Web SDK (with Vue adapter and RN basic support) for automatically capturing common frontend errors while providing simple manual logging capabilities, sending data directly to Loki's `/loki/api/v1/push` endpoint.

## ✨ Features

- **🎯 Lightweight**: Core package only ~10KB, load adapters on demand
- **🔧 Easy Integration**: One line of code to initialize, supports multiple frameworks
- **🛡️ Reliable Transmission**: Batch reporting + retry mechanism + offline caching
- **🔒 Privacy Protection**: Data redaction + sampling control + custom filtering
- **🌐 Cross-Platform**: Supports Web, Vue, React Native
- **⚡ High Performance**: Async processing + smart debouncing + memory optimization
- Simple integration: one `init`, optional `installAutoCapture`, minimal config
- Auto capture: JS global errors, unhandled Promise rejections, resource load errors; Vue plugin
- Manual logging: `log()` and `captureError()`, supports title and log levels
- Browser detection: automatically identifies browser type (Chrome, Firefox, Safari, Edge, etc.)
- Reliable transmission: small queue + batch + retry + sendBeacon on page unload
- Privacy controls: basic redaction hooks

## 🚀 Quick Start

### Installation

```bash
# Install core package
npm install @ppyuesheng/loki-sdk-h5-core

# Install adapters as needed
npm install @ppyuesheng/loki-sdk-h5-adapter-vue    # Vue applications
npm install @ppyuesheng/loki-sdk-h5-adapter-js     # Plain JS applications
npm install @ppyuesheng/loki-sdk-h5-adapter-rn     # React Native applications
```

### Basic Usage

#### 方式1: 直接模式（需要Loki服务器支持CORS）
```typescript
import { sdkH5, installAutoCapture } from '@ppyuesheng/loki-sdk-h5-core';

sdkH5.init({
  appName: "demo-h5",
  environment: "staging",
  endpoints: { loki: "https://loki.example.com" },
  transportMode: "direct",
  corsMode: "cors",
  useSendBeacon: true,
  enableOfflineBuffer: true,
});

installAutoCapture(sdkH5);
```

#### 方式2: CORS代理服务（推荐 - 自动检测）
```typescript
import { sdkH5, installAutoCapture } from '@ppyuesheng/loki-sdk-h5-core';

sdkH5.init({
  appName: "demo-h5",
  environment: "staging",
  endpoints: { loki: "https://loki.example.com" },
  transportMode: "cors-proxy",
  // corsProxyUrl: "https://your-cors-proxy-domain.com", // 可选：手动指定
  // autoDetectCorsProxy: true, // 默认true，可省略
  corsMode: "cors",
  useSendBeacon: true,
  enableOfflineBuffer: true,
});

installAutoCapture(sdkH5);
```

#### 方式3: 本地代理模式（需要配置Nginx）
```typescript
import { sdkH5, installAutoCapture } from '@ppyuesheng/loki-sdk-h5-core';

sdkH5.init({
  appName: "demo-h5",
  environment: "staging",
  endpoints: { loki: "https://loki.example.com" },
  transportMode: "proxy",
  proxyPath: "/api/loki",
  corsMode: "same-origin",
  useSendBeacon: true,
  enableOfflineBuffer: true,
});

installAutoCapture(sdkH5);
```

> 📖 **详细部署指南**: 查看 [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) 了解各种部署方案的详细说明和配置方法。

### Vue 3 Integration

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

## 🎯 Core Features

### Automatic Error Capture

```typescript
// Install automatic error capture
installAutoCapture(sdkH5);

// Automatically captures the following error types:
// ✅ JavaScript runtime errors
// ✅ Unhandled Promise rejections  
// ✅ Resource loading failures
// ✅ Vue component errors (requires adapter)
// ✅ React component errors (requires adapter)
// - JavaScript runtime errors
// - Unhandled Promise rejections
// - Resource loading errors (images, scripts, etc.)
```

### Manual Logging

```typescript
// Log different levels
sdkH5.log('info', 'User login', { userId: '123', method: 'password' });
sdkH5.log('warn', 'API slow response', { endpoint: '/api/users', duration: 5000 });
sdkH5.log('error', 'Payment failed', { orderId: '456', reason: 'insufficient_funds' });

// Manual error capture
try {
  // Some operation that might fail
} catch (error) {
  sdkH5.captureError(error, { context: 'payment_process' });
}
```

### Context Management

```typescript
// Set user information
sdkH5.setUser('user-123');

// Update global context
sdkH5.setContext({
  app: { version: '1.2.3' },
  user: { sessionId: 'session-456' }
});
```

## 📦 Package Structure

| Package | Function | Size |
|---------|----------|------|
| `@ppyuesheng/loki-sdk-h5-core` | Core SDK functionality | ~10KB |
| `@ppyuesheng/loki-sdk-h5-transport-loki` | Loki transport layer | ~3KB |
| `@ppyuesheng/loki-sdk-h5-adapter-js` | Native JS adapter | ~1KB |
| `@ppyuesheng/loki-sdk-h5-adapter-vue` | Vue.js adapter | ~1KB |
| `@ppyuesheng/loki-sdk-h5-adapter-rn` | React Native adapter | ~1KB |

## 🔧 Configuration Options

### Core Configuration
```typescript
interface SdkH5Config {
  appName: string;                    // Required: Application name
  environment?: 'dev' | 'prod';       // Environment
  endpoints: {
    loki: string;                     // Loki push endpoint
  };
  useProxy?: boolean;                 // Enable proxy mode
  proxyPath?: string;                 // Proxy path prefix
  corsMode?: 'cors' | 'same-origin';  // CORS mode
  useSendBeacon?: boolean;            // Use sendBeacon for final flush
  enableOfflineBuffer?: boolean;      // Enable offline buffering
  sampleRate?: number;                // Sampling rate (0-1)
  rateLimitPerMin?: number;           // Rate limiting
  flushIntervalMs?: number;           // Flush interval
  maxRetries?: number;                // Max retry attempts
  onError?: (error: Error) => void;   // Error callback
}
```

### Advanced Configuration
```typescript
sdkH5.init({
  appName: "my-app",
  environment: "prod",
  endpoints: { loki: "https://loki.example.com/loki/api/v1/push" },
  
  // Reliability settings
  useSendBeacon: true,
  enableOfflineBuffer: true,
  maxRetries: 3,
  
  // Performance settings
  sampleRate: 1.0,
  rateLimitPerMin: 1000,
  flushIntervalMs: 5000,
  
  // Error handling
  onError: (err) => console.error('SDK Error:', err)
});
```

## API Reference

### Core Methods

#### `sdkH5.init(config)`
Initialize the SDK with configuration.

#### `sdkH5.log(level, message, attributes?, title?)`
Send a manual log entry.
```typescript
sdkH5.log('info', 'User action', { action: 'click_button', userId: '123' });
sdkH5.log('error', 'API call failed', { endpoint: '/api/users', status: 500 });
```

#### `sdkH5.captureError(error, attributes?, title?)`
Manually capture an error.
```typescript
try {
  // Some risky operation
} catch (error) {
  sdkH5.captureError(error, { context: 'user_login' }, 'Login failed');
}
```

#### `sdkH5.setUser(userId?)`
Set the current user ID for all subsequent logs.
```typescript
sdkH5.setUser('user-123');
```

#### `sdkH5.setContext(context)`
Update the global context for all subsequent logs.
```typescript
sdkH5.setContext({
  app: { version: '1.2.3' },
  user: { sessionId: 'session-456' }
});
```

#### `sdkH5.flush()`
Manually flush the current queue.
```typescript
await sdkH5.flush();
```

#### `sdkH5.shutdown()`
Gracefully shutdown the SDK.
```typescript
await sdkH5.shutdown();
```

### Auto-Capture

#### `installAutoCapture(sdk?)`
Install automatic error capture for:
- JavaScript errors
- Unhandled promise rejections
- Resource load errors

```typescript
import { installAutoCapture } from '@ppyuesheng/loki-sdk-h5-core';
installAutoCapture(sdkH5);
```

## 🌐 CORS Solutions

If you encounter CORS errors when connecting to Loki, see [CORS-SOLUTIONS.md](./CORS-SOLUTIONS.md) for detailed solutions including:

- **Nginx reverse proxy** (recommended for production)
- **SDK proxy mode** configuration
- **Vite dev proxy** for development
- **Express/Node.js proxy** setup

### Quick Fix - Proxy Mode

```typescript
import { sdkH5, installAutoCapture } from "@ppyuesheng/loki-sdk-h5-core";

sdkH5.init({
  appName: "demo-h5",
  endpoints: { loki: "unused-in-proxy-mode" },
  // Enable proxy mode to avoid CORS
  useProxy: true,
  proxyPath: "/api/loki",
  corsMode: "same-origin"
});
installAutoCapture(sdkH5);
```

Configure your server to proxy `/api/loki/*` to your actual Loki instance.

### Proxy Mode Configuration
Recommended to use proxy mode to avoid CORS issues, requires server proxy configuration:

```nginx
location /api/loki/ {
    rewrite ^/api/loki/(.*) /$1 break;
    proxy_pass http://your-loki-server:3100;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Data Model

Each log entry is sent as a JSON envelope to Loki:

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
      "language": "en-US",
      "viewport": "1920x1080"
    }
  }
}
```

## 🔒 Security & Privacy

- Prefer proxying Loki behind a gateway to centralize CORS/auth/rate-limit
- Redact sensitive headers (`authorization`, `cookie`, etc.) and URL query by default
- Avoid sending PII unless absolutely necessary; use `redact.custom` to drop or transform
- Default redaction of sensitive headers (`authorization`, `cookie`, etc.)
- Support custom data filtering and transformation
- Avoid sending PII (Personally Identifiable Information)
- Recommend using proxy gateway in production environment

## Demo

See the [demo](./demo/h5/) for a complete working example with:
- Error triggering buttons
- Real-time log viewing
- Configuration examples

## 🛠️ Troubleshooting

- **4xx errors**: Check CORS and auth at Loki/gateway
- **429/5xx**: SDK retries with backoff; consider reducing sample rate or increasing gateway limits
- **No logs in Grafana**: Verify Loki labels match queries (`{app="demo-h5"}`) and time range
- **4xx errors**: Check CORS and authentication configuration
- **429/5xx errors**: SDK automatically retries, can adjust sampling rate
- **No logs displayed**: Check Loki query labels and time range

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

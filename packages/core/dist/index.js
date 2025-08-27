// src/utils.ts
var RateLimiter = class {
  constructor(maxPerMinute) {
    this.maxTokens = maxPerMinute;
    this.tokens = maxPerMinute;
    this.lastRefill = Date.now();
  }
  allow() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed / 6e4 * this.maxTokens;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    return false;
  }
};
function withDefaults(cfg) {
  return {
    appName: cfg.appName,
    appVersion: cfg.appVersion || "1.0.0",
    release: cfg.release || cfg.appVersion || "1.0.0",
    environment: cfg.environment || "prod",
    endpoints: cfg.endpoints,
    headers: cfg.headers || {},
    transport: cfg.transport || "loki",
    batchMaxBytes: cfg.batchMaxBytes || 512 * 1024,
    batchMaxRecords: cfg.batchMaxRecords || 100,
    flushIntervalMs: cfg.flushIntervalMs || 2e3,
    maxRetries: cfg.maxRetries || 3,
    backoffMs: cfg.backoffMs || 1e3,
    useSendBeacon: cfg.useSendBeacon ?? true,
    enableOfflineBuffer: cfg.enableOfflineBuffer ?? true,
    sampleRate: cfg.sampleRate || 1,
    rateLimitPerMin: cfg.rateLimitPerMin || 300,
    corsMode: cfg.corsMode || "cors",
    useProxy: cfg.useProxy || false,
    proxyPath: cfg.proxyPath || "/api/loki",
    redact: cfg.redact || {},
    onError: cfg.onError || (() => {
    })
  };
}
function buildInitialContext(cfg) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const referrer = typeof document !== "undefined" ? document.referrer : "";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const language = typeof navigator !== "undefined" ? navigator.language : "";
  let viewport = "";
  let dpi = 1;
  if (typeof window !== "undefined") {
    viewport = `${window.screen.width}x${window.screen.height}`;
    dpi = window.devicePixelRatio || 1;
  }
  return {
    app: {
      name: cfg.appName,
      version: cfg.appVersion,
      env: cfg.environment,
      release: cfg.release
    },
    user: {
      sessionId: generateSessionId()
    },
    page: { url, path, referrer },
    device: {
      ua,
      platform: "web",
      language,
      viewport,
      dpi
    }
  };
}
function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
function sample(rate) {
  return Math.random() < rate;
}
function buildErrorEnvelope(error, context, attributes) {
  const timestampNs = (Date.now() * 1e6).toString();
  let message = "Unknown error";
  let stack;
  if (error instanceof Error) {
    message = error.message;
    stack = error.stack;
  } else if (typeof error === "string") {
    message = error;
  } else if (error && typeof error === "object") {
    message = error.message || JSON.stringify(error);
    stack = error.stack;
  }
  return {
    timestampNs,
    level: "error",
    type: "js_error",
    message,
    stack,
    attributes,
    context
  };
}
function buildLogEnvelope(level, message, context, attributes) {
  const timestampNs = (Date.now() * 1e6).toString();
  return {
    timestampNs,
    level,
    type: "manual_log",
    message,
    attributes,
    context
  };
}
function applyRedaction(envelope, redact) {
  if (!redact)
    return envelope;
  if (redact.custom) {
    const result = redact.custom(envelope);
    if (!result)
      return null;
    envelope = result;
  }
  if (redact.urlQuery && envelope.context.page?.url) {
    try {
      const url = new URL(envelope.context.page.url);
      envelope.context.page.url = url.origin + url.pathname;
    } catch {
    }
  }
  return envelope;
}
function shouldFlush(queue, cfg) {
  if (queue.length >= cfg.batchMaxRecords)
    return true;
  const totalBytes = queue.reduce((sum, env) => {
    return sum + JSON.stringify(env).length;
  }, 0);
  return totalBytes >= cfg.batchMaxBytes;
}
function drainBatch(queue, cfg) {
  const batch = [];
  let totalBytes = 0;
  while (queue.length > 0 && batch.length < cfg.batchMaxRecords) {
    const next = queue[0];
    const nextBytes = JSON.stringify(next).length;
    if (totalBytes + nextBytes > cfg.batchMaxBytes && batch.length > 0) {
      break;
    }
    batch.push(queue.shift());
    totalBytes += nextBytes;
  }
  return batch;
}
var STORAGE_KEY = "sdk-h5-offline-buffer";
var MAX_OFFLINE_RECORDS = 50;
function persistToStorage(queue) {
  if (typeof localStorage === "undefined")
    return;
  try {
    const toStore = queue.slice(-MAX_OFFLINE_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
  }
}
function restoreFromStorage(queue) {
  if (typeof localStorage === "undefined")
    return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const records = JSON.parse(stored);
      queue.push(...records);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
  }
}
async function retry(fn, maxRetries, baseBackoffMs) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message.includes("4")) {
        const status = parseInt(error.message.match(/(\d{3})/)?.[1] || "0");
        if (status >= 400 && status < 500 && status !== 429) {
          throw error;
        }
      }
      if (attempt < maxRetries) {
        const backoff = baseBackoffMs * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * backoff;
        await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
      }
    }
  }
  throw lastError;
}

// src/sdk.ts
import { LokiTransport } from "@chenpingfromgxu/sdk-h5-transport-loki";
var SdkH5Impl = class {
  constructor() {
    this.queue = [];
    this.isShuttingDown = false;
  }
  init(config) {
    if (this.cfg) {
      throw new Error("SDK already initialized");
    }
    this.cfg = withDefaults(config);
    this.context = buildInitialContext(config);
    this.limiter = new RateLimiter(this.cfg.rateLimitPerMin);
    this.transport = new LokiTransport(this.cfg);
    if (this.cfg.enableOfflineBuffer) {
      restoreFromStorage(this.queue);
    }
    if (typeof window !== "undefined") {
      this.timer = window.setInterval(() => {
        this.flush().catch((err) => this.cfg.onError(err));
      }, this.cfg.flushIntervalMs);
      this.bindLifecycleEvents();
    }
  }
  installAutoCapture() {
  }
  captureError(error, attributes) {
    if (!this.cfg || this.isShuttingDown)
      return;
    if (!sample(this.cfg.sampleRate))
      return;
    const envelope = buildErrorEnvelope(error, this.context, attributes);
    this.enqueue(envelope);
  }
  log(level, message, attributes) {
    if (!this.cfg || this.isShuttingDown)
      return;
    const envelope = buildLogEnvelope(level, message, this.context, attributes);
    this.enqueue(envelope);
  }
  setUser(userId) {
    if (!this.context)
      return;
    this.context = {
      ...this.context,
      user: {
        ...this.context.user,
        id: userId
      }
    };
  }
  setContext(context) {
    if (!this.context)
      return;
    this.context = {
      ...this.context,
      ...context,
      app: { ...this.context.app, ...context.app },
      user: { ...this.context.user, ...context.user },
      page: { ...this.context.page, ...context.page },
      device: { ...this.context.device, ...context.device }
    };
  }
  async flush() {
    if (!this.cfg || this.queue.length === 0)
      return;
    const batch = drainBatch(this.queue, this.cfg);
    if (batch.length === 0)
      return;
    try {
      await retry(
        () => this.transport.send(batch),
        this.cfg.maxRetries,
        this.cfg.backoffMs
      );
    } catch (err) {
      this.cfg.onError(err);
      if (this.cfg.enableOfflineBuffer && !this.isShuttingDown) {
        this.queue.unshift(...batch);
        persistToStorage(this.queue);
      }
    }
  }
  async shutdown() {
    this.isShuttingDown = true;
    if (typeof window !== "undefined" && this.timer) {
      window.clearInterval(this.timer);
      this.timer = void 0;
    }
    await this.flush();
  }
  enqueue(envelope) {
    const filtered = applyRedaction(envelope, this.cfg.redact);
    if (!filtered)
      return;
    if (!this.limiter.allow())
      return;
    this.queue.push(filtered);
    if (shouldFlush(this.queue, this.cfg)) {
      this.flush().catch((err) => this.cfg.onError(err));
    }
    if (this.cfg.enableOfflineBuffer) {
      persistToStorage(this.queue);
    }
  }
  bindLifecycleEvents() {
    if (typeof window === "undefined")
      return;
    const flushOnExit = () => {
      if (this.queue.length > 0 && this.cfg.useSendBeacon && navigator.sendBeacon) {
        const batch = drainBatch(this.queue, this.cfg);
        if (batch.length > 0) {
          try {
            const payload = this.transport.createPayload(batch);
            const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
            navigator.sendBeacon(this.transport.getEndpoint(), blob);
          } catch (err) {
            if (this.cfg.enableOfflineBuffer) {
              persistToStorage(this.queue);
            }
          }
        }
      } else if (this.cfg.enableOfflineBuffer) {
        persistToStorage(this.queue);
      }
    };
    window.addEventListener("beforeunload", flushOnExit);
    window.addEventListener("pagehide", flushOnExit);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flush().catch((err) => this.cfg.onError(err));
      }
    });
  }
};

// src/index.ts
var sdkH5 = new SdkH5Impl();
function installAutoCapture(sdk) {
  const targetSdk = sdk || sdkH5;
  if (typeof window === "undefined")
    return;
  window.addEventListener("error", (event) => {
    const anyEvent = event;
    if (anyEvent.target && !anyEvent.error) {
      const target = anyEvent.target;
      const src = target?.src || target?.href || "";
      targetSdk.log("error", "resource_error", {
        tagName: target?.tagName,
        src
      });
      return;
    }
    const err = event.error || event.message || "Unknown error";
    targetSdk.captureError(err, { origin: "window.onerror" });
  }, true);
  window.addEventListener("unhandledrejection", (event) => {
    targetSdk.captureError(event.reason, { origin: "unhandledrejection" });
  });
}
export {
  SdkH5Impl,
  buildErrorEnvelope,
  buildLogEnvelope,
  generateSessionId,
  installAutoCapture,
  sdkH5
};

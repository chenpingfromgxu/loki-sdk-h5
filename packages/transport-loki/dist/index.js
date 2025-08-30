// src/index.ts
var LokiTransport = class {
  constructor(cfg) {
    this.cfg = cfg;
  }
  labelsFor(record) {
    const app = record.context.app?.name || this.cfg.appName;
    const env = record.context.app?.env || this.cfg.environment || "";
    const release = record.context.app?.release || this.cfg.release || "";
    const platform = record.context.device?.platform || "web";
    return { app, env, release, platform, sdk: "sdk-h5@1.0.0" };
  }
  toLogLine(record) {
    const { timestampNs } = record;
    const line = JSON.stringify({
      timestampNs: record.timestampNs,
      level: record.level,
      type: record.type,
      message: record.message,
      title: record.title,
      stack: record.stack,
      attributes: record.attributes,
      context: record.context
    });
    return [timestampNs, line];
  }
  async send(records) {
    if (!records.length)
      return;
    const payload = this.createPayload(records);
    const strategy = this.cfg.corsStrategy || "auto";
    switch (strategy) {
      case "beacon":
        await this.sendWithBeacon(payload);
        break;
      case "proxy":
        await this.sendWithProxy(payload);
        break;
      case "direct":
        await this.sendWithFetch(payload);
        break;
      case "fallback":
        await this.sendWithFallback(payload);
        break;
      case "auto":
      default:
        await this.sendWithAutoStrategy(payload);
        break;
    }
  }
  /**
   * 自动策略：智能选择最佳发送方式
   */
  async sendWithAutoStrategy(payload) {
    const endpoint = this.cfg.endpoints.loki;
    try {
      await this.sendWithFetch(payload);
      return;
    } catch (error) {
      console.debug("Direct fetch failed, trying beacon...", error);
    }
    if (this.cfg.enableBeaconFallback !== false) {
      try {
        await this.sendWithBeacon(payload);
        return;
      } catch (error) {
        console.debug("Beacon failed, trying proxy...", error);
      }
    }
    try {
      await this.sendWithProxy(payload);
      return;
    } catch (error) {
      console.debug("Proxy failed, using offline queue...", error);
    }
    if (this.cfg.enableOfflineQueue !== false) {
      this.queueForLater(payload);
    } else {
      throw new Error("All sending strategies failed and offline queue is disabled");
    }
  }
  /**
   * 使用fetch发送（直接模式）
   */
  async sendWithFetch(payload) {
    const endpoint = this.getDirectEndpoint();
    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.cfg.headers || {}
      },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: "cors"
      // 尝试CORS模式
    };
    const res = await fetch(endpoint, fetchOptions);
    if (!res.ok) {
      throw new Error(`Loki push failed: ${res.status} ${res.statusText}`);
    }
  }
  /**
   * 使用sendBeacon发送
   */
  async sendWithBeacon(payload) {
    if (!navigator.sendBeacon) {
      throw new Error("sendBeacon is not supported");
    }
    const endpoint = this.getDirectEndpoint();
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json"
    });
    const success = navigator.sendBeacon(endpoint, blob);
    if (!success) {
      throw new Error("sendBeacon failed");
    }
  }
  /**
   * 使用代理发送
   */
  async sendWithProxy(payload) {
    const endpoint = this.getProxyEndpoint();
    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.cfg.headers || {}
      },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: "same-origin"
      // 代理模式使用same-origin
    };
    const res = await fetch(endpoint, fetchOptions);
    if (!res.ok) {
      throw new Error(`Proxy push failed: ${res.status} ${res.statusText}`);
    }
  }
  /**
   * 降级策略：依次尝试不同方式
   */
  async sendWithFallback(payload) {
    const strategies = [
      () => this.sendWithFetch(payload),
      () => this.sendWithBeacon(payload),
      () => this.sendWithProxy(payload)
    ];
    for (const strategy of strategies) {
      try {
        await strategy();
        return;
      } catch (error) {
        console.debug("Strategy failed, trying next...", error);
      }
    }
    if (this.cfg.enableOfflineQueue !== false) {
      this.queueForLater(payload);
    } else {
      throw new Error("All sending strategies failed");
    }
  }
  /**
   * 将数据加入离线队列
   */
  queueForLater(payload) {
    if (typeof localStorage !== "undefined") {
      try {
        const queue = JSON.parse(localStorage.getItem("loki-sdk-offline-queue") || "[]");
        queue.push({
          payload,
          timestamp: Date.now(),
          endpoint: this.cfg.endpoints.loki
        });
        if (queue.length > 100) {
          queue.splice(0, queue.length - 100);
        }
        localStorage.setItem("loki-sdk-offline-queue", JSON.stringify(queue));
        console.debug("Data queued for later sending");
      } catch (error) {
        console.warn("Failed to queue data:", error);
      }
    }
  }
  /**
   * 获取直接端点URL
   */
  getDirectEndpoint() {
    return this.ensurePushUrl(this.cfg.endpoints.loki);
  }
  /**
   * 获取代理端点URL
   */
  getProxyEndpoint() {
    const proxyPath = this.cfg.proxyPath || "/api/loki";
    return `${proxyPath}/loki/api/v1/push`;
  }
  createPayload(records) {
    const byLabelKey = /* @__PURE__ */ new Map();
    for (const r of records) {
      const labels = this.labelsFor(r);
      const key = JSON.stringify(labels);
      const entry = byLabelKey.get(key) || { labels, values: [] };
      entry.values.push(this.toLogLine(r));
      byLabelKey.set(key, entry);
    }
    return {
      streams: Array.from(byLabelKey.values()).map((s) => ({ stream: s.labels, values: s.values }))
    };
  }
  /**
   * 兼容旧的getEndpoint方法
   */
  getEndpoint() {
    const mode = this.cfg.transportMode || "auto";
    switch (mode) {
      case "proxy":
        return this.getProxyEndpoint();
      case "direct":
        return this.getDirectEndpoint();
      case "beacon-only":
        return this.getDirectEndpoint();
      case "auto":
      default:
        return this.getDirectEndpoint();
    }
  }
  ensurePushUrl(base) {
    if (!base.includes("/loki/api/v1/push")) {
      return base.replace(/\/$/, "") + "/loki/api/v1/push";
    }
    return base;
  }
};
var src_default = LokiTransport;
export {
  LokiTransport,
  src_default as default
};

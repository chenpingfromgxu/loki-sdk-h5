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
    return { app, env, release, platform, sdk: "sdk-h5@0.1.0" };
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
    const endpoint = this.getEndpoint();
    const fetchOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.cfg.headers || {} },
      body: JSON.stringify(payload),
      // keepalive allows sending during page unload in some browsers
      keepalive: true,
      // CORS mode configuration
      mode: this.cfg.corsMode || "cors"
    };
    const res = await fetch(endpoint, fetchOptions);
    if (!("ok" in res ? res.ok : res.status < 400)) {
      const status = res.status;
      const statusText = res.statusText || "";
      throw new Error(`Loki push failed: ${status} ${statusText}`);
    }
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
  getEndpoint() {
    switch (this.cfg.transportMode || "direct") {
      case "proxy":
        const proxyPath = this.cfg.proxyPath || "/api/loki";
        return `${proxyPath}/loki/api/v1/push`;
      case "cors-proxy":
        const proxyUrl = this.getCorsProxyUrl();
        const lokiUrl = this.ensurePushUrl(this.cfg.endpoints.loki);
        return `${proxyUrl}/proxy?target=${encodeURIComponent(lokiUrl)}`;
      case "direct":
      default:
        return this.ensurePushUrl(this.cfg.endpoints.loki);
    }
  }
  /**
   * 获取CORS代理服务URL
   * 支持自动检测和手动配置
   */
  getCorsProxyUrl() {
    if (this.cfg.corsProxyUrl) {
      return this.cfg.corsProxyUrl.replace(/\/$/, "");
    }
    if (this.cfg.autoDetectCorsProxy === false) {
      throw new Error("corsProxyUrl is required when autoDetectCorsProxy is disabled");
    }
    return this.detectCorsProxyUrl();
  }
  /**
   * 自动检测CORS代理服务URL
   * 开发环境：使用localhost:3000
   * 生产环境：使用当前域名下的代理服务
   */
  detectCorsProxyUrl() {
    if (typeof window === "undefined") {
      throw new Error("Cannot detect CORS proxy URL in non-browser environment");
    }
    const { protocol, hostname, port } = window.location;
    const isDev = this.isDevelopmentEnvironment(hostname, port);
    if (isDev) {
      return `${protocol}//localhost:3000`;
    } else {
      return this.buildProductionProxyUrl(protocol, hostname);
    }
  }
  /**
   * 检测是否为开发环境
   */
  isDevelopmentEnvironment(hostname, port) {
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const devPorts = ["3000", "3001", "5173", "5174", "8080", "8081", "4200", "4201"];
    const isDevPort = devPorts.includes(port);
    const isDevDomain = hostname.includes(".local") || hostname.includes(".dev") || hostname.includes(".test") || hostname.includes("dev.") || hostname.includes("staging.");
    const isDevEnv = typeof globalThis.process !== "undefined" && globalThis.process.env && (globalThis.process.env.NODE_ENV === "development" || globalThis.process.env.NODE_ENV === "dev");
    return isLocalhost || isDevPort || isDevDomain || isDevEnv;
  }
  /**
   * 构建生产环境的代理URL
   */
  buildProductionProxyUrl(protocol, hostname) {
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      const domain = parts.slice(-2).join(".");
      return `${protocol}//cors-proxy.${domain}`;
    } else {
      return `${protocol}//cors-proxy.${hostname}`;
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

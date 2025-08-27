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
    if (this.cfg.useProxy) {
      const proxyPath = this.cfg.proxyPath || "/api/loki";
      return `${proxyPath}/loki/api/v1/push`;
    }
    return this.ensurePushUrl(this.cfg.endpoints.loki);
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

type LogLevel = "debug" | "info" | "warn" | "error";

type GlobalContext = {
  app: { name: string; version?: string; env?: string; release?: string };
  user?: { id?: string; sessionId?: string };
  page: { url: string; path: string; referrer?: string };
  device: { ua: string; platform: string; language?: string; viewport?: string; dpi?: number };
};

export type LogEnvelope = {
  timestampNs: string;
  level: LogLevel;
  type: string;
  message: string;
  stack?: string;
  attributes?: Record<string, any>;
  context: GlobalContext;
};

export type SdkH5Config = {
  appName: string;
  appVersion?: string;
  release?: string;
  environment?: "dev" | "test" | "staging" | "prod";
  endpoints: { loki: string };
  headers?: Record<string, string>;
  transport?: "loki"; // fixed for now, reserved for future
  batchMaxBytes?: number;      // default 512*1024
  batchMaxRecords?: number;    // default 100
  flushIntervalMs?: number;    // default 2000
  maxRetries?: number;         // default 3
  backoffMs?: number;          // default 1000
  useSendBeacon?: boolean;     // default true
  enableOfflineBuffer?: boolean; // default true (localStorage)
  sampleRate?: number;         // default 1
  rateLimitPerMin?: number;    // default 300
  // CORS and proxy options
  corsMode?: "cors" | "no-cors" | "same-origin"; // default "cors"
  useProxy?: boolean;          // default false, if true, use relative URL
  proxyPath?: string;          // default "/api/loki", proxy path prefix
  redact?: {
    urlQuery?: boolean;        // default true
    headers?: string[];        // e.g., ["authorization", "cookie"]
    custom?: (envelope: LogEnvelope) => LogEnvelope | null;
  };
  onError?: (err: Error) => void;
};

export class LokiTransport {
  constructor(private cfg: Required<SdkH5Config>) {}

  private labelsFor(record: LogEnvelope) {
    const app = record.context.app?.name || this.cfg.appName;
    const env = record.context.app?.env || this.cfg.environment || '';
    const release = record.context.app?.release || this.cfg.release || '';
    const platform = record.context.device?.platform || 'web';
    return { app, env, release, platform, sdk: 'sdk-h5@0.1.0' };
  }

  private toLogLine(record: LogEnvelope): [string, string] {
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

  async send(records: LogEnvelope[]): Promise<void> {
    if (!records.length) return;
    
    const payload = this.createPayload(records);
    const endpoint = this.getEndpoint();

    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(this.cfg.headers || {}) },
      body: JSON.stringify(payload),
      // keepalive allows sending during page unload in some browsers
      keepalive: true,
      // CORS mode configuration
      mode: this.cfg.corsMode || 'cors'
    };

    const res = await fetch(endpoint, fetchOptions);

    if (!('ok' in res ? res.ok : (res as any).status < 400)) {
      const status = (res as any).status;
      const statusText = (res as any).statusText || '';
      throw new Error(`Loki push failed: ${status} ${statusText}`);
    }
  }

  createPayload(records: LogEnvelope[]) {
    const byLabelKey = new Map<string, { labels: Record<string, string>; values: [string, string][] }>();
    for (const r of records) {
      const labels = this.labelsFor(r);
      const key = JSON.stringify(labels);
      const entry = byLabelKey.get(key) || { labels, values: [] as [string, string][] };
      entry.values.push(this.toLogLine(r));
      byLabelKey.set(key, entry);
    }
    return {
      streams: Array.from(byLabelKey.values()).map(s => ({ stream: s.labels, values: s.values }))
    };
  }

  getEndpoint(): string {
    if (this.cfg.useProxy) {
      // Use proxy mode: return relative URL
      const proxyPath = this.cfg.proxyPath || '/api/loki';
      return `${proxyPath}/loki/api/v1/push`;
    }
    return this.ensurePushUrl(this.cfg.endpoints.loki);
  }

  private ensurePushUrl(base: string): string {
    if (!base.includes('/loki/api/v1/push')) {
      return base.replace(/\/$/, '') + '/loki/api/v1/push';
    }
    return base;
  }
}

export default LokiTransport;
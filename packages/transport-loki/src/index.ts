type LogLevel = "debug" | "info" | "warn" | "error";

type GlobalContext = {
  app: { name: string; version?: string; env?: string; release?: string };
  user?: { id?: string; sessionId?: string };
  page: { url: string; path: string; referrer?: string };
  device: { ua: string; platform: string; language?: string; viewport?: string; dpi?: number; browser?: string };
};

export type LogEnvelope = {
  timestampNs: string;
  level: LogLevel;
  type: string;
  message: string;
  title?: string;
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
  // 传输模式选择
  transportMode?: "direct" | "proxy" | "cors-proxy" | "beacon-only" | "auto"; // default "auto"
  corsProxyUrl?: string;       // CORS代理服务URL
  autoDetectCorsProxy?: boolean; // 自动检测CORS代理URL，默认true
  // 新增：智能CORS处理选项
  corsStrategy?: "auto" | "beacon" | "proxy" | "direct" | "fallback"; // default "auto"
  enableBeaconFallback?: boolean; // 启用beacon降级，默认true
  enableOfflineQueue?: boolean; // 启用离线队列，默认true
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
    return { app, env, release, platform, sdk: 'sdk-h5@1.0.0' };
  }

  private toLogLine(record: LogEnvelope): [string, string] {
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

  async send(records: LogEnvelope[]): Promise<void> {
    if (!records.length) return;
    
    const payload = this.createPayload(records);
    const strategy = this.cfg.corsStrategy || 'auto';
    
    // 根据策略选择发送方式
    switch (strategy) {
      case 'beacon':
        await this.sendWithBeacon(payload);
        break;
      case 'proxy':
        await this.sendWithProxy(payload);
        break;
      case 'direct':
        await this.sendWithFetch(payload);
        break;
      case 'fallback':
        await this.sendWithFallback(payload);
        break;
      case 'auto':
      default:
        await this.sendWithAutoStrategy(payload);
        break;
    }
  }

  /**
   * 自动策略：智能选择最佳发送方式
   */
  private async sendWithAutoStrategy(payload: any): Promise<void> {
    const endpoint = this.cfg.endpoints.loki;
    
    // 1. 首先尝试直接发送（如果Loki服务器支持CORS）
    try {
      await this.sendWithFetch(payload);
      return;
    } catch (error) {
      console.debug('Direct fetch failed, trying beacon...', error);
    }
    
    // 2. 如果直接发送失败，尝试使用beacon
    if (this.cfg.enableBeaconFallback !== false) {
      try {
        await this.sendWithBeacon(payload);
        return;
      } catch (error) {
        console.debug('Beacon failed, trying proxy...', error);
      }
    }
    
    // 3. 如果beacon也失败，尝试代理模式
    try {
      await this.sendWithProxy(payload);
      return;
    } catch (error) {
      console.debug('Proxy failed, using offline queue...', error);
    }
    
    // 4. 所有方式都失败，使用离线队列
    if (this.cfg.enableOfflineQueue !== false) {
      this.queueForLater(payload);
    } else {
      throw new Error('All sending strategies failed and offline queue is disabled');
    }
  }

  /**
   * 使用fetch发送（直接模式）
   */
  private async sendWithFetch(payload: any): Promise<void> {
    const endpoint = this.getDirectEndpoint();
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        ...(this.cfg.headers || {}) 
      },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: 'cors' // 尝试CORS模式
    };

    const res = await fetch(endpoint, fetchOptions);
    if (!res.ok) {
      throw new Error(`Loki push failed: ${res.status} ${res.statusText}`);
    }
  }

  /**
   * 使用sendBeacon发送
   */
  private async sendWithBeacon(payload: any): Promise<void> {
    if (!navigator.sendBeacon) {
      throw new Error('sendBeacon is not supported');
    }

    const endpoint = this.getDirectEndpoint();
    const blob = new Blob([JSON.stringify(payload)], { 
      type: 'application/json' 
    });

    const success = navigator.sendBeacon(endpoint, blob);
    if (!success) {
      throw new Error('sendBeacon failed');
    }
  }

  /**
   * 使用代理发送
   */
  private async sendWithProxy(payload: any): Promise<void> {
    const endpoint = this.getProxyEndpoint();
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        ...(this.cfg.headers || {}) 
      },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: 'same-origin' // 代理模式使用same-origin
    };

    const res = await fetch(endpoint, fetchOptions);
    if (!res.ok) {
      throw new Error(`Proxy push failed: ${res.status} ${res.statusText}`);
    }
  }

  /**
   * 降级策略：依次尝试不同方式
   */
  private async sendWithFallback(payload: any): Promise<void> {
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
        console.debug('Strategy failed, trying next...', error);
      }
    }

    // 所有策略都失败
    if (this.cfg.enableOfflineQueue !== false) {
      this.queueForLater(payload);
    } else {
      throw new Error('All sending strategies failed');
    }
  }

  /**
   * 将数据加入离线队列
   */
  private queueForLater(payload: any): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const queue = JSON.parse(localStorage.getItem('loki-sdk-offline-queue') || '[]');
        queue.push({
          payload,
          timestamp: Date.now(),
          endpoint: this.cfg.endpoints.loki
        });
        
        // 限制队列大小
        if (queue.length > 100) {
          queue.splice(0, queue.length - 100);
        }
        
        localStorage.setItem('loki-sdk-offline-queue', JSON.stringify(queue));
        console.debug('Data queued for later sending');
      } catch (error) {
        console.warn('Failed to queue data:', error);
      }
    }
  }

  /**
   * 获取直接端点URL
   */
  private getDirectEndpoint(): string {
    return this.ensurePushUrl(this.cfg.endpoints.loki);
  }

  /**
   * 获取代理端点URL
   */
  private getProxyEndpoint(): string {
    const proxyPath = this.cfg.proxyPath || '/api/loki';
    return `${proxyPath}/loki/api/v1/push`;
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

  /**
   * 兼容旧的getEndpoint方法
   */
  getEndpoint(): string {
    const mode = this.cfg.transportMode || 'auto';
    
    switch (mode) {
      case 'proxy':
        return this.getProxyEndpoint();
      case 'direct':
        return this.getDirectEndpoint();
      case 'beacon-only':
        return this.getDirectEndpoint();
      case 'auto':
      default:
        return this.getDirectEndpoint();
    }
  }

  private ensurePushUrl(base: string): string {
    if (!base.includes('/loki/api/v1/push')) {
      return base.replace(/\/$/, '') + '/loki/api/v1/push';
    }
    return base;
  }
}

export default LokiTransport;
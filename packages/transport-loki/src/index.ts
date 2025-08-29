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
  // 新增：传输模式选择
  transportMode?: "direct" | "proxy" | "cors-proxy"; // default "direct"
  corsProxyUrl?: string;       // CORS代理服务URL，如 "https://cors-proxy.yourdomain.com"
  autoDetectCorsProxy?: boolean; // 自动检测CORS代理URL，默认true
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
    // 根据传输模式选择不同的端点
    switch (this.cfg.transportMode || 'direct') {
      case 'proxy':
        // 使用本地代理模式（需要用户配置Nginx等）
        const proxyPath = this.cfg.proxyPath || '/api/loki';
        return `${proxyPath}/loki/api/v1/push`;
      
      case 'cors-proxy':
        // 使用CORS代理服务
        const proxyUrl = this.getCorsProxyUrl();
        const lokiUrl = this.ensurePushUrl(this.cfg.endpoints.loki);
        return `${proxyUrl}/proxy?target=${encodeURIComponent(lokiUrl)}`;
      
      case 'direct':
      default:
        // 直接模式（需要Loki服务器支持CORS）
        return this.ensurePushUrl(this.cfg.endpoints.loki);
    }
  }

  /**
   * 获取CORS代理服务URL
   * 支持自动检测和手动配置
   */
  private getCorsProxyUrl(): string {
    // 如果手动配置了corsProxyUrl，优先使用
    if (this.cfg.corsProxyUrl) {
      return this.cfg.corsProxyUrl.replace(/\/$/, '');
    }

    // 如果禁用了自动检测，抛出错误
    if (this.cfg.autoDetectCorsProxy === false) {
      throw new Error('corsProxyUrl is required when autoDetectCorsProxy is disabled');
    }

    // 自动检测CORS代理URL
    return this.detectCorsProxyUrl();
  }

  /**
   * 自动检测CORS代理服务URL
   * 开发环境：使用localhost:3000
   * 生产环境：使用当前域名下的代理服务
   */
  private detectCorsProxyUrl(): string {
    if (typeof window === 'undefined') {
      throw new Error('Cannot detect CORS proxy URL in non-browser environment');
    }

    const { protocol, hostname, port } = window.location;
    
    // 检测是否为开发环境
    const isDev = this.isDevelopmentEnvironment(hostname, port);
    
    if (isDev) {
      // 开发环境：使用localhost:3000作为CORS代理
      return `${protocol}//localhost:3000`;
    } else {
      // 生产环境：使用当前域名下的代理服务
      return this.buildProductionProxyUrl(protocol, hostname);
    }
  }

  /**
   * 检测是否为开发环境
   */
  private isDevelopmentEnvironment(hostname: string, port: string): boolean {
    // 本地开发环境
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // 开发端口检测（Vite、Webpack等常用端口）
    const devPorts = ['3000', '3001', '5173', '5174', '8080', '8081', '4200', '4201'];
    const isDevPort = devPorts.includes(port);
    
    // 开发域名模式
    const isDevDomain = hostname.includes('.local') || 
                       hostname.includes('.dev') || 
                       hostname.includes('.test') ||
                       hostname.includes('dev.') ||
                       hostname.includes('staging.');
    
    // 检查环境变量（如果可用）
    const isDevEnv = typeof (globalThis as any).process !== 'undefined' && 
                    (globalThis as any).process.env && 
                    ((globalThis as any).process.env.NODE_ENV === 'development' || 
                     (globalThis as any).process.env.NODE_ENV === 'dev');
    
    return isLocalhost || isDevPort || isDevDomain || isDevEnv;
  }

  /**
   * 构建生产环境的代理URL
   */
  private buildProductionProxyUrl(protocol: string, hostname: string): string {
    // 处理子域名情况
    const parts = hostname.split('.');
    
    if (parts.length >= 2) {
      // 标准域名：example.com -> cors-proxy.example.com
      const domain = parts.slice(-2).join('.');
      return `${protocol}//cors-proxy.${domain}`;
    } else {
      // 单级域名或其他情况：使用当前域名
      return `${protocol}//cors-proxy.${hostname}`;
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
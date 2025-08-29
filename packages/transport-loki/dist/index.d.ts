type LogLevel = "debug" | "info" | "warn" | "error";
type GlobalContext = {
    app: {
        name: string;
        version?: string;
        env?: string;
        release?: string;
    };
    user?: {
        id?: string;
        sessionId?: string;
    };
    page: {
        url: string;
        path: string;
        referrer?: string;
    };
    device: {
        ua: string;
        platform: string;
        language?: string;
        viewport?: string;
        dpi?: number;
        browser?: string;
    };
};
type LogEnvelope = {
    timestampNs: string;
    level: LogLevel;
    type: string;
    message: string;
    title?: string;
    stack?: string;
    attributes?: Record<string, any>;
    context: GlobalContext;
};
type SdkH5Config = {
    appName: string;
    appVersion?: string;
    release?: string;
    environment?: "dev" | "test" | "staging" | "prod";
    endpoints: {
        loki: string;
    };
    headers?: Record<string, string>;
    transport?: "loki";
    batchMaxBytes?: number;
    batchMaxRecords?: number;
    flushIntervalMs?: number;
    maxRetries?: number;
    backoffMs?: number;
    useSendBeacon?: boolean;
    enableOfflineBuffer?: boolean;
    sampleRate?: number;
    rateLimitPerMin?: number;
    corsMode?: "cors" | "no-cors" | "same-origin";
    useProxy?: boolean;
    proxyPath?: string;
    transportMode?: "direct" | "proxy" | "cors-proxy";
    corsProxyUrl?: string;
    autoDetectCorsProxy?: boolean;
    redact?: {
        urlQuery?: boolean;
        headers?: string[];
        custom?: (envelope: LogEnvelope) => LogEnvelope | null;
    };
    onError?: (err: Error) => void;
};
declare class LokiTransport {
    private cfg;
    constructor(cfg: Required<SdkH5Config>);
    private labelsFor;
    private toLogLine;
    send(records: LogEnvelope[]): Promise<void>;
    createPayload(records: LogEnvelope[]): {
        streams: {
            stream: Record<string, string>;
            values: [string, string][];
        }[];
    };
    getEndpoint(): string;
    /**
     * 获取CORS代理服务URL
     * 支持自动检测和手动配置
     */
    private getCorsProxyUrl;
    /**
     * 自动检测CORS代理服务URL
     * 开发环境：使用localhost:3000
     * 生产环境：使用当前域名下的代理服务
     */
    private detectCorsProxyUrl;
    /**
     * 检测是否为开发环境
     */
    private isDevelopmentEnvironment;
    /**
     * 构建生产环境的代理URL
     */
    private buildProductionProxyUrl;
    private ensurePushUrl;
}

export { type LogEnvelope, LokiTransport, type SdkH5Config, LokiTransport as default };

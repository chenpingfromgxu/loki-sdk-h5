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
    transportMode?: "direct" | "proxy" | "cors-proxy" | "beacon-only" | "auto";
    corsProxyUrl?: string;
    autoDetectCorsProxy?: boolean;
    corsStrategy?: "auto" | "beacon" | "proxy" | "direct" | "fallback";
    enableBeaconFallback?: boolean;
    enableOfflineQueue?: boolean;
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
    /**
     * 自动策略：智能选择最佳发送方式
     */
    private sendWithAutoStrategy;
    /**
     * 使用fetch发送（直接模式）
     */
    private sendWithFetch;
    /**
     * 使用sendBeacon发送
     */
    private sendWithBeacon;
    /**
     * 使用代理发送
     */
    private sendWithProxy;
    /**
     * 降级策略：依次尝试不同方式
     */
    private sendWithFallback;
    /**
     * 将数据加入离线队列
     */
    private queueForLater;
    /**
     * 获取直接端点URL
     */
    private getDirectEndpoint;
    /**
     * 获取代理端点URL
     */
    private getProxyEndpoint;
    createPayload(records: LogEnvelope[]): {
        streams: {
            stream: Record<string, string>;
            values: [string, string][];
        }[];
    };
    /**
     * 兼容旧的getEndpoint方法
     */
    getEndpoint(): string;
    private ensurePushUrl;
}

export { type LogEnvelope, LokiTransport, type SdkH5Config, LokiTransport as default };

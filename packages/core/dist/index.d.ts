import { SdkH5Config, LogEnvelope } from '@chenpingfromgxu/sdk-h5-transport-loki';
export { LogEnvelope, SdkH5Config } from '@chenpingfromgxu/sdk-h5-transport-loki';

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
interface SdkH5 {
    init(config: SdkH5Config): void;
    installAutoCapture(): void;
    captureError(error: unknown, attributes?: Record<string, any>, title?: string): void;
    log(level: LogLevel, message: string, attributes?: Record<string, any>, title?: string): void;
    setUser(userId?: string): void;
    setContext(context: Partial<LogEnvelope["context"]>): void;
    flush(): Promise<void>;
    shutdown(): Promise<void>;
}

declare function generateSessionId(): string;
declare function detectBrowser(userAgent: string): string;
declare function buildErrorEnvelope(error: unknown, context: GlobalContext, attributes?: Record<string, any>, title?: string): LogEnvelope;
declare function buildLogEnvelope(level: 'debug' | 'info' | 'warn' | 'error', message: string, context: GlobalContext, attributes?: Record<string, any>, title?: string): LogEnvelope;

declare class SdkH5Impl implements SdkH5 {
    private cfg;
    private queue;
    private timer;
    private context;
    private limiter;
    private transport;
    private isShuttingDown;
    init(config: SdkH5Config): void;
    installAutoCapture(): void;
    captureError(error: unknown, attributes?: Record<string, any>, title?: string): void;
    log(level: LogLevel, message: string, attributes?: Record<string, any>, title?: string): void;
    setUser(userId?: string): void;
    setContext(context: Partial<LogEnvelope["context"]>): void;
    flush(): Promise<void>;
    shutdown(): Promise<void>;
    private enqueue;
    private bindLifecycleEvents;
}

declare const sdkH5: SdkH5Impl;
declare function installAutoCapture(sdk?: SdkH5Impl): void;

export { type GlobalContext, type LogLevel, type SdkH5, SdkH5Impl, buildErrorEnvelope, buildLogEnvelope, detectBrowser, generateSessionId, installAutoCapture, sdkH5 };

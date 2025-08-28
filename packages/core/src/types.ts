import type { LogEnvelope, SdkH5Config } from '@ppyuesheng/loki-sdk-h5-transport-loki';

// Re-export types from transport-loki to maintain a clean API
export type { LogEnvelope, SdkH5Config };

export type LogLevel = "debug" | "info" | "warn" | "error";

export type GlobalContext = {
  app: { name: string; version?: string; env?: string; release?: string };
  user?: { id?: string; sessionId?: string };
  page: { url: string; path: string; referrer?: string };
  device: { ua: string; platform: string; language?: string; viewport?: string; dpi?: number; browser?: string };
};

export interface SdkH5 {
  init(config: SdkH5Config): void;
  installAutoCapture(): void; // shorthand for adapter-js auto handlers
  captureError(error: unknown, attributes?: Record<string, any>, title?: string): void;
  log(level: LogLevel, message: string, attributes?: Record<string, any>, title?: string): void;
  setUser(userId?: string): void;
  setContext(context: Partial<LogEnvelope["context"]>): void;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}
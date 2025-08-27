import type { LogEnvelope, SdkH5Config } from '@ppyuesheng-org/sdk-h5-transport-loki';
import type { GlobalContext } from './types.js';

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;

  constructor(maxPerMinute: number) {
    this.maxTokens = maxPerMinute;
    this.tokens = maxPerMinute;
    this.lastRefill = Date.now();
  }

  allow(): boolean {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    // Refill tokens based on time passed (tokens per millisecond)
    const tokensToAdd = (timePassed / 60000) * this.maxTokens;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    return false;
  }
}

export function withDefaults(cfg: SdkH5Config): Required<SdkH5Config> {
  return {
    appName: cfg.appName,
    appVersion: cfg.appVersion || '1.0.0',
    release: cfg.release || cfg.appVersion || '1.0.0',
    environment: cfg.environment || 'prod',
    endpoints: cfg.endpoints,
    headers: cfg.headers || {},
    transport: cfg.transport || 'loki',
    batchMaxBytes: cfg.batchMaxBytes || 512 * 1024,
    batchMaxRecords: cfg.batchMaxRecords || 100,
    flushIntervalMs: cfg.flushIntervalMs || 2000,
    maxRetries: cfg.maxRetries || 3,
    backoffMs: cfg.backoffMs || 1000,
    useSendBeacon: cfg.useSendBeacon ?? true,
    enableOfflineBuffer: cfg.enableOfflineBuffer ?? true,
    sampleRate: cfg.sampleRate || 1,
    rateLimitPerMin: cfg.rateLimitPerMin || 300,
    corsMode: cfg.corsMode || 'cors',
    useProxy: cfg.useProxy || false,
    proxyPath: cfg.proxyPath || '/api/loki',
    redact: cfg.redact || {},
    onError: cfg.onError || (() => {}),
  };
}

export function buildInitialContext(cfg: SdkH5Config): GlobalContext {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const referrer = typeof document !== 'undefined' ? document.referrer : '';
  
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const language = typeof navigator !== 'undefined' ? navigator.language : '';
  const browser = detectBrowser(ua);
  
  let viewport = '';
  let dpi = 1;
  if (typeof window !== 'undefined') {
    viewport = `${window.screen.width}x${window.screen.height}`;
    dpi = window.devicePixelRatio || 1;
  }

  return {
    app: {
      name: cfg.appName,
      version: cfg.appVersion,
      env: cfg.environment,
      release: cfg.release,
    },
    user: {
      sessionId: generateSessionId(),
    },
    page: { url, path, referrer },
    device: {
      ua,
      platform: 'web',
      language,
      viewport,
      dpi,
      browser,
    },
  };
}

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function detectBrowser(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  // Check for Edge first (contains "chrome" in UA)
  if (ua.includes('edg/') || ua.includes('edge/')) {
    return 'edge';
  }
  
  // Check for Chrome (should be before Safari since Chrome contains "safari")
  if (ua.includes('chrome/') && !ua.includes('edg/')) {
    return 'chrome';
  }
  
  // Check for Firefox
  if (ua.includes('firefox/')) {
    return 'firefox';
  }
  
  // Check for Safari (should be after Chrome check)
  if (ua.includes('safari/') && !ua.includes('chrome/')) {
    return 'safari';
  }
  
  // Check for Opera
  if (ua.includes('opera/') || ua.includes('opr/')) {
    return 'opera';
  }
  
  // Check for Internet Explorer
  if (ua.includes('msie') || ua.includes('trident/')) {
    return 'ie';
  }
  
  return 'unknown';
}

export function sample(rate: number): boolean {
  return Math.random() < rate;
}

export function buildErrorEnvelope(
  error: unknown,
  context: GlobalContext,
  attributes?: Record<string, any>,
  title?: string
): LogEnvelope {
  const timestampNs = (Date.now() * 1_000_000).toString();
  
  let message = 'Unknown error';
  let stack: string | undefined;
  
  if (error instanceof Error) {
    message = error.message;
    stack = error.stack;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    message = (error as any).message || JSON.stringify(error);
    stack = (error as any).stack;
  }

  return {
    timestampNs,
    level: 'error',
    type: 'js_error',
    message,
    title,
    stack,
    attributes,
    context,
  };
}

export function buildLogEnvelope(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  context: GlobalContext,
  attributes?: Record<string, any>,
  title?: string
): LogEnvelope {
  const timestampNs = (Date.now() * 1_000_000).toString();
  
  return {
    timestampNs,
    level,
    type: 'manual_log',
    message,
    title,
    attributes,
    context,
  };
}

export function applyRedaction(
  envelope: LogEnvelope,
  redact?: SdkH5Config['redact']
): LogEnvelope | null {
  if (!redact) return envelope;

  // Apply custom redaction first - if it returns null, drop the record
  if (redact.custom) {
    const result = redact.custom(envelope);
    if (!result) return null;
    envelope = result;
  }

  // Redact URL query parameters
  if (redact.urlQuery && envelope.context.page?.url) {
    try {
      const url = new URL(envelope.context.page.url);
      envelope.context.page.url = url.origin + url.pathname;
    } catch {
      // Invalid URL, leave as is
    }
  }

  // TODO: Redact headers if needed (for future HTTP transport)
  
  return envelope;
}

export function shouldFlush(queue: LogEnvelope[], cfg: Required<SdkH5Config>): boolean {
  if (queue.length >= cfg.batchMaxRecords) return true;
  
  const totalBytes = queue.reduce((sum, env) => {
    return sum + JSON.stringify(env).length;
  }, 0);
  
  return totalBytes >= cfg.batchMaxBytes;
}

export function drainBatch(queue: LogEnvelope[], cfg: Required<SdkH5Config>): LogEnvelope[] {
  const batch: LogEnvelope[] = [];
  let totalBytes = 0;
  
  while (queue.length > 0 && batch.length < cfg.batchMaxRecords) {
    const next = queue[0];
    const nextBytes = JSON.stringify(next).length;
    
    if (totalBytes + nextBytes > cfg.batchMaxBytes && batch.length > 0) {
      break;
    }
    
    batch.push(queue.shift()!);
    totalBytes += nextBytes;
  }
  
  return batch;
}

const STORAGE_KEY = 'sdk-h5-offline-buffer';
const MAX_OFFLINE_RECORDS = 50;

export function persistToStorage(queue: LogEnvelope[]): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    // Keep only the last N records for offline buffer
    const toStore = queue.slice(-MAX_OFFLINE_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // localStorage might be full or disabled
  }
}

export function restoreFromStorage(queue: LogEnvelope[]): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const records = JSON.parse(stored) as LogEnvelope[];
      queue.push(...records);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Invalid JSON or other error
  }
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseBackoffMs: number
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on 4xx errors (except 429)
      if (error instanceof Error && error.message.includes('4')) {
        const status = parseInt(error.message.match(/(\d{3})/)?.[1] || '0');
        if (status >= 400 && status < 500 && status !== 429) {
          throw error;
        }
      }
      
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const backoff = baseBackoffMs * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * backoff;
        await new Promise(resolve => setTimeout(resolve, backoff + jitter));
      }
    }
  }
  
  throw lastError!;
}
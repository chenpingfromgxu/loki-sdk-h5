import type { SdkH5Config, LogEnvelope } from '@ppyuesheng/loki-sdk-h5-transport-loki';
import type { SdkH5, LogLevel, GlobalContext } from './types.js';
import { LokiTransport } from '@ppyuesheng/loki-sdk-h5-transport-loki';
import {
  RateLimiter,
  withDefaults,
  buildInitialContext,
  sample,
  buildErrorEnvelope,
  buildLogEnvelope,
  applyRedaction,
  shouldFlush,
  drainBatch,
  persistToStorage,
  restoreFromStorage,
  retry,
} from './utils.js';

export class SdkH5Impl implements SdkH5 {
  private cfg!: Required<SdkH5Config>;
  private queue: LogEnvelope[] = [];
  private timer: number | undefined;
  private context!: GlobalContext;
  private limiter!: RateLimiter;
  private transport!: LokiTransport;
  private isShuttingDown = false;

  init(config: SdkH5Config): void {
    if (this.cfg) {
      throw new Error('SDK already initialized');
    }

    this.cfg = withDefaults(config);
    this.context = buildInitialContext(config);
    this.limiter = new RateLimiter(this.cfg.rateLimitPerMin);
    this.transport = new LokiTransport(this.cfg);

    // Restore any offline buffered logs
    if (this.cfg.enableOfflineBuffer) {
      restoreFromStorage(this.queue);
    }

    // Set up periodic flush
    if (typeof window !== 'undefined') {
      this.timer = window.setInterval(() => {
        this.flush().catch(err => this.cfg.onError(err));
      }, this.cfg.flushIntervalMs);

      // Bind lifecycle events for final flush
      this.bindLifecycleEvents();
    }
  }

  installAutoCapture(): void {
    // This method is kept for API consistency
    // The actual auto-capture functionality is implemented in the main index.ts
    // or should be imported separately from adapter packages
  }

  captureError(error: unknown, attributes?: Record<string, any>, title?: string): void {
    if (!this.cfg || this.isShuttingDown) return;
    
    if (!sample(this.cfg.sampleRate)) return;
    
    const envelope = buildErrorEnvelope(error, this.context, attributes, title);
    this.enqueue(envelope);
  }

  log(level: LogLevel, message: string, attributes?: Record<string, any>, title?: string): void {
    if (!this.cfg || this.isShuttingDown) return;
    
    const envelope = buildLogEnvelope(level, message, this.context, attributes, title);
    this.enqueue(envelope);
  }

  setUser(userId?: string): void {
    if (!this.context) return;
    
    this.context = {
      ...this.context,
      user: {
        ...this.context.user,
        id: userId,
      },
    };
  }

  setContext(context: Partial<LogEnvelope["context"]>): void {
    if (!this.context) return;
    
    this.context = {
      ...this.context,
      ...context,
      app: { ...this.context.app, ...context.app },
      user: { ...this.context.user, ...context.user },
      page: { ...this.context.page, ...context.page },
      device: { ...this.context.device, ...context.device },
    };
  }

  async flush(): Promise<void> {
    if (!this.cfg || this.queue.length === 0) return;

    const batch = drainBatch(this.queue, this.cfg);
    if (batch.length === 0) return;

    try {
      await retry(
        () => this.transport.send(batch),
        this.cfg.maxRetries,
        this.cfg.backoffMs
      );
    } catch (err) {
      this.cfg.onError(err as Error);
      
      // Re-queue failed batch if offline buffer is enabled
      if (this.cfg.enableOfflineBuffer && !this.isShuttingDown) {
        this.queue.unshift(...batch);
        persistToStorage(this.queue);
      }
    }
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    if (typeof window !== 'undefined' && this.timer) {
      window.clearInterval(this.timer);
      this.timer = undefined;
    }

    // Final flush
    await this.flush();
  }

  private enqueue(envelope: LogEnvelope): void {
    const filtered = applyRedaction(envelope, this.cfg.redact);
    if (!filtered) return;

    if (!this.limiter.allow()) return;

    this.queue.push(filtered);

    // Trigger immediate flush if batch limits are reached
    if (shouldFlush(this.queue, this.cfg)) {
      this.flush().catch(err => this.cfg.onError(err));
    }

    // Persist to offline buffer
    if (this.cfg.enableOfflineBuffer) {
      persistToStorage(this.queue);
    }
  }

  private bindLifecycleEvents(): void {
    if (typeof window === 'undefined') return;

    const flushOnExit = () => {
      // Try to send remaining logs using sendBeacon for reliability
      if (this.queue.length > 0 && this.cfg.useSendBeacon && navigator.sendBeacon) {
        const batch = drainBatch(this.queue, this.cfg);
        if (batch.length > 0) {
          try {
            const payload = this.transport.createPayload(batch);
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(this.transport.getEndpoint(), blob);
          } catch (err) {
            // sendBeacon failed, save to offline buffer
            if (this.cfg.enableOfflineBuffer) {
              persistToStorage(this.queue);
            }
          }
        }
      } else if (this.cfg.enableOfflineBuffer) {
        // Save remaining logs for next session
        persistToStorage(this.queue);
      }
    };

    window.addEventListener('beforeunload', flushOnExit);
    window.addEventListener('pagehide', flushOnExit);
    
    // Also flush when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush().catch(err => this.cfg.onError(err));
      }
    });
  }
}
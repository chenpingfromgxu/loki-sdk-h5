export interface SdkH5 {
  captureError(error: unknown, attributes?: Record<string, any>): void;
  log(level: string, message: string, attributes?: Record<string, any>): void;
}

export function installAutoCapture(sdk: SdkH5) {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event: ErrorEvent | Event) => {
    const anyEvent = event as any;
    // resource error has target/srcElement
    if ((anyEvent as Event).target && !(anyEvent as ErrorEvent).error) {
      const target = (anyEvent as Event).target as any;
      const src = target?.src || target?.href || '';
      sdk.log('error', 'resource_error', {
        tagName: target?.tagName,
        src,
      });
      return;
    }
    const err = (event as ErrorEvent).error || (event as any).message || 'Unknown error';
    sdk.captureError(err, { origin: 'window.onerror' });
  }, true);

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    sdk.captureError(event.reason, { origin: 'unhandledrejection' });
  });
}
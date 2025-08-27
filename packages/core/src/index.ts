// Export types
export type {
  LogLevel,
  GlobalContext,
  LogEnvelope,
  SdkH5Config,
  SdkH5,
} from './types.js';

// Export utilities (for adapters)
export {
  buildErrorEnvelope,
  buildLogEnvelope,
  generateSessionId,
} from './utils.js';

// Export the main SDK implementation
export { SdkH5Impl } from './sdk.js';

// Export the singleton instance
import { SdkH5Impl } from './sdk.js';
export const sdkH5 = new SdkH5Impl();

// For convenience, also export installAutoCapture from adapter-js
// This allows users to import both from core package
export function installAutoCapture(sdk?: SdkH5Impl) {
  const targetSdk = sdk || sdkH5;
  
  if (typeof window === 'undefined') return;

  // JS error handling
  window.addEventListener('error', (event: ErrorEvent | Event) => {
    const anyEvent = event as any;
    // resource error has target/srcElement
    if ((anyEvent as Event).target && !(anyEvent as ErrorEvent).error) {
      const target = (anyEvent as Event).target as any;
      const src = target?.src || target?.href || '';
      targetSdk.log('error', 'resource_error', {
        tagName: target?.tagName,
        src,
      });
      return;
    }
    const err = (event as ErrorEvent).error || (event as any).message || 'Unknown error';
    targetSdk.captureError(err, { origin: 'window.onerror' });
  }, true);

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    targetSdk.captureError(event.reason, { origin: 'unhandledrejection' });
  });
}
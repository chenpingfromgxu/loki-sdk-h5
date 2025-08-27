export interface SdkH5 {
  captureError(error: unknown, attributes?: Record<string, any>): void;
}

export function installRnGlobalHandlers(sdk: SdkH5) {
  // Check if we're in React Native environment
  if (typeof globalThis !== 'undefined' && (globalThis as any).ErrorUtils) {
    const prev = (globalThis as any).ErrorUtils?.getGlobalHandler?.();
    (globalThis as any).ErrorUtils?.setGlobalHandler?.((error: any, isFatal: boolean) => {
      sdk.captureError(error, { rnIsFatal: isFatal });
      if (typeof prev === 'function') prev(error, isFatal);
    });
  }
}
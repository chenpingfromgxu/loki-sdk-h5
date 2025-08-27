import type { App } from 'vue';

export interface SdkH5 {
  captureError(error: unknown, attributes?: Record<string, any>): void;
}

export function createSdkVuePlugin(sdk: SdkH5) {
  return {
    install(app: App) {
      const prev = (app.config as any).errorHandler;
      (app.config as any).errorHandler = (err: any, instance: any, info: string) => {
        sdk.captureError(err, { vueInfo: info });
        if (typeof prev === 'function') prev(err, instance, info);
      };
      (app as any).provide('$sdkH5', sdk);
    }
  };
}
import { App } from 'vue';

interface SdkH5 {
    captureError(error: unknown, attributes?: Record<string, any>): void;
}
declare function createSdkVuePlugin(sdk: SdkH5): {
    install(app: App): void;
};

export { SdkH5, createSdkVuePlugin };

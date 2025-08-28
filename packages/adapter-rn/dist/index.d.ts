interface SdkH5 {
    captureError(error: unknown, attributes?: Record<string, any>): void;
}
declare function installRnGlobalHandlers(sdk: SdkH5): void;

export { SdkH5, installRnGlobalHandlers };

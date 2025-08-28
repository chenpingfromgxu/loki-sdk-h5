interface SdkH5 {
    captureError(error: unknown, attributes?: Record<string, any>): void;
    log(level: string, message: string, attributes?: Record<string, any>): void;
}
declare function installAutoCapture(sdk: SdkH5): void;

export { SdkH5, installAutoCapture };

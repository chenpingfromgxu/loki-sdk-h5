// src/index.ts
function createSdkVuePlugin(sdk) {
  return {
    install(app) {
      const prev = app.config.errorHandler;
      app.config.errorHandler = (err, instance, info) => {
        sdk.captureError(err, { vueInfo: info });
        if (typeof prev === "function")
          prev(err, instance, info);
      };
      app.provide("$sdkH5", sdk);
    }
  };
}
export {
  createSdkVuePlugin
};

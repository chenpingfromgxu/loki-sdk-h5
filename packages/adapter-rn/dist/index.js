// src/index.ts
function installRnGlobalHandlers(sdk) {
  if (typeof globalThis !== "undefined" && globalThis.ErrorUtils) {
    const prev = globalThis.ErrorUtils?.getGlobalHandler?.();
    globalThis.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
      sdk.captureError(error, { rnIsFatal: isFatal });
      if (typeof prev === "function")
        prev(error, isFatal);
    });
  }
}
export {
  installRnGlobalHandlers
};

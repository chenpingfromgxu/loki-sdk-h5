// src/index.ts
function installAutoCapture(sdk) {
  if (typeof window === "undefined")
    return;
  window.addEventListener("error", (event) => {
    const anyEvent = event;
    if (anyEvent.target && !anyEvent.error) {
      const target = anyEvent.target;
      const src = target?.src || target?.href || "";
      sdk.log("error", "resource_error", {
        tagName: target?.tagName,
        src
      });
      return;
    }
    const err = event.error || event.message || "Unknown error";
    sdk.captureError(err, { origin: "window.onerror" });
  }, true);
  window.addEventListener("unhandledrejection", (event) => {
    sdk.captureError(event.reason, { origin: "unhandledrejection" });
  });
}
export {
  installAutoCapture
};

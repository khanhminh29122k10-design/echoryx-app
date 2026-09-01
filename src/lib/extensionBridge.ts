// Best-effort bridge to the EchoRyx Chrome extension (echoryx-extension/, YouTube tracking).
//
// This only works when: (1) the extension is installed in the browser, and (2) this page's
// origin is listed in the extension's manifest.json under "externally_connectable" — Chrome
// then injects a minimal chrome.runtime.sendMessage into the page so it can talk to the
// extension. If either isn't true, chrome.runtime is simply undefined here and every call
// below quietly no-ops — this must never block the normal "Start now" flow.
//
// EXTENSION_ID is specific to this dev machine's "Load unpacked" install (Chrome derives it
// from the extension folder's absolute path, and it stays stable as long as that folder
// doesn't move). Publishing the extension to the Chrome Web Store later assigns a permanent
// ID that would replace this constant.
const ECHORYX_EXTENSION_ID = "lfkbedakcbheebmbpmkehccmfdemjjea";

function getChromeRuntime(): { sendMessage: (...args: unknown[]) => void; lastError?: unknown } | undefined {
  return (window as unknown as { chrome?: { runtime?: { sendMessage: (...args: unknown[]) => void; lastError?: unknown } } }).chrome?.runtime;
}

/** Flips the extension's YouTube tracking toggle (same switch as the popup's "Niso is on/off"). */
export function setExtensionTracking(enabled: boolean) {
  try {
    const runtime = getChromeRuntime();
    if (!runtime?.sendMessage) return;
    runtime.sendMessage(ECHORYX_EXTENSION_ID, { type: "echoryx:setTracking", enabled }, () => {
      void runtime.lastError; // swallow "Could not establish connection" — extension may not be installed/listening
    });
  } catch {
    // never let this block navigation
  }
}

/** Reads the extension's current tracking on/off state. Resolves `null` if unreachable (not installed, not connectable from this origin, etc.) — callers should treat that as "unknown," not "off." */
export function getExtensionTracking(): Promise<boolean | null> {
  return new Promise((resolve) => {
    try {
      const runtime = getChromeRuntime();
      if (!runtime?.sendMessage) {
        resolve(null);
        return;
      }
      runtime.sendMessage(ECHORYX_EXTENSION_ID, { type: "echoryx:getTracking" }, (response: { enabled?: boolean } | undefined) => {
        void runtime.lastError;
        resolve(typeof response?.enabled === "boolean" ? response.enabled : null);
      });
    } catch {
      resolve(null);
    }
  });
}

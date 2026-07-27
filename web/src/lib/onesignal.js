// Lazy-loader for the OneSignal Web Push SDK.
//
// The SDK is ~8 kB plus a CDN round-trip and was historically loaded
// from index.html on every page hit. Marketing visitors (LandingPage,
// /zodiac/*, /horoscope/today, /pricing) don't need push notifications,
// so we skip the network cost there entirely and only inject the SDK
// when an authed user lands on the app.
//
// Idempotent — calling loadOneSignal() multiple times in the same
// page session returns the same Promise that resolves once the SDK
// has called init().

let _onesignalPromise = null;

export function loadOneSignal() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (_onesignalPromise) return _onesignalPromise;

  const appId = process.env.REACT_APP_ONESIGNAL_APP_ID;
  if (!appId) {
    // Operator hasn't configured a OneSignal app — silently no-op so
    // the rest of the app still functions.
    _onesignalPromise = Promise.resolve(null);
    return _onesignalPromise;
  }

  _onesignalPromise = new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    const finish = (sdk) => resolve(sdk);

    // Queue an init call. This runs once the SDK script finishes
    // loading and pushes the deferred callbacks.
    window.OneSignalDeferred.push((OneSignal) => {
      try {
        OneSignal.init({
          appId,
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: true,
        });
        finish(OneSignal);
      } catch (e) {
        finish(null);
      }
    });

    // Inject the SDK script if not already present.
    const existing = document.querySelector(
      'script[data-nataltruth-onesignal-sdk="1"]'
    );
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      script.dataset.nataltruthOnesignalSdk = "1";
      script.onerror = () => finish(null);
      document.head.appendChild(script);
    }
  });

  return _onesignalPromise;
}

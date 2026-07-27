/**
 * Canonical live routes on api.nataltruth.com (product).
 * Anything not listed here must not be called from the SPA.
 */
export const LIVE_API = {
  calculate: "/v1/calculate",
  calculateSwiss: "/v1/calculate/swiss",
  calculateMoshier: "/v1/calculate/moshier",
  nameSystems: "/v1/name/systems",
  nameFull: "/v1/name/full",
  nameSystem: (id) => `/v1/name/${id}`,
  gematria: "/v1/gematria",
  chat: "/chat",
  chatV1: "/v1/chat",
  chatSessions: "/chat/sessions",
  chatHistory: (id) => `/chat/history/${id}`,
  chatDelete: (id) => `/chat/session/${id}`,
};

/** Features with no backend — pages must not HTTP these. */
export const UNAVAILABLE_FEATURES = {
  transits: "Transits / daily sky are not on the NatalTruth calc API yet.",
  friend: "Friend chat is not on the NatalTruth API yet.",
  compatibility: "Synastry / compatibility is not on the NatalTruth API yet.",
  horoscope: "Daily horoscope content API is not built.",
  publicChart: "Public chart share tokens are not on the API yet.",
  payments: "Payments / Stripe are not built.",
  authServer: "Server auth (email verify, reset) is not built — profile is local only.",
  admin: "Admin product APIs live on the calc host only when implemented; use nao.nataltruth.com when ready.",
  subscribe: "Email subscribe endpoint is not built.",
  voice: "Voice horoscope is not built.",
  orders: "Reading orders API is not built.",
  guidance: "Daily guidance / voice guidance is not built.",
};

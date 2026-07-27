/**
 * NatalTruth API base — calc host only.
 * No trailing slash. No /api prefix (routes are /v1/... and /health).
 */
export const BACKEND_URL = (
  process.env.REACT_APP_BACKEND_URL || "https://api.nataltruth.com"
).replace(/\/$/, "");

/** Base used by pages via `API` export from App.js */
export const API_BASE = BACKEND_URL;

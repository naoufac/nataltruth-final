export const BACKEND_URL = (
  process.env.REACT_APP_BACKEND_URL || ""
).replace(/\/$/, "");

export const API_BASE = BACKEND_URL;

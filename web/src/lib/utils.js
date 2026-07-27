import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Extract a human-readable error message from a FastAPI / axios error.
 * Handles Pydantic 422 arrays and plain string details.
 */
export function parseApiError(error, fallback = "Something went wrong") {
  const detail = error?.response?.data?.detail;
  if (!detail) return fallback;
  if (Array.isArray(detail)) {
    return detail
      .map(e => e.msg?.replace(/^Value error,\s*/i, "") || "Validation error")
      .join("; ");
  }
  return String(detail);
}

/**
 * API base URL — single source of truth for the entire frontend.
 *
 * Set VITE_API_URL at build time (or in .env.production) to point at your
 * deployed backend.  Falls back to the production Render backend when the
 * variable is absent so the built static site always works out of the box.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ??
  "https://trustlense-unesco-youth-hackathon-2026-2.onrender.com";

export const API_URL: string = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);

/** How often live scores are re-fetched while today is selected. */
export const LIVE_REFRESH_MS = 30_000;

/** How often the full day list is re-fetched (picks up finished matches). */
export const LIST_REFRESH_MS = 120_000;

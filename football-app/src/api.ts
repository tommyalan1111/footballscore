import { API_URL } from "./config";
import type { Match } from "./types";

export interface MatchesResponse {
  date: string;
  timezone: string;
  updatedAt: number;
  stale: boolean;
  count: number;
  matches: Match[];
}

export interface LiveResponse {
  updatedAt: number | null;
  stale: boolean;
  count: number;
  matches: Match[];
}

const TIMEOUT_MS = 10_000;

async function getJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchMatches(date: string, timezone: string): Promise<MatchesResponse> {
  return getJson<MatchesResponse>(
    `/matches?date=${date}&timezone=${encodeURIComponent(timezone)}`,
  );
}

export function fetchLive(): Promise<LiveResponse> {
  return getJson<LiveResponse>("/matches/live");
}

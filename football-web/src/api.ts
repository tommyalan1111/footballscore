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
  ageSeconds?: number;
  stale: boolean;
  count: number;
  matches: Match[];
}

const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener("abort", forwardAbort);

  try {
    const res = await fetch(`${API_URL}${path}`, { signal: controller.signal });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.status === 503) {
        throw new ApiError("The backend is still warming up. Trying again shortly.", 503);
      }
      throw new ApiError(body?.error ?? `Server responded ${res.status}`, res.status);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (isAbortError(err)) {
      if (signal?.aborted) throw err; // the caller cancelled: not an error
      throw new ApiError("Request timed out. Is football-backend running?");
    }
    if (err instanceof TypeError) {
      throw new ApiError(`Can't reach ${API_URL}. Is football-backend running?`);
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }
}

export function fetchMatches(
  date: string,
  timezone: string,
  signal?: AbortSignal,
): Promise<MatchesResponse> {
  return getJson<MatchesResponse>(
    `/matches?date=${encodeURIComponent(date)}&timezone=${encodeURIComponent(timezone)}`,
    signal,
  );
}

export function fetchLive(signal?: AbortSignal): Promise<LiveResponse> {
  return getJson<LiveResponse>("/matches/live", signal);
}

export function fetchHealth(signal?: AbortSignal): Promise<{ ok: boolean; hasData: boolean }> {
  return getJson<{ ok: boolean; hasData: boolean }>("/health", signal);
}

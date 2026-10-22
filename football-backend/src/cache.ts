import type { Match, Quota } from "./types.js";

/**
 * In-memory store for the latest live snapshot.
 * Fine for a single server process. If you later run several instances,
 * swap this class for a Redis-backed one with the same methods.
 */
export class LiveCache {
  private matches: Match[] = [];
  private updatedAt: number | null = null;
  private lastError: string | null = null;
  private quota: Quota = {};

  setSuccess(matches: Match[], quota: Quota): void {
    this.matches = matches;
    this.updatedAt = Date.now();
    this.lastError = null;
    this.quota = quota;
  }

  setError(message: string): void {
    // Keep serving the last good data; just flag it as stale.
    this.lastError = message;
  }

  setQuota(quota: Quota): void {
    this.quota = quota;
  }

  getMatches(): Match[] {
    return this.matches;
  }

  getQuota(): Quota {
    return this.quota;
  }

  snapshot() {
    return {
      updatedAt: this.updatedAt,
      ageSeconds: this.updatedAt ? Math.round((Date.now() - this.updatedAt) / 1000) : null,
      stale: this.lastError !== null,
      matches: this.matches,
    };
  }

  hasData(): boolean {
    return this.updatedAt !== null;
  }
}

export const liveCache = new LiveCache();

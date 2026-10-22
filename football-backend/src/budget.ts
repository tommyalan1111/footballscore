import { readFileSync, writeFileSync } from "node:fs";
import { liveCache } from "./cache.js";
import { config } from "./config.js";

/**
 * Counts api-sports requests for the current UTC day and persists the count,
 * so a crash/restart loop can't keep resetting it.
 *
 * api-sports sends the authoritative numbers in response headers; when those are
 * available for today we trust whichever figure is lower.
 */

interface StoredBudget {
  day: string;
  used: number;
}

function utcDay(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

let day = utcDay(Date.now());
let used = 0;

function load(): void {
  try {
    const parsed = JSON.parse(readFileSync(config.budgetStateFile, "utf8")) as Partial<StoredBudget>;
    if (
      parsed.day === day &&
      typeof parsed.used === "number" &&
      Number.isFinite(parsed.used) &&
      parsed.used >= 0
    ) {
      used = Math.floor(parsed.used);
    }
  } catch {
    // No state file yet: start at zero and let the response headers correct us.
  }
}

function save(): void {
  try {
    const state: StoredBudget = { day, used };
    writeFileSync(config.budgetStateFile, JSON.stringify(state), "utf8");
  } catch {
    // Read-only filesystem: keep counting in memory only.
  }
}

function rollover(): void {
  const today = utcDay(Date.now());
  if (today !== day) {
    day = today;
    used = 0;
    save();
  }
}

/** Requests left today: the lower of our own count and api-sports' header. */
export function remainingCalls(): number {
  rollover();
  const local = Math.max(0, config.dailyBudget - used);
  const quota = liveCache.getQuota();
  if (
    quota.checkedAt !== undefined &&
    quota.dailyRemaining !== undefined &&
    utcDay(quota.checkedAt) === day
  ) {
    return Math.min(local, quota.dailyRemaining);
  }
  return local;
}

export function usedToday(): number {
  rollover();
  return used;
}

/** True when more than `n` calls are left. */
export function canSpend(n = 1): boolean {
  return remainingCalls() > n;
}

/** Count one request before it goes out, so failures can't make us overspend. */
export function recordCall(): void {
  rollover();
  used += 1;
  save();
}

export function resetAt(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

load();

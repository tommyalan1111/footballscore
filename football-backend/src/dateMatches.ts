import { fetchMatchesByDate } from "./apiSports.js";
import { canSpend } from "./budget.js";
import { liveCache } from "./cache.js";
import { config } from "./config.js";
import { quotaNearlyUsed } from "./quota.js";
import type { Match } from "./types.js";

interface Entry {
  matches: Match[];
  fetchedAt: number;
}

const MAX_ENTRIES = 200;
const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<Entry>>();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Today's calendar date (YYYY-MM-DD) in the given timezone. */
export function todayIn(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
}

function ttlFor(date: string, tz: string): number {
  const today = todayIn(tz);
  if (date === today) return config.dateTtlTodayMs;
  return date < today ? config.dateTtlPastMs : config.dateTtlFutureMs;
}

/** Replace entries with fresher data from the live poller, where we have it. */
function overlayLive(matches: Match[]): Match[] {
  const live = new Map(liveCache.getMatches().map((m) => [m.id, m]));
  if (live.size === 0) return matches;
  return matches.map((m) => live.get(m.id) ?? m);
}

function sortByKickoff(matches: Match[]): Match[] {
  return [...matches].sort(
    (a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff) || a.id - b.id,
  );
}

function remember(key: string, entry: Entry): void {
  store.delete(key); // re-insert so the Map stays ordered oldest -> newest
  store.set(key, entry);
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

export async function getMatchesByDate(
  date: string,
  tz: string,
): Promise<{ matches: Match[]; updatedAt: number; stale: boolean }> {
  const key = `${date}|${tz}`;
  const hit = store.get(key);

  if (hit && Date.now() - hit.fetchedAt < ttlFor(date, tz)) {
    return { matches: sortByKickoff(overlayLive(hit.matches)), updatedAt: hit.fetchedAt, stale: false };
  }

  try {
    if (quotaNearlyUsed()) throw new Error("daily api-sports quota nearly used up");
    // Keep the reserve for live polling when the day's budget is nearly spent.
    if (!canSpend(config.budgetReserve)) throw new Error("daily api-sports budget nearly used up");

    // Concurrent requests for the same date share one upstream call.
    let pending = inflight.get(key);
    if (!pending) {
      pending = fetchMatchesByDate(date, tz)
        .then(({ matches, quota }) => {
          liveCache.setQuota(quota);
          const entry: Entry = { matches, fetchedAt: Date.now() };
          remember(key, entry);
          return entry;
        })
        .finally(() => inflight.delete(key));
      inflight.set(key, pending);
    }
    const entry = await pending;
    return { matches: sortByKickoff(overlayLive(entry.matches)), updatedAt: entry.fetchedAt, stale: false };
  } catch (err) {
    // Prefer slightly old data over an error.
    if (hit) {
      return { matches: sortByKickoff(overlayLive(hit.matches)), updatedAt: hit.fetchedAt, stale: true };
    }
    throw err;
  }
}

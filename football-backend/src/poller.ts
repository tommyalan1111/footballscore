import { EventEmitter } from "node:events";
import { fetchLiveMatches } from "./apiSports.js";
import { canSpend, remainingCalls, usedToday } from "./budget.js";
import { liveCache } from "./cache.js";
import { config } from "./config.js";
import { quotaNearlyUsed } from "./quota.js";
import { msUntilUtcMidnight, nextPollDelayMs } from "./schedule.js";
import type { Match, MatchChange } from "./types.js";

/**
 * Emits "score" and "status" events when a live match changes.
 * Later, your push-notification code can subscribe here.
 */
export const matchEvents = new EventEmitter();

const MAX_BACKOFF_MS = 120_000;

function detectChanges(previous: Match[], next: Match[]): void {
  const before = new Map(previous.map((m) => [m.id, m]));
  for (const match of next) {
    const prev = before.get(match.id);
    if (!prev) continue; // new in the live list (or first poll): nothing to compare
    const change: MatchChange = { match, previous: prev };
    if (match.score.home !== prev.score.home || match.score.away !== prev.score.away) {
      matchEvents.emit("score", change);
    }
    if (match.status !== prev.status) {
      matchEvents.emit("status", change);
    }
  }
}

function scheduledDelay(liveCount: number): number {
  return nextPollDelayMs({
    liveCount,
    remaining: remainingCalls(),
    reserve: config.budgetReserve,
    livePollMs: config.livePollMs,
    idlePollMs: config.idlePollMs,
    now: Date.now(),
  });
}

export function startPoller(): () => void {
  let timer: NodeJS.Timeout | undefined;
  let stopped = false;
  let failures = 0;

  const tick = async () => {
    let delay = config.idlePollMs;

    try {
      if (!canSpend()) {
        // Nothing left today: sleep through to the UTC reset instead of hammering.
        delay = msUntilUtcMidnight(Date.now()) + 1_000;
        console.warn(
          `[poller] daily budget used up (${usedToday()}/${config.dailyBudget}); ` +
            `pausing ${Math.round(delay / 60_000)} min until UTC midnight`,
        );
      } else if (quotaNearlyUsed()) {
        delay = config.idlePollMs;
        console.warn("[poller] daily quota nearly used up, skipping API call");
      } else {
        const { matches, quota } = await fetchLiveMatches();
        detectChanges(liveCache.getMatches(), matches);
        liveCache.setSuccess(matches, quota);
        failures = 0;

        delay = scheduledDelay(matches.length);

        console.log(
          `[poller] ${matches.length} live · next poll in ${Math.round(delay / 1000)}s · ` +
            `${remainingCalls()}/${config.dailyBudget} requests left today`,
        );
      }
    } catch (err) {
      failures += 1;
      const message = err instanceof Error ? err.message : String(err);
      liveCache.setError(message);

      // Two quick retries for blips, then fall back to the budget-paced interval
      // so an outage can't drain the daily quota.
      const backoff = Math.min(config.livePollMs * 2 ** failures, MAX_BACKOFF_MS);
      const paced = scheduledDelay(liveCache.getMatches().length);
      delay = failures <= 2 ? Math.min(backoff, paced) : paced;

      console.error(
        `[poller] fetch failed (${failures}x): ${message}. Retrying in ${Math.round(delay / 1000)}s`,
      );
    } finally {
      if (!stopped) timer = setTimeout(tick, delay);
    }
  };

  void tick();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

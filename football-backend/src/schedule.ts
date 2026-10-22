/**
 * Pure scheduling maths, kept separate from the poller so it can be tested
 * without touching api-sports.
 */

export function msUntilUtcMidnight(now: number): number {
  const d = new Date(now);
  const nextMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return Math.max(0, nextMidnight - now);
}

export interface ScheduleInput {
  /** Matches currently in play. */
  liveCount: number;
  /** Requests left today, already including the reserve. */
  remaining: number;
  /** Requests kept back for on-demand date lookups. */
  reserve: number;
  /** Fastest allowed interval. */
  livePollMs: number;
  /** Slowest allowed interval while nothing is live. */
  idlePollMs: number;
  now: number;
}

/**
 * Spread the remaining daily budget evenly over the rest of the UTC day.
 *
 * With 100/day this works out at roughly one call every 15 minutes; with a
 * bigger plan it converges on `livePollMs`. When nothing is live it backs off
 * to `idlePollMs` so the budget is still there when matches kick off.
 */
export function nextPollDelayMs(input: ScheduleInput): number {
  const msLeft = msUntilUtcMidnight(input.now);
  if (msLeft <= 0) return 1_000;

  const spendable = input.remaining - input.reserve;
  if (spendable <= 0) return msLeft + 1_000;

  const fairShare = msLeft / spendable;
  const floor = input.liveCount > 0 ? input.livePollMs : input.idlePollMs;

  return Math.min(Math.max(fairShare, floor), msLeft);
}

import { liveCache } from "./cache.js";
import { config } from "./config.js";

/** True when today's api-sports quota is (nearly) used up. Quotas reset daily (UTC). */
export function quotaNearlyUsed(): boolean {
  const q = liveCache.getQuota();
  if (q.dailyRemaining === undefined || q.checkedAt === undefined) return false;
  const day = (t: number) => new Date(t).toISOString().slice(0, 10);
  return day(q.checkedAt) === day(Date.now()) && q.dailyRemaining <= config.minQuotaRemaining;
}

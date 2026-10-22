import "dotenv/config";

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return n;
}

const apiKey = process.env.API_SPORTS_KEY;
if (!apiKey) {
  throw new Error("API_SPORTS_KEY is missing. Copy .env.example to .env and set it.");
}

export const config = {
  apiKey,
  apiBaseUrl: process.env.API_SPORTS_BASE_URL ?? "https://v3.football.api-sports.io",
  port: num("PORT", 3000),
  // Fastest the poller may go. It only actually goes this fast when the daily budget allows it.
  livePollMs: num("LIVE_POLL_MS", 60_000),
  // Slowest the poller goes while nothing is live (saves budget for kickoff).
  idlePollMs: num("IDLE_POLL_MS", 1_800_000),
  minQuotaRemaining: num("MIN_QUOTA_REMAINING", 5),
  // Requests api-sports allows per day (free plan: 100). The poller spreads this over the day.
  dailyBudget: num("DAILY_BUDGET", 100),
  // Calls held back so browsing a new date still works when the poller is busy.
  budgetReserve: num("BUDGET_RESERVE", 12),
  // Survives restarts, so a crash loop cannot keep resetting the counter.
  budgetStateFile: process.env.BUDGET_STATE_FILE ?? ".budget.json",
  // How long a fixtures-by-date response is reused before asking api-sports again.
  // Live scores are overlaid from the poller, so a long TTL costs no freshness on live games.
  dateTtlTodayMs: num("DATE_TTL_TODAY_MS", 900_000),
  dateTtlPastMs: num("DATE_TTL_PAST_MS", 24 * 60 * 60_000),
  dateTtlFutureMs: num("DATE_TTL_FUTURE_MS", 60 * 60_000),
} as const;

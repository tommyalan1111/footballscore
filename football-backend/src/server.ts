import cors from "@fastify/cors";
import Fastify from "fastify";
import { remainingCalls, resetAt, usedToday } from "./budget.js";
import { liveCache } from "./cache.js";
import { config } from "./config.js";
import { getMatchesByDate, isValidDate, isValidTimezone, todayIn } from "./dateMatches.js";
import { groupByLeague } from "./group.js";
import { matchEvents, startPoller } from "./poller.js";
import type { Match, MatchChange } from "./types.js";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

function filterByLeague(matches: Match[], league?: string): Match[] {
  if (league === undefined) return matches;
  const id = Number(league);
  return Number.isFinite(id) ? matches.filter((m) => m.league.id === id) : matches;
}

app.get("/health", async () => ({ ok: true, hasData: liveCache.hasData() }));

/** How much of today's api-sports budget is left, and when it resets. */
app.get("/usage", async (_req, reply) => {
  reply.header("Cache-Control", "no-store");
  return {
    limit: config.dailyBudget,
    usedToday: usedToday(),
    remaining: remainingCalls(),
    reserve: config.budgetReserve,
    resetAt: resetAt().toISOString(),
    liveMatches: liveCache.getMatches().length,
    liveUpdatedAt: liveCache.snapshot().updatedAt,
  };
});

app.get<{ Querystring: { league?: string; grouped?: string } }>(
  "/matches/live",
  async (req, reply) => {
    if (!liveCache.hasData()) {
      return reply.code(503).send({ error: "Warming up, try again in a few seconds" });
    }

    const { updatedAt, ageSeconds, stale, matches } = liveCache.snapshot();
    const filtered = filterByLeague(matches, req.query.league);

    reply.header("Cache-Control", "public, max-age=10");

    const base = { updatedAt, ageSeconds, stale, count: filtered.length };
    return req.query.grouped === "true"
      ? { ...base, leagues: groupByLeague(filtered) }
      : { ...base, matches: filtered };
  },
);

/**
 * GET /matches?date=YYYY-MM-DD&timezone=Asia/Ho_Chi_Minh&league=39&grouped=true
 * All params optional: defaults to today in UTC.
 */
app.get<{
  Querystring: { date?: string; timezone?: string; league?: string; grouped?: string };
}>("/matches", async (req, reply) => {
  const tz = req.query.timezone ?? "UTC";
  if (!isValidTimezone(tz)) {
    return reply.code(400).send({ error: "Invalid timezone. Use an IANA name like Asia/Ho_Chi_Minh" });
  }

  const date = req.query.date ?? todayIn(tz);
  if (!isValidDate(date)) {
    return reply.code(400).send({ error: "Invalid date. Use YYYY-MM-DD" });
  }

  try {
    const result = await getMatchesByDate(date, tz);
    const filtered = filterByLeague(result.matches, req.query.league);

    reply.header("Cache-Control", "public, max-age=30");

    const base = {
      date,
      timezone: tz,
      updatedAt: result.updatedAt,
      stale: result.stale,
      count: filtered.length,
    };
    return req.query.grouped === "true"
      ? { ...base, leagues: groupByLeague(filtered) }
      : { ...base, matches: filtered };
  } catch (err) {
    // Log the detail (plan limits, bad key...) but don't leak it to clients.
    req.log.error({ err }, "fixtures-by-date failed");
    return reply.code(502).send({ error: "Match data is temporarily unavailable" });
  }
});

// Demo subscriber: this is where push notifications will hook in later.
matchEvents.on("score", ({ match, previous }: MatchChange) => {
  app.log.info(
    `GOAL ${match.home.name} ${previous.score.home}-${previous.score.away} -> ` +
      `${match.score.home}-${match.score.away} ${match.away.name}`,
  );
});

const stopPoller = startPoller();

app.log.info(
  `api-sports budget: ${remainingCalls()} of ${config.dailyBudget} requests left today, ` +
    `resets ${resetAt().toISOString()} (GET /usage for live numbers)`,
);

const shutdown = async () => {
  stopPoller();
  await app.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ port: config.port, host: "0.0.0.0" });

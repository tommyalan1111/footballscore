import { config } from "./config.js";
import { recordCall } from "./budget.js";
import type { ApiFixture, Match, Quota } from "./types.js";

export class ApiSportsError extends Error {}

interface ApiEnvelope<T> {
  errors: unknown;
  response: T;
}

function headerNum(res: Response, name: string): number | undefined {
  const raw = res.headers.get(name);
  if (raw === null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function describeErrors(errors: unknown): string | null {
  if (!errors) return null;
  if (Array.isArray(errors)) return errors.length ? JSON.stringify(errors) : null;
  if (typeof errors === "object") {
    return Object.keys(errors).length ? JSON.stringify(errors) : null;
  }
  return String(errors);
}

export async function apiGet<T>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<{ data: T; quota: Quota }> {
  const url = new URL(path, config.apiBaseUrl);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  // Every request goes through here, so this is the one place that has to count.
  recordCall();

  const res = await fetch(url, {
    headers: { "x-apisports-key": config.apiKey },
    signal: AbortSignal.timeout(10_000),
  });

  // api-sports reports your daily quota in response headers.
  const quota: Quota = {
    dailyLimit: headerNum(res, "x-ratelimit-requests-limit"),
    dailyRemaining: headerNum(res, "x-ratelimit-requests-remaining"),
    checkedAt: Date.now(),
  };

  if (!res.ok) {
    throw new ApiSportsError(`api-sports HTTP ${res.status}`);
  }

  const body = (await res.json()) as ApiEnvelope<T>;
  // api-sports can return HTTP 200 with an error payload (bad key, quota hit, ...).
  const errs = describeErrors(body.errors);
  if (errs) throw new ApiSportsError(`api-sports error: ${errs}`);

  return { data: body.response, quota };
}

export function normalize(f: ApiFixture): Match {
  return {
    id: f.fixture.id,
    kickoff: f.fixture.date,
    status: f.fixture.status.short,
    statusLong: f.fixture.status.long,
    minute: f.fixture.status.elapsed,
    league: f.league,
    home: f.teams.home,
    away: f.teams.away,
    score: { home: f.goals.home, away: f.goals.away },
  };
}

/** All matches currently in play, in one request. */
export async function fetchLiveMatches(): Promise<{ matches: Match[]; quota: Quota }> {
  const { data, quota } = await apiGet<ApiFixture[]>("/fixtures", { live: "all" });
  return { matches: data.map(normalize), quota };
}

/** All fixtures on a calendar date (YYYY-MM-DD), with kickoff times in the given timezone. */
export async function fetchMatchesByDate(
  date: string,
  timezone: string,
): Promise<{ matches: Match[]; quota: Quota }> {
  const { data, quota } = await apiGet<ApiFixture[]>("/fixtures", { date, timezone });
  return { matches: data.map(normalize), quota };
}

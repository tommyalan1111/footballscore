# football-backend

Polls api-sports (football) for live matches, caches the result, and serves it to the mobile app and the web dashboard.

## Run
    npm install
    cp .env.example .env     # set API_SPORTS_KEY
    npm run dev

## Endpoints
- `GET /matches/live` → all live matches
- `GET /matches/live?grouped=true` → grouped by league
- `GET /matches/live?league=39` → one league only
- `GET /matches?date=2026-10-22&timezone=Asia/Ho_Chi_Minh` → all fixtures on a date (both params optional; default is today in UTC). Also supports `grouped=true` and `league=39`.
- `GET /usage` → requests used/left today and when the quota resets
- `GET /health`

## Staying inside the 100 requests/day free plan

Only this server talks to api-sports, so browsers and phones cost nothing — the
100/day applies to this process alone.

Fixed timers cannot respect a daily cap: `LIVE_POLL_MS=60000` is 1,440
requests/day on its own. So the poller spends a budget instead:

- `DAILY_BUDGET` (default `100`) is what it may spend today.
- Every request — live poll or date lookup — is counted in `src/budget.ts` and
  persisted to `.budget.json`, so restarts can't reset the counter.
- After each poll the next delay is `time left until 00:00 UTC / requests left`:
  the remaining budget is spread evenly. With 100/day that is about **one
  request every 15 minutes**; with a paid 7,500/day plan it converges on
  `LIVE_POLL_MS` (60s).
- With no match in play it waits at least `IDLE_POLL_MS` (default 30 min), so
  the budget is still there at kickoff.
- `BUDGET_RESERVE` requests are held back for date lookups. When the budget is
  gone the poller sleeps until the UTC reset and keeps serving cached data with
  `stale: true` instead of erroring.
- Fixture lists are cached for `DATE_TTL_TODAY_MS` (default 15 min). Live scores
  are overlaid from the poller, so a client refreshing every 2 minutes no longer
  triggers an api-sports call.
- Failed requests back off: two quick retries, then the normal budget-paced
  interval, so an outage can't drain the day.

Watch it live:

    curl localhost:3000/usage
    {"limit":100,"usedToday":7,"remaining":93,"reserve":12,"resetAt":"2026-10-23T00:00:00.000Z",...}

### Want 60-second live scores?

100/day cannot cover a whole day at that rate (that would be 1,440). Either
raise `DAILY_BUDGET` with a paid plan, or poll fast only inside a match window —
`nextPollDelayMs()` in `src/schedule.ts` is the one place to change.

## Notes
- The apps never talk to api-sports; only this server does (keeps your key secret, saves quota).
- `matchEvents` in `src/poller.ts` emits "score" and "status" events: hook push notifications there.

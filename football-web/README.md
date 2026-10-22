# football-web

Browser dashboard for **football-backend**: day picker, matches grouped by league,
live scores polled every 30s while today is selected, search + "live only" filter,
light/dark themes.

## Run

    npm install
    cp .env.example .env     # only needed if the backend isn't on localhost:3000
    npm run dev              # http://localhost:5173

Start football-backend first (`npm run dev` in `football-backend`).

## Build

    npm run build            # typecheck + static bundle in dist/
    npm run preview          # serve the production build locally

`dist/` is plain static files — deploy it to Netlify, Vercel, GitHub Pages, S3,
or any static host. football-backend already enables CORS for every origin
(`@fastify/cors` with `origin: true`), so no proxy is required.

## Environment

| Variable       | Default                 | Purpose                     |
| -------------- | ----------------------- | --------------------------- |
| `VITE_API_URL` | `http://localhost:3000` | Where football-backend runs |

Set it in `.env` at the project root. Vite only exposes variables prefixed with
`VITE_`.

## Behaviour

- **Date strip** — 9 days at a time, arrows move a week; "Today" is highlighted.
- **Live overlay** — the selected day comes from `GET /matches`; while today is
  selected, `GET /matches/live` is polled every 30s and merged on top by match id.
- **Background tab** — polling pauses when the tab is hidden and resumes (with a
  silent reload) when it comes back, so an open tab doesn't burn API quota.
- **Search / Live only** — filters run client-side over the loaded day.
- **Keyboard** — `R` refresh, `/` focus search.
- **Cached data** — when the backend reports `stale: true` a banner explains it.

## Structure

    src/
      App.tsx                  screen: header, date strip, toolbar, league grid
      useMatches.ts            fetching, live polling, overlay, request guard
      api.ts                   /matches, /matches/live, /health (+ friendly errors)
      grouping.ts              league sections, filtering, sorting
      status.ts                live/started detection and status labels
      dates.ts                 date keys, formatting, timezone
      useTheme.ts              dark/light with localStorage
      components/              Header, DateStrip, Toolbar, LeagueCard, MatchRow, ...
      styles.css               design tokens and all component styles

## Checking the UI without an API key

`scripts/` holds a throwaway harness (not part of the bundle):

    node scripts/smoke.mjs     # mock football-backend on :3000 + dist/ on :4173

Start headless Chrome with `--remote-debugging-port=9222`, point it at
`http://127.0.0.1:4173/`, then:

    node scripts/check.mjs     # rendered text + screenshot
    node scripts/capture.mjs   # desktop dark/light, live filter, mobile

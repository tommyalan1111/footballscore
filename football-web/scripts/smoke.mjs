/**
 * Local smoke test: mock football-backend + static server for dist/.
 * Not part of the app bundle — used to render the built page in a headless browser.
 *
 *   node scripts/smoke.mjs
 *
 * API on :3000 (what the built bundle points at), static on :4173.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const API_PORT = 3000;
const WEB_PORT = 4173;

const today = new Date();
const at = (h, m) => {
  const d = new Date(today);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const crest = (color, letter) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="${color}"/><text x="12" y="16.5" font-family="Arial" font-size="12" font-weight="bold" fill="#fff" text-anchor="middle">${letter}</text></svg>`,
  )}`;

const PL = { id: 39, name: "Premier League", country: "England", logo: crest("#3d195b", "PL") };
const LL = { id: 140, name: "La Liga", country: "Spain", logo: crest("#ee8707", "LL") };

const match = (id, league, home, away, status, minute, score, kickoff) => ({
  id,
  kickoff,
  status,
  statusLong: status === "2H" ? "Second Half" : status === "FT" ? "Match Finished" : "Not Started",
  minute,
  league,
  home,
  away,
  score: { home: score[0], away: score[1] },
});

const liverpool = { id: 40, name: "Liverpool", logo: crest("#c8102e", "L") };
const city = { id: 50, name: "Manchester City", logo: "" }; // empty logo -> letter fallback
const arsenal = { id: 42, name: "Arsenal", logo: crest("#ef0107", "A") };
const chelsea = { id: 49, name: "Chelsea", logo: crest("#034694", "C") };
const madrid = { id: 541, name: "Real Madrid", logo: crest("#00529f", "R") };
const barca = { id: 529, name: "Barcelona", logo: crest("#a50044", "B") };
const sevilla = { id: 536, name: "Sevilla", logo: "" };
const valencia = { id: 532, name: "Valencia", logo: "" };

const LIST = [
  match(1, PL, liverpool, city, "2H", 67, [1, 1], at(18, 30)),
  match(2, PL, arsenal, chelsea, "NS", null, [null, null], at(20, 45)),
  match(3, LL, madrid, barca, "FT", null, [3, 2], at(16, 0)),
  match(4, LL, sevilla, valencia, "NS", null, [null, null], at(21, 0)),
];

// Fresher live data: Liverpool have scored (2-1). The ghost match must be ignored
// because it is not part of the selected day's list.
const LIVE = [
  match(1, PL, liverpool, city, "2H", 71, [2, 1], at(18, 30)),
  match(99, LL, sevilla, valencia, "1H", 12, [0, 0], at(21, 0)),
];

const json = (res, status, body) => {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body));
};

const api = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
    });
    return res.end();
  }
  if (url.pathname === "/health") return json(res, 200, { ok: true, hasData: true });
  if (url.pathname === "/matches/live") {
    return json(res, 200, {
      updatedAt: Date.now(),
      ageSeconds: 0,
      stale: false,
      count: LIVE.length,
      matches: LIVE,
    });
  }
  if (url.pathname === "/matches") {
    return json(res, 200, {
      date: url.searchParams.get("date"),
      timezone: url.searchParams.get("timezone"),
      updatedAt: Date.now(),
      stale: false,
      count: LIST.length,
      matches: LIST,
    });
  }
  json(res, 404, { error: "Not found" });
});

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

const web = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = normalize(url.pathname === "/" ? "/index.html" : url.pathname);
  const file = join(DIST, path);
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

api.listen(API_PORT, () => console.log(`mock api  http://127.0.0.1:${API_PORT}`));
web.listen(WEB_PORT, () => console.log(`static    http://127.0.0.1:${WEB_PORT}`));

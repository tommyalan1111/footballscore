import type { Match } from "./types.js";

export function groupByLeague(matches: Match[]) {
  const groups = new Map<number, { league: Match["league"]; matches: Match[] }>();
  for (const m of matches) {
    const g = groups.get(m.league.id) ?? { league: m.league, matches: [] };
    g.matches.push(m);
    groups.set(m.league.id, g);
  }
  return [...groups.values()];
}

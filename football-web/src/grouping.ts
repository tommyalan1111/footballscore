import { sortRank } from "./status";
import type { Match } from "./types";

export interface LeagueSection {
  id: number;
  /** "England - Premier League" */
  title: string;
  name: string;
  country: string;
  logo: string;
  liveCount: number;
  matches: Match[];
}

export interface SectionOptions {
  query: string;
  liveOnly: boolean;
}

function matchesQuery(match: Match, query: string): boolean {
  if (query === "") return true;
  const haystack = [
    match.home.name,
    match.away.name,
    match.league.name,
    match.league.country,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function compareMatches(a: Match, b: Match): number {
  const rank = sortRank(a) - sortRank(b);
  if (rank !== 0) return rank;
  return Date.parse(a.kickoff) - Date.parse(b.kickoff);
}

export function buildSections(matches: Match[], opts: SectionOptions): LeagueSection[] {
  const query = opts.query.trim().toLowerCase();

  const byLeague = new Map<number, LeagueSection>();

  for (const match of matches) {
    if (opts.liveOnly && sortRank(match) !== 0) continue;
    if (!matchesQuery(match, query)) continue;

    let section = byLeague.get(match.league.id);
    if (!section) {
      section = {
        id: match.league.id,
        title: `${match.league.country} - ${match.league.name}`,
        name: match.league.name,
        country: match.league.country,
        logo: match.league.logo,
        liveCount: 0,
        matches: [],
      };
      byLeague.set(match.league.id, section);
    }
    section.matches.push(match);
    if (sortRank(match) === 0) section.liveCount += 1;
  }

  const sections = [...byLeague.values()];
  for (const section of sections) section.matches.sort(compareMatches);

  // Leagues with live matches first, then alphabetical.
  return sections.sort(
    (a, b) => b.liveCount - a.liveCount || a.title.localeCompare(b.title),
  );
}

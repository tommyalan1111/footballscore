/** Mirrors the Match shape returned by football-backend. */
export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface Match {
  id: number;
  kickoff: string; // ISO string
  status: string; // NS, 1H, HT, 2H, ET, PEN, FT, PST, ...
  statusLong: string;
  minute: number | null;
  league: { id: number; name: string; country: string; logo: string; round?: string };
  home: Team;
  away: Team;
  score: { home: number | null; away: number | null };
}

export interface LeagueSection {
  title: string;
  logo: string;
  hasLive: boolean;
  data: Match[];
}

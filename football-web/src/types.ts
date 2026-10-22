/** Mirrors the Match shape returned by football-backend. */
export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  round?: string;
}

export interface Match {
  id: number;
  kickoff: string; // ISO string, UTC
  status: string; // NS, 1H, HT, 2H, ET, PEN, FT, PST, ...
  statusLong: string;
  minute: number | null;
  league: League;
  home: Team;
  away: Team;
  score: { home: number | null; away: number | null };
}

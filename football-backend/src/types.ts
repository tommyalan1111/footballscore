/** Raw shapes from api-sports (only the fields we use). */
export interface ApiTeam {
  id: number;
  name: string;
  logo: string;
}

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { long: string; short: string; elapsed: number | null };
  };
  league: { id: number; name: string; country: string; logo: string; round?: string };
  teams: { home: ApiTeam; away: ApiTeam };
  goals: { home: number | null; away: number | null };
}

/** What our own API returns to the mobile app. */
export interface Match {
  id: number;
  kickoff: string; // ISO string, UTC
  status: string; // short code: NS, 1H, HT, 2H, ET, PEN, FT, PST, ...
  statusLong: string;
  minute: number | null;
  league: { id: number; name: string; country: string; logo: string; round?: string };
  home: ApiTeam;
  away: ApiTeam;
  score: { home: number | null; away: number | null };
}

export interface Quota {
  dailyLimit?: number;
  dailyRemaining?: number;
  checkedAt?: number; // epoch ms
}

export interface MatchChange {
  match: Match;
  previous: Match;
}

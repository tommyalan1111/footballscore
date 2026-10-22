import { formatTime } from "./dates";
import type { Match } from "./types";

/** api-sports short codes that mean "being played right now". */
const LIVE_STATUSES = new Set(["1H", "2H", "ET", "BT", "P", "HT", "INT", "LIVE"]);

/** Codes where no football has been played yet. */
const NOT_STARTED = new Set(["NS", "TBD", "PST", "CANC", "ABD", "SUSP"]);

export function isLive(match: Match): boolean {
  return LIVE_STATUSES.has(match.status);
}

export function hasStarted(match: Match): boolean {
  return !NOT_STARTED.has(match.status);
}

/** Text for the left-hand column of a match row. */
export function statusText(match: Match): string {
  switch (match.status) {
    case "NS":
    case "TBD":
      return formatTime(match.kickoff);
    case "1H":
    case "2H":
    case "ET":
    case "LIVE":
      return match.minute !== null ? `${match.minute}'` : match.status;
    case "P":
      return "PEN";
    default:
      // HT, BT, FT, AET, PEN, PST, CANC, ABD, SUSP, INT, AWD, WO ...
      return match.status;
  }
}

/** Sort key within a league: in-play first, then upcoming, then finished. */
export function sortRank(match: Match): number {
  if (isLive(match)) return 0;
  if (!hasStarted(match)) return 1;
  return 2;
}

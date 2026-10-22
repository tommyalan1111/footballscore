import { formatTime } from "./dates";
import type { Match } from "./types";

// api-sports short status codes that mean "being played right now".
const LIVE_STATUSES = new Set(["1H", "2H", "ET", "BT", "P", "HT", "INT", "LIVE"]);

export function isLive(match: Match): boolean {
  return LIVE_STATUSES.has(match.status);
}

/** Text for the left-hand column of a match row. */
export function statusLabel(match: Match): string {
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

import type { ReactNode } from "react";
import { formatTime } from "../dates";
import { isLive, statusText } from "../status";
import type { Match } from "../types";
import { Crest } from "./Crest";

interface Props {
  match: Match;
}

const EMPTY = "–";

function ScoreCell({ value, win }: { value: number | null; win: boolean }) {
  if (value === null) return <span className="score-empty">{EMPTY}</span>;
  return <span className={win ? "score-win" : undefined}>{value}</span>;
}

function MatchRowImpl({ match }: Props) {
  const live = isLive(match);
  const label = statusText(match);
  const { home: homeScore, away: awayScore } = match.score;
  const completed = match.status === "FT" || match.status === "AET" || match.status === "PEN";
  const homeWins = completed && homeScore !== null && awayScore !== null && homeScore > awayScore;
  const awayWins = completed && homeScore !== null && awayScore !== null && awayScore > homeScore;

  const classes = ["match", live ? "is-live" : "", completed ? "is-complete" : ""];
  const kickoffTitle = `${match.home.name} vs ${match.away.name} · ${match.statusLong} · ${formatTime(match.kickoff)}`;

  const status: ReactNode = (
    <>
      {live && <span className="live-dot" aria-hidden="true" />}
      <span className="match-status-text">{label}</span>
    </>
  );

  return (
    <div className={classes.join(" ")} title={kickoffTitle}>
      <div className="match-status">{status}</div>

      <div className="match-teams">
        <div className="team">
          <Crest src={match.home.logo} name={match.home.name} />
          <span className="team-name">{match.home.name}</span>
        </div>
        <div className="team">
          <Crest src={match.away.logo} name={match.away.name} />
          <span className="team-name">{match.away.name}</span>
        </div>
      </div>

      <div className="match-score">
        <ScoreCell value={homeScore} win={homeWins} />
        <ScoreCell value={awayScore} win={awayWins} />
      </div>
    </div>
  );
}

export const MatchRow = MatchRowImpl;

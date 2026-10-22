import type { LeagueSection } from "../grouping";
import { Crest } from "./Crest";
import { MatchRow } from "./MatchRow";

interface Props {
  section: LeagueSection;
}

export function LeagueCard({ section }: Props) {
  return (
    <article className="league-card">
      <header className="league-head">
        <Crest src={section.logo} name={section.name} size="sm" />
        <div className="league-meta">
          <h2 className="league-name">{section.name}</h2>
          <span className="league-country">{section.country}</span>
        </div>
        {section.liveCount > 0 && (
          <span className="pill pill-live pill-small">
            <span className="live-dot" aria-hidden="true" />
            {section.liveCount} live
          </span>
        )}
      </header>

      <div className="match-list">
        {section.matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </article>
  );
}

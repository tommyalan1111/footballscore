const ROWS = [0, 1, 2, 3];

export function LoadingGrid() {
  return (
    <div className="leagues" aria-hidden="true">
      {[0, 1, 2].map((card) => (
        <div className="league-card skeleton-card" key={card}>
          <div className="skeleton-head">
            <span className="skeleton-badge" />
            <span className="skeleton-line skeleton-title" />
          </div>
          {ROWS.map((row) => (
            <div className="skeleton-row" key={row}>
              <span className="skeleton-line skeleton-status" />
              <span className="skeleton-line skeleton-team" />
              <span className="skeleton-line skeleton-score" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

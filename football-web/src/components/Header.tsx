import { formatAgo } from "../dates";
import { MoonIcon, RefreshIcon, SunIcon } from "../icons";
import type { Theme } from "../useTheme";
import { useNow } from "../useNow";

interface Props {
  liveCount: number;
  updatedAt: number | null;
  refreshing: boolean;
  theme: Theme;
  onRefresh: () => void;
  onToggleTheme: () => void;
}

export function Header({
  liveCount,
  updatedAt,
  refreshing,
  theme,
  onRefresh,
  onToggleTheme,
}: Props) {
  const now = useNow(5_000);
  const updated = updatedAt === null ? null : formatAgo(updatedAt, now);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9.2" fill="currentColor" opacity="0.18" />
              <path
                d="m12 6.6 3.9 2.8-1.5 4.6H9.6L8.1 9.4 12 6.6Z"
                fill="currentColor"
              />
              <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
          <div className="brand-text">
            <span className="brand-title">Live Scores</span>
            <span className="brand-sub">Football · worldwide</span>
          </div>
        </div>

        <div className="topbar-actions">
          {liveCount > 0 && (
            <span className="pill pill-live" title={`${liveCount} matches in play`}>
              <span className="live-dot" aria-hidden="true" />
              {liveCount} live
            </span>
          )}

          {updated !== null && (
            <span
              className="updated"
              title="When this page last loaded data from the server"
            >
              Updated {updated}
            </span>
          )}

          <button
            type="button"
            className="icon-btn"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh matches"
            title="Refresh (R)"
          >
            <RefreshIcon size={17} className={refreshing ? "spin" : undefined} />
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <SunIcon size={17} /> : <MoonIcon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ErrorBanner, StaleBanner } from "./components/Banners";
import { DateStrip } from "./components/DateStrip";
import { EmptyState } from "./components/EmptyState";
import { Header } from "./components/Header";
import { LeagueCard } from "./components/LeagueCard";
import { LoadingGrid } from "./components/Skeleton";
import { Toolbar } from "./components/Toolbar";
import { getTimezone, toDateKey } from "./dates";
import { buildSections } from "./grouping";
import { isLive } from "./status";
import { useMatches } from "./useMatches";
import { useNow } from "./useNow";
import { useTheme } from "./useTheme";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export default function App() {
  const { theme, toggle } = useTheme();

  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));
  const [query, setQuery] = useState("");
  const [liveOnly, setLiveOnly] = useState(false);

  const { matches, loading, refreshing, error, stale, updatedAt, liveUpdatedAt, refresh } =
    useMatches(dateKey);
  const now = useNow(5_000);

  // The freshest data wins: live polls keep this honest while the tab is open.
  const lastUpdated = Math.max(updatedAt ?? 0, liveUpdatedAt ?? 0) || null;

  const sections = useMemo(
    () => buildSections(matches, { query, liveOnly }),
    [matches, query, liveOnly],
  );
  const matchCount = sections.reduce((total, section) => total + section.matches.length, 0);
  const liveCount = useMemo(() => matches.filter(isLive).length, [matches]);
  const timezone = useMemo(getTimezone, []);
  const filtering = query.trim() !== "" || liveOnly;

  // "R" refreshes, like the button in the header.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (event.key.toLowerCase() !== "r") return;
      event.preventDefault();
      refresh();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [refresh]);

  const clearFilters = () => {
    setQuery("");
    setLiveOnly(false);
  };

  return (
    <div className="app">
      <Header
        liveCount={liveCount}
        updatedAt={lastUpdated}
        refreshing={refreshing}
        theme={theme}
        onRefresh={refresh}
        onToggleTheme={toggle}
      />

      <main className="shell">
        <DateStrip selectedKey={dateKey} onSelect={setDateKey} />

        <Toolbar
          query={query}
          onQueryChange={setQuery}
          liveOnly={liveOnly}
          onLiveOnlyChange={setLiveOnly}
          matchCount={matchCount}
        />

        {error !== null && matches.length > 0 ? (
          <ErrorBanner message={error} onRetry={refresh} />
        ) : stale ? (
          <StaleBanner updatedAt={lastUpdated} now={now} />
        ) : null}

        {loading ? (
          <LoadingGrid />
        ) : sections.length > 0 ? (
          <div className="leagues">
            {sections.map((section) => (
              <LeagueCard key={section.id} section={section} />
            ))}
          </div>
        ) : error !== null ? (
          <EmptyState
            title="Can't load matches"
            hint={error}
            action={
              <button type="button" className="btn" onClick={refresh}>
                Try again
              </button>
            }
          />
        ) : filtering ? (
          <EmptyState
            title="No matches match your filters"
            hint="Try a different team name, or switch back to all matches."
            action={
              <button type="button" className="btn" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        ) : (
          <EmptyState
            title="No matches on this day"
            hint="Pick another day from the date strip above."
          />
        )}

        <footer className="foot">
          <span>
            Data by <a href="https://www.api-football.com">API-Football</a> via football-backend
          </span>
          <span className="foot-dot">·</span>
          <span>Times in {timezone}</span>
        </footer>
      </main>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { SearchIcon } from "../icons";

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  liveOnly: boolean;
  onLiveOnlyChange: (value: boolean) => void;
  matchCount: number;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function Toolbar({
  query,
  onQueryChange,
  liveOnly,
  onLiveOnlyChange,
  matchCount,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses search, the way most dashboards do it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="toolbar">
      <div className="search">
        <SearchIcon className="search-icon" size={16} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search team or league"
          aria-label="Search team or league"
          autoComplete="off"
          spellCheck={false}
        />
        {query !== "" && (
          <button
            type="button"
            className="search-clear"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <div className="segmented" role="group" aria-label="Match filter">
        <button type="button" aria-pressed={!liveOnly} onClick={() => onLiveOnlyChange(false)}>
          All
        </button>
        <button type="button" aria-pressed={liveOnly} onClick={() => onLiveOnlyChange(true)}>
          Live only
        </button>
      </div>

      <span className="result-count">
        {matchCount} {matchCount === 1 ? "match" : "matches"}
      </span>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { fetchLive, fetchMatches } from "./api";
import { LIVE_REFRESH_MS, TODAY_REFRESH_MS } from "./config";
import { getTimezone, toDateKey } from "./dates";
import { isLive } from "./status";
import type { LeagueSection, Match } from "./types";

type LoadMode = "initial" | "refresh" | "silent";

function useAppState(): AppStateStatus {
  const [state, setState] = useState<AppStateStatus>(
    (AppState.currentState ?? "active") as AppStateStatus,
  );
  useEffect(() => {
    const sub = AppState.addEventListener("change", setState);
    return () => sub.remove();
  }, []);
  return state;
}

function groupIntoSections(matches: Match[]): LeagueSection[] {
  const byLeague = new Map<number, LeagueSection>();
  for (const m of matches) {
    let section = byLeague.get(m.league.id);
    if (!section) {
      section = {
        title: `${m.league.country} - ${m.league.name}`,
        logo: m.league.logo,
        hasLive: false,
        data: [],
      };
      byLeague.set(m.league.id, section);
    }
    section.data.push(m);
    if (isLive(m)) section.hasLive = true;
  }
  // Leagues with live matches first, then alphabetical.
  return [...byLeague.values()].sort(
    (a, b) => Number(b.hasLive) - Number(a.hasLive) || a.title.localeCompare(b.title),
  );
}

export function useMatches(date: Date) {
  const tz = useMemo(getTimezone, []);
  const dateKey = toDateKey(date);
  const isToday = dateKey === toDateKey(new Date());
  const appState = useAppState();

  const [base, setBase] = useState<Match[]>([]);
  const [live, setLive] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  // Only the newest request may update state (guards against fast date switching).
  const latestRequest = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      const id = ++latestRequest.current;
      if (mode === "initial") {
        setBase([]);
        setLoading(true);
      } else if (mode === "refresh") {
        setRefreshing(true);
      }
      try {
        const res = await fetchMatches(dateKey, tz);
        if (id !== latestRequest.current) return;
        setBase(res.matches);
        setStale(res.stale);
        setError(null);
      } catch (err) {
        if (id !== latestRequest.current) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        if (id === latestRequest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [dateKey, tz],
  );

  // Load the list whenever the selected day changes.
  useEffect(() => {
    void load("initial");
  }, [load]);

  // Reload when the app comes back to the foreground.
  const previousAppState = useRef(appState);
  useEffect(() => {
    if (previousAppState.current !== "active" && appState === "active") {
      void load("silent");
    }
    previousAppState.current = appState;
  }, [appState, load]);

  // While viewing today: poll live scores, and refresh the full list now and then.
  useEffect(() => {
    if (!isToday) {
      setLive([]);
      return;
    }
    if (appState !== "active") return;

    let cancelled = false;
    const pollLive = async () => {
      try {
        const res = await fetchLive();
        if (!cancelled) setLive(res.matches);
      } catch {
        // Keep showing the last known live data; the next poll will retry.
      }
    };

    void pollLive();
    const liveTimer = setInterval(pollLive, LIVE_REFRESH_MS);
    const listTimer = setInterval(() => void load("silent"), TODAY_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(liveTimer);
      clearInterval(listTimer);
    };
  }, [isToday, appState, load]);

  // Overlay fresher live data on top of the day's list.
  const matches = useMemo(() => {
    if (live.length === 0) return base;
    const liveById = new Map(live.map((m) => [m.id, m]));
    return base.map((m) => liveById.get(m.id) ?? m);
  }, [base, live]);

  const sections = useMemo(() => groupIntoSections(matches), [matches]);
  const liveCount = useMemo(() => matches.filter(isLive).length, [matches]);
  const refresh = useCallback(() => load("refresh"), [load]);

  return { sections, liveCount, loading, refreshing, error, stale, refresh };
}

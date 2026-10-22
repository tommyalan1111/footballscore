import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchLive, fetchMatches, isAbortError } from "./api";
import { LIVE_REFRESH_MS, LIST_REFRESH_MS } from "./config";
import { getTimezone, isTodayKey } from "./dates";
import type { Match } from "./types";

type LoadMode = "initial" | "refresh" | "silent";

export interface MatchesState {
  matches: Match[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  stale: boolean;
  updatedAt: number | null;
  liveUpdatedAt: number | null;
  isToday: boolean;
  refresh: () => void;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong.";
}

/**
 * Same data flow as the mobile app, plus:
 *  - polling pauses while the tab is hidden and resumes on focus,
 *  - a request guard so fast date switching can't apply stale responses,
 *  - live matches are overlaid on the selected day's fixtures.
 */
export function useMatches(dateKey: string): MatchesState {
  const tz = useMemo(getTimezone, []);
  const isToday = isTodayKey(dateKey);

  const [base, setBase] = useState<Match[]>([]);
  const [live, setLive] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState<number | null>(null);

  const latestRequest = useRef(0);
  const inFlight = useRef<AbortController | null>(null);

  const load = useCallback(
    async (mode: LoadMode) => {
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      const id = ++latestRequest.current;
      if (mode === "initial") {
        setBase([]);
        setLive([]);
        setLiveUpdatedAt(null);
        setLoading(true);
      } else if (mode === "refresh") {
        setRefreshing(true);
      }

      try {
        const res = await fetchMatches(dateKey, tz, controller.signal);
        if (id !== latestRequest.current) return;
        setBase(res.matches);
        setStale(res.stale);
        setUpdatedAt(res.updatedAt);
        setError(null);
      } catch (err) {
        if (id !== latestRequest.current || isAbortError(err)) return;
        setError(messageOf(err));
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

  // While today is selected: poll live scores, refresh the full list now and then.
  useEffect(() => {
    if (!isToday) {
      setLive([]);
      setLiveUpdatedAt(null);
      return;
    }

    let cancelled = false;
    let liveTimer: number | undefined;
    let listTimer: number | undefined;

    const pollLive = async () => {
      try {
        const res = await fetchLive();
        if (cancelled) return;
        setLive(res.matches);
        setLiveUpdatedAt(res.updatedAt);
      } catch {
        // Keep showing the last known live data; the next tick retries.
      }
    };

    const startTimers = () => {
      if (liveTimer !== undefined) return;
      void pollLive();
      liveTimer = window.setInterval(() => void pollLive(), LIVE_REFRESH_MS);
      listTimer = window.setInterval(() => void load("silent"), LIST_REFRESH_MS);
    };

    const stopTimers = () => {
      if (liveTimer !== undefined) window.clearInterval(liveTimer);
      if (listTimer !== undefined) window.clearInterval(listTimer);
      liveTimer = undefined;
      listTimer = undefined;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startTimers();
        void load("silent");
      } else {
        stopTimers();
      }
    };

    if (document.visibilityState === "visible") startTimers();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      stopTimers();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isToday, load]);

  // Overlay fresher live data on top of the day's list.
  const matches = useMemo(() => {
    if (live.length === 0) return base;
    const liveById = new Map(live.map((m) => [m.id, m]));
    return base.map((m) => liveById.get(m.id) ?? m);
  }, [base, live]);

  const refresh = useCallback(() => {
    void load("refresh");
  }, [load]);

  return {
    matches,
    loading,
    refreshing,
    error,
    stale,
    updatedAt,
    liveUpdatedAt,
    isToday,
    refresh,
  };
}

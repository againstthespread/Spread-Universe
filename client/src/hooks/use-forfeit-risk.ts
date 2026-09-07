import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { GamblingLeagueGameWithPick } from "@shared/schema";
import { isPickLocked } from "@shared/pick-lock";
import { apiFetch } from "@/lib/queryClient";

export interface ForfeitRisk {
  /** True while data is still loading — don't show anything yet. */
  isLoading: boolean;
  /** User hasn't met the week's minimum and could still be forfeited. */
  atRisk: boolean;
  /** Minimum can no longer be met (too many games locked without a pick). */
  unattainable: boolean;
  picksMade: number;
  effectiveMin: number;
  openGameCount: number;
}

/**
 * Computes whether the user is at risk of being auto-forfeited this week in a
 * gambling league: the week has a minimum-pick requirement the user hasn't
 * met yet, and not every game has locked.
 *
 * Mirrors the accounting in the picks tab / server finalization: the target
 * is the configured minimum capped only by the week's total game count.
 */
export function useForfeitRisk(
  leagueId: string,
  currentWeek: number,
  enabled: boolean = true
): ForfeitRisk {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, [enabled]);

  const { data: games, isLoading: gamesLoading } = useQuery<GamblingLeagueGameWithPick[]>({
    queryKey: ["/api/gambling-league/weeks", currentWeek, "games", leagueId],
    queryFn: async () => {
      const res = await apiFetch(`/api/gambling-league/weeks/${currentWeek}/games/${leagueId}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled,
  });

  const { data: weekSettings, isLoading: settingsLoading } = useQuery<{ week: number; minPicks: number; gameCount: number }>({
    queryKey: ["/api/gambling-league/weeks", currentWeek, "settings"],
    queryFn: async () => {
      const res = await apiFetch(`/api/gambling-league/weeks/${currentWeek}/settings`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled,
  });

  return useMemo(() => {
    const empty: ForfeitRisk = {
      isLoading: enabled && (gamesLoading || settingsLoading),
      atRisk: false,
      unattainable: false,
      picksMade: 0,
      effectiveMin: 0,
      openGameCount: 0,
    };
    if (!enabled || !games || !weekSettings) return empty;

    const minPicks = weekSettings.minPicks ?? 0;
    const effectiveMin = Math.min(minPicks, games.length);
    if (effectiveMin <= 0) return { ...empty, isLoading: false };

    const gameLocked = (g: GamblingLeagueGameWithPick) => g.isComplete || isPickLocked(g.gameTime, now);
    const openGames = games.filter(g => !gameLocked(g));
    const picksMade = games.filter(g => g.userPick).length;
    const allLocked = openGames.length === 0;

    const belowMinimum = picksMade < effectiveMin;
    // Warn only while it's still actionable: below the minimum and at least
    // one game hasn't locked yet.
    const atRisk = belowMinimum && !allLocked;
    const unattainable = belowMinimum && !allLocked && picksMade + openGames.length < effectiveMin;

    return {
      isLoading: false,
      atRisk,
      unattainable,
      picksMade,
      effectiveMin,
      openGameCount: openGames.length,
    };
  }, [enabled, games, weekSettings, gamesLoading, settingsLoading, now]);
}

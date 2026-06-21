/**
 * SportsDataIO Golf API client.
 *
 * This tier of the API does not expose the `/TournamentField/{id}` or
 * `/Scores/{id}` endpoints — both return 404 when called.
 * Instead, we use `/Leaderboard/{id}` which is available on this plan
 * and provides both the full field (once published) and per-round scores.
 *
 * Data mapping:
 *   - Field population: each player entry from Leaderboard.Players becomes
 *     a golfer record keyed by PlayerID (sdioPlayerId).
 *   - Score sync (two-path strategy):
 *       COMPLETED round (r.Score > 0): use r.Score - r.Par directly.
 *         This is the authoritative stroke total and is always correct.
 *         Hole-level Score/ToPar/flags are NOT used — they can be wrong for
 *         match play, team events, or early-exit rounds (conceded holes get
 *         phantom values stuffed in that don't match actual strokes).
 *       IN-PROGRESS round (r.Score === 0 or null): r.Score is zeroed by the
 *         API; fall back to summing per-hole to-par from the boolean flags
 *         (Birdie, Bogey, etc.) which ARE reliably set during live play.
 *         WorseThanDoubleBogey is conservatively capped at +3 since the
 *         hole-level ToPar is also zeroed mid-round.
 */

const BASE_URL = "https://api.sportsdata.io/golf/v2/JSON";

function getApiKey(): string {
  const key = process.env.SPORTSDATA_API_KEY;
  if (!key) throw new Error("SPORTSDATA_API_KEY environment variable is not set");
  return key;
}

export interface SdioPlayer {
  PlayerID: number;
  FirstName: string;
  LastName: string;
  Country: string;
  WorldGolfRank: number | null;
  IsWithdrawn: boolean;
  Position: string | null;
  Rounds: SdioRound[] | null;
}

export interface SdioRound {
  RoundNumber: number;
  Score: number | null;
}

export interface SdioScheduleEntry {
  TournamentID: number;
  Name: string;
  StartDate: string;
  IsOver: boolean;
  IsCanceled: boolean;
}

interface LeaderboardHole {
  ToPar: number | null;
  Score: number | null;
  Par: number | null;
  HoleInOne: boolean;
  DoubleEagle: boolean;
  Eagle: boolean;
  Birdie: boolean;
  IsPar: boolean;
  Bogey: boolean;
  DoubleBogey: boolean;
  WorseThanDoubleBogey: boolean;
}

interface LeaderboardRound {
  Number: number;
  Par: number;
  Score: number | null;
  Holes: LeaderboardHole[] | null;
}

interface LeaderboardPlayer {
  PlayerID: number;
  Name: string;
  Country: string | null;
  IsWithdrawn: boolean;
  Position: string | null;
  Rounds: LeaderboardRound[] | null;
}

interface LeaderboardResponse {
  Players: LeaderboardPlayer[] | null;
}

async function sdioFetch<T>(path: string): Promise<T> {
  const key = getApiKey();
  const url = `${BASE_URL}/${path}?key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SportsDataIO API error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * Derives the to-par value for a single hole.
 *
 * For in-progress tournaments SDIO zeroes out the numeric ToPar and Score
 * fields but correctly populates the boolean result flags. We prefer a
 * non-zero numeric ToPar (finalized data) and fall back to the boolean flags.
 * Returns null when no data exists for the hole (round not yet played).
 */
function deriveHoleToPar(hole: LeaderboardHole): number | null {
  // Boolean flags are checked FIRST — they are more reliable than the numeric
  // ToPar field, which the API sometimes populates incorrectly (e.g. Eagle holes
  // can have ToPar=-1 when the correct value is -2).
  if (hole.HoleInOne) return hole.Par != null ? 1 - hole.Par : -2;
  if (hole.DoubleEagle) return -3;
  if (hole.Eagle) return -2;
  if (hole.Birdie) return -1;
  if (hole.IsPar) return 0;
  if (hole.Bogey) return 1;
  if (hole.DoubleBogey) return 2;
  if (hole.WorseThanDoubleBogey) return 3;

  // No flag set — fall back to numeric ToPar for any edge-case finalized data
  if (hole.ToPar !== null && hole.ToPar !== 0) return hole.ToPar;

  // No flag and no numeric value → hole not yet played
  return null;
}

/**
 * Fetches the tournament field (list of players) from the Leaderboard endpoint.
 * Returns one SdioPlayer per entrant; Rounds will be null until scoring begins.
 */
export async function fetchTournamentField(sdioTournamentId: number): Promise<SdioPlayer[]> {
  const data = await sdioFetch<LeaderboardResponse>(`Leaderboard/${sdioTournamentId}`);
  const players = data.Players ?? [];

  return players.map(p => {
    const { firstName, lastName } = splitName(p.Name ?? "");
    return {
      PlayerID: p.PlayerID,
      FirstName: firstName,
      LastName: lastName,
      Country: p.Country ?? "",
      WorldGolfRank: null,
      IsWithdrawn: p.IsWithdrawn ?? false,
      Position: p.Position ?? null,
      Rounds: null,
    };
  });
}

/**
 * Fetches live round scores from the Leaderboard endpoint.
 *
 * Each SdioRound.Score is the sum of per-hole to-par values derived from
 * the hole boolean flags (Birdie, Bogey, etc.) when numeric ToPar is zeroed
 * out, or from the numeric ToPar directly for finalized/completed data.
 * Rounds where no holes have been played (all flags unset, ToPar null) are
 * included with Score: null so the caller can clean up any stale DB rows.
 */
export async function fetchTournamentScores(sdioTournamentId: number): Promise<SdioPlayer[]> {
  const data = await sdioFetch<LeaderboardResponse>(`Leaderboard/${sdioTournamentId}`);
  const players = data.Players ?? [];

  return players.map(p => {
    const { firstName, lastName } = splitName(p.Name ?? "");
    const rounds: SdioRound[] = (p.Rounds ?? []).map(r => {
      // For a completed round the API populates r.Score with the real stroke
      // count (always ≥ 55 in professional golf — never 0).  Using Score - Par
      // is the most reliable path and avoids all hole-flag edge cases entirely.
      if (r.Score !== null && r.Score > 0) {
        return { RoundNumber: r.Number, Score: r.Score - r.Par };
      }

      // Round is in progress — the API zeroes out r.Score and all hole-level
      // ToPar/Score fields, but reliably populates the boolean flags.
      // Sum per-hole to-par derived from those flags.
      const holes = r.Holes ?? [];
      const playedHolesToPar = holes
        .map(h => deriveHoleToPar(h))
        .filter((v): v is number => v !== null);

      // No holes have data yet (round not started or completely unscored)
      if (playedHolesToPar.length === 0) return { RoundNumber: r.Number, Score: null };

      const score = playedHolesToPar.reduce((sum, v) => sum + v, 0);
      return { RoundNumber: r.Number, Score: score };
    });

    return {
      PlayerID: p.PlayerID,
      FirstName: firstName,
      LastName: lastName,
      Country: p.Country ?? "",
      WorldGolfRank: null,
      IsWithdrawn: p.IsWithdrawn ?? false,
      Position: p.Position ?? null,
      Rounds: rounds,
    };
  });
}

/**
 * Fetches the full tournament schedule from the Tournaments endpoint.
 * (The Season-scoped /Schedule/{year} endpoint is not available on this plan.)
 */
export async function fetchSchedule(_season?: number): Promise<SdioScheduleEntry[]> {
  const data = await sdioFetch<any[]>("Tournaments");
  return (data ?? []).map(t => ({
    TournamentID: t.TournamentID,
    Name: t.Name,
    StartDate: t.StartDate,
    IsOver: t.IsOver ?? false,
    IsCanceled: t.Canceled ?? false,
  }));
}

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
 *   - Score sync: the round-level `Score` field from SportsDataIO is a
 *     simulation/model value and should NOT be used. Instead, we sum each
 *     hole's `ToPar` value within `Rounds[].Holes` to get the actual
 *     relative-to-par score for that round.
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
      Rounds: null,
    };
  });
}

/**
 * Fetches live round scores from the Leaderboard endpoint.
 * Each SdioRound.Score is the sum of hole-level ToPar values for that round,
 * which gives the actual relative-to-par score (e.g. -8 for an 8-under round).
 * The round-level Score field from the API is a simulation value and is ignored.
 */
export async function fetchTournamentScores(sdioTournamentId: number): Promise<SdioPlayer[]> {
  const data = await sdioFetch<LeaderboardResponse>(`Leaderboard/${sdioTournamentId}`);
  const players = data.Players ?? [];

  return players.map(p => {
    const { firstName, lastName } = splitName(p.Name ?? "");
    const rounds: SdioRound[] = (p.Rounds ?? [])
      .map(r => {
        const holes = r.Holes ?? [];
        if (holes.length === 0) return null;
        const score = holes.reduce((sum, h) => sum + (h.ToPar ?? 0), 0);
        return { RoundNumber: r.Number, Score: score };
      })
      .filter((r): r is SdioRound => r !== null);

    return {
      PlayerID: p.PlayerID,
      FirstName: firstName,
      LastName: lastName,
      Country: p.Country ?? "",
      WorldGolfRank: null,
      IsWithdrawn: p.IsWithdrawn ?? false,
      Rounds: rounds.length > 0 ? rounds : null,
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

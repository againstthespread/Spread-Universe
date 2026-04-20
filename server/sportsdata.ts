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
 *   - Score sync: each player's Rounds[].Score is a RAW stroke count for
 *     that round, and Rounds[].Par is the course par for that round.
 *     We compute Score - Par to produce the relative-to-par integer that
 *     our schema stores in golf_golfer_scores.score.
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

interface LeaderboardRound {
  Number: number;
  Par: number;
  Score: number | null;
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
 * Each SdioRound.Score is already converted to relative-to-par
 * (raw strokes - course par for that round).
 */
export async function fetchTournamentScores(sdioTournamentId: number): Promise<SdioPlayer[]> {
  const data = await sdioFetch<LeaderboardResponse>(`Leaderboard/${sdioTournamentId}`);
  const players = data.Players ?? [];

  return players.map(p => {
    const { firstName, lastName } = splitName(p.Name ?? "");
    const rounds: SdioRound[] = (p.Rounds ?? [])
      .filter(r => r.Score !== null)
      .map(r => ({
        RoundNumber: r.Number,
        Score: r.Score! - r.Par,
      }));

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

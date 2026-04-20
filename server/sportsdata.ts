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
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

async function fetchLeaderboard(sdioTournamentId: number): Promise<SdioPlayer[]> {
  const data = await sdioFetch<LeaderboardResponse>(`Leaderboard/${sdioTournamentId}`);
  const players = data.Players ?? [];

  return players.map(p => {
    const { firstName, lastName } = splitName(p.Name ?? "");
    const rounds: SdioRound[] = (p.Rounds ?? [])
      .filter(r => r.Score !== null)
      .map(r => ({
        RoundNumber: r.Number,
        Score: r.Score !== null ? r.Score - r.Par : null,
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

export async function fetchTournamentField(sdioTournamentId: number): Promise<SdioPlayer[]> {
  return fetchLeaderboard(sdioTournamentId);
}

export async function fetchTournamentScores(sdioTournamentId: number): Promise<SdioPlayer[]> {
  return fetchLeaderboard(sdioTournamentId);
}

export async function fetchSchedule(season: number): Promise<SdioScheduleEntry[]> {
  const data = await sdioFetch<any[]>(`Tournaments`);
  return (data ?? []).map(t => ({
    TournamentID: t.TournamentID,
    Name: t.Name,
    StartDate: t.StartDate,
    IsOver: t.IsOver ?? false,
    IsCanceled: t.Canceled ?? false,
  }));
}

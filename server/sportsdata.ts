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

export async function fetchTournamentField(sdioTournamentId: number): Promise<SdioPlayer[]> {
  return sdioFetch<SdioPlayer[]>(`TournamentField/${sdioTournamentId}`);
}

export async function fetchTournamentScores(sdioTournamentId: number): Promise<SdioPlayer[]> {
  return sdioFetch<SdioPlayer[]>(`Scores/${sdioTournamentId}`);
}

export async function fetchSchedule(season: number): Promise<SdioScheduleEntry[]> {
  return sdioFetch<SdioScheduleEntry[]>(`Schedule/${season}`);
}

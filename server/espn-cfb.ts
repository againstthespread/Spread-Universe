/**
 * ESPN College Football API client.
 *
 * Uses the free site.api.espn.com scoreboard endpoint to fetch weekly
 * matchups and final scores. `groups=80` restricts to FBS games and
 * `seasontype=2` to the regular season.
 */

const SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard";

export interface EspnCfbGame {
  espnGameId: string;
  season: number;
  week: number;
  homeEspnTeamId: number;
  awayEspnTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "in_progress" | "final";
  gameDate: Date | null;
}

function mapStatus(espnStatusName: string | undefined): EspnCfbGame["status"] {
  if (!espnStatusName) return "scheduled";
  if (espnStatusName === "STATUS_FINAL") return "final";
  if (espnStatusName === "STATUS_SCHEDULED") return "scheduled";
  return "in_progress";
}

export async function fetchCfbGamesByWeek(season: number, week: number): Promise<EspnCfbGame[]> {
  const url = `${SCOREBOARD_URL}?groups=80&week=${week}&dates=${season}&seasontype=2&limit=400`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AgainstTheSpread/1.0)" } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ESPN CFB API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const events: any[] = data.events ?? [];

  const games: EspnCfbGame[] = [];
  for (const event of events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors?.find((c: any) => c.homeAway === "home");
    const away = comp.competitors?.find((c: any) => c.homeAway === "away");
    if (!home?.team?.id || !away?.team?.id) continue;

    const status = mapStatus(event.status?.type?.name);
    games.push({
      espnGameId: String(event.id),
      season,
      week,
      homeEspnTeamId: Number(home.team.id),
      awayEspnTeamId: Number(away.team.id),
      homeTeamName: home.team.displayName ?? "Unknown",
      awayTeamName: away.team.displayName ?? "Unknown",
      homeScore: status === "scheduled" ? null : Number(home.score ?? 0),
      awayScore: status === "scheduled" ? null : Number(away.score ?? 0),
      status,
      gameDate: event.date ? new Date(event.date) : null,
    });
  }
  return games;
}

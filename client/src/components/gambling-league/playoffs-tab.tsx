import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Crown, Info } from "lucide-react";
import type { GamblingLeagueMatchupWithUsers } from "@shared/schema";
import { getPlayoffConfig, participantsInRound, type PlayoffConfig } from "@shared/playoff-config";

interface PlayoffsTabProps {
  leagueId: string;
  capacity: number;
  seasonStarted: boolean;
  onMatchupClick: (matchup: GamblingLeagueMatchupWithUsers) => void;
}

type ProjectedSeed = { userId: string; username: string; wins: number; npw: number };

type ProjectedSlot = {
  user1: ProjectedSeed | null;
  seed1: number | null;
  user2: ProjectedSeed | null;
  seed2: number | null;
  /** Note shown in the second row when user2 is null and it isn't a bye. */
  tbd?: string;
  isBye?: boolean;
};

const gridColsClass = (n: number) =>
  n >= 4 ? "md:grid-cols-4" : n === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

/** Builds the projected bracket columns from seeds, mirroring the server engine. */
function buildProjection(seeds: ProjectedSeed[], config: PlayoffConfig): ProjectedSlot[][] | null {
  if (seeds.length < config.playoffTeams) return null;
  const { playoffTeams: t, byes: b } = config;
  const s = (i: number) => seeds[i - 1] ?? null; // 1-indexed

  return config.rounds.map((round, idx) => {
    const slots: ProjectedSlot[] = [];
    if (idx === 0) {
      // First playing round: seeds b+1..t paired high vs low, plus bye cards
      const lo = b + 1, hi = t;
      for (let i = 0; i < (t - b) / 2; i++) {
        slots.push({ user1: s(lo + i), seed1: lo + i, user2: s(hi - i), seed2: hi - i });
      }
      for (let i = 1; i <= b; i++) {
        slots.push({ user1: s(i), seed1: i, user2: null, seed2: null, isBye: true });
      }
    } else if (idx === 1 && b > 0) {
      // Bye seeds re-enter against first-round winners
      for (let i = 1; i <= b; i++) {
        slots.push({ user1: s(i), seed1: i, user2: null, seed2: null, tbd: `${config.rounds[0].label} winner` });
      }
    } else {
      const games = participantsInRound(config, idx) / 2;
      const prev = config.rounds[idx - 1];
      for (let i = 0; i < games; i++) {
        slots.push({ user1: null, seed1: null, user2: null, seed2: null, tbd: `${prev.label} winners` });
      }
    }
    return slots;
  });
}

function SeedName({ entry, seed }: { entry: ProjectedSeed | null; seed: number | null }) {
  if (!entry) return <span className="text-muted-foreground">TBD</span>;
  return (
    <span>
      {seed !== null && <span className="text-xs text-muted-foreground mr-1.5">#{seed}</span>}
      {entry.username}
    </span>
  );
}

export function PlayoffsTab({ leagueId, capacity, seasonStarted, onMatchupClick }: PlayoffsTabProps) {
  const config = getPlayoffConfig(capacity);

  const { data: allMatchups = [] } = useQuery<GamblingLeagueMatchupWithUsers[]>({
    queryKey: ["/api/gambling-league/leagues", leagueId, "matchups", "all"],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/leagues/${leagueId}/matchups`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });
  const playoffMatchups = allMatchups.filter(m => m.isPlayoff);
  const showReal = playoffMatchups.length > 0;

  const { data: seeds = [], isLoading: seedsLoading } = useQuery<ProjectedSeed[]>({
    queryKey: ["/api/gambling-league/leagues", leagueId, "projected-seeds"],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/leagues/${leagueId}/projected-seeds`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !showReal && seasonStarted,
  });

  const firstWeek = config.rounds[0].week;
  const roundsSummary = config.rounds.map(r => r.label).join(", ");

  if (showReal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="w-5 h-5" />
            Playoff Bracket
          </CardTitle>
          <CardDescription>Weeks {firstWeek}–17: {roundsSummary}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-6 ${gridColsClass(config.rounds.length)}`} data-testid="playoff-bracket">
            {config.rounds.map((round) => {
              const roundMatchups = playoffMatchups.filter(m => m.playoffRound === round.key);
              return (
                <div key={round.key} className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {round.label} — Week {round.week}
                  </h3>
                  {roundMatchups.length === 0 ? (
                    <div className="p-3 rounded-md border border-dashed text-sm text-muted-foreground text-center">
                      TBD
                    </div>
                  ) : (
                    roundMatchups.map((matchup) => (
                      <div
                        key={matchup.id}
                        className="p-3 rounded-md border hover-elevate cursor-pointer space-y-1"
                        onClick={() => onMatchupClick(matchup)}
                        data-testid={`bracket-matchup-${matchup.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={matchup.winnerId === matchup.user1.id ? "font-bold text-green-600 dark:text-green-400" : ""}>
                            {matchup.user1.username}
                            {matchup.winnerId === matchup.user1.id && <Crown className="w-3 h-3 inline ml-1 text-yellow-500" />}
                          </span>
                          {matchup.isComplete && <Badge variant="secondary">{matchup.user1Npw ?? 0}</Badge>}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={matchup.winnerId === matchup.user2?.id ? "font-bold text-green-600 dark:text-green-400" : ""}>
                            {matchup.user2?.username || "BYE"}
                            {matchup.user2 && matchup.winnerId === matchup.user2.id && <Crown className="w-3 h-3 inline ml-1 text-yellow-500" />}
                          </span>
                          {matchup.isComplete && matchup.user2 && <Badge variant="secondary">{matchup.user2Npw ?? 0}</Badge>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (seedsLoading) {
    return <Card><CardContent className="p-12 text-center text-muted-foreground">Loading playoff picture...</CardContent></Card>;
  }

  const projection = seasonStarted ? buildProjection(seeds, config) : null;

  if (!projection) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <GitBranch className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Playoff Picture Yet</h3>
          <p className="text-muted-foreground">
            The playoff projection will appear once the season starts.
            {` This league sends ${config.playoffTeams} of ${capacity} to the playoffs, beginning week ${firstWeek}.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitBranch className="w-5 h-5" />
          Projected Playoff Bracket
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          If the season ended today — top {config.playoffTeams} of {capacity} qualify
          {config.byes > 0 ? `, byes for the top ${config.byes} seeds` : ""}. Playoffs begin Week {firstWeek}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-6 ${gridColsClass(config.rounds.length)}`} data-testid="projected-bracket">
          {config.rounds.map((round, idx) => (
            <div key={round.key} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {round.label} — Week {round.week}
              </h3>
              {projection[idx].map((slot, i) => (
                <div key={i} className="p-3 rounded-md border space-y-1" data-testid={`projected-${round.key}-${i}`}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <SeedName entry={slot.user1} seed={slot.seed1} />
                    {slot.user1 && <Badge variant="secondary" className="text-xs">{slot.user1.wins}W / {slot.user1.npw > 0 ? "+" : ""}{slot.user1.npw}</Badge>}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    {slot.user2 ? (
                      <>
                        <SeedName entry={slot.user2} seed={slot.seed2} />
                        <Badge variant="secondary" className="text-xs">{slot.user2.wins}W / {slot.user2.npw > 0 ? "+" : ""}{slot.user2.npw}</Badge>
                      </>
                    ) : slot.isBye ? (
                      <span className="text-muted-foreground">BYE</span>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">{slot.tbd ?? "TBD"}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

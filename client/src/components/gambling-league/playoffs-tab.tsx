import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Crown, Info } from "lucide-react";
import type { GamblingLeagueMatchupWithUsers } from "@shared/schema";

interface PlayoffsTabProps {
  leagueId: string;
  playoffsStarted: boolean;
  seasonStarted: boolean;
  onMatchupClick: (matchup: GamblingLeagueMatchupWithUsers) => void;
}

type ProjectedSeed = { userId: string; username: string; wins: number; npw: number };

const ROUNDS = [
  { key: "quarterfinal", label: "Round 1 — Week 15", short: "Quarterfinals" },
  { key: "semifinal", label: "Semifinals — Week 16", short: "Semifinals" },
  { key: "championship", label: "Championship — Week 17", short: "Championship" },
] as const;

/** Mirrors the server playoff engine's bracket shapes for 2-16 seeds. */
function buildProjection(seeds: ProjectedSeed[]) {
  const s = (i: number) => seeds[i - 1] ?? null; // 1-indexed
  if (seeds.length >= 6) {
    return {
      quarterfinal: [
        { user1: s(3), user2: s(6), seeds: [3, 6] },
        { user1: s(4), user2: s(5), seeds: [4, 5] },
        { user1: s(1), user2: null, seeds: [1, null] }, // bye
        { user1: s(2), user2: null, seeds: [2, null] }, // bye
      ],
      semifinal: [
        { user1: s(1), user2: null, seeds: [1, null], tbd: "Lowest remaining seed" },
        { user1: s(2), user2: null, seeds: [2, null], tbd: "Highest remaining seed" },
      ],
      championship: [{ user1: null, user2: null, seeds: [null, null], tbd: "Semifinal winners" }],
    };
  }
  if (seeds.length >= 4) {
    return {
      quarterfinal: null, // no round 1
      semifinal: [
        { user1: s(1), user2: s(4), seeds: [1, 4] },
        { user1: s(2), user2: s(3), seeds: [2, 3] },
      ],
      championship: [{ user1: null, user2: null, seeds: [null, null], tbd: "Semifinal winners" }],
    };
  }
  if (seeds.length >= 2) {
    return {
      quarterfinal: null,
      semifinal: null,
      championship: [{ user1: s(1), user2: s(2), seeds: [1, 2] }],
    };
  }
  return null;
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

export function PlayoffsTab({ leagueId, playoffsStarted, seasonStarted, onMatchupClick }: PlayoffsTabProps) {
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

  if (showReal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="w-5 h-5" />
            Playoff Bracket
          </CardTitle>
          <CardDescription>Weeks 15–17: Quarterfinals, Semifinals, Championship</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3" data-testid="playoff-bracket">
            {ROUNDS.map(({ key: round, label }) => {
              const roundMatchups = playoffMatchups.filter(m => m.playoffRound === round);
              return (
                <div key={round} className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label}</h3>
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

  const projection = seasonStarted ? buildProjection(seeds) : null;

  if (!projection) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <GitBranch className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Playoff Picture Yet</h3>
          <p className="text-muted-foreground">The playoff projection will appear once the season starts and the league has at least 2 members.</p>
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
          If the season ended today — seeds update as matchups finish. {playoffsStarted ? "" : "Playoffs begin Week 15."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3" data-testid="projected-bracket">
          {ROUNDS.map(({ key, label }) => {
            const slots = projection[key as keyof typeof projection] as any[] | null;
            return (
              <div key={key} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label}</h3>
                {!slots ? (
                  <div className="p-3 rounded-md border border-dashed text-sm text-muted-foreground text-center">
                    Not played at this league size
                  </div>
                ) : (
                  slots.map((slot, i) => (
                    <div key={i} className="p-3 rounded-md border space-y-1" data-testid={`projected-${key}-${i}`}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <SeedName entry={slot.user1} seed={slot.seeds[0]} />
                        {slot.user1 && <Badge variant="secondary" className="text-xs">{slot.user1.wins}W / {slot.user1.npw > 0 ? "+" : ""}{slot.user1.npw}</Badge>}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        {slot.user2 ? (
                          <>
                            <SeedName entry={slot.user2} seed={slot.seeds[1]} />
                            <Badge variant="secondary" className="text-xs">{slot.user2.wins}W / {slot.user2.npw > 0 ? "+" : ""}{slot.user2.npw}</Badge>
                          </>
                        ) : slot.tbd ? (
                          <span className="text-muted-foreground text-xs italic">{slot.tbd}</span>
                        ) : (
                          <span className="text-muted-foreground">BYE</span>
                        )}
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

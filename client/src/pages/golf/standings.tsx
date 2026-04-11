import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flag, ArrowLeft, Trophy, Medal } from "lucide-react";
import type { GolfLeagueStandingEntry, GolfLeagueDetail } from "@shared/schema";

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-700" />;
  return <span className="w-4 text-center text-sm text-muted-foreground">{rank}</span>;
}

function ScoreDisplay({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-sm">—</span>;
  const sign = score < 0 ? "" : "+";
  return (
    <span className={score < 0 ? "text-red-600 font-bold" : score === 0 ? "font-medium" : "text-muted-foreground"}>
      {score}
    </span>
  );
}

export default function GolfStandings({ params }: { params: { id: string } }) {
  const { user } = useAuth();

  const { data: league } = useQuery<GolfLeagueDetail>({
    queryKey: ["/api/golf/leagues", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/golf/leagues/${params.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: standings = [], isLoading } = useQuery<GolfLeagueStandingEntry[]>({
    queryKey: ["/api/golf/leagues", params.id, "standings"],
    queryFn: async () => {
      const res = await fetch(`/api/golf/leagues/${params.id}/standings`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: league?.draftStatus === "completed" ? 60000 : false,
  });

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading standings...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/golf/leagues/${params.id}`}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to League
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flag className="w-6 h-6 text-emerald-500" />
          Standings
        </h1>
        {league && (
          <p className="text-muted-foreground mt-1">
            {league.name} · {league.tournament?.name}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">Lower total score wins. Only rounds with scores entered count.</p>
      </div>

      {standings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No standings available yet. Scores will appear once the tournament begins.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {standings.map((entry, index) => (
            <Card
              key={entry.userId}
              className={entry.userId === user?.id ? "border-emerald-400 dark:border-emerald-600" : ""}
              data-testid={`card-standing-${entry.userId}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RankIcon rank={index + 1} />
                    <span className="font-semibold" data-testid={`text-standing-username-${entry.userId}`}>
                      {entry.username}
                      {entry.userId === user?.id && (
                        <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                      )}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" data-testid={`text-total-score-${entry.userId}`}>
                      <ScoreDisplay score={entry.totalScore} />
                    </div>
                    <div className="text-xs text-muted-foreground">total strokes</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {entry.roster.map(rosterEntry => (
                    <div
                      key={rosterEntry.golfer.id}
                      className="flex items-center justify-between text-sm p-2 rounded bg-muted/40"
                      data-testid={`row-roster-${entry.userId}-${rosterEntry.golfer.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs w-8">#{rosterEntry.golfer.worldRank}</span>
                        <span>{rosterEntry.golfer.firstName} {rosterEntry.golfer.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {rosterEntry.scores.map(s => (
                          <span key={s.round} className="text-xs text-muted-foreground">
                            R{s.round}: {s.score}
                          </span>
                        ))}
                        {rosterEntry.scores.length > 0 && (
                          <span className="font-medium text-xs bg-muted px-2 py-0.5 rounded">
                            {rosterEntry.totalScore}
                          </span>
                        )}
                        {rosterEntry.scores.length === 0 && (
                          <span className="text-xs text-muted-foreground">No scores</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GameCard } from "@/components/marchmadness/game-card";
import { RoundTabs } from "@/components/marchmadness/round-tabs";
import { Trophy, Shield, BarChart3 } from "lucide-react";
import type { MarchmadnessRound, MarchmadnessGameWithTeams, MarchmadnessUserStats } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";

export default function MarchMadnessDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@crowdline.com" || user?.email === "admin@marchmadness.com";

  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);

  const { data: rounds, isLoading: roundsLoading } = useQuery<MarchmadnessRound[]>({
    queryKey: ["/api/marchmadness/rounds"],
  });

  const { data: games, isLoading: gamesLoading } = useQuery<MarchmadnessGameWithTeams[]>({
    queryKey: ["/api/marchmadness/games", { roundId: selectedRoundId }],
    queryFn: async () => {
      const url = selectedRoundId 
        ? `/api/marchmadness/games?roundId=${selectedRoundId}` 
        : "/api/marchmadness/games";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json();
    },
    enabled: !!selectedRoundId || !roundsLoading,
  });

  const { data: userStats } = useQuery<MarchmadnessUserStats>({
    queryKey: ["/api/marchmadness/users/me/stats"],
  });

  useEffect(() => {
    if (rounds && rounds.length > 0 && !selectedRoundId) {
      setSelectedRoundId(rounds[0].id);
    }
  }, [rounds, selectedRoundId]);

  const isLoading = roundsLoading || gamesLoading;

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-marchmadness-title">March Madness ATS</h1>
          <p className="text-muted-foreground">Pick winners against the spread in the NCAA Tournament</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/marchmadness/leaderboard">
            <Button variant="outline" data-testid="link-leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </Button>
          </Link>
          {isAdmin && (
            <Link href="/marchmadness/admin">
              <Button variant="outline" data-testid="link-admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
        </div>
      </div>

      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold" data-testid="text-total-points">{userStats.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold" data-testid="text-rank">#{userStats.rank || "-"}</div>
              <div className="text-sm text-muted-foreground">Rank</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold" data-testid="text-correct">{userStats.correctPicks}/{userStats.totalPicks}</div>
              <div className="text-sm text-muted-foreground">Correct Picks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold" data-testid="text-win-pct">{userStats.winPercentage}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </CardContent>
          </Card>
        </div>
      )}

      {roundsLoading ? (
        <Skeleton className="h-12 w-full mb-6" />
      ) : rounds && rounds.length > 0 ? (
        <div className="mb-6">
          <RoundTabs
            rounds={rounds}
            selectedRoundId={selectedRoundId}
            onRoundChange={setSelectedRoundId}
          />
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : games && games.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No games available for this round yet.
          </p>
          {isAdmin && (
            <Link href="/marchmadness/admin">
              <Button className="mt-4" variant="outline">
                Add Games
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className="mt-8 text-sm text-muted-foreground text-center">
        <p>Scoring: Points double each round - Round of 64 (10pts) to Championship (320pts)</p>
      </div>
    </div>
  );
}

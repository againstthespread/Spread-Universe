import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoundSection } from "@/components/postseason/round-section";
import { Trophy, Shield, History, BarChart3 } from "lucide-react";
import type { PostseasonGameWithPick, PostseasonUserStats, PostseasonRound } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";

const ROUNDS: PostseasonRound[] = ['WILD_CARD', 'DIVISIONAL', 'CONFERENCE', 'SUPER_BOWL'];

export default function PostseasonDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@crowdline.com" || user?.email === "admin@postseason.com";

  const { data: games, isLoading: gamesLoading } = useQuery<PostseasonGameWithPick[]>({
    queryKey: ["/api/postseason/games"],
  });

  const { data: userStats } = useQuery<PostseasonUserStats>({
    queryKey: ["/api/postseason/stats/me"],
  });

  const gamesByRound = ROUNDS.reduce((acc, round) => {
    acc[round] = games?.filter(g => g.round === round) || [];
    return acc;
  }, {} as Record<PostseasonRound, PostseasonGameWithPick[]>);

  const totalGames = games?.length || 0;
  const hasGames = totalGames > 0;

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-postseason-title">Postseason ATS</h1>
          <p className="text-muted-foreground">Pick NFL playoff games against the spread</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/postseason/leaderboard">
            <Button variant="outline" data-testid="link-leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </Button>
          </Link>
          <Link href="/postseason/history">
            <Button variant="outline" data-testid="link-history">
              <History className="h-4 w-4 mr-2" />
              Pick History
            </Button>
          </Link>
          {isAdmin && (
            <Link href="/postseason/admin">
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
      {gamesLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : hasGames ? (
        <>
          {ROUNDS.map((round) => (
            <RoundSection key={round} round={round} games={gamesByRound[round]} />
          ))}
        </>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No playoff games available yet.
          </p>
          {isAdmin && (
            <Link href="/postseason/admin">
              <Button className="mt-4" variant="outline">
                Add Games
              </Button>
            </Link>
          )}
        </div>
      )}
      <div className="mt-8 text-sm text-muted-foreground text-center">
        <p>Scoring: Wild Card (125pts) | Divisional (250pts) | Conference (500pts) | Super Bowl (1000pts)</p>
      </div>
    </div>
  );
}

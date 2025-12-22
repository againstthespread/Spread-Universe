import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target, Award, Calendar, Percent } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type UserStats = {
  userId: string;
  username: string;
  displayName: string | null;
  totalPicks: number;
  correctPicks: number;
  incorrectPicks: number;
  pendingPicks: number;
  totalPoints: number;
  accuracy: number;
  byRound: {
    round: string;
    total: number;
    correct: number;
    incorrect: number;
    pending: number;
    accuracy: number;
    points: number;
  }[];
  currentStreak: {
    type: "win" | "loss" | null;
    count: number;
  };
  longestWinStreak: number;
  longestLossStreak: number;
  bestRound: {
    round: string;
    accuracy: number;
  } | null;
  worstRound: {
    round: string;
    accuracy: number;
  } | null;
  favoriteTeam: {
    team: string;
    picks: number;
    accuracy: number;
  } | null;
  recentForm: {
    lastFiveGames: Array<{
      gameId: string;
      homeTeam: string;
      awayTeam: string;
      selectedTeam: string;
      isCorrect: boolean | null;
      pointsEarned: number;
      round: string;
    }>;
  };
};

export default function StatsPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ["/api/stats", user?.id],
    enabled: !!user?.id,
    staleTime: 0, // Always refetch on mount to get latest stats
    refetchOnMount: true,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading statistics...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">No statistics available yet. Start making picks!</div>
        </div>
      </div>
    );
  }

  const ROUND_LABELS: Record<string, string> = {
    WILD_CARD: "Wild Card",
    DIVISIONAL: "Divisional",
    CONFERENCE: "Conference",
    SUPER_BOWL: "Super Bowl",
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-stats">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading" data-testid="text-stats-title">
          Your Statistics
        </h1>
        <p className="text-muted-foreground mt-1">
          {stats.displayName || stats.username}'s Performance Analytics
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-picks">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Picks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-picks">
              {stats.totalPicks}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingPicks} pending
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-accuracy">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-accuracy">
              {stats.accuracy.toFixed(1)}%
            </div>
            <Progress value={stats.accuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card data-testid="card-total-points">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-points">
              {stats.totalPoints}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.correctPicks} correct picks
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-current-streak">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-current-streak">
              {stats.currentStreak.count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.currentStreak.type === "win" && "wins in a row"}
              {stats.currentStreak.type === "loss" && "losses in a row"}
              {stats.currentStreak.type === null && "no streak"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Tabs */}
      <Tabs defaultValue="rounds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rounds" data-testid="tab-rounds">By Round</TabsTrigger>
          <TabsTrigger value="streaks" data-testid="tab-streaks">Streaks</TabsTrigger>
          <TabsTrigger value="recent" data-testid="tab-recent">Recent Form</TabsTrigger>
        </TabsList>

        {/* By Round Tab */}
        <TabsContent value="rounds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Round</CardTitle>
              <CardDescription>
                Your accuracy and points earned in each playoff round
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.byRound.map((round) => (
                  <div key={round.round} className="space-y-2" data-testid={`round-stats-${round.round}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ROUND_LABELS[round.round]}</span>
                        <Badge variant="outline" data-testid={`badge-round-total-${round.round}`}>
                          {round.total} picks
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600" data-testid={`text-round-correct-${round.round}`}>
                          ✓ {round.correct}
                        </span>
                        <span className="text-red-600" data-testid={`text-round-incorrect-${round.round}`}>
                          ✗ {round.incorrect}
                        </span>
                        <span className="text-muted-foreground" data-testid={`text-round-pending-${round.round}`}>
                          ○ {round.pending}
                        </span>
                        <span className="font-medium min-w-[60px] text-right" data-testid={`text-round-points-${round.round}`}>
                          {round.points} pts
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={round.accuracy} className="flex-1" />
                      <span className="text-sm font-medium min-w-[50px] text-right" data-testid={`text-round-accuracy-${round.round}`}>
                        {round.accuracy.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {stats.bestRound && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Best Round</span>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1" data-testid="text-best-round">
                        {ROUND_LABELS[stats.bestRound.round]} ({stats.bestRound.accuracy.toFixed(1)}%)
                      </p>
                    </div>
                    {stats.worstRound && (
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-sm font-medium">Worst Round</span>
                          <Target className="h-4 w-4 text-red-600" />
                        </div>
                        <p className="text-muted-foreground text-sm mt-1" data-testid="text-worst-round">
                          {ROUND_LABELS[stats.worstRound.round]} ({stats.worstRound.accuracy.toFixed(1)}%)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Streaks Tab */}
        <TabsContent value="streaks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card data-testid="card-win-streak">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Longest Win Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600" data-testid="text-longest-win-streak">
                  {stats.longestWinStreak}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Consecutive correct picks
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-loss-streak">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
                  Longest Loss Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-600" data-testid="text-longest-loss-streak">
                  {stats.longestLossStreak}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Consecutive incorrect picks
                </p>
              </CardContent>
            </Card>
          </div>

          {stats.favoriteTeam && (
            <Card data-testid="card-favorite-team">
              <CardHeader>
                <CardTitle>Most Picked Team</CardTitle>
                <CardDescription>
                  Your go-to team across all rounds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-favorite-team">
                      {stats.favoriteTeam.team}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.favoriteTeam.picks} picks
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" data-testid="text-favorite-team-accuracy">
                      {stats.favoriteTeam.accuracy.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      accuracy
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recent Form Tab */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Last 5 Completed Games
              </CardTitle>
              <CardDescription>
                Your most recent pick results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentForm.lastFiveGames.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No completed picks yet
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentForm.lastFiveGames.map((game, index) => (
                    <div
                      key={game.gameId}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      data-testid={`recent-game-${index}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {game.homeTeam} vs {game.awayTeam}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {ROUND_LABELS[game.round]} • Picked: {game.selectedTeam}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {game.pointsEarned} pts
                        </span>
                        {game.isCorrect === true && (
                          <Badge className="bg-green-600" data-testid={`badge-recent-correct-${index}`}>
                            Correct
                          </Badge>
                        )}
                        {game.isCorrect === false && (
                          <Badge className="bg-red-600" data-testid={`badge-recent-incorrect-${index}`}>
                            Incorrect
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

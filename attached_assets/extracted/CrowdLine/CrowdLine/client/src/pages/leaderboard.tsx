import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, ArrowLeft, Target, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type LeaderboardEntry = {
  userId: string;
  username: string;
  totalPoints: number;
  gamesPredicted: number;
  correctWinners: number;
  exactScores: number;
  averagePointDiff: number;
};

export default function Leaderboard() {
  const { toast } = useToast();

  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const { data: currentUser } = useQuery<{ id: string; username: string; isAdmin: boolean }>({
    queryKey: ["/api/user"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />;
    return null;
  };

  const getAccuracyPercentage = (correctWinners: number, gamesPredicted: number) => {
    if (gamesPredicted === 0) return 0;
    return ((correctWinners / gamesPredicted) * 100).toFixed(1);
  };

  const currentUserRank = leaderboard?.findIndex(entry => entry.userId === currentUser?.id) ?? -1;
  const currentUserEntry = leaderboard?.[currentUserRank];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading tracking-wide">LEADERBOARD</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Top predictors and your ranking
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" data-testid="button-home" asChild>
                <a href="/home" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Games
                </a>
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {currentUserEntry && (
          <Card className="mb-8 border-primary" data-testid="card-user-stats">
            <CardHeader>
              <CardTitle className="text-xl">Your Stats</CardTitle>
              <CardDescription>Rank #{currentUserRank + 1}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Trophy className="h-3 w-3" />
                    Total Points
                  </div>
                  <div className="text-2xl font-bold" data-testid="text-user-points">
                    {currentUserEntry.totalPoints}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Target className="h-3 w-3" />
                    Games Predicted
                  </div>
                  <div className="text-2xl font-bold">
                    {currentUserEntry.gamesPredicted}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <TrendingUp className="h-3 w-3" />
                    Accuracy
                  </div>
                  <div className="text-2xl font-bold">
                    {getAccuracyPercentage(currentUserEntry.correctWinners, currentUserEntry.gamesPredicted)}%
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Award className="h-3 w-3" />
                    Exact Scores
                  </div>
                  <div className="text-2xl font-bold">
                    {currentUserEntry.exactScores}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-heading tracking-wide">TOP PREDICTORS</CardTitle>
            <CardDescription>
              Scoring: 25 pts exact score + 10 pts correct winner + up to 10 pts proximity (max 45 pts per game)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading leaderboard...</div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No completed games yet. Check back after games finish!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Games</TableHead>
                      <TableHead className="text-right">Win %</TableHead>
                      <TableHead className="text-right">Exact</TableHead>
                      <TableHead className="text-right">Avg Diff</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, index) => (
                      <TableRow 
                        key={entry.userId}
                        className={entry.userId === currentUser?.id ? "bg-primary/5" : ""}
                        data-testid={`row-leaderboard-${index + 1}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRankIcon(index + 1)}
                            <span className="font-medium">{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{entry.username}</span>
                            {entry.userId === currentUser?.id && (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold" data-testid={`text-points-${index + 1}`}>
                          {entry.totalPoints}
                        </TableCell>
                        <TableCell className="text-right">{entry.gamesPredicted}</TableCell>
                        <TableCell className="text-right">
                          {getAccuracyPercentage(entry.correctWinners, entry.gamesPredicted)}%
                        </TableCell>
                        <TableCell className="text-right">{entry.exactScores}</TableCell>
                        <TableCell className="text-right">
                          {entry.averagePointDiff.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

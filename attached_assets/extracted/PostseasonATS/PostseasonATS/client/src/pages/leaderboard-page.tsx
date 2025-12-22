import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, TrendingUp, Target } from "lucide-react";

type LeaderboardEntry = {
  userId: string;
  username: string;
  displayName: string | null;
  totalPoints: number;
  correctPicks: number;
  totalPicks: number;
  maxPossible: number;
  remaining: number;
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const currentUserStats = leaderboard?.find(entry => entry.userId === user?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          See how you stack up against the competition
        </p>
      </div>

      {/* Current User Stats Card */}
      {currentUserStats && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-lg">Your Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-card rounded-md">
                <div className="text-3xl font-bold text-primary">
                  {currentUserStats.totalPoints}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Total Points</div>
              </div>
              <div className="text-center p-4 bg-card rounded-md">
                <div className="text-3xl font-bold">
                  {currentUserStats.correctPicks}/{currentUserStats.totalPicks}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {currentUserStats.totalPicks > 0 
                    ? `${Math.round((currentUserStats.correctPicks / currentUserStats.totalPicks) * 100)}%`
                    : "0%"} Win Rate
                </div>
              </div>
              <div className="text-center p-4 bg-card rounded-md">
                <div className="text-3xl font-bold">
                  {currentUserStats.maxPossible}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Max Possible</div>
              </div>
              <div className="text-center p-4 bg-card rounded-md">
                <div className="text-3xl font-bold">
                  {currentUserStats.remaining}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Remaining</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Player</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm">Total Pts</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm hidden md:table-cell">Record</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm hidden md:table-cell">Max Possible</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm hidden lg:table-cell">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard?.map((entry, index) => {
                  const isCurrentUser = entry.userId === user?.id;
                  const rank = index + 1;
                  
                  return (
                    <tr 
                      key={entry.userId} 
                      className={`border-b hover-elevate ${
                        isCurrentUser ? "bg-primary/5 border-l-4 border-l-primary" : ""
                      }`}
                      data-testid={`leaderboard-row-${entry.username}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {rank <= 3 && (
                            <i className={`fas fa-trophy ${
                              rank === 1 ? "text-yellow-500" : 
                              rank === 2 ? "text-gray-400" : 
                              "text-amber-600"
                            }`}></i>
                          )}
                          <span className="font-semibold">{rank}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {entry.displayName || entry.username}
                          </span>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="w-fit mt-1">You</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-lg font-bold text-primary">
                          {entry.totalPoints}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center hidden md:table-cell">
                        <div className="flex flex-col items-center">
                          <span className="font-medium">
                            {entry.correctPicks}-{entry.totalPicks - entry.correctPicks}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {entry.totalPicks > 0 
                              ? `${Math.round((entry.correctPicks / entry.totalPicks) * 100)}%`
                              : "0%"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center hidden md:table-cell">
                        <span className="font-medium">{entry.maxPossible}</span>
                      </td>
                      <td className="py-3 px-4 text-center hidden lg:table-cell">
                        <span className="font-medium">{entry.remaining}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {leaderboard?.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No players yet</p>
              <p className="text-sm text-muted-foreground">
                Be the first to make picks and appear on the leaderboard!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

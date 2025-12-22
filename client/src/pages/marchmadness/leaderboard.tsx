import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Target, Percent } from "lucide-react";
import type { MarchmadnessLeaderboardEntry, MarchmadnessUserStats } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";

export default function MarchMadnessLeaderboard() {
  const { user } = useAuth();

  const { data: leaderboard, isLoading } = useQuery<MarchmadnessLeaderboardEntry[]>({
    queryKey: ["/api/marchmadness/leaderboard"],
  });

  const { data: userStats } = useQuery<MarchmadnessUserStats>({
    queryKey: ["/api/marchmadness/users/me/stats"],
  });

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/marchmadness">
          <Button variant="ghost" size="sm" data-testid="link-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
        </Link>
      </div>

      {userStats && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {userStats.totalPoints}
                </div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">#{userStats.rank || "-"}</div>
                <div className="text-sm text-muted-foreground">Rank</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                  <Target className="h-5 w-5" />
                  {userStats.correctPicks}/{userStats.totalPicks}
                </div>
                <div className="text-sm text-muted-foreground">Correct Picks</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                  <Percent className="h-5 w-5" />
                  {userStats.winPercentage}%
                </div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </div>
            </div>

            {userStats.roundStats && userStats.roundStats.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-2">By Round</div>
                <div className="flex flex-wrap gap-2">
                  {userStats.roundStats.map((rs) => (
                    <Badge key={rs.roundId} variant="outline" className="text-xs">
                      {rs.roundName}: {rs.correctPicks}/{rs.totalPicks} ({rs.pointsEarned}pts)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Picks</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Correct</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Win %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry, index) => (
                  <TableRow 
                    key={entry.visitorId}
                    className={user?.id === entry.visitorId ? "bg-muted/50" : ""}
                    data-testid={`row-leaderboard-${entry.visitorId}`}
                  >
                    <TableCell className="font-medium">
                      {index === 0 && <span className="text-yellow-500">1</span>}
                      {index === 1 && <span className="text-gray-400">2</span>}
                      {index === 2 && <span className="text-amber-600">3</span>}
                      {index > 2 && index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.username}
                        {user?.id === entry.visitorId && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {entry.totalPoints}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {entry.totalPicks}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {entry.correctPicks}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {entry.winPercentage}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No picks yet. Be the first to make one!
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-sm text-muted-foreground text-center">
        <p>Points double each round: Round of 64 (10pts) to Championship (320pts)</p>
      </div>
    </div>
  );
}

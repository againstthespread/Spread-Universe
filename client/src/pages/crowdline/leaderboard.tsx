import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy } from "lucide-react";
import type { CrowdlineLeaderboardEntry } from "../../../../server/storage";
import { useAuth } from "@/lib/auth-context";

export default function CrowdlineLeaderboard() {
  const { user } = useAuth();

  const { data: leaderboard, isLoading } = useQuery<CrowdlineLeaderboardEntry[]>({
    queryKey: ["/api/crowdline/leaderboard"],
  });

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/crowdline">
          <Button variant="ghost" size="sm" data-testid="link-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
        </Link>
      </div>

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
                  <TableHead className="text-right hidden sm:table-cell">Games</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Correct</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Exact</TableHead>
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
                      {entry.gamesPredicted}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {entry.correctWinners}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {entry.exactScores}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No predictions yet. Be the first to make one!
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-sm text-muted-foreground text-center">
        <p>Scoring: 3 points for correct winner, 10 points for exact score</p>
      </div>
    </div>
  );
}

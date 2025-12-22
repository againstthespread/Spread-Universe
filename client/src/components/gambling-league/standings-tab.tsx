import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target } from "lucide-react";
import type { GamblingLeagueStandingEntry } from "@shared/schema";

interface StandingsTabProps {
  leagueId: string;
}

export function StandingsTab({ leagueId }: StandingsTabProps) {
  const { data: standings = [], isLoading } = useQuery<GamblingLeagueStandingEntry[]>({
    queryKey: ["/api/gambling-league/leagues", leagueId, "standings"],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/leagues/${leagueId}/standings`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Loading standings...
        </CardContent>
      </Card>
    );
  }

  if (standings.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Standings Yet</h3>
          <p className="text-muted-foreground">
            Standings will appear once matchups are completed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          League Standings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-standings">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Rank</th>
                <th className="text-left py-3 px-2">Player</th>
                <th className="text-center py-3 px-2">W</th>
                <th className="text-center py-3 px-2">L</th>
                <th className="text-center py-3 px-2">T</th>
                <th className="text-center py-3 px-2">NPW</th>
                <th className="text-center py-3 px-2">Picks</th>
                <th className="text-center py-3 px-2">%</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry, index) => (
                <tr key={entry.userId} className="border-b hover-elevate" data-testid={`row-standing-${entry.userId}`}>
                  <td className="py-3 px-2">
                    {index === 0 && <Trophy className="w-4 h-4 text-yellow-500 inline mr-1" />}
                    {index + 1}
                  </td>
                  <td className="py-3 px-2 font-medium">{entry.username}</td>
                  <td className="text-center py-3 px-2 text-green-600 dark:text-green-400">{entry.wins}</td>
                  <td className="text-center py-3 px-2 text-red-600 dark:text-red-400">{entry.losses}</td>
                  <td className="text-center py-3 px-2 text-muted-foreground">{entry.draws}</td>
                  <td className="text-center py-3 px-2">
                    <Badge variant={entry.totalNpw > 0 ? "default" : entry.totalNpw < 0 ? "destructive" : "secondary"}>
                      {entry.totalNpw > 0 ? '+' : ''}{entry.totalNpw}
                    </Badge>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className="flex items-center justify-center gap-1">
                      <Target className="w-3 h-3" />
                      {entry.correctPicks}/{entry.totalPicks}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className="flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {entry.pickPercentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

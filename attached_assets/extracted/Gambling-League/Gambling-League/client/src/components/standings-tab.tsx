import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, TrendingUp, Target } from "lucide-react";
import type { User } from "@shared/schema";

interface StandingsTabProps {
  leagueId: string;
}

interface StandingEntry {
  userId: string;
  user: User;
  wins: number;
  draws: number;
  losses: number;
  totalNPW: number;
  totalPicks: number;
  correctPicks: number;
  pickWinPercentage: number;
  rank: number;
}

export function StandingsTab({ leagueId }: StandingsTabProps) {
  const { user } = useAuth();
  const [viewType, setViewType] = useState<'cumulative' | 'weekly'>('cumulative');
  const [selectedWeek, setSelectedWeek] = useState<string>('1');
  const [season, setSeason] = useState<string>('all');
  const [playoffRound, setPlayoffRound] = useState<string>(''); // Empty = all rounds
  
  const { data: standings = [], isLoading } = useQuery<StandingEntry[]>({
    queryKey: ["/api/leagues", leagueId, "standings", viewType, selectedWeek, season, playoffRound],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (viewType === 'weekly') {
        params.append('week', selectedWeek);
        params.append('viewType', 'weekly');
      } else if (season === 'playoffs') {
        // Always send season=playoffs when playoffs is selected
        params.append('season', 'playoffs');
        // If a specific round is selected (not empty), also send playoffRound
        if (playoffRound && playoffRound !== '') {
          params.append('playoffRound', playoffRound);
        }
      } else if (season !== 'all') {
        params.append('season', season);
      }
      const url = `/api/leagues/${leagueId}/standings${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center text-muted-foreground">Loading standings...</div>
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
            Standings will appear once games have been played
          </p>
        </CardContent>
      </Card>
    );
  }

  // Generate week options (1-17 for regular season, 18+ for playoffs)
  const weekOptions = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* View Type Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">View:</span>
              <div className="flex gap-1">
                <Button
                  variant={viewType === 'cumulative' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewType('cumulative')}
                  data-testid="button-view-cumulative"
                >
                  Cumulative
                </Button>
                <Button
                  variant={viewType === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewType('weekly')}
                  data-testid="button-view-weekly"
                >
                  Weekly
                </Button>
              </div>
            </div>

            {/* Week Selector (only for weekly view) */}
            {viewType === 'weekly' && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Week:</span>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-[100px]" data-testid="select-week">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekOptions.map(week => (
                      <SelectItem key={week} value={week.toString()}>
                        Week {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Season Filter (only for cumulative view) */}
            {viewType === 'cumulative' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Season:</span>
                  <Select value={season} onValueChange={setSeason}>
                    <SelectTrigger className="w-[160px]" data-testid="select-season">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="regular">Regular Season</SelectItem>
                      <SelectItem value="playoffs">Playoffs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Playoff Round Filter (only when playoffs selected) */}
                {season === 'playoffs' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Round:</span>
                    <Select value={playoffRound} onValueChange={setPlayoffRound}>
                      <SelectTrigger className="w-[140px]" data-testid="select-playoff-round">
                        <SelectValue placeholder="All Rounds" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Rounds</SelectItem>
                        <SelectItem value="1">Round 1</SelectItem>
                        <SelectItem value="2">Round 2</SelectItem>
                        <SelectItem value="3">Championship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Podium */}
      <div className="grid md:grid-cols-3 gap-6">
        {standings.slice(0, 3).map((entry, index) => (
          <Card
            key={entry.userId}
            className={`${entry.userId === user?.id ? 'border-l-4 border-l-accent' : ''} ${
              index === 0 ? 'md:order-2' : index === 1 ? 'md:order-1' : 'md:order-3'
            }`}
            data-testid={`podium-${entry.rank}`}
          >
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-2">
                {index === 0 && <Trophy className="w-8 h-8 text-accent" />}
                {index === 1 && <Trophy className="w-7 h-7 text-muted-foreground" />}
                {index === 2 && <Trophy className="w-6 h-6 text-muted-foreground" />}
              </div>
              <CardTitle className="text-lg">
                {entry.user.firstName || entry.user.email}
                {entry.userId === user?.id && (
                  <Badge variant="outline" className="ml-2">You</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-center">
              <div>
                <div className="text-3xl font-bold">#{entry.rank}</div>
                <div className="text-sm text-muted-foreground">Rank</div>
              </div>
              <div className="flex justify-around pt-2 border-t">
                <div>
                  <div className="text-lg font-semibold text-chart-4">{entry.wins}</div>
                  <div className="text-xs text-muted-foreground">W</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-muted-foreground">{entry.draws}</div>
                  <div className="text-xs text-muted-foreground">D</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-destructive">{entry.losses}</div>
                  <div className="text-xs text-muted-foreground">L</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Standings Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewType === 'weekly' ? `Week ${selectedWeek} Leaderboard` : 
             season === 'regular' ? 'Regular Season Standings' :
             season === 'playoffs' && playoffRound && playoffRound !== '' ? `Playoff Round ${playoffRound} Standings` :
             season === 'playoffs' ? 'Playoff Standings' :
             'Full Standings'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="table-standings">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-semibold text-sm">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Player</th>
                  <th className="text-center py-3 px-3 font-semibold text-sm">W</th>
                  <th className="text-center py-3 px-3 font-semibold text-sm">D</th>
                  <th className="text-center py-3 px-3 font-semibold text-sm">L</th>
                  <th className="text-center py-3 px-3 font-semibold text-sm">NPW</th>
                  <th className="text-center py-3 px-3 font-semibold text-sm">Pick %</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={`border-b hover-elevate ${
                      entry.userId === user?.id ? 'bg-accent/5 border-l-4 border-l-accent' : ''
                    }`}
                    data-testid={`row-standing-${entry.userId}`}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center font-semibold ${
                          entry.rank <= 3 ? 'bg-accent/20 text-accent' : 'bg-muted'
                        }`}>
                          {entry.rank}
                        </div>
                        {entry.rank <= standings.length / 2 && (
                          <TrendingUp className="w-4 h-4 text-chart-4" title="Playoff Position" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {entry.user.profileImageUrl ? (
                          <img
                            src={entry.user.profileImageUrl}
                            alt={entry.user.firstName || 'User'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {(entry.user.firstName?.[0] || entry.user.email?.[0] || 'U').toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">
                          {entry.user.firstName || entry.user.email}
                          {entry.userId === user?.id && <span className="text-muted-foreground ml-1">(You)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-3 text-chart-4 font-semibold">{entry.wins}</td>
                    <td className="text-center py-3 px-3 text-muted-foreground">{entry.draws}</td>
                    <td className="text-center py-3 px-3 text-destructive font-semibold">{entry.losses}</td>
                    <td className="text-center py-3 px-3 font-semibold">{entry.totalNPW}</td>
                    <td className="text-center py-3 px-3">{entry.pickWinPercentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>NPW = Net Positive Wins (Correct Picks - Incorrect Picks per week)</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-chart-4" />
                <span>Top {Math.ceil(standings.length / 2)} advance to playoffs</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

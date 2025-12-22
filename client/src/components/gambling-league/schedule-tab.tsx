import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import type { GamblingLeagueGame } from "@shared/schema";

interface ScheduleTabProps {
  currentWeek: number;
}

export function ScheduleTab({ currentWeek }: ScheduleTabProps) {
  const { data: games = [], isLoading } = useQuery<GamblingLeagueGame[]>({
    queryKey: ["/api/gambling-league/games", { week: currentWeek }],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/games?week=${currentWeek}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Loading schedule...
        </CardContent>
      </Card>
    );
  }

  if (games.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Games Scheduled</h3>
          <p className="text-muted-foreground">
            Games for Week {currentWeek} haven't been added yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const groupedByDate = games.reduce((acc, game) => {
    const date = new Date(game.gameTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(game);
    return acc;
  }, {} as Record<string, GamblingLeagueGame[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Week {currentWeek} Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedByDate).map(([date, dateGames]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{date}</h3>
              <div className="space-y-3">
                {dateGames.map((game) => (
                  <div key={game.id} className="flex items-center justify-between gap-4 p-3 rounded-md border hover-elevate" data-testid={`card-schedule-${game.id}`}>
                    <div className="flex-1">
                      <div className="font-medium">{game.awayTeam} @ {game.homeTeam}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
                        <Clock className="w-3 h-3" />
                        {new Date(game.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        <span>|</span>
                        <span>Spread: {game.homeTeam} {parseFloat(game.spread) > 0 ? '+' : ''}{game.spread}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {game.isComplete ? (
                        <Badge variant="secondary">
                          {game.awayScore} - {game.homeScore}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Upcoming</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

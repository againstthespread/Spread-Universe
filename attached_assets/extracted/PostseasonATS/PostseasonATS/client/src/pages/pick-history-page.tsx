import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ROUND_NAMES, type PickHistoryItem } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle, History } from "lucide-react";
import { format } from "date-fns";

export default function PickHistoryPage() {
  const [selectedRound, setSelectedRound] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");

  const { data: pickHistory, isLoading } = useQuery<PickHistoryItem[]>({
    queryKey: ["/api/pick-history"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pickHistory || pickHistory.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="mb-2">Pick History</h1>
          <p className="text-muted-foreground">
            View all submitted picks for completed games
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No completed games yet</p>
            <p className="text-sm text-muted-foreground">
              Pick history will appear here once games are completed
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get unique users for filter
  const users = Array.from(
    new Map(
      pickHistory.map(pick => [
        pick.userId,
        { id: pick.userId, name: pick.displayName || pick.username }
      ])
    ).values()
  );

  // Filter picks based on selections
  let filteredPicks = pickHistory;
  if (selectedRound !== "all") {
    filteredPicks = filteredPicks.filter(pick => pick.round === selectedRound);
  }
  if (selectedUser !== "all") {
    filteredPicks = filteredPicks.filter(pick => pick.userId === selectedUser);
  }

  // Group by game
  const picksByGame = filteredPicks.reduce((acc, pick) => {
    const key = pick.gameId;
    if (!acc[key]) {
      acc[key] = {
        game: pick,
        picks: []
      };
    }
    acc[key].picks.push(pick);
    return acc;
  }, {} as Record<string, { game: PickHistoryItem; picks: PickHistoryItem[] }>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2">Pick History</h1>
        <p className="text-muted-foreground">
          View all submitted picks for completed games
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Select value={selectedRound} onValueChange={setSelectedRound}>
            <SelectTrigger data-testid="select-filter-round">
              <SelectValue placeholder="Filter by round" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rounds</SelectItem>
              <SelectItem value="WILD_CARD">Wild Card</SelectItem>
              <SelectItem value="DIVISIONAL">Divisional</SelectItem>
              <SelectItem value="CONFERENCE">Conference</SelectItem>
              <SelectItem value="SUPER_BOWL">Super Bowl</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger data-testid="select-filter-user">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {Object.entries(picksByGame).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium">No picks found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(picksByGame).map(([gameId, { game, picks }]) => (
            <Card key={gameId} data-testid={`history-game-${gameId}`}>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {ROUND_NAMES[game.round]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(game.gameDate), "EEE, MMM d 'at' h:mm a")}
                      </span>
                    </div>
                    <CardTitle className="text-xl">
                      {game.awayTeam} @ {game.homeTeam}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Final: {game.awayTeam} {game.awayScore} - {game.homeScore} {game.homeTeam}
                      {' • '}Covered: {game.winner}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {picks.map((pick) => (
                    <div
                      key={pick.pickId}
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        pick.isCorrect === true
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                          : pick.isCorrect === false
                          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                          : "bg-muted border-border"
                      }`}
                      data-testid={`pick-${pick.pickId}`}
                    >
                      <div className="flex items-center gap-3">
                        {pick.isCorrect === true ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                        ) : pick.isCorrect === false ? (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
                        ) : (
                          <History className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium">
                            {pick.displayName || pick.username}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Picked: {pick.selectedTeam}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          pick.isCorrect === true
                            ? "text-green-600 dark:text-green-500"
                            : pick.isCorrect === false
                            ? "text-red-600 dark:text-red-500"
                            : "text-muted-foreground"
                        }`}>
                          {pick.isCorrect === true ? `+${pick.pointsEarned}` : "0"} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

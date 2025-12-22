import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Trophy, CheckCircle, XCircle, Circle, Minus, Lock } from "lucide-react";
import type { User, WeeklyMatchup, League, Game, Pick } from "@shared/schema";

interface ScheduleTabProps {
  leagueId: string;
}

interface MatchupWithUsers extends WeeklyMatchup {
  user1: User;
  user2?: User;
  winner?: User;
}

interface GameDetail {
  game: Game;
  user1Pick: Pick | null;
  user2Pick: Pick | null;
}

interface MatchupDetails {
  matchup: {
    id: string;
    week: number;
    user1Id: string;
    user2Id: string | null;
    user1Npw: number;
    user2Npw: number | null;
    winnerId: string | null;
    isComplete: boolean;
    user1: User;
    user2: User | null;
  };
  gameDetails: GameDetail[];
}

export function ScheduleTab({ leagueId }: ScheduleTabProps) {
  const { user } = useAuth();

  // Fetch league to get current week
  const { data: league } = useQuery<League>({
    queryKey: ["/api/leagues", leagueId],
    queryFn: async () => {
      const res = await fetch(`/api/leagues/${leagueId}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const [selectedWeek, setSelectedWeek] = useState<string>(league?.currentWeek?.toString() || '1');

  const { data: matchups = [], isLoading } = useQuery<MatchupWithUsers[]>({
    queryKey: ["/api/leagues", leagueId, "matchups"],
    queryFn: async () => {
      const res = await fetch(`/api/leagues/${leagueId}/matchups`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  // Fetch games for the selected week to check if picks should be revealed
  const { data: weekGames = [] } = useQuery<Game[]>({
    queryKey: ["/api/weeks", parseInt(selectedWeek), "games", leagueId],
    queryFn: async () => {
      const res = await fetch(`/api/weeks/${selectedWeek}/games/${leagueId}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  // Check if picks should be revealed (first game has started)
  const picksRevealed = useMemo(() => {
    if (weekGames.length === 0) return false;
    
    // Find the earliest game time
    const firstGame = weekGames.reduce((earliest, game) => {
      if (!earliest || new Date(game.gameTime) < new Date(earliest.gameTime)) {
        return game;
      }
      return earliest;
    });
    
    const now = new Date();
    return now >= new Date(firstGame.gameTime);
  }, [weekGames]);

  // Helper functions for displaying picks
  const getPickIcon = (pick: Pick | null, game: Game) => {
    if (!pick) return <Circle className="w-4 h-4 text-muted-foreground" />;
    if (!game.isComplete) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (pick.isPush) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (pick.isCorrect === true) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (pick.isCorrect === false) return <XCircle className="w-4 h-4 text-red-600" />;
    return <Circle className="w-4 h-4 text-muted-foreground" />;
  };

  const getPickBadge = (pick: Pick | null, game: Game) => {
    if (!pick) return <Badge variant="outline">No Pick</Badge>;
    
    const team = pick.pickedTeam === 'home' ? game.homeTeam : game.awayTeam;
    const variant = !game.isComplete 
      ? "secondary" 
      : pick.isPush
        ? "secondary"
        : pick.isCorrect === true 
          ? "default" 
          : pick.isCorrect === false 
            ? "destructive" 
            : "outline";
    
    return <Badge variant={variant} className={pick.isPush ? "bg-muted" : ""}>{team}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center text-muted-foreground">Loading schedule...</div>
        </CardContent>
      </Card>
    );
  }

  if (matchups.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Schedule Yet</h3>
          <p className="text-muted-foreground">
            The schedule will be generated when the league is full
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get all unique weeks for the dropdown
  const availableWeeks = Array.from(new Set(matchups.map(m => m.week))).sort((a, b) => a - b);
  
  // Filter matchups for selected week
  const weekMatchups = matchups.filter(m => m.week === parseInt(selectedWeek));

  // Component to display individual matchup with details
  function MatchupCard({ matchup, picksRevealed }: { matchup: MatchupWithUsers; picksRevealed: boolean }) {
    const { data: details, isLoading: detailsLoading } = useQuery<MatchupDetails>({
      queryKey: ["/api/matchups", matchup.id, "details"],
      queryFn: async () => {
        const res = await fetch(`/api/matchups/${matchup.id}/details`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      },
      // Only fetch matchup details when picks are revealed
      enabled: picksRevealed,
    });

    const isUserInMatchup = matchup.user1Id === user?.id || matchup.user2Id === user?.id;

    return (
      <div
        className={`p-4 rounded-md border ${
          isUserInMatchup ? 'border-l-4 border-l-accent bg-accent/5' : ''
        }`}
        data-testid={`matchup-${matchup.id}`}
      >
        {/* Matchup Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1">
            {matchup.user1.profileImageUrl && (
              <img
                src={matchup.user1.profileImageUrl}
                alt={matchup.user1.firstName || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <div className="font-semibold">
                {matchup.user1.firstName || matchup.user1.email}
                {matchup.user1Id === user?.id && (
                  <span className="text-muted-foreground ml-1">(You)</span>
                )}
              </div>
              {matchup.isComplete && (
                <div className="text-sm text-muted-foreground">
                  NPW: {matchup.user1Npw}
                </div>
              )}
            </div>
          </div>

          <div className="text-2xl font-bold text-muted-foreground">VS</div>

          {matchup.user2 ? (
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="text-right">
                <div className="font-semibold">
                  {matchup.user2.firstName || matchup.user2.email}
                  {matchup.user2Id === user?.id && (
                    <span className="text-muted-foreground ml-1">(You)</span>
                  )}
                </div>
                {matchup.isComplete && (
                  <div className="text-sm text-muted-foreground">
                    NPW: {matchup.user2Npw}
                  </div>
                )}
              </div>
              {matchup.user2.profileImageUrl && (
                <img
                  src={matchup.user2.profileImageUrl}
                  alt={matchup.user2.firstName || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
            </div>
          ) : (
            <div className="flex-1 text-right">
              <Badge variant="outline">BYE WEEK</Badge>
            </div>
          )}
        </div>

        {/* Winner Display */}
        <div className="mb-4 pb-3 border-b">
          {matchup.isComplete ? (
            <div className="flex items-center justify-center gap-2">
              {matchup.winnerId ? (
                <>
                  <Trophy className="w-4 h-4 text-accent" />
                  <span className="font-semibold">
                    Winner: {matchup.winner?.firstName || matchup.winner?.email}
                  </span>
                </>
              ) : (
                <Badge variant="secondary">Draw</Badge>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              In Progress
            </div>
          )}
        </div>

        {/* Game-by-Game Details */}
        {detailsLoading ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            Loading picks...
          </div>
        ) : !picksRevealed ? (
          <div className="text-center py-6">
            <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm font-medium text-muted-foreground">
              Picks Hidden Until First Game Starts
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Pick details will be revealed when the week's games begin
            </div>
          </div>
        ) : details && details.gameDetails.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold mb-2">Game-by-Game Picks:</div>
            {(() => {
              const gamesWithPicks = details.gameDetails.filter(
                (gameDetail) => gameDetail.user1Pick !== null || gameDetail.user2Pick !== null
              );
              
              if (gamesWithPicks.length === 0) {
                return (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    No picks submitted for any games yet
                  </div>
                );
              }
              
              return gamesWithPicks.map((gameDetail) => {
                const { game, user1Pick, user2Pick } = gameDetail;
                const user1Name = details.matchup.user1.firstName || details.matchup.user1.email;
                const user2Name = details.matchup.user2?.firstName || details.matchup.user2?.email || "BYE";

                const spreadNum = parseFloat(game.spread);
                const getSpreadDisplay = () => {
                  if (!game.spread || isNaN(spreadNum)) {
                    return "(Pick'em)";
                  }
                  if (spreadNum === 0) {
                    return "(Pick'em)";
                  }
                  const favoredTeam = spreadNum > 0 ? game.homeTeam : game.awayTeam;
                  const spreadValue = Math.abs(spreadNum);
                  return `(${favoredTeam} -${spreadValue})`;
                };
                
                return (
                  <div key={game.id} className="p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">
                        {game.awayTeam} @ {game.homeTeam}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {getSpreadDisplay()}
                        </span>
                      </div>
                      {game.isComplete && (
                        <div className="text-xs text-muted-foreground">
                          Final: {game.awayScore} - {game.homeScore}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        {getPickIcon(user1Pick, game)}
                        <span className="text-xs text-muted-foreground">{user1Name}:</span>
                        {getPickBadge(user1Pick, game)}
                      </div>
                      {details.matchup.user2 && (
                        <div className="flex items-center gap-2">
                          {getPickIcon(user2Pick, game)}
                          <span className="text-xs text-muted-foreground">{user2Name}:</span>
                          {getPickBadge(user2Pick, game)}
                        </div>
                      )}
                    </div>
                    
                    {user1Pick?.note && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">{user1Name}'s note:</span> {user1Pick.note}
                      </div>
                    )}
                    {user2Pick?.note && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">{user2Name}'s note:</span> {user2Pick.note}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            No games available for this week yet
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Week:</span>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-[140px]" data-testid="select-week">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableWeeks.map(week => (
                  <SelectItem key={week} value={week.toString()}>
                    Week {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Week {selectedWeek} Matchups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weekMatchups.map((matchup) => (
              <MatchupCard key={matchup.id} matchup={matchup} picksRevealed={picksRevealed} />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

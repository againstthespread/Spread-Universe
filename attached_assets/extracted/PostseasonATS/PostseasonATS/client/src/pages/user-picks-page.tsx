import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Game, Pick, ROUND_POINTS, ROUND_NAMES } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

type GameWithPick = Game & { userPick?: Pick };

export default function UserPicksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPicks, setSelectedPicks] = useState<Record<string, string>>({});

  const { data: games, isLoading } = useQuery<GameWithPick[]>({
    queryKey: ["/api/games/with-picks"],
  });

  const submitPickMutation = useMutation({
    mutationFn: async (pick: { gameId: string; selectedTeam: string }) => {
      const res = await apiRequest("POST", "/api/picks", pick);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games/with-picks"] });
      toast({
        title: "Pick submitted",
        description: "Your pick has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit pick",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePickChange = (gameId: string, team: string) => {
    setSelectedPicks(prev => ({ ...prev, [gameId]: team }));
  };

  const handleSubmitPick = (gameId: string) => {
    const selectedTeam = selectedPicks[gameId];
    if (selectedTeam) {
      submitPickMutation.mutate({ gameId, selectedTeam });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const gamesByRound = games?.reduce((acc, game) => {
    if (!acc[game.round]) {
      acc[game.round] = [];
    }
    acc[game.round].push(game);
    return acc;
  }, {} as Record<string, GameWithPick[]>) || {};

  const rounds = ["WILD_CARD", "DIVISIONAL", "CONFERENCE", "SUPER_BOWL"] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2">Make Your Picks</h1>
        <p className="text-muted-foreground">
          Select your picks for each matchup. Points increase each round!
        </p>
      </div>

      {rounds.map((round) => {
        const roundGames = gamesByRound[round] || [];
        if (roundGames.length === 0) return null;

        return (
          <div key={round} className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="font-display">{ROUND_NAMES[round]}</h2>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {ROUND_POINTS[round]} PTS
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roundGames.map((game) => {
                const deadline = game.pickDeadline || game.gameDate;
                const isPastCutoff = new Date(deadline) < new Date();
                const hasExistingPick = !!game.userPick;
                const currentSelection = selectedPicks[game.id] || game.userPick?.selectedTeam;

                return (
                  <Card key={game.id} className={game.isComplete ? "border-2" : ""}>
                    <CardHeader className="space-y-2 pb-4">
                      <div className="flex items-center justify-between gap-2">
                        <CardDescription className="text-xs">
                          {format(new Date(game.gameDate), "EEE, MMM d 'at' h:mm a")}
                        </CardDescription>
                        {isPastCutoff && (
                          <Badge variant="outline" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Locked
                          </Badge>
                        )}
                      </div>
                      {game.pickDeadline && !isPastCutoff && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            Deadline: {format(new Date(game.pickDeadline), "MMM d 'at' h:mm a")}
                          </span>
                        </div>
                      )}
                      {game.isComplete && game.userPick && (
                        <div className="flex items-center gap-2">
                          {game.userPick.isCorrect ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-600">
                                Correct! +{game.userPick.pointsEarned} pts
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-600">
                                Incorrect
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <RadioGroup
                          value={currentSelection}
                          onValueChange={(value) => handlePickChange(game.id, value)}
                          disabled={isPastCutoff}
                        >
                          {/* Away Team */}
                          <div className={`flex items-center justify-between p-3 rounded-md border-2 transition-all ${
                            currentSelection === game.awayTeam 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover-elevate"
                          } ${isPastCutoff ? "opacity-60" : "cursor-pointer"}`}>
                            <div className="flex items-center gap-3 flex-1">
                              <RadioGroupItem 
                                value={game.awayTeam} 
                                id={`${game.id}-away`}
                                data-testid={`pick-${game.id}-${game.awayTeam}`}
                              />
                              <Label 
                                htmlFor={`${game.id}-away`} 
                                className="font-medium text-base cursor-pointer flex-1"
                              >
                                {game.awayTeam}
                              </Label>
                            </div>
                            {game.favoredTeam === "AWAY" && (
                              <Badge variant="secondary" className="ml-2">
                                {Number(game.spread) > 0 ? '+' : ''}{game.spread}
                              </Badge>
                            )}
                          </div>

                          {/* Home Team */}
                          <div className={`flex items-center justify-between p-3 rounded-md border-2 transition-all ${
                            currentSelection === game.homeTeam 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover-elevate"
                          } ${isPastCutoff ? "opacity-60" : "cursor-pointer"}`}>
                            <div className="flex items-center gap-3 flex-1">
                              <RadioGroupItem 
                                value={game.homeTeam} 
                                id={`${game.id}-home`}
                                data-testid={`pick-${game.id}-${game.homeTeam}`}
                              />
                              <Label 
                                htmlFor={`${game.id}-home`} 
                                className="font-medium text-base cursor-pointer flex-1"
                              >
                                {game.homeTeam}
                              </Label>
                            </div>
                            {game.favoredTeam === "HOME" && (
                              <Badge variant="secondary" className="ml-2">
                                {Number(game.spread) > 0 ? '+' : ''}{game.spread}
                              </Badge>
                            )}
                          </div>
                        </RadioGroup>

                        {game.isComplete && (
                          <div className="text-sm text-center p-2 bg-muted rounded-md">
                            Final: {game.awayTeam} {game.awayScore} - {game.homeTeam} {game.homeScore}
                          </div>
                        )}
                      </div>

                      {!isPastCutoff && currentSelection && currentSelection !== game.userPick?.selectedTeam && (
                        <Button
                          onClick={() => handleSubmitPick(game.id)}
                          disabled={submitPickMutation.isPending}
                          className="w-full"
                          data-testid={`button-submit-pick-${game.id}`}
                        >
                          {submitPickMutation.isPending ? "Saving..." : hasExistingPick ? "Update Pick" : "Submit Pick"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {games?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No games available yet</p>
            <p className="text-sm text-muted-foreground">
              Check back when games are added for the current playoff round.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

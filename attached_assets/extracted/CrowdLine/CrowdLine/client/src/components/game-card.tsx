import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TrendingUp, TrendingDown, Minus, Check } from "lucide-react";
import { format } from "date-fns";
import { formatInEastern } from "@/lib/timezone";
import type { GameWithStats } from "@shared/schema";

interface GameCardProps {
  game: GameWithStats;
}

export function GameCard({ game }: GameCardProps) {
  const [homeScore, setHomeScore] = useState(game.userPrediction?.homeScore?.toString() || "");
  const [awayScore, setAwayScore] = useState(game.userPrediction?.awayScore?.toString() || "");
  const { toast } = useToast();

  const submitPredictionMutation = useMutation({
    mutationFn: async (data: { gameId: string; homeScore: number; awayScore: number }) => {
      return await apiRequest("POST", "/api/predictions", data);
    },
    onSuccess: () => {
      toast({
        title: "Prediction submitted",
        description: "Your prediction has been recorded",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const home = parseInt(homeScore);
    const away = parseInt(awayScore);

    if (isNaN(home) || isNaN(away)) {
      toast({
        title: "Invalid input",
        description: "Please enter valid scores",
        variant: "destructive",
      });
      return;
    }

    submitPredictionMutation.mutate({
      gameId: game.id,
      homeScore: home,
      awayScore: away,
    });
  };

  const userOverUnder = homeScore && awayScore ? parseInt(homeScore) + parseInt(awayScore) : null;
  const userSpread = homeScore && awayScore ? parseInt(homeScore) - parseInt(awayScore) : null;

  return (
    <Card className="hover-elevate transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="text-sm text-muted-foreground">
            {formatInEastern(game.gameDate, "EEE, MMM d 'at' h:mm a")} ET
          </div>
          <div className="flex gap-2">
            {game.isLocked && (
              <Badge variant="destructive" data-testid={`badge-locked-${game.id}`}>
                Locked
              </Badge>
            )}
            {game.userPrediction && (
              <Badge variant="secondary" className="gap-1" data-testid={`badge-predicted-${game.id}`}>
                <Check className="h-3 w-3" />
                Predicted
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium mb-1 text-muted-foreground">Away</div>
                <div className="font-bold text-lg">{game.awayTeam}</div>
              </div>
              <Input
                type="number"
                min="0"
                max="99"
                placeholder="0"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-20 h-16 text-center text-2xl font-bold"
                data-testid={`input-away-score-${game.id}`}
                disabled={game.isLocked}
              />
            </div>

            <div className="flex items-center justify-center">
              <div className="text-xs font-semibold text-muted-foreground tracking-wider px-3 py-1 bg-muted rounded-full">
                VS
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium mb-1 text-muted-foreground">Home</div>
                <div className="font-bold text-lg">{game.homeTeam}</div>
              </div>
              <Input
                type="number"
                min="0"
                max="99"
                placeholder="0"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-20 h-16 text-center text-2xl font-bold"
                data-testid={`input-home-score-${game.id}`}
                disabled={game.isLocked}
              />
            </div>
          </div>

          {userOverUnder !== null && userSpread !== null && (
            <div className="pt-2 border-t space-y-1">
              <div className="text-xs text-muted-foreground mb-2">Your Prediction</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted px-3 py-2 rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">O/U</div>
                  <div className="font-bold">{userOverUnder}</div>
                </div>
                <div className="bg-muted px-3 py-2 rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">Spread</div>
                  <div className="font-bold">
                    {userSpread > 0 ? `${game.homeTeam.split(' ').pop()} -${userSpread}` : 
                     userSpread < 0 ? `${game.awayTeam.split(' ').pop()} -${Math.abs(userSpread)}` : 
                     'Even'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={game.isLocked || submitPredictionMutation.isPending || !homeScore || !awayScore}
            data-testid={`button-submit-prediction-${game.id}`}
          >
            {game.isLocked ? "Predictions Locked" :
             submitPredictionMutation.isPending ? "Submitting..." : 
             game.userPrediction ? "Update Prediction" : "Submit Prediction"}
          </Button>
        </form>
      </CardContent>

      {game.status === "completed" && game.actualHomeScore !== null && game.actualAwayScore !== null ? (
        <CardFooter className="pt-0 pb-4 border-t mt-4">
          <div className="w-full space-y-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">FINAL SCORE</div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">{game.awayTeam.split(' ').pop()}</div>
                <div className="text-3xl font-bold">{game.actualAwayScore}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">{game.homeTeam.split(' ').pop()}</div>
                <div className="text-3xl font-bold">{game.actualHomeScore}</div>
              </div>
            </div>
            
            {game.predictionCount > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs font-semibold text-muted-foreground mb-2">COMPARISON</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Actual O/U</div>
                    <div className="font-bold">{game.actualHomeScore + game.actualAwayScore}</div>
                    <div className="text-xs text-muted-foreground">Crowd O/U</div>
                    <div className="font-bold">{game.averageOverUnder?.toFixed(1) || 'N/A'}</div>
                    {game.vegasOverUnder != null && (
                      <>
                        <div className="text-xs text-muted-foreground">Vegas O/U</div>
                        <div className="font-bold">{typeof game.vegasOverUnder === 'string' ? parseFloat(game.vegasOverUnder).toFixed(1) : game.vegasOverUnder.toFixed(1)}</div>
                      </>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Actual Spread</div>
                    <div className="font-bold">
                      {game.actualHomeScore - game.actualAwayScore > 0 
                        ? `${game.homeTeam.split(' ').pop()} -${game.actualHomeScore - game.actualAwayScore}`
                        : game.actualHomeScore - game.actualAwayScore < 0
                        ? `${game.awayTeam.split(' ').pop()} -${Math.abs(game.actualHomeScore - game.actualAwayScore)}`
                        : 'Even'}
                    </div>
                    <div className="text-xs text-muted-foreground">Crowd Spread</div>
                    <div className="font-bold">
                      {game.averageSpread !== null && game.favoredTeam
                        ? `${game.favoredTeam} -${Math.abs(game.averageSpread).toFixed(1)}`
                        : 'Even'}
                    </div>
                    {game.vegasSpread != null && (
                      <>
                        <div className="text-xs text-muted-foreground">Vegas Spread</div>
                        <div className="font-bold">{typeof game.vegasSpread === 'string' ? parseFloat(game.vegasSpread).toFixed(1) : game.vegasSpread.toFixed(1)}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardFooter>
      ) : game.predictionCount > 0 ? (
        <CardFooter className="pt-0 pb-4 border-t mt-4">
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Crowd Predictions</span>
              <span>{game.predictionCount} {game.predictionCount === 1 ? 'pick' : 'picks'}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  Avg O/U
                </div>
                <div className="text-lg font-bold" data-testid={`text-avg-ou-${game.id}`}>
                  {game.averageOverUnder?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {game.averageSpread && game.averageSpread > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : game.averageSpread && game.averageSpread < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  Avg Spread
                </div>
                <div className="text-lg font-bold" data-testid={`text-avg-spread-${game.id}`}>
                  {game.averageSpread !== null && game.favoredTeam
                    ? `${game.favoredTeam} -${Math.abs(game.averageSpread).toFixed(1)}`
                    : game.averageSpread === 0
                    ? 'Even'
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </CardFooter>
      ) : null}
    </Card>
  );
}

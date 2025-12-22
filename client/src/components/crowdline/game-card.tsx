import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Check, Users } from "lucide-react";
import { formatInEastern, hasGameStarted } from "@/lib/timezone";
import type { CrowdlineGameWithStats } from "@shared/schema";

interface GameCardProps {
  game: CrowdlineGameWithStats;
}

export function GameCard({ game }: GameCardProps) {
  const [homeScore, setHomeScore] = useState(game.userPrediction?.homeScore?.toString() || "");
  const [awayScore, setAwayScore] = useState(game.userPrediction?.awayScore?.toString() || "");
  const { toast } = useToast();

  const submitPredictionMutation = useMutation({
    mutationFn: async (data: { gameId: string; homeScore: number; awayScore: number }) => {
      return await apiRequest("POST", "/api/crowdline/predictions", data);
    },
    onSuccess: () => {
      toast({
        title: "Prediction submitted",
        description: "Your prediction has been recorded",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crowdline/games"] });
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

  const gameStarted = hasGameStarted(String(game.gameDate));
  const isCompleted = game.status === "final";

  return (
    <Card className="hover-elevate transition-shadow" data-testid={`card-game-${game.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="text-sm text-muted-foreground">
            {formatInEastern(game.gameDate, "EEE, MMM d 'at' h:mm a")} ET
          </div>
          {isCompleted ? (
            <Badge variant="secondary">Final</Badge>
          ) : gameStarted ? (
            <Badge variant="outline">In Progress</Badge>
          ) : game.userPrediction ? (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <Check className="h-3 w-3 mr-1" />
              Predicted
            </Badge>
          ) : (
            <Badge variant="outline">Open</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{game.homeTeam}</span>
            {isCompleted && game.actualHomeScore !== null ? (
              <span className="font-bold text-lg">{game.actualHomeScore}</span>
            ) : (
              <Input
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                placeholder="0"
                className="w-16 text-center"
                disabled={gameStarted}
                data-testid={`input-home-score-${game.id}`}
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{game.awayTeam}</span>
            {isCompleted && game.actualAwayScore !== null ? (
              <span className="font-bold text-lg">{game.actualAwayScore}</span>
            ) : (
              <Input
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                placeholder="0"
                className="w-16 text-center"
                disabled={gameStarted}
                data-testid={`input-away-score-${game.id}`}
              />
            )}
          </div>
          {!gameStarted && (
            <Button
              type="submit"
              className="w-full"
              disabled={submitPredictionMutation.isPending}
              data-testid={`button-submit-prediction-${game.id}`}
            >
              {submitPredictionMutation.isPending ? "Submitting..." : game.userPrediction ? "Update Prediction" : "Submit Prediction"}
            </Button>
          )}
        </form>

        {game.totalPredictions > 0 && (
          <div className="pt-3 border-t text-sm text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              {game.totalPredictions} prediction{game.totalPredictions !== 1 ? "s" : ""} 
              {" "}(avg: {game.avgHomeScore} - {game.avgAwayScore})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

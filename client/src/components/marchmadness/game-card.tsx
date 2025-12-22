import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatInEastern } from "@/lib/timezone";
import { Check, Clock, Trophy } from "lucide-react";
import type { MarchmadnessGameWithTeams } from "@shared/schema";

interface GameCardProps {
  game: MarchmadnessGameWithTeams;
}

export function GameCard({ game }: GameCardProps) {
  const { toast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    game.userPick?.pickedTeamId || null
  );

  const gameStarted = new Date() >= new Date(game.startTime);
  const isCompleted = game.status === "final";

  const pickMutation = useMutation({
    mutationFn: async (pickedTeamId: string) => {
      return await apiRequest("POST", "/api/marchmadness/picks", {
        gameId: game.id,
        pickedTeamId,
      });
    },
    onSuccess: () => {
      toast({ title: "Pick submitted" });
      queryClient.invalidateQueries({ queryKey: ["/api/marchmadness/games"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSelectedTeamId(game.userPick?.pickedTeamId || null);
    },
  });

  const handlePick = (teamId: string) => {
    if (gameStarted || isCompleted) return;
    setSelectedTeamId(teamId);
    pickMutation.mutate(teamId);
  };

  const getTeamDisplay = (team: typeof game.homeTeam, isHome: boolean) => {
    const isSelected = selectedTeamId === team.id;
    const isWinner = game.winningTeamId === team.id;
    const isPickCorrect = game.userPick?.pickedTeamId === team.id && game.userPick?.isCorrect;
    const isPickWrong = game.userPick?.pickedTeamId === team.id && game.userPick?.isCorrect === false;
    const score = isHome ? game.homeScore : game.awayScore;

    return (
      <Button
        variant={isSelected ? "default" : "outline"}
        className={`w-full justify-between h-auto py-3 px-4 ${isPickCorrect ? "border-green-500 bg-green-500/10" : ""} ${isPickWrong ? "border-red-500 bg-red-500/10" : ""}`}
        onClick={() => handlePick(team.id)}
        disabled={gameStarted || isCompleted || pickMutation.isPending}
        data-testid={`button-pick-${team.id}`}
      >
        <div className="flex items-center gap-2">
          {team.seed && (
            <span className="text-xs text-muted-foreground font-medium">
              ({team.seed})
            </span>
          )}
          <span className="font-semibold">{team.name}</span>
          {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && score !== null && (
            <span className="font-bold">{score}</span>
          )}
          {isSelected && !isCompleted && <Check className="h-4 w-4" />}
        </div>
      </Button>
    );
  };

  return (
    <Card data-testid={`card-game-${game.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatInEastern(game.startTime, "MMM d, h:mm a")}</span>
          </div>
          <div className="flex items-center gap-2">
            {game.region && (
              <Badge variant="outline" className="text-xs">{game.region}</Badge>
            )}
            <Badge variant={isCompleted ? "secondary" : gameStarted ? "destructive" : "outline"}>
              {isCompleted ? "Final" : gameStarted ? "In Progress" : "Upcoming"}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          {getTeamDisplay(game.awayTeam, false)}
          <div className="flex items-center justify-center">
            <span className="text-xs text-muted-foreground">
              Spread: {game.spread}
            </span>
          </div>
          {getTeamDisplay(game.homeTeam, true)}
        </div>

        {game.userPick && isCompleted && (
          <div className="mt-3 text-center">
            {game.userPick.isCorrect ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500">
                +{game.userPick.pointsEarned} pts
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500">
                Incorrect
              </Badge>
            )}
          </div>
        )}

        <div className="mt-3 text-center text-xs text-muted-foreground">
          {game.round.displayName} - {game.round.pointValue} pts
        </div>
      </CardContent>
    </Card>
  );
}

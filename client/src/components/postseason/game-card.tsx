import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatInEastern } from "@/lib/timezone";
import { Check, Clock, Trophy } from "lucide-react";
import type { PostseasonGameWithPick } from "@shared/schema";
import { POSTSEASON_ROUND_NAMES, POSTSEASON_ROUND_POINTS, type PostseasonRound } from "@shared/schema";

interface GameCardProps {
  game: PostseasonGameWithPick;
}

export function GameCard({ game }: GameCardProps) {
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(
    game.userPick?.selectedTeam || null
  );

  const deadline = game.pickDeadline || game.gameDate;
  const isPastDeadline = new Date() >= new Date(deadline);
  const isCompleted = game.isComplete;
  const roundPoints = POSTSEASON_ROUND_POINTS[game.round as PostseasonRound];

  const pickMutation = useMutation({
    mutationFn: async (team: string) => {
      return await apiRequest("POST", "/api/postseason/picks", {
        gameId: game.id,
        selectedTeam: team,
      });
    },
    onSuccess: () => {
      toast({ title: "Pick submitted" });
      queryClient.invalidateQueries({ queryKey: ["/api/postseason/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/postseason/stats/me"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSelectedTeam(game.userPick?.selectedTeam || null);
    },
  });

  const handlePick = (team: string) => {
    if (isPastDeadline || isCompleted) return;
    setSelectedTeam(team);
    pickMutation.mutate(team);
  };

  const getTeamButton = (teamName: string, isHome: boolean) => {
    const isSelected = selectedTeam === teamName;
    const isWinner = game.winner === teamName;
    const isPickCorrect = game.userPick?.selectedTeam === teamName && game.userPick?.isCorrect === true;
    const isPickWrong = game.userPick?.selectedTeam === teamName && game.userPick?.isCorrect === false;
    const score = isHome ? game.homeScore : game.awayScore;
    const isFavored = (isHome && game.favoredTeam === 'HOME') || (!isHome && game.favoredTeam === 'AWAY');

    return (
      <Button
        variant={isSelected ? "default" : "outline"}
        className={`w-full justify-between h-auto py-3 px-4 ${isPickCorrect ? "border-green-500 bg-green-500/10" : ""} ${isPickWrong ? "border-red-500 bg-red-500/10" : ""}`}
        onClick={() => handlePick(teamName)}
        disabled={isPastDeadline || isCompleted || pickMutation.isPending}
        data-testid={`button-pick-${isHome ? "home" : "away"}-${game.id}`}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">{teamName}</span>
          {isFavored && <span className="text-xs text-muted-foreground">({parseFloat(game.spread) > 0 ? "-" : "+"}{Math.abs(parseFloat(game.spread))})</span>}
          {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && score !== null && score !== undefined && (
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
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatInEastern(game.gameDate, "MMM d, h:mm a")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {POSTSEASON_ROUND_NAMES[game.round as PostseasonRound]}
            </Badge>
            <Badge variant={isCompleted ? "secondary" : isPastDeadline ? "destructive" : "outline"}>
              {isCompleted ? "Final" : isPastDeadline ? "Locked" : "Open"}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          {getTeamButton(game.awayTeam, false)}
          <div className="flex items-center justify-center">
            <span className="text-xs text-muted-foreground">@</span>
          </div>
          {getTeamButton(game.homeTeam, true)}
        </div>

        {game.userPick && isCompleted && (
          <div className="mt-3 text-center">
            {game.userPick.isCorrect === true ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500">
                +{game.userPick.pointsEarned} pts
              </Badge>
            ) : game.userPick.isCorrect === false ? (
              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500">
                Incorrect
              </Badge>
            ) : (
              <Badge variant="outline">
                Push
              </Badge>
            )}
          </div>
        )}

        <div className="mt-3 text-center text-xs text-muted-foreground">
          Worth {roundPoints} pts
        </div>
      </CardContent>
    </Card>
  );
}

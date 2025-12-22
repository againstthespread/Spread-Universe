import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Game, ROUND_NAMES } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function AdminResultsPage() {
  const { toast } = useToast();
  const [scores, setScores] = useState<Record<string, { homeScore: string; awayScore: string }>>({});

  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const submitResultMutation = useMutation({
    mutationFn: async (data: { gameId: string; homeScore: number; awayScore: number }) => {
      const res = await apiRequest("POST", "/api/games/results", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Results submitted",
        description: "Game results have been recorded and picks have been scored.",
      });
      setScores({});
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit results",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScoreChange = (gameId: string, team: "home" | "away", value: string) => {
    setScores(prev => ({
      ...prev,
      [gameId]: {
        homeScore: prev[gameId]?.homeScore || "",
        awayScore: prev[gameId]?.awayScore || "",
        [`${team}Score`]: value,
      }
    }));
  };

  const handleSubmit = (gameId: string) => {
    const gameScores = scores[gameId];
    if (!gameScores?.homeScore || !gameScores?.awayScore) {
      toast({
        title: "Invalid scores",
        description: "Please enter both home and away scores.",
        variant: "destructive",
      });
      return;
    }

    submitResultMutation.mutate({
      gameId,
      homeScore: parseInt(gameScores.homeScore),
      awayScore: parseInt(gameScores.awayScore),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const incompleteGames = games?.filter(g => !g.isComplete) || [];
  const completedGames = games?.filter(g => g.isComplete) || [];

  const gamesByRound = incompleteGames.reduce((acc, game) => {
    if (!acc[game.round]) {
      acc[game.round] = [];
    }
    acc[game.round].push(game);
    return acc;
  }, {} as Record<string, Game[]>);

  const rounds = ["WILD_CARD", "DIVISIONAL", "CONFERENCE", "SUPER_BOWL"] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2">Enter Results</h1>
        <p className="text-muted-foreground">
          Submit final scores to calculate player picks
        </p>
      </div>

      {/* Pending Results */}
      {rounds.map((round) => {
        const roundGames = gamesByRound[round] || [];
        if (roundGames.length === 0) return null;

        return (
          <div key={round} className="space-y-4">
            <h2 className="font-display">{ROUND_NAMES[round]}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roundGames.map((game) => {
                const gameScores = scores[game.id] || { homeScore: "", awayScore: "" };
                
                return (
                  <Card key={game.id}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {game.awayTeam} @ {game.homeTeam}
                        </CardTitle>
                        <Badge variant="outline">
                          {format(new Date(game.gameDate), "MMM d")}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Spread: {game.favoredTeam === "HOME" ? game.homeTeam : game.awayTeam} {Number(game.spread) > 0 ? '+' : ''}{game.spread}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`${game.id}-away`}>
                            {game.awayTeam} Score
                          </Label>
                          <Input
                            id={`${game.id}-away`}
                            type="number"
                            min="0"
                            value={gameScores.awayScore}
                            onChange={(e) => handleScoreChange(game.id, "away", e.target.value)}
                            placeholder="0"
                            data-testid={`input-score-away-${game.id}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${game.id}-home`}>
                            {game.homeTeam} Score
                          </Label>
                          <Input
                            id={`${game.id}-home`}
                            type="number"
                            min="0"
                            value={gameScores.homeScore}
                            onChange={(e) => handleScoreChange(game.id, "home", e.target.value)}
                            placeholder="0"
                            data-testid={`input-score-home-${game.id}`}
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSubmit(game.id)}
                        disabled={submitResultMutation.isPending}
                        className="w-full"
                        data-testid={`button-submit-result-${game.id}`}
                      >
                        {submitResultMutation.isPending ? "Submitting..." : "Submit Result"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {incompleteGames.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <p className="text-lg font-medium">All games completed</p>
            <p className="text-sm text-muted-foreground">
              All playoff games have results entered
            </p>
          </CardContent>
        </Card>
      )}

      {/* Completed Games */}
      {completedGames.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display">Completed Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGames.map((game) => (
              <Card key={game.id} className="border-2 border-green-600/20">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{ROUND_NAMES[game.round]}</span>
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Final
                      </Badge>
                    </div>
                    <div className="text-lg font-medium">
                      <div className="flex items-center justify-between">
                        <span>{game.awayTeam}</span>
                        <span className="text-2xl">{game.awayScore}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{game.homeTeam}</span>
                        <span className="text-2xl">{game.homeScore}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground pt-2 border-t">
                      Winner ATS: <span className="font-medium text-foreground">{game.winner}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

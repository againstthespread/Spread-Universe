import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Game, GameWithTeams, Round } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import TeamLogo from "@/components/ui/team-logo";

// Define the form validation schema with proper type handling
const scoreUpdateSchema = z.object({
  gameId: z.string().min(1, "Game is required"),
  homeScore: z.string()
    .min(1, "Home score is required")
    .refine(val => !isNaN(parseInt(val)), "Must be a valid number"),
  awayScore: z.string()
    .min(1, "Away score is required")
    .refine(val => !isNaN(parseInt(val)), "Must be a valid number"),
  winningTeamId: z.string().min(1, "Winning team is required"),
  status: z.string().default("completed"),
});

type ScoreUpdateValues = z.infer<typeof scoreUpdateSchema>;

const GameScoreUpdateForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGame, setSelectedGame] = useState<GameWithTeams | null>(null);

  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
  });

  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  const { data: games = [], isLoading: gamesLoading } = useQuery<GameWithTeams[]>({
    queryKey: ["/api/games", selectedRoundId],
    queryFn: async () => {
      if (!selectedRoundId) return [];
      const response = await fetch(`/api/games?roundId=${selectedRoundId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch games: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!selectedRoundId,
  });

  const form = useForm<ScoreUpdateValues>({
    resolver: zodResolver(scoreUpdateSchema),
    defaultValues: {
      gameId: "",
      homeScore: "",
      awayScore: "",
      winningTeamId: "",
      status: "completed",
    },
  });

  const updateScoreMutation = useMutation({
    mutationFn: async (values: ScoreUpdateValues) => {
      // The schema transforms the string values to numbers, but we need to type it correctly 
      // for the API payload to match the expected types on the server
      const payload = {
        homeScore: Number(values.homeScore),
        awayScore: Number(values.awayScore),
        winningTeamId: parseInt(values.winningTeamId),
        status: values.status,
      };

      console.log("Updating game score with payload:", JSON.stringify(payload));
      const response = await apiRequest("PUT", `/api/games/${values.gameId}`, payload);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate both the general games query and the specific round query
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      if (selectedRoundId) {
        queryClient.invalidateQueries({ queryKey: ["/api/games", selectedRoundId] });
      }
      
      toast({
        title: "Game updated",
        description: "The game scores have been updated successfully.",
      });
      form.reset();
      setSelectedGame(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update game",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ScoreUpdateValues) => {
    updateScoreMutation.mutate(values);
  };

  const handleGameChange = (gameId: string) => {
    const game = games.find(g => g.id.toString() === gameId);
    if (game) {
      setSelectedGame(game);
      form.setValue("winningTeamId", "");
      form.setValue("homeScore", "");
      form.setValue("awayScore", "");
    }
  };

  return (
    <Card className="overflow-hidden mt-6">
      <CardHeader className="bg-primary/10">
        <CardTitle className="text-lg font-medium">Update Game Scores</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="mb-4">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Select Tournament Round
            </label>
            <Select
              onValueChange={(value) => setSelectedRoundId(parseInt(value))}
              value={selectedRoundId?.toString()}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select round" />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id.toString()}>
                    {round.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {gamesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : selectedRoundId && games.length === 0 ? (
            <div className="text-center p-4 border rounded-md bg-muted/30">
              No games available for this round.
            </div>
          ) : selectedRoundId && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="gameId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Game</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleGameChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select game" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {games.map((game) => (
                            <SelectItem key={game.id} value={game.id.toString()}>
                              {game.homeTeam.name} vs {game.awayTeam.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedGame && (
                  <>
                    <div className="border rounded-lg p-4 bg-muted/10">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                          <TeamLogo logoUrl={selectedGame.homeTeam.logoUrl} teamName={selectedGame.homeTeam.name} className="w-8 h-8" />
                          <span className="font-medium">{selectedGame.homeTeam.name}</span>
                          {selectedGame.homeTeam.seed && <span className="text-sm text-muted-foreground">({selectedGame.homeTeam.seed})</span>}
                        </div>
                        <div className="font-bold">VS</div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{selectedGame.awayTeam.name}</span>
                          {selectedGame.awayTeam.seed && <span className="text-sm text-muted-foreground">({selectedGame.awayTeam.seed})</span>}
                          <TeamLogo logoUrl={selectedGame.awayTeam.logoUrl} teamName={selectedGame.awayTeam.name} className="w-8 h-8" />
                        </div>
                      </div>
                      
                      <div className="text-sm text-center mb-2">
                        {selectedGame.region && <span className="mr-2">{selectedGame.region} Region</span>}
                        <span>Spread: {selectedGame.spread}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="homeScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{selectedGame.homeTeam.name} Score</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="awayScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{selectedGame.awayTeam.name} Score</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="winningTeamId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Winner</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select winner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={selectedGame.homeTeam.id.toString()}>
                                {selectedGame.homeTeam.name}
                              </SelectItem>
                              <SelectItem value={selectedGame.awayTeam.id.toString()}>
                                {selectedGame.awayTeam.name}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Game Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="live">Live</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-secondary hover:bg-secondary/90"
                        disabled={updateScoreMutation.isPending}
                      >
                        {updateScoreMutation.isPending ? "Updating..." : "Update Score"}
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </Form>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GameScoreUpdateForm;
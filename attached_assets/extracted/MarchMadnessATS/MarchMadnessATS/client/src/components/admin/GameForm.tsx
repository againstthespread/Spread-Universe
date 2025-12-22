import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Round, Team } from "@shared/schema";

const gameFormSchema = z.object({
  roundId: z.string().min(1, "Round is required"),
  homeTeamId: z.string().min(1, "Home team is required"),
  awayTeamId: z.string().min(1, "Away team is required"),
  spread: z.string().min(1, "Spread is required"),
  startTime: z.string().min(1, "Start time is required").transform(val => {
    // Ensure the string is a valid date
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }
    return val;
  }),
  region: z.string().optional(),
  gameNumber: z.string().optional(),
  status: z.string().default("upcoming"),
});

type GameFormValues = z.infer<typeof gameFormSchema>;

const GameForm = () => {
  const [isCreating, setIsCreating] = useState(true);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      roundId: "",
      homeTeamId: "",
      awayTeamId: "",
      spread: "",
      startTime: new Date().toISOString().slice(0, 16),
      region: "",
      gameNumber: "",
      status: "upcoming",
    },
  });

  const createGameMutation = useMutation({
    mutationFn: async (values: GameFormValues) => {
      // Make sure the date is valid before trying to convert to ISO string
      let startTimeValue;
      try {
        const dateObj = new Date(values.startTime);
        if (!isNaN(dateObj.getTime())) {
          startTimeValue = dateObj.toISOString();
        } else {
          throw new Error("Invalid date format");
        }
      } catch (error) {
        throw new Error("Invalid date format. Please use a valid date and time.");
      }

      const payload = {
        roundId: parseInt(values.roundId),
        homeTeamId: parseInt(values.homeTeamId),
        awayTeamId: parseInt(values.awayTeamId),
        spread: values.spread,
        startTime: startTimeValue,
        region: values.region || undefined,
        gameNumber: values.gameNumber ? parseInt(values.gameNumber) : undefined,
        status: values.status,
      };

      console.log("Submitting game with payload:", JSON.stringify(payload));
      const response = await apiRequest("POST", "/api/games", payload);
      return response;
    },
    onSuccess: (data) => {
      // Get the round ID from the form to properly invalidate the specific round query
      const roundId = parseInt(form.getValues().roundId);
      
      // Invalidate both the general games query and the specific round query
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games", roundId] });
      
      toast({
        title: "Game created",
        description: "The game has been created successfully.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create game",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: GameFormValues) => {
    createGameMutation.mutate(values);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/10">
        <CardTitle className="text-lg font-medium">Create New Game</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roundId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament Round</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select round" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rounds.map((round) => (
                          <SelectItem key={round.id} value={round.id.toString()}>
                            {round.displayName} ({round.pointValue} pts)
                          </SelectItem>
                        ))}
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
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="homeTeamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Home Team</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select home team" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name} {team.seed ? `(${team.seed})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="awayTeamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Away Team</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select away team" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name} {team.seed ? `(${team.seed})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spread"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spread (e.g., -4.5 for home team favored)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter spread (e.g. -4.5)" {...field} />
                    </FormControl>
                    <FormDescription>
                      Negative values mean home team is favored
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., East, West, South, Midwest" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gameNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Number (optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="E.g., 1, 2, 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-secondary hover:bg-secondary/90"
                disabled={createGameMutation.isPending}
              >
                {createGameMutation.isPending ? "Creating..." : "Create Game"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default GameForm;

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import { formatInEastern, easternToUTC } from "@/lib/timezone";
import type { CrowdlineGame } from "@shared/schema";

const createGameSchema = z.object({
  homeTeam: z.string().min(1, "Home team required"),
  awayTeam: z.string().min(1, "Away team required"),
  date: z.string().min(1, "Date required"),
  time: z.string().min(1, "Time required"),
});

const updateResultSchema = z.object({
  actualHomeScore: z.number().int().min(0),
  actualAwayScore: z.number().int().min(0),
});

export default function CrowdlineAdmin() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const { data: games, isLoading } = useQuery<CrowdlineGame[]>({
    queryKey: ["/api/crowdline/admin/games"],
  });

  const createGameForm = useForm<z.infer<typeof createGameSchema>>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      homeTeam: "",
      awayTeam: "",
      date: "",
      time: "13:00",
    },
  });

  const resultForm = useForm<z.infer<typeof updateResultSchema>>({
    resolver: zodResolver(updateResultSchema),
    defaultValues: {
      actualHomeScore: 0,
      actualAwayScore: 0,
    },
  });

  const createGameMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createGameSchema>) => {
      const gameDate = easternToUTC(data.date, data.time);
      return await apiRequest("POST", "/api/crowdline/admin/games", {
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        gameDate,
      });
    },
    onSuccess: () => {
      toast({ title: "Game created" });
      setCreateDialogOpen(false);
      createGameForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/crowdline/admin/games"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/crowdline/admin/games/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Game deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/crowdline/admin/games"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateResultMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateResultSchema> & { id: string }) => {
      return await apiRequest("PATCH", `/api/crowdline/admin/games/${data.id}/result`, {
        actualHomeScore: data.actualHomeScore,
        actualAwayScore: data.actualAwayScore,
        status: "final",
      });
    },
    onSuccess: () => {
      toast({ title: "Result updated" });
      setResultDialogOpen(false);
      setSelectedGameId(null);
      resultForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/crowdline/admin/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crowdline/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crowdline/leaderboard"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openResultDialog = (game: CrowdlineGame) => {
    setSelectedGameId(game.id);
    resultForm.setValue("actualHomeScore", game.actualHomeScore || 0);
    resultForm.setValue("actualAwayScore", game.actualAwayScore || 0);
    setResultDialogOpen(true);
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/crowdline">
          <Button variant="ghost" size="sm" data-testid="link-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-game">
              <Plus className="h-4 w-4 mr-2" />
              Add Game
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Game</DialogTitle>
            </DialogHeader>
            <Form {...createGameForm}>
              <form onSubmit={createGameForm.handleSubmit((data) => createGameMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={createGameForm.control}
                  name="homeTeam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Team</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Kansas City Chiefs" {...field} data-testid="input-home-team" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createGameForm.control}
                  name="awayTeam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Away Team</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Buffalo Bills" {...field} data-testid="input-away-team" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createGameForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-game-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createGameForm.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time (ET)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-game-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createGameMutation.isPending} data-testid="button-submit-game">
                  {createGameMutation.isPending ? "Creating..." : "Create Game"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Games</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : games && games.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matchup</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id} data-testid={`row-game-${game.id}`}>
                    <TableCell>
                      <div className="font-medium">{game.awayTeam} @ {game.homeTeam}</div>
                      {game.status === "final" && (
                        <div className="text-sm text-muted-foreground">
                          Final: {game.actualAwayScore} - {game.actualHomeScore}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatInEastern(game.gameDate, "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={game.status === "final" ? "secondary" : "outline"}>
                        {game.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openResultDialog(game)}
                          data-testid={`button-result-${game.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => deleteGameMutation.mutate(game.id)}
                          disabled={deleteGameMutation.isPending}
                          data-testid={`button-delete-${game.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No games created yet</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Result</DialogTitle>
          </DialogHeader>
          <Form {...resultForm}>
            <form onSubmit={resultForm.handleSubmit((data) => selectedGameId && updateResultMutation.mutate({ ...data, id: selectedGameId }))} className="space-y-4">
              <FormField
                control={resultForm.control}
                name="actualHomeScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Home Score</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-actual-home-score" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resultForm.control}
                name="actualAwayScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Away Score</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-actual-away-score" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={updateResultMutation.isPending} data-testid="button-submit-result">
                {updateResultMutation.isPending ? "Updating..." : "Update Result"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

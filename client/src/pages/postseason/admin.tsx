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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import { formatInEastern, easternToUTC } from "@/lib/timezone";
import type { PostseasonGame, PostseasonRound } from "@shared/schema";
import { POSTSEASON_ROUND_NAMES, POSTSEASON_ROUND_POINTS } from "@shared/schema";

const ROUNDS: PostseasonRound[] = ['WILD_CARD', 'DIVISIONAL', 'CONFERENCE', 'SUPER_BOWL'];

const createGameSchema = z.object({
  round: z.enum(['WILD_CARD', 'DIVISIONAL', 'CONFERENCE', 'SUPER_BOWL']),
  homeTeam: z.string().min(1, "Home team required"),
  awayTeam: z.string().min(1, "Away team required"),
  spread: z.string().min(1, "Spread required"),
  favoredTeam: z.enum(['HOME', 'AWAY']),
  date: z.string().min(1, "Date required"),
  time: z.string().min(1, "Time required"),
});

const updateResultSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

export default function PostseasonAdmin() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<PostseasonGame | null>(null);

  const { data: games, isLoading } = useQuery<PostseasonGame[]>({
    queryKey: ["/api/postseason/admin/games"],
  });

  const createForm = useForm<z.infer<typeof createGameSchema>>({
    resolver: zodResolver(createGameSchema),
    defaultValues: { 
      round: 'WILD_CARD', 
      homeTeam: "", 
      awayTeam: "", 
      spread: "", 
      favoredTeam: 'HOME',
      date: "", 
      time: "13:00" 
    },
  });

  const resultForm = useForm<z.infer<typeof updateResultSchema>>({
    resolver: zodResolver(updateResultSchema),
    defaultValues: { homeScore: 0, awayScore: 0 },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createGameSchema>) => {
      const gameDate = easternToUTC(data.date, data.time);
      return await apiRequest("POST", "/api/postseason/admin/games", {
        round: data.round,
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        spread: data.spread,
        favoredTeam: data.favoredTeam,
        gameDate,
      });
    },
    onSuccess: () => {
      toast({ title: "Game created" });
      setCreateDialogOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/postseason/admin/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/postseason/games"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/postseason/admin/games/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Game deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/postseason/admin/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/postseason/games"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resultMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateResultSchema> & { id: string }) => {
      return await apiRequest("PATCH", `/api/postseason/admin/games/${data.id}/result`, {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
      });
    },
    onSuccess: () => {
      toast({ title: "Result updated" });
      setResultDialogOpen(false);
      setSelectedGame(null);
      resultForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/postseason/admin/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/postseason/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/postseason/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/postseason/stats/me"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openResultDialog = (game: PostseasonGame) => {
    setSelectedGame(game);
    resultForm.setValue("homeScore", game.homeScore || 0);
    resultForm.setValue("awayScore", game.awayScore || 0);
    setResultDialogOpen(true);
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/postseason">
          <Button variant="ghost" size="sm" data-testid="link-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold">PostseasonATS Admin</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-game">
              <Plus className="h-4 w-4 mr-2" />
              Add Game
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Game</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="round"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Round</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-round">
                            <SelectValue placeholder="Select round" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ROUNDS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {POSTSEASON_ROUND_NAMES[r]} ({POSTSEASON_ROUND_POINTS[r]} pts)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="awayTeam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Away Team</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. KC Chiefs" {...field} data-testid="input-away-team" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="homeTeam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Team</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Buffalo Bills" {...field} data-testid="input-home-team" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="spread"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spread</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 3.5" {...field} data-testid="input-spread" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="favoredTeam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favored Team</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-favored">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HOME">Home</SelectItem>
                            <SelectItem value="AWAY">Away</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
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
                    control={createForm.control}
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
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-game">
                  {createMutation.isPending ? "Creating..." : "Create Game"}
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
                  <TableHead>Round</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id} data-testid={`row-game-${game.id}`}>
                    <TableCell>
                      <div className="font-medium">
                        {game.awayTeam} @ {game.homeTeam}
                      </div>
                      {game.isComplete && (
                        <div className="text-sm text-muted-foreground">
                          Final: {game.awayScore} - {game.homeScore}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Spread: {game.favoredTeam === 'HOME' ? game.homeTeam : game.awayTeam} -{game.spread}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {POSTSEASON_ROUND_NAMES[game.round as PostseasonRound]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatInEastern(game.gameDate, "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={game.isComplete ? "secondary" : "outline"}>
                        {game.isComplete ? "Final" : "Scheduled"}
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
                          onClick={() => deleteMutation.mutate(game.id)}
                          disabled={deleteMutation.isPending}
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
            <div className="text-center py-8 text-muted-foreground">
              <p>No games created yet. Add your first playoff game!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Result</DialogTitle>
          </DialogHeader>
          {selectedGame && (
            <div className="mb-4 text-center">
              <div className="font-medium">{selectedGame.awayTeam} @ {selectedGame.homeTeam}</div>
              <div className="text-sm text-muted-foreground">
                {POSTSEASON_ROUND_NAMES[selectedGame.round as PostseasonRound]}
              </div>
            </div>
          )}
          <Form {...resultForm}>
            <form onSubmit={resultForm.handleSubmit((data) => resultMutation.mutate({ ...data, id: selectedGame!.id }))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={resultForm.control}
                  name="awayScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{selectedGame?.awayTeam} Score</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-away-score" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resultForm.control}
                  name="homeScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{selectedGame?.homeTeam} Score</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-home-score" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={resultMutation.isPending} data-testid="button-submit-result">
                {resultMutation.isPending ? "Saving..." : "Save Result"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

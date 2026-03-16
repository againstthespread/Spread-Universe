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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Trash2, Check, Users } from "lucide-react";
import { formatInEastern, easternToUTC } from "@/lib/timezone";
import type { MarchmadnessTeam, MarchmadnessRound, MarchmadnessGameWithTeams } from "@shared/schema";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name required"),
  shortName: z.string().optional(),
  mascot: z.string().optional(),
  seed: z.number().int().min(1).max(16).optional(),
  conference: z.string().optional(),
});

const createGameSchema = z.object({
  roundId: z.string().min(1, "Round required"),
  homeTeamId: z.string().min(1, "Home team required"),
  awayTeamId: z.string().min(1, "Away team required"),
  spread: z.string().min(1, "Spread required"),
  date: z.string().min(1, "Date required"),
  time: z.string().min(1, "Time required"),
  region: z.string().optional(),
});

const updateResultSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  winningTeamId: z.string().min(1, "Winner required"),
});

export default function MarchMadnessAdmin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("games");
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [createGameDialogOpen, setCreateGameDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<MarchmadnessGameWithTeams | null>(null);

  const { data: teams } = useQuery<MarchmadnessTeam[]>({
    queryKey: ["/api/marchmadness/admin/teams"],
  });

  const { data: rounds } = useQuery<MarchmadnessRound[]>({
    queryKey: ["/api/marchmadness/admin/rounds"],
  });

  const { data: games, isLoading: gamesLoading } = useQuery<MarchmadnessGameWithTeams[]>({
    queryKey: ["/api/marchmadness/admin/games"],
  });

  const createTeamForm = useForm<z.infer<typeof createTeamSchema>>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "", shortName: "", mascot: "", conference: "" },
  });

  const createGameForm = useForm<z.infer<typeof createGameSchema>>({
    resolver: zodResolver(createGameSchema),
    defaultValues: { roundId: "", homeTeamId: "", awayTeamId: "", spread: "", date: "", time: "12:00", region: "" },
  });

  const resultForm = useForm<z.infer<typeof updateResultSchema>>({
    resolver: zodResolver(updateResultSchema),
    defaultValues: { homeScore: 0, awayScore: 0, winningTeamId: "" },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTeamSchema>) => {
      return await apiRequest("POST", "/api/marchmadness/admin/teams", data);
    },
    onSuccess: () => {
      toast({ title: "Team created" });
      setCreateTeamDialogOpen(false);
      createTeamForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/marchmadness/admin/teams"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createGameMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createGameSchema>) => {
      const startTime = easternToUTC(data.date, data.time);
      return await apiRequest("POST", "/api/marchmadness/admin/games", {
        roundId: data.roundId,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        spread: data.spread,
        startTime,
        region: data.region || null,
        status: "upcoming",
      });
    },
    onSuccess: () => {
      toast({ title: "Game created" });
      setCreateGameDialogOpen(false);
      createGameForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/marchmadness/admin/games"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/marchmadness/admin/games/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Game deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/marchmadness/admin/games"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateResultMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateResultSchema> & { id: string }) => {
      return await apiRequest("PATCH", `/api/marchmadness/admin/games/${data.id}`, {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        winningTeamId: data.winningTeamId,
        status: "final",
      });
    },
    onSuccess: () => {
      toast({ title: "Result updated" });
      setResultDialogOpen(false);
      setSelectedGame(null);
      resultForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/marchmadness/admin/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marchmadness/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marchmadness/leaderboard"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openResultDialog = (game: MarchmadnessGameWithTeams) => {
    setSelectedGame(game);
    resultForm.setValue("homeScore", game.homeScore || 0);
    resultForm.setValue("awayScore", game.awayScore || 0);
    resultForm.setValue("winningTeamId", game.winningTeamId || "");
    setResultDialogOpen(true);
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/marchmadness">
          <Button variant="ghost" size="sm" data-testid="link-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold">March Madness Admin</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="rounds">Rounds</TabsTrigger>
        </TabsList>

        <TabsContent value="games">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Games</CardTitle>
              <Dialog open={createGameDialogOpen} onOpenChange={setCreateGameDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-game" disabled={!teams?.length || !rounds?.length}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Game
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Game</DialogTitle>
                  </DialogHeader>
                  <Form {...createGameForm}>
                    <form onSubmit={createGameForm.handleSubmit((data) => createGameMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={createGameForm.control}
                        name="roundId"
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
                                {rounds?.map((r) => (
                                  <SelectItem key={r.id} value={r.id}>{r.displayName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createGameForm.control}
                          name="awayTeamId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Away Team</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-away-team">
                                    <SelectValue placeholder="Select team" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {teams?.slice().sort((a, b) => (a.shortName || a.name).localeCompare(b.shortName || b.name)).map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.shortName || t.name}{t.seed ? ` (${t.seed})` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createGameForm.control}
                          name="homeTeamId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Home Team</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-home-team">
                                    <SelectValue placeholder="Select team" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {teams?.slice().sort((a, b) => (a.shortName || a.name).localeCompare(b.shortName || b.name)).map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.shortName || t.name}{t.seed ? ` (${t.seed})` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={createGameForm.control}
                        name="spread"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Spread</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. -3.5 or +7" {...field} data-testid="input-spread" />
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
                      <FormField
                        control={createGameForm.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. East, West, South, Midwest" {...field} data-testid="input-region" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createGameMutation.isPending} data-testid="button-submit-game">
                        {createGameMutation.isPending ? "Creating..." : "Create Game"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {gamesLoading ? (
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
                            {game.awayTeam.seed && `(${game.awayTeam.seed}) `}{game.awayTeam.name} @ {game.homeTeam.seed && `(${game.homeTeam.seed}) `}{game.homeTeam.name}
                          </div>
                          {game.status === "final" && (
                            <div className="text-sm text-muted-foreground">
                              Final: {game.awayScore} - {game.homeScore}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">Spread: {game.spread}</div>
                        </TableCell>
                        <TableCell>{game.round.displayName}</TableCell>
                        <TableCell className="text-sm">
                          {formatInEastern(game.startTime, "MMM d, h:mm a")}
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
                <div className="text-center py-8 text-muted-foreground">
                  <p>No games created yet.</p>
                  {(!teams?.length || !rounds?.length) && (
                    <p className="text-sm mt-2">Add teams first to create games.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teams ({teams?.length || 0})
              </CardTitle>
              <Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-team">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Team</DialogTitle>
                  </DialogHeader>
                  <Form {...createTeamForm}>
                    <form onSubmit={createTeamForm.handleSubmit((data) => createTeamMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={createTeamForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Duke Blue Devils" {...field} data-testid="input-team-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createTeamForm.control}
                          name="shortName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Short Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Duke" {...field} data-testid="input-short-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createTeamForm.control}
                          name="seed"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Seed</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="16" placeholder="1-16" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} data-testid="input-seed" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={createTeamForm.control}
                        name="conference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conference</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. ACC" {...field} data-testid="input-conference" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createTeamMutation.isPending} data-testid="button-submit-team">
                        {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {teams && teams.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seed</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Conference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id} data-testid={`row-team-${team.id}`}>
                        <TableCell className="font-medium">{team.seed || "-"}</TableCell>
                        <TableCell>{team.name}</TableCell>
                        <TableCell>{team.conference || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No teams created yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rounds">
          <Card>
            <CardHeader>
              <CardTitle>Rounds</CardTitle>
            </CardHeader>
            <CardContent>
              {rounds && rounds.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Point Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rounds.map((round) => (
                      <TableRow key={round.id} data-testid={`row-round-${round.id}`}>
                        <TableCell>{round.order}</TableCell>
                        <TableCell className="font-medium">{round.displayName}</TableCell>
                        <TableCell>{round.pointValue} pts</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No rounds configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Result</DialogTitle>
          </DialogHeader>
          {selectedGame && (
            <Form {...resultForm}>
              <form onSubmit={resultForm.handleSubmit((data) => updateResultMutation.mutate({ ...data, id: selectedGame.id }))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={resultForm.control}
                    name="awayScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{selectedGame.awayTeam.name} Score</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-away-score" />
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
                        <FormLabel>{selectedGame.homeTeam.name} Score</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-home-score" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={resultForm.control}
                  name="winningTeamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Winner</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-winner">
                            <SelectValue placeholder="Select winner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={selectedGame.homeTeam.id}>{selectedGame.homeTeam.name}</SelectItem>
                          <SelectItem value={selectedGame.awayTeam.id}>{selectedGame.awayTeam.name}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={updateResultMutation.isPending} data-testid="button-submit-result">
                  {updateResultMutation.isPending ? "Updating..." : "Update Result"}
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

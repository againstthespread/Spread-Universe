import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Check, Loader2, Pencil, Settings2 } from "lucide-react";
import { formatInEastern, easternToUTC } from "@/lib/timezone";
import type { MarchmadnessTeam, MarchmadnessRound, MarchmadnessGameWithTeams } from "@shared/schema";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name required"),
  shortName: z.string().optional(),
  mascot: z.string().optional(),
  seed: z.number().int().min(1).max(16).optional(),
  conference: z.string().optional(),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const editTeamSchema = z.object({
  name: z.string().min(1, "Team name required"),
  shortName: z.string().optional(),
  mascot: z.string().optional(),
  seed: z.number().int().min(1).max(16).optional().nullable(),
  conference: z.string().optional(),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
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

export default function MarchMadnessAdminContent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("games");
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<MarchmadnessTeam | null>(null);
  const [createGameDialogOpen, setCreateGameDialogOpen] = useState(false);
  const [editGameDialogOpen, setEditGameDialogOpen] = useState(false);
  const [selectedGameForEdit, setSelectedGameForEdit] = useState<MarchmadnessGameWithTeams | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<MarchmadnessGameWithTeams | null>(null);
  const [teamSearch, setTeamSearch] = useState("");

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
    defaultValues: { name: "", shortName: "", mascot: "", conference: "", logoUrl: "" },
  });

  const editTeamForm = useForm<z.infer<typeof editTeamSchema>>({
    resolver: zodResolver(editTeamSchema),
    defaultValues: { name: "", shortName: "", mascot: "", conference: "", logoUrl: "", seed: undefined },
  });

  const createGameForm = useForm<z.infer<typeof createGameSchema>>({
    resolver: zodResolver(createGameSchema),
    defaultValues: { roundId: "", homeTeamId: "", awayTeamId: "", spread: "", date: "", time: "12:00", region: "" },
  });

  const editGameForm = useForm<z.infer<typeof createGameSchema>>({
    resolver: zodResolver(createGameSchema),
    defaultValues: { roundId: "", homeTeamId: "", awayTeamId: "", spread: "", date: "", time: "12:00", region: "" },
  });

  const resultForm = useForm<z.infer<typeof updateResultSchema>>({
    resolver: zodResolver(updateResultSchema),
    defaultValues: { homeScore: 0, awayScore: 0, winningTeamId: "" },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTeamSchema>) => {
      return await apiRequest("POST", "/api/marchmadness/admin/teams", {
        ...data,
        logoUrl: data.logoUrl || null,
      });
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

  const editTeamMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editTeamSchema> & { id: string }) => {
      return await apiRequest("PATCH", `/api/marchmadness/admin/teams/${data.id}`, {
        name: data.name,
        shortName: data.shortName || null,
        mascot: data.mascot || null,
        seed: data.seed || null,
        conference: data.conference || null,
        logoUrl: data.logoUrl || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Team updated" });
      setEditTeamDialogOpen(false);
      setSelectedTeam(null);
      queryClient.invalidateQueries({ queryKey: ["/api/marchmadness/admin/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marchmadness/games"] });
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

  const editGameMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createGameSchema> & { id: string }) => {
      const startTime = easternToUTC(data.date, data.time);
      return await apiRequest("PATCH", `/api/marchmadness/admin/games/${data.id}`, {
        roundId: data.roundId,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        spread: data.spread,
        startTime,
        region: data.region || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Game updated" });
      setEditGameDialogOpen(false);
      setSelectedGameForEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/marchmadness/admin/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marchmadness/games"] });
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

  const openEditDialog = (team: MarchmadnessTeam) => {
    setSelectedTeam(team);
    editTeamForm.reset({
      name: team.name,
      shortName: team.shortName || "",
      mascot: team.mascot || "",
      seed: team.seed ?? undefined,
      conference: team.conference || "",
      logoUrl: team.logoUrl || "",
    });
    setEditTeamDialogOpen(true);
  };

  const openEditGameDialog = (game: MarchmadnessGameWithTeams) => {
    setSelectedGameForEdit(game);
    const d = new Date(game.startTime);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    editGameForm.reset({
      roundId: game.roundId,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      spread: game.spread,
      date: dateStr,
      time: timeStr,
      region: game.region || "",
    });
    setEditGameDialogOpen(true);
  };

  const openResultDialog = (game: MarchmadnessGameWithTeams) => {
    setSelectedGame(game);
    resultForm.setValue("homeScore", game.homeScore || 0);
    resultForm.setValue("awayScore", game.awayScore || 0);
    resultForm.setValue("winningTeamId", game.winningTeamId || "");
    setResultDialogOpen(true);
  };

  const filteredTeams = teams?.filter(t =>
    !teamSearch || t.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
    (t.shortName || "").toLowerCase().includes(teamSearch.toLowerCase()) ||
    (t.conference || "").toLowerCase().includes(teamSearch.toLowerCase())
  );

  if (gamesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="teams">Teams ({teams?.length || 0})</TabsTrigger>
          <TabsTrigger value="rounds">Rounds</TabsTrigger>
        </TabsList>

        <TabsContent value="games">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-lg font-semibold">Games ({games?.length || 0})</h3>
              <Dialog open={createGameDialogOpen} onOpenChange={setCreateGameDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-mm-create-game" disabled={!teams?.length || !rounds?.length}>
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
                                <SelectTrigger data-testid="select-mm-round">
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
                                  <SelectTrigger data-testid="select-mm-away-team">
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
                                  <SelectTrigger data-testid="select-mm-home-team">
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
                              <Input placeholder="e.g. -3.5 or +7" {...field} data-testid="input-mm-spread" />
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
                                <Input type="date" {...field} data-testid="input-mm-game-date" />
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
                                <Input type="time" {...field} data-testid="input-mm-game-time" />
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
                              <Input placeholder="e.g. East, West, South, Midwest" {...field} data-testid="input-mm-region" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createGameMutation.isPending} data-testid="button-mm-submit-game">
                        {createGameMutation.isPending ? "Creating..." : "Create Game"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {games && games.length > 0 ? (
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
                    <TableRow key={game.id} data-testid={`row-mm-game-${game.id}`}>
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
                            onClick={() => openEditGameDialog(game)}
                            data-testid={`button-mm-edit-game-${game.id}`}
                            title="Edit game"
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => openResultDialog(game)}
                            data-testid={`button-mm-result-${game.id}`}
                            title="Enter result"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => deleteGameMutation.mutate(game.id)}
                            disabled={deleteGameMutation.isPending}
                            data-testid={`button-mm-delete-${game.id}`}
                            title="Delete game"
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
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-lg font-semibold">Teams ({teams?.length || 0})</h3>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Search teams..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-48"
                  data-testid="input-team-search"
                />
                <Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-mm-create-team">
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
                                <Input placeholder="e.g. Duke Blue Devils" {...field} data-testid="input-mm-team-name" />
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
                                  <Input placeholder="e.g. Duke" {...field} data-testid="input-mm-short-name" />
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
                                  <Input type="number" min="1" max="16" placeholder="1-16" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} data-testid="input-mm-seed" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createTeamForm.control}
                            name="mascot"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mascot</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Blue Devils" {...field} data-testid="input-mm-mascot" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createTeamForm.control}
                            name="conference"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Conference</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. ACC" {...field} data-testid="input-mm-conference" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={createTeamForm.control}
                          name="logoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Logo URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/logo.png" {...field} data-testid="input-mm-logo-url" />
                              </FormControl>
                              <FormMessage />
                              {field.value && (
                                <img src={field.value} alt="Logo preview" className="h-10 w-10 object-contain rounded mt-1" onError={(e) => (e.currentTarget.style.display = "none")} />
                              )}
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={createTeamMutation.isPending} data-testid="button-mm-submit-team">
                          {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {filteredTeams && filteredTeams.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Seed</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Conference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow key={team.id} data-testid={`row-mm-team-${team.id}`}>
                      <TableCell>
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt={team.name} className="h-8 w-8 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            {(team.shortName || team.name).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{team.seed || "-"}</TableCell>
                      <TableCell>
                        <div className="font-medium">{team.name}</div>
                        {team.shortName && <div className="text-xs text-muted-foreground">{team.shortName}</div>}
                      </TableCell>
                      <TableCell>{team.conference || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openEditDialog(team)}
                          data-testid={`button-mm-edit-team-${team.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {teamSearch ? "No teams match your search" : "No teams created yet"}
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rounds">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rounds ({rounds?.length || 0})</h3>
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
                    <TableRow key={round.id} data-testid={`row-mm-round-${round.id}`}>
                      <TableCell>{round.roundOrder}</TableCell>
                      <TableCell>{round.displayName}</TableCell>
                      <TableCell>{round.pointValue} pts</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No rounds set up</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Game Dialog */}
      <Dialog open={editGameDialogOpen} onOpenChange={setEditGameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
          </DialogHeader>
          <Form {...editGameForm}>
            <form
              onSubmit={editGameForm.handleSubmit((data) => {
                if (!selectedGameForEdit) return;
                editGameMutation.mutate({ ...data, id: selectedGameForEdit.id });
              })}
              className="space-y-4"
            >
              <FormField
                control={editGameForm.control}
                name="roundId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Round</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-mm-edit-round">
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
                  control={editGameForm.control}
                  name="awayTeamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Away Team</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-mm-edit-away-team">
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
                  control={editGameForm.control}
                  name="homeTeamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Team</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-mm-edit-home-team">
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
                control={editGameForm.control}
                name="spread"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spread</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. -3.5 or +7" {...field} data-testid="input-mm-edit-spread" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editGameForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-mm-edit-game-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editGameForm.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time (ET)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-mm-edit-game-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editGameForm.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. East, West, South, Midwest" {...field} data-testid="input-mm-edit-region" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={editGameMutation.isPending} data-testid="button-mm-submit-edit-game">
                {editGameMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={editTeamDialogOpen} onOpenChange={setEditTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <Form {...editTeamForm}>
            <form
              onSubmit={editTeamForm.handleSubmit((data) => {
                if (!selectedTeam) return;
                editTeamMutation.mutate({ ...data, id: selectedTeam.id });
              })}
              className="space-y-4"
            >
              <FormField
                control={editTeamForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-mm-edit-team-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editTeamForm.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-mm-edit-short-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTeamForm.control}
                  name="seed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seed</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="16"
                          placeholder="1-16"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-mm-edit-seed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editTeamForm.control}
                  name="mascot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mascot</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-mm-edit-mascot" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTeamForm.control}
                  name="conference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conference</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-mm-edit-conference" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editTeamForm.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} data-testid="input-mm-edit-logo-url" />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <img src={field.value} alt="Logo preview" className="h-12 w-12 object-contain rounded border mt-1" onError={(e) => (e.currentTarget.style.display = "none")} />
                    )}
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={editTeamMutation.isPending} data-testid="button-mm-submit-edit-team">
                {editTeamMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Result</DialogTitle>
          </DialogHeader>
          {selectedGame && (
            <Form {...resultForm}>
              <form
                onSubmit={resultForm.handleSubmit((data) => updateResultMutation.mutate({ ...data, id: selectedGame.id }))}
                className="space-y-4"
              >
                <div className="text-sm text-muted-foreground text-center">
                  {selectedGame.awayTeam.name} @ {selectedGame.homeTeam.name}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={resultForm.control}
                    name="awayScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{selectedGame.awayTeam.name} Score</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-mm-away-score" />
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
                          <Input type="number" min="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-mm-home-score" />
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
                          <SelectTrigger data-testid="select-mm-winner">
                            <SelectValue placeholder="Select winner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={selectedGame.awayTeamId}>{selectedGame.awayTeam.name}</SelectItem>
                          <SelectItem value={selectedGame.homeTeamId}>{selectedGame.homeTeam.name}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={updateResultMutation.isPending} data-testid="button-mm-submit-result">
                  {updateResultMutation.isPending ? "Saving..." : "Save Result"}
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

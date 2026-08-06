import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Check, Trophy, Loader2 } from "lucide-react";
import { formatInEastern } from "@/lib/timezone";
import type { GamblingLeagueGame, GamblingLeagueLeague } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function isEasternDST(utcDate: Date): boolean {
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth();
  const day = utcDate.getUTCDate();
  const hour = utcDate.getUTCHours();
  if (month < 2 || month > 10) return false;
  if (month > 2 && month < 10) return true;
  function getNthSundayOfMonth(year: number, month: number, n: number): number {
    const firstDay = new Date(year, month, 1);
    const firstSunday = ((7 - firstDay.getDay()) % 7) + 1;
    return firstSunday + ((n - 1) * 7);
  }
  if (month === 2) {
    const secondSunday = getNthSundayOfMonth(year, 2, 2);
    if (day < secondSunday) return false;
    if (day > secondSunday) return true;
    return hour >= 7;
  }
  if (month === 10) {
    const firstSunday = getNthSundayOfMonth(year, 10, 1);
    if (day < firstSunday) return true;
    if (day > firstSunday) return false;
    return hour < 6;
  }
  return false;
}

function convertUTCToEasternForInput(utcDateOrString: Date | string): string {
  const utcDate = typeof utcDateOrString === 'string' ? new Date(utcDateOrString) : utcDateOrString;
  const isDST = isEasternDST(utcDate);
  const offsetHours = isDST ? 4 : 5;
  const easternTime = new Date(utcDate.getTime() - (offsetHours * 60 * 60 * 1000));
  const year = easternTime.getUTCFullYear();
  const monthStr = String(easternTime.getUTCMonth() + 1).padStart(2, '0');
  const dayStr = String(easternTime.getUTCDate()).padStart(2, '0');
  const hourStr = String(easternTime.getUTCHours()).padStart(2, '0');
  const minuteStr = String(easternTime.getUTCMinutes()).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}`;
}

export default function GamblingLeagueAdminContent() {
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [gameForm, setGameForm] = useState({
    week: 1,
    homeTeam: "",
    awayTeam: "",
    spread: "0",
    gameTime: "",
  });
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [minPicksInput, setMinPicksInput] = useState<string | null>(null);
  const [resultInputs, setResultInputs] = useState<Record<string, { homeScore: string; awayScore: string }>>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: games = [], isLoading } = useQuery<GamblingLeagueGame[]>({
    queryKey: ["/api/gambling-league/admin/weeks", selectedWeek, "games"],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/admin/weeks/${selectedWeek}/games`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const addGameMutation = useMutation({
    mutationFn: async (data: typeof gameForm) => {
      return await apiRequest("POST", `/api/gambling-league/admin/weeks/${selectedWeek}/games`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/admin/weeks", selectedWeek, "games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/weeks", selectedWeek, "settings"] });
      toast({ title: "Game added" });
      setCreateDialogOpen(false);
      setGameForm({ week: selectedWeek, homeTeam: "", awayTeam: "", spread: "0", gameTime: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateResultMutation = useMutation({
    mutationFn: async ({ gameId, homeScore, awayScore }: { gameId: string; homeScore: number; awayScore: number }) => {
      return await apiRequest("POST", `/api/gambling-league/admin/games/${gameId}/results`, { homeScore, awayScore });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/admin/weeks", selectedWeek, "games"] });
      toast({ title: "Result saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      return await apiRequest("DELETE", `/api/gambling-league/admin/games/${gameId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/admin/weeks", selectedWeek, "games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/weeks", selectedWeek, "settings"] });
      toast({ title: "Game deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: weekSettings } = useQuery<{ week: number; minPicks: number; gameCount: number }>({
    queryKey: ["/api/gambling-league/weeks", selectedWeek, "settings"],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/weeks/${selectedWeek}/settings`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const saveMinPicksMutation = useMutation({
    mutationFn: async (minPicks: number) => {
      return await apiRequest("PUT", `/api/gambling-league/admin/weeks/${selectedWeek}/settings`, { minPicks });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/weeks", selectedWeek, "settings"] });
      setMinPicksInput(null);
      toast({ title: "Minimum picks saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: adminLeagues = [] } = useQuery<GamblingLeagueLeague[]>({
    queryKey: ["/api/gambling-league/admin/leagues"],
    queryFn: async () => {
      const res = await fetch("/api/gambling-league/admin/leagues", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const finalizeWeekMutation = useMutation({
    mutationFn: async ({ leagueId, week }: { leagueId: string; week: number }) => {
      return await apiRequest("POST", `/api/gambling-league/admin/leagues/${leagueId}/finalize-week`, { week });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/admin/leagues"] });
      toast({ title: "Week finalized", description: "Matchups scored and week advanced." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetAllLeaguesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/gambling-league/admin/reset-all-leagues", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/admin/weeks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/leagues"] });
      setShowResetDialog(false);
      setSelectedWeek(1);
      toast({ title: "All leagues have been reset" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleUpdateResult = (gameId: string) => {
    const inputs = resultInputs[gameId];
    if (!inputs?.homeScore || !inputs?.awayScore) {
      toast({ title: "Error", description: "Please enter both scores", variant: "destructive" });
      return;
    }
    updateResultMutation.mutate({
      gameId,
      homeScore: parseInt(inputs.homeScore),
      awayScore: parseInt(inputs.awayScore),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-lg font-semibold">Week {selectedWeek} Games ({games.length})</h3>
        <div className="flex items-center gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-gl-create-game">
                <Plus className="h-4 w-4 mr-2" />
                Add Game
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Game for Week {selectedWeek}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addGameMutation.mutate(gameForm); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="awayTeam">Away Team</Label>
                    <Input
                      id="awayTeam"
                      value={gameForm.awayTeam}
                      onChange={(e) => setGameForm({ ...gameForm, awayTeam: e.target.value })}
                      placeholder="e.g. Kansas City Chiefs"
                      data-testid="input-gl-away-team"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homeTeam">Home Team</Label>
                    <Input
                      id="homeTeam"
                      value={gameForm.homeTeam}
                      onChange={(e) => setGameForm({ ...gameForm, homeTeam: e.target.value })}
                      placeholder="e.g. Philadelphia Eagles"
                      data-testid="input-gl-home-team"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spread">Spread (Home Team)</Label>
                    <Input
                      id="spread"
                      type="number"
                      step="0.5"
                      value={gameForm.spread}
                      onChange={(e) => setGameForm({ ...gameForm, spread: e.target.value })}
                      data-testid="input-gl-spread"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gameTime">Game Time (ET)</Label>
                    <Input
                      id="gameTime"
                      type="datetime-local"
                      value={gameForm.gameTime}
                      onChange={(e) => setGameForm({ ...gameForm, gameTime: e.target.value })}
                      data-testid="input-gl-game-time"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={addGameMutation.isPending} data-testid="button-gl-submit-game">
                  {addGameMutation.isPending ? "Adding..." : "Add Game"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="destructive" size="sm" onClick={() => setShowResetDialog(true)} data-testid="button-gl-reset-leagues">
            <Trophy className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="games" className="space-y-4">
        <TabsList>
          <TabsTrigger value="games">Manage Games</TabsTrigger>
          <TabsTrigger value="results">Enter Results</TabsTrigger>
          <TabsTrigger value="leagues">Leagues</TabsTrigger>
        </TabsList>

        <TabsContent value="leagues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">League Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {adminLeagues.length === 0 && (
                <p className="text-sm text-muted-foreground">No leagues yet.</p>
              )}
              {adminLeagues.map((league) => (
                <div key={league.id} className="flex items-center justify-between gap-4 rounded-md border p-3" data-testid={`admin-league-${league.id}`}>
                  <div>
                    <p className="font-medium">{league.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Status: {league.status} · Week {league.currentWeek}
                    </p>
                  </div>
                  {league.status === "active" && (
                    <Button
                      size="sm"
                      onClick={() => finalizeWeekMutation.mutate({ leagueId: league.id, week: league.currentWeek })}
                      disabled={finalizeWeekMutation.isPending}
                      data-testid={`button-finalize-${league.id}`}
                    >
                      Finalize Week {league.currentWeek}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 17 }, (_, i) => i + 1).map((week) => (
              <Button
                key={week}
                variant={selectedWeek === week ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedWeek(week);
                  setGameForm({ ...gameForm, week });
                  setMinPicksInput(null);
                }}
                data-testid={`button-gl-week-${week}`}
              >
                Week {week}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Minimum Picks Required — Week {selectedWeek}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="space-y-1">
                  <Label htmlFor="minPicks" className="text-xs">
                    Users must pick at least this many games (0–{games.length})
                  </Label>
                  <Input
                    id="minPicks"
                    type="number"
                    min={0}
                    max={games.length}
                    className="w-24"
                    value={minPicksInput ?? (weekSettings?.minPicks?.toString() || "0")}
                    onChange={(e) => setMinPicksInput(e.target.value)}
                    data-testid="input-gl-min-picks"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const val = parseInt(minPicksInput ?? (weekSettings?.minPicks?.toString() || "0"));
                    if (isNaN(val) || val < 0 || val > games.length) {
                      toast({ title: "Error", description: `Minimum picks must be between 0 and ${games.length}`, variant: "destructive" });
                      return;
                    }
                    saveMinPicksMutation.mutate(val);
                  }}
                  disabled={saveMinPicksMutation.isPending}
                  data-testid="button-gl-save-min-picks"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <p className="text-xs text-muted-foreground pb-2">
                  Users who make fewer picks automatically lose their matchup for the week.
                </p>
              </div>
            </CardContent>
          </Card>

          {games.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matchup</TableHead>
                  <TableHead>Spread</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id} data-testid={`row-gl-game-${game.id}`}>
                    <TableCell className="font-medium">
                      {game.awayTeam} @ {game.homeTeam}
                    </TableCell>
                    <TableCell>
                      {game.homeTeam} {parseFloat(game.spread) > 0 ? '+' : ''}{game.spread}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatInEastern(game.gameTime, "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={game.isComplete ? "secondary" : "outline"}>
                        {game.isComplete ? `Final: ${game.awayScore}-${game.homeScore}` : "Scheduled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => deleteGameMutation.mutate(game.id)}
                        disabled={deleteGameMutation.isPending}
                        data-testid={`button-gl-delete-${game.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No games for Week {selectedWeek}</p>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 17 }, (_, i) => i + 1).map((week) => (
              <Button
                key={week}
                variant={selectedWeek === week ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedWeek(week)}
                data-testid={`button-gl-results-week-${week}`}
              >
                Week {week}
              </Button>
            ))}
          </div>

          {games.length > 0 ? (
            <div className="space-y-4">
              {games.map((game) => (
                <div key={game.id} className="p-4 border rounded-md" data-testid={`result-gl-game-${game.id}`}>
                  <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                    <div className="font-medium">{game.awayTeam} @ {game.homeTeam}</div>
                    <Badge variant={game.isComplete ? "secondary" : "outline"}>
                      {game.isComplete ? "Complete" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-end gap-4 flex-wrap">
                    <div className="space-y-1">
                      <Label className="text-xs">{game.awayTeam}</Label>
                      <Input
                        type="number"
                        min="0"
                        className="w-20"
                        value={resultInputs[game.id]?.awayScore ?? (game.awayScore?.toString() || "")}
                        onChange={(e) => setResultInputs({
                          ...resultInputs,
                          [game.id]: { ...resultInputs[game.id], awayScore: e.target.value }
                        })}
                        data-testid={`input-gl-away-score-${game.id}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{game.homeTeam}</Label>
                      <Input
                        type="number"
                        min="0"
                        className="w-20"
                        value={resultInputs[game.id]?.homeScore ?? (game.homeScore?.toString() || "")}
                        onChange={(e) => setResultInputs({
                          ...resultInputs,
                          [game.id]: { ...resultInputs[game.id], homeScore: e.target.value }
                        })}
                        data-testid={`input-gl-home-score-${game.id}`}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateResult(game.id)}
                      disabled={updateResultMutation.isPending}
                      data-testid={`button-gl-save-result-${game.id}`}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No games for Week {selectedWeek}</p>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Leagues?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all leagues to Week 1 and clear all picks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetAllLeaguesMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset All Leagues
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

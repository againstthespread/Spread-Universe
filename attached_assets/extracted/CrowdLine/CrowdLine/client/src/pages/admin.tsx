import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Trash2, ArrowLeft, Users, Edit } from "lucide-react";
import type { Game } from "@shared/schema";
import { format } from "date-fns";
import { easternToUTC, formatInEastern } from "@/lib/timezone";

export default function Admin() {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [gameDate, setGameDate] = useState("");
  const [gameTime, setGameTime] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [actualHomeScore, setActualHomeScore] = useState("");
  const [actualAwayScore, setActualAwayScore] = useState("");
  const [vegasSpread, setVegasSpread] = useState("");
  const [vegasOverUnder, setVegasOverUnder] = useState("");
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/admin/games"],
  });

  const addGameMutation = useMutation({
    mutationFn: async (data: { homeTeam: string; awayTeam: string; gameDate: string }) => {
      return await apiRequest("POST", "/api/admin/games", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Game added successfully",
      });
      setHomeTeam("");
      setAwayTeam("");
      setGameDate("");
      setGameTime("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      return await apiRequest("DELETE", `/api/admin/games/${gameId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Game deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateResultMutation = useMutation({
    mutationFn: async (data: { gameId: string; actualHomeScore: number; actualAwayScore: number; vegasSpread?: number; vegasOverUnder?: number }) => {
      const { gameId, ...body } = data;
      return await apiRequest("PATCH", `/api/admin/games/${gameId}/result`, { ...body, status: "completed" });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Game results updated successfully",
      });
      setResultDialogOpen(false);
      setSelectedGame(null);
      setActualHomeScore("");
      setActualAwayScore("");
      setVegasSpread("");
      setVegasOverUnder("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    const dateTimeUTC = easternToUTC(gameDate, gameTime);
    addGameMutation.mutate({
      homeTeam,
      awayTeam,
      gameDate: dateTimeUTC,
    });
  };

  const handleOpenResultDialog = (game: Game) => {
    setSelectedGame(game);
    setActualHomeScore(game.actualHomeScore?.toString() || "");
    setActualAwayScore(game.actualAwayScore?.toString() || "");
    setVegasSpread(game.vegasSpread || "");
    setVegasOverUnder(game.vegasOverUnder || "");
    setResultDialogOpen(true);
  };

  const handleSubmitResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame) return;

    const homeScore = parseInt(actualHomeScore);
    const awayScore = parseInt(actualAwayScore);

    if (isNaN(homeScore) || isNaN(awayScore)) {
      toast({
        title: "Invalid input",
        description: "Please enter valid scores",
        variant: "destructive",
      });
      return;
    }

    updateResultMutation.mutate({
      gameId: selectedGame.id,
      actualHomeScore: homeScore,
      actualAwayScore: awayScore,
      vegasSpread: vegasSpread ? parseFloat(vegasSpread) : undefined,
      vegasOverUnder: vegasOverUnder ? parseFloat(vegasOverUnder) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild data-testid="button-back">
                <a href="/home">
                  <ArrowLeft className="h-5 w-5" />
                </a>
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-heading tracking-wide">ADMIN DASHBOARD</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage weekly NFL games</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-heading tracking-wide">ADD NEW GAME</CardTitle>
            <CardDescription>Schedule a new NFL game for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddGame} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="away-team">Away Team</Label>
                  <Input
                    id="away-team"
                    data-testid="input-away-team"
                    placeholder="e.g., Kansas City Chiefs"
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home-team">Home Team</Label>
                  <Input
                    id="home-team"
                    data-testid="input-home-team"
                    placeholder="e.g., Buffalo Bills"
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="game-date">Game Date</Label>
                  <Input
                    id="game-date"
                    data-testid="input-game-date"
                    type="date"
                    value={gameDate}
                    onChange={(e) => setGameDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="game-time">Game Time (Eastern Time)</Label>
                  <Input
                    id="game-time"
                    data-testid="input-game-time"
                    type="time"
                    value={gameTime}
                    onChange={(e) => setGameTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full md:w-auto" 
                disabled={addGameMutation.isPending}
                data-testid="button-add-game"
              >
                {addGameMutation.isPending ? "Adding..." : "Add Game"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-heading tracking-wide">SCHEDULED GAMES</CardTitle>
            <CardDescription>All games for the current week</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading games...</div>
            ) : games && games.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matchup</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {games.map((game) => (
                      <TableRow key={game.id}>
                        <TableCell className="font-medium">
                          <div className="font-semibold">{game.awayTeam} @ {game.homeTeam}</div>
                          {game.actualHomeScore !== null && game.actualAwayScore !== null && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Final: {game.awayTeam.split(' ').pop()} {game.actualAwayScore}, {game.homeTeam.split(' ').pop()} {game.actualHomeScore}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatInEastern(game.gameDate, "MMM d, yyyy 'at' h:mm a")} ET
                        </TableCell>
                        <TableCell>
                          <span className="text-sm capitalize">{game.status}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenResultDialog(game)}
                              data-testid={`button-enter-result-${game.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteGameMutation.mutate(game.id)}
                              disabled={deleteGameMutation.isPending}
                              data-testid={`button-delete-game-${game.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No games scheduled yet</p>
                <p className="text-sm text-muted-foreground mt-2">Add your first game above</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Game Result</DialogTitle>
            <DialogDescription>
              {selectedGame && `${selectedGame.awayTeam} @ ${selectedGame.homeTeam}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitResult}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actual-away-score">{selectedGame?.awayTeam.split(' ').pop()} Score</Label>
                  <Input
                    id="actual-away-score"
                    type="number"
                    min="0"
                    value={actualAwayScore}
                    onChange={(e) => setActualAwayScore(e.target.value)}
                    required
                    data-testid="input-actual-away-score"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actual-home-score">{selectedGame?.homeTeam.split(' ').pop()} Score</Label>
                  <Input
                    id="actual-home-score"
                    type="number"
                    min="0"
                    value={actualHomeScore}
                    onChange={(e) => setActualHomeScore(e.target.value)}
                    required
                    data-testid="input-actual-home-score"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vegas-spread">Vegas Spread (optional)</Label>
                  <Input
                    id="vegas-spread"
                    type="number"
                    step="0.5"
                    placeholder="e.g., -3.5"
                    value={vegasSpread}
                    onChange={(e) => setVegasSpread(e.target.value)}
                    data-testid="input-vegas-spread"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vegas-ou">Vegas O/U (optional)</Label>
                  <Input
                    id="vegas-ou"
                    type="number"
                    step="0.5"
                    placeholder="e.g., 48.5"
                    value={vegasOverUnder}
                    onChange={(e) => setVegasOverUnder(e.target.value)}
                    data-testid="input-vegas-ou"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResultDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateResultMutation.isPending} data-testid="button-save-result">
                {updateResultMutation.isPending ? "Saving..." : "Save Result"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

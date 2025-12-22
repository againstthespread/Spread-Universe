import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Game, InsertGame, ROUND_NAMES } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function AdminGamesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      await apiRequest("DELETE", `/api/games/${gameId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game deleted",
        description: "The game has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    setIsDialogOpen(true);
  };

  const handleDelete = (gameId: string) => {
    if (confirm("Are you sure you want to delete this game?")) {
      deleteGameMutation.mutate(gameId);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingGame(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const gamesByRound = games?.reduce((acc, game) => {
    if (!acc[game.round]) {
      acc[game.round] = [];
    }
    acc[game.round].push(game);
    return acc;
  }, {} as Record<string, Game[]>) || {};

  const rounds = ["WILD_CARD", "DIVISIONAL", "CONFERENCE", "SUPER_BOWL"] as const;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Manage Games</h1>
          <p className="text-muted-foreground">
            Add, edit, or remove playoff games
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingGame(null)} data-testid="button-add-game">
              <Plus className="h-4 w-4 mr-2" />
              Add Game
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <GameForm game={editingGame} onClose={handleDialogClose} />
          </DialogContent>
        </Dialog>
      </div>

      {rounds.map((round) => {
        const roundGames = gamesByRound[round] || [];
        if (roundGames.length === 0) return null;

        return (
          <div key={round} className="space-y-4">
            <h2 className="font-display">{ROUND_NAMES[round]}</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {roundGames.map((game) => (
                <Card key={game.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(game.gameDate), "EEE, MMM d 'at' h:mm a")}
                            </span>
                          </div>
                          {game.isComplete && (
                            <Badge variant="secondary">
                              <i className="fas fa-check-circle mr-1"></i>
                              Complete
                            </Badge>
                          )}
                        </div>

                        <div className="text-lg font-medium">
                          <div className="flex items-center gap-2">
                            <span>{game.awayTeam}</span>
                            {game.favoredTeam === "AWAY" && (
                              <Badge variant="outline">
                                {Number(game.spread) > 0 ? '+' : ''}{game.spread}
                              </Badge>
                            )}
                            {game.isComplete && <span className="text-muted-foreground">({game.awayScore})</span>}
                          </div>
                          <div className="text-sm text-muted-foreground my-1">@</div>
                          <div className="flex items-center gap-2">
                            <span>{game.homeTeam}</span>
                            {game.favoredTeam === "HOME" && (
                              <Badge variant="outline">
                                {Number(game.spread) > 0 ? '+' : ''}{game.spread}
                              </Badge>
                            )}
                            {game.isComplete && <span className="text-muted-foreground">({game.homeScore})</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(game)}
                          data-testid={`button-edit-game-${game.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(game.id)}
                          disabled={deleteGameMutation.isPending}
                          data-testid={`button-delete-game-${game.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {games?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No games added yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Add Game" to create your first playoff matchup
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GameForm({ game, onClose }: { game: Game | null; onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    round: game?.round || "WILD_CARD",
    homeTeam: game?.homeTeam || "",
    awayTeam: game?.awayTeam || "",
    spread: game?.spread || "",
    favoredTeam: game?.favoredTeam || "HOME",
    gameDate: game?.gameDate ? format(new Date(game.gameDate), "yyyy-MM-dd'T'HH:mm") : "",
    pickDeadline: game?.pickDeadline ? format(new Date(game.pickDeadline), "yyyy-MM-dd'T'HH:mm") : "",
  });

  const createGameMutation = useMutation({
    mutationFn: async (data: InsertGame) => {
      const res = await apiRequest("POST", "/api/games", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game created",
        description: "The game has been added successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateGameMutation = useMutation({
    mutationFn: async (data: Partial<Game>) => {
      const res = await apiRequest("PUT", `/api/games/${game?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game updated",
        description: "The game has been updated successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit: any = {
      ...formData,
      gameDate: new Date(formData.gameDate),
      pickDeadline: formData.pickDeadline ? new Date(formData.pickDeadline) : null,
    };
    
    if (game) {
      updateGameMutation.mutate(dataToSubmit);
    } else {
      createGameMutation.mutate(dataToSubmit as InsertGame);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{game ? "Edit Game" : "Add New Game"}</DialogTitle>
        <DialogDescription>
          {game ? "Update game details" : "Enter the details for a new playoff game"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="round">Round</Label>
          <Select
            value={formData.round}
            onValueChange={(value) => setFormData({ ...formData, round: value as any })}
          >
            <SelectTrigger id="round" data-testid="select-round">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WILD_CARD">Wild Card</SelectItem>
              <SelectItem value="DIVISIONAL">Divisional</SelectItem>
              <SelectItem value="CONFERENCE">Conference</SelectItem>
              <SelectItem value="SUPER_BOWL">Super Bowl</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="awayTeam">Away Team</Label>
          <Input
            id="awayTeam"
            value={formData.awayTeam}
            onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
            placeholder="e.g., KC"
            required
            data-testid="input-away-team"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="homeTeam">Home Team</Label>
          <Input
            id="homeTeam"
            value={formData.homeTeam}
            onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
            placeholder="e.g., BUF"
            required
            data-testid="input-home-team"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="spread">Spread</Label>
            <Input
              id="spread"
              value={formData.spread}
              onChange={(e) => setFormData({ ...formData, spread: e.target.value })}
              placeholder="e.g., -3.5"
              required
              data-testid="input-spread"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="favoredTeam">Favored Team</Label>
            <Select
              value={formData.favoredTeam}
              onValueChange={(value) => setFormData({ ...formData, favoredTeam: value as any })}
            >
              <SelectTrigger id="favoredTeam" data-testid="select-favored-team">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOME">Home</SelectItem>
                <SelectItem value="AWAY">Away</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gameDate">Game Date & Time</Label>
          <Input
            id="gameDate"
            type="datetime-local"
            value={formData.gameDate}
            onChange={(e) => setFormData({ ...formData, gameDate: e.target.value })}
            required
            data-testid="input-game-date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickDeadline">Pick Deadline (Optional)</Label>
          <Input
            id="pickDeadline"
            type="datetime-local"
            value={formData.pickDeadline}
            onChange={(e) => setFormData({ ...formData, pickDeadline: e.target.value })}
            data-testid="input-pick-deadline"
          />
          <p className="text-sm text-muted-foreground">
            If not set, picks will be locked at game time
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            type="submit" 
            disabled={createGameMutation.isPending || updateGameMutation.isPending}
            className="flex-1"
            data-testid="button-save-game"
          >
            {createGameMutation.isPending || updateGameMutation.isPending 
              ? "Saving..." 
              : game ? "Update Game" : "Create Game"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}

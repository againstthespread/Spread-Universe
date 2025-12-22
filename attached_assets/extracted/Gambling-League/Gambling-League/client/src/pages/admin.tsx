import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Save, Trophy, Pencil, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Game, InsertGame, UpdateGameResult } from "@shared/schema";

// Helper to determine if a UTC date falls in Eastern Daylight Time
// DST starts: Second Sunday in March at 2:00 AM ET (7:00 AM UTC in EST, 6:00 AM UTC in EDT)
// DST ends: First Sunday in November at 2:00 AM ET
function isEasternDST(utcDate: Date): boolean {
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth();
  const day = utcDate.getUTCDate();
  const hour = utcDate.getUTCHours();
  
  // Outside the possible DST range
  if (month < 2 || month > 10) return false; // Before March or after November
  if (month > 2 && month < 10) return true; // April through October
  
  // Helper to find the nth occurrence of a day of week in a month
  function getNthSundayOfMonth(year: number, month: number, n: number): number {
    const firstDay = new Date(year, month, 1);
    const firstSunday = ((7 - firstDay.getDay()) % 7) + 1; // Day of first Sunday
    return firstSunday + ((n - 1) * 7);
  }
  
  if (month === 2) {
    // March: DST starts on second Sunday at 2:00 AM ET (which is 7:00 UTC before, 6:00 UTC after)
    const secondSunday = getNthSundayOfMonth(year, 2, 2);
    if (day < secondSunday) return false;
    if (day > secondSunday) return true;
    // On the transition day, DST starts at 7:00 UTC (2:00 AM EST becomes 3:00 AM EDT)
    return hour >= 7;
  }
  
  if (month === 10) {
    // November: DST ends on first Sunday at 2:00 AM ET (which is 6:00 UTC during DST)
    const firstSunday = getNthSundayOfMonth(year, 10, 1);
    if (day < firstSunday) return true;
    if (day > firstSunday) return false;
    // On the transition day, DST ends at 6:00 UTC (2:00 AM EDT becomes 1:00 AM EST)
    return hour < 6;
  }
  
  return false;
}

// Helper to convert UTC Date to Eastern Time for datetime-local input
function convertUTCToEasternForInput(utcDateOrString: Date | string): string {
  const utcDate = typeof utcDateOrString === 'string' ? new Date(utcDateOrString) : utcDateOrString;
  
  // Determine if we're in EST or EDT
  const isDST = isEasternDST(utcDate);
  
  // Eastern Time offset: EST is UTC-5, EDT is UTC-4
  const offsetHours = isDST ? 4 : 5;
  
  // Subtract offset to get Eastern Time
  const easternTime = new Date(utcDate.getTime() - (offsetHours * 60 * 60 * 1000));
  
  // Format for datetime-local input: YYYY-MM-DDTHH:MM
  const year = easternTime.getUTCFullYear();
  const monthStr = String(easternTime.getUTCMonth() + 1).padStart(2, '0');
  const dayStr = String(easternTime.getUTCDate()).padStart(2, '0');
  const hourStr = String(easternTime.getUTCHours()).padStart(2, '0');
  const minuteStr = String(easternTime.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}`;
}

// Helper to format UTC date to Eastern Time for display
function formatEasternTime(utcDateOrString: Date | string): string {
  const utcDate = typeof utcDateOrString === 'string' ? new Date(utcDateOrString) : utcDateOrString;
  
  // Determine DST
  const isDST = isEasternDST(utcDate);
  
  const offsetHours = isDST ? 4 : 5;
  const easternTime = new Date(utcDate.getTime() - (offsetHours * 60 * 60 * 1000));
  
  // Format as readable string
  return easternTime.toLocaleString('en-US', {
    timeZone: 'UTC', // We already adjusted for ET, display as-is
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) + ' ET';
}

export default function AdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You must be an admin to access this page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, authLoading, navigate, toast]);

  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [gameForm, setGameForm] = useState<any>({
    week: 1,
    homeTeam: "",
    awayTeam: "",
    spread: "0",
    gameTime: "",
  });
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deletingGame, setDeletingGame] = useState<Game | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const { data: games = [], isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/admin/weeks", selectedWeek, "games"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/weeks/${selectedWeek}/games`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!user?.isAdmin,
  });

  const addGameMutation = useMutation({
    mutationFn: async (data: InsertGame) => {
      return await apiRequest("POST", `/api/admin/weeks/${selectedWeek}/games`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/weeks", selectedWeek, "games"] });
      toast({
        title: "Success",
        description: "Game added successfully!",
      });
      setGameForm({
        week: selectedWeek,
        homeTeam: "",
        awayTeam: "",
        spread: "0",
        gameTime: "",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to add game",
        variant: "destructive",
      });
    },
  });

  const updateResultMutation = useMutation({
    mutationFn: async ({ gameId, data }: { gameId: string; data: UpdateGameResult }) => {
      return await apiRequest("POST", `/api/admin/games/${gameId}/results`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/weeks", selectedWeek, "games"] });
      toast({
        title: "Success",
        description: "Game result updated and picks calculated!",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update result",
        variant: "destructive",
      });
    },
  });

  const updateGameMutation = useMutation({
    mutationFn: async ({ gameId, data }: { gameId: string; data: Partial<InsertGame> }) => {
      return await apiRequest("PATCH", `/api/admin/games/${gameId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/weeks", selectedWeek, "games"] });
      setEditingGame(null);
      toast({
        title: "Success",
        description: "Game updated successfully!",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update game",
        variant: "destructive",
      });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      return await apiRequest("DELETE", `/api/admin/games/${gameId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/weeks", selectedWeek, "games"] });
      setDeletingGame(null);
      toast({
        title: "Success",
        description: "Game deleted successfully!",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete game",
        variant: "destructive",
      });
    },
  });

  const resetAllLeaguesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/reset-all-leagues", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/weeks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      setShowResetDialog(false);
      setSelectedWeek(1);
      toast({
        title: "Success",
        description: "All leagues have been reset to Week 1!",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to reset leagues",
        variant: "destructive",
      });
    },
  });

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameForm.homeTeam || !gameForm.awayTeam || !gameForm.gameTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addGameMutation.mutate(gameForm as InsertGame);
  };

  const handleUpdateResult = (gameId: string, homeScore: string, awayScore: string) => {
    if (!homeScore || !awayScore) {
      toast({
        title: "Error",
        description: "Please enter both scores",
        variant: "destructive",
      });
      return;
    }
    updateResultMutation.mutate({
      gameId,
      data: {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
      },
    });
  };

  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    setEditForm({
      week: game.week,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      spread: game.spread,
      // Convert UTC to Eastern Time for the datetime-local input
      gameTime: convertUTCToEasternForInput(game.gameTime),
    });
  };

  const handleSaveEdit = () => {
    if (!editingGame || !editForm.homeTeam || !editForm.awayTeam || !editForm.gameTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    updateGameMutation.mutate({
      gameId: editingGame.id,
      data: editForm,
    });
  };

  const handleDeleteGame = () => {
    if (!deletingGame) return;
    deleteGameMutation.mutate(deletingGame.id);
  };

  if (authLoading || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-heading font-bold text-primary">Admin Panel</h1>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              data-testid="button-reset-all-leagues"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Restart All Leagues
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="games" className="space-y-6">
          <TabsList data-testid="tabs-admin">
            <TabsTrigger value="games" data-testid="tab-games">Manage Games</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">Enter Results</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="space-y-6">
            {/* Week Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 17 }, (_, i) => i + 1).map((week) => (
                    <Button
                      key={week}
                      variant={selectedWeek === week ? "default" : "outline"}
                      onClick={() => {
                        setSelectedWeek(week);
                        setGameForm({ ...gameForm, week });
                      }}
                      data-testid={`button-week-${week}`}
                    >
                      Week {week}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Add Game Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Game for Week {selectedWeek}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddGame} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="awayTeam">Away Team</Label>
                      <Input
                        id="awayTeam"
                        value={gameForm.awayTeam}
                        onChange={(e) => setGameForm({ ...gameForm, awayTeam: e.target.value })}
                        placeholder="e.g., Kansas City Chiefs"
                        data-testid="input-away-team"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="homeTeam">Home Team</Label>
                      <Input
                        id="homeTeam"
                        value={gameForm.homeTeam}
                        onChange={(e) => setGameForm({ ...gameForm, homeTeam: e.target.value })}
                        placeholder="e.g., Philadelphia Eagles"
                        data-testid="input-home-team"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="spread">Spread (Home Team)</Label>
                      <Input
                        id="spread"
                        type="number"
                        step="0.5"
                        value={gameForm.spread}
                        onChange={(e) => setGameForm({ ...gameForm, spread: e.target.value })}
                        placeholder="e.g., -3.5"
                        data-testid="input-spread"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gameTime">Game Time</Label>
                      <Input
                        id="gameTime"
                        type="datetime-local"
                        value={gameForm.gameTime}
                        onChange={(e) => setGameForm({ ...gameForm, gameTime: e.target.value })}
                        data-testid="input-game-time"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={addGameMutation.isPending} data-testid="button-add-game">
                    <Plus className="w-4 h-4 mr-2" />
                    {addGameMutation.isPending ? "Adding..." : "Add Game"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Games List */}
            <Card>
              <CardHeader>
                <CardTitle>Games for Week {selectedWeek}</CardTitle>
              </CardHeader>
              <CardContent>
                {gamesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : games.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No games added for this week
                  </div>
                ) : (
                  <div className="space-y-3">
                    {games.map((game) => (
                      <div
                        key={game.id}
                        className="p-4 border rounded-md"
                        data-testid={`game-${game.id}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-semibold">
                              {game.awayTeam} @ {game.homeTeam}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Spread: {game.homeTeam} {parseFloat(game.spread) > 0 ? '+' : ''}{game.spread}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatEasternTime(game.gameTime)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={game.isComplete ? "default" : "secondary"}>
                              {game.isComplete ? "Complete" : "Scheduled"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditGame(game)}
                              data-testid={`button-edit-game-${game.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingGame(game)}
                              data-testid={`button-delete-game-${game.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {/* Week Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 17 }, (_, i) => i + 1).map((week) => (
                    <Button
                      key={week}
                      variant={selectedWeek === week ? "default" : "outline"}
                      onClick={() => setSelectedWeek(week)}
                      data-testid={`button-results-week-${week}`}
                    >
                      Week {week}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Results Entry */}
            <Card>
              <CardHeader>
                <CardTitle>Enter Results for Week {selectedWeek}</CardTitle>
              </CardHeader>
              <CardContent>
                {gamesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : games.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No games for this week
                  </div>
                ) : (
                  <div className="space-y-4">
                    {games.map((game) => (
                      <Card key={game.id} data-testid={`result-card-${game.id}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {game.awayTeam} @ {game.homeTeam}
                            </CardTitle>
                            {game.isComplete && (
                              <Badge variant="default">
                                <Trophy className="w-3 h-3 mr-1" />
                                Complete
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-2">
                              <Label htmlFor={`away-${game.id}`}>{game.awayTeam} Score</Label>
                              <Input
                                id={`away-${game.id}`}
                                type="number"
                                defaultValue={game.awayScore || ""}
                                placeholder="0"
                                data-testid={`input-away-score-${game.id}`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`home-${game.id}`}>{game.homeTeam} Score</Label>
                              <Input
                                id={`home-${game.id}`}
                                type="number"
                                defaultValue={game.homeScore || ""}
                                placeholder="0"
                                data-testid={`input-home-score-${game.id}`}
                              />
                            </div>
                            <Button
                              onClick={() => {
                                const awayInput = document.getElementById(`away-${game.id}`) as HTMLInputElement;
                                const homeInput = document.getElementById(`home-${game.id}`) as HTMLInputElement;
                                handleUpdateResult(game.id, homeInput.value, awayInput.value);
                              }}
                              disabled={updateResultMutation.isPending}
                              data-testid={`button-save-result-${game.id}`}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Result
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Game Dialog */}
      <Dialog open={!!editingGame} onOpenChange={(open) => !open && setEditingGame(null)}>
        <DialogContent data-testid="dialog-edit-game">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
            <DialogDescription>
              Update game details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-awayTeam">Away Team</Label>
                <Input
                  id="edit-awayTeam"
                  value={editForm.awayTeam || ""}
                  onChange={(e) => setEditForm({ ...editForm, awayTeam: e.target.value })}
                  placeholder="e.g., Kansas City Chiefs"
                  data-testid="input-edit-away-team"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-homeTeam">Home Team</Label>
                <Input
                  id="edit-homeTeam"
                  value={editForm.homeTeam || ""}
                  onChange={(e) => setEditForm({ ...editForm, homeTeam: e.target.value })}
                  placeholder="e.g., Philadelphia Eagles"
                  data-testid="input-edit-home-team"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-spread">Spread (Home Team)</Label>
                <Input
                  id="edit-spread"
                  type="number"
                  step="0.5"
                  value={editForm.spread || ""}
                  onChange={(e) => setEditForm({ ...editForm, spread: e.target.value })}
                  placeholder="e.g., -3.5"
                  data-testid="input-edit-spread"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gameTime">Game Time</Label>
                <Input
                  id="edit-gameTime"
                  type="datetime-local"
                  value={editForm.gameTime || ""}
                  onChange={(e) => setEditForm({ ...editForm, gameTime: e.target.value })}
                  data-testid="input-edit-game-time"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGame(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateGameMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateGameMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingGame} onOpenChange={(open) => !open && setDeletingGame(null)}>
        <AlertDialogContent data-testid="dialog-delete-game">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this game?
              {deletingGame && (
                <div className="mt-2 font-semibold">
                  {deletingGame.awayTeam} @ {deletingGame.homeTeam}
                </div>
              )}
              <div className="mt-2 text-destructive">
                This will also delete all picks associated with this game. This action cannot be undone.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGame}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteGameMutation.isPending ? "Deleting..." : "Delete Game"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset All Leagues Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent data-testid="dialog-reset-all-leagues">
          <AlertDialogHeader>
            <AlertDialogTitle>Restart All Leagues</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restart all leagues?
              <div className="mt-4 space-y-2 text-destructive font-semibold">
                <div>⚠️ This will:</div>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Delete all NFL games</li>
                  <li>Delete all user picks</li>
                  <li>Delete all weekly matchups</li>
                  <li>Reset all leagues to Week 1</li>
                  <li>Clear all standings (matchup history deleted)</li>
                </ul>
              </div>
              <div className="mt-4 font-semibold">
                This action cannot be undone!
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetAllLeaguesMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-reset"
            >
              {resetAllLeaguesMutation.isPending ? "Resetting..." : "Restart All Leagues"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

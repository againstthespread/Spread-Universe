import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Clock, CheckCircle2, StickyNote, XCircle, Minus } from "lucide-react";
import type { GamblingLeagueGameWithPick } from "@shared/schema";

interface PicksTabProps {
  leagueId: string;
  currentWeek: number;
}

export function PicksTab({ leagueId, currentWeek }: PicksTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [picks, setPicks] = useState<Record<string, 'home' | 'away'>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [clearedPicks, setClearedPicks] = useState<Set<string>>(new Set());
  const [timeUntilLock, setTimeUntilLock] = useState<string>("");

  const { data: games = [], isLoading } = useQuery<GamblingLeagueGameWithPick[]>({
    queryKey: ["/api/gambling-league/weeks", currentWeek, "games", leagueId],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/weeks/${currentWeek}/games/${leagueId}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const firstGameTime = useMemo(() => {
    if (!games || games.length === 0) return null;
    const firstGame = games.reduce((earliest, game) => {
      if (!earliest || new Date(game.gameTime) < new Date(earliest.gameTime)) {
        return game;
      }
      return earliest;
    });
    return firstGame.gameTime;
  }, [games]);

  useEffect(() => {
    const calculateLockTime = () => {
      if (!firstGameTime) return "No games scheduled";
      const now = new Date();
      const lockTime = new Date(firstGameTime);
      const diff = lockTime.getTime() - now.getTime();
      if (diff <= 0) return "Locked";
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    };
    setTimeUntilLock(calculateLockTime());
    const interval = setInterval(() => setTimeUntilLock(calculateLockTime()), 60000);
    return () => clearInterval(interval);
  }, [firstGameTime]);

  const gamesKey = useMemo(() => {
    return games.map(g => `${g.id}-${g.userPick?.pickedTeam || 'none'}`).join(',');
  }, [games]);

  useEffect(() => {
    const existingPicks: Record<string, 'home' | 'away'> = {};
    const existingNotes: Record<string, string> = {};
    games.forEach(game => {
      if (game.userPick) {
        existingPicks[game.id] = game.userPick.pickedTeam as 'home' | 'away';
        if (game.userPick.note) existingNotes[game.id] = game.userPick.note;
      }
    });
    setPicks(existingPicks);
    setNotes(existingNotes);
    setClearedPicks(new Set());
  }, [gamesKey]);

  const isLocked = timeUntilLock === "Locked";

  const submitMutation = useMutation({
    mutationFn: async () => {
      const pickData = Object.entries(picks).map(([gameId, pickedTeam]) => ({
        gameId,
        leagueId,
        week: currentWeek,
        pickedTeam,
        note: notes[gameId] || null,
      }));
      Array.from(clearedPicks).forEach(gameId => {
        if (!picks[gameId]) {
          pickData.push({ gameId, leagueId, week: currentWeek, pickedTeam: null as any, note: null });
        }
      });
      return await apiRequest("POST", "/api/gambling-league/picks", { picks: pickData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/weeks", currentWeek, "games", leagueId] });
      toast({ title: "Success", description: "Picks submitted successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to submit picks", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (Object.keys(picks).length === 0 && clearedPicks.size === 0) {
      toast({ title: "No changes", description: "Make at least one pick", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

  const handleClearPick = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (game?.userPick) setClearedPicks(prev => new Set([...Array.from(prev), gameId]));
    const newPicks = { ...picks };
    delete newPicks[gameId];
    setPicks(newPicks);
    const newNotes = { ...notes };
    delete newNotes[gameId];
    setNotes(newNotes);
  };

  if (isLoading) {
    return <Card><CardContent className="p-12 text-center text-muted-foreground">Loading games...</CardContent></Card>;
  }

  if (games.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Games Available</h3>
          <p className="text-muted-foreground">Games for Week {currentWeek} haven't been added yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className={isLocked ? "border-destructive" : "border-accent"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isLocked ? (
              <>
                <Lock className="w-5 h-5 text-destructive" />
                <span className="text-destructive">Picks Locked</span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-accent" />
                <span>Time Until Lock: {timeUntilLock}</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isLocked ? "Picks are locked for this week." : firstGameTime ? (
              <>All picks must be submitted before {new Date(firstGameTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}</>
            ) : "Waiting for games"}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {games.map((game) => (
          <Card key={game.id} data-testid={`card-game-${game.id}`}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg">{game.awayTeam} @ {game.homeTeam}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {game.isComplete && game.userPick && (
                    game.userPick.isPush ? (
                      <Badge variant="secondary"><Minus className="w-3 h-3 mr-1" />Push</Badge>
                    ) : game.userPick.isCorrect !== undefined && (
                      <Badge variant={game.userPick.isCorrect ? "default" : "destructive"}>
                        {game.userPick.isCorrect ? "Correct" : "Incorrect"}
                      </Badge>
                    )
                  )}
                  {!isLocked && picks[game.id] && (
                    <Button variant="ghost" size="sm" onClick={() => handleClearPick(game.id)} data-testid={`button-clear-pick-${game.id}`}>
                      <XCircle className="w-4 h-4 mr-1" />Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Spread: {game.homeTeam} {parseFloat(game.spread) > 0 ? '+' : ''}{game.spread}
                </div>
                <RadioGroup
                  value={picks[game.id] || ""}
                  onValueChange={(value) => {
                    setPicks({ ...picks, [game.id]: value as 'home' | 'away' });
                    if (clearedPicks.has(game.id)) {
                      const newClearedPicks = new Set(Array.from(clearedPicks));
                      newClearedPicks.delete(game.id);
                      setClearedPicks(newClearedPicks);
                    }
                  }}
                  disabled={isLocked}
                >
                  <div className="flex items-center space-x-2 p-3 rounded-md hover-elevate">
                    <RadioGroupItem value="away" id={`${game.id}-away`} data-testid={`pick-away-${game.id}`} />
                    <Label htmlFor={`${game.id}-away`} className="flex-1 cursor-pointer">{game.awayTeam}</Label>
                    {picks[game.id] === 'away' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-md hover-elevate">
                    <RadioGroupItem value="home" id={`${game.id}-home`} data-testid={`pick-home-${game.id}`} />
                    <Label htmlFor={`${game.id}-home`} className="flex-1 cursor-pointer">
                      {game.homeTeam} ({parseFloat(game.spread) > 0 ? '+' : ''}{game.spread})
                    </Label>
                    {picks[game.id] === 'home' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                </RadioGroup>
                {!isLocked && picks[game.id] && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor={`note-${game.id}`} className="text-sm flex items-center gap-1">
                      <StickyNote className="w-3 h-3" />Pick Note (optional)
                    </Label>
                    <Textarea
                      id={`note-${game.id}`}
                      placeholder="Why did you pick this team?"
                      value={notes[game.id] || ""}
                      onChange={(e) => setNotes({ ...notes, [game.id]: e.target.value })}
                      className="min-h-[60px] text-sm"
                      maxLength={500}
                      data-testid={`input-note-${game.id}`}
                    />
                    <div className="text-xs text-muted-foreground text-right">{(notes[game.id] || "").length}/500</div>
                  </div>
                )}
                {isLocked && game.userPick?.note && (
                  <div className="pt-2 border-t space-y-1">
                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <StickyNote className="w-3 h-3" />Your Note:
                    </div>
                    <div className="text-sm">{game.userPick.note}</div>
                  </div>
                )}
                {game.isComplete && (
                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium">
                      Final: {game.awayTeam} {game.awayScore} - {game.homeTeam} {game.homeScore}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLocked && (
        <div className="sticky bottom-4 bg-background/95 backdrop-blur-sm p-4 rounded-lg border z-50">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={submitMutation.isPending || (Object.keys(picks).length === 0 && clearedPicks.size === 0)}
            data-testid="button-submit-picks"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Picks"}
          </Button>
        </div>
      )}
    </div>
  );
}

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
import { Lock, Clock, CheckCircle2, StickyNote, XCircle, Minus, AlertTriangle } from "lucide-react";
import type { GamblingLeagueGameWithPick } from "@shared/schema";
import { getPickLockTime, getMainSlateLockTime, isPickLocked } from "@shared/pick-lock";
import { formatInEastern } from "@/lib/timezone";
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
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const { data: games = [], isLoading } = useQuery<GamblingLeagueGameWithPick[]>({
    queryKey: ["/api/gambling-league/weeks", currentWeek, "games", leagueId],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/weeks/${currentWeek}/games/${leagueId}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const { data: weekSettings } = useQuery<{ week: number; minPicks: number; gameCount: number }>({
    queryKey: ["/api/gambling-league/weeks", currentWeek, "settings"],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/weeks/${currentWeek}/settings`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });
  const minPicks = weekSettings?.minPicks ?? 0;

  // Tiered locking: Thu/Fri/Sat games lock 1 min before kickoff;
  // Sun/Mon games all lock at 12:59 PM ET Sunday (see shared/pick-lock).
  const gameLocked = (game: GamblingLeagueGameWithPick) => isPickLocked(game.gameTime, now);
  const allLocked = games.length > 0 && games.every(gameLocked);

  // Deadline for the Sun/Mon main slate (if this week has any).
  const mainSlateLock = useMemo(() => {
    for (const g of games) {
      const lock = getMainSlateLockTime(g.gameTime);
      if (lock) return lock;
    }
    return null;
  }, [games]);

  // Countdown to the next upcoming lock among still-open games.
  const nextLock = useMemo(() => {
    const upcoming = games
      .map(g => getPickLockTime(g.gameTime))
      .filter(t => t > now)
      .sort((a, b) => a.getTime() - b.getTime());
    return upcoming[0] ?? null;
  }, [games, now]);

  const timeUntilLock = useMemo(() => {
    if (!nextLock) return "Locked";
    const diff = nextLock.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, [nextLock, now]);

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


  // Minimum-pick accounting. Picks on locked games are committed; open games
  // reflect the current (unsubmitted) selections. The target mirrors the
  // finalization rule exactly: the configured minimum, capped only by the
  // week's total game count — locked games do NOT lower the requirement.
  const lockedPickCount = useMemo(
    () => games.filter(g => (gameLocked(g) || g.isComplete) && g.userPick).length,
    [games, now]
  );
  const openGameIds = useMemo(
    () => new Set(games.filter(g => !gameLocked(g) && !g.isComplete).map(g => g.id)),
    [games, now]
  );
  const plannedOpenPickCount = Object.keys(picks).filter(id => openGameIds.has(id)).length;
  const plannedTotal = lockedPickCount + plannedOpenPickCount;
  const effectiveMin = Math.min(minPicks, games.length);
  const belowMinimum = effectiveMin > 0 && plannedTotal < effectiveMin;
  // Too many games already locked without a pick: the minimum can no longer be met
  const minUnattainable = belowMinimum && lockedPickCount + openGameIds.size < effectiveMin;

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Only submit picks for games that are still open — locked games would
      // cause the server to reject the whole batch.
      const isOpen = (gameId: string) => {
        const game = games.find(g => g.id === gameId);
        return game ? !gameLocked(game) && !game.isComplete : false;
      };
      const pickData = Object.entries(picks)
        .filter(([gameId]) => isOpen(gameId))
        .map(([gameId, pickedTeam]) => ({
          gameId,
          leagueId,
          week: currentWeek,
          pickedTeam,
          note: notes[gameId] || null,
        }));
      Array.from(clearedPicks).forEach(gameId => {
        if (!picks[gameId] && isOpen(gameId)) {
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
    // Block below-minimum submissions while the minimum is still attainable.
    // If it's no longer attainable, let users submit what they can — the
    // forfeit happens at finalization either way.
    if (belowMinimum && !minUnattainable) {
      toast({
        title: "Minimum picks required",
        description: `You must pick at least ${effectiveMin} game${effectiveMin === 1 ? "" : "s"} this week (you have ${plannedTotal}).`,
        variant: "destructive",
      });
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
      <Card className={allLocked ? "border-destructive" : "border-accent"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {allLocked ? (
              <>
                <Lock className="w-5 h-5 text-destructive" />
                <span className="text-destructive">Picks Locked</span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-accent" />
                <span>Next Lock In: {timeUntilLock}</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allLocked ? (
            <p className="text-sm text-muted-foreground">Picks are locked for this week.</p>
          ) : (
            <div className="text-sm text-muted-foreground space-y-1">
              {mainSlateLock && (
                <p data-testid="text-main-slate-deadline">
                  Games from Sunday 1:00 PM through Tuesday 9:00 AM ET lock together at{" "}
                  {formatInEastern(mainSlateLock, "EEE, MMM d, h:mm a")} ET.
                </p>
              )}
              <p>All other games lock 1 minute before their kickoff.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {effectiveMin > 0 && (
        <Card className={belowMinimum ? "border-destructive" : "border-accent"} data-testid="card-min-picks">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-sm">
              {belowMinimum ? (
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              )}
              <span data-testid="text-min-picks-progress">
                <span className="font-medium">Minimum {effectiveMin} pick{effectiveMin === 1 ? "" : "s"} required this week.</span>{" "}
                You've made {plannedTotal} of {effectiveMin} required pick{effectiveMin === 1 ? "" : "s"}.
                {minUnattainable
                  ? " Too many games have locked without a pick — the minimum can no longer be met and you will forfeit this week's matchup."
                  : belowMinimum
                    ? " If you don't meet the minimum, you automatically lose your matchup."
                    : ""}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {games.map((game) => {
          const isLocked = gameLocked(game) || game.isComplete;
          return (
          <Card key={game.id} data-testid={`card-game-${game.id}`}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg">{game.awayTeam} @ {game.homeTeam}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {isLocked && !game.isComplete && (
                    <Badge variant="secondary" data-testid={`badge-locked-${game.id}`}>
                      <Lock className="w-3 h-3 mr-1" />Locked
                    </Badge>
                  )}
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
                <div className="text-sm text-muted-foreground flex items-center justify-between gap-2 flex-wrap">
                  <span>Spread: {game.homeTeam} {parseFloat(game.spread) > 0 ? '+' : ''}{game.spread}</span>
                  {!game.isComplete && (
                    <span className="text-xs" data-testid={`text-lock-time-${game.id}`}>
                      {isLocked ? "Locked" : `Locks ${formatInEastern(getPickLockTime(game.gameTime), "EEE h:mm a")} ET`}
                    </span>
                  )}
                </div>
                <RadioGroup
                  value={isLocked ? (game.userPick?.pickedTeam ?? "") : (picks[game.id] || "")}
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
          );
        })}
      </div>

      {!allLocked && (
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

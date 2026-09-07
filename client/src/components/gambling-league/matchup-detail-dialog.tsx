import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Target, EyeOff, Check, X, Minus, Clock, StickyNote } from "lucide-react";
import type { GamblingLeagueMatchupWithUsers, GamblingLeagueGame, GamblingLeaguePick } from "@shared/schema";
import { apiFetch } from "@/lib/queryClient";

interface MatchupDetailDialogProps {
  matchup: GamblingLeagueMatchupWithUsers | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MatchupPicksResponse = {
  picksRevealed: boolean;
  user1PickCount: number;
  user2PickCount: number | null;
  games: (GamblingLeagueGame & {
    user1Pick: GamblingLeaguePick | null;
    user2Pick: GamblingLeaguePick | null;
  })[];
};

function PickCell({ pick, game, revealed }: { pick: GamblingLeaguePick | null; game: GamblingLeagueGame; revealed: boolean }) {
  if (!revealed && !pick) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid="pick-hidden">
        <EyeOff className="w-3 h-3" /> Hidden
      </span>
    );
  }
  if (!pick) {
    return <span className="text-xs text-muted-foreground italic">No pick</span>;
  }
  const team = pick.pickedTeam === "home" ? game.homeTeam : game.awayTeam;
  let icon = <Clock className="w-3 h-3 text-muted-foreground" />;
  let cls = "text-muted-foreground";
  if (pick.isPush) {
    icon = <Minus className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />;
    cls = "text-yellow-600 dark:text-yellow-400";
  } else if (pick.isCorrect === true) {
    icon = <Check className="w-3 h-3 text-green-600 dark:text-green-400" />;
    cls = "text-green-600 dark:text-green-400 font-medium";
  } else if (pick.isCorrect === false) {
    icon = <X className="w-3 h-3 text-red-600 dark:text-red-400" />;
    cls = "text-red-600 dark:text-red-400";
  }
  return (
    <div className="space-y-1">
      <span className={`text-xs flex items-center gap-1 ${cls}`}>
        {icon} {team}
      </span>
      {pick.note && (
        <p className="text-xs text-muted-foreground italic flex items-start gap-1" data-testid={`pick-note-${pick.id}`}>
          <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="break-words">{pick.note}</span>
        </p>
      )}
    </div>
  );
}

export function MatchupDetailDialog({ matchup, open, onOpenChange }: MatchupDetailDialogProps) {
  const { user } = useAuth();
  const { data: pickData, isLoading: picksLoading } = useQuery<MatchupPicksResponse>({
    // Key includes the viewer's user id: the response is personalized (own picks
    // are visible pre-kickoff), so cached data must never be shared across accounts.
    queryKey: ["/api/gambling-league/matchups", matchup?.id, "picks", user?.id],
    queryFn: async () => {
      const res = await apiFetch(`/api/gambling-league/matchups/${matchup!.id}/picks`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: open && !!matchup && !!user,
    // Refetch each time the dialog opens so hidden picks reveal after kickoff/grading.
    staleTime: 0,
    refetchOnMount: "always",
  });

  if (!matchup) return null;

  // Pre-reveal, hidden players' picked games aren't listed; summarize with counts.
  const hiddenOpponentNote = (() => {
    if (!pickData || pickData.picksRevealed) return null;
    const parts: string[] = [];
    if (user?.id !== matchup.user1.id && pickData.user1PickCount > 0) {
      parts.push(`${matchup.user1.username} picked ${pickData.user1PickCount} game${pickData.user1PickCount === 1 ? "" : "s"}`);
    }
    if (matchup.user2 && user?.id !== matchup.user2.id && pickData.user2PickCount !== null && pickData.user2PickCount > 0) {
      parts.push(`${matchup.user2.username} picked ${pickData.user2PickCount} game${pickData.user2PickCount === 1 ? "" : "s"}`);
    }
    return parts.length > 0 ? parts.join(", ") : null;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Week {matchup.week} Matchup
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="font-semibold text-lg">{matchup.user1.username}</div>
              {matchup.user1Forfeit && (
                <Badge variant="destructive" className="mt-1 text-xs" data-testid="badge-forfeit-user1">
                  Forfeit — missed pick minimum
                </Badge>
              )}
              {matchup.isComplete && (
                <div className="mt-2">
                  <Badge variant={matchup.winnerId === matchup.user1.id ? "default" : "secondary"} className="text-lg px-3 py-1">
                    {matchup.user1Npw ?? 0}
                  </Badge>
                </div>
              )}
              {matchup.winnerId === matchup.user1.id && (
                <div className="mt-2 flex items-center justify-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <Trophy className="w-4 h-4" />
                  Winner
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-muted-foreground">VS</div>
            <div className="flex-1 text-center">
              {matchup.user2 ? (
                <>
                  <div className="font-semibold text-lg">{matchup.user2.username}</div>
                  {matchup.user2Forfeit && (
                    <Badge variant="destructive" className="mt-1 text-xs" data-testid="badge-forfeit-user2">
                      Forfeit — missed pick minimum
                    </Badge>
                  )}
                  {matchup.isComplete && (
                    <div className="mt-2">
                      <Badge variant={matchup.winnerId === matchup.user2.id ? "default" : "secondary"} className="text-lg px-3 py-1">
                        {matchup.user2Npw ?? 0}
                      </Badge>
                    </div>
                  )}
                  {matchup.winnerId === matchup.user2.id && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <Trophy className="w-4 h-4" />
                      Winner
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground italic">BYE</div>
              )}
            </div>
          </div>
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3">Game Picks</h4>
            {picksLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading picks...</p>
            ) : !pickData || (pickData.user1PickCount === 0 && (pickData.user2PickCount ?? 0) === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-games">
                No picks made this week yet.
              </p>
            ) : (
              <div className="space-y-2">
                {!pickData.picksRevealed && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2" data-testid="text-picks-hidden">
                    <EyeOff className="w-3 h-3" />
                    {hiddenOpponentNote
                      ? `${hiddenOpponentNote} — hidden until the week's first game kicks off.`
                      : "Other players' picks are hidden until the week's first game kicks off."}
                  </p>
                )}
                {pickData.games.map((game) => (
                  <div key={game.id} className="p-2 rounded-md border space-y-1.5" data-testid={`matchup-game-${game.id}`}>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {game.awayTeam} @ {game.homeTeam} ({game.homeTeam} {parseFloat(game.spread) > 0 ? "+" : ""}{game.spread})
                      </span>
                      {game.isComplete ? (
                        <Badge variant="secondary" className="text-xs">{game.awayScore} - {game.homeScore}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Upcoming</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{matchup.user1.username}</div>
                        <PickCell pick={game.user1Pick} game={game} revealed={pickData.picksRevealed || user?.id === matchup.user1.id} />
                      </div>
                      <div>
                        {matchup.user2 ? (
                          <>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{matchup.user2.username}</div>
                            <PickCell pick={game.user2Pick} game={game} revealed={pickData.picksRevealed || user?.id === matchup.user2.id} />
                          </>
                        ) : (
                          <div className="text-xs text-muted-foreground italic mt-3">BYE</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={matchup.isComplete ? "default" : "outline"}>
                {matchup.isComplete ? "Complete" : "In Progress"}
              </Badge>
            </div>
            {matchup.isComplete && !matchup.winnerId && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Result</span>
                <Badge variant="secondary">Draw</Badge>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Target className="w-3 h-3" />
            NPW = Net Positive Wins (correct picks vs opponent's correct picks)
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

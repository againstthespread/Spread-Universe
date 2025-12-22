import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Target } from "lucide-react";
import type { GamblingLeagueMatchupWithUsers } from "@shared/schema";

interface MatchupDetailDialogProps {
  matchup: GamblingLeagueMatchupWithUsers | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MatchupDetailDialog({ matchup, open, onOpenChange }: MatchupDetailDialogProps) {
  if (!matchup) return null;

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

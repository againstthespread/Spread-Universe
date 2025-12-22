import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Circle, Trophy, Minus } from "lucide-react";
import type { User, Game, Pick } from "@shared/schema";

interface MatchupDetailDialogProps {
  matchupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GameDetail {
  game: Game;
  user1Pick: Pick | null;
  user2Pick: Pick | null;
}

interface MatchupDetails {
  matchup: {
    id: string;
    week: number;
    user1Id: string;
    user2Id: string | null;
    user1Npw: number;
    user2Npw: number | null;
    winnerId: string | null;
    isComplete: boolean;
    user1: User;
    user2: User | null;
  };
  gameDetails: GameDetail[];
}

export function MatchupDetailDialog({ matchupId, open, onOpenChange }: MatchupDetailDialogProps) {
  const { data, isLoading } = useQuery<MatchupDetails>({
    queryKey: ["/api/matchups", matchupId, "details"],
    queryFn: async () => {
      const res = await fetch(`/api/matchups/${matchupId}/details`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: open,
  });

  if (isLoading || !data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading matchup details...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const { matchup, gameDetails } = data;
  const user1Name = matchup.user1.firstName || matchup.user1.email;
  const user2Name = matchup.user2?.firstName || matchup.user2?.email || "BYE";

  const getPickIcon = (pick: Pick | null, game: Game) => {
    if (!pick) return <Circle className="w-4 h-4 text-muted-foreground" />;
    if (!game.isComplete) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (pick.isPush) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (pick.isCorrect === true) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (pick.isCorrect === false) return <XCircle className="w-4 h-4 text-red-600" />;
    return <Circle className="w-4 h-4 text-muted-foreground" />;
  };

  const getPickBadge = (pick: Pick | null, game: Game) => {
    if (!pick) return <Badge variant="outline">No Pick</Badge>;
    
    const team = pick.pickedTeam === 'home' ? game.homeTeam : game.awayTeam;
    const variant = !game.isComplete 
      ? "secondary" 
      : pick.isPush
        ? "secondary"
        : pick.isCorrect === true 
          ? "default" 
          : pick.isCorrect === false 
            ? "destructive" 
            : "outline";
    
    return <Badge variant={variant} className={pick.isPush ? "bg-muted" : ""}>{team}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-matchup-details">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Week {matchup.week} Matchup Details</span>
          </DialogTitle>
        </DialogHeader>

        {/* Matchup Header */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {matchup.user1.profileImageUrl && (
                  <img
                    src={matchup.user1.profileImageUrl ?? ''}
                    alt={user1Name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-semibold text-lg" data-testid="text-user1-name">{user1Name}</div>
                  {matchup.isComplete && (
                    <div className="text-sm text-muted-foreground" data-testid="text-user1-npw">
                      NPW: {matchup.user1Npw}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">VS</div>
                {matchup.isComplete && (
                  <div className="mt-2">
                    {matchup.winnerId ? (
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <Trophy className="w-4 h-4 text-accent" />
                        {matchup.winnerId === matchup.user1Id ? user1Name : user2Name}
                      </div>
                    ) : (
                      <Badge variant="secondary">Draw</Badge>
                    )}
                  </div>
                )}
              </div>

              {matchup.user2 ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold text-lg" data-testid="text-user2-name">{user2Name}</div>
                    {matchup.isComplete && (
                      <div className="text-sm text-muted-foreground" data-testid="text-user2-npw">
                        NPW: {matchup.user2Npw}
                      </div>
                    )}
                  </div>
                  {matchup.user2.profileImageUrl && (
                    <img
                      src={matchup.user2.profileImageUrl ?? ''}
                      alt={user2Name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                </div>
              ) : (
                <div>
                  <Badge variant="outline">BYE WEEK</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game by Game Breakdown */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Game-by-Game Breakdown</h3>
          {gameDetails.map(({ game, user1Pick, user2Pick }) => (
            <Card key={game.id} data-testid={`game-detail-${game.id}`}>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Game Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        {game.awayTeam} @ {game.homeTeam}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Spread: {game.homeTeam} {Number(game.spread) > 0 ? '+' : ''}{game.spread}
                      </div>
                    </div>
                    {game.isComplete && (
                      <div className="text-sm font-semibold">
                        Final: {game.awayScore} - {game.homeScore}
                      </div>
                    )}
                  </div>

                  {/* Picks Comparison */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">{user1Name}:</span>
                      <div className="flex items-center gap-2">
                        {getPickBadge(user1Pick, game)}
                        {getPickIcon(user1Pick, game)}
                      </div>
                    </div>
                    
                    {matchup.user2 && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">{user2Name}:</span>
                        <div className="flex items-center gap-2">
                          {getPickBadge(user2Pick, game)}
                          {getPickIcon(user2Pick, game)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pick Notes */}
                  {(user1Pick?.note || user2Pick?.note) && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      {user1Pick?.note && (
                        <div className="text-sm">
                          <div className="text-muted-foreground mb-1">Note:</div>
                          <div className="text-xs italic">{user1Pick.note}</div>
                        </div>
                      )}
                      {user2Pick?.note && (
                        <div className="text-sm">
                          <div className="text-muted-foreground mb-1">Note:</div>
                          <div className="text-xs italic">{user2Pick.note}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

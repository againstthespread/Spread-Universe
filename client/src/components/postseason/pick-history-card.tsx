import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatInEastern } from "@/lib/timezone";
import { Check, X, Minus, Trophy } from "lucide-react";
import type { PostseasonPickHistoryItem, PostseasonRound } from "@shared/schema";
import { POSTSEASON_ROUND_NAMES } from "@shared/schema";

interface PickHistoryCardProps {
  item: PostseasonPickHistoryItem;
}

export function PickHistoryCard({ item }: PickHistoryCardProps) {
  const { game, selectedTeam, isCorrect, pointsEarned } = item;
  const isWinner = game.winner === selectedTeam;
  const roundName = POSTSEASON_ROUND_NAMES[game.round as PostseasonRound];

  return (
    <Card data-testid={`card-pick-history-${item.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">{roundName}</Badge>
              {game.isComplete && (
                <Badge variant={isCorrect === true ? "default" : isCorrect === false ? "destructive" : "secondary"}>
                  {isCorrect === true ? "Correct" : isCorrect === false ? "Wrong" : "Push"}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {formatInEastern(game.gameDate, "MMM d, yyyy 'at' h:mm a")}
            </div>
            <div className="font-medium">
              {game.awayTeam} @ {game.homeTeam}
            </div>
            {game.isComplete && (
              <div className="text-sm text-muted-foreground mt-1">
                Final: {game.awayScore} - {game.homeScore}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className="text-sm text-muted-foreground">Your Pick:</span>
              <span className="font-semibold">{selectedTeam}</span>
              {isWinner && game.isComplete && <Trophy className="h-4 w-4 text-yellow-500" />}
            </div>
            {game.isComplete && (
              <div className="flex items-center gap-1 justify-end">
                {isCorrect === true && (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-semibold">+{pointsEarned} pts</span>
                  </>
                )}
                {isCorrect === false && (
                  <>
                    <X className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">0 pts</span>
                  </>
                )}
                {isCorrect === null && (
                  <>
                    <Minus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Push</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

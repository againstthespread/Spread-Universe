import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "./game-card";
import type { PostseasonGameWithPick, PostseasonRound } from "@shared/schema";
import { POSTSEASON_ROUND_NAMES, POSTSEASON_ROUND_POINTS } from "@shared/schema";

interface RoundSectionProps {
  round: PostseasonRound;
  games: PostseasonGameWithPick[];
}

export function RoundSection({ round, games }: RoundSectionProps) {
  if (games.length === 0) return null;

  const roundName = POSTSEASON_ROUND_NAMES[round];
  const roundPoints = POSTSEASON_ROUND_POINTS[round];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <h2 className="text-xl font-bold" data-testid={`text-round-${round}`}>
          {roundName}
        </h2>
        <Badge variant="outline">{roundPoints} pts per pick</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}

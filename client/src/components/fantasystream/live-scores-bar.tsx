import { type FantasyStreamGame } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface LiveScoresBarProps {
  games: FantasyStreamGame[];
  isLoading: boolean;
}

export function LiveScoresBar({ games, isLoading }: LiveScoresBarProps) {
  if (isLoading) {
    return (
      <div className="bg-secondary border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-6 overflow-x-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 bg-card rounded-lg px-4 py-2">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-6 w-8" />
                  <Skeleton className="h-4 w-2" />
                  <Skeleton className="h-6 w-8" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-secondary border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="text-center text-muted-foreground" data-testid="no-games-message">
            No live games available
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in':
        return 'text-green-500 dark:text-green-400';
      case 'post':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-secondary border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-6 overflow-x-auto" data-testid="scores-container">
          {games.map((game) => (
            <div 
              key={game.id} 
              className="flex-shrink-0 flex items-center gap-4 bg-card rounded-lg px-4 py-2"
              data-testid={`game-score-${game.id}`}
            >
              <div className="text-sm font-semibold" data-testid={`away-team-${game.id}`}>
                {game.awayTeam}
              </div>
              <div className="text-lg font-bold" data-testid={`away-score-${game.id}`}>
                {game.awayScore}
              </div>
              <div className="text-muted-foreground">-</div>
              <div className="text-lg font-bold" data-testid={`home-score-${game.id}`}>
                {game.homeScore}
              </div>
              <div className="text-sm font-semibold" data-testid={`home-team-${game.id}`}>
                {game.homeTeam}
              </div>
              <div className={`text-xs ml-2 ${getStatusColor(game.status)}`} data-testid={`game-status-${game.id}`}>
                {game.status === 'in' && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {game.quarter} {game.timeRemaining}
                  </span>
                )}
                {game.status === 'post' && game.quarter}
                {game.status === 'pre' && game.timeRemaining}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

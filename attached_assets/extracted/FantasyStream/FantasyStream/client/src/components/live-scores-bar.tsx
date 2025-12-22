import { type Game } from "@shared/schema";

interface LiveScoresBarProps {
  games: Game[];
  isLoading: boolean;
}

export default function LiveScoresBar({ games, isLoading }: LiveScoresBarProps) {
  if (isLoading) {
    return (
      <div className="bg-secondary border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-6 overflow-x-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 bg-card rounded-lg px-4 py-2 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-muted rounded w-8"></div>
                  <div className="h-6 bg-muted rounded w-8"></div>
                  <div className="h-4 bg-muted rounded w-2"></div>
                  <div className="h-6 bg-muted rounded w-8"></div>
                  <div className="h-4 bg-muted rounded w-8"></div>
                  <div className="h-3 bg-muted rounded w-12"></div>
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

  return (
    <div className="bg-secondary border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center space-x-6 overflow-x-auto" data-testid="scores-container">
          {games.map((game) => (
            <div 
              key={game.id} 
              className="flex-shrink-0 flex items-center space-x-4 bg-card rounded-lg px-4 py-2"
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
              <div className="text-xs text-muted-foreground ml-2" data-testid={`game-status-${game.id}`}>
                {game.quarter} {game.timeRemaining}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

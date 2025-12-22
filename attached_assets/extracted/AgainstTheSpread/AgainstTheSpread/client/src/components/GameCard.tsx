import { Game } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Gamepad2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const handlePlayClick = () => {
    // Record click asynchronously without blocking navigation
    // This ensures the link opens immediately on mobile browsers
    apiRequest("POST", "/api/clicks", { gameId: game.id }).catch((error) => {
      console.error("Failed to record click:", error);
    });
  };
  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      data-testid={`card-game-${game.id}`}
    >
      <CardHeader className="p-6 space-y-0">
        {/* Game Thumbnail */}
        <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-border mb-4 flex items-center justify-center overflow-hidden">
          {game.thumbnailUrl ? (
            <img 
              src={game.thumbnailUrl} 
              alt={game.name}
              className="w-full h-full object-cover"
              data-testid={`img-game-thumbnail-${game.id}`}
            />
          ) : (
            <Gamepad2 className="h-16 w-16 text-primary/40" />
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 
              className="font-display text-2xl md:text-3xl font-bold leading-tight"
              data-testid={`text-game-name-${game.id}`}
            >
              {game.name}
            </h3>
            <Badge variant="secondary" className="shrink-0">
              Active
            </Badge>
          </div>
          {game.category && (
            <Badge 
              variant="outline" 
              className="w-fit"
              data-testid={`badge-category-${game.id}`}
            >
              {game.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        {game.description ? (
          <p 
            className="text-muted-foreground line-clamp-3"
            data-testid={`text-game-description-${game.id}`}
          >
            {game.description}
          </p>
        ) : (
          <p className="text-muted-foreground italic">
            No description available
          </p>
        )}
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-0">
        <Button 
          asChild
          className="w-full gap-2 text-sm md:text-base font-semibold uppercase tracking-wide"
          data-testid={`button-play-${game.id}`}
        >
          <a
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handlePlayClick}
          >
            Play Now
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

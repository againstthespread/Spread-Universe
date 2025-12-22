import { useQuery } from "@tanstack/react-query";
import { GameWithTeams, Pick } from "@shared/schema";
import GameCard from "./GameCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameCardListProps {
  roundId: number;
}

const GameCardList = ({ roundId }: GameCardListProps) => {
  const { user } = useAuth();
  
  const { 
    data: games, 
    isLoading,
    isError,
    error,
    refetch: refetchGames
  } = useQuery<GameWithTeams[]>({
    queryKey: ["/api/games", roundId],
    queryFn: async () => {
      // Make sure we're passing the roundId as a query parameter to filter games
      const response = await fetch(`/api/games?roundId=${roundId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch games: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!roundId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { 
    data: userPicks = [],
    isLoading: isLoadingPicks,
    isError: isPicksError,
    error: picksError,
    refetch: refetchPicks
  } = useQuery<Pick[]>({
    queryKey: ["/api/picks"],
    enabled: !!user,
    // Use a shorter stale time for picks to ensure they update more frequently
    staleTime: 1000 * 30, // 30 seconds 
    // Force a refetch when this component is focused
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((_, index) => (
          <Skeleton key={index} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  // Handle API errors with retry option
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load game data";
    const isRateLimitError = error instanceof Error && errorMessage.startsWith("RATE_LIMIT:");
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          {isRateLimitError ? "Rate Limit Reached" : "Couldn't Load Games"}
        </h3>
        <p className="text-gray-600 mb-4">
          {isRateLimitError 
            ? "We're experiencing high traffic right now. Please wait a moment before trying again." 
            : errorMessage}
        </p>
        <Button 
          onClick={() => refetchGames()} 
          className="inline-flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h3 className="text-lg font-medium text-gray-600">No games available for this round yet.</h3>
        <p className="text-gray-500 mt-2">Check back later for updates.</p>
      </div>
    );
  }
  
  // Handle picks error
  if (isPicksError && user) {
    console.warn("Error loading user picks:", picksError);
    // We'll still show games but with a warning that picks couldn't be loaded
  }

  const getPickForGame = (gameId: number) => {
    if (!user || isLoadingPicks) return null;
    return userPicks.find(pick => pick.gameId === gameId) || null;
  };

  return (
    <div className="space-y-4">
      {isPicksError && user && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div className="flex-grow">
            <p className="text-sm">
              We couldn't load your picks. Your previous selections may not appear correctly.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchPicks()}
            className="ml-2 flex-shrink-0 whitespace-nowrap"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </div>
      )}
      
      {games.map((game) => (
        <GameCard 
          key={game.id} 
          game={game} 
          userPick={getPickForGame(game.id)} 
          refetchGames={refetchGames}
        />
      ))}
    </div>
  );
};

export default GameCardList;

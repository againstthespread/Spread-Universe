import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GameWithTeams, Pick } from "@shared/schema";
import TeamLogo from "@/components/ui/team-logo";
import BasketballIcon from "@/components/ui/basketball-icon";
import { Check, Clock, RefreshCw, Plus } from "lucide-react";
import SelectionModal from "./SelectionModal";
import { useAuth } from "@/lib/auth";

interface GameCardProps {
  game: GameWithTeams;
  userPick?: Pick | null;
  refetchGames: () => void;
}

const GameCard = ({ game, userPick, refetchGames }: GameCardProps) => {
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createPickMutation = useMutation({
    mutationFn: async (pickedTeamId: number) => {
      try {
        // Add a small delay to avoid potential race conditions with other requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await apiRequest("POST", "/api/picks", {
          gameId: game.id,
          pickedTeamId,
        });
        return response;
      } catch (error) {
        // Handle rate limiting specifically
        if (error instanceof Error && error.message.startsWith("RATE_LIMIT:")) {
          console.warn("Rate limiting detected during pick submission");
          throw new Error("We're experiencing high traffic. Please try again in a moment.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the specific game and all picks
      queryClient.invalidateQueries({ queryKey: [`/api/games/${game.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/picks"] });
      
      // Force refetch both games and picks
      refetchGames();
      
      toast({
        title: "Pick submitted",
        description: "Your pick has been saved successfully.",
      });
      
      // Wait a brief moment and then force another refetch to ensure UI is updated
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/picks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/games", game.roundId] });
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save your pick",
        variant: "destructive",
      });
    },
    retry: (failureCount, error) => {
      // Only retry a few times
      if (error instanceof Error && error.message.startsWith("We're experiencing high traffic")) {
        return failureCount < 2;
      }
      return false;
    },
  });

  const handlePickTeam = (teamId: number) => {
    createPickMutation.mutate(teamId);
    setIsSelectionModalOpen(false);
  };

  const isGameLocked = new Date(game.startTime) <= new Date();
  const isUpcoming = game.status === "upcoming";
  const isLive = game.status === "live";
  const isCompleted = game.status === "completed";

  const getTeamPickedName = () => {
    // Debug pick data
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Game ${game.id} user pick:`, userPick);
    }
    
    if (!userPick) return null;
    
    const pickedTeam = game.homeTeamId === userPick.pickedTeamId
      ? game.homeTeam
      : game.awayTeam;
    
    const spread = game.homeTeamId === userPick.pickedTeamId
      ? game.spread
      : game.spread.startsWith("-")
        ? `+${game.spread.substring(1)}`
        : `-${game.spread.substring(1)}`;
    
    return `${pickedTeam.name} ${spread}`;
  };

  const getCardHeaderClasses = () => {
    if (isLive) return "bg-gray-700 text-white";
    if (isCompleted) return "bg-gray-700 text-white";
    if (isGameLocked && isUpcoming) return "bg-amber-600 text-white"; // Locked but not yet marked as live
    return "bg-primary text-white";
  };

  const getStatusDisplay = () => {
    if (isLive) {
      return (
        <div className="bg-red-500 text-white text-sm rounded px-2 py-0.5 flex items-center">
          <span className="animate-pulse mr-1">●</span>
          <span>LIVE</span>
        </div>
      );
    }
    
    if (isCompleted) {
      return <div className="text-xs uppercase font-medium">Final</div>;
    }
    
    // For locked but not yet live games - show locked status
    if (isGameLocked && isUpcoming) {
      return (
        <div className="bg-amber-600 text-white text-sm rounded px-2 py-0.5 flex items-center">
          <span className="mr-1">🔒</span>
          <span>LOCKED</span>
        </div>
      );
    }
    
    // For upcoming games, show time remaining until game starts
    const gameTime = new Date(game.startTime);
    const now = new Date();
    const diffTime = gameTime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      return (
        <div className="text-sm bg-primary text-white rounded-full px-3 py-1 flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          <span>Picks lock today</span>
        </div>
      );
    }
    
    return (
      <div className="text-sm bg-primary text-white rounded-full px-3 py-1 flex items-center">
        <Clock className="w-4 h-4 mr-1" />
        <span>Picks lock in {diffDays} days</span>
      </div>
    );
  };

  const getTeamBorderClasses = (teamId: number) => {
    // If game is not completed or user didn't pick this team, no special border
    if (!isCompleted || !userPick || userPick.pickedTeamId !== teamId) {
      return "border-2 border-transparent hover:border-gray-300";
    }

    // Game completed and user picked this team
    return userPick.isCorrect
      ? "border-2 border-success bg-green-50"  // Correct pick
      : "border-2 border-destructive bg-gray-50"; // Incorrect pick
  };

  const getWinningTeamClasses = (teamId: number) => {
    if (isCompleted && game.winningTeamId === teamId) {
      return "bg-green-50 border-2 border-success";
    }
    return "bg-gray-50";
  };

  const getPickButtonDisplay = () => {
    if (!user) return null;
    
    // Determine if the user has already made a pick
    const hasPick = !!userPick;
    
    // Game locked or completed - show pick only
    if (isGameLocked) {
      return (
        <div className="flex-grow">
          <span className="text-sm text-gray-500">Your Pick:</span>
          <span className={`font-medium ml-1 ${userPick ? 
            (isCompleted ? (userPick.isCorrect ? "text-success" : "text-destructive") : "text-secondary") 
            : "text-gray-400"}`}>
            {getTeamPickedName() || "Not Selected"}
            {isCompleted && userPick?.isCorrect && <Check className="inline-block ml-1 h-4 w-4 text-success" />}
          </span>
        </div>
      );
    }
    
    // Game is upcoming - allow making/changing pick
    return (
      <div className="flex justify-between items-center w-full">
        <div className="flex-grow">
          <span className="text-sm text-gray-500">Your Pick:</span>
          <span className={`font-medium ml-1 ${hasPick ? "text-secondary" : "text-gray-400"}`}>
            {getTeamPickedName() || "Not Selected"}
          </span>
        </div>
        <Button
          size="sm"
          className={`ml-2 ${hasPick ? "bg-primary" : "bg-secondary"}`}
          onClick={() => setIsSelectionModalOpen(true)}
        >
          {hasPick ? (
            <>
              <RefreshCw className="h-4 w-4 mr-1" /> Change Pick
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" /> Make Pick
            </>
          )}
        </Button>
      </div>
    );
  };

  const getPoints = () => {
    if (isCompleted && userPick?.isCorrect) {
      return (
        <div className="px-3 py-1 bg-success/10 text-success font-medium rounded-full text-sm">
          +{game.round.pointValue} points
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className={`p-3 flex justify-between items-center ${getCardHeaderClasses()}`}>
          <div className="flex items-center">
            <BasketballIcon className="mr-2" />
            <span className="font-medium">
              {game.region ? `${game.region} Region` : ''} 
              {game.gameNumber ? ` - Game ${game.gameNumber}` : ''}
            </span>
          </div>
          <div className="text-sm">
            {isLive || isCompleted || (isGameLocked && isUpcoming) ? (
              getStatusDisplay()
            ) : (
              <>
                <Clock className="w-4 h-4 inline-block mr-1" />
                <span>{format(new Date(game.startTime), "MMM d, h:mm a")}</span>
              </>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          {/* Home Team */}
          <div 
            className={`flex items-center justify-between mb-4 p-3 rounded-lg cursor-pointer ${
              isGameLocked ? getWinningTeamClasses(game.homeTeamId) : getTeamBorderClasses(game.homeTeamId)
            }`}
            onClick={() => !isGameLocked && setIsSelectionModalOpen(true)}
          >
            <div className="flex items-center">
              <TeamLogo 
                logoUrl={game.homeTeam.logoUrl} 
                teamName={game.homeTeam.name} 
                className="w-10 h-10 mr-3 flex-shrink-0" 
              />
              <div>
                <div className="flex items-center">
                  <span className="font-inter font-bold text-lg mr-2">{game.homeTeam.name}</span>
                  {game.homeTeam.seed && (
                    <span className="bg-primary text-white text-xs rounded px-1.5">{game.homeTeam.seed}</span>
                  )}
                </div>
                <span className="text-sm text-gray-600">
                  {game.homeTeam.record && `${game.homeTeam.record}, `}
                  {game.homeTeam.conference}
                </span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              {isLive && game.homeScore !== null && (
                <span className="text-lg font-bold">{game.homeScore}</span>
              )}
              <span className={`${isLive ? "text-sm text-gray-500" : "text-lg font-bold"}`}>
                {game.spread}
              </span>
            </div>
          </div>
          
          {/* Away Team */}
          <div 
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
              isGameLocked ? getWinningTeamClasses(game.awayTeamId) : getTeamBorderClasses(game.awayTeamId)
            }`}
            onClick={() => !isGameLocked && setIsSelectionModalOpen(true)}
          >
            <div className="flex items-center">
              <TeamLogo 
                logoUrl={game.awayTeam.logoUrl} 
                teamName={game.awayTeam.name} 
                className="w-10 h-10 mr-3 flex-shrink-0" 
              />
              <div>
                <div className="flex items-center">
                  <span className="font-inter font-bold text-lg mr-2">{game.awayTeam.name}</span>
                  {game.awayTeam.seed && (
                    <span className="bg-primary text-white text-xs rounded px-1.5">{game.awayTeam.seed}</span>
                  )}
                </div>
                <span className="text-sm text-gray-600">
                  {game.awayTeam.record && `${game.awayTeam.record}, `}
                  {game.awayTeam.conference}
                </span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              {isLive && game.awayScore !== null && (
                <span className="text-lg font-bold">{game.awayScore}</span>
              )}
              <span className={`${isLive ? "text-sm text-gray-500" : "text-lg font-bold"}`}>
                {game.spread.startsWith('-') 
                  ? `+${game.spread.substring(1)}`
                  : `-${game.spread.substring(1)}`}
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            {/* Left side - pick display */}
            {getPickButtonDisplay()}
            
            {/* Right side - points or status badges */}
            <div className="flex items-center">
              {getPoints()}
              {isLive && (
                <div className="text-xs bg-gray-200 text-gray-800 py-1 px-2 rounded-md ml-2">
                  In Progress
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <SelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        game={game}
        onSelectTeam={handlePickTeam}
        isSubmitting={createPickMutation.isPending}
      />
    </>
  );
};

export default GameCard;

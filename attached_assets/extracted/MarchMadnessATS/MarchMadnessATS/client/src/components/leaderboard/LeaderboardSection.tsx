import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardEntry, Round } from "@shared/schema";
import TrophyIcon from "@/components/ui/trophy-icon";
import { Link } from "wouter";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface LeaderboardSectionProps {
  limitEntries?: boolean;
  activeRound?: string;
}

const LeaderboardSection = ({ limitEntries = true, activeRound }: LeaderboardSectionProps) => {
  const { user } = useAuth();
  
  const { 
    data: leaderboard = [], 
    isLoading, 
    refetch 
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
  });

  const activeRoundData = activeRound
    ? rounds.find(round => round.name === activeRound)
    : null;

  const handleRefresh = () => {
    refetch();
  };

  // If limiting entries, show top 5 and the user's entry if not in top 5
  const displayedEntries = limitEntries
    ? leaderboard.slice(0, 5)
    : leaderboard;

  // Find the user's entry if they're logged in
  const userEntry = user
    ? leaderboard.find(entry => entry.user.id === user.id)
    : null;

  // Check if user is not in the displayed entries but is in the leaderboard
  const shouldAddUserEntry =
    limitEntries &&
    user &&
    userEntry &&
    !displayedEntries.some(entry => entry.user.id === user.id);

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary text-white p-4 flex items-center justify-between">
          <h2 className="font-inter font-bold text-lg flex items-center">
            <TrophyIcon className="text-accent mr-2" />
            Leaderboard
          </h2>
        </CardHeader>
        <CardContent className="p-4">
          {[1, 2, 3, 4, 5].map((_, index) => (
            <Skeleton key={index} className="h-16 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary text-white p-4 flex items-center justify-between">
          <h2 className="font-inter font-bold text-lg flex items-center">
            <TrophyIcon className="text-accent mr-2" />
            Leaderboard
          </h2>
          <Button variant="ghost" size="sm" className="text-white hover:text-accent" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </CardHeader>
        
        <CardContent className="p-4">
          {displayedEntries.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No entries yet. Be the first to make picks!
            </div>
          ) : (
            <>
              {displayedEntries.map((entry, index) => (
                <div
                  key={entry.user.id}
                  className={`flex items-center justify-between p-3 rounded-lg mb-2 ${
                    index === 0
                      ? "bg-accent/10"
                      : user && entry.user.id === user.id
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${
                        index === 0
                          ? "bg-primary text-white"
                          : index === 1
                          ? "bg-gray-400 text-white"
                          : index === 2
                          ? "bg-accent text-primary"
                          : user && entry.user.id === user.id
                          ? "bg-blue-100 text-primary"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {entry.rank}
                    </div>
                    <div>
                      <span className="font-inter font-bold">
                        {entry.user.displayName || entry.user.username}
                        {user && entry.user.id === user.id && " (You)"}
                      </span>
                      <div className="text-xs text-gray-500">
                        {entry.correctPicks}/{entry.totalPicks} correct
                      </div>
                    </div>
                  </div>
                  <div className="font-inter font-bold text-lg text-primary">
                    {entry.totalPoints}
                  </div>
                </div>
              ))}

              {shouldAddUserEntry && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold mr-3">
                      {userEntry?.rank}
                    </div>
                    <div>
                      <span className="font-inter font-bold">
                        {user?.displayName || user?.username} (You)
                      </span>
                      <div className="text-xs text-gray-500">
                        {userEntry?.correctPicks}/{userEntry?.totalPicks} correct
                      </div>
                    </div>
                  </div>
                  <div className="font-inter font-bold text-lg text-primary">
                    {userEntry?.totalPoints}
                  </div>
                </div>
              )}

              {limitEntries && leaderboard.length > 5 && (
                <div className="mt-4">
                  <Link href="/leaderboard">
                    <Button
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      View Complete Standings
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Points Breakdown */}
      <Card className="overflow-hidden mt-6">
        <CardHeader className="bg-primary text-white p-4">
          <h2 className="font-inter font-bold text-lg">Points System</h2>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {rounds.map((round) => (
              <div 
                key={round.id}
                className={`flex justify-between items-center p-2 bg-gray-50 rounded ${
                  activeRoundData && round.id === activeRoundData.id 
                    ? "border-l-4 border-secondary" 
                    : ""
                }`}
              >
                <span className={activeRoundData && round.id === activeRoundData.id ? "font-medium text-secondary" : ""}>
                  {round.displayName}
                </span>
                <span className={`font-inter font-bold ${activeRoundData && round.id === activeRoundData.id ? "text-secondary" : ""}`}>
                  {round.pointValue} pts
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardSection;

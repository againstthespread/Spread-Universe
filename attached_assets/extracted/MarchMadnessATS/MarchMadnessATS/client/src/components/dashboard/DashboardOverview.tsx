import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserWithStats } from "@shared/schema";
import TrophyIcon from "@/components/ui/trophy-icon";

const DashboardOverview = () => {
  const { data: userStats, isLoading } = useQuery<UserWithStats>({
    queryKey: ["/api/users/me/stats"],
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <TrophyIcon className="text-accent text-2xl" />
                <h2 className="font-inter font-bold text-xl">Your Tournament Stats</h2>
              </div>
              <div className="flex flex-wrap gap-4 md:gap-8 text-center">
                {[1, 2, 3, 4].map((_, index) => (
                  <div key={index}>
                    <div className="text-sm text-gray-500">
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-10 mx-auto mt-1" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <TrophyIcon className="text-accent text-2xl" />
              <h2 className="font-inter font-bold text-xl">Your Tournament Stats</h2>
            </div>
            <div className="flex flex-wrap gap-4 md:gap-8 text-center">
              <div>
                <p className="text-sm text-gray-500">Your Rank</p>
                <p className="font-inter font-bold text-xl text-primary">
                  {userStats?.rank ? `${userStats.rank}${getRankSuffix(userStats.rank)}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Points</p>
                <p className="font-inter font-bold text-xl text-primary">{userStats?.totalPoints || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Correct Picks</p>
                <p className="font-inter font-bold text-xl text-success">{userStats?.correctPicks || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Incorrect Picks</p>
                <p className="font-inter font-bold text-xl text-destructive">{userStats?.incorrectPicks || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to get rank suffix
const getRankSuffix = (rank: number): string => {
  if (rank > 10 && rank < 20) return 'th';
  
  const lastDigit = rank % 10;
  switch (lastDigit) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export default DashboardOverview;

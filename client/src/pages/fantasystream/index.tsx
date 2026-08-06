import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, RefreshCw } from "lucide-react";
import { type FantasyStreamGame, type FantasyStreamPlay } from "@shared/schema";
import { LiveScoresBar } from "@/components/fantasystream/live-scores-bar";
import { PlayCard } from "@/components/fantasystream/play-card";
import { PlayFilters, type PlayFilterType } from "@/components/fantasystream/play-filters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import { formatInEastern } from "@/lib/timezone";
export default function FantasyStreamDashboard() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<PlayFilterType>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { 
    data: games = [], 
    isLoading: gamesLoading,
    refetch: refetchGames
  } = useQuery<FantasyStreamGame[]>({
    queryKey: ["/api/fantasystream/games"],
    refetchInterval: 30000,
  });

  const { 
    data: plays = [], 
    isLoading: playsLoading,
    refetch: refetchPlays
  } = useQuery<FantasyStreamPlay[]>({
    queryKey: ["/api/fantasystream/plays", activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeFilter !== "all") {
        params.append("type", activeFilter);
      }
      const url = `/api/fantasystream/plays${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch plays');
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchGames(), refetchPlays()]);
      setLastUpdate(new Date());
      toast({
        title: "Data refreshed",
        description: "Live NFL data has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not fetch latest data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFilterChange = (filter: PlayFilterType) => {
    setActiveFilter(filter);
  };

  const formatTime = (date: Date) => {
    return `${formatInEastern(date, "h:mm a")} ET`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-40 bg-card border-b border-border backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Play className="text-purple-500 h-6 w-6" data-testid="logo-icon" />
                <h1 className="text-xl font-bold" data-testid="app-title">FantasyStream</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" data-testid="live-indicator" />
                <span>Live</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground" data-testid="last-update">
                Updated: {formatTime(lastUpdate)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <LiveScoresBar games={games} isLoading={gamesLoading} />

      <PlayFilters activeFilter={activeFilter} onFilterChange={handleFilterChange} />

      <main className="container mx-auto px-4 py-6">
        {playsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : plays.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground" data-testid="no-plays-message">
              No plays found matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="plays-grid">
            {plays.map((play, index) => (
              <PlayCard 
                key={play.id} 
                play={play} 
                isLatest={index === 0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

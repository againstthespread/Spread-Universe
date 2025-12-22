import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Volleyball } from "lucide-react";
import { useEffect, useState } from "react";
import { type Game, type Play } from "@shared/schema";
import LiveScoresBar from "@/components/live-scores-bar";
import PlayCard from "@/components/play-card";
import LoadingSpinner from "@/components/loading-spinner";
import PlayFilters from "@/components/play-filters";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<{ team?: string; player?: string }>({});

  const { 
    data: games = [], 
    isLoading: gamesLoading,
    refetch: refetchGames
  } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { 
    data: plays = [], 
    isLoading: playsLoading,
    refetch: refetchPlays
  } = useQuery<Play[]>({
    queryKey: ["/api/plays", filters.team, filters.player],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.team) params.append("team", filters.team);
      if (filters.player) params.append("player", filters.player);
      
      const url = `/api/plays${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch plays');
      }
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await apiRequest("POST", "/api/refresh");
      await Promise.all([refetchGames(), refetchPlays()]);
      setLastUpdate(new Date());
      toast({
        title: "Data refreshed",
        description: "Live NFL data has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not fetch latest data from ESPN",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleFilterChange = (newFilters: { team?: string; player?: string }) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Volleyball className="text-primary text-2xl" data-testid="logo-icon" />
                <h1 className="text-xl font-bold" data-testid="app-title">Fantasy Stream</h1>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" data-testid="live-indicator"></div>
                <span>Live</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                Last updated: <span className="text-foreground" data-testid="last-update-time">{formatTime(lastUpdate)} EST</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-accent"
                data-testid="refresh-button"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Live Scores Bar */}
      <LiveScoresBar games={games} isLoading={gamesLoading} />

      {/* Filters */}
      <PlayFilters onFilterChange={handleFilterChange} currentFilters={filters} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {playsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-full"></div>
                      <div className="h-4 bg-muted rounded w-32"></div>
                    </div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : plays.length === 0 ? (
            <div className="text-center py-12">
              <Volleyball className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="no-plays-title">No Live Plays Available</h3>
              <p className="text-muted-foreground mb-4" data-testid="no-plays-description">
                Waiting for live NFL game data from ESPN...
              </p>
              <Button 
                onClick={handleManualRefresh} 
                disabled={isRefreshing}
                data-testid="refresh-data-button"
              >
                {isRefreshing ? <LoadingSpinner /> : "Refresh Data"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4" data-testid="plays-feed">
              {plays.map((play, index) => (
                <PlayCard 
                  key={play.id} 
                  play={play} 
                  isLatest={index === 0}
                  data-testid={`play-card-${play.id}`}
                />
              ))}
              
              {/* Load More Indicator */}
              <div className="text-center py-8">
                <LoadingSpinner />
                <span className="text-muted-foreground ml-2" data-testid="loading-more-text">Loading more plays...</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p data-testid="footer-api-info">Live NFL data powered by ESPN API</p>
            <p className="mt-1" data-testid="footer-update-info">Updates every 30 seconds during live games</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

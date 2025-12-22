import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Calendar, Clock, AlertCircle, CloudOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/game-card";
import { StatsSummary } from "@/components/stats-summary";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { format, parseISO } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import type { GamesResponse } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery<GamesResponse>({
    queryKey: ["/api/games"],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    refetch();
  };

  const lastUpdated = data?.lastUpdated ? parseISO(data.lastUpdated) : null;
  const nextReset = data?.nextReset ? parseISO(data.nextReset) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Title and Week */}
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight" data-testid="text-title">
                  NFL Weather Dashboard
                </h1>
                {data?.weekNumber && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span data-testid="text-week">Week {data.weekNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={handleRefresh}
                disabled={isFetching}
                data-testid="button-refresh"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>

          {/* Last Updated & Next Reset */}
          {(lastUpdated || nextReset) && (
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
              {lastUpdated && (
                <div className="flex items-center gap-1" data-testid="text-last-updated">
                  <Clock className="h-3 w-3" />
                  <span>Updated {format(lastUpdated, "MMM d, h:mm a")}</span>
                </div>
              )}
              {nextReset && (
                <div className="flex items-center gap-1" data-testid="text-next-reset">
                  <Calendar className="h-3 w-3" />
                  <span>Next reset: {format(nextReset, "EEE, MMM d 'at' h:mm a")}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Weather Status Alert */}
        {data?.weatherStatus && data.weatherStatus !== "available" && (
          <Alert variant="default" className="mb-4 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-foreground" data-testid="text-weather-status">
              {data.weatherMessage || "Weather data is temporarily unavailable. Games and stadium info are still shown."}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <DashboardSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-destructive/10 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Unable to load games
            </h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              {error instanceof Error ? error.message : "There was an error fetching the NFL games. Please try again."}
            </p>
            <Button onClick={handleRefresh} data-testid="button-retry">
              Try Again
            </Button>
          </div>
        ) : data?.games && data.games.length > 0 ? (
          <div className="space-y-6">
            {/* Stats Summary */}
            <StatsSummary games={data.games} />

            {/* Fantasy Tip */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
              <h3 className="font-semibold text-foreground mb-2">Fantasy Tips</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">QB/WR:</span>
                  <span>Favor warm weather (60°F+), low wind (&lt;10mph), dome games, and dry conditions</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">RB:</span>
                  <span>Cold weather, rain/snow, high winds - conditions that limit passing game</span>
                </div>
              </div>
            </div>

            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <CloudOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No games scheduled
            </h2>
            <p className="text-muted-foreground max-w-md">
              There are no NFL games scheduled for this week. Check back later or refresh to see if games have been added.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">
            Weather data provided by OpenWeatherMap. Game schedule from ESPN. Resets every Tuesday at 8:00 AM EST.
          </p>
        </div>
      </footer>
    </div>
  );
}

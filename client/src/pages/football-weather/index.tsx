import { formatInEastern } from "@/lib/timezone";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { GameCard } from "@/components/football-weather/game-card";
import { StatsSummary } from "@/components/football-weather/stats-summary";
import type { FootballWeatherGamesResponse, FootballWeatherFantasyImplication } from "@shared/schema";
import { Cloud, RefreshCw, ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function FootballWeatherDashboard() {
  const [, navigate] = useLocation();
  const [activeFilter, setActiveFilter] = useState<FootballWeatherFantasyImplication | "all">("all");

  const { data, isLoading, refetch, isFetching } = useQuery<FootballWeatherGamesResponse>({
    queryKey: ["/api/football-weather/games"],
  });

  const filteredGames =
    data?.games?.filter((game) =>
      activeFilter === "all" ? true : game.fantasyImplication === activeFilter
    ) ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cloud className="h-8 w-8" />
            Football Weather
          </h1>
          <p className="text-muted-foreground">
            NFL games with weather data and fantasy implications
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          data-testid="button-refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-lg">Week {data.weekNumber} Summary</CardTitle>
              <span className="text-xs text-muted-foreground">
                Last updated: {formatInEastern(data.lastUpdated, "MMM d, h:mm a")} ET
              </span>
            </CardHeader>
            <CardContent>
              <StatsSummary games={data.games} />
            </CardContent>
          </Card>

          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="all" data-testid="tab-all">All Games</TabsTrigger>
              <TabsTrigger value="ideal_passing" data-testid="tab-ideal-passing">Ideal Passing</TabsTrigger>
              <TabsTrigger value="rb_weather" data-testid="tab-rb-weather">RB Weather</TabsTrigger>
              <TabsTrigger value="dome_game" data-testid="tab-dome-game">Dome Games</TabsTrigger>
              <TabsTrigger value="neutral" data-testid="tab-neutral">Neutral</TabsTrigger>
            </TabsList>

            <TabsContent value={activeFilter} className="mt-6">
              {filteredGames.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No games found for this filter.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGames.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Failed to load games. Please try again.</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()} data-testid="button-retry">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

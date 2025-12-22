import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameCard } from "@/components/game-card";
import { GameCardSkeleton } from "@/components/game-card-skeleton";
import { EmptyState } from "@/components/empty-state";
import { Trophy, Calendar, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GameWithStats } from "@shared/schema";

export default function Home() {
  const [filter, setFilter] = useState<"all" | "unpredicted" | "predicted">("all");
  const { toast } = useToast();

  const { data: games, isLoading } = useQuery<GameWithStats[]>({
    queryKey: ["/api/games"],
  });

  const { data: currentUser } = useQuery<{ id: string; username: string; isAdmin: boolean }>({
    queryKey: ["/api/user"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredGames = games?.filter((game) => {
    if (filter === "unpredicted") return !game.userPrediction;
    if (filter === "predicted") return !!game.userPrediction;
    return true;
  });

  const predictedCount = games?.filter((g) => g.userPrediction).length || 0;
  const totalCount = games?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading tracking-wide">CROWD LINES</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome back, {currentUser?.username}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" data-testid="button-leaderboard" asChild>
                <a href="/leaderboard" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </a>
              </Button>
              {currentUser?.isAdmin && (
                <Button variant="outline" data-testid="button-admin" asChild>
                  <a href="/admin" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Admin
                  </a>
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading tracking-wide">
                THIS WEEK'S GAMES
              </h2>
              <p className="text-muted-foreground mt-1">
                Submit your predictions to see the crowd-sourced spreads
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm bg-muted px-4 py-2 rounded-lg">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-semibold">{predictedCount}</span>
              <span className="text-muted-foreground">of {totalCount} predicted</span>
            </div>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all" data-testid="filter-all">All Games</TabsTrigger>
              <TabsTrigger value="unpredicted" data-testid="filter-unpredicted">Unpredicted</TabsTrigger>
              <TabsTrigger value="predicted" data-testid="filter-predicted">My Picks</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <GameCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredGames && filteredGames.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGames.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title={
                    filter === "unpredicted"
                      ? "All caught up!"
                      : filter === "predicted"
                      ? "No predictions yet"
                      : "No games scheduled"
                  }
                  description={
                    filter === "unpredicted"
                      ? "You've predicted all available games"
                      : filter === "predicted"
                      ? "Make your first prediction to see it here"
                      : "Check back Tuesday for this week's NFL matchups"
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

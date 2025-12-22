import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/crowdline/game-card";
import { GameCardSkeleton } from "@/components/crowdline/game-card-skeleton";
import { Trophy, Shield } from "lucide-react";
import type { CrowdlineGameWithStats } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";

export default function CrowdlineDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@crowdline.com";

  const { data: games, isLoading } = useQuery<CrowdlineGameWithStats[]>({
    queryKey: ["/api/crowdline/games"],
  });

  const upcomingGames = games?.filter(g => g.status !== "final") || [];
  const completedGames = games?.filter(g => g.status === "final") || [];

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-crowdline-title">CrowdLine</h1>
          <p className="text-muted-foreground">Predict NFL game scores and compete with others</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/crowdline/leaderboard">
            <Button variant="outline" data-testid="link-leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </Button>
          </Link>
          {isAdmin && (
            <Link href="/crowdline/admin">
              <Button variant="outline" data-testid="link-admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
        </div>
      </div>

      {upcomingGames.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Upcoming Games</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <GameCardSkeleton key={i} />)
              : upcomingGames.map(game => <GameCard key={game.id} game={game} />)}
          </div>
        </section>
      )}

      {completedGames.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Completed Games</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {!isLoading && games?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No games available yet</p>
        </div>
      )}

      {isLoading && upcomingGames.length === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}

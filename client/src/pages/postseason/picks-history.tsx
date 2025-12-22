import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PickHistoryCard } from "@/components/postseason/pick-history-card";
import { ArrowLeft, History, ClipboardList } from "lucide-react";
import type { PostseasonPickHistoryItem, PostseasonUserStats } from "@shared/schema";

export default function PostseasonPicksHistory() {
  const { data: history, isLoading } = useQuery<PostseasonPickHistoryItem[]>({
    queryKey: ["/api/postseason/picks/history"],
  });

  const { data: userStats } = useQuery<PostseasonUserStats>({
    queryKey: ["/api/postseason/stats/me"],
  });

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/postseason">
          <Button variant="ghost" size="sm" data-testid="link-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <History className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-history-title">Pick History</h1>
            <p className="text-sm text-muted-foreground">Your complete playoff picks record</p>
          </div>
        </div>
        {userStats && (
          <div className="text-right">
            <div className="text-2xl font-bold">{userStats.totalPoints} pts</div>
            <div className="text-sm text-muted-foreground">
              {userStats.correctPicks}/{userStats.totalPicks} correct ({userStats.winPercentage}%)
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : history && history.length > 0 ? (
        <div className="space-y-4">
          {history.map((item) => (
            <PickHistoryCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">You haven't made any picks yet.</p>
              <Link href="/postseason">
                <Button>Make Your First Pick</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

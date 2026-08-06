import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useParams, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StandingsTab } from "@/components/gambling-league/standings-tab";
import { PicksTab } from "@/components/gambling-league/picks-tab";
import { ScheduleTab } from "@/components/gambling-league/schedule-tab";
import { PlayoffsTab } from "@/components/gambling-league/playoffs-tab";
import { MatchupDetailDialog } from "@/components/gambling-league/matchup-detail-dialog";
import { ArrowLeft, Trophy, Calendar, Target, Users, Copy, Play, Crown, GitBranch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GamblingLeagueLeague, GamblingLeagueMember, GamblingLeagueMatchupWithUsers, User } from "@shared/schema";

type LeagueWithMembers = GamblingLeagueLeague & {
  members: (GamblingLeagueMember & { user: User })[];
};

export default function LeagueDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMatchup, setSelectedMatchup] = useState<GamblingLeagueMatchupWithUsers | null>(null);
  const [matchupDialogOpen, setMatchupDialogOpen] = useState(false);

  const { data: league, isLoading } = useQuery<LeagueWithMembers>({
    queryKey: ["/api/gambling-league/leagues", id],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/leagues/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!id,
  });

  const { data: championData } = useQuery<{ champion: { id: string; username: string } | null }>({
    queryKey: ["/api/gambling-league/leagues", id, "champion"],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/leagues/${id}/champion`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: league?.status === "completed",
  });

  const queryClient = useQueryClient();
  const startSeasonMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/gambling-league/leagues/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/leagues", id] });
      toast({ title: "Season started!", description: "The matchup schedule has been generated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to start season", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Loading league...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">League Not Found</h3>
            <p className="text-muted-foreground mb-4">The league you're looking for doesn't exist.</p>
            <Link href="/gambling-league">
              <Button>Back to Leagues</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMember = league.members.some(m => m.userId === user?.id);

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/gambling-league">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{league.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={league.status === 'open' ? 'default' : league.status === 'active' ? 'secondary' : 'outline'}>
              {league.status}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Week {league.currentWeek}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {league.members.length}/{league.capacity} members
            </span>
          </div>
        </div>
        {isMember && (league.status === "open" || league.status === "full") && league.creatorId === user?.id && league.members.length >= league.capacity && (
          <Button
            size="sm"
            onClick={() => startSeasonMutation.mutate()}
            disabled={startSeasonMutation.isPending}
            data-testid="button-start-season"
          >
            <Play className="w-4 h-4 mr-2" />
            {startSeasonMutation.isPending ? "Starting..." : "Start Season"}
          </Button>
        )}
        {isMember && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(league.joinCode);
              toast({ title: "Copied!", description: "Invite code copied to clipboard." });
            }}
            data-testid="button-copy-join-code"
          >
            <Copy className="w-4 h-4 mr-2" />
            Invite Code: <span className="font-mono ml-1">{league.joinCode}</span>
          </Button>
        )}
      </div>

      {league.status === "completed" && championData?.champion && (
        <Card className="border-yellow-500/50">
          <CardContent className="p-6 flex items-center gap-3">
            <Crown className="w-8 h-8 text-yellow-500" />
            <div>
              <h2 className="text-lg font-semibold" data-testid="text-champion">
                {championData.champion.username} is the League Champion!
              </h2>
              <p className="text-sm text-muted-foreground">Season complete</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={isMember ? "picks" : "standings"} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="standings" className="flex items-center gap-2" data-testid="tab-standings">
            <Trophy className="w-4 h-4" />
            Standings
          </TabsTrigger>
          <TabsTrigger value="picks" className="flex items-center gap-2" disabled={!isMember} data-testid="tab-picks">
            <Target className="w-4 h-4" />
            My Picks
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2" data-testid="tab-schedule">
            <Calendar className="w-4 h-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="playoffs" className="flex items-center gap-2" data-testid="tab-playoffs">
            <GitBranch className="w-4 h-4" />
            Playoffs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="standings" className="mt-6">
          <StandingsTab leagueId={league.id} />
        </TabsContent>
        <TabsContent value="picks" className="mt-6">
          {isMember ? (
            <PicksTab leagueId={league.id} currentWeek={league.currentWeek} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Join to Make Picks</h3>
                <p className="text-muted-foreground">You need to be a member of this league to make picks.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="schedule" className="mt-6">
          <ScheduleTab leagueId={league.id} currentWeek={league.currentWeek} capacity={league.capacity} />
        </TabsContent>
        <TabsContent value="playoffs" className="mt-6">
          <PlayoffsTab
            leagueId={league.id}
            capacity={league.capacity}
            seasonStarted={league.status !== "open" && league.status !== "full"}
            onMatchupClick={(matchup) => {
              setSelectedMatchup(matchup);
              setMatchupDialogOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      <MatchupDetailDialog
        matchup={selectedMatchup}
        open={matchupDialogOpen}
        onOpenChange={setMatchupDialogOpen}
      />
    </div>
  );
}

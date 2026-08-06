import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useParams, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StandingsTab } from "@/components/gambling-league/standings-tab";
import { PicksTab } from "@/components/gambling-league/picks-tab";
import { ScheduleTab } from "@/components/gambling-league/schedule-tab";
import { MatchupDetailDialog } from "@/components/gambling-league/matchup-detail-dialog";
import { ArrowLeft, ArrowRight, Trophy, Calendar, Target, Users, Swords, Copy, Play, Crown, GitBranch } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const { data: league, isLoading } = useQuery<LeagueWithMembers>({
    queryKey: ["/api/gambling-league/leagues", id],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/leagues/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!id,
  });

  const currentDisplayWeek = league ? Math.min(league.currentWeek, 17) : 1;
  const displayWeek = selectedWeek ?? currentDisplayWeek;

  const { data: matchups = [] } = useQuery<GamblingLeagueMatchupWithUsers[]>({
    queryKey: ["/api/gambling-league/leagues", id, "matchups", displayWeek],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/leagues/${id}/matchups?week=${displayWeek}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!league,
  });

  const playoffsStarted = !!league && league.currentWeek >= 15 && league.status !== "open" && league.status !== "full";

  const { data: allMatchups = [] } = useQuery<GamblingLeagueMatchupWithUsers[]>({
    queryKey: ["/api/gambling-league/leagues", id, "matchups", "all"],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/leagues/${id}/matchups`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: playoffsStarted,
  });

  const playoffMatchups = allMatchups.filter(m => m.isPlayoff);

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
        {isMember && (league.status === "open" || league.status === "full") && league.creatorId === user?.id && league.members.length >= 2 && (
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

      {(league.status === "active" || league.status === "completed") && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Swords className="w-5 h-5" />
                {matchups[0]?.isPlayoff
                  ? `${matchups[0].playoffRound === "championship" ? "Championship" : matchups[0].playoffRound === "semifinal" ? "Semifinals" : "Quarterfinals"} — Week ${displayWeek}`
                  : `Week ${displayWeek} Matchups`}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={displayWeek <= 1}
                  onClick={() => setSelectedWeek(Math.max(1, displayWeek - 1))}
                  data-testid="button-prev-week"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Select
                  value={String(displayWeek)}
                  onValueChange={(v) => setSelectedWeek(parseInt(v))}
                >
                  <SelectTrigger className="w-36" data-testid="select-week">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: currentDisplayWeek }, (_, i) => i + 1).map((w) => (
                      <SelectItem key={w} value={String(w)} data-testid={`option-week-${w}`}>
                        {w >= 15 ? `Week ${w} (${w === 17 ? "Championship" : w === 16 ? "Semifinals" : "Quarterfinals"})` : `Week ${w}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={displayWeek >= currentDisplayWeek}
                  onClick={() => setSelectedWeek(Math.min(currentDisplayWeek, displayWeek + 1))}
                  data-testid="button-next-week"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {matchups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-matchups">
                No matchups for week {displayWeek}.
              </p>
            ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {matchups.map((matchup) => (
                <div
                  key={matchup.id}
                  className="p-3 rounded-md border hover-elevate cursor-pointer flex items-center justify-between gap-2"
                  onClick={() => {
                    setSelectedMatchup(matchup);
                    setMatchupDialogOpen(true);
                  }}
                  data-testid={`card-matchup-${matchup.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={matchup.winnerId === matchup.user1.id ? "font-bold text-green-600 dark:text-green-400" : ""}>
                      {matchup.user1.username}
                    </span>
                    {matchup.isComplete && <Badge variant="secondary">{matchup.user1Npw ?? 0}</Badge>}
                  </div>
                  <span className="text-muted-foreground text-sm">vs</span>
                  <div className="flex items-center gap-2">
                    {matchup.isComplete && matchup.user2 && <Badge variant="secondary">{matchup.user2Npw ?? 0}</Badge>}
                    <span className={matchup.winnerId === matchup.user2?.id ? "font-bold text-green-600 dark:text-green-400" : ""}>
                      {matchup.user2?.username || "BYE"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {playoffsStarted && playoffMatchups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GitBranch className="w-5 h-5" />
              Playoff Bracket
            </CardTitle>
            <CardDescription>Weeks 15–17: Quarterfinals, Semifinals, Championship</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3" data-testid="playoff-bracket">
              {(["quarterfinal", "semifinal", "championship"] as const).map((round) => {
                const roundMatchups = playoffMatchups.filter(m => m.playoffRound === round);
                const roundLabel = round === "championship" ? "Championship" : round === "semifinal" ? "Semifinals" : "Quarterfinals";
                return (
                  <div key={round} className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{roundLabel}</h3>
                    {roundMatchups.length === 0 ? (
                      <div className="p-3 rounded-md border border-dashed text-sm text-muted-foreground text-center">
                        TBD
                      </div>
                    ) : (
                      roundMatchups.map((matchup) => (
                        <div
                          key={matchup.id}
                          className="p-3 rounded-md border hover-elevate cursor-pointer space-y-1"
                          onClick={() => {
                            setSelectedMatchup(matchup);
                            setMatchupDialogOpen(true);
                          }}
                          data-testid={`bracket-matchup-${matchup.id}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={matchup.winnerId === matchup.user1.id ? "font-bold text-green-600 dark:text-green-400" : ""}>
                              {matchup.user1.username}
                              {matchup.winnerId === matchup.user1.id && <Crown className="w-3 h-3 inline ml-1 text-yellow-500" />}
                            </span>
                            {matchup.isComplete && <Badge variant="secondary">{matchup.user1Npw ?? 0}</Badge>}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={matchup.winnerId === matchup.user2?.id ? "font-bold text-green-600 dark:text-green-400" : ""}>
                              {matchup.user2?.username || "BYE"}
                              {matchup.user2 && matchup.winnerId === matchup.user2.id && <Crown className="w-3 h-3 inline ml-1 text-yellow-500" />}
                            </span>
                            {matchup.isComplete && matchup.user2 && <Badge variant="secondary">{matchup.user2Npw ?? 0}</Badge>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={isMember ? "picks" : "standings"} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
          <ScheduleTab currentWeek={league.currentWeek} />
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

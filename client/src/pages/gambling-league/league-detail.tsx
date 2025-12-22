import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { ArrowLeft, Trophy, Calendar, Target, Users, Swords } from "lucide-react";
import type { GamblingLeagueLeague, GamblingLeagueMember, GamblingLeagueMatchupWithUsers, User } from "@shared/schema";

type LeagueWithMembers = GamblingLeagueLeague & {
  members: (GamblingLeagueMember & { user: User })[];
};

export default function LeagueDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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

  const { data: matchups = [] } = useQuery<GamblingLeagueMatchupWithUsers[]>({
    queryKey: ["/api/gambling-league/leagues", id, "matchups", league?.currentWeek],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/leagues/${id}/matchups?week=${league?.currentWeek}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!league,
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
      </div>

      {matchups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Swords className="w-5 h-5" />
              Week {league.currentWeek} Matchups
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                    {matchup.isComplete && <Badge variant="secondary" size="sm">{matchup.user1Npw ?? 0}</Badge>}
                  </div>
                  <span className="text-muted-foreground text-sm">vs</span>
                  <div className="flex items-center gap-2">
                    {matchup.isComplete && matchup.user2 && <Badge variant="secondary" size="sm">{matchup.user2Npw ?? 0}</Badge>}
                    <span className={matchup.winnerId === matchup.user2?.id ? "font-bold text-green-600 dark:text-green-400" : ""}>
                      {matchup.user2?.username || "BYE"}
                    </span>
                  </div>
                </div>
              ))}
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

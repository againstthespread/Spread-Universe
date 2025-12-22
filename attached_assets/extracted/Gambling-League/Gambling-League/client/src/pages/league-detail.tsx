import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Trophy, Calendar } from "lucide-react";
import { PicksTab } from "@/components/picks-tab";
import { StandingsTab } from "@/components/standings-tab";
import { ScheduleTab } from "@/components/schedule-tab";
import type { League, LeagueMember, User } from "@shared/schema";

interface LeagueDetail extends League {
  members: (LeagueMember & { user: User })[];
  memberCount: number;
}

export default function LeagueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: league, isLoading } = useQuery<LeagueDetail>({
    queryKey: ["/api/leagues", id],
    queryFn: async () => {
      const res = await fetch(`/api/leagues/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-heading font-bold mb-2">League Not Found</h2>
          <p className="text-muted-foreground mb-6">This league doesn't exist or you don't have access to it</p>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isMember = league.members.some(m => m.userId === user?.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-heading font-bold">{league.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              {user?.profileImageUrl && (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* League Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Trophy className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={league.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                {league.status}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{league.memberCount}/{league.capacity}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Current Week</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Week {league.currentWeek}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-league">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="picks" data-testid="tab-picks">My Picks</TabsTrigger>
            <TabsTrigger value="standings" data-testid="tab-standings">Standings</TabsTrigger>
            <TabsTrigger value="schedule" data-testid="tab-schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>League Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {league.members.map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-md hover-elevate"
                      data-testid={`member-${member.userId}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      {member.user.profileImageUrl ? (
                        <img
                          src={member.user.profileImageUrl}
                          alt={member.user.firstName || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">
                          {member.user.firstName || member.user.email}
                          {member.userId === league.creatorId && (
                            <Badge variant="outline" className="ml-2">Creator</Badge>
                          )}
                          {member.userId === user?.id && (
                            <Badge variant="outline" className="ml-2">You</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{member.user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="picks">
            <PicksTab leagueId={league.id} currentWeek={league.currentWeek} />
          </TabsContent>

          <TabsContent value="standings">
            <StandingsTab leagueId={league.id} />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleTab leagueId={league.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

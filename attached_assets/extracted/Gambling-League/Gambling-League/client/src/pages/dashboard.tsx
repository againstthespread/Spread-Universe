import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateLeagueDialog } from "@/components/create-league-dialog";
import { JoinLeagueDialog } from "@/components/join-league-dialog";
import { Users, Trophy, TrendingUp, Settings, BarChart3, User as UserIcon } from "lucide-react";
import { Link } from "wouter";
import type { League, LeagueMember, User } from "@shared/schema";

interface LeagueWithMembers extends League {
  memberCount: number;
  userMember?: LeagueMember;
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: leagues = [], isLoading } = useQuery<LeagueWithMembers[]>({
    queryKey: ["/api/leagues"],
    queryFn: async () => {
      const res = await fetch("/api/leagues", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-heading font-bold text-primary">Fantasy League</h1>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const myLeagues = leagues.filter(league => league.userMember);
  const availableLeagues = leagues.filter(league => !league.userMember && league.status === 'open');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-heading font-bold text-primary cursor-pointer hover-elevate px-2 py-1 rounded-md">
                Fantasy League
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/stats">
                <Button variant="outline" size="sm" data-testid="button-stats">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  My Stats
                </Button>
              </Link>
              {user?.isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" data-testid="button-admin">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/profile">
                <Button variant="outline" size="sm" data-testid="button-profile">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="text-sm text-right">
                  <div className="font-medium">{user?.firstName || user?.email}</div>
                  <div className="text-muted-foreground text-xs">{user?.email}</div>
                </div>
                {user?.profileImageUrl && (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                )}
              </div>
              <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-heading font-bold mb-2">
            Welcome back, {user?.firstName || 'Player'}!
          </h2>
          <p className="text-muted-foreground">
            Manage your leagues, make picks, and track your standings
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <CreateLeagueDialog />
          <JoinLeagueDialog />
        </div>

        {/* My Leagues */}
        <section className="mb-12">
          <h3 className="text-2xl font-heading font-semibold mb-6">My Leagues</h3>
          {myLeagues.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-semibold mb-2">No Leagues Yet</h4>
                <p className="text-muted-foreground mb-6">
                  Create your first league or join an existing one to get started
                </p>
                <div className="flex gap-3 justify-center">
                  <CreateLeagueDialog />
                  <JoinLeagueDialog />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myLeagues.map((league) => (
                <Link key={league.id} href={`/league/${league.id}`}>
                  <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-league-${league.id}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-lg font-semibold">{league.name}</CardTitle>
                      <Badge variant={league.status === 'active' ? 'default' : 'secondary'}>
                        {league.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{league.memberCount}/{league.capacity} Members</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          <span>Week {league.currentWeek}</span>
                        </div>
                        <Button className="w-full mt-2" size="sm" data-testid={`button-view-${league.id}`}>
                          View League
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Available Leagues */}
        {availableLeagues.length > 0 && (
          <section>
            <h3 className="text-2xl font-heading font-semibold mb-6">Available Leagues</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableLeagues.slice(0, 6).map((league) => (
                <Card key={league.id} className="hover-elevate" data-testid={`card-available-${league.id}`}>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{league.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{league.memberCount}/{league.capacity} Members</span>
                      </div>
                      <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4">
                        Open
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

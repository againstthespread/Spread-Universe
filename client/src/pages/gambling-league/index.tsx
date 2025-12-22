import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateLeagueDialog } from "@/components/gambling-league/create-league-dialog";
import { JoinLeagueDialog } from "@/components/gambling-league/join-league-dialog";
import { Trophy, Users, ChevronRight, Dices, Calendar } from "lucide-react";
import type { GamblingLeagueLeague } from "@shared/schema";

export default function GamblingLeagueDashboard() {
  const { user } = useAuth();
  const [selectedLeague, setSelectedLeague] = useState<GamblingLeagueLeague | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  const { data: myLeagues = [], isLoading: loadingMyLeagues } = useQuery<GamblingLeagueLeague[]>({
    queryKey: ["/api/gambling-league/my-leagues"],
    enabled: !!user,
  });

  const { data: openLeagues = [], isLoading: loadingOpenLeagues } = useQuery<GamblingLeagueLeague[]>({
    queryKey: ["/api/gambling-league/leagues"],
  });

  const availableLeagues = openLeagues.filter(
    league => !myLeagues.some(ml => ml.id === league.id)
  );

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Dices className="w-8 h-8" />
            Gambling League
          </h1>
          <p className="text-muted-foreground mt-1">
            Create or join betting leagues and compete against the spread
          </p>
        </div>
        {user && <CreateLeagueDialog />}
      </div>

      {user && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            My Leagues
          </h2>
          {loadingMyLeagues ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading your leagues...
              </CardContent>
            </Card>
          ) : myLeagues.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Dices className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Leagues Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create a new league or join an existing one to get started.
                </p>
                <CreateLeagueDialog />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myLeagues.map((league) => (
                <Link key={league.id} href={`/gambling-league/leagues/${league.id}`}>
                  <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-my-league-${league.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">{league.name}</CardTitle>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <CardDescription className="flex items-center gap-2 flex-wrap">
                        <Badge variant={league.status === 'open' ? 'default' : league.status === 'active' ? 'secondary' : 'outline'}>
                          {league.status}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Week {league.currentWeek}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {league.capacity} members max
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Open Leagues
        </h2>
        {loadingOpenLeagues ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading open leagues...
            </CardContent>
          </Card>
        ) : availableLeagues.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Open Leagues</h3>
              <p className="text-muted-foreground">
                All leagues are either full or you're already a member. Create a new league!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableLeagues.map((league) => (
              <Card key={league.id} className="hover-elevate" data-testid={`card-open-league-${league.id}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{league.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default">{league.status}</Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Week {league.currentWeek}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {league.capacity} members max
                  </div>
                  {user ? (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedLeague(league);
                        setJoinDialogOpen(true);
                      }}
                      data-testid={`button-join-${league.id}`}
                    >
                      Join League
                    </Button>
                  ) : (
                    <Link href="/login">
                      <Button className="w-full" variant="outline">
                        Sign in to Join
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <JoinLeagueDialog
        league={selectedLeague}
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
      />
    </div>
  );
}

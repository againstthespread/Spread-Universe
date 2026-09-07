import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { queryClient, apiFetch, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, Search, Loader2, CheckCircle } from "lucide-react";
import type { CfbDraftState, CfbTeam, CfbDraftPickWithDetails } from "@shared/schema";

const ROSTER_SIZE = 7;

function TeamLogo({ team, size = 24 }: { team: CfbTeam; size?: number }) {
  if (!team.logoUrl) return <Shield className="text-muted-foreground" style={{ width: size, height: size }} />;
  return <img src={team.logoUrl} alt={team.displayName} style={{ width: size, height: size }} className="object-contain shrink-0" />;
}

export default function CfbDraftRoom({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data: state, isLoading } = useQuery<CfbDraftState>({
    queryKey: ["/api/cfb/leagues", params.id, "draft"],
    queryFn: async () => {
      const res = await apiFetch(`/api/cfb/leagues/${params.id}/draft`);
      if (!res.ok) throw new Error("Failed to load draft");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: (query) =>
      (query.state.data as CfbDraftState | undefined)?.league.draftStatus === "active" ? 4000 : false,
  });

  const pickMutation = useMutation({
    mutationFn: (teamId: string) =>
      apiRequest("POST", `/api/cfb/leagues/${params.id}/draft/pick`, { teamId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id, "draft"] });
      toast({ title: "Pick submitted!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to submit pick", variant: "destructive" });
    },
  });

  const filteredTeams = useMemo(() => {
    if (!state?.availableTeams) return [];
    if (!search.trim()) return state.availableTeams;
    const q = search.toLowerCase();
    return state.availableTeams.filter(t =>
      t.displayName.toLowerCase().includes(q) || t.abbreviation.toLowerCase().includes(q)
    );
  }, [state?.availableTeams, search]);

  const picksByUserAndRound = useMemo(() => {
    const map: Record<string, Record<number, CfbDraftPickWithDetails>> = {};
    if (!state || state.draftOrder.length === 0) return map;
    const n = state.draftOrder.length;
    for (const pick of state.picks) {
      const round = Math.floor(pick.pickNumber / n) + 1;
      if (!map[pick.userId]) map[pick.userId] = {};
      map[pick.userId][round] = pick;
    }
    return map;
  }, [state]);

  if (isLoading || !state) {
    return (
      <div className="container max-w-6xl mx-auto p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const n = Math.max(1, state.draftOrder.length);
  const isMyTurn = state.currentPickUserId === user?.id;
  const currentRound = Math.floor(state.currentPickNumber / n) + 1;
  const currentPickInRound = (state.currentPickNumber % n) + 1;
  const currentPicker = state.draftOrder.find(d => d.userId === state.currentPickUserId);
  const rounds = Array.from({ length: ROSTER_SIZE }, (_, i) => i + 1);
  const recentPicks = [...state.picks].sort((a, b) => b.pickNumber - a.pickNumber).slice(0, 8);

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/cfb/leagues/${params.id}`}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {state.league.name}
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-500" />
          Draft Room
        </h1>
        {state.isComplete ? (
          <Badge variant="secondary" className="text-sm">
            <CheckCircle className="w-4 h-4 mr-1" />
            Draft Complete
          </Badge>
        ) : (
          <Badge variant="default" className="text-sm">Round {currentRound} — Pick {currentPickInRound}</Badge>
        )}
      </div>

      {!state.isComplete && (
        <Card className={isMyTurn ? "border-red-500 dark:border-red-500" : ""}>
          <CardContent className="p-4 text-center">
            {isMyTurn ? (
              <p className="text-lg font-bold text-red-600 dark:text-red-400" data-testid="text-your-turn">
                It's your pick! Choose a team below.
              </p>
            ) : (
              <p className="text-muted-foreground" data-testid="text-waiting-turn">
                Waiting on <span className="font-semibold text-foreground">{currentPicker?.username ?? "..."}</span> to pick...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {state.isComplete && (
        <Card className="border-emerald-300 dark:border-emerald-700">
          <CardContent className="p-4 text-center space-y-2">
            <p className="font-semibold">The draft is complete! Rosters are set and the schedule has been generated.</p>
            <Button asChild data-testid="button-go-to-league">
              <Link href={`/cfb/leagues/${params.id}`}>Go to League</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Draft board */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Draft Board</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-muted-foreground font-medium">Rd</th>
                    {state.draftOrder.map(d => (
                      <th key={d.userId} className="text-left p-2 font-medium">
                        <span className={d.userId === user?.id ? "text-red-600 dark:text-red-400" : ""}>
                          {d.username}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rounds.map(round => (
                    <tr key={round} className="border-t">
                      <td className="p-2 text-muted-foreground">{round}</td>
                      {state.draftOrder.map(d => {
                        const pick = picksByUserAndRound[d.userId]?.[round];
                        return (
                          <td key={d.userId} className="p-2">
                            {pick ? (
                              <div className="flex items-center gap-1.5" data-testid={`cell-pick-${pick.id}`}>
                                <TeamLogo team={pick.team} size={18} />
                                <span className="truncate max-w-24">{pick.team.abbreviation}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Picks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentPicks.length === 0 && (
                <p className="text-sm text-muted-foreground">No picks yet.</p>
              )}
              {recentPicks.map(pick => (
                <div key={pick.id} className="flex items-center gap-2 p-1.5 rounded bg-muted/40 text-sm" data-testid={`row-pick-${pick.id}`}>
                  <span className="text-muted-foreground w-14">
                    R{Math.floor(pick.pickNumber / n) + 1}.{(pick.pickNumber % n) + 1}
                  </span>
                  <TeamLogo team={pick.team} size={18} />
                  <span className="flex-1 font-medium truncate">{pick.team.displayName}</span>
                  <span className="text-muted-foreground truncate">{pick.user.username}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Available teams */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Available Teams ({state.availableTeams.length})</CardTitle>
              <div className="relative mt-2">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search teams..."
                  className="pl-8"
                  data-testid="input-search-teams"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[32rem] overflow-y-auto">
              {filteredTeams.map(team => (
                <div
                  key={team.id}
                  className="flex items-center gap-2 p-2 rounded bg-muted/30"
                  data-testid={`row-available-team-${team.id}`}
                >
                  <TeamLogo team={team} size={22} />
                  <span className="flex-1 text-sm font-medium truncate">{team.displayName}</span>
                  {isMyTurn && !state.isComplete && (
                    <Button
                      size="sm"
                      onClick={() => pickMutation.mutate(team.id)}
                      disabled={pickMutation.isPending}
                      data-testid={`button-draft-${team.id}`}
                    >
                      Draft
                    </Button>
                  )}
                </div>
              ))}
              {filteredTeams.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">No teams match your search.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

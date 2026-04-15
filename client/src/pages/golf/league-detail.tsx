import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Flag, ArrowLeft, Users, Copy, Trophy, Calendar, UserPlus,
  User, CheckCircle, ChevronUp, ChevronDown, Search, Loader2,
} from "lucide-react";
import type { GolfLeagueDetail, GolfDraftState, GolfLeagueStandingEntry, GolfDraftPickWithDetails } from "@shared/schema";

function DraftStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    pending: "outline",
    active: "default",
    completed: "secondary",
  };
  const labels: Record<string, string> = {
    pending: "Pending Draft",
    active: "Draft Live",
    completed: "Draft Complete",
  };
  return <Badge variant={variants[status] ?? "outline"}>{labels[status] ?? status}</Badge>;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "Starting soon...";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function CountdownTimer({ targetTime }: { targetTime: string | Date }) {
  const [timeLeft, setTimeLeft] = useState(() => new Date(targetTime).getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(new Date(targetTime).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <div className="text-center py-4 space-y-2">
      <p className="text-sm text-muted-foreground uppercase tracking-wide">Draft starts in</p>
      <p className="text-4xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400" data-testid="text-countdown">
        {formatCountdown(timeLeft)}
      </p>
      <p className="text-xs text-muted-foreground">{new Date(targetTime).toLocaleString()}</p>
    </div>
  );
}

function computeTieAwareRanks(scores: (number | null)[]): number[] {
  const ranks: number[] = Array(scores.length).fill(0);
  let rank = 1;
  for (let i = 0; i < scores.length; i++) {
    if (i > 0) {
      const prev = scores[i - 1];
      const curr = scores[i];
      if (curr !== prev) rank = i + 1;
    }
    ranks[i] = rank;
  }
  return ranks;
}

function formatToPar(score: number | null | undefined): string {
  if (score === null || score === undefined) return "—";
  if (score === 0) return "E";
  if (score > 0) return `+${score}`;
  return `${score}`;
}

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />;
  if (rank === 2) return <Trophy className="w-4 h-4 text-slate-400 shrink-0" />;
  if (rank === 3) return <Trophy className="w-4 h-4 text-amber-700 shrink-0" />;
  return <span className="w-5 text-sm text-muted-foreground inline-block text-center">{rank}</span>;
}

export default function GolfLeagueDetail({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteUsername, setInviteUsername] = useState("");
  const [golferSearch, setGolferSearch] = useState("");
  const [localDraftOrder, setLocalDraftOrder] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: league, isLoading: leagueLoading } = useQuery<GolfLeagueDetail>({
    queryKey: ["/api/golf/leagues", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/golf/leagues/${params.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: draftState } = useQuery<GolfDraftState>({
    queryKey: ["/api/golf/leagues", params.id, "draft"],
    queryFn: async () => {
      const res = await fetch(`/api/golf/leagues/${params.id}/draft`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load draft");
      return res.json();
    },
    enabled: !!user && !!league && league.draftStatus !== "pending",
    refetchInterval: (query) =>
      (query.state.data as GolfDraftState | undefined)?.league.draftStatus === "active" ? 4000 : false,
  });

  const { data: standings = [] } = useQuery<GolfLeagueStandingEntry[]>({
    queryKey: ["/api/golf/leagues", params.id, "standings"],
    queryFn: async () => {
      const res = await fetch(`/api/golf/leagues/${params.id}/standings`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!user && !!league,
    refetchInterval: league?.draftStatus === "completed" ? 60000 : false,
  });

  useEffect(() => {
    if (!league) return;
    if (league.draftOrder && league.draftOrder.length > 0) {
      setLocalDraftOrder(league.draftOrder);
    } else {
      setLocalDraftOrder(league.members.map(m => m.userId));
    }
  }, [league]);

  const inviteMutation = useMutation({
    mutationFn: (username: string) =>
      apiRequest("POST", `/api/golf/leagues/${params.id}/invite`, { username }),
    onSuccess: async (res) => {
      const body = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/golf/leagues", params.id] });
      toast({ title: `Invited ${body.username}` });
      setInviteUsername("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to invite", variant: "destructive" });
    },
  });

  const startDraftMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/golf/leagues/${params.id}/start-draft`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/golf/leagues", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/golf/leagues"] });
      toast({ title: "Draft started!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to start draft", variant: "destructive" });
    },
  });

  const saveDraftOrderMutation = useMutation({
    mutationFn: (draftOrder: string[]) =>
      apiRequest("PATCH", `/api/golf/leagues/${params.id}/draft-order`, { draftOrder }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/golf/leagues", params.id] });
      toast({ title: "Draft order saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to save order", variant: "destructive" });
    },
  });

  const pickMutation = useMutation({
    mutationFn: (golferId: string) =>
      apiRequest("POST", `/api/golf/leagues/${params.id}/draft/pick`, { golferId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/golf/leagues", params.id, "draft"] });
      toast({ title: "Pick submitted!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to submit pick", variant: "destructive" });
    },
  });

  const copyCode = () => {
    if (league) {
      navigator.clipboard.writeText(league.joinCode);
      toast({ title: "Join code copied!" });
    }
  };

  const moveMember = (idx: number, direction: "up" | "down") => {
    const newOrder = [...localDraftOrder];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setLocalDraftOrder(newOrder);
  };

  const overallPickToRoundPick = (pickNum: number, totalUsers: number) => {
    const round = Math.floor(pickNum / totalUsers) + 1;
    const pick = (pickNum % totalUsers) + 1;
    return `R${round}.${pick}`;
  };

  const filteredGolfers = useMemo(() => {
    if (!draftState?.availableGolfers) return [];
    if (!golferSearch.trim()) return draftState.availableGolfers;
    const q = golferSearch.toLowerCase();
    return draftState.availableGolfers.filter(g =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
      (g.country?.toLowerCase().includes(q) ?? false)
    );
  }, [draftState?.availableGolfers, golferSearch]);

  const picksByUserAndRound = useMemo(() => {
    const map: Record<string, Record<number, GolfDraftPickWithDetails>> = {};
    if (!draftState) return map;
    const numUsers = draftState.draftOrder.length;
    for (const pick of draftState.picks) {
      const round = Math.floor(pick.pickNumber / numUsers) + 1;
      if (!map[pick.userId]) map[pick.userId] = {};
      map[pick.userId][round] = pick;
    }
    return map;
  }, [draftState]);

  const sortedStandings = useMemo(() => {
    return [...standings].sort((a, b) => {
      if (a.totalScore === null && b.totalScore === null) return 0;
      if (a.totalScore === null) return 1;
      if (b.totalScore === null) return -1;
      return a.totalScore - b.totalScore;
    });
  }, [standings]);

  const tieRanks = useMemo(() => {
    return computeTieAwareRanks(sortedStandings.map(e => e.totalScore));
  }, [sortedStandings]);

  if (leagueLoading) {
    return (
      <div className="container max-w-5xl mx-auto p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!league) {
    return (
      <div className="container max-w-5xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">League not found.</CardContent>
        </Card>
      </div>
    );
  }

  const isCommissioner = user?.id === league.commissionerId;
  const draftTimeReached = now >= new Date(league.draftStartTime).getTime();
  const canStartDraft =
    isCommissioner &&
    league.draftStatus === "pending" &&
    league.members.length >= 2 &&
    draftTimeReached;

  const memberMap = Object.fromEntries(league.members.map(m => [m.userId, m.user.username]));
  const savedOrder = league.draftOrder ?? league.members.map(m => m.userId);
  const orderIsDirty = JSON.stringify(localDraftOrder) !== JSON.stringify(savedOrder);
  const n = draftState?.draftOrder.length ?? league.members.length;
  const isMyTurn = draftState?.currentPickUserId === user?.id;
  const defaultTab = league.draftStatus === "active" ? "draft" : "members";

  const ROUNDS = [1, 2, 3, 4];

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/golf">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Golf Fantasy
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="w-6 h-6 text-emerald-500" />
            {league.name}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4" />
            {league.tournament.name}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <DraftStatusBadge status={league.draftStatus} />
            {isCommissioner && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-600">Commissioner</Badge>
            )}
          </div>
        </div>
        {canStartDraft && (
          <Button
            onClick={() => startDraftMutation.mutate()}
            disabled={startDraftMutation.isPending}
            data-testid="button-start-draft"
          >
            {startDraftMutation.isPending ? "Starting..." : "Start Draft"}
          </Button>
        )}
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" data-testid="tab-members">Members</TabsTrigger>
          <TabsTrigger value="draft" data-testid="tab-draft">Draft Room</TabsTrigger>
          <TabsTrigger value="roster" data-testid="tab-roster">Roster</TabsTrigger>
          <TabsTrigger value="standings" data-testid="tab-standings">Standings</TabsTrigger>
        </TabsList>

        {/* MEMBERS TAB */}
        <TabsContent value="members" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Join Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 text-2xl font-bold tracking-widest text-center p-3 bg-muted rounded-md"
                    data-testid="text-join-code"
                  >
                    {league.joinCode}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyCode} data-testid="button-copy-code">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Share this code with friends to invite them</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> Members
                  </span>
                  <span className="font-medium">{league.members.length} / {league.maxSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Draft Time
                  </span>
                  <span className="font-medium text-right text-xs">
                    {new Date(league.draftStartTime).toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Draft Order</span>
                  <span className="font-medium capitalize">{league.draftOrderType}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Members ({league.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {league.members.map((m, i) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  data-testid={`row-member-${m.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm w-6">{i + 1}.</span>
                    <span className="font-medium" data-testid={`text-member-username-${m.id}`}>{m.user.username}</span>
                    {m.userId === league.commissionerId && (
                      <Badge variant="outline" className="text-xs">Commissioner</Badge>
                    )}
                    {m.userId === user?.id && (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-600">You</Badge>
                    )}
                  </div>
                </div>
              ))}

              {isCommissioner && league.draftStatus === "pending" && league.members.length < league.maxSize && (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Input
                    value={inviteUsername}
                    onChange={e => setInviteUsername(e.target.value)}
                    placeholder="Invite by username"
                    data-testid="input-invite-username"
                    className="flex-1"
                    onKeyDown={e => {
                      if (e.key === "Enter" && inviteUsername.trim()) {
                        inviteMutation.mutate(inviteUsername.trim());
                      }
                    }}
                  />
                  <Button
                    onClick={() => inviteMutation.mutate(inviteUsername.trim())}
                    disabled={!inviteUsername.trim() || inviteMutation.isPending}
                    data-testid="button-invite-user"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {inviteMutation.isPending ? "Inviting..." : "Invite"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DRAFT ROOM TAB */}
        <TabsContent value="draft" className="space-y-4">
          {league.draftStatus === "pending" && (
            <div className="space-y-4">
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-6">
                  <CountdownTimer targetTime={league.draftStartTime} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base">Draft Order</CardTitle>
                    {isCommissioner && league.draftOrderType === "manual" && (
                      <div className="flex gap-2">
                        {orderIsDirty && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocalDraftOrder(savedOrder)}
                            data-testid="button-reset-draft-order"
                          >
                            Reset
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => saveDraftOrderMutation.mutate(localDraftOrder)}
                          disabled={saveDraftOrderMutation.isPending || !orderIsDirty}
                          data-testid="button-save-draft-order"
                        >
                          {saveDraftOrderMutation.isPending ? "Saving..." : "Save Order"}
                        </Button>
                      </div>
                    )}
                  </div>
                  {isCommissioner && league.draftOrderType === "manual" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Use arrows to arrange pick order. Round 2 automatically reverses (snake draft).
                    </p>
                  )}
                  {league.draftOrderType === "random" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Order is randomized when the draft starts.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-1">
                  {localDraftOrder.map((userId, idx) => (
                    <div
                      key={userId}
                      className="flex items-center gap-2 p-2 rounded bg-muted/40"
                      data-testid={`row-draft-order-${userId}`}
                    >
                      <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                      <span className="flex-1 text-sm font-medium">{memberMap[userId] ?? "Unknown"}</span>
                      {userId === user?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                      {isCommissioner && league.draftOrderType === "manual" && (
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => moveMember(idx, "up")}
                            disabled={idx === 0}
                            data-testid={`button-order-up-${userId}`}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => moveMember(idx, "down")}
                            disabled={idx === localDraftOrder.length - 1}
                            data-testid={`button-order-down-${userId}`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {localDraftOrder.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">No members yet.</p>
                  )}
                </CardContent>
              </Card>

              {canStartDraft && (
                <Button
                  className="w-full"
                  onClick={() => startDraftMutation.mutate()}
                  disabled={startDraftMutation.isPending}
                  data-testid="button-start-draft-tab"
                >
                  {startDraftMutation.isPending ? "Starting..." : "Start Draft Now"}
                </Button>
              )}
              {isCommissioner && !canStartDraft && league.members.length < 2 && (
                <p className="text-center text-sm text-muted-foreground">
                  At least 2 members needed to start the draft.
                </p>
              )}
              {isCommissioner && !canStartDraft && league.members.length >= 2 && !draftTimeReached && (
                <p className="text-center text-sm text-muted-foreground">
                  Draft can be started after the scheduled draft time.
                </p>
              )}
            </div>
          )}

          {(league.draftStatus === "active" || league.draftStatus === "completed") && !draftState && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {(league.draftStatus === "active" || league.draftStatus === "completed") && draftState && (
            <div className="space-y-4">
              {league.draftStatus === "active" && !draftState.isComplete && (
                <Card className={isMyTurn ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20" : ""}>
                  <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
                    {isMyTurn ? (
                      <div>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">It's your turn!</p>
                        <p className="text-sm text-muted-foreground">Select a golfer from the list below</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-semibold">
                          Waiting for{" "}
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {draftState.draftOrder.find(d => d.userId === draftState.currentPickUserId)?.username ?? "..."}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">to make their pick</p>
                      </div>
                    )}
                    <Badge variant="default" className="text-sm px-3 py-1">
                      Pick {draftState.currentPickNumber + 1} of {n * 4}
                      {" · "}
                      {overallPickToRoundPick(draftState.currentPickNumber, n)}
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {draftState.isComplete && (
                <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Draft Complete!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      View rosters and standings in the tabs above.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Snake Draft Board */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Snake Draft Board</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-24">Team</TableHead>
                        {ROUNDS.map(r => (
                          <TableHead key={r} className="min-w-36">Round {r}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draftState.draftOrder.map(({ userId, username }) => {
                        const userPicks = picksByUserAndRound[userId] ?? {};
                        return (
                          <TableRow
                            key={userId}
                            className={userId === user?.id ? "bg-emerald-50/50 dark:bg-emerald-950/10" : ""}
                            data-testid={`row-board-${userId}`}
                          >
                            <TableCell className="font-medium text-sm">
                              {username}
                              {userId === user?.id && (
                                <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400">(you)</span>
                              )}
                            </TableCell>
                            {ROUNDS.map(r => {
                              const pick = userPicks[r];
                              const numUsers = draftState.draftOrder.length;
                              const roundStartPick = (r - 1) * numUsers;
                              const pos = draftState.draftOrder.findIndex(d => d.userId === userId);
                              const snakePos = r % 2 === 1 ? pos : numUsers - 1 - pos;
                              const absolutePickNum = roundStartPick + snakePos;
                              const isCurrentPick =
                                !draftState.isComplete &&
                                league.draftStatus === "active" &&
                                absolutePickNum === draftState.currentPickNumber;
                              return (
                                <TableCell
                                  key={r}
                                  className={`text-sm ${isCurrentPick ? "bg-emerald-100 dark:bg-emerald-900/40" : ""}`}
                                  data-testid={`cell-board-${userId}-r${r}`}
                                >
                                  <div className="text-xs text-muted-foreground mb-0.5">
                                    Pick #{absolutePickNum + 1}
                                  </div>
                                  {pick ? (
                                    <div>
                                      <span className="text-xs text-muted-foreground">#{pick.golfer.worldRank}</span>
                                      <span className="ml-1 font-medium">{pick.golfer.firstName} {pick.golfer.lastName}</span>
                                    </div>
                                  ) : (
                                    <span className={`text-muted-foreground ${isCurrentPick ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}`}>
                                      {isCurrentPick ? "Picking..." : "—"}
                                    </span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Golfer picker when active */}
              {league.draftStatus === "active" && !draftState.isComplete && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Available Golfers</h3>
                    <span className="text-muted-foreground text-xs">({draftState.availableGolfers.length})</span>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search by name or country..."
                      value={golferSearch}
                      onChange={e => setGolferSearch(e.target.value)}
                      data-testid="input-golfer-search"
                    />
                  </div>
                  <div className="grid gap-1.5 max-h-[52vh] overflow-y-auto pr-1">
                    {filteredGolfers.map(golfer => (
                      <Card
                        key={golfer.id}
                        className={`transition-colors ${isMyTurn ? "cursor-pointer hover:border-emerald-400 hover:bg-muted/50" : "opacity-60"}`}
                        data-testid={`card-golfer-${golfer.id}`}
                        onClick={() => {
                          if (isMyTurn && !pickMutation.isPending) {
                            pickMutation.mutate(golfer.id);
                          }
                        }}
                      >
                        <CardContent className="p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-xs w-8 font-mono">#{golfer.worldRank}</span>
                            <div>
                              <p className="font-medium text-sm">{golfer.firstName} {golfer.lastName}</p>
                              <p className="text-xs text-muted-foreground">{golfer.country}</p>
                            </div>
                          </div>
                          {isMyTurn && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs shrink-0"
                              disabled={pickMutation.isPending}
                              onClick={e => {
                                e.stopPropagation();
                                pickMutation.mutate(golfer.id);
                              }}
                              data-testid={`button-pick-${golfer.id}`}
                            >
                              Draft
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {filteredGolfers.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">No golfers found</p>
                    )}
                  </div>
                </div>
              )}

              {/* Pick log */}
              {draftState.picks.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pick Log</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                    {[...draftState.picks].reverse().map(pick => (
                      <div key={pick.id} className="text-xs text-muted-foreground flex gap-1 flex-wrap">
                        <span className="font-medium text-foreground">{pick.user.username}</span>
                        <span>drafted</span>
                        <span className="font-medium text-foreground">
                          {pick.golfer.firstName} {pick.golfer.lastName}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ROSTER TAB */}
        <TabsContent value="roster" className="space-y-4">
          {league.draftStatus === "pending" ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Rosters will appear after the draft completes.
              </CardContent>
            </Card>
          ) : !draftState ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {draftState.draftOrder.map(({ userId, username }) => {
                const picks = draftState.picks.filter(p => p.userId === userId);
                const standingEntry = standings.find(s => s.userId === userId);
                const rosterWithScores = standingEntry?.roster ?? [];

                return (
                  <Card
                    key={userId}
                    className={userId === user?.id ? "border-emerald-400 dark:border-emerald-600" : ""}
                    data-testid={`card-roster-${userId}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {username}
                          {userId === user?.id && (
                            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-600">You</Badge>
                          )}
                        </CardTitle>
                        {standingEntry && standingEntry.totalScore !== null && (
                          <div className="text-right">
                            <span className="font-bold text-sm">{formatToPar(standingEntry.totalScore)}</span>
                            <span className="text-xs text-muted-foreground ml-1">to par</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {ROUNDS.map(slot => {
                        const pick = picks[slot - 1];
                        if (!pick) {
                          return (
                            <div
                              key={`tbd-${slot}`}
                              className="flex items-center gap-2 p-1.5 bg-muted/20 rounded border border-dashed border-muted-foreground/30 text-muted-foreground"
                              data-testid={`row-tbd-${userId}-${slot}`}
                            >
                              <span className="text-xs w-8 text-center font-mono">—</span>
                              <span className="text-sm italic">TBD</span>
                            </div>
                          );
                        }
                        const rosterEntry = rosterWithScores.find(r => r.golfer.id === pick.golfer.id);
                        const scores = rosterEntry?.scores ?? [];
                        const total = rosterEntry?.totalScore ?? null;

                        return (
                          <div
                            key={pick.id}
                            className="flex items-start gap-2 p-1.5 bg-muted/40 rounded"
                            data-testid={`row-pick-${userId}-${pick.golfer.id}`}
                          >
                            {pick.golfer.photoUrl ? (
                              <img
                                src={pick.golfer.photoUrl}
                                alt={`${pick.golfer.firstName} ${pick.golfer.lastName}`}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                                data-testid={`img-golfer-${pick.golfer.id}`}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0"
                                data-testid={`avatar-golfer-${pick.golfer.id}`}
                              >
                                {pick.golfer.firstName[0]}{pick.golfer.lastName[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium">{pick.golfer.firstName} {pick.golfer.lastName}</p>
                                <span className="text-xs text-muted-foreground">#{pick.golfer.worldRank}</span>
                                {pick.golfer.country && (
                                  <span className="text-xs text-muted-foreground">{pick.golfer.country}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {ROUNDS.map(r => {
                                  const scoreEntry = scores.find(s => s.round === r);
                                  return (
                                    <span key={r} className="text-xs text-muted-foreground">
                                      R{r}: {scoreEntry ? formatToPar(scoreEntry.score) : "—"}
                                    </span>
                                  );
                                })}
                                {total !== null && (
                                  <span className="text-xs font-semibold bg-muted px-1.5 py-0.5 rounded">
                                    {formatToPar(total)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* STANDINGS TAB */}
        <TabsContent value="standings" className="space-y-4">
          {sortedStandings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {league.draftStatus === "pending"
                  ? "Standings will be available once the draft completes and scores are entered."
                  : "No scores entered yet. Check back when the tournament begins."}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Most under par wins — only rounds with scores entered count.
              </p>
              {sortedStandings.map((entry, index) => (
                <Card
                  key={entry.userId}
                  className={entry.userId === user?.id ? "border-emerald-400 dark:border-emerald-600" : ""}
                  data-testid={`card-standing-${entry.userId}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <RankDisplay rank={tieRanks[index]} />
                        <span className="font-semibold" data-testid={`text-standing-username-${entry.userId}`}>
                          {entry.username}
                        </span>
                        {entry.userId === user?.id && (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-600">You</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" data-testid={`text-total-score-${entry.userId}`}>
                          {entry.totalScore !== null ? formatToPar(entry.totalScore) : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">to par</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-1.5">
                      {entry.roster.map(rosterEntry => (
                        <div
                          key={rosterEntry.golfer.id}
                          className="flex items-center justify-between text-sm p-1.5 rounded bg-muted/40"
                          data-testid={`row-roster-${entry.userId}-${rosterEntry.golfer.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs w-8">#{rosterEntry.golfer.worldRank}</span>
                            <span className="text-sm">{rosterEntry.golfer.firstName} {rosterEntry.golfer.lastName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {ROUNDS.map(r => {
                              const s = rosterEntry.scores.find(sc => sc.round === r);
                              return (
                                <span key={r} className="text-xs text-muted-foreground">
                                  R{r}:{s ? formatToPar(s.score) : "—"}
                                </span>
                              );
                            })}
                            {rosterEntry.scores.length > 0 && (
                              <span className="font-medium text-xs bg-muted px-2 py-0.5 rounded">
                                {formatToPar(rosterEntry.totalScore)}
                              </span>
                            )}
                            {rosterEntry.scores.length === 0 && (
                              <span className="text-xs text-muted-foreground">no scores</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

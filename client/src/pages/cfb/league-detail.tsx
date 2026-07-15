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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, ArrowLeft, Users, Copy, Trophy, UserPlus, Loader2,
  ChevronUp, ChevronDown, Swords, ArrowRightLeft, ListChecks,
} from "lucide-react";
import type {
  CfbLeagueDetail, CfbRosterEntry, CfbLineupRow, CfbMatchupWithDetails,
  CfbStandingEntry, CfbTradeWithDetails, CfbTeam, CfbGame,
} from "@shared/schema";

const LINEUP_SIZE = 5;
const REGULAR_SEASON_WEEKS = 11;
const TOTAL_WEEKS = 14;

function TeamLogo({ team, size = 24 }: { team: CfbTeam; size?: number }) {
  if (!team.logoUrl) return <Shield className="text-muted-foreground shrink-0" style={{ width: size, height: size }} />;
  return <img src={team.logoUrl} alt={team.displayName} style={{ width: size, height: size }} className="object-contain shrink-0" />;
}

function DraftStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    pending: "outline",
    active: "default",
    completed: "secondary",
  };
  const labels: Record<string, string> = {
    pending: "Pending Draft",
    active: "Draft Live",
    completed: "In Season",
  };
  return <Badge variant={variants[status] ?? "outline"}>{labels[status] ?? status}</Badge>;
}

function weekLabel(week: number) {
  if (week === 12) return "Week 12 — Quarterfinals";
  if (week === 13) return "Week 13 — Semifinals";
  if (week === 14) return "Week 14 — Championship";
  return `Week ${week}`;
}

function GameResult({ game, espnTeamId, won }: { game: CfbGame | null; espnTeamId: number; won: boolean | null }) {
  if (!game) return <span className="text-xs text-muted-foreground">No game</span>;
  const isHome = game.homeEspnTeamId === espnTeamId;
  const opp = isHome ? game.awayTeamName : game.homeTeamName;
  const myScore = isHome ? game.homeScore : game.awayScore;
  const oppScore = isHome ? game.awayScore : game.homeScore;
  if (game.status !== "final" || myScore === null || oppScore === null) {
    return <span className="text-xs text-muted-foreground truncate">{isHome ? "vs" : "@"} {opp}</span>;
  }
  return (
    <span className={`text-xs font-medium ${won ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
      {won ? "W" : "L"} {myScore}-{oppScore} {isHome ? "vs" : "@"} {opp}
    </span>
  );
}

export default function CfbLeagueDetail({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteUsername, setInviteUsername] = useState("");
  const [localDraftOrder, setLocalDraftOrder] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [lineupSelection, setLineupSelection] = useState<string[]>([]);
  const [dropTeamId, setDropTeamId] = useState<string | null>(null);
  const [tradePartnerId, setTradePartnerId] = useState<string>("");
  const [myTradeTeams, setMyTradeTeams] = useState<string[]>([]);
  const [theirTradeTeams, setTheirTradeTeams] = useState<string[]>([]);

  const { data: league, isLoading: leagueLoading } = useQuery<CfbLeagueDetail>({
    queryKey: ["/api/cfb/leagues", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/cfb/leagues/${params.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!user,
  });

  const week = selectedWeek ?? league?.currentWeek ?? 1;
  const draftDone = league?.draftStatus === "completed";

  const { data: roster = [] } = useQuery<CfbRosterEntry[]>({
    queryKey: ["/api/cfb/leagues", params.id, "roster"],
    queryFn: async () => {
      const res = await fetch(`/api/cfb/leagues/${params.id}/roster`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user && draftDone,
  });

  const { data: lineup = [] } = useQuery<CfbLineupRow[]>({
    queryKey: ["/api/cfb/leagues", params.id, "lineup", league?.currentWeek],
    queryFn: async () => {
      const res = await fetch(`/api/cfb/leagues/${params.id}/lineup?week=${league?.currentWeek}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user && draftDone && !!league,
  });

  const { data: matchups = [] } = useQuery<CfbMatchupWithDetails[]>({
    queryKey: ["/api/cfb/leagues", params.id, "matchups", week],
    queryFn: async () => {
      const res = await fetch(`/api/cfb/leagues/${params.id}/matchups?week=${week}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user && draftDone,
  });

  const { data: standings = [] } = useQuery<CfbStandingEntry[]>({
    queryKey: ["/api/cfb/leagues", params.id, "standings"],
    queryFn: async () => {
      const res = await fetch(`/api/cfb/leagues/${params.id}/standings`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user && draftDone,
  });

  const { data: freeAgents = [] } = useQuery<CfbTeam[]>({
    queryKey: ["/api/cfb/leagues", params.id, "free-agents"],
    queryFn: async () => {
      const res = await fetch(`/api/cfb/leagues/${params.id}/free-agents`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user && draftDone,
  });

  const { data: trades = [] } = useQuery<CfbTradeWithDetails[]>({
    queryKey: ["/api/cfb/leagues", params.id, "trades"],
    queryFn: async () => {
      const res = await fetch(`/api/cfb/leagues/${params.id}/trades`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user && draftDone,
  });

  const { data: partnerRoster = [] } = useQuery<CfbRosterEntry[]>({
    queryKey: ["/api/cfb/leagues", params.id, "roster", tradePartnerId],
    queryFn: async () => {
      const res = await fetch(`/api/cfb/leagues/${params.id}/roster?userId=${tradePartnerId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user && draftDone && !!tradePartnerId,
  });

  useEffect(() => {
    if (!league) return;
    if (league.draftOrder && league.draftOrder.length > 0) {
      setLocalDraftOrder(league.draftOrder);
    } else {
      setLocalDraftOrder(league.members.map(m => m.userId));
    }
  }, [league]);

  useEffect(() => {
    setLineupSelection(lineup.map(l => l.teamId));
  }, [lineup]);

  const inviteMutation = useMutation({
    mutationFn: (username: string) =>
      apiRequest("POST", `/api/cfb/leagues/${params.id}/invite`, { username }),
    onSuccess: async (res) => {
      const body = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id] });
      toast({ title: `Invited ${body.username}` });
      setInviteUsername("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to invite", variant: "destructive" });
    },
  });

  const startDraftMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/cfb/leagues/${params.id}/start-draft`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues"] });
      toast({ title: "Draft started!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to start draft", variant: "destructive" });
    },
  });

  const saveDraftOrderMutation = useMutation({
    mutationFn: (draftOrder: string[]) =>
      apiRequest("PATCH", `/api/cfb/leagues/${params.id}/draft-order`, { draftOrder }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id] });
      toast({ title: "Draft order saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to save order", variant: "destructive" });
    },
  });

  const saveLineupMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/cfb/leagues/${params.id}/lineup`, {
        week: league?.currentWeek,
        teamIds: lineupSelection,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id, "lineup", league?.currentWeek] });
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id, "matchups"] });
      toast({ title: "Lineup saved!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to save lineup", variant: "destructive" });
    },
  });

  const claimMutation = useMutation({
    mutationFn: (vars: { addTeamId: string; dropTeamId: string }) =>
      apiRequest("POST", `/api/cfb/leagues/${params.id}/free-agents/claim`, vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id, "roster"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id, "free-agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id, "lineup", league?.currentWeek] });
      toast({ title: "Team claimed!" });
      setDropTeamId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to claim", variant: "destructive" });
    },
  });

  const proposeTradeMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/cfb/leagues/${params.id}/trades`, {
        receiverId: tradePartnerId,
        proposerTeamIds: myTradeTeams,
        receiverTeamIds: theirTradeTeams,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id, "trades"] });
      toast({ title: "Trade proposed!" });
      setMyTradeTeams([]);
      setTheirTradeTeams([]);
      setTradePartnerId("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to propose trade", variant: "destructive" });
    },
  });

  const respondTradeMutation = useMutation({
    mutationFn: (vars: { tradeId: string; action: string }) =>
      apiRequest("POST", `/api/cfb/leagues/${params.id}/trades/${vars.tradeId}/respond`, { action: vars.action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id, "trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id, "roster"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/leagues", params.id, "lineup", league?.currentWeek] });
      toast({ title: "Trade updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to respond", variant: "destructive" });
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

  const toggleLineupTeam = (teamId: string) => {
    setLineupSelection(prev => {
      if (prev.includes(teamId)) return prev.filter(id => id !== teamId);
      if (prev.length >= LINEUP_SIZE) return prev;
      return [...prev, teamId];
    });
  };

  const myMatchup = useMemo(
    () => matchups.find(m => m.user1Id === user?.id || m.user2Id === user?.id),
    [matchups, user?.id],
  );
  const otherMatchups = useMemo(
    () => matchups.filter(m => m !== myMatchup),
    [matchups, myMatchup],
  );

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
  const canStartDraft = isCommissioner && league.draftStatus === "pending" && league.members.length >= 2;
  const memberMap = Object.fromEntries(league.members.map(m => [m.userId, m.user.username]));
  const savedOrder = league.draftOrder ?? league.members.map(m => m.userId);
  const orderIsDirty = JSON.stringify(localDraftOrder) !== JSON.stringify(savedOrder);
  const lineupIsDirty = JSON.stringify([...lineupSelection].sort()) !== JSON.stringify(lineup.map(l => l.teamId).sort());
  const currentWeekMatchupComplete = matchups.some(
    m => (m.user1Id === user?.id || m.user2Id === user?.id) && m.week === league.currentWeek && m.isComplete,
  );
  const defaultTab = draftDone ? "matchup" : "members";

  const renderLineupSide = (
    entries: { team: CfbTeam; game: CfbGame | null; won: boolean | null }[],
    wins: number | null,
    username: string,
    highlight: boolean,
  ) => (
    <div className="flex-1 min-w-0 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className={`font-semibold truncate ${highlight ? "text-red-600 dark:text-red-400" : ""}`}>{username}</span>
        <span className="text-2xl font-bold tabular-nums">{wins ?? "—"}</span>
      </div>
      {entries.length === 0 && <p className="text-xs text-muted-foreground">No lineup set</p>}
      {entries.map(e => (
        <div key={e.team.id} className="flex items-center gap-2">
          <TeamLogo team={e.team} size={18} />
          <span className="text-sm truncate flex-1">{e.team.name}</span>
          <GameResult game={e.game} espnTeamId={e.team.espnTeamId} won={e.won} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/cfb">
            <ArrowLeft className="w-4 h-4 mr-1" />
            CFB Conferences
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" />
            {league.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {league.season} Season {draftDone && `• ${weekLabel(league.currentWeek)}`}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <DraftStatusBadge status={league.draftStatus} />
            {isCommissioner && (
              <Badge variant="outline" className="text-red-600 border-red-600">Commissioner</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {canStartDraft && (
            <Button
              onClick={() => startDraftMutation.mutate()}
              disabled={startDraftMutation.isPending}
              data-testid="button-start-draft"
            >
              {startDraftMutation.isPending ? "Starting..." : "Start Draft"}
            </Button>
          )}
          {league.draftStatus === "active" && (
            <Button asChild data-testid="button-enter-draft">
              <Link href={`/cfb/leagues/${params.id}/draft`}>Enter Draft Room</Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          {draftDone && <TabsTrigger value="matchup" data-testid="tab-matchup"><Swords className="w-4 h-4 mr-1" />Matchup</TabsTrigger>}
          {draftDone && <TabsTrigger value="roster" data-testid="tab-roster"><ListChecks className="w-4 h-4 mr-1" />Roster</TabsTrigger>}
          {draftDone && <TabsTrigger value="standings" data-testid="tab-standings"><Trophy className="w-4 h-4 mr-1" />Standings</TabsTrigger>}
          {draftDone && <TabsTrigger value="freeagency" data-testid="tab-freeagency"><UserPlus className="w-4 h-4 mr-1" />Free Agency</TabsTrigger>}
          {draftDone && <TabsTrigger value="trades" data-testid="tab-trades"><ArrowRightLeft className="w-4 h-4 mr-1" />Trades</TabsTrigger>}
          <TabsTrigger value="members" data-testid="tab-members"><Users className="w-4 h-4 mr-1" />Members</TabsTrigger>
        </TabsList>

        {/* MATCHUP TAB */}
        {draftDone && (
          <TabsContent value="matchup" className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Week</span>
              <Select value={String(week)} onValueChange={v => setSelectedWeek(parseInt(v, 10))}>
                <SelectTrigger className="w-56" data-testid="select-matchup-week">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(w => (
                    <SelectItem key={w} value={String(w)}>{weekLabel(w)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {matchups.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No matchups for this week{week > REGULAR_SEASON_WEEKS ? " yet — playoff matchups are generated as prior rounds finish." : "."}
                </CardContent>
              </Card>
            )}

            {myMatchup && (
              <Card className="border-red-300 dark:border-red-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Swords className="w-4 h-4" />
                    Your Matchup
                    {myMatchup.isPlayoff && <Badge variant="secondary" className="capitalize">{myMatchup.playoffRound}</Badge>}
                    {myMatchup.isComplete && (
                      <Badge variant={myMatchup.winnerId === user?.id ? "default" : myMatchup.winnerId === null ? "outline" : "destructive"}>
                        {myMatchup.winnerId === user?.id ? "Won" : myMatchup.winnerId === null ? "Draw" : "Lost"}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {myMatchup.user2 === null ? (
                    <p className="text-sm text-muted-foreground">Bye week — automatic win.</p>
                  ) : (
                    <div className="flex gap-6 flex-col sm:flex-row">
                      {renderLineupSide(myMatchup.user1Lineup, myMatchup.user1Wins, myMatchup.user1.username, myMatchup.user1.id === user?.id)}
                      <div className="hidden sm:flex items-center text-muted-foreground font-bold">vs</div>
                      {renderLineupSide(myMatchup.user2Lineup, myMatchup.user2Wins, myMatchup.user2.username, myMatchup.user2.id === user?.id)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {otherMatchups.map(m => (
              <Card key={m.id} data-testid={`card-matchup-${m.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    {m.user1.username} vs {m.user2?.username ?? "BYE"}
                    {m.isPlayoff && <Badge variant="secondary" className="capitalize text-xs">{m.playoffRound}</Badge>}
                    {m.isComplete && m.winnerId && (
                      <Badge variant="outline" className="text-xs">
                        {m.winnerId === m.user1Id ? m.user1.username : m.user2?.username} won
                      </Badge>
                    )}
                    {m.isComplete && !m.winnerId && <Badge variant="outline" className="text-xs">Draw</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {m.user2 === null ? (
                    <p className="text-sm text-muted-foreground">Bye week — automatic win for {m.user1.username}.</p>
                  ) : (
                    <div className="flex gap-6 flex-col sm:flex-row">
                      {renderLineupSide(m.user1Lineup, m.user1Wins, m.user1.username, false)}
                      <div className="hidden sm:flex items-center text-muted-foreground font-bold">vs</div>
                      {renderLineupSide(m.user2Lineup, m.user2Wins, m.user2.username, false)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        {/* ROSTER TAB */}
        {draftDone && (
          <TabsContent value="roster" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base">
                    My Roster — {weekLabel(league.currentWeek)} Lineup ({lineupSelection.length}/{LINEUP_SIZE} starters)
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => saveLineupMutation.mutate()}
                    disabled={lineupSelection.length !== LINEUP_SIZE || !lineupIsDirty || saveLineupMutation.isPending || currentWeekMatchupComplete}
                    data-testid="button-save-lineup"
                  >
                    {saveLineupMutation.isPending ? "Saving..." : "Save Lineup"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Check exactly {LINEUP_SIZE} teams to start this week. Most straight-up wins beats your opponent.
                  {currentWeekMatchupComplete && " This week is already scored — lineup is locked."}
                </p>
              </CardHeader>
              <CardContent className="space-y-1">
                {roster.length === 0 && <p className="text-sm text-muted-foreground">No teams on your roster.</p>}
                {roster.map(entry => (
                  <div
                    key={entry.team.id}
                    className="flex items-center gap-3 p-2 rounded bg-muted/40"
                    data-testid={`row-roster-${entry.team.id}`}
                  >
                    <Checkbox
                      checked={lineupSelection.includes(entry.team.id)}
                      onCheckedChange={() => toggleLineupTeam(entry.team.id)}
                      disabled={currentWeekMatchupComplete || (!lineupSelection.includes(entry.team.id) && lineupSelection.length >= LINEUP_SIZE)}
                      data-testid={`checkbox-lineup-${entry.team.id}`}
                    />
                    <TeamLogo team={entry.team} size={24} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.team.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.record.wins}-{entry.record.losses} • via {entry.acquiredVia}
                      </p>
                    </div>
                    <div className="text-right">
                      {entry.thisWeekGame ? (
                        <GameResult game={entry.thisWeekGame} espnTeamId={entry.team.espnTeamId} won={null} />
                      ) : (
                        <span className="text-xs text-muted-foreground">No game this week</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* STANDINGS TAB */}
        {draftDone && (
          <TabsContent value="standings">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Standings
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Sorted by record, then total team wins. Top 6 make the playoffs (top 2 get byes).
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead className="text-right">W-L-D</TableHead>
                      <TableHead className="text-right">Team Wins</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((s, i) => (
                      <TableRow key={s.userId} data-testid={`row-standing-${s.userId}`}>
                        <TableCell className="text-muted-foreground">
                          {i + 1}
                          {i < 2 && <Badge variant="secondary" className="ml-1 text-[10px] px-1">BYE</Badge>}
                          {i >= 2 && i < 6 && <Badge variant="outline" className="ml-1 text-[10px] px-1">PO</Badge>}
                        </TableCell>
                        <TableCell className={s.userId === user?.id ? "font-bold" : ""}>
                          {s.username}
                          {s.userId === user?.id && <span className="text-red-500 ml-1">(You)</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{s.wins}-{s.losses}-{s.draws}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.totalTeamWins}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* FREE AGENCY TAB */}
        {draftDone && (
          <TabsContent value="freeagency" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Free Agents ({freeAgents.length})</CardTitle>
                <p className="text-xs text-muted-foreground">
                  To add a team you must drop one. Select the team to drop, then claim.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm">Drop:</span>
                  <Select value={dropTeamId ?? ""} onValueChange={setDropTeamId}>
                    <SelectTrigger className="w-64" data-testid="select-drop-team">
                      <SelectValue placeholder="Select team to drop" />
                    </SelectTrigger>
                    <SelectContent>
                      {roster.map(e => (
                        <SelectItem key={e.team.id} value={e.team.id}>{e.team.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {freeAgents.map(team => (
                    <div key={team.id} className="flex items-center gap-2 p-2 rounded bg-muted/30" data-testid={`row-free-agent-${team.id}`}>
                      <TeamLogo team={team} size={22} />
                      <span className="flex-1 text-sm font-medium truncate">{team.displayName}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!dropTeamId || claimMutation.isPending}
                        onClick={() => dropTeamId && claimMutation.mutate({ addTeamId: team.id, dropTeamId })}
                        data-testid={`button-claim-${team.id}`}
                      >
                        Claim
                      </Button>
                    </div>
                  ))}
                  {freeAgents.length === 0 && <p className="text-sm text-muted-foreground">No free agents available.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* TRADES TAB */}
        {draftDone && (
          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Propose Trade</CardTitle>
                <p className="text-xs text-muted-foreground">Trades must swap an equal number of teams (1-3).</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={tradePartnerId} onValueChange={v => { setTradePartnerId(v); setTheirTradeTeams([]); }}>
                  <SelectTrigger className="w-64" data-testid="select-trade-partner">
                    <SelectValue placeholder="Select trade partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {league.members.filter(m => m.userId !== user?.id).map(m => (
                      <SelectItem key={m.userId} value={m.userId}>{m.user.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {tradePartnerId && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium mb-2">You send:</p>
                      <div className="space-y-1">
                        {roster.map(e => (
                          <label key={e.team.id} className="flex items-center gap-2 p-1.5 rounded bg-muted/30 cursor-pointer">
                            <Checkbox
                              checked={myTradeTeams.includes(e.team.id)}
                              onCheckedChange={(c) =>
                                setMyTradeTeams(prev => c ? [...prev, e.team.id] : prev.filter(id => id !== e.team.id))
                              }
                              data-testid={`checkbox-my-trade-${e.team.id}`}
                            />
                            <TeamLogo team={e.team} size={18} />
                            <span className="text-sm truncate">{e.team.displayName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">You receive:</p>
                      <div className="space-y-1">
                        {partnerRoster.map(e => (
                          <label key={e.team.id} className="flex items-center gap-2 p-1.5 rounded bg-muted/30 cursor-pointer">
                            <Checkbox
                              checked={theirTradeTeams.includes(e.team.id)}
                              onCheckedChange={(c) =>
                                setTheirTradeTeams(prev => c ? [...prev, e.team.id] : prev.filter(id => id !== e.team.id))
                              }
                              data-testid={`checkbox-their-trade-${e.team.id}`}
                            />
                            <TeamLogo team={e.team} size={18} />
                            <span className="text-sm truncate">{e.team.displayName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => proposeTradeMutation.mutate()}
                  disabled={
                    !tradePartnerId ||
                    myTradeTeams.length === 0 ||
                    myTradeTeams.length !== theirTradeTeams.length ||
                    proposeTradeMutation.isPending
                  }
                  data-testid="button-propose-trade"
                >
                  {proposeTradeMutation.isPending ? "Proposing..." : "Propose Trade"}
                </Button>
                {tradePartnerId && myTradeTeams.length !== theirTradeTeams.length && (myTradeTeams.length > 0 || theirTradeTeams.length > 0) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">Select the same number of teams on both sides.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Trade History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {trades.length === 0 && <p className="text-sm text-muted-foreground">No trades yet.</p>}
                {trades.map(t => {
                  const iAmReceiver = t.receiverId === user?.id;
                  const iAmProposer = t.proposerId === user?.id;
                  return (
                    <div key={t.id} className="p-3 rounded border space-y-2" data-testid={`card-trade-${t.id}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{t.proposer.username} → {t.receiver.username}</span>
                        <Badge
                          variant={t.status === "pending" ? "outline" : t.status === "accepted" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {t.status}
                        </Badge>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t.proposer.username} sends:</p>
                          {t.proposerTeams.map(team => (
                            <div key={team.id} className="flex items-center gap-1.5">
                              <TeamLogo team={team} size={16} />
                              <span className="truncate">{team.displayName}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t.receiver.username} sends:</p>
                          {t.receiverTeams.map(team => (
                            <div key={team.id} className="flex items-center gap-1.5">
                              <TeamLogo team={team} size={16} />
                              <span className="truncate">{team.displayName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {t.status === "pending" && (iAmReceiver || iAmProposer) && (
                        <div className="flex gap-2 pt-1">
                          {iAmReceiver && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => respondTradeMutation.mutate({ tradeId: t.id, action: "accept" })}
                                disabled={respondTradeMutation.isPending}
                                data-testid={`button-accept-trade-${t.id}`}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => respondTradeMutation.mutate({ tradeId: t.id, action: "reject" })}
                                disabled={respondTradeMutation.isPending}
                                data-testid={`button-reject-trade-${t.id}`}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {iAmProposer && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => respondTradeMutation.mutate({ tradeId: t.id, action: "cancel" })}
                              disabled={respondTradeMutation.isPending}
                              data-testid={`button-cancel-trade-${t.id}`}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        )}

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
                  <span className="text-muted-foreground">Season</span>
                  <span className="font-medium">{league.season}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Draft Order</span>
                  <span className="font-medium capitalize">{league.draftOrderType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">Draft 7, start 5 weekly</span>
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
                      <Badge variant="outline" className="text-xs text-red-600 border-red-600">You</Badge>
                    )}
                  </div>
                </div>
              ))}

              {isCommissioner && league.draftStatus === "pending" && (
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

          {league.draftStatus === "pending" && (
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
                {league.draftOrderType === "random" ? (
                  <p className="text-xs text-muted-foreground mt-1">Order is randomized when the draft starts.</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Use arrows to arrange pick order. Rounds snake (order reverses each round).
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
                    {userId === user?.id && <Badge variant="outline" className="text-xs">You</Badge>}
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
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

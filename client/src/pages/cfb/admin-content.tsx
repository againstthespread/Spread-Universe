import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiFetch, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, CalendarCheck } from "lucide-react";
import type { CfbLeague, CfbGame } from "@shared/schema";

function weekLabel(week: number) {
  if (week === 12) return "Week 12 — Quarterfinals";
  if (week === 13) return "Week 13 — Semifinals";
  if (week === 14) return "Week 14 — Championship";
  return `Week ${week}`;
}

export default function CfbAdminContent() {
  const { toast } = useToast();
  const [syncWeek, setSyncWeek] = useState("1");
  const [gamesWeek, setGamesWeek] = useState("1");

  const { data: leagues = [], isLoading: leaguesLoading } = useQuery<CfbLeague[]>({
    queryKey: ["/api/cfb/admin/leagues"],
    queryFn: async () => {
      const res = await apiFetch("/api/cfb/admin/leagues");
      if (!res.ok) throw new Error("Failed to load leagues");
      return res.json();
    },
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery<CfbGame[]>({
    queryKey: ["/api/cfb/games", gamesWeek],
    queryFn: async () => {
      const res = await apiFetch(`/api/cfb/games?week=${gamesWeek}`);
      if (!res.ok) throw new Error("Failed to load games");
      return res.json();
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/cfb/admin/sync-games", { week: parseInt(syncWeek, 10) }),
    onSuccess: async (res) => {
      const body = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/games"] });
      toast({ title: `Synced ${body.gamesSynced} games`, description: `Season ${body.season}, week ${body.week}` });
    },
    onError: (err: Error) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: (vars: { leagueId: string; week: number }) =>
      apiRequest("POST", `/api/cfb/admin/leagues/${vars.leagueId}/finalize-week`, { week: vars.week }),
    onSuccess: async (res) => {
      const body = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/cfb/admin/leagues"] });
      toast({ title: "Week finalized", description: `League advanced to ${weekLabel(body.currentWeek)}` });
    },
    onError: (err: Error) => {
      toast({ title: "Finalize failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync Games from ESPN
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Pull scores and schedules for a week from ESPN. Run after games finish, before finalizing leagues.
          </p>
        </CardHeader>
        <CardContent className="flex items-center gap-2 flex-wrap">
          <Select value={syncWeek} onValueChange={setSyncWeek}>
            <SelectTrigger className="w-48" data-testid="select-sync-week">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 16 }, (_, i) => i + 1).map(w => (
                <SelectItem key={w} value={String(w)}>CFB Week {w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-sync-games"
          >
            {syncMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {syncMutation.isPending ? "Syncing..." : "Sync Games"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            Leagues
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Finalize a league's current week: scores every matchup from synced game results, then advances the week
            (playoffs are generated automatically at weeks 12-14).
          </p>
        </CardHeader>
        <CardContent>
          {leaguesLoading ? (
            <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : leagues.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No CFB leagues created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>League</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Week</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leagues.map(l => (
                  <TableRow key={l.id} data-testid={`row-admin-league-${l.id}`}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.season}</TableCell>
                    <TableCell>
                      <Badge variant={l.draftStatus === "completed" ? "default" : "outline"} className="capitalize">
                        {l.draftStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{weekLabel(l.currentWeek)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={l.draftStatus !== "completed" || l.currentWeek > 14 || finalizeMutation.isPending}
                        onClick={() => finalizeMutation.mutate({ leagueId: l.id, week: l.currentWeek })}
                        data-testid={`button-finalize-${l.id}`}
                      >
                        {finalizeMutation.isPending ? "Working..." : `Finalize Week ${l.currentWeek}`}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base">Synced Games</CardTitle>
            <Select value={gamesWeek} onValueChange={setGamesWeek}>
              <SelectTrigger className="w-40" data-testid="select-games-week">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 16 }, (_, i) => i + 1).map(w => (
                  <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {gamesLoading ? (
            <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : games.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No games synced for week {gamesWeek} yet.</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {games.map(g => (
                <div key={g.id} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm" data-testid={`row-game-${g.id}`}>
                  <span className="flex-1 truncate">{g.awayTeamName} @ {g.homeTeamName}</span>
                  {g.status === "final" ? (
                    <span className="font-medium tabular-nums">{g.awayScore}-{g.homeScore} Final</span>
                  ) : (
                    <Badge variant="outline" className="capitalize">{g.status}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

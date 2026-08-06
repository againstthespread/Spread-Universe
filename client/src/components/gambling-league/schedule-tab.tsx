import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MatchupDetailDialog } from "@/components/gambling-league/matchup-detail-dialog";
import { ArrowLeft, ArrowRight, Swords } from "lucide-react";
import type { GamblingLeagueMatchupWithUsers } from "@shared/schema";
import { getPlayoffConfig, roundForWeek } from "@shared/playoff-config";

interface ScheduleTabProps {
  leagueId: string;
  currentWeek: number;
  capacity: number;
}

export function ScheduleTab({ leagueId, currentWeek, capacity }: ScheduleTabProps) {
  const config = getPlayoffConfig(capacity);
  const playoffStartWeek = config.rounds[0].week;
  const roundLabelForWeek = (week: number) => roundForWeek(config, week)?.round.label ?? null;
  const currentDisplayWeek = Math.min(currentWeek, 17);
  // Regular season is fully scheduled at season start; playoff weeks become
  // browsable once the league reaches them.
  const maxWeek = currentWeek >= playoffStartWeek ? 17 : config.regularSeasonWeeks;
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedMatchup, setSelectedMatchup] = useState<GamblingLeagueMatchupWithUsers | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const displayWeek = selectedWeek ?? currentDisplayWeek;

  const { data: matchups = [], isLoading } = useQuery<GamblingLeagueMatchupWithUsers[]>({
    queryKey: ["/api/gambling-league/leagues", leagueId, "matchups", displayWeek],
    queryFn: async () => {
      const res = await fetch(`/api/gambling-league/leagues/${leagueId}/matchups?week=${displayWeek}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Swords className="w-5 h-5" />
              {matchups[0]?.isPlayoff
                ? `${roundLabelForWeek(displayWeek) ?? "Playoffs"} — Week ${displayWeek}`
                : `Week ${displayWeek} Matchups`}
              {displayWeek > currentWeek && (
                <Badge variant="outline" data-testid="badge-upcoming-week">Upcoming</Badge>
              )}
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
                  {Array.from({ length: maxWeek }, (_, i) => i + 1).map((w) => (
                    <SelectItem key={w} value={String(w)} data-testid={`option-week-${w}`}>
                      {roundLabelForWeek(w) && w > config.regularSeasonWeeks ? `Week ${w} (${roundLabelForWeek(w)})` : `Week ${w}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                disabled={displayWeek >= maxWeek}
                onClick={() => setSelectedWeek(Math.min(maxWeek, displayWeek + 1))}
                data-testid="button-next-week"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading matchups...</p>
          ) : matchups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-matchups">
              {displayWeek > config.regularSeasonWeeks
                ? roundLabelForWeek(displayWeek)
                  ? `${roundLabelForWeek(displayWeek)} bracket to be determined — matchups are set once the previous round finishes.`
                  : `Week ${displayWeek} is an off week for this league — playoffs begin week ${playoffStartWeek}.`
                : `No matchups for week ${displayWeek}.`}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {matchups.map((matchup) => (
                <div
                  key={matchup.id}
                  className="p-3 rounded-md border hover-elevate cursor-pointer flex items-center justify-between gap-2"
                  onClick={() => {
                    setSelectedMatchup(matchup);
                    setDialogOpen(true);
                  }}
                  data-testid={`card-matchup-${matchup.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={matchup.winnerId === matchup.user1.id ? "font-bold text-green-600 dark:text-green-400" : ""}>
                      {matchup.user1.username}
                    </span>
                    {matchup.user1Forfeit && <Badge variant="destructive" className="text-xs">FF</Badge>}
                    {matchup.isComplete && <Badge variant="secondary">{matchup.user1Npw ?? 0}</Badge>}
                  </div>
                  <span className="text-muted-foreground text-sm">vs</span>
                  <div className="flex items-center gap-2">
                    {matchup.isComplete && matchup.user2 && <Badge variant="secondary">{matchup.user2Npw ?? 0}</Badge>}
                    {matchup.user2Forfeit && <Badge variant="destructive" className="text-xs">FF</Badge>}
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

      <MatchupDetailDialog
        matchup={selectedMatchup}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

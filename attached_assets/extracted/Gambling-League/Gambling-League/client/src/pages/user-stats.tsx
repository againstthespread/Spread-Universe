import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { TrendingUp, TrendingDown, Target, Calendar, StickyNote, ChevronLeft, Minus } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Pick, Game } from "@shared/schema";

interface PickWithGame {
  pick: Pick;
  game: Game;
}

interface UserStats {
  picks: PickWithGame[];
  statistics: {
    totalPicks: number;
    correctPicks: number;
    incorrectPicks: number;
    pendingPicks: number;
    accuracy: number;
    weeklyBreakdown: Array<{
      week: number;
      correct: number;
      incorrect: number;
      pending: number;
      npw: number;
    }>;
    favoriteTeams: Array<{
      team: string;
      count: number;
      correct: number;
      accuracy: string;
    }>;
    bestWeek: {
      week: number;
      npw: number;
    } | null;
    worstWeek: {
      week: number;
      npw: number;
    } | null;
  };
}

export default function UserStats() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [seasonFilter, setSeasonFilter] = useState<string>("all");

  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ["/api/users", user?.id, "pick-history", seasonFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (seasonFilter !== "all") {
        params.append("season", seasonFilter);
      }
      const url = `/api/users/${user?.id}/pick-history${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">Loading statistics...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { statistics } = stats || { statistics: {
    totalPicks: 0,
    correctPicks: 0,
    incorrectPicks: 0,
    pendingPicks: 0,
    accuracy: 0,
    weeklyBreakdown: [],
    favoriteTeams: [],
    bestWeek: null,
    worstWeek: null,
  }};

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pick History & Statistics</h1>
            <p className="text-muted-foreground">Track your performance across all leagues</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Season:</span>
          <Select value={seasonFilter} onValueChange={setSeasonFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-season-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="regular">Regular Season</SelectItem>
              <SelectItem value="playoffs">Playoffs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-picks">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Picks</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPicks}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-accuracy">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.accuracy}%</div>
            <p className="text-xs text-muted-foreground">
              {statistics.correctPicks} correct of {statistics.totalPicks - statistics.pendingPicks} completed
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-best-week">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Week</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statistics.bestWeek ? (
              <>
                <div className="text-2xl font-bold">Week {statistics.bestWeek.week}</div>
                <p className="text-xs text-muted-foreground">
                  NPW: +{statistics.bestWeek.npw}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-worst-week">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worst Week</CardTitle>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statistics.worstWeek ? (
              <>
                <div className="text-2xl font-bold">Week {statistics.worstWeek.week}</div>
                <p className="text-xs text-muted-foreground">
                  NPW: {statistics.worstWeek.npw}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Favorite Teams */}
      {statistics.favoriteTeams && statistics.favoriteTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Picked Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.favoriteTeams.map((team, index) => (
                <div
                  key={team.team}
                  className="flex items-center justify-between p-3 rounded-md bg-card hover-elevate"
                  data-testid={`favorite-team-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 justify-center">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{team.team}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{team.count} picks</span>
                    <Badge variant={parseFloat(team.accuracy) >= 50 ? "default" : "destructive"}>
                      {team.accuracy}% accuracy
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly NPW Chart */}
      {statistics.weeklyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly NPW Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.weeklyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  label={{ value: 'Week', position: 'insideBottom', offset: -5 }}
                  className="text-xs"
                />
                <YAxis 
                  label={{ value: 'NPW', angle: -90, position: 'insideLeft' }}
                  className="text-xs"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="npw" 
                  fill="hsl(var(--primary))" 
                  name="Net Positive Wins"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Accuracy Trend Chart */}
      {statistics.weeklyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pick Accuracy Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistics.weeklyBreakdown.map(w => ({
                week: w.week,
                accuracy: w.correct + w.incorrect > 0 
                  ? ((w.correct / (w.correct + w.incorrect)) * 100).toFixed(1)
                  : 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  label={{ value: 'Week', position: 'insideBottom', offset: -5 }}
                  className="text-xs"
                />
                <YAxis 
                  domain={[0, 100]}
                  label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft' }}
                  className="text-xs"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="Accuracy"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Weekly Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statistics.weeklyBreakdown.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No picks data available yet
              </div>
            ) : (
              statistics.weeklyBreakdown.map((week) => (
                <div
                  key={week.week}
                  className="flex items-center justify-between p-3 rounded-md bg-card hover-elevate"
                  data-testid={`week-stats-${week.week}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="font-medium">Week {week.week}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="default" className="px-2">
                        {week.correct} ✓
                      </Badge>
                      <Badge variant="destructive" className="px-2">
                        {week.incorrect} ✗
                      </Badge>
                      {week.pending > 0 && (
                        <Badge variant="secondary" className="px-2">
                          {week.pending} pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">NPW:</span>
                    <Badge
                      variant={week.npw > 0 ? "default" : week.npw < 0 ? "destructive" : "secondary"}
                      className="min-w-[50px] justify-center"
                    >
                      {week.npw > 0 ? "+" : ""}{week.npw}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Picks with Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Pick History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.picks && stats.picks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No picks history available yet
              </div>
            ) : (
              stats?.picks.slice(0, 10).map((item) => (
                <div
                  key={item.pick.id}
                  className="p-4 rounded-md border space-y-2"
                  data-testid={`pick-history-${item.pick.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      Week {item.game.week}: {item.game.awayTeam} @ {item.game.homeTeam}
                    </div>
                    {item.game.isComplete && (
                      <>
                        {item.pick.isPush ? (
                          <Badge variant="secondary" className="bg-muted">
                            <Minus className="w-3 h-3 mr-1" />
                            Push
                          </Badge>
                        ) : item.pick.isCorrect !== null && (
                          <Badge variant={item.pick.isCorrect ? "default" : "destructive"}>
                            {item.pick.isCorrect ? "Correct" : "Incorrect"}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Picked: {item.pick.pickedTeam === 'home' ? item.game.homeTeam : item.game.awayTeam}
                    {item.game.isComplete && (
                      <span className="ml-2">
                        | Final: {item.game.awayTeam} {item.game.awayScore} - {item.game.homeTeam} {item.game.homeScore}
                      </span>
                    )}
                  </div>
                  {item.pick.note && (
                    <div className="pt-2 border-t space-y-1">
                      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <StickyNote className="w-3 h-3" />
                        Note:
                      </div>
                      <div className="text-sm">{item.pick.note}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Flag, ArrowLeft, User, CheckCircle } from "lucide-react";
import type { GolfDraftState, GolfGolfer } from "@shared/schema";

export default function GolfDraftRoom({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingGolfer, setPendingGolfer] = useState<GolfGolfer | null>(null);

  const { data: state, isLoading } = useQuery<GolfDraftState>({
    queryKey: ["/api/golf/leagues", params.id, "draft"],
    queryFn: async () => {
      const res = await fetch(`/api/golf/leagues/${params.id}/draft`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load draft");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: (query) => (query.state.data as GolfDraftState | undefined)?.league.draftStatus === "active" ? 4000 : false,
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

  if (isLoading || !state) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading draft...</CardContent>
        </Card>
      </div>
    );
  }

  const isMyTurn = state.currentPickUserId === user?.id;
  const myPicks = state.picks.filter(p => p.userId === user?.id);

  const overallPickToRoundPick = (pickNum: number, totalUsers: number) => {
    const round = Math.floor(pickNum / totalUsers) + 1;
    const pick = (pickNum % totalUsers) + 1;
    return `R${round}.${pick}`;
  };
  const n = state.draftOrder.length;

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/golf/leagues/${params.id}`}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to League
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="w-6 h-6 text-emerald-500" />
            Snake Draft
          </h1>
          <p className="text-muted-foreground">{state.league.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {state.isComplete && (
            <Button asChild variant="outline">
              <Link href={`/golf/leagues/${params.id}/standings`}>View Standings</Link>
            </Button>
          )}
          {state.league.draftStatus === "active" && !state.isComplete && (
            <Badge variant="default" className="text-base px-4 py-2">
              Pick {state.currentPickNumber + 1} of {n * 4}
            </Badge>
          )}
          {state.isComplete && (
            <Badge variant="secondary" className="text-base px-4 py-2">Draft Complete</Badge>
          )}
        </div>
      </div>

      {/* Current pick banner */}
      {state.league.draftStatus === "active" && !state.isComplete && (
        <Card className={isMyTurn ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20" : "border-muted"}>
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
            {isMyTurn ? (
              <div>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">It's your turn!</p>
                <p className="text-sm text-muted-foreground">Select a golfer from the available list below</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold">
                  Waiting for{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {state.draftOrder.find(d => d.userId === state.currentPickUserId)?.username ?? "..."}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">to make their pick</p>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {overallPickToRoundPick(state.currentPickNumber, n)}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Available golfers */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">
            Available Golfers
            <span className="text-muted-foreground font-normal ml-2 text-sm">
              ({state.availableGolfers.length} remaining)
            </span>
          </h2>
          {state.availableGolfers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                All golfers have been drafted.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {state.availableGolfers.map(golfer => (
                <Card
                  key={golfer.id}
                  className={`cursor-pointer transition-colors ${isMyTurn ? "hover:border-emerald-400 hover:bg-muted/50" : "opacity-60"}`}
                  data-testid={`card-golfer-${golfer.id}`}
                  onClick={() => {
                    if (isMyTurn && state.league.draftStatus === "active") {
                      setPendingGolfer(golfer);
                    }
                  }}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm w-8 font-mono">
                        #{golfer.worldRank}
                      </span>
                      <div>
                        <p className="font-medium">{golfer.firstName} {golfer.lastName}</p>
                        <p className="text-xs text-muted-foreground">{golfer.country}</p>
                      </div>
                    </div>
                    {isMyTurn && state.league.draftStatus === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pickMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingGolfer(golfer);
                        }}
                        data-testid={`button-pick-${golfer.id}`}
                      >
                        Draft
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right panel: draft order + picks so far */}
        <div className="space-y-4">
          {/* Draft order */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Draft Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {state.draftOrder.map((entry, i) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-2 p-1.5 rounded text-sm ${
                    entry.userId === state.currentPickUserId && !state.isComplete
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold"
                      : ""
                  }`}
                  data-testid={`row-draft-order-${entry.userId}`}
                >
                  <User className="w-3 h-3" />
                  <span className="flex-1 truncate">{entry.username}</span>
                  {entry.userId === user?.id && (
                    <Badge variant="outline" className="text-xs py-0">you</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* My roster */}
          {myPicks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  My Roster
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {myPicks.map(pick => (
                  <div key={pick.id} className="flex items-center gap-2 text-sm p-1 rounded" data-testid={`row-my-pick-${pick.id}`}>
                    <span className="text-muted-foreground text-xs w-5">#{pick.golfer.worldRank}</span>
                    <span>{pick.golfer.firstName} {pick.golfer.lastName}</span>
                  </div>
                ))}
                {myPicks.length < 4 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    {4 - myPicks.length} more pick{4 - myPicks.length !== 1 ? "s" : ""} remaining
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pick log */}
          {state.picks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pick Log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                {[...state.picks].reverse().map(pick => (
                  <div key={pick.id} className="text-xs text-muted-foreground flex gap-1">
                    <span className="font-medium text-foreground">{pick.user.username}</span>
                    <span>drafted</span>
                    <span className="font-medium text-foreground">{pick.golfer.firstName} {pick.golfer.lastName}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={!!pendingGolfer} onOpenChange={(open) => { if (!open) setPendingGolfer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Selection</AlertDialogTitle>
            <AlertDialogDescription>
              Draft <span className="font-semibold text-foreground">{pendingGolfer?.firstName} {pendingGolfer?.lastName}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-confirm-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-pick"
              disabled={pickMutation.isPending}
              onClick={() => {
                if (pendingGolfer) {
                  pickMutation.mutate(pendingGolfer.id);
                  setPendingGolfer(null);
                }
              }}
            >
              Confirm Pick
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

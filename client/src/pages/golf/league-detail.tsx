import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Flag, Users, Copy, ChevronRight, UserPlus, Trophy, Calendar, ArrowLeft } from "lucide-react";
import type { GolfLeagueDetail } from "@shared/schema";

function DraftStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    pending: "outline",
    active: "default",
    completed: "secondary",
  };
  return (
    <Badge variant={variants[status] ?? "outline"} className="capitalize">
      Draft: {status}
    </Badge>
  );
}

export default function GolfLeagueDetail({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [inviteUsername, setInviteUsername] = useState("");

  const { data: league, isLoading } = useQuery<GolfLeagueDetail>({
    queryKey: ["/api/golf/leagues", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/golf/leagues/${params.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!user,
  });

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
      toast({ title: "Error", description: err.message ?? "Failed to invite user", variant: "destructive" });
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

  const copyCode = () => {
    if (league) {
      navigator.clipboard.writeText(league.joinCode);
      toast({ title: "Join code copied!" });
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent>
        </Card>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">League not found.</CardContent>
        </Card>
      </div>
    );
  }

  const isCommissioner = user?.id === league.commissionerId;
  const canStartDraft = isCommissioner && league.draftStatus === "pending" && league.members.length >= 2;
  const draftOrder = league.draftOrder ?? [];

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/golf">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="w-6 h-6 text-emerald-500" />
            {league.name}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
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
        <div className="flex gap-2 flex-wrap">
          {league.draftStatus !== "pending" && (
            <Button variant="outline" asChild>
              <Link href={`/golf/leagues/${params.id}/draft`}>
                {league.draftStatus === "active" ? "Go to Draft" : "View Draft"}
              </Link>
            </Button>
          )}
          {league.draftStatus === "completed" && (
            <Button asChild>
              <Link href={`/golf/leagues/${params.id}/standings`}>
                <Trophy className="w-4 h-4 mr-2" />
                Standings
              </Link>
            </Button>
          )}
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Join Code */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Join Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

        {/* League Info */}
        <Card>
          <CardHeader>
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
              <span className="font-medium">{new Date(league.draftStartTime).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Draft Order</span>
              <span className="font-medium capitalize">{league.draftOrderType}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members ({league.members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {league.members.map((m, i) => (
            <div key={m.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50" data-testid={`row-member-${m.id}`}>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm w-6">{i + 1}.</span>
                <span className="font-medium" data-testid={`text-member-username-${m.id}`}>{m.user.username}</span>
                {m.userId === league.commissionerId && (
                  <Badge variant="outline" className="text-xs">Commissioner</Badge>
                )}
              </div>
              {draftOrder.length > 0 && league.draftStatus !== "pending" && (
                <span className="text-xs text-muted-foreground">
                  Pick #{draftOrder.indexOf(m.userId) + 1}
                </span>
              )}
            </div>
          ))}

          {/* Invite by username (commissioner only) */}
          {isCommissioner && league.draftStatus === "pending" && league.members.length < league.maxSize && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Input
                value={inviteUsername}
                onChange={e => setInviteUsername(e.target.value)}
                placeholder="Invite by username"
                data-testid="input-invite-username"
                className="flex-1"
              />
              <Button
                onClick={() => inviteMutation.mutate(inviteUsername)}
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

      {/* Quick links if draft active */}
      {league.draftStatus === "active" && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">Draft is Live!</p>
              <p className="text-sm text-muted-foreground">The snake draft is in progress</p>
            </div>
            <Button asChild>
              <Link href={`/golf/leagues/${params.id}/draft`}>
                Go to Draft
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

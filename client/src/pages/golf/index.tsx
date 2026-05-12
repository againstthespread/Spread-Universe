import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { Flag, Users, ChevronRight, Plus, LogIn, Trophy, Calendar } from "lucide-react";
import type { GolfLeague, GolfTournament } from "@shared/schema";

type GolfLeagueWithTournament = GolfLeague & { tournament: GolfTournament };


const createLeagueSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  tournamentId: z.string().min(1, "Tournament required"),
  draftOrderType: z.enum(["random", "manual"]),
});

const joinLeagueSchema = z.object({
  joinCode: z.string().min(4, "Join code required"),
});

type CreateLeagueForm = z.infer<typeof createLeagueSchema>;
type JoinLeagueForm = z.infer<typeof joinLeagueSchema>;

function CreateLeagueDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: tournaments = [] } = useQuery<GolfTournament[]>({
    queryKey: ["/api/golf/tournaments"],
  });

  const form = useForm<CreateLeagueForm>({
    resolver: zodResolver(createLeagueSchema),
    defaultValues: {
      name: "",
      tournamentId: "",
      draftOrderType: "random",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateLeagueForm) => apiRequest("POST", "/api/golf/leagues", data),
    onSuccess: async (res) => {
      const league = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/golf/leagues"] });
      toast({ title: "League created!" });
      setOpen(false);
      navigate(`/golf/leagues/${league.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to create league", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-league">
          <Plus className="w-4 h-4 mr-2" />
          Create League
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Golf Fantasy League</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>League Name</FormLabel>
                <FormControl>
                  <Input data-testid="input-league-name" placeholder="My Golf League" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="tournamentId" render={({ field }) => (
              <FormItem>
                <FormLabel>Tournament</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-tournament">
                      <SelectValue placeholder="Select tournament" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tournaments.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="draftOrderType" render={({ field }) => (
              <FormItem>
                <FormLabel>Draft Order</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-draft-order-type">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="random">Random (auto-shuffled as members join)</SelectItem>
                    <SelectItem value="manual">Manual (commissioner sets order)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-create-league">
              {mutation.isPending ? "Creating..." : "Create League"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function JoinLeagueDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<JoinLeagueForm>({
    resolver: zodResolver(joinLeagueSchema),
    defaultValues: { joinCode: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: JoinLeagueForm) => apiRequest("POST", "/api/golf/leagues/join", { joinCode: data.joinCode.toUpperCase() }),
    onSuccess: async (res) => {
      const body = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/golf/leagues"] });
      toast({ title: "Joined league!" });
      setOpen(false);
      navigate(`/golf/leagues/${body.leagueId}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message ?? "Failed to join league", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-join-league">
          <LogIn className="w-4 h-4 mr-2" />
          Join League
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Join Golf Fantasy League</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="joinCode" render={({ field }) => (
              <FormItem>
                <FormLabel>Join Code</FormLabel>
                <FormControl>
                  <Input data-testid="input-join-code" placeholder="e.g. AB3CD9" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-join-league">
              {mutation.isPending ? "Joining..." : "Join League"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DraftStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    pending: "outline",
    active: "default",
    completed: "secondary",
  };
  return <Badge variant={variants[status] ?? "outline"}>{status}</Badge>;
}

export default function GolfDashboard() {
  const { user } = useAuth();

  const { data: myLeagues = [], isLoading } = useQuery<GolfLeagueWithTournament[]>({
    queryKey: ["/api/golf/leagues"],
    enabled: !!user,
  });

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="w-8 h-8 text-emerald-500" />
            Golf Fantasy
          </h1>
          <p className="text-muted-foreground mt-1">
            Create or join snake-draft fantasy golf leagues
          </p>
        </div>
        {user && (
          <div className="flex gap-2 flex-wrap">
            <JoinLeagueDialog />
            <CreateLeagueDialog />
          </div>
        )}
      </div>

      {!user && (
        <Card>
          <CardContent className="p-8 text-center">
            <Flag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Login to Play</h3>
            <p className="text-muted-foreground mb-4">
              Create or join a fantasy golf league to compete with friends.
            </p>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {user && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            My Leagues
          </h2>
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading your leagues...
              </CardContent>
            </Card>
          ) : myLeagues.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Flag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Leagues Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create a new league or use a join code from a friend.
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <JoinLeagueDialog />
                  <CreateLeagueDialog />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...myLeagues].reverse().map((league) => (
                <Link key={league.id} href={`/golf/leagues/${league.id}`}>
                  <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-my-league-${league.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">{league.name}</CardTitle>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <CardDescription className="flex items-center gap-2 flex-wrap">
                        <DraftStatusBadge status={league.draftStatus} />
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        {league.tournament.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {league.maxSize ? `Up to ${league.maxSize} teams` : "Open roster"}
                      </div>
                      {league.draftStartTime && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Draft: {new Date(league.draftStartTime).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

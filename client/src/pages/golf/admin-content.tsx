import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { z } from "zod";
import { Plus, Trophy, Flag, Search, ChevronRight, ChevronDown } from "lucide-react";
import type { GolfTournament, GolfGolfer } from "@shared/schema";

type TournamentWithGolfers = GolfTournament & { golfers: GolfGolfer[] };

const createTournamentSchema = z.object({
  name: z.string().min(1, "Name required"),
  startDate: z.string().min(1, "Start date required"),
});

type CreateTournamentForm = z.infer<typeof createTournamentSchema>;

function CreateTournamentDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateTournamentForm>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: { name: "", startDate: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateTournamentForm) =>
      apiRequest("POST", "/api/golf/tournaments", { ...data, startDate: new Date(data.startDate).toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/golf/tournaments"] });
      toast({ title: "Tournament created!" });
      form.reset();
      setOpen(false);
      onSuccess();
    },
    onError: () => toast({ title: "Error", description: "Failed to create tournament", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-create-tournament">
          <Plus className="w-4 h-4 mr-2" />
          New Tournament
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Tournament</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Tournament Name</FormLabel>
                <FormControl>
                  <Input data-testid="input-tournament-name" placeholder="e.g. The Masters 2026" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="startDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" data-testid="input-tournament-date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TournamentPanel({ tournament }: { tournament: TournamentWithGolfers }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [golferSearch, setGolferSearch] = useState("");
  const [scoreForm, setScoreForm] = useState<{ golferId: string; round: string; score: string }>({ golferId: "", round: "1", score: "" });

  const { data: allGolfers = [] } = useQuery<GolfGolfer[]>({
    queryKey: ["/api/golf/golfers", { excludeTournamentId: tournament.id }],
    queryFn: async () => {
      const res = await fetch(`/api/golf/golfers?excludeTournamentId=${tournament.id}`, { credentials: "include" });
      return res.json();
    },
    enabled: expanded,
  });

  const addGolferMutation = useMutation({
    mutationFn: (golferId: string) =>
      apiRequest("POST", `/api/golf/tournaments/${tournament.id}/golfers`, { golferId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/golf/tournaments"] });
      toast({ title: "Golfer added to tournament" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add golfer", variant: "destructive" }),
  });

  const removeGolferMutation = useMutation({
    mutationFn: (golferId: string) =>
      apiRequest("DELETE", `/api/golf/tournaments/${tournament.id}/golfers/${golferId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/golf/tournaments"] });
      toast({ title: "Golfer removed" });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove golfer", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      apiRequest("PATCH", `/api/golf/tournaments/${tournament.id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/golf/tournaments"] });
      toast({ title: "Status updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update status", variant: "destructive" }),
  });

  const scoreMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/golf/tournaments/${tournament.id}/scores`, {
        golferId: scoreForm.golferId,
        round: parseInt(scoreForm.round),
        score: parseInt(scoreForm.score),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/golf/tournaments", tournament.id] });
      toast({ title: "Score entered" });
      setScoreForm(f => ({ ...f, score: "" }));
    },
    onError: () => toast({ title: "Error", description: "Failed to enter score", variant: "destructive" }),
  });

  const filteredGolfers = allGolfers.filter(g =>
    `${g.firstName} ${g.lastName}`.toLowerCase().includes(golferSearch.toLowerCase())
  );

  const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
    upcoming: "outline",
    active: "default",
    completed: "secondary",
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(e => !e)} className="p-1 h-auto">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            <div>
              <CardTitle className="text-base">{tournament.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {new Date(tournament.startDate).toLocaleDateString()} · {tournament.golfers.length} golfers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[tournament.status] ?? "outline"} className="capitalize">
              {tournament.status}
            </Badge>
            <Select
              value={tournament.status}
              onValueChange={v => statusMutation.mutate(v)}
            >
              <SelectTrigger className="w-32 h-8 text-xs" data-testid={`select-status-${tournament.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Current golfers */}
          <div>
            <p className="text-sm font-semibold mb-2">
              Golfers in Tournament ({tournament.golfers.length})
            </p>
            <div className="grid gap-1 max-h-40 overflow-y-auto">
              {tournament.golfers.map(g => (
                <div key={g.id} className="flex items-center justify-between text-sm p-1.5 rounded bg-muted/40">
                  <span>#{g.worldRank} {g.firstName} {g.lastName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-red-500 hover:text-red-600"
                    onClick={() => removeGolferMutation.mutate(g.id)}
                    disabled={removeGolferMutation.isPending}
                    data-testid={`button-remove-golfer-${g.id}`}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {tournament.golfers.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">No golfers added yet</p>
              )}
            </div>
          </div>

          {/* Add golfer */}
          <div>
            <p className="text-sm font-semibold mb-2">Add Golfers</p>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-7 h-8 text-xs"
                  placeholder="Search golfers..."
                  value={golferSearch}
                  onChange={e => setGolferSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-1 max-h-40 overflow-y-auto">
              {filteredGolfers.slice(0, 20).map(g => (
                <div key={g.id} className="flex items-center justify-between text-sm p-1.5 rounded hover:bg-muted/50">
                  <span className="text-xs">#{g.worldRank} {g.firstName} {g.lastName} ({g.country})</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => addGolferMutation.mutate(g.id)}
                    disabled={addGolferMutation.isPending}
                    data-testid={`button-add-golfer-${g.id}`}
                  >
                    Add
                  </Button>
                </div>
              ))}
              {filteredGolfers.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">No golfers found</p>
              )}
            </div>
          </div>

          {/* Score entry */}
          {tournament.golfers.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Enter Score</p>
              <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-36">
                  <label className="text-xs text-muted-foreground mb-1 block">Golfer</label>
                  <Select value={scoreForm.golferId} onValueChange={v => setScoreForm(f => ({ ...f, golferId: v }))}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-score-golfer">
                      <SelectValue placeholder="Select golfer" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournament.golfers.map(g => (
                        <SelectItem key={g.id} value={g.id}>#{g.worldRank} {g.firstName} {g.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20">
                  <label className="text-xs text-muted-foreground mb-1 block">Round</label>
                  <Select value={scoreForm.round} onValueChange={v => setScoreForm(f => ({ ...f, round: v }))}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-score-round">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">R1</SelectItem>
                      <SelectItem value="2">R2</SelectItem>
                      <SelectItem value="3">R3</SelectItem>
                      <SelectItem value="4">R4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <label className="text-xs text-muted-foreground mb-1 block">Score</label>
                  <Input
                    type="number"
                    className="h-8 text-xs"
                    placeholder="e.g. 68"
                    value={scoreForm.score}
                    onChange={e => setScoreForm(f => ({ ...f, score: e.target.value }))}
                    data-testid="input-score"
                  />
                </div>
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!scoreForm.golferId || !scoreForm.score || scoreMutation.isPending}
                  onClick={() => scoreMutation.mutate()}
                  data-testid="button-enter-score"
                >
                  {scoreMutation.isPending ? "Saving..." : "Save Score"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function GolfAdminContent() {
  const { data: tournaments = [], isLoading, refetch } = useQuery<TournamentWithGolfers[]>({
    queryKey: ["/api/golf/tournaments"],
    queryFn: async () => {
      const res = await fetch("/api/golf/tournaments", { credentials: "include" });
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Flag className="w-4 h-4 text-emerald-500" />
            Tournaments
          </h3>
          <p className="text-xs text-muted-foreground">Create tournaments, add golfers, enter scores</p>
        </div>
        <CreateTournamentDialog onSuccess={() => refetch()} />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading tournaments...</div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No tournaments yet. Create one to get started.</p>
        </div>
      ) : (
        <div>
          {tournaments.map(t => (
            <TournamentPanel key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
}

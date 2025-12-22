import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users } from "lucide-react";
import type { League } from "@shared/schema";

export function JoinLeagueDialog() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leagues, isLoading } = useQuery<League[]>({
    queryKey: ["/api/leagues/search", searchTerm],
    queryFn: async () => {
      const res = await fetch(`/api/leagues/search?searchTerm=${encodeURIComponent(searchTerm)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: open && searchTerm.length > 0,
  });

  const joinMutation = useMutation({
    mutationFn: async (leagueId: string) => {
      return await apiRequest("POST", `/api/leagues/${leagueId}/join`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      toast({
        title: "Success",
        description: "Successfully joined the league!",
      });
      setOpen(false);
      setSearchTerm("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to join league",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" data-testid="button-join-league">
          <Search className="w-5 h-5 mr-2" />
          Join League
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" data-testid="dialog-join-league">
        <DialogHeader>
          <DialogTitle>Join a League</DialogTitle>
          <DialogDescription>
            Search for available leagues to join
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leagues by name..."
              className="pl-10"
              data-testid="input-search-leagues"
            />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Searching...
              </div>
            )}
            {!isLoading && searchTerm && leagues?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No leagues found
              </div>
            )}
            {!searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                Start typing to search for leagues
              </div>
            )}
            {leagues?.map((league) => (
              <Card key={league.id} className="hover-elevate" data-testid={`card-league-${league.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-lg">{league.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Capacity: {league.capacity} members</span>
                        <Badge variant={league.status === 'open' ? 'default' : 'secondary'}>
                          {league.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => joinMutation.mutate(league.id)}
                      disabled={joinMutation.isPending || league.status !== 'open'}
                      data-testid={`button-join-${league.id}`}
                    >
                      {joinMutation.isPending ? "Joining..." : "Join"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

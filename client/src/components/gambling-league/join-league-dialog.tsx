import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { GamblingLeagueLeague } from "@shared/schema";

interface JoinLeagueDialogProps {
  league: GamblingLeagueLeague | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinLeagueDialog({ league, open, onOpenChange }: JoinLeagueDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!league) return;
      return await apiRequest("POST", `/api/gambling-league/leagues/${league.id}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/my-leagues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/leagues"] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Joined league successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join league",
        variant: "destructive",
      });
    },
  });

  if (!league) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join League</DialogTitle>
          <DialogDescription>
            Join "{league.name}" to compete against other members.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">League Size</span>
            </div>
            <Badge variant="secondary">{league.capacity} members</Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={league.status === 'open' ? 'default' : 'secondary'}>
              {league.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Current Week</span>
            <span className="text-sm font-medium">Week {league.currentWeek}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending} data-testid="button-confirm-join">
            {joinMutation.isPending ? "Joining..." : "Join League"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

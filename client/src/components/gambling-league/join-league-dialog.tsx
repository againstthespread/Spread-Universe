import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

export function JoinLeagueDialog() {
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/gambling-league/leagues/join", {
        joinCode: joinCode.trim().toUpperCase(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gambling-league/my-leagues"] });
      setOpen(false);
      setJoinCode("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a join code",
        variant: "destructive",
      });
      return;
    }
    joinMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-join-league">
          <LogIn className="w-4 h-4 mr-2" />
          Join League
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Join League</DialogTitle>
            <DialogDescription>
              Enter the invite code you received from the league creator.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="join-code">Invite Code</Label>
            <Input
              id="join-code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. AB3CD9"
              maxLength={8}
              data-testid="input-join-code"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={joinMutation.isPending} data-testid="button-confirm-join">
              {joinMutation.isPending ? "Joining..." : "Join League"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

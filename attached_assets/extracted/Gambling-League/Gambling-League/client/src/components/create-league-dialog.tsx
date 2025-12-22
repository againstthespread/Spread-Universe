import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { InsertLeague } from "@shared/schema";

export function CreateLeagueDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<string>("12");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: InsertLeague) => {
      return await apiRequest("POST", "/api/leagues", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      toast({
        title: "Success",
        description: "League created successfully!",
      });
      setOpen(false);
      setName("");
      setCapacity("12");
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
        description: error.message || "Failed to create league",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a league name",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({ name, capacity });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-accent text-foreground hover:bg-accent/90" data-testid="button-create-league">
          <Plus className="w-5 h-5 mr-2" />
          Create League
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="dialog-create-league">
        <DialogHeader>
          <DialogTitle>Create New League</DialogTitle>
          <DialogDescription>
            Set up your fantasy football league. Invite friends to join once created.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">League Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sunday Night Champions"
              data-testid="input-league-name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">League Size</Label>
            <Select value={capacity} onValueChange={setCapacity}>
              <SelectTrigger id="capacity" data-testid="select-capacity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 Members</SelectItem>
                <SelectItem value="10">10 Members</SelectItem>
                <SelectItem value="12">12 Members</SelectItem>
                <SelectItem value="16">16 Members</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-submit-league"
            >
              {createMutation.isPending ? "Creating..." : "Create League"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

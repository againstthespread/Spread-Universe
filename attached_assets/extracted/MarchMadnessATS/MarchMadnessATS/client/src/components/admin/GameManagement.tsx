import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { GameWithTeams } from "@/lib/types";
import { format } from "date-fns";
import { LoaderCircle, Trash } from "lucide-react";

const GameManagement = () => {
  // Default to Round of 64 (ID 1)
  const [selectedRound, setSelectedRound] = useState<number | null>(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Define types for rounds to prevent type errors
  interface Round {
    id: number;
    name: string;
    displayName: string;
    pointValue: number;
    order: number;
  }
  
  // Fetch all rounds
  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
  });

  // We no longer need this effect since we have a default round selected

  // Fetch games for the selected round
  const {
    data: games = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<GameWithTeams[]>({
    queryKey: ["/api/games/round", selectedRound],
    enabled: !!selectedRound,
    queryFn: async () => {
      if (!selectedRound) throw new Error("No round selected");
      return apiRequest("GET", `/api/games/round?roundId=${selectedRound}`);
    },
  });

  // Delete game mutation
  const deleteMutation = useMutation({
    mutationFn: async (gameId: number) => {
      return apiRequest("DELETE", `/api/games/${gameId}`);
    },
    onSuccess: () => {
      toast({
        title: "Game deleted",
        description: "The game has been deleted successfully.",
      });
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/games/round", selectedRound] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the game. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting game:", error);
    },
  });

  const handleDeleteGame = (gameId: number) => {
    deleteMutation.mutate(gameId);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="outline">Upcoming</Badge>;
      case "live":
        return <Badge variant="default" className="bg-green-500">Live</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Game Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Round Selection */}
          <div className="flex space-x-2 mb-4">
            {rounds?.map((round) => (
              <Button
                key={round.id}
                variant={selectedRound === round.id ? "default" : "outline"}
                onClick={() => setSelectedRound(round.id)}
              >
                {round.displayName}
              </Button>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Games Table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="py-4 text-center text-red-500">
              Error loading games. Please try again.
            </div>
          ) : games.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>{game.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {game.homeTeam.name} vs {game.awayTeam.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {game.region && `Region: ${game.region}`}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(game.status)}</TableCell>
                    <TableCell>{formatDate(game.startTime)}</TableCell>
                    <TableCell>
                      {game.homeScore !== null && game.awayScore !== null
                        ? `${game.homeScore} - ${game.awayScore}`
                        : "Not started"}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this game and all associated picks.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteGame(game.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              No games found for this round. Create a game using the form below.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GameManagement;
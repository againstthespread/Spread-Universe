import { Game } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Pencil, Trash2, ExternalLink, ArrowUp, ArrowDown } from "lucide-react";

interface AdminGameTableProps {
  games: Game[];
  onEdit: (game: Game) => void;
}

export function AdminGameTable({ games, onEdit }: AdminGameTableProps) {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/games/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      toast({
        title: "Game deleted",
        description: "The game has been removed successfully.",
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete game.",
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (gameIds: string[]) => {
      return apiRequest("POST", "/api/games/reorder", { gameIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      toast({
        title: "Order updated",
        description: "Games have been reordered successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reorder games.",
        variant: "destructive",
      });
    },
  });

  const moveGame = (index: number, direction: 'up' | 'down') => {
    const newGames = [...games];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newGames.length) return;
    
    [newGames[index], newGames[targetIndex]] = [newGames[targetIndex], newGames[index]];
    const gameIds = newGames.map(g => g.id);
    reorderMutation.mutate(gameIds);
  };

  if (games.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <p 
            className="text-lg text-muted-foreground mb-4"
            data-testid="text-empty-games"
          >
            No games yet. Add your first game to get started!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold">Order</th>
                  <th className="text-left p-4 font-semibold">Game Name</th>
                  <th className="text-left p-4 font-semibold">Category</th>
                  <th className="text-left p-4 font-semibold">URL</th>
                  <th className="text-left p-4 font-semibold">Thumbnail</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game, index) => (
                  <tr 
                    key={game.id} 
                    className="border-b last:border-b-0 hover-elevate"
                    data-testid={`row-game-${game.id}`}
                  >
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveGame(index, 'up')}
                          disabled={index === 0 || reorderMutation.isPending}
                          data-testid={`button-move-up-${game.id}`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveGame(index, 'down')}
                          disabled={index === games.length - 1 || reorderMutation.isPending}
                          data-testid={`button-move-down-${game.id}`}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-4 font-medium" data-testid={`text-name-${game.id}`}>
                      {game.name}
                    </td>
                    <td className="p-4">
                      {game.category ? (
                        <Badge variant="outline" data-testid={`badge-category-table-${game.id}`}>
                          {game.category}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">No category</span>
                      )}
                    </td>
                    <td className="p-4">
                      <a 
                        href={game.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 w-fit"
                        data-testid={`link-url-${game.id}`}
                      >
                        {game.url.length > 40 ? `${game.url.substring(0, 40)}...` : game.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="p-4">
                      {game.thumbnailUrl ? (
                        <img 
                          src={game.thumbnailUrl} 
                          alt={game.name}
                          className="h-12 w-12 object-cover rounded"
                          data-testid={`img-thumbnail-${game.id}`}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">No image</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant={game.isActive ? "default" : "secondary"}
                        data-testid={`badge-status-${game.id}`}
                      >
                        {game.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(game)}
                          data-testid={`button-edit-${game.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(game.id)}
                          data-testid={`button-delete-${game.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {games.map((game, index) => (
          <Card key={game.id} className="p-4" data-testid={`card-game-mobile-${game.id}`}>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 
                  className="font-semibold text-lg"
                  data-testid={`text-name-mobile-${game.id}`}
                >
                  {game.name}
                </h3>
                <div className="flex gap-1 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveGame(index, 'up')}
                    disabled={index === 0 || reorderMutation.isPending}
                    data-testid={`button-move-up-mobile-${game.id}`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveGame(index, 'down')}
                    disabled={index === games.length - 1 || reorderMutation.isPending}
                    data-testid={`button-move-down-mobile-${game.id}`}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Badge 
                    variant={game.isActive ? "default" : "secondary"}
                    data-testid={`badge-status-mobile-${game.id}`}
                  >
                    {game.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <a 
                href={game.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 break-all"
                data-testid={`link-url-mobile-${game.id}`}
              >
                {game.url}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(game)}
                  data-testid={`button-edit-mobile-${game.id}`}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDeleteId(game.id)}
                  data-testid={`button-delete-mobile-${game.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the game from your portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

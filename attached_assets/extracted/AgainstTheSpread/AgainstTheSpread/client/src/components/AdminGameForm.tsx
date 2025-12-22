import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertGameSchema, type InsertGame, type Game } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, X } from "lucide-react";

const CATEGORIES = [
  "Card Games",
  "Sports",
  "Strategy",
  "Puzzle",
  "Action",
  "Casino",
  "Other",
];

interface AdminGameFormProps {
  game: Game | null;
  onClose: () => void;
}

export function AdminGameForm({ game, onClose }: AdminGameFormProps) {
  const { toast } = useToast();
  const isEditing = !!game;

  const form = useForm<InsertGame>({
    resolver: zodResolver(insertGameSchema),
    defaultValues: {
      name: game?.name || "",
      url: game?.url || "",
      description: game?.description || "",
      thumbnailUrl: game?.thumbnailUrl || "",
      category: game?.category || "",
      isActive: game?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertGame) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/games/${game.id}`, data);
      } else {
        return apiRequest("POST", "/api/games", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      toast({
        title: isEditing ? "Game updated" : "Game added",
        description: isEditing 
          ? "The game has been updated successfully." 
          : "The new game has been added successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertGame) => {
    mutation.mutate(data);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle 
              className="font-display text-3xl"
              data-testid="text-form-title"
            >
              {isEditing ? "EDIT GAME" : "ADD NEW GAME"}
            </CardTitle>
            <CardDescription 
              className="mt-2"
              data-testid="text-form-description"
            >
              {isEditing 
                ? "Update the game information below" 
                : "Fill in the details to add a new game to your portal"}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            data-testid="button-close-form"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter game name" 
                      {...field} 
                      data-testid="input-game-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game URL</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="https://example.com/game" 
                      {...field} 
                      data-testid="input-game-url"
                    />
                  </FormControl>
                  <FormDescription>
                    The full URL where users can access the game
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the game"
                      rows={4}
                      {...field}
                      value={field.value || ""}
                      data-testid="input-game-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="https://example.com/thumbnail.jpg" 
                      {...field}
                      value={field.value || ""}
                      data-testid="input-game-thumbnail"
                    />
                  </FormControl>
                  <FormDescription>
                    URL to an image that represents the game
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-game-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Categorize the game for easier organization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Only active games will be visible on the landing page
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-game-active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={mutation.isPending}
                data-testid="button-submit-game"
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Game" : "Add Game"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
                data-testid="button-cancel-game"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

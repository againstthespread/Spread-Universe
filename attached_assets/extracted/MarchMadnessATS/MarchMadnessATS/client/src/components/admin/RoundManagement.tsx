import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Round } from "@shared/schema";

const roundFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  displayName: z.string().min(1, "Display name is required"),
  pointValue: z.coerce.number().min(1, "Point value must be at least 1"),
  order: z.coerce.number().min(1, "Order must be at least 1"),
});

type RoundFormValues = z.infer<typeof roundFormSchema>;

const RoundManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rounds = [], isLoading } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
  });

  const form = useForm<RoundFormValues>({
    resolver: zodResolver(roundFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      pointValue: 10,
      order: 1,
    },
  });

  const createRoundMutation = useMutation({
    mutationFn: async (values: RoundFormValues) => {
      const response = await apiRequest("POST", "/api/rounds", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      toast({
        title: "Round created",
        description: "The tournament round has been created successfully.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create round",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: RoundFormValues) => {
    createRoundMutation.mutate(values);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Tournament Rounds</h3>
        {isLoading ? (
          <div>Loading rounds...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rounds.map((round) => (
              <div key={round.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Badge variant="outline" className="mb-1">
                    {round.pointValue} pts
                  </Badge>
                  <div className="font-medium">{round.displayName}</div>
                  <div className="text-sm text-gray-500">Internal name: {round.name}</div>
                </div>
                <div className="text-sm text-gray-500">Order: {round.order}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator className="my-6" />

      <div>
        <h3 className="text-lg font-medium mb-4">Add New Round</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., round64, sweet16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Round of 64, Sweet 16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pointValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Point Value</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={createRoundMutation.isPending}
              >
                {createRoundMutation.isPending ? "Creating..." : "Add Round"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default RoundManagement;

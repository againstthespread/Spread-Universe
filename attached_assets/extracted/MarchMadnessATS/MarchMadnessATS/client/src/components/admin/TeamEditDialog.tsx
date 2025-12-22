import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Team } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const teamEditSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  shortName: z.string().nullable().optional(),
  mascot: z.string().nullable().optional(),
  logoUrl: z.string().url("Must be a valid URL").nullable().optional(),
  seed: z.number().int().positive().nullable().optional(),
  record: z.string().nullable().optional(),
  conference: z.string().nullable().optional(),
});

type TeamEditValues = z.infer<typeof teamEditSchema>;

interface TeamEditDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeamEditDialog = ({
  team,
  open,
  onOpenChange,
}: TeamEditDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TeamEditValues>({
    resolver: zodResolver(teamEditSchema),
    defaultValues: {
      name: team?.name || "",
      shortName: team?.shortName || "",
      mascot: team?.mascot || "",
      logoUrl: team?.logoUrl || "",
      seed: team?.seed || null,
      record: team?.record || "",
      conference: team?.conference || "",
    },
  });

  // Update form values when team changes
  React.useEffect(() => {
    if (team) {
      form.reset({
        name: team.name,
        shortName: team.shortName || "",
        mascot: team.mascot || "",
        logoUrl: team.logoUrl || "",
        seed: team.seed,
        record: team.record || "",
        conference: team.conference || "",
      });
    }
  }, [team, form]);

  const updateTeamMutation = useMutation({
    mutationFn: async (values: TeamEditValues) => {
      if (!team) return null;
      
      return apiRequest<Team>('PATCH', `/api/teams/${team.id}`, values);
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
        queryClient.invalidateQueries({ queryKey: ['/api/teams/by-conference'] });
        
        toast({
          title: "Team updated",
          description: `Team "${data.name}" has been updated successfully`,
        });
        
        onOpenChange(false);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update team",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: TeamEditValues) => {
    updateTeamMutation.mutate(values);
  };

  const validateLogoUrl = async () => {
    const logoUrl = form.getValues("logoUrl");
    if (!logoUrl) return;
    
    try {
      // Simple way to validate that the image loads
      const img = new Image();
      img.src = logoUrl;
      
      // Display toast to indicate validation is happening
      toast({
        title: "Validating image...",
        description: "Please wait while we verify the logo URL",
      });
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Invalid image URL"));
        
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error("Image load timeout")), 5000);
      });
      
      toast({
        title: "Image verified",
        description: "Logo URL is valid",
      });
    } catch (error) {
      toast({
        title: "Invalid image URL",
        description: "The provided URL could not be loaded as an image",
        variant: "destructive",
      });
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{team ? `Edit ${team.name}` : "Edit Team"}</DialogTitle>
          <DialogDescription>
            Update team information and logo URL
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shortName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mascot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mascot</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="https://example.com/logo.png" />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={validateLogoUrl}
                    >
                      Validate
                    </Button>
                  </div>
                  <FormDescription>
                    Enter a direct URL to the team's logo image
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="seed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seed</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="record"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Record</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="25-8" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conference</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateTeamMutation.isPending}
              >
                {updateTeamMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamEditDialog;
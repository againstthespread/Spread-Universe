import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Team } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Search } from "lucide-react";
import TeamLogo from "@/components/ui/team-logo";
import TeamEditDialog from "./TeamEditDialog";

const teamFormSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  shortName: z.string().min(1, "Short name is required"),
  mascot: z.string().min(1, "Mascot is required"),
  conference: z.string().min(1, "Conference is required"),
  logoUrl: z.string().optional(),
  seed: z.coerce.number().min(1, "Seed must be at least 1").max(16, "Seed cannot be greater than 16").optional(),
});

type TeamFormValues = z.infer<typeof teamFormSchema>;

const TeamManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConference, setSelectedConference] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  interface TeamsByConferenceResponse {
    conferences: string[];
    teamsByConference: Record<string, Team[]>;
  }

  const { data: teamsData, isLoading } = useQuery<TeamsByConferenceResponse>({
    queryKey: ["/api/teams/by-conference"],
  });

  // Extract conferences and teams from the response
  const conferences = teamsData?.conferences || [];
  const allTeams = teamsData ? Object.values(teamsData.teamsByConference).flat() : [];
  
  // Filter teams based on selected conference and search query
  let filteredTeams = selectedConference === "all" 
    ? allTeams 
    : (teamsData?.teamsByConference?.[selectedConference] || []);
    
  // Apply search filter if there's a search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredTeams = filteredTeams.filter(team => 
      team.name.toLowerCase().includes(query) || 
      (team.shortName && team.shortName.toLowerCase().includes(query)) ||
      (team.mascot && team.mascot.toLowerCase().includes(query))
    );
  }

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      shortName: "",
      mascot: "",
      conference: "",
      logoUrl: "",
      seed: undefined,
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (values: TeamFormValues) => {
      return apiRequest<Team>("POST", "/api/teams", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams/by-conference"] });
      toast({
        title: "Team created",
        description: "The team has been added successfully.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: TeamFormValues) => {
    createTeamMutation.mutate(values);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h3 className="text-lg font-medium">Current Teams</h3>
          
          <div className="mt-2 md:mt-0 w-full md:w-auto flex flex-col md:flex-row gap-2">
            <div className="relative w-full md:w-[200px]">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search teams..."
                className="pl-8" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={selectedConference} onValueChange={setSelectedConference}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by conference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conferences</SelectItem>
                {conferences.map((conference: string) => (
                  <SelectItem key={conference} value={conference}>
                    {conference}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div>Loading teams...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTeams.length === 0 ? (
              <div className="col-span-full p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">
                  {searchQuery 
                    ? "No teams found matching your search" 
                    : "No teams added yet. Add your first team below."}
                </p>
              </div>
            ) : (
              filteredTeams.map((team) => (
                <Card key={team.id} className="overflow-hidden">
                  <CardContent className="p-4 flex flex-col">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex-shrink-0">
                        {team.logoUrl ? (
                          <TeamLogo 
                            logoUrl={team.logoUrl} 
                            teamName={team.name} 
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <div className="h-12 w-12 flex items-center justify-center bg-gray-200 text-primary font-bold rounded-full">
                            {team.shortName ? team.shortName.charAt(0) : team.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{team.shortName || team.name}</h4>
                        <div className="text-sm text-gray-600">{team.mascot}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => handleEditTeam(team)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <div className="flex flex-col gap-1">
                        <div>{team.name}</div>
                        {team.conference && <div>Conference: {team.conference}</div>}
                        {team.seed && <div>Seed: {team.seed}</div>}
                        {team.record && <div>Record: {team.record}</div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <Separator className="my-6" />

      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-lg font-medium">Add New Team</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Team Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Duke University" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Duke" {...field} />
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
                        <Input placeholder="E.g., Blue Devils" {...field} />
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
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a conference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {conferences.map((conference: string) => (
                            <SelectItem key={conference} value={conference}>
                              {conference}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seed (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="16"
                          placeholder="1-16" 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Logo URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={createTeamMutation.isPending}
                >
                  {createTeamMutation.isPending ? "Adding..." : "Add Team"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Team Edit Dialog */}
      <TeamEditDialog
        team={selectedTeam}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default TeamManagement;
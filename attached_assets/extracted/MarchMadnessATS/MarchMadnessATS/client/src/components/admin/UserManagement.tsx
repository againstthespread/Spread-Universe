import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ChevronDown, ChevronRight, Loader2, UserCog } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import TeamLogo from "@/components/ui/team-logo";
import { format } from "date-fns";

interface AdminUserResponse {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
}

interface PickedTeam {
  id: number;
  name: string;
  shortName: string | null;
  mascot: string | null;
  logoUrl: string | null;
  seed: number | null;
  record: string | null;
  conference: string | null;
}

interface GameTeam {
  id: number;
  name: string;
  shortName: string | null;
  mascot: string | null;
  logoUrl: string | null;
  seed: number | null;
  record: string | null;
  conference: string | null;
}

interface GameRound {
  id: number;
  name: string;
  displayName: string;
  pointValue: number;
  order: number;
}

interface GameInfo {
  id: number;
  homeTeam: GameTeam;
  awayTeam: GameTeam;
  round: GameRound;
  status: string;
  startTime: string;
  homeScore: number | null;
  awayScore: number | null;
  winningTeamId: number | null;
}

interface UserPick {
  id: number;
  userId: number;
  gameId: number;
  pickedTeamId: number;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  createdAt: string;
  game: GameInfo;
  pickedTeam: PickedTeam;
}

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedUsers, setExpandedUsers] = useState<number[]>([]);
  
  // Fetch all users
  const { data: users = [], isLoading, error } = useQuery<AdminUserResponse[]>({
    queryKey: ['/api/admin/users'],
    retry: 1
  });

  // Fetch picks for expanded users
  const { data: userPicks, isLoading: isLoadingPicks } = useQuery<Record<number, UserPick[]>>({
    queryKey: ['/api/admin/users/picks', expandedUsers],
    queryFn: async () => {
      const picksData: Record<number, UserPick[]> = {};
      
      // Only fetch picks for expanded users
      for (const userId of expandedUsers) {
        try {
          const picks = await apiRequest<UserPick[]>('GET', `/api/admin/users/${userId}/picks`);
          picksData[userId] = picks;
        } catch (error) {
          console.error(`Error fetching picks for user ${userId}:`, error);
          picksData[userId] = [];
        }
      }
      
      return picksData;
    },
    enabled: expandedUsers.length > 0,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number, isAdmin: boolean }) => {
      return apiRequest<AdminUserResponse>('PATCH', `/api/admin/users/${userId}`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User updated",
        description: "User permissions have been updated successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const handleToggleAdmin = (user: AdminUserResponse, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expansion
    
    if (user.isAdmin && user.username === 'admin') {
      toast({
        title: "Error",
        description: "Cannot remove admin privileges from the primary admin account",
        variant: "destructive"
      });
      return;
    }
    
    updateUserMutation.mutate({
      userId: user.id,
      isAdmin: !user.isAdmin
    });
  };

  const toggleUserExpand = (userId: number) => {
    setExpandedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const getPickStatusBadge = (pick: UserPick) => {
    if (pick.isCorrect === true) {
      return <Badge className="bg-green-600">Correct (+{pick.pointsEarned})</Badge>;
    } else if (pick.isCorrect === false) {
      return <Badge variant="destructive">Incorrect</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-destructive">
        <AlertCircle className="inline-block mr-2" />
        Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-medium">
          <UserCog className="mr-2 h-5 w-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          Click on a user row to view their picks.
        </div>
        
        <Table>
          <TableCaption>Manage user permissions for the application</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.map((user: AdminUserResponse) => (
              <>
                <TableRow 
                  key={user.id}
                  className={expandedUsers.includes(user.id) 
                    ? "bg-muted/40 cursor-pointer" 
                    : "hover:bg-muted/20 cursor-pointer"
                  }
                  onClick={() => toggleUserExpand(user.id)}
                >
                  <TableCell className="py-2">
                    {expandedUsers.includes(user.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Badge variant="destructive" className="bg-green-600 hover:bg-green-700">
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={user.isAdmin ? "outline" : "default"}
                      size="sm"
                      onClick={(e) => handleToggleAdmin(user, e)}
                      disabled={updateUserMutation.isPending}
                    >
                      {user.isAdmin ? "Remove Admin" : "Make Admin"}
                    </Button>
                  </TableCell>
                </TableRow>
                
                {expandedUsers.includes(user.id) && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/20 p-0">
                      <div className="p-4">
                        <h3 className="text-md font-medium mb-2 flex items-center">
                          User Picks
                          {isLoadingPicks && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                        </h3>
                        
                        {!isLoadingPicks && (!userPicks || !userPicks[user.id] || userPicks[user.id].length === 0) ? (
                          <div className="py-3 text-center text-muted-foreground">
                            No picks found for this user
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {!isLoadingPicks && userPicks && userPicks[user.id]?.map(pick => (
                              <div 
                                key={pick.id} 
                                className="bg-card rounded-md p-3 border shadow-sm"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium">
                                    {pick.game.round.displayName} - Game #{pick.game.id}
                                  </div>
                                  <div>
                                    {getPickStatusBadge(pick)}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between mb-2 text-sm">
                                  <div className="flex items-center space-x-2">
                                    <TeamLogo 
                                      logoUrl={pick.game.homeTeam.logoUrl} 
                                      teamName={pick.game.homeTeam.name} 
                                      className="w-6 h-6" 
                                    />
                                    <span 
                                      className={
                                        pick.pickedTeamId === pick.game.homeTeam.id 
                                          ? "font-bold" 
                                          : ""
                                      }
                                    >
                                      {pick.game.homeTeam.name}
                                      {pick.game.homeScore !== null && 
                                        ` (${pick.game.homeScore})`
                                      }
                                    </span>
                                  </div>
                                  <div className="text-muted-foreground">vs</div>
                                  <div className="flex items-center space-x-2">
                                    <span 
                                      className={
                                        pick.pickedTeamId === pick.game.awayTeam.id 
                                          ? "font-bold" 
                                          : ""
                                      }
                                    >
                                      {pick.game.awayTeam.name}
                                      {pick.game.awayScore !== null && 
                                        ` (${pick.game.awayScore})`
                                      }
                                    </span>
                                    <TeamLogo 
                                      logoUrl={pick.game.awayTeam.logoUrl} 
                                      teamName={pick.game.awayTeam.name} 
                                      className="w-6 h-6" 
                                    />
                                  </div>
                                </div>
                                
                                <div className="text-xs text-muted-foreground flex justify-between">
                                  <div>
                                    Selected: <span className="font-medium">{pick.pickedTeam.name}</span>
                                  </div>
                                  <div>
                                    Picked on: {format(new Date(pick.createdAt), 'MMM d, yyyy h:mm a')}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
            {users && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
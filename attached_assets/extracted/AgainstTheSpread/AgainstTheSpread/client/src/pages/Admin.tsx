import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { Header } from "@/components/Header";
import { AdminGameTable } from "@/components/AdminGameTable";
import { AdminGameForm } from "@/components/AdminGameForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, BarChart3, Gamepad2, LogOut, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AnalyticsData = {
  gameId: string;
  gameName: string;
  clickCount: number;
};

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const { data: authStatus, isLoading: authLoading } = useQuery<{ isAuthenticated: boolean }>({
    queryKey: ['/api/auth/status'],
  });

  const { data: games } = useQuery<Game[]>({
    queryKey: ['/api/games'],
    enabled: !!authStatus?.isAuthenticated,
  });

  const { data: analytics = [] } = useQuery<AnalyticsData[]>({
    queryKey: ['/api/analytics'],
    enabled: !!authStatus?.isAuthenticated,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/login");
    },
  });

  useEffect(() => {
    if (!authLoading && !authStatus?.isAuthenticated) {
      setLocation("/login");
    }
  }, [authStatus, authLoading, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!authStatus?.isAuthenticated) {
    return null;
  }

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingGame(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Admin Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/" data-testid="link-home">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <span>/</span>
              <span>Admin</span>
              <span>/</span>
              <span>Games</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 
                  className="font-display text-4xl md:text-5xl font-bold"
                  data-testid="text-admin-heading"
                >
                  GAME MANAGEMENT
                </h1>
                <p 
                  className="text-muted-foreground mt-2"
                  data-testid="text-admin-description"
                >
                  Manage your game links and keep your portal up to date
                </p>
              </div>
              
              <div className="flex gap-2">
                {!isFormOpen && (
                  <Button 
                    onClick={() => setIsFormOpen(true)}
                    size="lg"
                    className="gap-2"
                    data-testid="button-add-game"
                  >
                    <Plus className="h-5 w-5" />
                    Add New Game
                  </Button>
                )}
                <Button 
                  onClick={() => logoutMutation.mutate()}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs for Games and Analytics */}
          <Tabs defaultValue="games" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2" data-testid="tabs-admin">
              <TabsTrigger value="games" className="gap-2" data-testid="tab-games">
                <Gamepad2 className="h-4 w-4" />
                Games
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="games" className="mt-6">
              {isFormOpen ? (
                <AdminGameForm 
                  game={editingGame} 
                  onClose={handleFormClose}
                />
              ) : (
                <AdminGameTable 
                  games={games || []} 
                  onEdit={handleEdit}
                />
              )}
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Click Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8" data-testid="text-no-analytics">
                      No clicks recorded yet. Visit the homepage and click "Play Now" on any game to start tracking.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.map((item) => (
                        <div 
                          key={item.gameId} 
                          className="flex items-center justify-between p-4 rounded-lg border"
                          data-testid={`analytics-row-${item.gameId}`}
                        >
                          <div>
                            <h3 className="font-semibold" data-testid={`analytics-game-name-${item.gameId}`}>
                              {item.gameName || "Unknown Game"}
                            </h3>
                            <p className="text-sm text-muted-foreground">Game ID: {item.gameId}</p>
                          </div>
                          <div className="text-right">
                            <div 
                              className="text-3xl font-bold text-primary"
                              data-testid={`analytics-click-count-${item.gameId}`}
                            >
                              {item.clickCount}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.clickCount === 1 ? "click" : "clicks"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar, BarChart3, PlusCircle, CheckSquare, History, TrendingUp, ListChecks, KeyRound } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isAdmin = user?.isAdmin;

  const navItems = isAdmin
    ? [
        { path: "/", label: "Dashboard", icon: BarChart3 },
        { path: "/picks", label: "My Picks", icon: CheckSquare },
        { path: "/admin/games", label: "Manage Games", icon: Calendar },
        { path: "/admin/results", label: "Enter Results", icon: CheckSquare },
        { path: "/admin/password-reset", label: "Reset Passwords", icon: KeyRound },
        { path: "/history", label: "Pick History", icon: History },
        { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { path: "/stats", label: "Statistics", icon: TrendingUp },
      ]
    : [
        { path: "/", label: "Make Picks", icon: CheckSquare },
        { path: "/history", label: "Pick History", icon: History },
        { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { path: "/stats", label: "Statistics", icon: TrendingUp },
      ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="fas fa-football-ball text-primary text-2xl"></i>
              <div>
                <h1 className="text-xl font-bold">NFL Playoffs ATS</h1>
                <p className="text-xs text-muted-foreground">
                  {user?.displayName || user?.username}
                  {isAdmin && " (Admin)"}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`gap-2 ${isActive ? "border-b-2 border-primary rounded-b-none" : ""}`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-card">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>NFL Playoffs ATS Pick'em Game &copy; 2025</p>
        </div>
      </footer>
    </div>
  );
}

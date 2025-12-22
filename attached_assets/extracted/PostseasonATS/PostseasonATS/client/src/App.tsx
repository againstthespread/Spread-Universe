import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Layout } from "@/components/Layout";
import AuthPage from "@/pages/auth-page";
import UserPicksPage from "@/pages/user-picks-page";
import LeaderboardPage from "@/pages/leaderboard-page";
import PickHistoryPage from "@/pages/pick-history-page";
import StatsPage from "@/pages/stats-page";
import AdminDashboardPage from "@/pages/admin-dashboard-page";
import AdminGamesPage from "@/pages/admin-games-page";
import AdminResultsPage from "@/pages/admin-results-page";
import AdminPasswordResetPage from "@/pages/admin-password-reset-page";
import ChangePasswordPage from "@/pages/change-password-page";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute 
        path="/" 
        component={() => {
          const { user } = useAuth();
          return (
            <ProtectedLayout>
              {user?.isAdmin ? <AdminDashboardPage /> : <UserPicksPage />}
            </ProtectedLayout>
          );
        }} 
      />
      <ProtectedRoute 
        path="/picks" 
        component={() => (
          <ProtectedLayout>
            <UserPicksPage />
          </ProtectedLayout>
        )} 
      />
      <ProtectedRoute 
        path="/leaderboard" 
        component={() => (
          <ProtectedLayout>
            <LeaderboardPage />
          </ProtectedLayout>
        )} 
      />
      <ProtectedRoute 
        path="/admin/games" 
        component={() => (
          <ProtectedLayout>
            <AdminGamesPage />
          </ProtectedLayout>
        )} 
      />
      <ProtectedRoute 
        path="/admin/results" 
        component={() => (
          <ProtectedLayout>
            <AdminResultsPage />
          </ProtectedLayout>
        )} 
      />
      <ProtectedRoute 
        path="/admin/password-reset" 
        component={() => (
          <ProtectedLayout>
            <AdminPasswordResetPage />
          </ProtectedLayout>
        )} 
      />
      <ProtectedRoute 
        path="/change-password" 
        component={ChangePasswordPage}
      />
      <ProtectedRoute 
        path="/history" 
        component={() => (
          <ProtectedLayout>
            <PickHistoryPage />
          </ProtectedLayout>
        )} 
      />
      <ProtectedRoute 
        path="/stats" 
        component={() => (
          <ProtectedLayout>
            <StatsPage />
          </ProtectedLayout>
        )} 
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

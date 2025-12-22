import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/header";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import Account from "@/pages/account";
import PlatformPage from "@/pages/platform";
import CrowdlineDashboard from "@/pages/crowdline/index";
import CrowdlineLeaderboard from "@/pages/crowdline/leaderboard";
import CrowdlineAdmin from "@/pages/crowdline/admin";
import MarchMadnessDashboard from "@/pages/marchmadness/index";
import MarchMadnessLeaderboard from "@/pages/marchmadness/leaderboard";
import MarchMadnessAdmin from "@/pages/marchmadness/admin";
import FantasyStreamDashboard from "@/pages/fantasystream/index";
import GamblingLeagueDashboard from "@/pages/gambling-league/index";
import GamblingLeagueDetail from "@/pages/gambling-league/league-detail";
import PostseasonDashboard from "@/pages/postseason/index";
import PostseasonLeaderboard from "@/pages/postseason/leaderboard";
import PostseasonPicksHistory from "@/pages/postseason/picks-history";
import PostseasonAdmin from "@/pages/postseason/admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/account" component={Account} />
      <Route path="/crowdline" component={CrowdlineDashboard} />
      <Route path="/crowdline/leaderboard" component={CrowdlineLeaderboard} />
      <Route path="/crowdline/admin" component={CrowdlineAdmin} />
      <Route path="/marchmadness" component={MarchMadnessDashboard} />
      <Route path="/marchmadness/leaderboard" component={MarchMadnessLeaderboard} />
      <Route path="/marchmadness/admin" component={MarchMadnessAdmin} />
      <Route path="/fantasystream" component={FantasyStreamDashboard} />
      <Route path="/gambling-league" component={GamblingLeagueDashboard} />
      <Route path="/gambling-league/leagues/:id" component={GamblingLeagueDetail} />
      <Route path="/postseason" component={PostseasonDashboard} />
      <Route path="/postseason/leaderboard" component={PostseasonLeaderboard} />
      <Route path="/postseason/history" component={PostseasonPicksHistory} />
      <Route path="/postseason/admin" component={PostseasonAdmin} />
      <Route path="/postseasonats" component={PostseasonDashboard} />
      <Route path="/footballweather" component={PlatformPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Header />
              <Router />
            </div>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

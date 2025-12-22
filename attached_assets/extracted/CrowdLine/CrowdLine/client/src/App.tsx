import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import Leaderboard from "@/pages/leaderboard";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useLocation } from "wouter";

function AuthenticatedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading, error } = useQuery<{ id: string; username: string; isAdmin: boolean }>({
    queryKey: ["/api/user"],
    retry: false,
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || error)) {
      setLocation("/");
    }
  }, [user, isLoading, error, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || error) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/home">
        {() => <AuthenticatedRoute component={Home} />}
      </Route>
      <Route path="/leaderboard">
        {() => <AuthenticatedRoute component={Leaderboard} />}
      </Route>
      <Route path="/admin">
        {() => <AuthenticatedRoute component={Admin} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

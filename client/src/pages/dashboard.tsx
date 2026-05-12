import { Link, useLocation } from "wouter";
import { Shield, Settings, ChevronRight, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { PlatformCard } from "@/components/platform-card";
import { platforms } from "@shared/schema";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-80 shrink-0">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">{user.username}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant="secondary" className="mt-2">
                    All Platforms
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Link href="/account">
                    <Button variant="ghost" className="w-full justify-start" data-testid="link-account-settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Account Settings
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Lock className="h-4 w-4" />
                    <span>Session Info</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last active: Just now</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <main className="flex-1">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.username}!</h1>
              <p className="text-muted-foreground">
                Access all your sports betting platforms from one place
              </p>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                  <CardTitle>Your Platforms</CardTitle>
                  <Badge variant="outline">{platforms.length} Connected</Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {platforms.map((platform) => (
                      <PlatformCard
                        key={platform.id}
                        platform={platform}
                        onClick={() => setLocation(platform.url)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Link href="/account">
                      <Button variant="outline" className="w-full justify-between" data-testid="button-manage-account">
                        Manage Account
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/account">
                      <Button variant="outline" className="w-full justify-between" data-testid="button-security-settings">
                        Security Settings
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

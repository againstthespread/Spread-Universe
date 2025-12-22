import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Users, Trophy, Play, Medal, Star, Cloud, type LucideIcon, ExternalLink, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { platforms } from "@shared/schema";

const iconMap: Record<string, LucideIcon> = {
  Users,
  Trophy,
  Play,
  Medal,
  Star,
  Cloud,
};

const platformContent: Record<string, { features: string[]; stats: { label: string; value: string }[] }> = {
  crowdline: {
    features: [
      "Real-time betting line movements",
      "Crowd sentiment analysis",
      "Sharp money indicators",
      "Line value alerts",
    ],
    stats: [
      { label: "Active Users", value: "12.4K" },
      { label: "Lines Tracked", value: "500+" },
      { label: "Accuracy Rate", value: "67%" },
    ],
  },
  marchmadness: {
    features: [
      "Bracket builder and simulator",
      "Historical tournament data",
      "Upset probability calculator",
      "Head-to-head matchup analysis",
    ],
    stats: [
      { label: "Brackets Created", value: "45K" },
      { label: "Games Analyzed", value: "2,100" },
      { label: "Upset Alerts", value: "89" },
    ],
  },
  fantasystream: {
    features: [
      "Live fantasy scoring updates",
      "Player performance streams",
      "Trade analyzer tool",
      "Waiver wire recommendations",
    ],
    stats: [
      { label: "Leagues Synced", value: "8.2K" },
      { label: "Players Tracked", value: "15K+" },
      { label: "Trade Grades", value: "2.1M" },
    ],
  },
  "gambling-league": {
    features: [
      "Create private betting leagues",
      "Weekly competitions",
      "Leaderboard rankings",
      "Season-long standings",
    ],
    stats: [
      { label: "Active Leagues", value: "3.4K" },
      { label: "Total Members", value: "28K" },
      { label: "Bets Placed", value: "1.2M" },
    ],
  },
  postseason: {
    features: [
      "Playoff bracket predictions",
      "Series outcome probabilities",
      "Historical playoff trends",
      "Clutch player analysis",
    ],
    stats: [
      { label: "Series Tracked", value: "124" },
      { label: "Predictions Made", value: "890K" },
      { label: "Win Rate", value: "58%" },
    ],
  },
  footballweather: {
    features: [
      "Game-day weather forecasts",
      "Wind and precipitation impacts",
      "Historical weather correlations",
      "Total/spread adjustments",
    ],
    stats: [
      { label: "Games Covered", value: "256" },
      { label: "Weather Alerts", value: "1.2K" },
      { label: "Edge Found", value: "4.2%" },
    ],
  },
};

export default function PlatformPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  // Extract platform ID from URL path (e.g., "/crowdline" -> "crowdline")
  const platformId = location.slice(1);
  const platform = platforms.find((p) => p.id === platformId);
  const content = platformId ? platformContent[platformId] : null;

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!platform || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Platform not found</h2>
            <p className="text-muted-foreground mb-4">The requested platform doesn't exist.</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = iconMap[platform.icon] || Users;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <header className={`bg-gradient-to-r ${platform.color} text-white`}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{platform.name}</h1>
                  <p className="text-white/80 text-sm">{platform.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                <Lock className="h-3 w-3 mr-1" />
                SSO Connected
              </Badge>
              <Avatar className="h-9 w-9 border-2 border-white/30">
                <AvatarFallback className="bg-white/20 text-white text-sm">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {user.username}</CardTitle>
                <CardDescription>
                  You're signed in via Against The Spread SSO
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Single Sign-On Active</p>
                      <p className="text-sm text-muted-foreground">
                        Your session is managed by Against The Spread. Access all platforms with one login.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold mb-3">Platform Features</h3>
                <ul className="space-y-2">
                  {content.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-muted-foreground">
                      <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${platform.color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start" data-testid="button-explore">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Explore {platform.name}
                  </Button>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-switch">
                      <Users className="h-4 w-4 mr-2" />
                      Switch Platform
                    </Button>
                  </Link>
                  <Link href="/account">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-settings">
                      <Shield className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                  </Link>
                  <Button variant="outline" className="justify-start" data-testid="button-help">
                    <Medal className="h-4 w-4 mr-2" />
                    Get Help
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {content.stats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className="font-semibold">{stat.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">All Platforms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Signed in as</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Access all 6 platforms with your Against The Spread account
                  </p>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="w-full" data-testid="button-view-all">
                      View All Platforms
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

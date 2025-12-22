import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Trophy, Tv, Target, Cloud, BarChart3 } from "lucide-react";

import CrowdlineAdminContent from "./crowdline/admin-content";
import MarchMadnessAdminContent from "./marchmadness/admin-content";
import PostseasonAdminContent from "./postseason/admin-content";
import GamblingLeagueAdminContent from "./gambling-league/admin-content";

export default function AdminPanel() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("crowdline");

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-admin-title">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage all platforms from one central location
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto gap-1" data-testid="tabs-admin-platforms">
          <TabsTrigger value="crowdline" className="flex items-center gap-2" data-testid="tab-crowdline">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Crowdline</span>
          </TabsTrigger>
          <TabsTrigger value="marchmadness" className="flex items-center gap-2" data-testid="tab-marchmadness">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">March Madness</span>
          </TabsTrigger>
          <TabsTrigger value="fantasystream" className="flex items-center gap-2" data-testid="tab-fantasystream">
            <Tv className="h-4 w-4" />
            <span className="hidden sm:inline">FantasyStream</span>
          </TabsTrigger>
          <TabsTrigger value="gamblingLeague" className="flex items-center gap-2" data-testid="tab-gambling-league">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Gambling League</span>
          </TabsTrigger>
          <TabsTrigger value="postseason" className="flex items-center gap-2" data-testid="tab-postseason">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Postseason</span>
          </TabsTrigger>
          <TabsTrigger value="footballWeather" className="flex items-center gap-2" data-testid="tab-football-weather">
            <Cloud className="h-4 w-4" />
            <span className="hidden sm:inline">Football Weather</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crowdline">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Crowdline Admin
                </CardTitle>
                <CardDescription>Manage crowd-sourced prediction games</CardDescription>
              </div>
              <Badge variant="outline">Crowd-Sourced Predictions</Badge>
            </CardHeader>
            <CardContent>
              <CrowdlineAdminContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marchmadness">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  March Madness ATS Admin
                </CardTitle>
                <CardDescription>Manage NCAA tournament picks and teams</CardDescription>
              </div>
              <Badge variant="outline">NCAA Tournament</Badge>
            </CardHeader>
            <CardContent>
              <MarchMadnessAdminContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fantasystream">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tv className="h-5 w-5" />
                  FantasyStream Admin
                </CardTitle>
                <CardDescription>Fantasy sports analytics configuration</CardDescription>
              </div>
              <Badge variant="outline">Fantasy Sports</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground" data-testid="text-fantasystream-placeholder">
                <Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">FantasyStream Admin Coming Soon</p>
                <p className="text-sm">Analytics configuration and data source management will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gamblingLeague">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Gambling League Admin
                </CardTitle>
                <CardDescription>Manage weekly games and league settings</CardDescription>
              </div>
              <Badge variant="outline">Betting Leagues</Badge>
            </CardHeader>
            <CardContent>
              <GamblingLeagueAdminContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="postseason">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Postseason ATS Admin
                </CardTitle>
                <CardDescription>Manage NFL playoff picks and games</CardDescription>
              </div>
              <Badge variant="outline">NFL Playoffs</Badge>
            </CardHeader>
            <CardContent>
              <PostseasonAdminContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footballWeather">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Football Weather Admin
                </CardTitle>
                <CardDescription>Weather impact analysis configuration</CardDescription>
              </div>
              <Badge variant="outline">Weather Analysis</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground" data-testid="text-footballweather-placeholder">
                <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Football Weather Admin Coming Soon</p>
                <p className="text-sm">Weather data source configuration and stadium settings will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

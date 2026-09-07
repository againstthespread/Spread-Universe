import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { queryClient, apiFetch, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Trophy, Tv, Target, Cloud, BarChart3, Flag, Shield, KeyRound, Copy, Check, ChevronUp, ChevronDown, GripVertical, LayoutList } from "lucide-react";
import { platforms } from "@shared/schema";

import CrowdlineAdminContent from "./crowdline/admin-content";
import MarchMadnessAdminContent from "./marchmadness/admin-content";
import PostseasonAdminContent from "./postseason/admin-content";
import GamblingLeagueAdminContent from "./gambling-league/admin-content";
import GolfAdminContent from "./golf/admin-content";
import CfbAdminContent from "./cfb/admin-content";

function UserManagementContent() {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<{ id: string; username: string; email: string }[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
  });

  const tempPasswordMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest("POST", `/api/admin/users/${userId}/temp-password`, {}),
    onSuccess: async (res) => {
      const data = await res.json();
      setTempPassword(data.tempPassword);
      setCopied(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate temp password", variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!selectedUserId) return;
    setTempPassword(null);
    tempPasswordMutation.mutate(selectedUserId);
  };

  const handleCopy = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedUser = allUsers.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6 max-w-md">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Select a user and generate a temporary password to share with them. Their existing password will be replaced immediately.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Select User</label>
          {usersLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : (
            <Select
              value={selectedUserId}
              onValueChange={(v) => { setSelectedUserId(v); setTempPassword(null); }}
            >
              <SelectTrigger data-testid="select-user-trigger">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {allUsers.map(u => (
                  <SelectItem key={u.id} value={u.id} data-testid={`select-user-${u.id}`}>
                    <span className="font-medium">{u.username}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{u.email}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!selectedUserId || tempPasswordMutation.isPending}
          data-testid="button-generate-temp-password"
          className="w-full"
        >
          {tempPasswordMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
          ) : (
            <><KeyRound className="h-4 w-4 mr-2" /> Generate Temp Password</>
          )}
        </Button>
      </div>

      {tempPassword && (
        <div className="space-y-2 p-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Temp password for <span className="font-bold">{selectedUser?.username}</span>
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={tempPassword}
              className="font-mono text-base tracking-widest bg-white dark:bg-background"
              data-testid="input-temp-password"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              data-testid="button-copy-temp-password"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this with {selectedUser?.username}. They can log in and change it via account settings.
          </p>
        </div>
      )}
    </div>
  );
}

function PlatformOrderContent() {
  const { toast } = useToast();

  const { data: savedOrder = [], isLoading } = useQuery<string[]>({
    queryKey: ["/api/platforms/order"],
    queryFn: async () => {
      const res = await apiFetch("/api/platforms/order");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const defaultOrder = platforms.map(p => p.id);
  const resolvedOrder: string[] = savedOrder.length > 0
    ? [...savedOrder, ...defaultOrder.filter(id => !savedOrder.includes(id))]
    : defaultOrder;

  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    if (resolvedOrder.length > 0 && order.length === 0) {
      setOrder(resolvedOrder);
    }
  }, [resolvedOrder.join(",")]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/platforms/order", { ids: order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms/order"] });
      toast({ title: "Saved", description: "Platform order updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save order.", variant: "destructive" });
    },
  });

  const move = (index: number, direction: -1 | 1) => {
    const next = [...order];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setOrder(next);
  };

  if (isLoading || order.length === 0) {
    return <div className="py-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Drag the platforms into the order you want them to appear in the sidebar for all users.
      </p>
      <div className="divide-y divide-border rounded-lg border">
        {order.map((id, i) => {
          const platform = platforms.find(p => p.id === id);
          if (!platform) return null;
          return (
            <div key={id} className="flex items-center gap-3 px-4 py-3" data-testid={`row-platform-order-${id}`}>
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 font-medium text-sm">{platform.name}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  data-testid={`button-move-up-${id}`}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  data-testid={`button-move-down-${id}`}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-platform-order">
        {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save Order
      </Button>
    </div>
  );
}

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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-10 h-auto gap-1" data-testid="tabs-admin-platforms">
          <TabsTrigger value="users" className="flex items-center gap-2" data-testid="tab-users">
            <KeyRound className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
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
          <TabsTrigger value="golf" className="flex items-center gap-2" data-testid="tab-golf">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Golf Fantasy</span>
          </TabsTrigger>
          <TabsTrigger value="cfb" className="flex items-center gap-2" data-testid="tab-cfb">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">CFB</span>
          </TabsTrigger>
          <TabsTrigger value="platformOrder" className="flex items-center gap-2" data-testid="tab-platform-order">
            <LayoutList className="h-4 w-4" />
            <span className="hidden sm:inline">Platform Order</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>Generate temporary passwords for locked-out users</CardDescription>
              </div>
              <Badge variant="outline">Account Recovery</Badge>
            </CardHeader>
            <CardContent>
              <UserManagementContent />
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="golf">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Golf Fantasy Admin
                </CardTitle>
                <CardDescription>Manage tournaments, golfers, and scores</CardDescription>
              </div>
              <Badge variant="outline">Fantasy Golf</Badge>
            </CardHeader>
            <CardContent>
              <GolfAdminContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cfb">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  CFB Conferences Admin
                </CardTitle>
                <CardDescription>Sync college football games and finalize league weeks</CardDescription>
              </div>
              <Badge variant="outline">College Football</Badge>
            </CardHeader>
            <CardContent>
              <CfbAdminContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platformOrder">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LayoutList className="h-5 w-5" />
                  Platform Order
                </CardTitle>
                <CardDescription>Control the order platforms appear in the sidebar for all users</CardDescription>
              </div>
              <Badge variant="outline">Site Settings</Badge>
            </CardHeader>
            <CardContent>
              <PlatformOrderContent />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

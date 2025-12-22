import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RoundManagement from "./RoundManagement";
import GameForm from "./GameForm";
import GameManagement from "./GameManagement";
import GameScoreUpdateForm from "./GameScoreUpdateForm";
import TeamManagement from "./TeamManagement";
import UserManagement from "./UserManagement";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("games");

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader className="bg-primary text-white">
          <CardTitle className="text-xl font-bold">Admin Dashboard</CardTitle>
          <CardDescription className="text-white text-opacity-80">
            Manage tournament rounds, games, teams, users, and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="games">Games</TabsTrigger>
              <TabsTrigger value="scores">Game Scores</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="games" className="space-y-6">
              <RoundManagement />
              <GameManagement />
              <GameForm />
            </TabsContent>
            
            <TabsContent value="scores" className="space-y-6">
              <GameScoreUpdateForm />
            </TabsContent>
            
            <TabsContent value="teams">
              <TeamManagement />
            </TabsContent>
            
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="notifications">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Send Notifications</h3>
                <p className="text-muted-foreground">
                  Send notifications to all users or specific users.
                </p>
                {/* Notification management components would go here */}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, CheckSquare, Users, Trophy } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

type DashboardStats = {
  totalGames: number;
  completedGames: number;
  pendingGames: number;
  totalUsers: number;
  totalPicks: number;
};

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const dashboardCards = [
    {
      title: "Total Games",
      value: stats?.totalGames || 0,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Completed Games",
      value: stats?.completedGames || 0,
      icon: CheckSquare,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Pending Results",
      value: stats?.pendingGames || 0,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      title: "Active Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage games, enter results, and monitor player activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-md ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/games">
            <Button className="w-full h-24 flex flex-col gap-2" variant="outline">
              <Calendar className="h-6 w-6" />
              <span>Manage Games</span>
            </Button>
          </Link>
          <Link href="/admin/results">
            <Button className="w-full h-24 flex flex-col gap-2" variant="outline">
              <CheckSquare className="h-6 w-6" />
              <span>Enter Results</span>
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button className="w-full h-24 flex flex-col gap-2" variant="outline">
              <Trophy className="h-6 w-6" />
              <span>View Leaderboard</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

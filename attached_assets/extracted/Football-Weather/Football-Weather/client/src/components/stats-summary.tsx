import { Card, CardContent } from "@/components/ui/card";
import { Building2, Trees, Target, Footprints, AlertTriangle } from "lucide-react";
import type { GameWithWeather } from "@shared/schema";

interface StatsSummaryProps {
  games: GameWithWeather[];
}

export function StatsSummary({ games }: StatsSummaryProps) {
  const domeGames = games.filter(g => g.stadium.isDome).length;
  const outdoorGames = games.filter(g => !g.stadium.isDome).length;
  const passingWeather = games.filter(g => g.fantasyImplication === "ideal_passing" || g.fantasyImplication === "dome_game").length;
  const rbWeather = games.filter(g => g.fantasyImplication === "rb_weather").length;
  const severeWeather = games.filter(g => {
    if (!g.weather || g.stadium.isDome) return false;
    return (g.weather.snow && g.weather.snow > 0) || 
           g.weather.precipitation > 70 || 
           g.weather.windSpeed > 20 ||
           g.weather.temp < 32;
  }).length;

  const stats = [
    {
      label: "Dome Games",
      value: domeGames,
      icon: <Building2 className="h-5 w-5" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    },
    {
      label: "Outdoor Games",
      value: outdoorGames,
      icon: <Trees className="h-5 w-5" />,
      color: "text-green-500",
      bgColor: "bg-green-500/10 dark:bg-green-500/20",
    },
    {
      label: "QB/WR Favorable",
      value: passingWeather,
      icon: <Target className="h-5 w-5" />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    },
    {
      label: "RB Favorable",
      value: rbWeather,
      icon: <Footprints className="h-5 w-5" />,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    },
    {
      label: "Severe Weather",
      value: severeWeather,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-red-500",
      bgColor: "bg-red-500/10 dark:bg-red-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-0 bg-card" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`p-2 rounded-md ${stat.bgColor}`}>
              <div className={stat.color}>{stat.icon}</div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import type { FootballWeatherGame } from "@shared/schema";
import { Sun, CloudSnow, Building, Minus } from "lucide-react";

interface StatsSummaryProps {
  games: FootballWeatherGame[];
}

export function StatsSummary({ games }: StatsSummaryProps) {
  const stats = {
    ideal_passing: games.filter((g) => g.fantasyImplication === "ideal_passing").length,
    rb_weather: games.filter((g) => g.fantasyImplication === "rb_weather").length,
    dome_game: games.filter((g) => g.fantasyImplication === "dome_game").length,
    neutral: games.filter((g) => g.fantasyImplication === "neutral").length,
  };

  const summaryCards = [
    {
      title: "Ideal Passing",
      count: stats.ideal_passing,
      icon: Sun,
      className: "bg-purple-500/10 border-purple-500/30",
      iconColor: "text-purple-500",
    },
    {
      title: "RB Weather",
      count: stats.rb_weather,
      icon: CloudSnow,
      className: "bg-orange-500/10 border-orange-500/30",
      iconColor: "text-orange-500",
    },
    {
      title: "Dome Games",
      count: stats.dome_game,
      icon: Building,
      className: "bg-blue-500/10 border-blue-500/30",
      iconColor: "text-blue-500",
    },
    {
      title: "Neutral",
      count: stats.neutral,
      icon: Minus,
      className: "bg-gray-500/10 border-gray-500/30",
      iconColor: "text-gray-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {summaryCards.map((card) => (
        <Card key={card.title} className={`${card.className}`} data-testid={`card-stat-${card.title.toLowerCase().replace(" ", "-")}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <card.icon className={`h-8 w-8 ${card.iconColor}`} />
              <div>
                <p className="text-2xl font-bold">{card.count}</p>
                <p className="text-sm text-muted-foreground">{card.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

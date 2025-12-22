import { Badge } from "@/components/ui/badge";
import type { FootballWeatherFantasyImplication } from "@shared/schema";

interface FantasyBadgeProps {
  implication: FootballWeatherFantasyImplication;
}

const implicationConfig: Record<FootballWeatherFantasyImplication, { label: string; className: string }> = {
  ideal_passing: {
    label: "Ideal Passing",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  rb_weather: {
    label: "RB Weather",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  dome_game: {
    label: "Dome Game",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  neutral: {
    label: "Neutral",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30",
  },
};

export function FantasyBadge({ implication }: FantasyBadgeProps) {
  const config = implicationConfig[implication];

  return (
    <Badge
      variant="outline"
      className={config.className}
      data-testid={`badge-fantasy-${implication}`}
    >
      {config.label}
    </Badge>
  );
}

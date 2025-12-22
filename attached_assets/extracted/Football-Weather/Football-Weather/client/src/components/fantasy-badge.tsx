import { Badge } from "@/components/ui/badge";
import { Target, Footprints, Building2, MinusCircle } from "lucide-react";
import type { FantasyImplication } from "@shared/schema";

interface FantasyBadgeProps {
  implication: FantasyImplication;
}

export function FantasyBadge({ implication }: FantasyBadgeProps) {
  const config: Record<FantasyImplication, { label: string; icon: React.ReactNode; className: string }> = {
    ideal_passing: {
      label: "QB/WR WEATHER",
      icon: <Target className="h-3 w-3" />,
      className: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20",
    },
    rb_weather: {
      label: "RB WEATHER",
      icon: <Footprints className="h-3 w-3" />,
      className: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20",
    },
    dome_game: {
      label: "DOME GAME",
      icon: <Building2 className="h-3 w-3" />,
      className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20",
    },
    neutral: {
      label: "NEUTRAL",
      icon: <MinusCircle className="h-3 w-3" />,
      className: "bg-muted text-muted-foreground",
    },
  };

  const { label, icon, className } = config[implication];

  return (
    <Badge 
      variant="secondary" 
      className={`gap-1 font-semibold ${className}`}
      data-testid={`badge-fantasy-${implication}`}
    >
      {icon}
      <span>{label}</span>
    </Badge>
  );
}

import { Badge } from "@/components/ui/badge";
import { Building2, Trees } from "lucide-react";

interface StadiumBadgeProps {
  isDome: boolean;
  stadiumName: string;
}

export function StadiumBadge({ isDome, stadiumName }: StadiumBadgeProps) {
  if (isDome) {
    return (
      <Badge 
        variant="secondary" 
        className="gap-1 bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20"
        data-testid="badge-dome"
      >
        <Building2 className="h-3 w-3" />
        <span>DOME</span>
      </Badge>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className="gap-1 bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-500/20"
      data-testid="badge-outdoor"
    >
      <Trees className="h-3 w-3" />
      <span>OUTDOOR</span>
    </Badge>
  );
}

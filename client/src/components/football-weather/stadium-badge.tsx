import { Badge } from "@/components/ui/badge";
import { Building, TreePine } from "lucide-react";

interface StadiumBadgeProps {
  isDome: boolean;
  stadiumName: string;
}

export function StadiumBadge({ isDome, stadiumName }: StadiumBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 ${
        isDome
          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
          : "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
      }`}
      data-testid={`badge-stadium-${isDome ? "dome" : "outdoor"}`}
    >
      {isDome ? <Building className="h-3 w-3" /> : <TreePine className="h-3 w-3" />}
      <span className="text-xs">{isDome ? "Dome" : "Outdoor"}</span>
    </Badge>
  );
}

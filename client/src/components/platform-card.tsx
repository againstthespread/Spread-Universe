import { Users, Trophy, Play, Medal, Star, Cloud, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Platform } from "@shared/schema";

const iconMap: Record<string, LucideIcon> = {
  Users,
  Trophy,
  Play,
  Medal,
  Star,
  Cloud,
};

interface PlatformCardProps {
  platform: Platform;
  onClick?: () => void;
}

export function PlatformCard({ platform, onClick }: PlatformCardProps) {
  const Icon = iconMap[platform.icon] || Users;

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover-elevate overflow-visible"
      onClick={onClick}
      data-testid={`card-platform-${platform.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${platform.color} text-white`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight mb-1">
              {platform.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {platform.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

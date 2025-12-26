import { Users, Trophy, Play, Medal, Star, Cloud, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Platform } from "@shared/schema";
import crowdlineLogo from "@assets/generated_images/white_plus_minus_icon.png";
import marchMadnessLogo from "@assets/generated_images/white_basketball_silhouette_icon.png";
import fantasyStreamLogo from "@assets/generated_images/white_referee_touchdown_icon.png";
import postseasonLogo from "@assets/generated_images/white_lombardi_trophy_icon.png";
import gamblingLeagueLogo from "@assets/generated_images/white_equals_bars_icon.png";
import footballWeatherLogo from "@assets/generated_images/white_weather_cloud_sun_icon.png";

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
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${platform.color} text-white overflow-hidden`}
          >
            {platform.id === "crowdline" ? (
              <img src={crowdlineLogo} alt="Crowdline" className="h-8 w-8 object-contain" />
            ) : platform.id === "marchmadness" ? (
              <img src={marchMadnessLogo} alt="March Madness" className="h-8 w-8 object-contain" />
            ) : platform.id === "fantasystream" ? (
              <img src={fantasyStreamLogo} alt="FantasyStream" className="h-8 w-8 object-contain" />
            ) : platform.id === "postseason" ? (
              <img src={postseasonLogo} alt="Postseason ATS" className="h-8 w-8 object-contain" />
            ) : platform.id === "gambling-league" ? (
              <img src={gamblingLeagueLogo} alt="Gambling League" className="h-8 w-8 object-contain" />
            ) : platform.id === "footballweather" ? (
              <img src={footballWeatherLogo} alt="Football Weather" className="h-8 w-8 object-contain" />
            ) : (
              <Icon className="h-6 w-6" />
            )}
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

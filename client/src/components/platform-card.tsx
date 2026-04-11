import { Users, Trophy, Play, Medal, Star, Cloud, Flag, Lock, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Platform } from "@shared/schema";
import crowdlineLogo from "@assets/generated_images/black_plus-minus_on_white.png";
import marchMadnessLogo from "@assets/generated_images/simple_basketball_icon_logo.png";
import fantasyStreamLogo from "@assets/generated_images/referee_touchdown_signal_icon.png";
import postseasonLogo from "@assets/generated_images/lombardi_trophy_icon.png";
import gamblingLeagueLogo from "@assets/generated_images/green_red_equals_sign_icon.png";
import footballWeatherLogo from "@assets/generated_images/sun_behind_cloud_weather_icon.png";

const iconMap: Record<string, LucideIcon> = {
  Users,
  Trophy,
  Play,
  Medal,
  Star,
  Cloud,
  Flag,
};

interface PlatformCardProps {
  platform: Platform;
  onClick?: () => void;
  showLockIcon?: boolean;
}

export function PlatformCard({ platform, onClick, showLockIcon }: PlatformCardProps) {
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
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg leading-tight">
                {platform.name}
              </h3>
              {showLockIcon && (
                <Lock className="h-4 w-4 text-muted-foreground" data-testid={`lock-icon-${platform.id}`} />
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {platform.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

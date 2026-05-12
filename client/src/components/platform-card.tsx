import { Users, Trophy, Play, Medal, Star, Cloud, Flag, Lock, ChevronRight, type LucideIcon } from "lucide-react";
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

function PlatformIconInner({ platform, size = "md" }: { platform: Platform; size?: "sm" | "md" }) {
  const Icon = iconMap[platform.icon] || Users;
  const boxSize = size === "sm" ? "h-8 w-8" : "h-12 w-12";
  const imgSize = size === "sm" ? "h-5 w-5" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  const golfBox = size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const golfSvg = size === "sm" ? "h-6 w-6" : "h-9 w-9";

  return (
    <div className={`flex ${boxSize} shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${platform.color} text-white overflow-hidden`}>
      {platform.id === "crowdline" ? (
        <img src={crowdlineLogo} alt="Crowdline" className={`${imgSize} object-contain`} />
      ) : platform.id === "marchmadness" ? (
        <img src={marchMadnessLogo} alt="March Madness" className={`${imgSize} object-contain`} />
      ) : platform.id === "fantasystream" ? (
        <img src={fantasyStreamLogo} alt="FantasyStream" className={`${imgSize} object-contain`} />
      ) : platform.id === "postseason" ? (
        <img src={postseasonLogo} alt="Postseason ATS" className={`${imgSize} object-contain`} />
      ) : platform.id === "gambling-league" ? (
        <img src={gamblingLeagueLogo} alt="Gambling League" className={`${imgSize} object-contain`} />
      ) : platform.id === "footballweather" ? (
        <img src={footballWeatherLogo} alt="Football Weather" className={`${imgSize} object-contain`} />
      ) : platform.id === "golf" ? (
        <div className={`${golfBox} bg-white rounded-sm flex items-center justify-center`}>
          <svg viewBox="0 0 40 40" className={golfSvg} xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="20" cy="31" rx="14" ry="5" fill="#4ade80" />
            <ellipse cx="17" cy="32" rx="5" ry="2" fill="#166534" />
            <line x1="20" y1="10" x2="20" y2="31" stroke="#78716c" strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="20,10 30,14 20,18" fill="#ef4444" />
            <circle cx="18" cy="18" r="3" fill="white" stroke="#d1d5db" strokeWidth="0.5" />
          </svg>
        </div>
      ) : (
        <Icon className={iconSize} />
      )}
    </div>
  );
}

interface PlatformCardProps {
  platform: Platform;
  onClick?: () => void;
  showLockIcon?: boolean;
}

export function PlatformCard({ platform, onClick, showLockIcon }: PlatformCardProps) {
  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover-elevate overflow-visible"
      onClick={onClick}
      data-testid={`card-platform-${platform.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <PlatformIconInner platform={platform} size="md" />
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

export function PlatformRow({ platform, onClick }: { platform: Platform; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid={`row-platform-${platform.id}`}
      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/60 transition-colors text-left group"
    >
      <PlatformIconInner platform={platform} size="sm" />
      <span className="flex-1 text-sm font-medium truncate">{platform.name}</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FootballWeatherGame } from "@shared/schema";
import { WeatherIcon } from "./weather-icon";
import { StadiumBadge } from "./stadium-badge";
import { FantasyBadge } from "./fantasy-badge";
import { MapPin, Thermometer, Wind, Droplets } from "lucide-react";
import { format } from "date-fns";

interface GameCardProps {
  game: FootballWeatherGame;
}

export function GameCard({ game }: GameCardProps) {
  const { homeTeam, awayTeam, stadium, weather, fantasyImplication, gameTime } = game;

  return (
    <Card className="overflow-visible" data-testid={`card-game-${game.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StadiumBadge isDome={stadium.isDome} stadiumName={stadium.name} />
          <FantasyBadge implication={fantasyImplication} />
        </div>
        <span className="text-xs text-muted-foreground">
          {format(new Date(gameTime), "EEE, MMM d h:mm a")}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-center flex-1">
            {awayTeam.logo && (
              <img
                src={awayTeam.logo}
                alt={awayTeam.displayName}
                className="h-12 w-12 object-contain"
              />
            )}
            <span className="text-sm font-medium text-center mt-1">{awayTeam.shortDisplayName}</span>
            <span className="text-xs text-muted-foreground">Away</span>
          </div>

          <div className="text-xl font-bold text-muted-foreground">@</div>

          <div className="flex flex-col items-center flex-1">
            {homeTeam.logo && (
              <img
                src={homeTeam.logo}
                alt={homeTeam.displayName}
                className="h-12 w-12 object-contain"
              />
            )}
            <span className="text-sm font-medium text-center mt-1">{homeTeam.shortDisplayName}</span>
            <span className="text-xs text-muted-foreground">Home</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{stadium.name}</span>
        </div>

        {weather ? (
          <div className="bg-muted/50 rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2">
              <WeatherIcon icon={weather.icon} className="h-5 w-5" />
              <span className="text-sm font-medium">{weather.description}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Thermometer className="h-3 w-3 text-red-500" />
                <span>{weather.temp}F</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3 text-blue-500" />
                <span>{weather.windSpeed} mph</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="h-3 w-3 text-cyan-500" />
                <span>{weather.precipitation}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-md p-3">
            <span className="text-sm text-muted-foreground">Indoor - No weather data</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

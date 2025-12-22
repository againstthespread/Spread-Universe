import { Card, CardContent } from "@/components/ui/card";
import { StadiumBadge } from "./stadium-badge";
import { FantasyBadge } from "./fantasy-badge";
import { WeatherIcon, getWeatherColor } from "./weather-icon";
import { Wind, Droplets, Thermometer, Snowflake, MapPin, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { GameWithWeather } from "@shared/schema";

interface GameCardProps {
  game: GameWithWeather;
}

export function GameCard({ game }: GameCardProps) {
  const gameDate = parseISO(game.gameTime);
  const formattedDate = format(gameDate, "EEE, MMM d");
  const formattedTime = format(gameDate, "h:mm a");

  return (
    <Card 
      className="hover-elevate transition-all duration-200"
      data-testid={`card-game-${game.id}`}
    >
      <CardContent className="p-4">
        {/* Header: Teams and Time */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            {/* Teams */}
            <div className="flex items-center gap-2 mb-1">
              {game.awayTeam.logo && (
                <img 
                  src={game.awayTeam.logo} 
                  alt={game.awayTeam.displayName}
                  className="h-6 w-6 object-contain"
                />
              )}
              <span className="font-semibold text-foreground truncate" data-testid={`text-away-team-${game.id}`}>
                {game.awayTeam.shortDisplayName}
              </span>
              <span className="text-muted-foreground">@</span>
              {game.homeTeam.logo && (
                <img 
                  src={game.homeTeam.logo} 
                  alt={game.homeTeam.displayName}
                  className="h-6 w-6 object-contain"
                />
              )}
              <span className="font-semibold text-foreground truncate" data-testid={`text-home-team-${game.id}`}>
                {game.homeTeam.shortDisplayName}
              </span>
            </div>
            
            {/* Location */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{game.stadium.city}, {game.stadium.state}</span>
            </div>
          </div>

          {/* Date/Time */}
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span data-testid={`text-game-time-${game.id}`}>{formattedTime}</span>
            </div>
            <div className="text-sm text-muted-foreground" data-testid={`text-game-date-${game.id}`}>
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Stadium and Fantasy Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <StadiumBadge isDome={game.stadium.isDome} stadiumName={game.stadium.name} />
          <FantasyBadge implication={game.fantasyImplication} />
        </div>

        {/* Weather Section */}
        {game.stadium.isDome ? (
          <div className="bg-muted/50 rounded-md p-3 text-center">
            <p className="text-sm text-muted-foreground">
              Indoor stadium - weather not a factor
            </p>
          </div>
        ) : game.weather ? (
          <div className="bg-muted/50 rounded-md p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className={getWeatherColor(game.weather.temp, game.weather.precipitation, game.weather.snow)}>
                <WeatherIcon icon={game.weather.icon} className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm capitalize text-muted-foreground" data-testid={`text-weather-desc-${game.id}`}>
                  {game.weather.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Temperature */}
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold" data-testid={`text-temp-${game.id}`}>
                    {Math.round(game.weather.temp)}°F
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Feels {Math.round(game.weather.feelsLike)}°
                  </p>
                </div>
              </div>

              {/* Wind */}
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold" data-testid={`text-wind-${game.id}`}>
                    {Math.round(game.weather.windSpeed)} mph
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {game.weather.windGust ? `Gusts ${Math.round(game.weather.windGust)}` : "Wind"}
                  </p>
                </div>
              </div>

              {/* Precipitation */}
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold" data-testid={`text-precip-${game.id}`}>
                    {Math.round(game.weather.precipitation)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Precip</p>
                </div>
              </div>

              {/* Snow or Rain Amount */}
              {game.weather.snow && game.weather.snow > 0 ? (
                <div className="flex items-center gap-2">
                  <Snowflake className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-sm font-semibold" data-testid={`text-snow-${game.id}`}>
                      {game.weather.snow.toFixed(1)}"
                    </p>
                    <p className="text-xs text-muted-foreground">Snow</p>
                  </div>
                </div>
              ) : game.weather.rain && game.weather.rain > 0 ? (
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold" data-testid={`text-rain-${game.id}`}>
                      {game.weather.rain.toFixed(2)}"
                    </p>
                    <p className="text-xs text-muted-foreground">Rain</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">{game.weather.humidity}%</p>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-md p-3 text-center">
            <p className="text-sm text-muted-foreground">
              Weather data unavailable
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

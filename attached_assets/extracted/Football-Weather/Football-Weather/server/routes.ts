import type { Express } from "express";
import { createServer, type Server } from "http";
import { 
  type GameWithWeather, 
  type Weather, 
  type Team, 
  type Stadium,
  type FantasyImplication,
  NFL_STADIUMS,
  TEAM_STADIUMS 
} from "@shared/schema";

// Helper to get next Tuesday at 8 AM EST
function getNextTuesdayReset(): Date {
  const now = new Date();
  const estOffset = -5; // EST is UTC-5
  const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const estNow = new Date(utcNow.getTime() + estOffset * 3600000);
  
  const dayOfWeek = estNow.getDay();
  let daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
  
  // If it's Tuesday but past 8 AM, go to next Tuesday
  if (daysUntilTuesday === 0 && estNow.getHours() >= 8) {
    daysUntilTuesday = 7;
  }
  
  const nextTuesday = new Date(estNow);
  nextTuesday.setDate(estNow.getDate() + daysUntilTuesday);
  nextTuesday.setHours(8, 0, 0, 0);
  
  // Convert back to UTC
  return new Date(nextTuesday.getTime() - estOffset * 3600000);
}

// Track weather API status for reporting
let weatherApiStatus: { available: boolean; lastError?: string; successCount: number; failCount: number } = {
  available: true,
  successCount: 0,
  failCount: 0,
};

// Fetch weather from OpenWeatherMap
async function fetchWeather(lat: number, lon: number, gameTime: Date): Promise<Weather | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    weatherApiStatus.available = false;
    weatherApiStatus.lastError = "API key not configured";
    return null;
  }

  try {
    // Calculate hours until game to decide which API to use
    const hoursUntilGame = (gameTime.getTime() - Date.now()) / (1000 * 60 * 60);
    
    let weatherData: any;
    
    if (hoursUntilGame <= 48) {
      // Use current weather or hourly forecast for nearby games
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        if (response.status === 401) {
          weatherApiStatus.available = false;
          weatherApiStatus.lastError = "API key is invalid or not yet activated (new keys take 10-60 minutes to activate)";
        }
        weatherApiStatus.failCount++;
        console.error("Weather API error:", response.status, errorText);
        return null;
      }
      weatherData = await response.json();
      weatherApiStatus.successCount++;
      weatherApiStatus.available = true;
      
      return {
        temp: weatherData.main.temp,
        feelsLike: weatherData.main.feels_like,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
        windGust: weatherData.wind.gust,
        description: weatherData.weather[0]?.description || "Unknown",
        icon: weatherData.weather[0]?.icon || "01d",
        precipitation: weatherData.clouds?.all || 0,
        rain: weatherData.rain?.["1h"] || weatherData.rain?.["3h"] || 0,
        snow: weatherData.snow?.["1h"] || weatherData.snow?.["3h"] || 0,
      };
    } else {
      // Use 5-day forecast for games further out
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        if (response.status === 401) {
          weatherApiStatus.available = false;
          weatherApiStatus.lastError = "API key is invalid or not yet activated (new keys take 10-60 minutes to activate)";
        }
        weatherApiStatus.failCount++;
        console.error("Forecast API error:", response.status, errorText);
        return null;
      }
      const forecastData = await response.json();
      weatherApiStatus.successCount++;
      weatherApiStatus.available = true;
      
      // Find the forecast closest to game time
      const gameTimeMs = gameTime.getTime();
      let closestForecast = forecastData.list[0];
      let closestDiff = Math.abs(new Date(forecastData.list[0].dt * 1000).getTime() - gameTimeMs);
      
      for (const forecast of forecastData.list) {
        const forecastTime = new Date(forecast.dt * 1000).getTime();
        const diff = Math.abs(forecastTime - gameTimeMs);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestForecast = forecast;
        }
      }
      
      return {
        temp: closestForecast.main.temp,
        feelsLike: closestForecast.main.feels_like,
        humidity: closestForecast.main.humidity,
        windSpeed: closestForecast.wind.speed,
        windGust: closestForecast.wind.gust,
        description: closestForecast.weather[0]?.description || "Unknown",
        icon: closestForecast.weather[0]?.icon || "01d",
        precipitation: closestForecast.pop ? closestForecast.pop * 100 : 0,
        rain: closestForecast.rain?.["3h"] || 0,
        snow: closestForecast.snow?.["3h"] || 0,
      };
    }
  } catch (error) {
    weatherApiStatus.failCount++;
    console.error("Error fetching weather:", error);
    return null;
  }
}

// Calculate fantasy implication based on weather conditions
function calculateFantasyImplication(weather: Weather | null, isDome: boolean): FantasyImplication {
  if (isDome) {
    return "dome_game";
  }
  
  if (!weather) {
    return "neutral";
  }
  
  const hasSnow = weather.snow && weather.snow > 0;
  const hasRain = weather.rain && weather.rain > 0.1;
  const highPrecipChance = weather.precipitation > 50;
  const isCold = weather.temp < 40;
  const isVeryWarm = weather.temp > 65;
  const highWind = weather.windSpeed > 15;
  const lowWind = weather.windSpeed < 10;
  
  // RB Weather: Cold, precipitation, or high winds
  if (hasSnow || (hasRain && isCold) || (highPrecipChance && isCold) || (highWind && isCold)) {
    return "rb_weather";
  }
  
  // Ideal Passing: Warm, low wind, no precipitation
  if (isVeryWarm && lowWind && !hasRain && !hasSnow && weather.precipitation < 30) {
    return "ideal_passing";
  }
  
  // Moderate conditions
  if (weather.temp > 50 && weather.windSpeed < 12 && weather.precipitation < 40) {
    return "ideal_passing";
  }
  
  return "neutral";
}

// Fetch NFL games from ESPN API
async function fetchNFLGames(): Promise<GameWithWeather[]> {
  try {
    // ESPN's public scoreboard API
    const url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("ESPN API error:", response.status);
      return [];
    }
    
    const data = await response.json();
    const games: GameWithWeather[] = [];
    
    for (const event of data.events || []) {
      const competition = event.competitions?.[0];
      if (!competition) continue;
      
      const homeCompetitor = competition.competitors?.find((c: any) => c.homeAway === "home");
      const awayCompetitor = competition.competitors?.find((c: any) => c.homeAway === "away");
      
      if (!homeCompetitor || !awayCompetitor) continue;
      
      const homeTeam: Team = {
        id: homeCompetitor.team.id,
        name: homeCompetitor.team.name,
        abbreviation: homeCompetitor.team.abbreviation,
        displayName: homeCompetitor.team.displayName,
        shortDisplayName: homeCompetitor.team.shortDisplayName,
        logo: homeCompetitor.team.logo,
      };
      
      const awayTeam: Team = {
        id: awayCompetitor.team.id,
        name: awayCompetitor.team.name,
        abbreviation: awayCompetitor.team.abbreviation,
        displayName: awayCompetitor.team.displayName,
        shortDisplayName: awayCompetitor.team.shortDisplayName,
        logo: awayCompetitor.team.logo,
      };
      
      // Get stadium info
      const stadiumName = TEAM_STADIUMS[homeTeam.abbreviation];
      let stadium: Stadium;
      
      if (stadiumName && NFL_STADIUMS[stadiumName]) {
        stadium = NFL_STADIUMS[stadiumName];
      } else {
        // Fallback for unknown stadiums
        const venue = competition.venue;
        stadium = {
          name: venue?.fullName || "Unknown Stadium",
          city: venue?.address?.city || "Unknown",
          state: venue?.address?.state || "Unknown",
          isDome: venue?.indoor || false,
          lat: 39.8283, // Default to center of US
          lon: -98.5795,
        };
      }
      
      const gameTime = new Date(event.date);
      
      // Fetch weather for outdoor games
      let weather: Weather | null = null;
      if (!stadium.isDome) {
        weather = await fetchWeather(stadium.lat, stadium.lon, gameTime);
      }
      
      const fantasyImplication = calculateFantasyImplication(weather, stadium.isDome);
      
      games.push({
        id: event.id,
        homeTeam,
        awayTeam,
        stadium,
        gameTime: event.date,
        weather,
        fantasyImplication,
      });
    }
    
    // Sort by game time
    games.sort((a, b) => new Date(a.gameTime).getTime() - new Date(b.gameTime).getTime());
    
    return games;
  } catch (error) {
    console.error("Error fetching NFL games:", error);
    return [];
  }
}

// Get current NFL week number
function getCurrentWeekNumber(data: any): number {
  if (data.week?.number) {
    return data.week.number;
  }
  
  // Fallback: calculate based on NFL season start
  const seasonStart = new Date("2024-09-05"); // NFL 2024 season start
  const now = new Date();
  const weeksSinceStart = Math.ceil((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(18, weeksSinceStart));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // GET /api/games - Fetch all games for the current week with weather
  app.get("/api/games", async (req, res) => {
    try {
      // Reset weather API status counts for fresh fetch
      weatherApiStatus.successCount = 0;
      weatherApiStatus.failCount = 0;
      
      // First fetch ESPN data to get week number
      const espnResponse = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard");
      const espnData = await espnResponse.json();
      
      const games = await fetchNFLGames();
      const weekNumber = getCurrentWeekNumber(espnData);
      
      // Determine weather status
      const outdoorGames = games.filter(g => !g.stadium.isDome);
      const gamesWithWeather = outdoorGames.filter(g => g.weather !== null);
      
      let weatherStatus: "available" | "unavailable" | "partial" = "available";
      let weatherMessage: string | undefined;
      
      if (outdoorGames.length > 0) {
        if (gamesWithWeather.length === 0) {
          weatherStatus = "unavailable";
          weatherMessage = weatherApiStatus.lastError || "Weather data temporarily unavailable. Try refreshing in a few minutes.";
        } else if (gamesWithWeather.length < outdoorGames.length) {
          weatherStatus = "partial";
          weatherMessage = `Weather data available for ${gamesWithWeather.length} of ${outdoorGames.length} outdoor games`;
        }
      }
      
      res.json({
        games,
        lastUpdated: new Date().toISOString(),
        weekNumber,
        nextReset: getNextTuesdayReset().toISOString(),
        weatherStatus,
        weatherMessage,
      });
    } catch (error) {
      console.error("Error in /api/games:", error);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  return httpServer;
}

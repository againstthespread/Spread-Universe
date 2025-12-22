import { z } from "zod";

// NFL Stadium information with dome/outdoor classification
export const stadiumSchema = z.object({
  name: z.string(),
  city: z.string(),
  state: z.string(),
  isDome: z.boolean(),
  lat: z.number(),
  lon: z.number(),
});

export type Stadium = z.infer<typeof stadiumSchema>;

// NFL Team
export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviation: z.string(),
  displayName: z.string(),
  shortDisplayName: z.string(),
  logo: z.string().optional(),
});

export type Team = z.infer<typeof teamSchema>;

// Weather data from OpenWeatherMap
export const weatherSchema = z.object({
  temp: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  windGust: z.number().optional(),
  description: z.string(),
  icon: z.string(),
  precipitation: z.number(),
  snow: z.number().optional(),
  rain: z.number().optional(),
});

export type Weather = z.infer<typeof weatherSchema>;

// Fantasy implications based on weather
export const fantasyImplicationSchema = z.enum([
  "ideal_passing", // Warm, low wind, no precipitation - great for QBs/WRs
  "rb_weather",    // Cold, precipitation, wind - favors RBs
  "dome_game",     // Indoor game - neutral/slightly favors passing
  "neutral",       // Moderate conditions
]);

export type FantasyImplication = z.infer<typeof fantasyImplicationSchema>;

// Combined game data with weather
export const gameWithWeatherSchema = z.object({
  id: z.string(),
  homeTeam: teamSchema,
  awayTeam: teamSchema,
  stadium: stadiumSchema,
  gameTime: z.string(),
  weather: weatherSchema.nullable(),
  fantasyImplication: fantasyImplicationSchema,
});

export type GameWithWeather = z.infer<typeof gameWithWeatherSchema>;

// API response for games list
export const gamesResponseSchema = z.object({
  games: z.array(gameWithWeatherSchema),
  lastUpdated: z.string(),
  weekNumber: z.number(),
  nextReset: z.string(),
  weatherStatus: z.enum(["available", "unavailable", "partial"]).optional(),
  weatherMessage: z.string().optional(),
});

export type GamesResponse = z.infer<typeof gamesResponseSchema>;

// NFL Stadiums database with coordinates for weather lookup
export const NFL_STADIUMS: Record<string, Stadium> = {
  // Dome stadiums
  "State Farm Stadium": { name: "State Farm Stadium", city: "Glendale", state: "AZ", isDome: true, lat: 33.5276, lon: -112.2626 },
  "Mercedes-Benz Stadium": { name: "Mercedes-Benz Stadium", city: "Atlanta", state: "GA", isDome: true, lat: 33.7553, lon: -84.4006 },
  "Caesars Superdome": { name: "Caesars Superdome", city: "New Orleans", state: "LA", isDome: true, lat: 29.9511, lon: -90.0812 },
  "Ford Field": { name: "Ford Field", city: "Detroit", state: "MI", isDome: true, lat: 42.34, lon: -83.0456 },
  "U.S. Bank Stadium": { name: "U.S. Bank Stadium", city: "Minneapolis", state: "MN", isDome: true, lat: 44.9736, lon: -93.2575 },
  "AT&T Stadium": { name: "AT&T Stadium", city: "Arlington", state: "TX", isDome: true, lat: 32.7473, lon: -97.0945 },
  "NRG Stadium": { name: "NRG Stadium", city: "Houston", state: "TX", isDome: true, lat: 29.6847, lon: -95.4107 },
  "Lucas Oil Stadium": { name: "Lucas Oil Stadium", city: "Indianapolis", state: "IN", isDome: true, lat: 39.7601, lon: -86.1639 },
  "Allegiant Stadium": { name: "Allegiant Stadium", city: "Las Vegas", state: "NV", isDome: true, lat: 36.0909, lon: -115.1833 },
  "SoFi Stadium": { name: "SoFi Stadium", city: "Inglewood", state: "CA", isDome: true, lat: 33.9535, lon: -118.3392 },
  
  // Open-air stadiums
  "Bank of America Stadium": { name: "Bank of America Stadium", city: "Charlotte", state: "NC", isDome: false, lat: 35.2258, lon: -80.8528 },
  "Soldier Field": { name: "Soldier Field", city: "Chicago", state: "IL", isDome: false, lat: 41.8623, lon: -87.6167 },
  "Paycor Stadium": { name: "Paycor Stadium", city: "Cincinnati", state: "OH", isDome: false, lat: 39.0954, lon: -84.516 },
  "Cleveland Browns Stadium": { name: "Cleveland Browns Stadium", city: "Cleveland", state: "OH", isDome: false, lat: 41.506, lon: -81.6995 },
  "Empower Field at Mile High": { name: "Empower Field at Mile High", city: "Denver", state: "CO", isDome: false, lat: 39.7439, lon: -105.02 },
  "Lambeau Field": { name: "Lambeau Field", city: "Green Bay", state: "WI", isDome: false, lat: 44.5013, lon: -88.0622 },
  "EverBank Stadium": { name: "EverBank Stadium", city: "Jacksonville", state: "FL", isDome: false, lat: 30.3239, lon: -81.6373 },
  "GEHA Field at Arrowhead Stadium": { name: "GEHA Field at Arrowhead Stadium", city: "Kansas City", state: "MO", isDome: false, lat: 39.0489, lon: -94.4839 },
  "Hard Rock Stadium": { name: "Hard Rock Stadium", city: "Miami Gardens", state: "FL", isDome: false, lat: 25.958, lon: -80.2389 },
  "Gillette Stadium": { name: "Gillette Stadium", city: "Foxborough", state: "MA", isDome: false, lat: 42.0909, lon: -71.2643 },
  "MetLife Stadium": { name: "MetLife Stadium", city: "East Rutherford", state: "NJ", isDome: false, lat: 40.8128, lon: -74.0742 },
  "Lincoln Financial Field": { name: "Lincoln Financial Field", city: "Philadelphia", state: "PA", isDome: false, lat: 39.9008, lon: -75.1675 },
  "Acrisure Stadium": { name: "Acrisure Stadium", city: "Pittsburgh", state: "PA", isDome: false, lat: 40.4468, lon: -80.0158 },
  "Levi's Stadium": { name: "Levi's Stadium", city: "Santa Clara", state: "CA", isDome: false, lat: 37.4033, lon: -121.9694 },
  "Lumen Field": { name: "Lumen Field", city: "Seattle", state: "WA", isDome: false, lat: 47.5952, lon: -122.3316 },
  "Raymond James Stadium": { name: "Raymond James Stadium", city: "Tampa", state: "FL", isDome: false, lat: 27.9759, lon: -82.5033 },
  "Nissan Stadium": { name: "Nissan Stadium", city: "Nashville", state: "TN", isDome: false, lat: 36.1665, lon: -86.7713 },
  "Northwest Stadium": { name: "Northwest Stadium", city: "Landover", state: "MD", isDome: false, lat: 38.9076, lon: -76.8645 },
  "Highmark Stadium": { name: "Highmark Stadium", city: "Orchard Park", state: "NY", isDome: false, lat: 42.7738, lon: -78.787 },
  "M&T Bank Stadium": { name: "M&T Bank Stadium", city: "Baltimore", state: "MD", isDome: false, lat: 39.278, lon: -76.6227 },
};

// Team to stadium mapping
export const TEAM_STADIUMS: Record<string, string> = {
  "ARI": "State Farm Stadium",
  "ATL": "Mercedes-Benz Stadium",
  "BAL": "M&T Bank Stadium",
  "BUF": "Highmark Stadium",
  "CAR": "Bank of America Stadium",
  "CHI": "Soldier Field",
  "CIN": "Paycor Stadium",
  "CLE": "Cleveland Browns Stadium",
  "DAL": "AT&T Stadium",
  "DEN": "Empower Field at Mile High",
  "DET": "Ford Field",
  "GB": "Lambeau Field",
  "HOU": "NRG Stadium",
  "IND": "Lucas Oil Stadium",
  "JAX": "EverBank Stadium",
  "KC": "GEHA Field at Arrowhead Stadium",
  "LAC": "SoFi Stadium",
  "LAR": "SoFi Stadium",
  "LV": "Allegiant Stadium",
  "MIA": "Hard Rock Stadium",
  "MIN": "U.S. Bank Stadium",
  "NE": "Gillette Stadium",
  "NO": "Caesars Superdome",
  "NYG": "MetLife Stadium",
  "NYJ": "MetLife Stadium",
  "PHI": "Lincoln Financial Field",
  "PIT": "Acrisure Stadium",
  "SF": "Levi's Stadium",
  "SEA": "Lumen Field",
  "TB": "Raymond James Stadium",
  "TEN": "Nissan Stadium",
  "WSH": "Northwest Stadium",
};

// App constants
export const APP_NAME = "NCAA March Madness Pick'Em";

// Game statuses
export const GAME_STATUS = {
  UPCOMING: "upcoming",
  LIVE: "live",
  COMPLETED: "completed",
};

// Rounds with their point values
export const TOURNAMENT_ROUNDS = [
  { name: "round64", displayName: "Round of 64", pointValue: 10, order: 1 },
  { name: "round32", displayName: "Round of 32", pointValue: 20, order: 2 },
  { name: "sweet16", displayName: "Sweet 16", pointValue: 40, order: 3 },
  { name: "elite8", displayName: "Elite 8", pointValue: 80, order: 4 },
  { name: "finalFour", displayName: "Final Four", pointValue: 160, order: 5 },
  { name: "championship", displayName: "Championship", pointValue: 320, order: 6 },
];

// Tournament regions
export const TOURNAMENT_REGIONS = [
  "East",
  "West",
  "South",
  "Midwest",
];

// Sample fallback team logos by conference (in a real app, these would be actual URLs)
export const FALLBACK_TEAM_LOGOS: Record<string, string> = {
  "ACC": "https://a.espncdn.com/i/teamlogos/ncaa/500/acc.png", 
  "Big 12": "https://a.espncdn.com/i/teamlogos/ncaa/500/big12.png",
  "Big East": "https://a.espncdn.com/i/teamlogos/ncaa/500/bigeast.png",
  "Big Ten": "https://a.espncdn.com/i/teamlogos/ncaa/500/bigten.png",
  "Pac-12": "https://a.espncdn.com/i/teamlogos/ncaa/500/pac12.png",
  "SEC": "https://a.espncdn.com/i/teamlogos/ncaa/500/sec.png",
  "default": "https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png"
};

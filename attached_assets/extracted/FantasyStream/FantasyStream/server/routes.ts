import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { gameSchema, playSchema, espnGameResponseSchema, type Game, type Play } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get current games
  app.get("/api/games", async (_req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  // Get recent plays with optional filtering
  app.get("/api/plays", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const teamFilter = req.query.team as string;
      const playerFilter = req.query.player as string;
      const plays = await storage.getPlays(limit, teamFilter, playerFilter);
      res.json(plays);
    } catch (error) {
      console.error("Error fetching plays:", error);
      res.status(500).json({ error: "Failed to fetch plays" });
    }
  });

  // Get unique teams for filter dropdown
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getUniqueTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  // Get unique players for filter dropdown  
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getUniquePlayers();
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ error: "Failed to fetch players" });
    }
  });

  // Fetch and update data from ESPN
  app.post("/api/refresh", async (_req, res) => {
    try {
      await fetchESPNData();
      res.json({ message: "Data refreshed successfully" });
    } catch (error) {
      console.error("Error refreshing data:", error);
      res.status(500).json({ error: "Failed to refresh data from ESPN" });
    }
  });

  const httpServer = createServer(app);

  // Auto-refresh data every 30 seconds
  setInterval(async () => {
    try {
      await fetchESPNData();
      console.log("Auto-refreshed ESPN data");
    } catch (error) {
      console.error("Auto-refresh error:", error);
    }
  }, 30000);

  return httpServer;
}

async function fetchGamePlays(eventId: string, competition: any) {
  try {
    // Use ESPN's game summary endpoint to get detailed play-by-play data
    const gameUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`;
    
    const response = await fetch(gameUrl);
    if (!response.ok) {
      console.warn(`Failed to fetch plays for game ${eventId}: ${response.status}`);
      return;
    }
    
    const gameData = await response.json();
    
    // Get team abbreviations from competition data
    const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home')?.team?.abbreviation || 'HOME';
    const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away')?.team?.abbreviation || 'AWAY';
    
    // Parse drives and plays from the summary
    if (gameData.drives?.previous || gameData.drives?.current) {
      const allDrives = [
        ...(gameData.drives.previous || []),
        ...(gameData.drives.current ? [gameData.drives.current] : [])
      ];
      
      for (const drive of allDrives) {
        if (drive.plays && Array.isArray(drive.plays)) {
          for (const espnPlay of drive.plays) {
            const play: Play = {
              id: espnPlay.id,
              gameId: eventId,
              team: espnPlay.start?.team?.abbreviation || extractTeamFromDrive(drive, homeTeam, awayTeam),
              quarter: `Q${espnPlay.period?.number || 1}`,
              timeRemaining: espnPlay.clock?.displayValue || "15:00",
              down: espnPlay.start?.down,
              distance: espnPlay.start?.distance,
              yardLine: espnPlay.start?.yardLine ? `${espnPlay.start.team?.abbreviation || ''} ${espnPlay.start.yardLine}` : undefined,
              playType: mapPlayType(espnPlay.type?.text || espnPlay.text),
              description: espnPlay.text,
              playerName: extractPlayerName(espnPlay.text),
              receiverName: extractReceiverName(espnPlay.text),
              yards: espnPlay.statYardage,
              timestamp: new Date().toISOString(),
              isScoring: isScorePlay(espnPlay.text),
              isLive: competition.status.type.state === 'in',
            };
            
            await storage.addPlay(play);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching plays for game ${eventId}:`, error);
  }
}

async function fetchESPNData() {
  try {
    // ESPN Fantasy Football API endpoints
    const scoresUrl = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
    
    const response = await fetch(scoresUrl);
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Parse and store games
    if (data.events) {
      for (const event of data.events) {
        if (event.competitions && event.competitions[0]) {
          const competition = event.competitions[0];
          const competitors = competition.competitors;
          
          if (competitors && competitors.length >= 2) {
            const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
            const awayTeam = competitors.find((c: any) => c.homeAway === 'away');
            
            if (homeTeam && awayTeam) {
              const game: Game = {
                id: event.id,
                homeTeam: homeTeam.team.abbreviation,
                awayTeam: awayTeam.team.abbreviation,
                homeScore: parseInt(homeTeam.score || "0"),
                awayScore: parseInt(awayTeam.score || "0"),
                quarter: `Q${competition.status.period || 1}`,
                timeRemaining: competition.status.displayClock || "15:00",
                status: mapESPNStatus(competition.status.type.state),
              };
              
              await storage.updateGame(game);
            }
          }
          
          // Fetch play-by-play data from individual game endpoint if game is live
          if (competition.status.type.state === 'in') {
            await fetchGamePlays(event.id, competition);
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch ESPN data:", error);
    throw error;
  }
}

function mapESPNStatus(state: string): 'pre' | 'in' | 'post' {
  switch (state.toLowerCase()) {
    case 'pre':
      return 'pre';
    case 'in':
      return 'in';
    case 'post':
      return 'post';
    default:
      return 'pre';
  }
}

function mapPlayType(text: string): 'pass' | 'rush' | 'punt' | 'kick' | 'turnover' | 'touchdown' | 'fieldgoal' | 'safety' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('pass')) return 'pass';
  if (lowerText.includes('rush') || lowerText.includes('run')) return 'rush';
  if (lowerText.includes('punt')) return 'punt';
  if (lowerText.includes('kick') || lowerText.includes('field goal')) return 'fieldgoal';
  if (lowerText.includes('touchdown')) return 'touchdown';
  if (lowerText.includes('turnover') || lowerText.includes('interception') || lowerText.includes('fumble')) return 'turnover';
  if (lowerText.includes('safety')) return 'safety';
  return 'pass'; // default
}

function extractTeamFromPlay(text: string): string {
  // Extract team abbreviation from play text
  const teamMatch = text.match(/^([A-Z]{2,3})\s/);
  return teamMatch ? teamMatch[1] : 'NFL';
}

function extractTeamFromDrive(drive: any, homeTeam: string, awayTeam: string): string {
  // Extract team from drive data with better fallback logic
  if (drive.team?.abbreviation) {
    return drive.team.abbreviation;
  }
  // Try to infer from possession or field position context if available
  if (drive.start?.possessionTeam?.abbreviation) {
    return drive.start.possessionTeam.abbreviation;
  }
  // Last resort: default to home team (deterministic)
  return homeTeam;
}

function extractPlayerName(text: string): string | undefined {
  // Extract player name (first name found in play description)
  const nameMatch = text.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
  return nameMatch ? nameMatch[1] : undefined;
}

function extractReceiverName(text: string): string | undefined {
  // Extract receiver name from pass plays
  if (text.includes(' to ')) {
    const toMatch = text.match(/ to ([A-Z][a-z]+ [A-Z][a-z]+)/);
    return toMatch ? toMatch[1] : undefined;
  }
  return undefined;
}

function isScorePlay(text: string): boolean {
  const lowerText = text.toLowerCase();
  return lowerText.includes('touchdown') || 
         lowerText.includes('field goal') || 
         lowerText.includes('safety') ||
         lowerText.includes('extra point');
}

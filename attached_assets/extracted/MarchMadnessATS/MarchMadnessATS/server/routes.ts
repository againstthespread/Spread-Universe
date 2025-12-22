import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertTeamSchema, 
  insertGameSchema, 
  updateGameSchema, 
  insertPickSchema, 
  insertNotificationSchema,
  insertRoundSchema,
  User,
  Team
} from "@shared/schema";
import session from "express-session";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import createMemoryStore from "memorystore";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    isAdmin?: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Configure session with simple memory store
  const MemoryStore = createMemoryStore(session);
  
  app.use(
    session({
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      name: 'session', // Change cookie name from connect.sid to session
      secret: "march-madness-pick-em-secret-key", // Use a fixed string for consistent hashing
      resave: true, // Changed to true to ensure session is saved on each request
      saveUninitialized: true, // Ensure session is always created
      rolling: true, // Reset cookie maxAge on each response
      cookie: { 
        secure: false, // Set to false to work in all environments
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (shorter for testing)
        path: '/', // Ensure cookie is sent for all paths
        sameSite: 'lax', // Make sure cookies are sent with cross-site requests
        httpOnly: true // Prevent client-side JS from reading the cookie
      },
    })
  );

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    console.log(`[AUTH] Session check: ${req.session.id}, userId: ${req.session.userId}`);
    if (req.session.userId) {
      return next();
    }
    console.log(`[AUTH] Unauthorized request to ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check if user is admin
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.session.isAdmin) {
      return next();
    }
    return res.status(403).json({ message: "Forbidden" });
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log(`[REGISTER] Processing registration request for session: ${req.session.id}`);
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create user
      const user = await storage.createUser(userData);
      
      // Set session data
      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error(`[REGISTER] Error saving session: ${err.message}`);
        } else {
          console.log(`[REGISTER] Session saved successfully. User ID ${user.id} registered. Session ID: ${req.session.id}`);
        }
      });
      
      // Track outgoing Set-Cookie header
      res.on('header', () => {
        const cookies = res.getHeader('Set-Cookie');
        console.log(`[REGISTER] Outgoing Set-Cookie header: ${cookies ? JSON.stringify(cookies) : 'none'}`);
      });
      
      return res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log(`[LOGIN] Processing login request for session: ${req.session.id}`);
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        console.log(`[LOGIN] Invalid credentials for user: ${username}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session data
      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;
      
      // Force session save to ensure it's stored
      req.session.save((err) => {
        if (err) {
          console.error(`[LOGIN] Error saving session: ${err.message}`);
        } else {
          console.log(`[LOGIN] Session saved successfully. User ID ${user.id} logged in. Session ID: ${req.session.id}`);
        }
      });
      
      // Track outgoing Set-Cookie header
      res.on('header', () => {
        const cookies = res.getHeader('Set-Cookie');
        console.log(`[LOGIN] Outgoing Set-Cookie header: ${cookies ? JSON.stringify(cookies) : 'none'}`);
      });
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    console.log(`[LOGOUT] Processing logout request for session: ${req.session.id}, userId: ${req.session.userId}`);
    
    if (!req.session.userId) {
      console.log(`[LOGOUT] No user session to destroy`);
      return res.status(200).json({ message: "Already logged out" });
    }
    
    const userId = req.session.userId;
    
    req.session.destroy((err) => {
      if (err) {
        console.error(`[LOGOUT] Error destroying session: ${err.message}`);
        return res.status(500).json({ message: "Failed to logout" });
      }
      
      // Clear the session cookie
      res.clearCookie('session');
      console.log(`[LOGOUT] Session for user ${userId} destroyed successfully`);
      
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    console.log(`[AUTH/ME] Session ID: ${req.session.id}, userId: ${req.session.userId}`);
    const userId = req.session.userId;
    if (!userId) {
      console.log(`[AUTH/ME] No userId in session, rejecting with 401`);
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }

      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // User routes
  app.get("/api/users/me/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const userWithStats = await storage.getUserWithStats(userId);
      
      if (!userWithStats) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json(userWithStats);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update user profile
  app.patch("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { username, displayName } = req.body;
      
      // Validate input
      if (username && typeof username !== 'string') {
        return res.status(400).json({ message: "Username must be a string" });
      }
      
      if (displayName && typeof displayName !== 'string') {
        return res.status(400).json({ message: "Display name must be a string" });
      }
      
      // Check if username already exists (if changing username)
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      
      const updateData: Partial<User> = {};
      if (username) updateData.username = username;
      if (displayName) updateData.displayName = displayName;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        isAdmin: updatedUser.isAdmin
      });
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // User admin routes
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      return res.status(200).json(users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin
      })));
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get all picks for a specific user (admin only)
  app.get("/api/admin/users/:id/picks", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's picks
      const picks = await storage.getPicksByUser(userId);
      
      // Enhance the picks with game and team details for better readability
      const enhancedPicks = [];
      
      for (const pick of picks) {
        const game = await storage.getGameWithTeams(pick.gameId);
        if (game) {
          const pickedTeam = game.homeTeamId === pick.pickedTeamId ? game.homeTeam : game.awayTeam;
          
          enhancedPicks.push({
            ...pick,
            game: {
              id: game.id,
              homeTeam: game.homeTeam,
              awayTeam: game.awayTeam,
              round: game.round,
              status: game.status,
              startTime: game.startTime,
              homeScore: game.homeScore,
              awayScore: game.awayScore,
              winningTeamId: game.winningTeamId
            },
            pickedTeam: pickedTeam
          });
        }
      }
      
      return res.status(200).json(enhancedPicks);
    } catch (error) {
      console.error("Error fetching user picks:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isAdmin: makeAdmin } = req.body;
      
      if (typeof makeAdmin !== 'boolean') {
        return res.status(400).json({ message: "isAdmin field must be a boolean" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, { isAdmin: makeAdmin });
      return res.status(200).json({
        id: updatedUser!.id,
        username: updatedUser!.username,
        email: updatedUser!.email,
        displayName: updatedUser!.displayName,
        isAdmin: updatedUser!.isAdmin
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Round routes
  app.get("/api/rounds", async (req, res) => {
    try {
      const rounds = await storage.getRounds();
      return res.status(200).json(rounds);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/rounds", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const roundData = insertRoundSchema.parse(req.body);
      
      // Check if round already exists with same name
      const existingRound = await storage.getRoundByName(roundData.name);
      if (existingRound) {
        return res.status(400).json({ message: "Round with this name already exists" });
      }

      const round = await storage.createRound(roundData);
      return res.status(201).json(round);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Team routes
  app.get("/api/teams", async (req, res) => {
    try {
      console.log("Fetching teams from storage");
      const teams = await storage.getTeams();
      console.log(`Retrieved ${teams.length} teams from storage`);
      return res.status(200).json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/teams/by-conference", async (req, res) => {
    try {
      console.log("Fetching teams grouped by conference");
      const teams = await storage.getTeams();
      
      // Group teams by conference
      const teamsByConference: Record<string, typeof teams> = {};
      
      teams.forEach(team => {
        const conference = team.conference || 'Uncategorized';
        if (!teamsByConference[conference]) {
          teamsByConference[conference] = [];
        }
        teamsByConference[conference].push(team);
      });
      
      // Sort teams within each conference by name
      Object.keys(teamsByConference).forEach(conference => {
        teamsByConference[conference].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      });
      
      // Get list of all conferences and sort them alphabetically
      const conferences = Object.keys(teamsByConference).sort();
      
      return res.status(200).json({
        conferences,
        teamsByConference
      });
    } catch (error) {
      console.error("Error fetching teams by conference:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/teams/:id", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      return res.status(200).json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/teams", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      
      // Check if team already exists with same name
      const existingTeam = await storage.getTeamByName(teamData.name);
      if (existingTeam) {
        return res.status(400).json({ message: "Team with this name already exists" });
      }

      const team = await storage.createTeam(teamData);
      return res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Route to update an existing team
  app.patch("/api/teams/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      
      // Validate the request data
      const updateData: Partial<Team> = {};
      
      // Only allow updating certain fields
      const { name, shortName, mascot, logoUrl, seed, record, conference } = req.body;
      
      if (name !== undefined) updateData.name = name;
      if (shortName !== undefined) updateData.shortName = shortName;
      if (mascot !== undefined) updateData.mascot = mascot;
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
      if (seed !== undefined) updateData.seed = seed;
      if (record !== undefined) updateData.record = record;
      if (conference !== undefined) updateData.conference = conference;
      
      // Check if the team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if trying to update to a name that already exists
      if (name && name !== team.name) {
        const existingTeam = await storage.getTeamByName(name);
        if (existingTeam && existingTeam.id !== teamId) {
          return res.status(400).json({ message: "Team with this name already exists" });
        }
      }
      
      // Update the team
      const updatedTeam = await storage.updateTeam(teamId, updateData);
      
      if (!updatedTeam) {
        return res.status(500).json({ message: "Failed to update team" });
      }
      
      return res.status(200).json(updatedTeam);
    } catch (error) {
      console.error("Error updating team:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Game routes
  app.get("/api/games", async (req, res) => {
    try {
      const roundId = req.query.roundId ? parseInt(req.query.roundId as string) : undefined;
      
      if (roundId) {
        const games = await storage.getGamesByRoundWithTeams(roundId);
        return res.status(200).json(games);
      }
      
      // If no round ID is provided, return upcoming games
      const upcomingGames = await storage.getUpcomingGames();
      return res.status(200).json(upcomingGames);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // New endpoint to match the client's expectations
  app.get("/api/games/round", async (req, res) => {
    try {
      const roundId = req.query.roundId ? parseInt(req.query.roundId as string) : null;
      
      if (!roundId) {
        return res.status(400).json({ message: "Round ID is required" });
      }
      
      const games = await storage.getGamesByRoundWithTeams(roundId);
      return res.status(200).json(games);
    } catch (error) {
      console.error("Error fetching games by round:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/games/live", async (req, res) => {
    try {
      const liveGames = await storage.getLiveGames();
      return res.status(200).json(liveGames);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/games/completed", async (req, res) => {
    try {
      const completedGames = await storage.getCompletedGames();
      return res.status(200).json(completedGames);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/games/round/:id", async (req, res) => {
    try {
      const roundId = parseInt(req.params.id);
      if (isNaN(roundId)) {
        return res.status(400).json({ message: "Invalid round ID" });
      }
      
      const games = await storage.getGamesByRoundWithTeams(roundId);
      
      // If user is logged in, get their picks for these games
      const userId = req.session.userId;
      if (userId) {
        for (const game of games) {
          const pick = await storage.getPickByUserAndGame(userId, game.id);
          if (pick) {
            game.userPick = pick;
          }
        }
      }
      
      return res.status(200).json(games);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGameWithTeams(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      return res.status(200).json(game);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/games", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      
      // Validate that round, home team, and away team exist
      const round = await storage.getRound(gameData.roundId);
      if (!round) {
        return res.status(400).json({ message: "Invalid round ID" });
      }
      
      const homeTeam = await storage.getTeam(gameData.homeTeamId);
      if (!homeTeam) {
        return res.status(400).json({ message: "Invalid home team ID" });
      }
      
      const awayTeam = await storage.getTeam(gameData.awayTeamId);
      if (!awayTeam) {
        return res.status(400).json({ message: "Invalid away team ID" });
      }

      const game = await storage.createGame(gameData);
      return res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/games/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      
      // Check if game exists
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Check if there are any picks for this game
      const picks = await storage.getPicksByGame(gameId);
      
      // Delete all picks for this game first
      for (const pick of picks) {
        await storage.deletePick(pick.id);
      }
      
      // Delete the game
      await storage.deleteGame(gameId);
      
      return res.status(200).json({ success: true, message: "Game deleted successfully" });
    } catch (error) {
      console.error("Error deleting game:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/games/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const gameData = updateGameSchema.parse(req.body);
      
      // Check if game exists
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Validate winning team ID if provided
      if (gameData.winningTeamId) {
        const winningTeam = await storage.getTeam(gameData.winningTeamId);
        if (!winningTeam) {
          return res.status(400).json({ message: "Invalid winning team ID" });
        }
      }

      // Update the game
      const updatedGame = await storage.updateGame(gameId, gameData);
      
      // Process picks if the game is marked as completed
      if (gameData.status === 'completed' && gameData.winningTeamId) {
        // Get the game's round to determine point value
        const gameRound = await storage.getRound(game.roundId);
        if (!gameRound) {
          console.error(`Round not found for game ${gameId}`);
        } else {
          const pointValue = gameRound.pointValue;
          
          // Get all picks for this game
          const picks = await storage.getPicksByGame(gameId);
          
          // Process each pick
          for (const pick of picks) {
            const isCorrect = pick.pickedTeamId === gameData.winningTeamId;
            const pointsEarned = isCorrect ? pointValue : 0;
            
            // Update the pick with correct/incorrect status and points
            await storage.updatePickResult(pick.id, isCorrect, pointsEarned);
            
            // Create notification for the user
            const notificationMessage = isCorrect 
              ? `You earned ${pointValue} points for correctly picking the winner of game #${gameId}!` 
              : `Your pick for game #${gameId} was incorrect.`;
            
            await storage.createNotification({
              userId: pick.userId,
              message: notificationMessage
            });
          }
          
          console.log(`Processed ${picks.length} picks for completed game ${gameId}`);
        }
      }
      
      return res.status(200).json(updatedGame);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Pick routes
  app.get("/api/picks", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const picks = await storage.getPicksByUser(userId);
      return res.status(200).json(picks);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/picks", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const gameId = req.body.gameId;
      const pickedTeamId = req.body.pickedTeamId;
      
      console.log(`[PICKS] Session ID: ${req.session.id}, Creating pick for user ${userId}, game ${gameId}, team ${pickedTeamId}`);
      console.log(`[PICKS] Session details: userId=${req.session.userId}, isAdmin=${req.session.isAdmin}`);
      
      // Validate that game and team exist
      const game = await storage.getGame(gameId);
      if (!game) {
        console.log(`Game ${gameId} not found`);
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const team = await storage.getTeam(pickedTeamId);
      if (!team) {
        console.log(`Team ${pickedTeamId} not found`);
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      // Check if game has already started
      const now = new Date();
      if (new Date(game.startTime) <= now) {
        console.log(`Game ${gameId} has already started at ${game.startTime}, current time is ${now}`);
        return res.status(400).json({ message: "Game has already started, picks are locked" });
      }
      
      // Check if the team is playing in the game
      if (game.homeTeamId !== pickedTeamId && game.awayTeamId !== pickedTeamId) {
        console.log(`Team ${pickedTeamId} is not playing in game ${gameId} (home: ${game.homeTeamId}, away: ${game.awayTeamId})`);
        return res.status(400).json({ message: "Selected team is not playing in this game" });
      }
      
      // Check if the user already has a pick for this game
      const existingPick = await storage.getPickByUserAndGame(userId, gameId);
      if (existingPick) {
        console.log(`User ${userId} already has pick ${existingPick.id} for game ${gameId}, updating...`);
        
        // Double-check that the game hasn't started (in case time passed since earlier check)
        const now = new Date();
        if (new Date(game.startTime) <= now) {
          console.log(`Game ${gameId} has already started at ${game.startTime}, current time is ${now}`);
          return res.status(400).json({ message: "Game has already started, picks are locked" });
        }
        
        // If the user already has a pick for this game, update it
        const updatedPick = await storage.updatePick(existingPick.id, { pickedTeamId });
        return res.status(200).json(updatedPick);
      }

      // Create a new pick
      const pickData = insertPickSchema.parse({ 
        userId, 
        gameId, 
        pickedTeamId
      });
      
      console.log(`Creating new pick with data:`, pickData);
      const pick = await storage.createPick(pickData);
      console.log(`Created pick with ID ${pick.id}`);
      return res.status(201).json(pick);
    } catch (error) {
      console.error("Error creating pick:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const notifications = await storage.getNotificationsByUser(userId);
      return res.status(200).json(notifications);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/notifications/unread", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const notifications = await storage.getUnreadNotificationsByUser(userId);
      return res.status(200).json(notifications);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/notifications/read/:id", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      return res.status(200).json(updatedNotification);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/notifications", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { message, userId } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      if (userId) {
        // Send to specific user
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const notification = await storage.createNotification({ userId, message });
        return res.status(201).json(notification);
      } else {
        // Send to all users
        const users = await storage.getUsers();
        const notifications = [];
        
        for (const user of users) {
          const notification = await storage.createNotification({
            userId: user.id,
            message
          });
          notifications.push(notification);
        }
        
        return res.status(201).json(notifications);
      }
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Leaderboard route
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      return res.status(200).json(leaderboard);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}

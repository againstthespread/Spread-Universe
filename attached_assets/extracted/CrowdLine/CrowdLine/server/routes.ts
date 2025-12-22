import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import session from "express-session";
import { insertUserSchema, insertGameSchema, insertPredictionSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust the reverse proxy (required for secure cookies in production)
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "nfl-prediction-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.isAdmin !== 1) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  };

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });

      req.session.userId = user.id;

      res.json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin === 1,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;

      res.json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin === 1,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin === 1,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/games", requireAuth, async (req, res) => {
    try {
      const games = await storage.getGamesWithStats(req.session.userId);
      res.json(games);
    } catch (error) {
      console.error("Get games error:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/admin/games", requireAdmin, async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      console.error("Get admin games error:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.post("/api/admin/games", requireAdmin, async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      console.error("Create game error:", error);
      res.status(400).json({ message: "Invalid game data" });
    }
  });

  app.delete("/api/admin/games/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteGame(req.params.id);
      res.json({ message: "Game deleted successfully" });
    } catch (error) {
      console.error("Delete game error:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  app.patch("/api/admin/games/:id/result", requireAdmin, async (req, res) => {
    try {
      const { updateGameResultSchema } = await import("@shared/schema");
      const resultData = updateGameResultSchema.parse(req.body);
      const updatedGame = await storage.updateGameResult(req.params.id, resultData);
      res.json(updatedGame);
    } catch (error) {
      console.error("Update game result error:", error);
      res.status(400).json({ message: "Invalid result data" });
    }
  });

  app.post("/api/predictions", requireAuth, async (req, res) => {
    try {
      const { gameId, homeScore, awayScore } = insertPredictionSchema.parse(req.body);
      const userId = req.session.userId!;

      const game = await storage.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.status !== "scheduled" || new Date(game.gameDate) <= new Date()) {
        return res.status(400).json({ message: "Predictions are locked for this game" });
      }

      const existingPrediction = await storage.getPrediction(userId, gameId);
      
      let prediction;
      if (existingPrediction) {
        prediction = await storage.updatePrediction(userId, gameId, homeScore, awayScore);
      } else {
        prediction = await storage.createPrediction({
          userId,
          gameId,
          homeScore,
          awayScore,
        });
      }

      res.json(prediction);
    } catch (error) {
      console.error("Create/update prediction error:", error);
      res.status(400).json({ message: "Invalid prediction data" });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

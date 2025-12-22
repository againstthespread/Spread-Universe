import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema, insertClickSchema } from "@shared/schema";
import { db } from "./db";
import { games } from "@shared/schema";
import { z } from "zod";

// Middleware to check if user is admin
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session.isAdminAuthenticated) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized - Admin login required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin login endpoint
  const loginSchema = z.object({
    password: z.string(),
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { password } = loginSchema.parse(req.body);
      
      // Require ADMIN_PASSWORD to be set - no default fallback for security
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        console.error("ADMIN_PASSWORD environment variable not set");
        return res.status(500).json({ message: "Server configuration error" });
      }
      
      if (password === adminPassword) {
        // Regenerate session to prevent session fixation
        req.session.regenerate((err) => {
          if (err) {
            return res.status(500).json({ message: "Login failed" });
          }
          req.session.isAdminAuthenticated = true;
          return res.status(200).json({ message: "Login successful" });
        });
      } else {
        return res.status(401).json({ message: "Invalid password" });
      }
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logout successful" });
    });
  });

  // Check authentication status
  app.get("/api/auth/status", (req, res) => {
    res.json({ isAuthenticated: !!req.session.isAdminAuthenticated });
  });
  // Seed initial game if database is empty
  async function seedInitialGame() {
    try {
      const existingGames = await storage.getAllGames();
      if (existingGames.length === 0) {
        await storage.createGame({
          name: "Gambling League",
          url: "https://gamblingleage.replit.app",
          description: "Test your luck and strategy in the ultimate gambling experience",
          isActive: true,
        });
        console.log("✅ Seeded initial game: Gambling League");
      }
    } catch (error) {
      console.error("Error seeding initial game:", error);
    }
  }

  // Seed on server start
  await seedInitialGame();

  // GET all games
  app.get("/api/games", async (req, res) => {
    try {
      const allGames = await storage.getAllGames();
      res.json(allGames);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // GET single game
  app.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGame(req.params.id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  // POST new game (protected)
  app.post("/api/games", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertGameSchema.parse(req.body);
      const newGame = await storage.createGame(validatedData);
      res.status(201).json(newGame);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid game data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  // PATCH update game (protected)
  app.patch("/api/games/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertGameSchema.parse(req.body);
      const updatedGame = await storage.updateGame(req.params.id, validatedData);
      if (!updatedGame) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(updatedGame);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid game data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  // DELETE game (protected)
  app.delete("/api/games/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteGame(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // POST reorder games (protected)
  const reorderSchema = z.object({
    gameIds: z.array(z.string()),
  });

  app.post("/api/games/reorder", requireAdmin, async (req, res) => {
    try {
      const { gameIds } = reorderSchema.parse(req.body);
      await storage.reorderGames(gameIds);
      res.status(200).json({ message: "Games reordered successfully" });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to reorder games" });
    }
  });

  // POST record click
  app.post("/api/clicks", async (req, res) => {
    try {
      const validatedData = insertClickSchema.parse(req.body);
      const click = await storage.recordClick(validatedData);
      res.status(201).json(click);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid click data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record click" });
    }
  });

  // GET analytics (protected)
  app.get("/api/analytics", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

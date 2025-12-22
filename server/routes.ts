import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, requestResetSchema, verifyCodeSchema, insertCrowdlineGameSchema, insertCrowdlinePredictionSchema, updateCrowdlineGameResultSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { createHash } from "crypto";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const MemoryStoreSession = MemoryStore(session);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "against-the-spread-secret-key",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000,
      }),
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { email, username, password } = result.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = hashPassword(password);
      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
      });

      req.session.userId = user.id;

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { email, password } = result.data;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const hashedPassword = hashPassword(password);
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to sign in" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to sign out" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Signed out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        username: z.string().min(2).optional(),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const user = await storage.updateUser(req.session.userId!, result.data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedCurrentPassword = hashPassword(result.data.currentPassword);
      if (user.password !== hashedCurrentPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedNewPassword = hashPassword(result.data.newPassword);
      await storage.updateUser(user.id, { password: hashedNewPassword });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.post("/api/auth/request-reset", async (req, res) => {
    try {
      const result = requestResetSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { email } = result.data;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.json({ message: "If the email exists, a reset code has been sent", code: "000000" });
      }

      await storage.invalidateUserCodes(user.id);

      const code = generateResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await storage.createPasswordResetCode(user.id, code, expiresAt);

      res.json({ message: "Reset code generated", code });
    } catch (error) {
      console.error("Request reset error:", error);
      res.status(500).json({ message: "Failed to generate reset code" });
    }
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const result = verifyCodeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { email, code } = result.data;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      const resetCode = await storage.getPasswordResetCode(user.id, code);
      if (!resetCode) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      res.json({ message: "Code verified", valid: true });
    } catch (error) {
      console.error("Verify code error:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        code: z.string().length(6),
        newPassword: z.string().min(6),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { email, code, newPassword } = result.data;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      const resetCode = await storage.getPasswordResetCode(user.id, code);
      if (!resetCode) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      const hashedPassword = hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });
      await storage.markCodeAsUsed(resetCode.id);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // CrowdLine Routes
  app.get("/api/crowdline/games", requireAuth, async (req, res) => {
    try {
      const games = await storage.crowdline_getGamesWithStats(req.session.userId);
      res.json(games);
    } catch (error) {
      console.error("Get games error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  app.post("/api/crowdline/predictions", requireAuth, async (req, res) => {
    try {
      const result = insertCrowdlinePredictionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { gameId, homeScore, awayScore } = result.data;
      const userId = req.session.userId!;

      const game = await storage.crowdline_getGameById(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (new Date() >= new Date(game.gameDate)) {
        return res.status(400).json({ message: "Game has already started" });
      }

      const existingPrediction = await storage.crowdline_getPrediction(userId, gameId);
      if (existingPrediction) {
        const updated = await storage.crowdline_updatePrediction(userId, gameId, homeScore, awayScore);
        return res.json(updated);
      }

      const prediction = await storage.crowdline_createPrediction({ visitorId: userId, gameId, homeScore, awayScore });
      res.json(prediction);
    } catch (error) {
      console.error("Submit prediction error:", error);
      res.status(500).json({ message: "Failed to submit prediction" });
    }
  });

  app.get("/api/crowdline/leaderboard", requireAuth, async (req, res) => {
    try {
      const leaderboard = await storage.crowdline_getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  // CrowdLine Admin Routes
  const requireCrowdlineAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.email !== "admin@crowdline.com") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  };

  app.get("/api/crowdline/admin/games", requireCrowdlineAdmin, async (req, res) => {
    try {
      const games = await storage.crowdline_getAllGames();
      res.json(games);
    } catch (error) {
      console.error("Admin get games error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  app.post("/api/crowdline/admin/games", requireCrowdlineAdmin, async (req, res) => {
    try {
      const result = insertCrowdlineGameSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const game = await storage.crowdline_createGame(result.data);
      res.json(game);
    } catch (error) {
      console.error("Admin create game error:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.delete("/api/crowdline/admin/games/:id", requireCrowdlineAdmin, async (req, res) => {
    try {
      await storage.crowdline_deleteGame(req.params.id);
      res.json({ message: "Game deleted" });
    } catch (error) {
      console.error("Admin delete game error:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  app.patch("/api/crowdline/admin/games/:id/result", requireCrowdlineAdmin, async (req, res) => {
    try {
      const result = updateCrowdlineGameResultSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const game = await storage.crowdline_updateGameResult(req.params.id, result.data);
      res.json(game);
    } catch (error) {
      console.error("Admin update result error:", error);
      res.status(500).json({ message: "Failed to update result" });
    }
  });

  return httpServer;
}

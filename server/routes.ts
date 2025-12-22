import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  registerSchema, 
  requestResetSchema, 
  verifyCodeSchema, 
  insertCrowdlineGameSchema, 
  insertCrowdlinePredictionSchema, 
  updateCrowdlineGameResultSchema,
  insertMarchmadnessTeamSchema,
  insertMarchmadnessGameSchema,
  updateMarchmadnessGameSchema,
  insertMarchmadnessPickSchema,
  insertGamblingLeagueSchema,
  insertGamblingLeagueGameSchema,
  updateGamblingLeagueGameResultSchema,
  insertGamblingLeaguePickSchema,
  type FantasyStreamGame,
  type FantasyStreamPlay,
} from "@shared/schema";
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

  // MarchMadness Routes
  // Initialize rounds on first access
  await storage.mm_initializeRounds();

  app.get("/api/marchmadness/teams", requireAuth, async (req, res) => {
    try {
      const teams = await storage.mm_getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Get teams error:", error);
      res.status(500).json({ message: "Failed to get teams" });
    }
  });

  app.get("/api/marchmadness/teams/by-conference", requireAuth, async (req, res) => {
    try {
      const teams = await storage.mm_getTeams();
      const grouped = teams.reduce((acc, team) => {
        const conf = team.conference || "Unknown";
        if (!acc[conf]) acc[conf] = [];
        acc[conf].push(team);
        return acc;
      }, {} as Record<string, typeof teams>);
      res.json(grouped);
    } catch (error) {
      console.error("Get teams by conference error:", error);
      res.status(500).json({ message: "Failed to get teams" });
    }
  });

  app.get("/api/marchmadness/rounds", requireAuth, async (req, res) => {
    try {
      const rounds = await storage.mm_getRounds();
      res.json(rounds);
    } catch (error) {
      console.error("Get rounds error:", error);
      res.status(500).json({ message: "Failed to get rounds" });
    }
  });

  app.get("/api/marchmadness/games", requireAuth, async (req, res) => {
    try {
      const { roundId } = req.query;
      if (roundId && typeof roundId === "string") {
        const games = await storage.mm_getGamesByRoundWithTeams(roundId, req.session.userId);
        return res.json(games);
      }
      const games = await storage.mm_getUpcomingGames(req.session.userId);
      res.json(games);
    } catch (error) {
      console.error("Get games error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  app.get("/api/marchmadness/games/round/:id", requireAuth, async (req, res) => {
    try {
      const games = await storage.mm_getGamesByRoundWithTeams(req.params.id, req.session.userId);
      res.json(games);
    } catch (error) {
      console.error("Get games by round error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  app.get("/api/marchmadness/games/:id", requireAuth, async (req, res) => {
    try {
      const game = await storage.mm_getGameWithTeams(req.params.id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("Get game error:", error);
      res.status(500).json({ message: "Failed to get game" });
    }
  });

  app.post("/api/marchmadness/picks", requireAuth, async (req, res) => {
    try {
      const result = insertMarchmadnessPickSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { gameId, pickedTeamId } = result.data;
      const userId = req.session.userId!;

      const game = await storage.mm_getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (new Date() >= new Date(game.startTime)) {
        return res.status(400).json({ message: "Game has already started" });
      }

      const existingPick = await storage.mm_getPickByUserAndGame(userId, gameId);
      if (existingPick) {
        const updated = await storage.mm_updatePick(existingPick.id, pickedTeamId);
        return res.json(updated);
      }

      const pick = await storage.mm_createPick({ visitorId: userId, gameId, pickedTeamId });
      res.json(pick);
    } catch (error) {
      console.error("Submit pick error:", error);
      res.status(500).json({ message: "Failed to submit pick" });
    }
  });

  app.get("/api/marchmadness/picks/me", requireAuth, async (req, res) => {
    try {
      const picks = await storage.mm_getPicksByUser(req.session.userId!);
      res.json(picks);
    } catch (error) {
      console.error("Get picks error:", error);
      res.status(500).json({ message: "Failed to get picks" });
    }
  });

  app.get("/api/marchmadness/leaderboard", requireAuth, async (req, res) => {
    try {
      const leaderboard = await storage.mm_getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  app.get("/api/marchmadness/users/me/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.mm_getUserStats(req.session.userId!);
      res.json(stats || { totalPoints: 0, correctPicks: 0, totalPicks: 0, winPercentage: 0, rank: 0, roundStats: [] });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // MarchMadness Admin Routes
  const requireMarchmadnessAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || (user.email !== "admin@crowdline.com" && user.email !== "admin@marchmadness.com")) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  };

  app.get("/api/marchmadness/admin/teams", requireMarchmadnessAdmin, async (req, res) => {
    try {
      const teams = await storage.mm_getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Admin get teams error:", error);
      res.status(500).json({ message: "Failed to get teams" });
    }
  });

  app.post("/api/marchmadness/admin/teams", requireMarchmadnessAdmin, async (req, res) => {
    try {
      const result = insertMarchmadnessTeamSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const team = await storage.mm_createTeam(result.data);
      res.json(team);
    } catch (error) {
      console.error("Admin create team error:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.patch("/api/marchmadness/admin/teams/:id", requireMarchmadnessAdmin, async (req, res) => {
    try {
      const team = await storage.mm_updateTeam(req.params.id, req.body);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Admin update team error:", error);
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.get("/api/marchmadness/admin/rounds", requireMarchmadnessAdmin, async (req, res) => {
    try {
      const rounds = await storage.mm_getRounds();
      res.json(rounds);
    } catch (error) {
      console.error("Admin get rounds error:", error);
      res.status(500).json({ message: "Failed to get rounds" });
    }
  });

  app.get("/api/marchmadness/admin/games", requireMarchmadnessAdmin, async (req, res) => {
    try {
      const { roundId } = req.query;
      if (roundId && typeof roundId === "string") {
        const games = await storage.mm_getGamesByRoundWithTeams(roundId);
        return res.json(games);
      }
      const games = await storage.mm_getUpcomingGames();
      res.json(games);
    } catch (error) {
      console.error("Admin get games error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  app.post("/api/marchmadness/admin/games", requireMarchmadnessAdmin, async (req, res) => {
    try {
      const result = insertMarchmadnessGameSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const game = await storage.mm_createGame(result.data);
      res.json(game);
    } catch (error) {
      console.error("Admin create game error:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.patch("/api/marchmadness/admin/games/:id", requireMarchmadnessAdmin, async (req, res) => {
    try {
      const result = updateMarchmadnessGameSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const game = await storage.mm_updateGame(req.params.id, result.data);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("Admin update game error:", error);
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  app.delete("/api/marchmadness/admin/games/:id", requireMarchmadnessAdmin, async (req, res) => {
    try {
      await storage.mm_deleteGame(req.params.id);
      res.json({ message: "Game deleted" });
    } catch (error) {
      console.error("Admin delete game error:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // FantasyStream Routes (Mock data - no database needed)
  const getMockFantasyStreamGames = (): FantasyStreamGame[] => {
    return [
      { id: "game1", homeTeam: "KC", awayTeam: "BUF", homeScore: 24, awayScore: 21, quarter: "Q3", timeRemaining: "8:45", status: "in" },
      { id: "game2", homeTeam: "SF", awayTeam: "DAL", homeScore: 17, awayScore: 14, quarter: "Q2", timeRemaining: "2:30", status: "in" },
      { id: "game3", homeTeam: "PHI", awayTeam: "NYG", homeScore: 28, awayScore: 10, quarter: "Q4", timeRemaining: "4:15", status: "in" },
      { id: "game4", homeTeam: "MIA", awayTeam: "NE", homeScore: 0, awayScore: 0, quarter: "PRE", timeRemaining: "1:00 PM", status: "pre" },
      { id: "game5", homeTeam: "DEN", awayTeam: "LV", homeScore: 31, awayScore: 24, quarter: "FINAL", timeRemaining: "", status: "post" },
    ];
  };

  const getMockFantasyStreamPlays = (gameId?: string): FantasyStreamPlay[] => {
    const allPlays: FantasyStreamPlay[] = [
      { id: "play1", gameId: "game1", team: "KC", quarter: "Q3", timeRemaining: "8:45", down: 1, distance: 10, yardLine: "KC 25", playType: "pass", description: "Pass complete to Travis Kelce", playerName: "P. Mahomes", receiverName: "T. Kelce", yards: 15, timestamp: new Date().toISOString(), isScoring: false, isLive: true },
      { id: "play2", gameId: "game1", team: "KC", quarter: "Q3", timeRemaining: "8:12", down: 1, distance: 10, yardLine: "KC 40", playType: "rush", description: "Isiah Pacheco up the middle", playerName: "I. Pacheco", yards: 8, timestamp: new Date(Date.now() - 60000).toISOString(), isScoring: false, isLive: false },
      { id: "play3", gameId: "game2", team: "SF", quarter: "Q2", timeRemaining: "2:30", down: 3, distance: 7, yardLine: "DAL 35", playType: "pass", description: "Pass incomplete intended for Deebo Samuel", playerName: "B. Purdy", receiverName: "D. Samuel", yards: 0, timestamp: new Date(Date.now() - 120000).toISOString(), isScoring: false, isLive: true },
      { id: "play4", gameId: "game1", team: "BUF", quarter: "Q2", timeRemaining: "14:22", down: 1, distance: 10, yardLine: "BUF 30", playType: "touchdown", description: "Josh Allen rushes for a TOUCHDOWN!", playerName: "J. Allen", yards: 12, timestamp: new Date(Date.now() - 180000).toISOString(), isScoring: true, isLive: false },
      { id: "play5", gameId: "game3", team: "PHI", quarter: "Q4", timeRemaining: "4:15", down: 2, distance: 5, yardLine: "NYG 45", playType: "pass", description: "Pass complete to A.J. Brown down the sideline", playerName: "J. Hurts", receiverName: "A.J. Brown", yards: 32, timestamp: new Date(Date.now() - 240000).toISOString(), isScoring: false, isLive: true },
      { id: "play6", gameId: "game2", team: "DAL", quarter: "Q2", timeRemaining: "5:00", down: 4, distance: 1, yardLine: "SF 15", playType: "fieldgoal", description: "Field goal is GOOD from 32 yards", playerName: "B. Aubrey", yards: 0, timestamp: new Date(Date.now() - 300000).toISOString(), isScoring: true, isLive: false },
      { id: "play7", gameId: "game3", team: "NYG", quarter: "Q3", timeRemaining: "10:30", down: 2, distance: 8, yardLine: "PHI 42", playType: "turnover", description: "INTERCEPTION by Darius Slay!", playerName: "D. Jones", yards: 0, timestamp: new Date(Date.now() - 360000).toISOString(), isScoring: false, isLive: false },
      { id: "play8", gameId: "game1", team: "KC", quarter: "Q1", timeRemaining: "5:30", down: 1, distance: 10, yardLine: "BUF 8", playType: "touchdown", description: "Patrick Mahomes to Travis Kelce for the TOUCHDOWN!", playerName: "P. Mahomes", receiverName: "T. Kelce", yards: 8, timestamp: new Date(Date.now() - 420000).toISOString(), isScoring: true, isLive: false },
    ];
    
    if (gameId) {
      return allPlays.filter(play => play.gameId === gameId);
    }
    return allPlays;
  };

  app.get("/api/fantasystream/games", requireAuth, async (_req, res) => {
    try {
      const games = getMockFantasyStreamGames();
      res.json(games);
    } catch (error) {
      console.error("FantasyStream get games error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  app.get("/api/fantasystream/games/:id/plays", requireAuth, async (req, res) => {
    try {
      const plays = getMockFantasyStreamPlays(req.params.id);
      res.json(plays);
    } catch (error) {
      console.error("FantasyStream get plays error:", error);
      res.status(500).json({ message: "Failed to get plays" });
    }
  });

  app.get("/api/fantasystream/plays", requireAuth, async (req, res) => {
    try {
      const { type } = req.query;
      let plays = getMockFantasyStreamPlays();
      
      if (type && type !== "all") {
        if (type === "scoring") {
          plays = plays.filter(p => p.isScoring);
        } else if (type === "touchdowns") {
          plays = plays.filter(p => p.playType === "touchdown");
        } else if (type === "big-plays") {
          plays = plays.filter(p => (p.yards || 0) >= 20);
        }
      }
      
      res.json(plays);
    } catch (error) {
      console.error("FantasyStream get plays error:", error);
      res.status(500).json({ message: "Failed to get plays" });
    }
  });

  // ========================
  // Gambling League Routes
  // ========================

  app.get("/api/gambling-league/leagues", async (_req, res) => {
    try {
      const leagues = await storage.gl_getLeagues();
      const openLeagues = leagues.filter(l => l.status === 'open');
      res.json(openLeagues);
    } catch (error) {
      console.error("GL get leagues error:", error);
      res.status(500).json({ message: "Failed to get leagues" });
    }
  });

  app.post("/api/gambling-league/leagues", requireAuth, async (req, res) => {
    try {
      const result = insertGamblingLeagueSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }
      const league = await storage.gl_createLeague(result.data, req.session.userId!);
      res.json(league);
    } catch (error) {
      console.error("GL create league error:", error);
      res.status(500).json({ message: "Failed to create league" });
    }
  });

  app.get("/api/gambling-league/leagues/:id", requireAuth, async (req, res) => {
    try {
      const league = await storage.gl_getLeague(req.params.id);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }
      const members = await storage.gl_getLeagueMembers(league.id);
      res.json({ ...league, members });
    } catch (error) {
      console.error("GL get league error:", error);
      res.status(500).json({ message: "Failed to get league" });
    }
  });

  app.post("/api/gambling-league/leagues/:id/join", requireAuth, async (req, res) => {
    try {
      const league = await storage.gl_getLeague(req.params.id);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }
      if (league.status !== 'open') {
        return res.status(400).json({ message: "League is not accepting new members" });
      }
      const members = await storage.gl_getLeagueMembers(league.id);
      if (members.some(m => m.userId === req.session.userId)) {
        return res.status(400).json({ message: "Already a member of this league" });
      }
      if (members.length >= league.capacity) {
        return res.status(400).json({ message: "League is full" });
      }
      const member = await storage.gl_joinLeague(league.id, req.session.userId!);
      res.json(member);
    } catch (error) {
      console.error("GL join league error:", error);
      res.status(500).json({ message: "Failed to join league" });
    }
  });

  app.get("/api/gambling-league/leagues/:id/standings", requireAuth, async (req, res) => {
    try {
      const standings = await storage.gl_getLeagueStandings(req.params.id);
      res.json(standings);
    } catch (error) {
      console.error("GL get standings error:", error);
      res.status(500).json({ message: "Failed to get standings" });
    }
  });

  app.get("/api/gambling-league/leagues/:id/matchups", requireAuth, async (req, res) => {
    try {
      const { week } = req.query;
      let matchups;
      if (week) {
        matchups = await storage.gl_getMatchupsByLeagueWeek(req.params.id, parseInt(week as string));
      } else {
        matchups = await storage.gl_getMatchups(req.params.id);
      }
      res.json(matchups);
    } catch (error) {
      console.error("GL get matchups error:", error);
      res.status(500).json({ message: "Failed to get matchups" });
    }
  });

  app.get("/api/gambling-league/games", async (req, res) => {
    try {
      const { week } = req.query;
      let games;
      if (week) {
        games = await storage.gl_getGamesByWeek(parseInt(week as string));
      } else {
        games = await storage.gl_getGames();
      }
      res.json(games);
    } catch (error) {
      console.error("GL get games error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  app.get("/api/gambling-league/weeks/:week/games/:leagueId", requireAuth, async (req, res) => {
    try {
      const games = await storage.gl_getGamesWithPicks(
        parseInt(req.params.week),
        req.session.userId!,
        req.params.leagueId
      );
      res.json(games);
    } catch (error) {
      console.error("GL get games with picks error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  app.get("/api/gambling-league/my-leagues", requireAuth, async (req, res) => {
    try {
      const leagues = await storage.gl_getUserLeagues(req.session.userId!);
      res.json(leagues);
    } catch (error) {
      console.error("GL get my leagues error:", error);
      res.status(500).json({ message: "Failed to get leagues" });
    }
  });

  app.get("/api/gambling-league/picks/:leagueId", requireAuth, async (req, res) => {
    try {
      const picks = await storage.gl_getPicks(req.params.leagueId, req.session.userId!);
      res.json(picks);
    } catch (error) {
      console.error("GL get picks error:", error);
      res.status(500).json({ message: "Failed to get picks" });
    }
  });

  app.post("/api/gambling-league/picks", requireAuth, async (req, res) => {
    try {
      const picksSchema = z.object({
        picks: z.array(z.object({
          gameId: z.string(),
          leagueId: z.string(),
          week: z.number(),
          pickedTeam: z.enum(['home', 'away']).nullable(),
          note: z.string().nullable().optional(),
        })),
      });
      
      const result = picksSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }
      
      const savedPicks = [];
      for (const pickData of result.data.picks) {
        if (pickData.pickedTeam === null) {
          await storage.gl_deletePick(req.session.userId!, pickData.leagueId, pickData.gameId);
          continue;
        }
        
        const existingPicks = await storage.gl_getPicksByUserLeagueWeek(
          req.session.userId!,
          pickData.leagueId,
          pickData.week
        );
        const existingPick = existingPicks.find(p => p.gameId === pickData.gameId);
        
        if (existingPick) {
          const updated = await storage.gl_updatePick(existingPick.id, {
            pickedTeam: pickData.pickedTeam,
            note: pickData.note || null,
          });
          if (updated) savedPicks.push(updated);
        } else {
          const newPick = await storage.gl_createPick({
            gameId: pickData.gameId,
            leagueId: pickData.leagueId,
            week: pickData.week,
            pickedTeam: pickData.pickedTeam,
            note: pickData.note || null,
          }, req.session.userId!);
          savedPicks.push(newPick);
        }
      }
      
      res.json(savedPicks);
    } catch (error) {
      console.error("GL submit picks error:", error);
      res.status(500).json({ message: "Failed to submit picks" });
    }
  });

  // Admin routes for games
  app.post("/api/gambling-league/admin/games", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const result = insertGamblingLeagueGameSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }
      
      const game = await storage.gl_createGame(result.data);
      res.json(game);
    } catch (error) {
      console.error("GL create game error:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.patch("/api/gambling-league/admin/games/:id/result", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const result = updateGamblingLeagueGameResultSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }
      
      const game = await storage.gl_updateGameResult(req.params.id, result.data);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("GL update game result error:", error);
      res.status(500).json({ message: "Failed to update game result" });
    }
  });

  app.patch("/api/gambling-league/admin/leagues/:id/week", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { week } = req.body;
      if (typeof week !== 'number' || week < 1) {
        return res.status(400).json({ message: "Invalid week" });
      }
      
      const league = await storage.gl_updateLeagueWeek(req.params.id, week);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }
      res.json(league);
    } catch (error) {
      console.error("GL update league week error:", error);
      res.status(500).json({ message: "Failed to update league week" });
    }
  });

  return httpServer;
}

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
  insertPostseasonGameSchema,
  insertPostseasonPickSchema,
  updatePostseasonGameResultSchema,
  insertGolfGolferSchema,
  updateGolfGolferSchema,
  insertGolfTournamentSchema,
  insertGolfLeagueSchema,
  insertGolfScoreSchema,
  type FantasyStreamGame,
  type FantasyStreamPlay,
} from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { createHash } from "crypto";
import { fetchTournamentField, fetchTournamentScores } from "./sportsdata";

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

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
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

  app.post("/api/admin/init", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.username !== "pdeluc99") {
        return res.status(403).json({ message: "Not authorized to initialize admin" });
      }

      const updatedUser = await storage.setUserAdmin(user.id, true);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to set admin status" });
      }

      const { password: _, ...safeUser } = updatedUser;
      res.json({ user: safeUser });
    } catch (error) {
      console.error("Admin init error:", error);
      res.status(500).json({ message: "Failed to initialize admin" });
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
  app.get("/api/crowdline/admin/games", requireAdmin, async (req, res) => {
    try {
      const games = await storage.crowdline_getAllGames();
      res.json(games);
    } catch (error) {
      console.error("Admin get games error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  app.post("/api/crowdline/admin/games", requireAdmin, async (req, res) => {
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

  app.delete("/api/crowdline/admin/games/:id", requireAdmin, async (req, res) => {
    try {
      await storage.crowdline_deleteGame(req.params.id);
      res.json({ message: "Game deleted" });
    } catch (error) {
      console.error("Admin delete game error:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  app.patch("/api/crowdline/admin/games/:id/result", requireAdmin, async (req, res) => {
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

  // Golf Fantasy - seed golfers on startup
  await storage.golf_seedGolfersIfEmpty();

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
  app.get("/api/marchmadness/admin/teams", requireAdmin, async (req, res) => {
    try {
      const teams = await storage.mm_getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Admin get teams error:", error);
      res.status(500).json({ message: "Failed to get teams" });
    }
  });

  app.post("/api/marchmadness/admin/teams", requireAdmin, async (req, res) => {
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

  app.patch("/api/marchmadness/admin/teams/:id", requireAdmin, async (req, res) => {
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

  app.get("/api/marchmadness/admin/rounds", requireAdmin, async (req, res) => {
    try {
      const rounds = await storage.mm_getRounds();
      res.json(rounds);
    } catch (error) {
      console.error("Admin get rounds error:", error);
      res.status(500).json({ message: "Failed to get rounds" });
    }
  });

  app.get("/api/marchmadness/admin/games", requireAdmin, async (req, res) => {
    try {
      const { roundId } = req.query;
      if (roundId && typeof roundId === "string") {
        const games = await storage.mm_getGamesByRoundWithTeams(roundId);
        return res.json(games);
      }
      const games = await storage.mm_getAllGames();
      res.json(games);
    } catch (error) {
      console.error("Admin get games error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  app.post("/api/marchmadness/admin/games", requireAdmin, async (req, res) => {
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

  app.patch("/api/marchmadness/admin/games/:id", requireAdmin, async (req, res) => {
    try {
      const result = updateMarchmadnessGameSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const game = await storage.mm_updateGame(req.params.id, result.data);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.status === "final" && game.winningTeamId) {
        const round = await storage.mm_getRound(game.roundId);
        if (round) {
          await storage.mm_scorePicksForGame(game.id, game.winningTeamId, round.pointValue);
        }
      }

      res.json(game);
    } catch (error) {
      console.error("Admin update game error:", error);
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  app.delete("/api/marchmadness/admin/games/:id", requireAdmin, async (req, res) => {
    try {
      await storage.mm_deleteGame(req.params.id);
      res.json({ message: "Game deleted" });
    } catch (error) {
      console.error("Admin delete game error:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // FantasyStream Routes - Real ESPN NFL API integration
  const ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
  const ESPN_SUMMARY_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary";

  async function fetchESPNGames(): Promise<FantasyStreamGame[]> {
    try {
      const response = await fetch(ESPN_SCOREBOARD_URL);
      if (!response.ok) {
        console.error("ESPN scoreboard API error:", response.status);
        return [];
      }
      const data = await response.json();
      
      if (!data.events || !Array.isArray(data.events)) {
        return [];
      }

      return data.events.map((event: any) => {
        const competition = event.competitions?.[0];
        if (!competition) return null;

        const homeTeamData = competition.competitors?.find((c: any) => c.homeAway === "home");
        const awayTeamData = competition.competitors?.find((c: any) => c.homeAway === "away");
        
        if (!homeTeamData || !awayTeamData) return null;

        const statusType = competition.status?.type?.name || event.status?.type?.name;
        let status: 'pre' | 'in' | 'post' = 'pre';
        if (statusType === "STATUS_IN_PROGRESS" || statusType === "STATUS_HALFTIME") {
          status = 'in';
        } else if (statusType === "STATUS_FINAL" || statusType === "STATUS_FINAL_OVERTIME") {
          status = 'post';
        }

        const period = competition.status?.period || event.status?.period || 0;
        let quarter = "PRE";
        if (status === 'in') {
          if (period === 1) quarter = "1st";
          else if (period === 2) quarter = "2nd";
          else if (period === 3) quarter = "3rd";
          else if (period === 4) quarter = "4th";
          else if (period > 4) quarter = "OT";
          if (statusType === "STATUS_HALFTIME") quarter = "HALF";
        } else if (status === 'post') {
          quarter = "Final";
        }

        const displayClock = competition.status?.displayClock || event.status?.displayClock || "--";
        let timeRemaining = displayClock;
        if (status === 'pre') {
          const gameDate = new Date(event.date);
          timeRemaining = gameDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        } else if (status === 'post') {
          timeRemaining = "--";
        }

        return {
          id: event.id,
          homeTeam: homeTeamData.team?.abbreviation || homeTeamData.team?.shortDisplayName || "HOME",
          awayTeam: awayTeamData.team?.abbreviation || awayTeamData.team?.shortDisplayName || "AWAY",
          homeScore: parseInt(homeTeamData.score) || 0,
          awayScore: parseInt(awayTeamData.score) || 0,
          quarter,
          timeRemaining,
          status,
        };
      }).filter((g: any): g is FantasyStreamGame => g !== null);
    } catch (error) {
      console.error("Error fetching ESPN games:", error);
      return [];
    }
  }

  function mapESPNPlayType(playType: string, text: string): FantasyStreamPlay['playType'] {
    const lowerType = (playType || "").toLowerCase();
    const lowerText = (text || "").toLowerCase();
    
    // Scoring plays
    if (lowerText.includes("touchdown") || lowerType.includes("touchdown")) return "touchdown";
    if (lowerText.includes("field goal") || lowerType.includes("field goal")) return "fieldgoal";
    if (lowerText.includes("extra point") || lowerType.includes("extra point")) return "kick";
    if (lowerText.includes("two-point conversion") || lowerType.includes("two-point conversion") || lowerText.includes("2pt conversion")) return "pass";
    if (lowerText.includes("safety")) return "safety";

    // Non-scoring special plays
    if (lowerText.includes("interception") || lowerText.includes("fumble") || lowerType.includes("turnover")) return "turnover";
    if (lowerType.includes("punt") || lowerText.includes("punts")) return "punt";
    if (lowerType.includes("kickoff") || lowerType.includes("kick")) return "kick";
    if (lowerType.includes("penalty") || lowerText.includes("penalty")) return "rush";
    
    // Standard plays
    if (lowerType.includes("rush") || lowerText.includes("up the middle") || lowerText.includes("left end") || lowerText.includes("right end") || lowerText.includes("left guard") || lowerText.includes("right guard") || lowerText.includes("left tackle") || lowerText.includes("right tackle")) return "rush";
    if (lowerType.includes("pass") || lowerText.includes("pass") || lowerText.includes("complete") || lowerText.includes("incomplete") || lowerText.includes("sacked")) return "pass";
    
    // Default fallback instead of null or assuming pass
    return "rush"; 
  }

  async function fetchESPNPlaysForGame(gameId: string, isLive: boolean): Promise<FantasyStreamPlay[]> {
    try {
      const response = await fetch(`${ESPN_SUMMARY_URL}?event=${gameId}`);
      if (!response.ok) {
        console.error("ESPN summary API error:", response.status, "for game:", gameId);
        return [];
      }
      const data = await response.json();
      
      const playsMap = new Map<string, FantasyStreamPlay>();
      
      // Helper to add play to map (deduplicates by ID)
      const addPlay = (play: any, teamAbbrev: string, playIndex: number) => {
        const playId = play.id || `${gameId}-${playIndex}`;
        if (playsMap.has(playId)) return;
        
        const playType = mapESPNPlayType(play.type?.text || "", play.text || "");
        const isScoringPlay = playType === "touchdown" || playType === "fieldgoal" || playType === "safety";
        
        const playData: FantasyStreamPlay = {
          id: playId,
          gameId,
          team: teamAbbrev,
          quarter: play.period?.number ? `${play.period.number === 1 ? "1st" : play.period.number === 2 ? "2nd" : play.period.number === 3 ? "3rd" : play.period.number === 4 ? "4th" : "OT"}` : "1st",
          timeRemaining: play.clock?.displayValue || "--",
          down: play.start?.down,
          distance: play.start?.distance,
          yardLine: play.start?.yardLine ? `${play.start.team?.abbreviation || teamAbbrev} ${play.start.yardLine}` : undefined,
          playType,
          description: play.text || "Play",
          yards: play.statYardage || play.yards || 0,
          timestamp: play.wallclock || new Date(Date.now() - playIndex * 30000).toISOString(),
          isScoring: isScoringPlay,
          isLive: isLive && playIndex < 5,
        };

        playsMap.set(playId, playData);
      };
      
      // Source 1: ESPN's drives.previous (can be array OR object keyed by drive IDs)
      let previousDrives = data.drives?.previous || [];
      if (previousDrives && !Array.isArray(previousDrives)) {
        previousDrives = Object.values(previousDrives);
      }
      
      const drives = [...(previousDrives as any[])];
      const currentDrive = data.drives?.current;
      
      if (currentDrive) {
        drives.push(currentDrive);
      }

      let playIndex = 0;
      for (const drive of drives) {
        const drivePlays = drive.plays || [];
        const teamAbbrev = drive.team?.abbreviation || "TEAM";
        
        for (const play of drivePlays) {
          addPlay(play, teamAbbrev, playIndex++);
        }
      }
      
      // Source 2: scoringPlays array (if available)
      const scoringPlays = data.scoringPlays || [];
      for (const scoringPlay of scoringPlays) {
        const teamAbbrev = scoringPlay.team?.abbreviation || "TEAM";
        addPlay(scoringPlay, teamAbbrev, playIndex++);
      }
      
      // Source 3: lastPlay (if available and not already included)
      if (data.lastPlay) {
        const teamAbbrev = data.lastPlay.team?.abbreviation || "TEAM";
        addPlay(data.lastPlay, teamAbbrev, playIndex++);
      }

      const plays = Array.from(playsMap.values());
      return plays.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error("Error fetching ESPN plays for game:", gameId, error);
      return [];
    }
  }

  app.get("/api/fantasystream/games", async (_req, res) => {
    try {
      const games = await fetchESPNGames();
      res.json(games);
    } catch (error) {
      console.error("FantasyStream get games error:", error);
      res.json([]);
    }
  });

  app.get("/api/fantasystream/games/:id/plays", async (req, res) => {
    try {
      const games = await fetchESPNGames();
      const game = games.find(g => g.id === req.params.id);
      const isLive = game?.status === 'in';
      const plays = await fetchESPNPlaysForGame(req.params.id, isLive);
      res.json(plays);
    } catch (error) {
      console.error("FantasyStream get plays error:", error);
      res.json([]);
    }
  });

  app.get("/api/fantasystream/plays", async (req, res) => {
    try {
      const { type } = req.query;
      const games = await fetchESPNGames();
      
      const inProgressGames = games.filter(g => g.status === 'in' || g.status === 'post');
      
      let allPlays: FantasyStreamPlay[] = [];
      
      if (inProgressGames.length > 0) {
        // Sort to get most recent games first if there are many
        const sortedGames = [...inProgressGames].sort((a, b) => {
          if (a.status === 'in' && b.status !== 'in') return -1;
          if (a.status !== 'in' && b.status === 'in') return 1;
          return 0;
        });

        // Fetch plays for up to 5 games (prioritizing live ones)
        const targetGames = sortedGames.slice(0, 5);
        const playPromises = targetGames.map(game => fetchESPNPlaysForGame(game.id, game.status === 'in'));
        const playArrays = await Promise.all(playPromises);
        allPlays = playArrays.flat();
      } else {
        const recentGames = games.slice(0, 3);
        const playPromises = recentGames.map(game => fetchESPNPlaysForGame(game.id, false));
        const playArrays = await Promise.all(playPromises);
        allPlays = playArrays.flat();
      }
      
      allPlays.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      if (type && type !== "all") {
        if (type === "scoring") {
          allPlays = allPlays.filter(p => p.isScoring);
        } else if (type === "touchdowns") {
          allPlays = allPlays.filter(p => p.playType === "touchdown");
        } else if (type === "big-plays") {
          allPlays = allPlays.filter(p => (p.yards || 0) >= 20);
        }
      }
      
      res.json(allPlays.slice(0, 50));
    } catch (error) {
      console.error("FantasyStream get plays error:", error);
      res.json([]);
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
  app.post("/api/gambling-league/admin/games", requireAdmin, async (req, res) => {
    try {
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

  app.patch("/api/gambling-league/admin/games/:id/result", requireAdmin, async (req, res) => {
    try {
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

  app.patch("/api/gambling-league/admin/leagues/:id/week", requireAdmin, async (req, res) => {
    try {
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

  // PostseasonATS Routes
  app.get("/api/postseason/games", requireAuth, async (req, res) => {
    try {
      const { round } = req.query;
      if (round && typeof round === "string") {
        const games = await storage.ps_getGamesByRound(round);
        return res.json(games);
      }
      const games = await storage.ps_getGamesWithPicks(req.session.userId);
      res.json(games);
    } catch (error) {
      console.error("PS get games error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  app.get("/api/postseason/games/:id", requireAuth, async (req, res) => {
    try {
      const game = await storage.ps_getGame(req.params.id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      const userPick = await storage.ps_getPickByUserAndGame(req.session.userId!, req.params.id);
      res.json({ ...game, userPick: userPick || null });
    } catch (error) {
      console.error("PS get game error:", error);
      res.status(500).json({ message: "Failed to get game" });
    }
  });

  app.post("/api/postseason/picks", requireAuth, async (req, res) => {
    try {
      const result = insertPostseasonPickSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { gameId, selectedTeam } = result.data;
      const userId = req.session.userId!;

      const game = await storage.ps_getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const deadline = game.pickDeadline || game.gameDate;
      if (new Date() >= new Date(deadline)) {
        return res.status(400).json({ message: "Pick deadline has passed" });
      }

      const existingPick = await storage.ps_getPickByUserAndGame(userId, gameId);
      if (existingPick) {
        const updated = await storage.ps_updatePick(existingPick.id, selectedTeam);
        return res.json(updated);
      }

      const pick = await storage.ps_createPick({ ...result.data, userId });
      res.json(pick);
    } catch (error) {
      console.error("PS submit pick error:", error);
      res.status(500).json({ message: "Failed to submit pick" });
    }
  });

  app.get("/api/postseason/picks/me", requireAuth, async (req, res) => {
    try {
      const picks = await storage.ps_getPicksByUser(req.session.userId!);
      res.json(picks);
    } catch (error) {
      console.error("PS get picks error:", error);
      res.status(500).json({ message: "Failed to get picks" });
    }
  });

  app.get("/api/postseason/picks/history", requireAuth, async (req, res) => {
    try {
      const history = await storage.ps_getPickHistory(req.session.userId!);
      res.json(history);
    } catch (error) {
      console.error("PS get pick history error:", error);
      res.status(500).json({ message: "Failed to get pick history" });
    }
  });

  app.get("/api/postseason/leaderboard", requireAuth, async (req, res) => {
    try {
      const leaderboard = await storage.ps_getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("PS get leaderboard error:", error);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  app.get("/api/postseason/stats/me", requireAuth, async (req, res) => {
    try {
      const stats = await storage.ps_getUserStats(req.session.userId!);
      res.json(stats || { totalPoints: 0, correctPicks: 0, totalPicks: 0, winPercentage: 0, rank: 0, roundStats: [] });
    } catch (error) {
      console.error("PS get user stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // PostseasonATS Admin Routes
  app.get("/api/postseason/admin/games", requireAdmin, async (req, res) => {
    try {
      const games = await storage.ps_getGames();
      res.json(games);
    } catch (error) {
      console.error("PS admin get games error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  app.post("/api/postseason/admin/games", requireAdmin, async (req, res) => {
    try {
      const result = insertPostseasonGameSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const game = await storage.ps_createGame(result.data);
      res.json(game);
    } catch (error) {
      console.error("PS admin create game error:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.patch("/api/postseason/admin/games/:id", requireAdmin, async (req, res) => {
    try {
      const game = await storage.ps_updateGame(req.params.id, req.body);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("PS admin update game error:", error);
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  app.delete("/api/postseason/admin/games/:id", requireAdmin, async (req, res) => {
    try {
      await storage.ps_deleteGame(req.params.id);
      res.json({ message: "Game deleted" });
    } catch (error) {
      console.error("PS admin delete game error:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  app.patch("/api/postseason/admin/games/:id/result", requireAdmin, async (req, res) => {
    try {
      const result = updatePostseasonGameResultSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const game = await storage.ps_updateGameResult(req.params.id, result.data.homeScore, result.data.awayScore);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("PS admin update result error:", error);
      res.status(500).json({ message: "Failed to update result" });
    }
  });

  // Football-Weather Routes (fetches real NFL data from ESPN + weather from OpenWeather)
  app.get("/api/football-weather/games", async (req, res) => {
    try {
      const { NFL_STADIUMS, TEAM_STADIUMS } = await import("@shared/schema");
      
      type FootballWeatherStadiumLocal = {
        name: string;
        city: string;
        state: string;
        isDome: boolean;
        lat: number;
        lon: number;
      };
      
      type FootballWeatherTeamLocal = {
        id: string;
        name: string;
        abbreviation: string;
        displayName: string;
        shortDisplayName: string;
        logo?: string;
      };
      
      type FootballWeatherWeatherLocal = {
        temp: number;
        feelsLike: number;
        humidity: number;
        windSpeed: number;
        windGust?: number;
        description: string;
        icon: string;
        precipitation: number;
        rain?: number;
        snow?: number;
      };
      
      type FootballWeatherGameLocal = {
        id: string;
        homeTeam: FootballWeatherTeamLocal;
        awayTeam: FootballWeatherTeamLocal;
        stadium: FootballWeatherStadiumLocal;
        gameTime: string;
        weather: FootballWeatherWeatherLocal | null;
        fantasyImplication: "ideal_passing" | "rb_weather" | "dome_game" | "neutral";
      };
      
      type FootballWeatherGamesResponseLocal = {
        games: FootballWeatherGameLocal[];
        lastUpdated: string;
        weekNumber: number;
      };

      const getStadiumForTeam = (abbrev: string) => {
        const stadiumName = TEAM_STADIUMS[abbrev];
        return stadiumName ? NFL_STADIUMS[stadiumName] : NFL_STADIUMS["MetLife Stadium"];
      };

      const getFantasyImplication = (weather: FootballWeatherWeatherLocal | null, isDome: boolean): "ideal_passing" | "rb_weather" | "dome_game" | "neutral" => {
        if (isDome) return "dome_game";
        if (!weather) return "neutral";
        if (weather.windSpeed > 15 || weather.precipitation > 30 || weather.temp < 35) return "rb_weather";
        if (weather.temp >= 55 && weather.temp <= 80 && weather.windSpeed < 10 && weather.precipitation < 10) return "ideal_passing";
        return "neutral";
      };

      const fetchWeather = async (lat: number, lon: number): Promise<FootballWeatherWeatherLocal | null> => {
        try {
          const apiKey = process.env.OPENWEATHER_API_KEY;
          if (!apiKey) {
            console.log("OpenWeather API key not configured");
            return null;
          }

          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
          const response = await fetch(url);
          
          if (!response.ok) {
            console.error(`Weather API error: ${response.status} ${response.statusText}`);
            return null;
          }

          const data = await response.json();
          
          const pop = data.pop ?? (data.rain ? 80 : data.snow ? 80 : 0);
          
          return {
            temp: Math.round(data.main?.temp ?? 70),
            feelsLike: Math.round(data.main?.feels_like ?? 70),
            humidity: data.main?.humidity ?? 50,
            windSpeed: Math.round(data.wind?.speed ?? 0),
            windGust: data.wind?.gust ? Math.round(data.wind.gust) : undefined,
            description: data.weather?.[0]?.description ?? "Unknown",
            icon: data.weather?.[0]?.icon ?? "01d",
            precipitation: pop,
            rain: data.rain?.["1h"] ?? data.rain?.["3h"] ?? undefined,
            snow: data.snow?.["1h"] ?? data.snow?.["3h"] ?? undefined,
          };
        } catch (error) {
          console.error("Weather fetch error:", error);
          return null;
        }
      };

      console.log("Fetching NFL games from ESPN...");
      const espnResponse = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard");
      
      if (!espnResponse.ok) {
        console.error(`ESPN API error: ${espnResponse.status} ${espnResponse.statusText}`);
        return res.json({
          games: [],
          lastUpdated: new Date().toISOString(),
          weekNumber: 0,
        });
      }

      const espnData = await espnResponse.json();
      console.log(`ESPN returned ${espnData.events?.length ?? 0} games`);

      const weekNumber = espnData.week?.number ?? espnData.leagues?.[0]?.calendar?.[0]?.value ?? 0;

      const games: FootballWeatherGameLocal[] = [];

      for (const event of espnData.events ?? []) {
        try {
          const competition = event.competitions?.[0];
          if (!competition) continue;

          const homeCompetitor = competition.competitors?.find((c: any) => c.homeAway === "home");
          const awayCompetitor = competition.competitors?.find((c: any) => c.homeAway === "away");

          if (!homeCompetitor || !awayCompetitor) continue;

          const homeTeam = {
            id: homeCompetitor.team?.id ?? "",
            name: homeCompetitor.team?.name ?? "",
            abbreviation: homeCompetitor.team?.abbreviation ?? "",
            displayName: homeCompetitor.team?.displayName ?? "",
            shortDisplayName: homeCompetitor.team?.shortDisplayName ?? homeCompetitor.team?.name ?? "",
            logo: homeCompetitor.team?.logo ?? `https://a.espncdn.com/i/teamlogos/nfl/500/${(homeCompetitor.team?.abbreviation ?? "").toLowerCase()}.png`,
          };

          const awayTeam = {
            id: awayCompetitor.team?.id ?? "",
            name: awayCompetitor.team?.name ?? "",
            abbreviation: awayCompetitor.team?.abbreviation ?? "",
            displayName: awayCompetitor.team?.displayName ?? "",
            shortDisplayName: awayCompetitor.team?.shortDisplayName ?? awayCompetitor.team?.name ?? "",
            logo: awayCompetitor.team?.logo ?? `https://a.espncdn.com/i/teamlogos/nfl/500/${(awayCompetitor.team?.abbreviation ?? "").toLowerCase()}.png`,
          };

          const stadium = getStadiumForTeam(homeTeam.abbreviation);
          const gameTime = event.date ?? new Date().toISOString();

          let weather: FootballWeatherWeatherLocal | null = null;
          if (!stadium.isDome) {
            weather = await fetchWeather(stadium.lat, stadium.lon);
          }

          const fantasyImplication = getFantasyImplication(weather, stadium.isDome);

          games.push({
            id: event.id ?? `game-${games.length + 1}`,
            homeTeam,
            awayTeam,
            stadium,
            gameTime,
            weather,
            fantasyImplication,
          });
        } catch (gameError) {
          console.error("Error processing game:", gameError);
        }
      }

      console.log(`Processed ${games.length} games with weather data`);

      const response: FootballWeatherGamesResponseLocal = {
        games,
        lastUpdated: new Date().toISOString(),
        weekNumber: typeof weekNumber === 'number' ? weekNumber : parseInt(weekNumber) || 0,
      };

      res.json(response);
    } catch (error) {
      console.error("Football-Weather get games error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  // ─── Golf Fantasy Routes ─────────────────────────────────────────

  // Golfers
  app.get("/api/golf/golfers", requireAuth, async (req, res) => {
    try {
      const { tournamentId, excludeTournamentId } = req.query as Record<string, string>;
      const golfers = await storage.golf_getGolfers({
        tournamentId: tournamentId || undefined,
        excludeTournamentId: excludeTournamentId || undefined,
      });
      res.json(golfers);
    } catch (error) {
      console.error("Golf get golfers error:", error);
      res.status(500).json({ message: "Failed to get golfers" });
    }
  });

  app.get("/api/golf/golfers/:id", requireAuth, async (req, res) => {
    try {
      const golfer = await storage.golf_getGolfer(req.params.id);
      if (!golfer) return res.status(404).json({ message: "Golfer not found" });
      res.json(golfer);
    } catch (error) {
      res.status(500).json({ message: "Failed to get golfer" });
    }
  });

  app.post("/api/golf/golfers", requireAdmin, async (req, res) => {
    try {
      const result = insertGolfGolferSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
      const golfer = await storage.golf_createGolfer(result.data);
      res.status(201).json(golfer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create golfer" });
    }
  });

  app.put("/api/golf/golfers/:id", requireAdmin, async (req, res) => {
    try {
      const result = updateGolfGolferSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
      const golfer = await storage.golf_updateGolfer(req.params.id, result.data);
      if (!golfer) return res.status(404).json({ message: "Golfer not found" });
      res.json(golfer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update golfer" });
    }
  });

  // Tournaments
  app.get("/api/golf/tournaments", requireAuth, async (req, res) => {
    try {
      const tournaments = await storage.golf_getTournaments();
      const withGolfers = await Promise.all(
        tournaments.map(async (t) => {
          const golfers = await storage.golf_getTournamentGolfers(t.id);
          return { ...t, golfers };
        })
      );
      res.json(withGolfers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tournaments" });
    }
  });

  app.get("/api/golf/tournaments/:id", requireAuth, async (req, res) => {
    try {
      const tournament = await storage.golf_getTournament(req.params.id);
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });
      const golfers = await storage.golf_getTournamentGolfers(req.params.id);
      res.json({ ...tournament, golfers });
    } catch (error) {
      res.status(500).json({ message: "Failed to get tournament" });
    }
  });

  app.post("/api/golf/tournaments", requireAdmin, async (req, res) => {
    try {
      const result = insertGolfTournamentSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
      const tournament = await storage.golf_createTournament(result.data);
      res.status(201).json(tournament);
    } catch (error) {
      res.status(500).json({ message: "Failed to create tournament" });
    }
  });

  app.patch("/api/golf/tournaments/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!["upcoming", "active", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const tournament = await storage.golf_updateTournamentStatus(req.params.id, status);
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });
      res.json(tournament);
    } catch (error) {
      res.status(500).json({ message: "Failed to update tournament status" });
    }
  });

  app.patch("/api/golf/tournaments/:id", requireAdmin, async (req, res) => {
    try {
      const { status, sdioTournamentId } = req.body;
      const updates: Partial<{ status: string; sdioTournamentId: number | null }> = {};

      if (status !== undefined) {
        if (!["upcoming", "active", "completed"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }
        updates.status = status;
      }

      if (sdioTournamentId !== undefined) {
        updates.sdioTournamentId = sdioTournamentId === null ? null : Number(sdioTournamentId);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No updatable fields provided" });
      }

      const tournament = await storage.golf_updateTournament(req.params.id, updates);
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });
      return res.json(tournament);
    } catch (error) {
      res.status(500).json({ message: "Failed to update tournament" });
    }
  });

  app.get("/api/golf/tournaments/:id/golfers", requireAuth, async (req, res) => {
    try {
      const golfers = await storage.golf_getTournamentGolfers(req.params.id);
      res.json(golfers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tournament golfers" });
    }
  });

  app.post("/api/golf/tournaments/:id/golfers", requireAdmin, async (req, res) => {
    try {
      const { golferId } = req.body;
      if (!golferId) return res.status(400).json({ message: "golferId required" });
      await storage.golf_addGolferToTournament(req.params.id, golferId);
      res.status(201).json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to add golfer to tournament" });
    }
  });

  app.delete("/api/golf/tournaments/:id/golfers/:golferId", requireAdmin, async (req, res) => {
    try {
      await storage.golf_removeGolferFromTournament(req.params.id, req.params.golferId);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove golfer from tournament" });
    }
  });

  // Scores
  app.get("/api/golf/tournaments/:id/scores", requireAuth, async (req, res) => {
    try {
      const scores = await storage.golf_getScores(req.params.id);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scores" });
    }
  });

  app.post("/api/golf/tournaments/:id/scores", requireAdmin, async (req, res) => {
    try {
      const result = insertGolfScoreSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
      const score = await storage.golf_upsertScore(req.params.id, result.data.golferId, result.data.round, result.data.score);
      res.json(score);
    } catch (error) {
      res.status(500).json({ message: "Failed to upsert score" });
    }
  });

  // SportsDataIO sync routes
  app.post("/api/golf/tournaments/:id/sync-field", requireAdmin, async (req, res) => {
    try {
      const tournament = await storage.golf_getTournament(req.params.id);
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });
      if (!tournament.sdioTournamentId) {
        return res.status(400).json({ message: "Tournament does not have a SportsDataIO tournament ID configured" });
      }

      const players = await fetchTournamentField(tournament.sdioTournamentId);

      let created = 0;
      const activePlayers = players.filter(p => !p.IsWithdrawn);
      const beforeGolfers = await storage.golf_getTournamentGolfers(req.params.id);
      const beforeIds = new Set(beforeGolfers.map(g => g.id));

      for (const player of activePlayers) {
        let golfer = await storage.golf_findGolferBySdioId(player.PlayerID);

        if (!golfer) {
          golfer = await storage.golf_createGolfer({
            worldRank: player.WorldGolfRank ?? 999,
            firstName: player.FirstName,
            lastName: player.LastName,
            country: player.Country ?? "",
            photoUrl: null,
            sdioPlayerId: player.PlayerID,
          });
          created++;
        } else {
          await storage.golf_updateGolfer(golfer.id, {
            worldRank: player.WorldGolfRank ?? golfer.worldRank,
            firstName: player.FirstName,
            lastName: player.LastName,
            country: player.Country ?? golfer.country,
            sdioPlayerId: player.PlayerID,
          });
        }

        await storage.golf_addGolferToTournament(req.params.id, golfer.id);
      }

      const afterGolfers = await storage.golf_getTournamentGolfers(req.params.id);
      const added = afterGolfers.filter(g => !beforeIds.has(g.id)).length;

      res.json({ ok: true, playersInField: activePlayers.length, created, added });
    } catch (error) {
      console.error("Golf sync-field error:", error);
      const msg = error instanceof Error ? error.message : "Failed to sync field";
      res.status(500).json({ message: msg });
    }
  });

  app.post("/api/golf/tournaments/:id/sync-scores", requireAdmin, async (req, res) => {
    try {
      const tournament = await storage.golf_getTournament(req.params.id);
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });
      if (!tournament.sdioTournamentId) {
        return res.status(400).json({ message: "Tournament does not have a SportsDataIO tournament ID configured" });
      }

      const players = await fetchTournamentScores(tournament.sdioTournamentId);

      let updated = 0;
      let skipped = 0;

      for (const player of players) {
        const golfer = await storage.golf_findGolferBySdioId(player.PlayerID);
        if (!golfer) { skipped++; continue; }

        const rounds = player.Rounds ?? [];
        for (const round of rounds) {
          if (round.Score === null || round.Score === undefined) continue;
          await storage.golf_upsertScore(req.params.id, golfer.id, round.RoundNumber, round.Score);
          updated++;
        }
      }

      res.json({ ok: true, scoresUpdated: updated, playersSkipped: skipped });
    } catch (error) {
      console.error("Golf sync-scores error:", error);
      const msg = error instanceof Error ? error.message : "Failed to sync scores";
      res.status(500).json({ message: msg });
    }
  });

  // Also allow updating sdioTournamentId via PATCH /api/golf/tournaments/:id
  // (handled in the existing PATCH route below - we'll expand it)

  // Leagues - IMPORTANT: /join must come BEFORE /:id
  app.post("/api/golf/leagues/join", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { joinCode } = req.body;
      if (!joinCode) return res.status(400).json({ message: "joinCode required" });
      const league = await storage.golf_getLeagueByJoinCode(joinCode);
      if (!league) return res.status(404).json({ message: "League not found" });

      const isMember = await storage.golf_isLeagueMember(league.id, userId);
      if (isMember) return res.status(400).json({ message: "Already a member" });

      const members = await storage.golf_getLeagueMembers(league.id);
      if (members.length >= league.maxSize) return res.status(400).json({ message: "League is full" });

      if (league.draftStatus !== "pending") return res.status(400).json({ message: "Draft has already started" });

      await storage.golf_addLeagueMember(league.id, userId);
      res.json({ leagueId: league.id });
    } catch (error) {
      console.error("Golf join league error:", error);
      res.status(500).json({ message: "Failed to join league" });
    }
  });

  app.get("/api/golf/leagues", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const leagues = await storage.golf_getUserLeagues(userId);
      res.json(leagues);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leagues" });
    }
  });

  app.post("/api/golf/leagues", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const result = insertGolfLeagueSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
      const league = await storage.golf_createLeague(result.data, userId);
      res.status(201).json(league);
    } catch (error) {
      console.error("Golf create league error:", error);
      res.status(500).json({ message: "Failed to create league" });
    }
  });

  app.get("/api/golf/leagues/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const detail = await storage.golf_getLeagueDetail(req.params.id);
      if (!detail) return res.status(404).json({ message: "League not found" });

      const isMember = await storage.golf_isLeagueMember(req.params.id, userId);
      if (!isMember) return res.status(403).json({ message: "Not a member of this league" });

      res.json(detail);
    } catch (error) {
      res.status(500).json({ message: "Failed to get league" });
    }
  });

  app.post("/api/golf/leagues/:id/invite", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const league = await storage.golf_getLeague(req.params.id);
      if (!league) return res.status(404).json({ message: "League not found" });
      if (league.commissionerId !== userId) return res.status(403).json({ message: "Only commissioner can invite" });

      const { username } = req.body;
      if (!username) return res.status(400).json({ message: "username required" });

      const invitedUser = await storage.getUserByUsername(username);
      if (!invitedUser) return res.status(404).json({ message: "User not found" });

      const isMember = await storage.golf_isLeagueMember(req.params.id, invitedUser.id);
      if (isMember) return res.status(400).json({ message: "User already in league" });

      const members = await storage.golf_getLeagueMembers(req.params.id);
      if (members.length >= league.maxSize) return res.status(400).json({ message: "League is full" });

      if (league.draftStatus !== "pending") return res.status(400).json({ message: "Draft has already started" });

      await storage.golf_addLeagueMember(req.params.id, invitedUser.id);
      res.json({ ok: true, username: invitedUser.username });
    } catch (error) {
      console.error("Golf invite error:", error);
      res.status(500).json({ message: "Failed to invite user" });
    }
  });

  app.patch("/api/golf/leagues/:id/draft-order", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const league = await storage.golf_getLeague(req.params.id);
      if (!league) return res.status(404).json({ message: "League not found" });
      if (league.commissionerId !== userId) return res.status(403).json({ message: "Only commissioner can set draft order" });

      const { draftOrder } = req.body;
      if (!Array.isArray(draftOrder)) return res.status(400).json({ message: "draftOrder must be an array" });

      const members = await storage.golf_getLeagueMembers(req.params.id);
      const memberIds = new Set(members.map(m => m.userId));
      if (draftOrder.length !== memberIds.size) {
        return res.status(400).json({ message: "Draft order must include exactly all league members" });
      }
      const hasDuplicates = new Set(draftOrder).size !== draftOrder.length;
      if (hasDuplicates) {
        return res.status(400).json({ message: "Draft order contains duplicate entries" });
      }
      const hasInvalidMembers = draftOrder.some((id: string) => !memberIds.has(id));
      if (hasInvalidMembers) {
        return res.status(400).json({ message: "Draft order contains non-member user IDs" });
      }

      await storage.golf_updateLeague(req.params.id, { draftOrder });
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update draft order" });
    }
  });

  app.post("/api/golf/leagues/:id/start-draft", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const league = await storage.golf_getLeague(req.params.id);
      if (!league) return res.status(404).json({ message: "League not found" });
      if (league.commissionerId !== userId) return res.status(403).json({ message: "Only commissioner can start draft" });
      if (league.draftStatus !== "pending") return res.status(400).json({ message: "Draft already started" });

      if (league.draftStartTime && new Date() < new Date(league.draftStartTime)) {
        return res.status(400).json({ message: "Draft start time has not passed yet" });
      }

      const members = await storage.golf_getLeagueMembers(req.params.id);
      if (members.length < 2) return res.status(400).json({ message: "Need at least 2 members to start draft" });

      const draftOrder = league.draftOrder ?? [];
      if (draftOrder.length !== members.length) {
        const memberIds = members.map(m => m.userId);
        const shuffled = memberIds.sort(() => Math.random() - 0.5);
        await storage.golf_updateLeague(req.params.id, { draftOrder: shuffled, draftStatus: "active" });
      } else {
        await storage.golf_updateLeague(req.params.id, { draftStatus: "active" });
      }

      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to start draft" });
    }
  });

  app.post("/api/golf/leagues/:id/draft/start", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const league = await storage.golf_getLeague(req.params.id);
      if (!league) return res.status(404).json({ message: "League not found" });
      if (league.commissionerId !== userId) return res.status(403).json({ message: "Only commissioner can start draft" });
      if (league.draftStatus !== "pending") return res.status(400).json({ message: "Draft already started" });

      if (league.draftStartTime && new Date() < new Date(league.draftStartTime)) {
        return res.status(400).json({ message: "Draft start time has not passed yet" });
      }

      const members = await storage.golf_getLeagueMembers(req.params.id);
      if (members.length < 2) return res.status(400).json({ message: "Need at least 2 members to start draft" });

      const draftOrder = league.draftOrder ?? [];
      if (draftOrder.length !== members.length) {
        const memberIds = members.map(m => m.userId);
        const shuffled = memberIds.sort(() => Math.random() - 0.5);
        await storage.golf_updateLeague(req.params.id, { draftOrder: shuffled, draftStatus: "active" });
      } else {
        await storage.golf_updateLeague(req.params.id, { draftStatus: "active" });
      }

      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to start draft" });
    }
  });

  // Draft
  app.get("/api/golf/leagues/:id/draft", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const isMember = await storage.golf_isLeagueMember(req.params.id, userId);
      if (!isMember) return res.status(403).json({ message: "Not a member of this league" });

      const state = await storage.golf_getDraftState(req.params.id);
      if (!state) return res.status(404).json({ message: "League not found" });
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Failed to get draft state" });
    }
  });

  app.post("/api/golf/leagues/:id/draft/pick", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { golferId } = req.body;
      if (!golferId) return res.status(400).json({ message: "golferId required" });

      const isMember = await storage.golf_isLeagueMember(req.params.id, userId);
      if (!isMember) return res.status(403).json({ message: "Not a member of this league" });

      const league = await storage.golf_getLeague(req.params.id);
      if (!league) return res.status(404).json({ message: "League not found" });

      const tournamentGolfers = await storage.golf_getTournamentGolfers(league.tournamentId);
      const inField = tournamentGolfers.some(g => g.id === golferId);
      if (!inField) return res.status(400).json({ message: "Golfer is not in the tournament field" });

      const pick = await storage.golf_submitDraftPick(req.params.id, userId, golferId);
      res.status(201).json(pick);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to submit pick";
      const knownClientErrors = ["Not your turn", "Draft is not active", "Golfer already drafted"];
      const status = knownClientErrors.includes(msg) ? 400 : 500;
      res.status(status).json({ message: msg });
    }
  });

  // Standings
  app.get("/api/golf/leagues/:id/standings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const isMember = await storage.golf_isLeagueMember(req.params.id, userId);
      if (!isMember) return res.status(403).json({ message: "Not a member of this league" });

      const standings = await storage.golf_getLeagueStandings(req.params.id);
      res.json(standings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get standings" });
    }
  });

  // Admin: all leagues
  app.get("/api/golf/admin/leagues", requireAdmin, async (req, res) => {
    try {
      const allLeagues = await storage.golf_getAllLeagues();
      res.json(allLeagues);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leagues" });
    }
  });

  return httpServer;
}

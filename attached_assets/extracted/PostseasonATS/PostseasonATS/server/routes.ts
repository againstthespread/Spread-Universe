// Reference: javascript_auth_all_persistance blueprint
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { insertGameSchema, insertPickSchema, updateGameResultSchema, ROUND_POINTS } from "@shared/schema";
import { notifyNewGames, notifyGameResults } from "./notifications";
import { randomBytes } from "crypto";

// Middleware to check if user is authenticated
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Unauthorized");
  }
  next();
}

// Middleware to check if user is admin
function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).send("Forbidden - Admin access required");
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // ==================== GAME ROUTES ====================
  
  // Get all games with user's picks (for authenticated users)
  app.get("/api/games/with-picks", requireAuth, async (req, res) => {
    try {
      const games = await storage.getAllGames();
      const userPicks = await storage.getUserPicks(req.user!.id);
      
      const gamesWithPicks = games.map(game => {
        const userPick = userPicks.find(pick => pick.gameId === game.id);
        return {
          ...game,
          userPick: userPick || undefined,
        };
      });
      
      res.json(gamesWithPicks);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get all games (admin only)
  app.get("/api/games", requireAdmin, async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create a new game (admin only)
  app.post("/api/games", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(validatedData);
      
      // Send notification to all users about new game
      const allUsers = await storage.getAllUsers();
      await notifyNewGames(allUsers, [game]);
      
      res.status(201).json(game);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Update a game (admin only)
  app.put("/api/games/:id", requireAdmin, async (req, res) => {
    try {
      const game = await storage.updateGame(req.params.id, req.body);
      res.json(game);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Delete a game (admin only)
  app.delete("/api/games/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteGame(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Submit game results and score all picks (admin only)
  app.post("/api/games/results", requireAdmin, async (req, res) => {
    try {
      const validatedData = updateGameResultSchema.parse(req.body);
      const game = await storage.updateGameResult(validatedData);
      
      console.log(`[Scoring] Game ${game.id} completed. Winner: ${game.winner}, Round: ${game.round}`);
      
      // Score all picks for this game by updating them directly in the database
      const gamePicks = await storage.getGamePicks(game.id);
      
      console.log(`[Scoring] Found ${gamePicks.length} picks to score for game ${game.id}`);
      
      // Import db and picks table for direct update
      const { db } = await import("./db");
      const { picks } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      for (const pick of gamePicks) {
        const isCorrect = pick.selectedTeam === game.winner;
        const pointsEarned = isCorrect ? ROUND_POINTS[game.round] : 0;
        
        console.log(`[Scoring] Scoring pick ${pick.id}: ${pick.selectedTeam} vs ${game.winner} = ${isCorrect ? 'CORRECT' : 'INCORRECT'} (${pointsEarned} pts)`);
        
        await db
          .update(picks)
          .set({ isCorrect, pointsEarned })
          .where(eq(picks.id, pick.id));
      }
      
      console.log(`[Scoring] Completed scoring ${gamePicks.length} picks`);
      
      // Send notification to all users about game results
      const allUsers = await storage.getAllUsers();
      await notifyGameResults(allUsers, game);
      
      res.json(game);
    } catch (error: any) {
      console.error(`[Scoring] Error:`, error);
      res.status(400).send(error.message);
    }
  });

  // ==================== PICK ROUTES ====================

  // Submit or update a pick
  app.post("/api/picks", requireAuth, async (req, res) => {
    try {
      const pickData = {
        userId: req.user!.id,
        gameId: req.body.gameId,
        selectedTeam: req.body.selectedTeam,
      };
      
      const validatedData = insertPickSchema.parse(pickData);
      
      // Check if pick deadline has passed
      const game = await storage.getGame(validatedData.gameId);
      if (!game) {
        return res.status(404).send("Game not found");
      }
      
      // Use pickDeadline if set, otherwise fall back to gameDate
      const deadline = game.pickDeadline || game.gameDate;
      if (new Date(deadline) < new Date()) {
        return res.status(400).send("Cannot change pick after deadline has passed");
      }
      
      const pick = await storage.createOrUpdatePick(validatedData);
      res.json(pick);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ==================== PICK HISTORY ROUTE ====================

  // Get all picks for completed games with user and game details
  app.get("/api/pick-history", requireAuth, async (req, res) => {
    try {
      const pickHistory = await storage.getAllPicksWithDetails();
      res.json(pickHistory);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ==================== LEADERBOARD ROUTE ====================

  app.get("/api/leaderboard", requireAuth, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allGames = await storage.getAllGames();
      const allPicks = await storage.getAllPicks();
      
      // Calculate remaining points from incomplete games (same for all users)
      const pendingGames = allGames.filter(g => !g.isComplete);
      const remaining = pendingGames.reduce((sum, game) => sum + ROUND_POINTS[game.round], 0);
      
      const leaderboard = allUsers.map(user => {
        const userPicks = allPicks.filter(pick => pick.userId === user.id);
        const completedPicks = userPicks.filter(pick => pick.isCorrect !== null);
        const correctPicks = userPicks.filter(pick => pick.isCorrect === true);
        
        const totalPoints = userPicks.reduce((sum, pick) => sum + (pick.pointsEarned || 0), 0);
        
        // Max possible = current points + remaining points from incomplete games
        const maxPossible = totalPoints + remaining;
        
        return {
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
          totalPoints,
          correctPicks: correctPicks.length,
          totalPicks: completedPicks.length,
          maxPossible,
          remaining,
        };
      });
      
      // Sort by total points descending
      leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
      
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ==================== USER STATS ROUTE ====================

  app.get("/api/stats/:userId", requireAuth, async (req, res) => {
    try {
      const userId = req.params.userId;
      
      // Users can only view their own stats unless they're admin
      if (userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).send("Forbidden - Can only view your own stats");
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }

      const allGames = await storage.getAllGames();
      const userPicks = await storage.getUserPicks(userId);
      
      // Calculate overall stats
      const totalPicks = userPicks.length;
      const completedPicks = userPicks.filter(p => p.isCorrect !== null);
      const correctPicks = completedPicks.filter(p => p.isCorrect === true);
      const incorrectPicks = completedPicks.filter(p => p.isCorrect === false);
      const pendingPicks = userPicks.filter(p => p.isCorrect === null);
      const totalPoints = userPicks.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
      const accuracy = completedPicks.length > 0 ? (correctPicks.length / completedPicks.length) * 100 : 0;

      // Stats by round
      const byRound = ["WILD_CARD", "DIVISIONAL", "CONFERENCE", "SUPER_BOWL"].map(round => {
        const roundGames = allGames.filter(g => g.round === round);
        const roundPicks = userPicks.filter(p => {
          const game = roundGames.find(g => g.id === p.gameId);
          return !!game;
        });
        
        const total = roundPicks.length;
        const completed = roundPicks.filter(p => p.isCorrect !== null);
        const correct = roundPicks.filter(p => p.isCorrect === true);
        const incorrect = roundPicks.filter(p => p.isCorrect === false);
        const pending = roundPicks.filter(p => p.isCorrect === null);
        const points = roundPicks.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
        const roundAccuracy = completed.length > 0 ? (correct.length / completed.length) * 100 : 0;

        return {
          round,
          total,
          correct: correct.length,
          incorrect: incorrect.length,
          pending: pending.length,
          accuracy: roundAccuracy,
          points,
        };
      }).filter(r => r.total > 0);

      // Current streak
      const sortedCompletedPicks = completedPicks
        .map(p => {
          const game = allGames.find(g => g.id === p.gameId);
          return { ...p, gameDate: game?.gameDate };
        })
        .filter(p => p.gameDate)
        .sort((a, b) => new Date(b.gameDate!).getTime() - new Date(a.gameDate!).getTime());

      let currentStreak = { type: null as "win" | "loss" | null, count: 0 };
      if (sortedCompletedPicks.length > 0) {
        const firstResult = sortedCompletedPicks[0].isCorrect;
        currentStreak.type = firstResult ? "win" : "loss";
        currentStreak.count = 1;

        for (let i = 1; i < sortedCompletedPicks.length; i++) {
          if (sortedCompletedPicks[i].isCorrect === firstResult) {
            currentStreak.count++;
          } else {
            break;
          }
        }
      }

      // Longest streaks
      let longestWinStreak = 0;
      let longestLossStreak = 0;
      let currentWinStreak = 0;
      let currentLossStreak = 0;

      sortedCompletedPicks.reverse().forEach(pick => {
        if (pick.isCorrect) {
          currentWinStreak++;
          currentLossStreak = 0;
          longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
        } else {
          currentLossStreak++;
          currentWinStreak = 0;
          longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
        }
      });

      // Best and worst rounds
      const roundsWithCompletedPicks = byRound.filter(r => r.correct + r.incorrect > 0);
      const bestRound = roundsWithCompletedPicks.length > 0
        ? roundsWithCompletedPicks.reduce((best, r) => r.accuracy > best.accuracy ? r : best)
        : null;
      const worstRound = roundsWithCompletedPicks.length > 1
        ? roundsWithCompletedPicks.reduce((worst, r) => r.accuracy < worst.accuracy ? r : worst)
        : null;

      // Favorite team (most picked)
      const teamCounts = new Map<string, { picks: number; correct: number; total: number }>();
      completedPicks.forEach(pick => {
        const existing = teamCounts.get(pick.selectedTeam) || { picks: 0, correct: 0, total: 0 };
        existing.picks++;
        existing.total++;
        if (pick.isCorrect) existing.correct++;
        teamCounts.set(pick.selectedTeam, existing);
      });

      // Add pending picks
      pendingPicks.forEach(pick => {
        const existing = teamCounts.get(pick.selectedTeam) || { picks: 0, correct: 0, total: 0 };
        existing.picks++;
        teamCounts.set(pick.selectedTeam, existing);
      });

      let favoriteTeam = null;
      if (teamCounts.size > 0) {
        const [team, stats] = Array.from(teamCounts.entries())
          .reduce((max, curr) => curr[1].picks > max[1].picks ? curr : max);
        favoriteTeam = {
          team,
          picks: stats.picks,
          accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        };
      }

      // Recent form (last 5 completed games)
      const recentForm = {
        lastFiveGames: sortedCompletedPicks.slice(0, 5).map(pick => {
          const game = allGames.find(g => g.id === pick.gameId)!;
          return {
            gameId: game.id,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            selectedTeam: pick.selectedTeam,
            isCorrect: pick.isCorrect,
            pointsEarned: pick.pointsEarned || 0,
            round: game.round,
          };
        }),
      };

      const stats = {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        totalPicks,
        correctPicks: correctPicks.length,
        incorrectPicks: incorrectPicks.length,
        pendingPicks: pendingPicks.length,
        totalPoints,
        accuracy,
        byRound,
        currentStreak,
        longestWinStreak,
        longestLossStreak,
        bestRound: bestRound ? { round: bestRound.round, accuracy: bestRound.accuracy } : null,
        worstRound: worstRound && worstRound.round !== bestRound?.round ? { round: worstRound.round, accuracy: worstRound.accuracy } : null,
        favoriteTeam,
        recentForm,
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ==================== ADMIN STATS ROUTE ====================

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const games = await storage.getAllGames();
      const users = await storage.getAllUsers();
      const picks = await storage.getAllPicks();
      
      const stats = {
        totalGames: games.length,
        completedGames: games.filter(g => g.isComplete).length,
        pendingGames: games.filter(g => !g.isComplete).length,
        totalUsers: users.length,
        totalPicks: picks.length,
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ==================== ADMIN USER MANAGEMENT ROUTES ====================

  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/admin/reset-password", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).send("User ID is required");
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      // Generate a random temporary password
      const tempPassword = randomBytes(8).toString("hex"); // 16 character password
      const hashedPassword = await hashPassword(tempPassword);
      
      // Update user with new password and set requirePasswordChange flag
      await storage.updateUserPassword(userId, hashedPassword, true);
      
      // Return the temporary password (admin will communicate this to user)
      res.json({ 
        success: true, 
        temporaryPassword: tempPassword,
        username: user.username 
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ==================== CHANGE PASSWORD ROUTE ====================

  app.post("/api/change-password", requireAuth, async (req, res) => {
    try {
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).send("Password must be at least 6 characters");
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user password and clear requirePasswordChange flag
      await storage.updateUserPassword(req.user!.id, hashedPassword, false);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

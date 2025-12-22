// Database integration: blueprint:javascript_database
import { 
  users, 
  passwordResetCodes, 
  crowdlineGames, 
  crowdlinePredictions,
  type User, 
  type InsertUser, 
  type PasswordResetCode,
  type CrowdlineGame,
  type InsertCrowdlineGame,
  type CrowdlinePrediction,
  type CrowdlineGameWithStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, sql, desc } from "drizzle-orm";

export type CrowdlineLeaderboardEntry = {
  visitorId: string;
  username: string;
  totalPoints: number;
  gamesPredicted: number;
  correctWinners: number;
  exactScores: number;
  averagePointDiff: number;
};

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<Omit<User, "id">>): Promise<User | undefined>;
  
  createPasswordResetCode(userId: string, code: string, expiresAt: Date): Promise<PasswordResetCode>;
  getPasswordResetCode(userId: string, code: string): Promise<PasswordResetCode | undefined>;
  markCodeAsUsed(codeId: string): Promise<void>;
  invalidateUserCodes(userId: string): Promise<void>;
  
  crowdline_getAllGames(): Promise<CrowdlineGame[]>;
  crowdline_getGameById(id: string): Promise<CrowdlineGame | undefined>;
  crowdline_createGame(game: InsertCrowdlineGame): Promise<CrowdlineGame>;
  crowdline_deleteGame(id: string): Promise<void>;
  crowdline_updateGameResult(id: string, data: { actualHomeScore: number; actualAwayScore: number; vegasSpread?: number; vegasOverUnder?: number; status?: string }): Promise<CrowdlineGame>;
  crowdline_getGamesWithStats(userId?: string): Promise<CrowdlineGameWithStats[]>;
  crowdline_getPrediction(userId: string, gameId: string): Promise<CrowdlinePrediction | undefined>;
  crowdline_createPrediction(prediction: { visitorId: string; gameId: string; homeScore: number; awayScore: number }): Promise<CrowdlinePrediction>;
  crowdline_updatePrediction(userId: string, gameId: string, homeScore: number, awayScore: number): Promise<CrowdlinePrediction>;
  crowdline_getLeaderboard(): Promise<CrowdlineLeaderboardEntry[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, email: insertUser.email.toLowerCase() })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<Omit<User, "id">>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async createPasswordResetCode(userId: string, code: string, expiresAt: Date): Promise<PasswordResetCode> {
    const [resetCode] = await db
      .insert(passwordResetCodes)
      .values({ userId, code, expiresAt, used: false })
      .returning();
    return resetCode;
  }

  async getPasswordResetCode(userId: string, code: string): Promise<PasswordResetCode | undefined> {
    const [resetCode] = await db
      .select()
      .from(passwordResetCodes)
      .where(
        and(
          eq(passwordResetCodes.userId, userId),
          eq(passwordResetCodes.code, code),
          eq(passwordResetCodes.used, false),
          gt(passwordResetCodes.expiresAt, new Date())
        )
      );
    return resetCode || undefined;
  }

  async markCodeAsUsed(codeId: string): Promise<void> {
    await db
      .update(passwordResetCodes)
      .set({ used: true })
      .where(eq(passwordResetCodes.id, codeId));
  }

  async invalidateUserCodes(userId: string): Promise<void> {
    await db
      .update(passwordResetCodes)
      .set({ used: true })
      .where(eq(passwordResetCodes.userId, userId));
  }

  async crowdline_getAllGames(): Promise<CrowdlineGame[]> {
    return await db.select().from(crowdlineGames).orderBy(crowdlineGames.gameDate);
  }

  async crowdline_getGameById(id: string): Promise<CrowdlineGame | undefined> {
    const [game] = await db.select().from(crowdlineGames).where(eq(crowdlineGames.id, id));
    return game || undefined;
  }

  async crowdline_createGame(game: InsertCrowdlineGame): Promise<CrowdlineGame> {
    const [newGame] = await db
      .insert(crowdlineGames)
      .values(game)
      .returning();
    return newGame;
  }

  async crowdline_deleteGame(id: string): Promise<void> {
    await db.delete(crowdlineGames).where(eq(crowdlineGames.id, id));
  }

  async crowdline_updateGameResult(id: string, data: { actualHomeScore: number; actualAwayScore: number; vegasSpread?: number; vegasOverUnder?: number; status?: string }): Promise<CrowdlineGame> {
    const updateData: Record<string, unknown> = {
      actualHomeScore: data.actualHomeScore,
      actualAwayScore: data.actualAwayScore,
      status: data.status || "final",
    };
    if (data.vegasSpread !== undefined) {
      updateData.vegasSpread = String(data.vegasSpread);
    }
    if (data.vegasOverUnder !== undefined) {
      updateData.vegasOverUnder = String(data.vegasOverUnder);
    }
    const [game] = await db
      .update(crowdlineGames)
      .set(updateData)
      .where(eq(crowdlineGames.id, id))
      .returning();
    return game;
  }

  async crowdline_getGamesWithStats(userId?: string): Promise<CrowdlineGameWithStats[]> {
    const allGames = await db.select().from(crowdlineGames).orderBy(crowdlineGames.gameDate);
    
    const gamesWithStats: CrowdlineGameWithStats[] = [];
    
    for (const game of allGames) {
      const predictions = await db
        .select()
        .from(crowdlinePredictions)
        .where(eq(crowdlinePredictions.gameId, game.id));
      
      let userPrediction: { homeScore: number; awayScore: number } | null = null;
      if (userId) {
        const userPred = predictions.find(p => p.visitorId === userId);
        if (userPred) {
          userPrediction = { homeScore: userPred.homeScore, awayScore: userPred.awayScore };
        }
      }
      
      const totalPredictions = predictions.length;
      const avgHomeScore = totalPredictions > 0 
        ? predictions.reduce((sum, p) => sum + p.homeScore, 0) / totalPredictions 
        : 0;
      const avgAwayScore = totalPredictions > 0 
        ? predictions.reduce((sum, p) => sum + p.awayScore, 0) / totalPredictions 
        : 0;
      
      gamesWithStats.push({
        ...game,
        userPrediction,
        totalPredictions,
        avgHomeScore: Math.round(avgHomeScore * 10) / 10,
        avgAwayScore: Math.round(avgAwayScore * 10) / 10,
      });
    }
    
    return gamesWithStats;
  }

  async crowdline_getPrediction(userId: string, gameId: string): Promise<CrowdlinePrediction | undefined> {
    const [prediction] = await db
      .select()
      .from(crowdlinePredictions)
      .where(and(eq(crowdlinePredictions.visitorId, userId), eq(crowdlinePredictions.gameId, gameId)));
    return prediction || undefined;
  }

  async crowdline_createPrediction(prediction: { visitorId: string; gameId: string; homeScore: number; awayScore: number }): Promise<CrowdlinePrediction> {
    const [newPrediction] = await db
      .insert(crowdlinePredictions)
      .values(prediction)
      .returning();
    return newPrediction;
  }

  async crowdline_updatePrediction(userId: string, gameId: string, homeScore: number, awayScore: number): Promise<CrowdlinePrediction> {
    const [prediction] = await db
      .update(crowdlinePredictions)
      .set({ homeScore, awayScore })
      .where(and(eq(crowdlinePredictions.visitorId, userId), eq(crowdlinePredictions.gameId, gameId)))
      .returning();
    return prediction;
  }

  async crowdline_getLeaderboard(): Promise<CrowdlineLeaderboardEntry[]> {
    const allUsers = await db.select().from(users);
    const allGames = await db.select().from(crowdlineGames).where(eq(crowdlineGames.status, "final"));
    const allPredictions = await db.select().from(crowdlinePredictions);
    
    const leaderboard: CrowdlineLeaderboardEntry[] = [];
    
    for (const user of allUsers) {
      const userPredictions = allPredictions.filter(p => p.visitorId === user.id);
      if (userPredictions.length === 0) continue;
      
      let totalPoints = 0;
      let correctWinners = 0;
      let exactScores = 0;
      let totalPointDiff = 0;
      let scoredGames = 0;
      
      for (const pred of userPredictions) {
        const game = allGames.find(g => g.id === pred.gameId);
        if (!game || game.actualHomeScore === null || game.actualAwayScore === null) continue;
        
        scoredGames++;
        const predWinner = pred.homeScore > pred.awayScore ? "home" : pred.homeScore < pred.awayScore ? "away" : "tie";
        const actualWinner = game.actualHomeScore > game.actualAwayScore ? "home" : game.actualHomeScore < game.actualAwayScore ? "away" : "tie";
        
        if (predWinner === actualWinner) {
          correctWinners++;
          totalPoints += 3;
        }
        
        if (pred.homeScore === game.actualHomeScore && pred.awayScore === game.actualAwayScore) {
          exactScores++;
          totalPoints += 10;
        }
        
        const pointDiff = Math.abs((pred.homeScore - game.actualHomeScore) + (pred.awayScore - game.actualAwayScore));
        totalPointDiff += pointDiff;
      }
      
      leaderboard.push({
        visitorId: user.id,
        username: user.username,
        totalPoints,
        gamesPredicted: userPredictions.length,
        correctWinners,
        exactScores,
        averagePointDiff: scoredGames > 0 ? Math.round((totalPointDiff / scoredGames) * 10) / 10 : 0,
      });
    }
    
    return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  }
}

export const storage = new DatabaseStorage();

import { 
  users, 
  games, 
  predictions,
  type User, 
  type InsertUser,
  type Game,
  type InsertGame,
  type Prediction,
  type InsertPrediction,
  type GameWithStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export type LeaderboardEntry = {
  userId: string;
  username: string;
  totalPoints: number;
  gamesPredicted: number;
  correctWinners: number;
  exactScores: number;
  averagePointDiff: number;
};

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllGames(): Promise<Game[]>;
  getGameById(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  deleteGame(id: string): Promise<void>;
  updateGameResult(id: string, data: { actualHomeScore: number; actualAwayScore: number; vegasSpread?: number; vegasOverUnder?: number; status?: string }): Promise<Game>;
  
  getGamesWithStats(userId?: string): Promise<GameWithStats[]>;
  getPrediction(userId: string, gameId: string): Promise<Prediction | undefined>;
  createPrediction(prediction: InsertPrediction & { userId: string }): Promise<Prediction>;
  updatePrediction(userId: string, gameId: string, homeScore: number, awayScore: number): Promise<Prediction>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllGames(): Promise<Game[]> {
    return await db.select().from(games).orderBy(games.gameDate);
  }

  async getGameById(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db
      .insert(games)
      .values(game)
      .returning();
    return newGame;
  }

  async deleteGame(id: string): Promise<void> {
    await db.delete(games).where(eq(games.id, id));
  }

  async updateGameResult(id: string, data: { actualHomeScore: number; actualAwayScore: number; vegasSpread?: number; vegasOverUnder?: number; status?: string }): Promise<Game> {
    const [updatedGame] = await db
      .update(games)
      .set(data)
      .where(eq(games.id, id))
      .returning();
    return updatedGame;
  }

  async getGamesWithStats(userId?: string): Promise<GameWithStats[]> {
    const allGames = await db.select().from(games).orderBy(games.gameDate);
    
    const gamesWithStats: GameWithStats[] = await Promise.all(
      allGames.map(async (game) => {
        const gamePredictions = await db
          .select()
          .from(predictions)
          .where(eq(predictions.gameId, game.id));

        const predictionCount = gamePredictions.length;
        
        let averageOverUnder: number | null = null;
        let averageSpread: number | null = null;
        let favoredTeam: string | null = null;
        
        if (predictionCount > 0) {
          const totalOverUnder = gamePredictions.reduce(
            (sum, p) => sum + p.homeScore + p.awayScore,
            0
          );
          averageOverUnder = totalOverUnder / predictionCount;

          const totalSpread = gamePredictions.reduce(
            (sum, p) => sum + (p.homeScore - p.awayScore),
            0
          );
          averageSpread = totalSpread / predictionCount;

          if (averageSpread > 0) {
            favoredTeam = game.homeTeam.split(' ').pop() || game.homeTeam;
          } else if (averageSpread < 0) {
            favoredTeam = game.awayTeam.split(' ').pop() || game.awayTeam;
            averageSpread = Math.abs(averageSpread);
          }
        }

        let userPrediction: { homeScore: number; awayScore: number } | null = null;
        if (userId) {
          const [prediction] = await db
            .select()
            .from(predictions)
            .where(
              and(
                eq(predictions.gameId, game.id),
                eq(predictions.userId, userId)
              )
            );
          
          if (prediction) {
            userPrediction = {
              homeScore: prediction.homeScore,
              awayScore: prediction.awayScore,
            };
          }
        }

        const isLocked = game.status !== "scheduled" || new Date(game.gameDate) <= new Date();

        return {
          ...game,
          predictionCount,
          averageOverUnder,
          averageSpread,
          favoredTeam,
          isLocked,
          userPrediction,
        };
      })
    );

    return gamesWithStats;
  }

  async getPrediction(userId: string, gameId: string): Promise<Prediction | undefined> {
    const [prediction] = await db
      .select()
      .from(predictions)
      .where(
        and(
          eq(predictions.userId, userId),
          eq(predictions.gameId, gameId)
        )
      );
    return prediction;
  }

  async createPrediction(prediction: InsertPrediction & { userId: string }): Promise<Prediction> {
    const [newPrediction] = await db
      .insert(predictions)
      .values(prediction)
      .returning();
    return newPrediction;
  }

  async updatePrediction(userId: string, gameId: string, homeScore: number, awayScore: number): Promise<Prediction> {
    const [updatedPrediction] = await db
      .update(predictions)
      .set({ homeScore, awayScore })
      .where(
        and(
          eq(predictions.userId, userId),
          eq(predictions.gameId, gameId)
        )
      )
      .returning();
    return updatedPrediction;
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const completedGames = await db
      .select()
      .from(games)
      .where(eq(games.status, "completed"));

    if (completedGames.length === 0) {
      return [];
    }

    const allPredictions = await db
      .select({
        userId: predictions.userId,
        gameId: predictions.gameId,
        homeScore: predictions.homeScore,
        awayScore: predictions.awayScore,
        actualHomeScore: games.actualHomeScore,
        actualAwayScore: games.actualAwayScore,
        username: users.username,
      })
      .from(predictions)
      .innerJoin(games, eq(predictions.gameId, games.id))
      .innerJoin(users, eq(predictions.userId, users.id))
      .where(eq(games.status, "completed"));

    const userStats = new Map<string, {
      userId: string;
      username: string;
      totalPoints: number;
      gamesPredicted: number;
      correctWinners: number;
      exactScores: number;
      totalPointDiff: number;
    }>();

    for (const pred of allPredictions) {
      if (pred.actualHomeScore === null || pred.actualAwayScore === null) continue;

      const predictedWinner = pred.homeScore > pred.awayScore ? 'home' : pred.awayScore > pred.homeScore ? 'away' : 'tie';
      const actualWinner = pred.actualHomeScore > pred.actualAwayScore ? 'home' : pred.actualAwayScore > pred.actualHomeScore ? 'away' : 'tie';
      const correctWinner = predictedWinner === actualWinner;
      const exactScore = pred.homeScore === pred.actualHomeScore && pred.awayScore === pred.actualAwayScore;
      const pointDiff = Math.abs(pred.homeScore - pred.actualHomeScore) + Math.abs(pred.awayScore - pred.actualAwayScore);

      let points = 0;
      if (exactScore) {
        points += 25;
      }
      if (correctWinner) {
        points += 10;
      }
      points += Math.max(0, 10 - pointDiff);

      if (!userStats.has(pred.userId)) {
        userStats.set(pred.userId, {
          userId: pred.userId,
          username: pred.username,
          totalPoints: 0,
          gamesPredicted: 0,
          correctWinners: 0,
          exactScores: 0,
          totalPointDiff: 0,
        });
      }

      const stats = userStats.get(pred.userId)!;
      stats.totalPoints += points;
      stats.gamesPredicted += 1;
      if (correctWinner) stats.correctWinners += 1;
      if (exactScore) stats.exactScores += 1;
      stats.totalPointDiff += pointDiff;
    }

    const leaderboard: LeaderboardEntry[] = Array.from(userStats.values()).map(stats => ({
      userId: stats.userId,
      username: stats.username,
      totalPoints: stats.totalPoints,
      gamesPredicted: stats.gamesPredicted,
      correctWinners: stats.correctWinners,
      exactScores: stats.exactScores,
      averagePointDiff: stats.gamesPredicted > 0 ? stats.totalPointDiff / stats.gamesPredicted : 0,
    }));

    return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  }
}

export const storage = new DatabaseStorage();

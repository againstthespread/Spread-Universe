// Reference: javascript_database and javascript_auth_all_persistance blueprints
import { 
  users, 
  games, 
  picks, 
  type User, 
  type InsertUser, 
  type Game,
  type InsertGame,
  type Pick,
  type InsertPick,
  type UpdateGameResult,
  type PickHistoryItem,
} from "@shared/schema";
import { db } from "./db";
import { pool } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Store } from "express-session";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(userId: string, hashedPassword: string, requireChange: boolean): Promise<User>;

  // Game operations
  getAllGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, game: Partial<Game>): Promise<Game>;
  deleteGame(id: string): Promise<void>;
  updateGameResult(result: UpdateGameResult): Promise<Game>;

  // Pick operations
  getPick(userId: string, gameId: string): Promise<Pick | undefined>;
  getUserPicks(userId: string): Promise<Pick[]>;
  getGamePicks(gameId: string): Promise<Pick[]>;
  createOrUpdatePick(pick: InsertPick): Promise<Pick>;
  getAllPicks(): Promise<Pick[]>;
  getAllPicksWithDetails(): Promise<PickHistoryItem[]>;

  // Session store
  sessionStore: Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserPassword(userId: string, hashedPassword: string, requireChange: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, requirePasswordChange: requireChange })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Game operations
  async getAllGames(): Promise<Game[]> {
    return await db.select().from(games).orderBy(games.gameDate);
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const gameData = {
      ...insertGame,
      gameDate: typeof insertGame.gameDate === 'string' 
        ? new Date(insertGame.gameDate) 
        : insertGame.gameDate,
      pickDeadline: insertGame.pickDeadline 
        ? (typeof insertGame.pickDeadline === 'string' 
          ? new Date(insertGame.pickDeadline) 
          : insertGame.pickDeadline)
        : undefined,
    };
    
    const [game] = await db
      .insert(games)
      .values(gameData)
      .returning();
    return game;
  }

  async updateGame(id: string, updateData: Partial<Game>): Promise<Game> {
    const processedData: any = {
      ...updateData,
    };
    
    // Handle date conversions
    if (updateData.gameDate) {
      processedData.gameDate = typeof updateData.gameDate === 'string' 
        ? new Date(updateData.gameDate) 
        : updateData.gameDate;
    }
    
    // Handle pickDeadline - allow null to clear the deadline
    if ('pickDeadline' in updateData) {
      processedData.pickDeadline = updateData.pickDeadline 
        ? (typeof updateData.pickDeadline === 'string' 
          ? new Date(updateData.pickDeadline) 
          : updateData.pickDeadline)
        : null;
    }
    
    const [game] = await db
      .update(games)
      .set(processedData)
      .where(eq(games.id, id))
      .returning();
    return game;
  }

  async deleteGame(id: string): Promise<void> {
    await db.delete(games).where(eq(games.id, id));
  }

  async updateGameResult(result: UpdateGameResult): Promise<Game> {
    const { gameId, homeScore, awayScore } = result;
    
    // Get the game to determine winner ATS
    const game = await this.getGame(gameId);
    if (!game) throw new Error("Game not found");

    // Calculate winner against the spread
    const spread = Number(game.spread);
    let winner: string;
    
    if (game.favoredTeam === "HOME") {
      // Home team is favored, need to cover the spread
      const coverMargin = homeScore - awayScore + spread;
      winner = coverMargin > 0 ? game.homeTeam : game.awayTeam;
    } else {
      // Away team is favored
      const coverMargin = awayScore - homeScore + spread;
      winner = coverMargin > 0 ? game.awayTeam : game.homeTeam;
    }

    // Update the game with results
    const [updatedGame] = await db
      .update(games)
      .set({
        homeScore,
        awayScore,
        isComplete: true,
        winner,
      })
      .where(eq(games.id, gameId))
      .returning();

    return updatedGame;
  }

  // Pick history operations
  async getAllPicksWithDetails(): Promise<PickHistoryItem[]> {
    // Get all picks for completed games with user and game details
    const picksData = await db
      .select({
        pickId: picks.id,
        userId: picks.userId,
        username: users.username,
        displayName: users.displayName,
        gameId: picks.gameId,
        selectedTeam: picks.selectedTeam,
        isCorrect: picks.isCorrect,
        pointsEarned: picks.pointsEarned,
        round: games.round,
        homeTeam: games.homeTeam,
        awayTeam: games.awayTeam,
        spread: games.spread,
        favoredTeam: games.favoredTeam,
        gameDate: games.gameDate,
        homeScore: games.homeScore,
        awayScore: games.awayScore,
        isComplete: games.isComplete,
        winner: games.winner,
      })
      .from(picks)
      .innerJoin(users, eq(picks.userId, users.id))
      .innerJoin(games, eq(picks.gameId, games.id))
      .where(eq(games.isComplete, true))
      .orderBy(desc(games.gameDate));
    
    return picksData;
  }

  // Pick operations
  async getPick(userId: string, gameId: string): Promise<Pick | undefined> {
    const [pick] = await db
      .select()
      .from(picks)
      .where(and(eq(picks.userId, userId), eq(picks.gameId, gameId)));
    return pick || undefined;
  }

  async getUserPicks(userId: string): Promise<Pick[]> {
    return await db.select().from(picks).where(eq(picks.userId, userId));
  }

  async getGamePicks(gameId: string): Promise<Pick[]> {
    return await db.select().from(picks).where(eq(picks.gameId, gameId));
  }

  async createOrUpdatePick(insertPick: InsertPick): Promise<Pick> {
    const existing = await this.getPick(insertPick.userId, insertPick.gameId);
    
    if (existing) {
      const [pick] = await db
        .update(picks)
        .set({ selectedTeam: insertPick.selectedTeam })
        .where(eq(picks.id, existing.id))
        .returning();
      return pick;
    } else {
      const [pick] = await db
        .insert(picks)
        .values(insertPick)
        .returning();
      return pick;
    }
  }

  async getAllPicks(): Promise<Pick[]> {
    return await db.select().from(picks);
  }
}

export const storage = new DatabaseStorage();

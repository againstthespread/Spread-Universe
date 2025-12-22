// Referenced from javascript_database blueprint
import { games, clicks, type Game, type InsertGame, type InsertClick, type Click } from "@shared/schema";
import { db } from "./db";
import { eq, asc, sql, desc } from "drizzle-orm";

export interface IStorage {
  getAllGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, game: InsertGame): Promise<Game | undefined>;
  deleteGame(id: string): Promise<boolean>;
  reorderGames(gameIds: string[]): Promise<void>;
  recordClick(click: InsertClick): Promise<Click>;
  getAnalytics(): Promise<Array<{ gameId: string; gameName: string; clickCount: number }>>;
}

export class DatabaseStorage implements IStorage {
  async getAllGames(): Promise<Game[]> {
    return await db.select().from(games).orderBy(asc(games.displayOrder), asc(games.name));
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values(insertGame)
      .returning();
    return game;
  }

  async updateGame(id: string, insertGame: InsertGame): Promise<Game | undefined> {
    const [game] = await db
      .update(games)
      .set(insertGame)
      .where(eq(games.id, id))
      .returning();
    return game || undefined;
  }

  async deleteGame(id: string): Promise<boolean> {
    const result = await db
      .delete(games)
      .where(eq(games.id, id))
      .returning();
    return result.length > 0;
  }

  async reorderGames(gameIds: string[]): Promise<void> {
    for (let i = 0; i < gameIds.length; i++) {
      await db
        .update(games)
        .set({ displayOrder: i })
        .where(eq(games.id, gameIds[i]));
    }
  }

  async recordClick(insertClick: InsertClick): Promise<Click> {
    const [click] = await db
      .insert(clicks)
      .values(insertClick)
      .returning();
    return click;
  }

  async getAnalytics(): Promise<Array<{ gameId: string; gameName: string; clickCount: number }>> {
    const result = await db
      .select({
        gameId: clicks.gameId,
        gameName: games.name,
        clickCount: sql<number>`count(*)::int`,
      })
      .from(clicks)
      .leftJoin(games, eq(clicks.gameId, games.id))
      .groupBy(clicks.gameId, games.name)
      .orderBy(desc(sql`count(*)`));
    
    return result as Array<{ gameId: string; gameName: string; clickCount: number }>;
  }
}

export const storage = new DatabaseStorage();

// Reference: javascript_log_in_with_replit and javascript_database blueprints
import {
  users,
  leagues,
  leagueMembers,
  games,
  picks,
  weeklyMatchups,
  type User,
  type UpsertUser,
  type InsertUser,
  type League,
  type InsertLeague,
  type LeagueMember,
  type InsertLeagueMember,
  type Game,
  type InsertGame,
  type UpdateGameResult,
  type Pick,
  type InsertPick,
  type WeeklyMatchup,
  type InsertWeeklyMatchup,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, or, ilike, desc } from "drizzle-orm";
import bcrypt from "bcrypt";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  verifyPassword(userId: string, password: string): Promise<boolean>;
  changePassword(userId: string, newPassword: string): Promise<void>;
  
  // League operations
  createLeague(userId: string, league: InsertLeague): Promise<League>;
  getLeagues(userId: string): Promise<League[]>;
  getLeagueById(leagueId: string): Promise<League | undefined>;
  searchLeagues(searchTerm: string): Promise<League[]>;
  updateLeagueStatus(leagueId: string, status: string): Promise<void>;
  updateLeagueWeek(leagueId: string, week: number): Promise<void>;
  
  // League member operations
  joinLeague(userId: string, leagueId: string): Promise<void>;
  getLeagueMembers(leagueId: string): Promise<LeagueMember[]>;
  getLeagueMemberCount(leagueId: string): Promise<number>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGamesByWeek(week: number): Promise<Game[]>;
  getGameById(gameId: string): Promise<Game | undefined>;
  updateGameResult(gameId: string, result: UpdateGameResult): Promise<void>;
  updateGame(gameId: string, updates: Partial<InsertGame>): Promise<void>;
  deleteGame(gameId: string): Promise<void>;
  
  // Pick operations
  submitPicks(userId: string, pickData: InsertPick[]): Promise<void>;
  getUserPicks(userId: string, leagueId: string, week: number): Promise<Pick[]>;
  updatePickResults(gameId: string): Promise<void>;
  
  // Matchup operations
  createMatchups(matchups: InsertWeeklyMatchup[]): Promise<void>;
  getLeagueMatchups(leagueId: string): Promise<WeeklyMatchup[]>;
  getWeekMatchups(leagueId: string, week: number): Promise<WeeklyMatchup[]>;
  getMatchupById(matchupId: string): Promise<WeeklyMatchup | undefined>;
  updateMatchupResult(matchupId: string, user1Npw: number, user2Npw: number | null, winnerId: string | null): Promise<void>;
  
  // Admin operations
  resetAllLeagues(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password!, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.password) {
      return false;
    }
    return await bcrypt.compare(password, user.password);
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First check if a user with this email already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, userData.email!));
    const existingUser = existingUsers[0];

    if (existingUser) {
      // Update the existing user record, preserving the original ID
      const [user] = await db
        .update(users)
        .set({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return user;
    }

    // Insert new user if email doesn't exist
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // League operations
  async createLeague(userId: string, leagueData: InsertLeague): Promise<League> {
    const [league] = await db
      .insert(leagues)
      .values({ ...leagueData, creatorId: userId })
      .returning();
    
    // Auto-join creator
    await this.joinLeague(userId, league.id);
    
    return league;
  }

  async getLeagues(userId: string): Promise<League[]> {
    const result = await db
      .select({
        league: leagues,
        memberCount: sql<number>`count(distinct ${leagueMembers.userId})`,
      })
      .from(leagues)
      .leftJoin(leagueMembers, eq(leagues.id, leagueMembers.leagueId))
      .groupBy(leagues.id)
      .orderBy(desc(leagues.createdAt));

    return result.map(r => ({ ...r.league, memberCount: Number(r.memberCount) })) as any;
  }

  async getLeagueById(leagueId: string): Promise<League | undefined> {
    const [league] = await db.select().from(leagues).where(eq(leagues.id, leagueId));
    return league;
  }

  async searchLeagues(searchTerm: string): Promise<League[]> {
    const result = await db
      .select()
      .from(leagues)
      .where(and(
        ilike(leagues.name, `%${searchTerm}%`),
        eq(leagues.status, 'open')
      ))
      .limit(20);
    return result;
  }

  async updateLeagueStatus(leagueId: string, status: string): Promise<void> {
    await db
      .update(leagues)
      .set({ status, updatedAt: new Date() })
      .where(eq(leagues.id, leagueId));
  }

  async updateLeagueWeek(leagueId: string, week: number): Promise<void> {
    await db
      .update(leagues)
      .set({ currentWeek: week, updatedAt: new Date() })
      .where(eq(leagues.id, leagueId));
  }

  // League member operations
  async joinLeague(userId: string, leagueId: string): Promise<void> {
    await db.insert(leagueMembers).values({ userId, leagueId }).onConflictDoNothing();
  }

  async getLeagueMembers(leagueId: string): Promise<LeagueMember[]> {
    return await db.select().from(leagueMembers).where(eq(leagueMembers.leagueId, leagueId));
  }

  async getLeagueMemberCount(leagueId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(leagueMembers)
      .where(eq(leagueMembers.leagueId, leagueId));
    return Number(result[0].count);
  }

  // Game operations
  async createGame(gameData: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values({
      ...gameData,
      spread: gameData.spread.toString(),
      // gameTime might be a string or Date - ensure it's a Date
      gameTime: typeof gameData.gameTime === 'string' ? new Date(gameData.gameTime) : gameData.gameTime,
    }).returning();
    return game;
  }

  async getGamesByWeek(week: number): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.week, week));
  }

  async getGameById(gameId: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, gameId));
    return game;
  }

  async updateGameResult(gameId: string, result: UpdateGameResult): Promise<void> {
    await db
      .update(games)
      .set({
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        isComplete: true,
      })
      .where(eq(games.id, gameId));
  }

  async updateGame(gameId: string, updates: Partial<InsertGame>): Promise<void> {
    const dbUpdates: any = { ...updates };
    if (updates.spread !== undefined) {
      dbUpdates.spread = updates.spread.toString();
    }
    if (updates.gameTime !== undefined) {
      dbUpdates.gameTime = typeof updates.gameTime === 'string' ? new Date(updates.gameTime) : updates.gameTime;
    }
    await db.update(games).set(dbUpdates).where(eq(games.id, gameId));
  }

  async deleteGame(gameId: string): Promise<void> {
    await db.delete(games).where(eq(games.id, gameId));
  }

  // Pick operations
  async submitPicks(userId: string, pickData: (InsertPick | { gameId: string; leagueId: string; week: number; pickedTeam: null; note: null })[]): Promise<void> {
    for (const pick of pickData) {
      // If pickedTeam is null, delete the pick
      if (pick.pickedTeam === null) {
        await db
          .delete(picks)
          .where(and(
            eq(picks.userId, userId),
            eq(picks.leagueId, pick.leagueId),
            eq(picks.gameId, pick.gameId)
          ));
      } else {
        // Otherwise, insert or update the pick
        await db
          .insert(picks)
          .values({ ...pick, userId })
          .onConflictDoUpdate({
            target: [picks.userId, picks.leagueId, picks.gameId],
            set: {
              pickedTeam: pick.pickedTeam,
              note: pick.note,
              updatedAt: new Date(),
            },
          });
      }
    }
  }

  async getUserPicks(userId: string, leagueId: string, week: number): Promise<Pick[]> {
    return await db
      .select()
      .from(picks)
      .where(and(
        eq(picks.userId, userId),
        eq(picks.leagueId, leagueId),
        eq(picks.week, week)
      ));
  }

  async updatePickResults(gameId: string): Promise<void> {
    const game = await this.getGameById(gameId);
    if (!game || !game.isComplete) return;

    const gamePicks = await db.select().from(picks).where(eq(picks.gameId, gameId));

    for (const pick of gamePicks) {
      const spread = parseFloat(game.spread);
      const homeScoreWithSpread = (game.homeScore || 0) + spread;
      const awayScore = game.awayScore || 0;

      let isCorrect: boolean | null;
      let isPush: boolean;

      // Check for push (exact tie with spread)
      if (homeScoreWithSpread === awayScore) {
        isCorrect = null;
        isPush = true;
      } else {
        isPush = false;
        if (pick.pickedTeam === 'home') {
          isCorrect = homeScoreWithSpread > awayScore;
        } else {
          isCorrect = awayScore > homeScoreWithSpread;
        }
      }

      await db
        .update(picks)
        .set({ isCorrect, isPush, updatedAt: new Date() })
        .where(eq(picks.id, pick.id));
    }
  }

  // Matchup operations
  async createMatchups(matchupData: InsertWeeklyMatchup[]): Promise<void> {
    await db.insert(weeklyMatchups).values(matchupData);
  }

  async getLeagueMatchups(leagueId: string): Promise<WeeklyMatchup[]> {
    return await db
      .select()
      .from(weeklyMatchups)
      .where(eq(weeklyMatchups.leagueId, leagueId))
      .orderBy(weeklyMatchups.week);
  }

  async getWeekMatchups(leagueId: string, week: number): Promise<WeeklyMatchup[]> {
    return await db
      .select()
      .from(weeklyMatchups)
      .where(and(
        eq(weeklyMatchups.leagueId, leagueId),
        eq(weeklyMatchups.week, week)
      ));
  }

  async getMatchupById(matchupId: string): Promise<WeeklyMatchup | undefined> {
    const [matchup] = await db
      .select()
      .from(weeklyMatchups)
      .where(eq(weeklyMatchups.id, matchupId));
    return matchup;
  }

  async updateMatchupResult(
    matchupId: string,
    user1Npw: number,
    user2Npw: number | null,
    winnerId: string | null
  ): Promise<void> {
    await db
      .update(weeklyMatchups)
      .set({
        user1Npw,
        user2Npw,
        winnerId,
        isComplete: true,
      })
      .where(eq(weeklyMatchups.id, matchupId));
  }

  // Admin operations
  async resetAllLeagues(): Promise<void> {
    // Delete all picks
    await db.delete(picks);
    
    // Delete all weekly matchups (this resets standings since they're computed from matchups)
    await db.delete(weeklyMatchups);
    
    // Delete all games
    await db.delete(games);
    
    // Reset all leagues to week 1 and set status back to full (if they were active/completed)
    await db.update(leagues).set({ 
      currentWeek: 1,
      status: sql`CASE WHEN status IN ('active', 'completed') THEN 'full' ELSE status END`
    });
  }
}

export const storage = new DatabaseStorage();

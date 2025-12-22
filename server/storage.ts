// Database integration: blueprint:javascript_database
import { 
  users, 
  passwordResetCodes, 
  crowdlineGames, 
  crowdlinePredictions,
  marchmadnessTeams,
  marchmadnessRounds,
  marchmadnessGames,
  marchmadnessPicks,
  type User, 
  type InsertUser, 
  type PasswordResetCode,
  type CrowdlineGame,
  type InsertCrowdlineGame,
  type CrowdlinePrediction,
  type CrowdlineGameWithStats,
  type MarchmadnessTeam,
  type InsertMarchmadnessTeam,
  type MarchmadnessRound,
  type InsertMarchmadnessRound,
  type MarchmadnessGame,
  type InsertMarchmadnessGame,
  type UpdateMarchmadnessGame,
  type MarchmadnessPick,
  type InsertMarchmadnessPick,
  type MarchmadnessGameWithTeams,
  type MarchmadnessLeaderboardEntry,
  type MarchmadnessUserStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, gte, sql, desc, asc } from "drizzle-orm";

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
  
  // MarchMadness Team methods
  mm_getTeams(): Promise<MarchmadnessTeam[]>;
  mm_getTeam(id: string): Promise<MarchmadnessTeam | undefined>;
  mm_getTeamByName(name: string): Promise<MarchmadnessTeam | undefined>;
  mm_createTeam(team: InsertMarchmadnessTeam): Promise<MarchmadnessTeam>;
  mm_updateTeam(id: string, data: Partial<InsertMarchmadnessTeam>): Promise<MarchmadnessTeam | undefined>;
  
  // MarchMadness Round methods
  mm_getRounds(): Promise<MarchmadnessRound[]>;
  mm_getRound(id: string): Promise<MarchmadnessRound | undefined>;
  mm_getRoundByName(name: string): Promise<MarchmadnessRound | undefined>;
  mm_createRound(round: InsertMarchmadnessRound): Promise<MarchmadnessRound>;
  
  // MarchMadness Game methods
  mm_getGame(id: string): Promise<MarchmadnessGame | undefined>;
  mm_createGame(game: InsertMarchmadnessGame): Promise<MarchmadnessGame>;
  mm_updateGame(id: string, data: UpdateMarchmadnessGame): Promise<MarchmadnessGame | undefined>;
  mm_deleteGame(id: string): Promise<void>;
  mm_getGamesByRound(roundId: string): Promise<MarchmadnessGame[]>;
  mm_getGameWithTeams(id: string): Promise<MarchmadnessGameWithTeams | undefined>;
  mm_getGamesByRoundWithTeams(roundId: string, userId?: string): Promise<MarchmadnessGameWithTeams[]>;
  mm_getUpcomingGames(userId?: string): Promise<MarchmadnessGameWithTeams[]>;
  
  // MarchMadness Pick methods
  mm_getPick(id: string): Promise<MarchmadnessPick | undefined>;
  mm_getPickByUserAndGame(userId: string, gameId: string): Promise<MarchmadnessPick | undefined>;
  mm_createPick(pick: InsertMarchmadnessPick & { visitorId: string }): Promise<MarchmadnessPick>;
  mm_updatePick(id: string, pickedTeamId: string): Promise<MarchmadnessPick | undefined>;
  mm_deletePick(id: string): Promise<void>;
  mm_getPicksByUser(userId: string): Promise<MarchmadnessPick[]>;
  
  // MarchMadness Leaderboard
  mm_getLeaderboard(): Promise<MarchmadnessLeaderboardEntry[]>;
  mm_getUserStats(userId: string): Promise<MarchmadnessUserStats | undefined>;
  
  // MarchMadness initialization
  mm_initializeRounds(): Promise<void>;
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

  // MarchMadness Team methods
  async mm_getTeams(): Promise<MarchmadnessTeam[]> {
    return await db.select().from(marchmadnessTeams).orderBy(marchmadnessTeams.name);
  }

  async mm_getTeam(id: string): Promise<MarchmadnessTeam | undefined> {
    const [team] = await db.select().from(marchmadnessTeams).where(eq(marchmadnessTeams.id, id));
    return team || undefined;
  }

  async mm_getTeamByName(name: string): Promise<MarchmadnessTeam | undefined> {
    const [team] = await db.select().from(marchmadnessTeams).where(eq(marchmadnessTeams.name, name));
    return team || undefined;
  }

  async mm_createTeam(team: InsertMarchmadnessTeam): Promise<MarchmadnessTeam> {
    const [newTeam] = await db.insert(marchmadnessTeams).values(team).returning();
    return newTeam;
  }

  async mm_updateTeam(id: string, data: Partial<InsertMarchmadnessTeam>): Promise<MarchmadnessTeam | undefined> {
    const [team] = await db.update(marchmadnessTeams).set(data).where(eq(marchmadnessTeams.id, id)).returning();
    return team || undefined;
  }

  // MarchMadness Round methods
  async mm_getRounds(): Promise<MarchmadnessRound[]> {
    return await db.select().from(marchmadnessRounds).orderBy(asc(marchmadnessRounds.order));
  }

  async mm_getRound(id: string): Promise<MarchmadnessRound | undefined> {
    const [round] = await db.select().from(marchmadnessRounds).where(eq(marchmadnessRounds.id, id));
    return round || undefined;
  }

  async mm_getRoundByName(name: string): Promise<MarchmadnessRound | undefined> {
    const [round] = await db.select().from(marchmadnessRounds).where(eq(marchmadnessRounds.name, name));
    return round || undefined;
  }

  async mm_createRound(round: InsertMarchmadnessRound): Promise<MarchmadnessRound> {
    const [newRound] = await db.insert(marchmadnessRounds).values(round).returning();
    return newRound;
  }

  // MarchMadness Game methods
  async mm_getGame(id: string): Promise<MarchmadnessGame | undefined> {
    const [game] = await db.select().from(marchmadnessGames).where(eq(marchmadnessGames.id, id));
    return game || undefined;
  }

  async mm_createGame(game: InsertMarchmadnessGame): Promise<MarchmadnessGame> {
    const [newGame] = await db.insert(marchmadnessGames).values(game).returning();
    return newGame;
  }

  async mm_updateGame(id: string, data: UpdateMarchmadnessGame): Promise<MarchmadnessGame | undefined> {
    const [game] = await db.update(marchmadnessGames).set(data).where(eq(marchmadnessGames.id, id)).returning();
    return game || undefined;
  }

  async mm_deleteGame(id: string): Promise<void> {
    await db.delete(marchmadnessGames).where(eq(marchmadnessGames.id, id));
  }

  async mm_getGamesByRound(roundId: string): Promise<MarchmadnessGame[]> {
    return await db.select().from(marchmadnessGames).where(eq(marchmadnessGames.roundId, roundId)).orderBy(marchmadnessGames.startTime);
  }

  async mm_getGameWithTeams(id: string): Promise<MarchmadnessGameWithTeams | undefined> {
    const [game] = await db.select().from(marchmadnessGames).where(eq(marchmadnessGames.id, id));
    if (!game) return undefined;

    const [homeTeam] = await db.select().from(marchmadnessTeams).where(eq(marchmadnessTeams.id, game.homeTeamId));
    const [awayTeam] = await db.select().from(marchmadnessTeams).where(eq(marchmadnessTeams.id, game.awayTeamId));
    const [round] = await db.select().from(marchmadnessRounds).where(eq(marchmadnessRounds.id, game.roundId));

    if (!homeTeam || !awayTeam || !round) return undefined;

    return { ...game, homeTeam, awayTeam, round };
  }

  async mm_getGamesByRoundWithTeams(roundId: string, userId?: string): Promise<MarchmadnessGameWithTeams[]> {
    const games = await db.select().from(marchmadnessGames).where(eq(marchmadnessGames.roundId, roundId)).orderBy(marchmadnessGames.startTime);
    const result: MarchmadnessGameWithTeams[] = [];

    for (const game of games) {
      const [homeTeam] = await db.select().from(marchmadnessTeams).where(eq(marchmadnessTeams.id, game.homeTeamId));
      const [awayTeam] = await db.select().from(marchmadnessTeams).where(eq(marchmadnessTeams.id, game.awayTeamId));
      const [round] = await db.select().from(marchmadnessRounds).where(eq(marchmadnessRounds.id, game.roundId));

      if (homeTeam && awayTeam && round) {
        let userPick: MarchmadnessPick | null = null;
        if (userId) {
          const [pick] = await db.select().from(marchmadnessPicks).where(and(eq(marchmadnessPicks.visitorId, userId), eq(marchmadnessPicks.gameId, game.id)));
          userPick = pick || null;
        }
        result.push({ ...game, homeTeam, awayTeam, round, userPick });
      }
    }

    return result;
  }

  async mm_getUpcomingGames(userId?: string): Promise<MarchmadnessGameWithTeams[]> {
    const games = await db.select().from(marchmadnessGames).where(eq(marchmadnessGames.status, "upcoming")).orderBy(marchmadnessGames.startTime);
    const result: MarchmadnessGameWithTeams[] = [];

    for (const game of games) {
      const [homeTeam] = await db.select().from(marchmadnessTeams).where(eq(marchmadnessTeams.id, game.homeTeamId));
      const [awayTeam] = await db.select().from(marchmadnessTeams).where(eq(marchmadnessTeams.id, game.awayTeamId));
      const [round] = await db.select().from(marchmadnessRounds).where(eq(marchmadnessRounds.id, game.roundId));

      if (homeTeam && awayTeam && round) {
        let userPick: MarchmadnessPick | null = null;
        if (userId) {
          const [pick] = await db.select().from(marchmadnessPicks).where(and(eq(marchmadnessPicks.visitorId, userId), eq(marchmadnessPicks.gameId, game.id)));
          userPick = pick || null;
        }
        result.push({ ...game, homeTeam, awayTeam, round, userPick });
      }
    }

    return result;
  }

  // MarchMadness Pick methods
  async mm_getPick(id: string): Promise<MarchmadnessPick | undefined> {
    const [pick] = await db.select().from(marchmadnessPicks).where(eq(marchmadnessPicks.id, id));
    return pick || undefined;
  }

  async mm_getPickByUserAndGame(userId: string, gameId: string): Promise<MarchmadnessPick | undefined> {
    const [pick] = await db.select().from(marchmadnessPicks).where(and(eq(marchmadnessPicks.visitorId, userId), eq(marchmadnessPicks.gameId, gameId)));
    return pick || undefined;
  }

  async mm_createPick(pick: InsertMarchmadnessPick & { visitorId: string }): Promise<MarchmadnessPick> {
    const [newPick] = await db.insert(marchmadnessPicks).values(pick).returning();
    return newPick;
  }

  async mm_updatePick(id: string, pickedTeamId: string): Promise<MarchmadnessPick | undefined> {
    const [pick] = await db.update(marchmadnessPicks).set({ pickedTeamId }).where(eq(marchmadnessPicks.id, id)).returning();
    return pick || undefined;
  }

  async mm_deletePick(id: string): Promise<void> {
    await db.delete(marchmadnessPicks).where(eq(marchmadnessPicks.id, id));
  }

  async mm_getPicksByUser(userId: string): Promise<MarchmadnessPick[]> {
    return await db.select().from(marchmadnessPicks).where(eq(marchmadnessPicks.visitorId, userId));
  }

  // MarchMadness Leaderboard
  async mm_getLeaderboard(): Promise<MarchmadnessLeaderboardEntry[]> {
    const allUsers = await db.select().from(users);
    const allPicks = await db.select().from(marchmadnessPicks);
    
    const leaderboard: MarchmadnessLeaderboardEntry[] = [];

    for (const user of allUsers) {
      const userPicks = allPicks.filter(p => p.visitorId === user.id);
      if (userPicks.length === 0) continue;

      const correctPicks = userPicks.filter(p => p.isCorrect === true).length;
      const totalPoints = userPicks.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);

      leaderboard.push({
        visitorId: user.id,
        username: user.username,
        totalPoints,
        correctPicks,
        totalPicks: userPicks.length,
        winPercentage: userPicks.length > 0 ? Math.round((correctPicks / userPicks.length) * 100) : 0,
      });
    }

    return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  }

  async mm_getUserStats(userId: string): Promise<MarchmadnessUserStats | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const userPicks = await db.select().from(marchmadnessPicks).where(eq(marchmadnessPicks.visitorId, userId));
    const rounds = await this.mm_getRounds();
    const leaderboard = await this.mm_getLeaderboard();

    const correctPicks = userPicks.filter(p => p.isCorrect === true).length;
    const totalPoints = userPicks.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
    const rank = leaderboard.findIndex(e => e.visitorId === userId) + 1;

    const roundStats = [];
    for (const round of rounds) {
      const games = await this.mm_getGamesByRound(round.id);
      const gameIds = new Set(games.map(g => g.id));
      const roundPicks = userPicks.filter(p => gameIds.has(p.gameId));
      const roundCorrect = roundPicks.filter(p => p.isCorrect === true).length;
      const roundPoints = roundPicks.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);

      roundStats.push({
        roundId: round.id,
        roundName: round.displayName,
        correctPicks: roundCorrect,
        totalPicks: roundPicks.length,
        pointsEarned: roundPoints,
      });
    }

    return {
      totalPoints,
      correctPicks,
      totalPicks: userPicks.length,
      winPercentage: userPicks.length > 0 ? Math.round((correctPicks / userPicks.length) * 100) : 0,
      rank: rank || leaderboard.length + 1,
      roundStats,
    };
  }

  // Initialize default rounds
  async mm_initializeRounds(): Promise<void> {
    const existingRounds = await this.mm_getRounds();
    if (existingRounds.length > 0) return;

    const defaultRounds = [
      { name: "round64", displayName: "Round of 64", pointValue: 10, order: 1 },
      { name: "round32", displayName: "Round of 32", pointValue: 20, order: 2 },
      { name: "sweet16", displayName: "Sweet 16", pointValue: 40, order: 3 },
      { name: "elite8", displayName: "Elite 8", pointValue: 80, order: 4 },
      { name: "final4", displayName: "Final Four", pointValue: 160, order: 5 },
      { name: "championship", displayName: "Championship", pointValue: 320, order: 6 },
    ];

    for (const round of defaultRounds) {
      await this.mm_createRound(round);
    }
  }
}

export const storage = new DatabaseStorage();

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
  gamblingLeagueLeagues,
  gamblingLeagueMembers,
  gamblingLeagueGames,
  gamblingLeaguePicks,
  gamblingLeagueMatchups,
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
  type GamblingLeagueLeague,
  type InsertGamblingLeagueLeague,
  type GamblingLeagueMember,
  type GamblingLeagueGame,
  type InsertGamblingLeagueGame,
  type UpdateGamblingLeagueGameResult,
  type GamblingLeaguePick,
  type InsertGamblingLeaguePick,
  type GamblingLeagueMatchup,
  type InsertGamblingLeagueMatchup,
  type GamblingLeagueStandingEntry,
  type GamblingLeagueGameWithPick,
  type GamblingLeagueMatchupWithUsers,
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
  
  // Gambling League methods
  gl_getLeagues(): Promise<GamblingLeagueLeague[]>;
  gl_getLeague(id: string): Promise<GamblingLeagueLeague | undefined>;
  gl_createLeague(league: InsertGamblingLeagueLeague, creatorId: string): Promise<GamblingLeagueLeague>;
  gl_joinLeague(leagueId: string, userId: string): Promise<GamblingLeagueMember>;
  gl_getLeagueMembers(leagueId: string): Promise<(GamblingLeagueMember & { user: User })[]>;
  gl_getUserLeagues(userId: string): Promise<GamblingLeagueLeague[]>;
  gl_updateLeagueStatus(id: string, status: string): Promise<GamblingLeagueLeague | undefined>;
  gl_updateLeagueWeek(id: string, week: number): Promise<GamblingLeagueLeague | undefined>;
  
  gl_getGames(): Promise<GamblingLeagueGame[]>;
  gl_getGamesByWeek(week: number): Promise<GamblingLeagueGame[]>;
  gl_createGame(game: InsertGamblingLeagueGame): Promise<GamblingLeagueGame>;
  gl_updateGameResult(id: string, data: UpdateGamblingLeagueGameResult): Promise<GamblingLeagueGame | undefined>;
  gl_getGamesWithPicks(week: number, userId: string, leagueId: string): Promise<GamblingLeagueGameWithPick[]>;
  
  gl_getPicks(leagueId: string, userId: string): Promise<GamblingLeaguePick[]>;
  gl_getPicksByUserLeagueWeek(userId: string, leagueId: string, week: number): Promise<GamblingLeaguePick[]>;
  gl_createPick(pick: InsertGamblingLeaguePick, userId: string): Promise<GamblingLeaguePick>;
  gl_updatePick(id: string, data: Partial<GamblingLeaguePick>): Promise<GamblingLeaguePick | undefined>;
  gl_deletePick(userId: string, leagueId: string, gameId: string): Promise<void>;
  
  gl_getMatchups(leagueId: string): Promise<GamblingLeagueMatchupWithUsers[]>;
  gl_getMatchupsByLeagueWeek(leagueId: string, week: number): Promise<GamblingLeagueMatchupWithUsers[]>;
  gl_createMatchup(matchup: InsertGamblingLeagueMatchup): Promise<GamblingLeagueMatchup>;
  gl_updateMatchupResult(id: string, data: { user1Npw?: number; user2Npw?: number; winnerId?: string | null; isComplete?: boolean }): Promise<GamblingLeagueMatchup | undefined>;
  
  gl_getLeagueStandings(leagueId: string): Promise<GamblingLeagueStandingEntry[]>;
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

  // Gambling League methods
  async gl_getLeagues(): Promise<GamblingLeagueLeague[]> {
    return await db.select().from(gamblingLeagueLeagues).orderBy(desc(gamblingLeagueLeagues.createdAt));
  }

  async gl_getLeague(id: string): Promise<GamblingLeagueLeague | undefined> {
    const [league] = await db.select().from(gamblingLeagueLeagues).where(eq(gamblingLeagueLeagues.id, id));
    return league || undefined;
  }

  async gl_createLeague(league: InsertGamblingLeagueLeague, creatorId: string): Promise<GamblingLeagueLeague> {
    const [newLeague] = await db.insert(gamblingLeagueLeagues).values({ ...league, creatorId }).returning();
    await db.insert(gamblingLeagueMembers).values({ leagueId: newLeague.id, userId: creatorId });
    return newLeague;
  }

  async gl_joinLeague(leagueId: string, userId: string): Promise<GamblingLeagueMember> {
    const [member] = await db.insert(gamblingLeagueMembers).values({ leagueId, userId }).returning();
    const members = await this.gl_getLeagueMembers(leagueId);
    const league = await this.gl_getLeague(leagueId);
    if (league && members.length >= league.capacity) {
      await db.update(gamblingLeagueLeagues).set({ status: 'full' }).where(eq(gamblingLeagueLeagues.id, leagueId));
    }
    return member;
  }

  async gl_getLeagueMembers(leagueId: string): Promise<(GamblingLeagueMember & { user: User })[]> {
    const members = await db.select().from(gamblingLeagueMembers).where(eq(gamblingLeagueMembers.leagueId, leagueId));
    const result: (GamblingLeagueMember & { user: User })[] = [];
    for (const member of members) {
      const user = await this.getUser(member.userId);
      if (user) {
        result.push({ ...member, user });
      }
    }
    return result;
  }

  async gl_getUserLeagues(userId: string): Promise<GamblingLeagueLeague[]> {
    const memberships = await db.select().from(gamblingLeagueMembers).where(eq(gamblingLeagueMembers.userId, userId));
    const leagues: GamblingLeagueLeague[] = [];
    for (const membership of memberships) {
      const league = await this.gl_getLeague(membership.leagueId);
      if (league) leagues.push(league);
    }
    return leagues;
  }

  async gl_updateLeagueStatus(id: string, status: string): Promise<GamblingLeagueLeague | undefined> {
    const [league] = await db.update(gamblingLeagueLeagues).set({ status }).where(eq(gamblingLeagueLeagues.id, id)).returning();
    return league || undefined;
  }

  async gl_updateLeagueWeek(id: string, week: number): Promise<GamblingLeagueLeague | undefined> {
    const [league] = await db.update(gamblingLeagueLeagues).set({ currentWeek: week }).where(eq(gamblingLeagueLeagues.id, id)).returning();
    return league || undefined;
  }

  async gl_getGames(): Promise<GamblingLeagueGame[]> {
    return await db.select().from(gamblingLeagueGames).orderBy(gamblingLeagueGames.gameTime);
  }

  async gl_getGamesByWeek(week: number): Promise<GamblingLeagueGame[]> {
    return await db.select().from(gamblingLeagueGames).where(eq(gamblingLeagueGames.week, week)).orderBy(gamblingLeagueGames.gameTime);
  }

  async gl_createGame(game: InsertGamblingLeagueGame): Promise<GamblingLeagueGame> {
    const [newGame] = await db.insert(gamblingLeagueGames).values({
      ...game,
      gameTime: new Date(game.gameTime),
      spread: String(game.spread),
    }).returning();
    return newGame;
  }

  async gl_updateGameResult(id: string, data: UpdateGamblingLeagueGameResult): Promise<GamblingLeagueGame | undefined> {
    const [game] = await db.update(gamblingLeagueGames).set({
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      isComplete: true,
    }).where(eq(gamblingLeagueGames.id, id)).returning();
    
    if (game) {
      const picks = await db.select().from(gamblingLeaguePicks).where(eq(gamblingLeaguePicks.gameId, id));
      const spread = parseFloat(game.spread);
      const homeMargin = data.homeScore - data.awayScore;
      const adjustedMargin = homeMargin + spread;
      
      for (const pick of picks) {
        let isCorrect: boolean | null = null;
        let isPush = false;
        
        if (adjustedMargin === 0) {
          isPush = true;
        } else if (pick.pickedTeam === 'home') {
          isCorrect = adjustedMargin > 0;
        } else {
          isCorrect = adjustedMargin < 0;
        }
        
        await db.update(gamblingLeaguePicks).set({ isCorrect, isPush }).where(eq(gamblingLeaguePicks.id, pick.id));
      }
    }
    
    return game || undefined;
  }

  async gl_getGamesWithPicks(week: number, userId: string, leagueId: string): Promise<GamblingLeagueGameWithPick[]> {
    const games = await this.gl_getGamesByWeek(week);
    const result: GamblingLeagueGameWithPick[] = [];
    
    for (const game of games) {
      const [pick] = await db.select().from(gamblingLeaguePicks).where(
        and(
          eq(gamblingLeaguePicks.gameId, game.id),
          eq(gamblingLeaguePicks.userId, userId),
          eq(gamblingLeaguePicks.leagueId, leagueId)
        )
      );
      result.push({ ...game, userPick: pick || null });
    }
    
    return result;
  }

  async gl_getPicks(leagueId: string, userId: string): Promise<GamblingLeaguePick[]> {
    return await db.select().from(gamblingLeaguePicks).where(
      and(eq(gamblingLeaguePicks.leagueId, leagueId), eq(gamblingLeaguePicks.userId, userId))
    );
  }

  async gl_getPicksByUserLeagueWeek(userId: string, leagueId: string, week: number): Promise<GamblingLeaguePick[]> {
    return await db.select().from(gamblingLeaguePicks).where(
      and(
        eq(gamblingLeaguePicks.userId, userId),
        eq(gamblingLeaguePicks.leagueId, leagueId),
        eq(gamblingLeaguePicks.week, week)
      )
    );
  }

  async gl_createPick(pick: InsertGamblingLeaguePick, userId: string): Promise<GamblingLeaguePick> {
    const [newPick] = await db.insert(gamblingLeaguePicks).values({ ...pick, userId }).returning();
    return newPick;
  }

  async gl_updatePick(id: string, data: Partial<GamblingLeaguePick>): Promise<GamblingLeaguePick | undefined> {
    const [pick] = await db.update(gamblingLeaguePicks).set(data).where(eq(gamblingLeaguePicks.id, id)).returning();
    return pick || undefined;
  }

  async gl_deletePick(userId: string, leagueId: string, gameId: string): Promise<void> {
    await db.delete(gamblingLeaguePicks).where(
      and(
        eq(gamblingLeaguePicks.userId, userId),
        eq(gamblingLeaguePicks.leagueId, leagueId),
        eq(gamblingLeaguePicks.gameId, gameId)
      )
    );
  }

  async gl_getMatchups(leagueId: string): Promise<GamblingLeagueMatchupWithUsers[]> {
    const matchups = await db.select().from(gamblingLeagueMatchups).where(eq(gamblingLeagueMatchups.leagueId, leagueId)).orderBy(asc(gamblingLeagueMatchups.week));
    const result: GamblingLeagueMatchupWithUsers[] = [];
    
    for (const matchup of matchups) {
      const user1 = await this.getUser(matchup.user1Id);
      const user2 = matchup.user2Id ? await this.getUser(matchup.user2Id) : null;
      const winner = matchup.winnerId ? await this.getUser(matchup.winnerId) : null;
      
      if (user1) {
        result.push({ ...matchup, user1, user2: user2 || null, winner: winner || null });
      }
    }
    
    return result;
  }

  async gl_getMatchupsByLeagueWeek(leagueId: string, week: number): Promise<GamblingLeagueMatchupWithUsers[]> {
    const matchups = await db.select().from(gamblingLeagueMatchups).where(
      and(eq(gamblingLeagueMatchups.leagueId, leagueId), eq(gamblingLeagueMatchups.week, week))
    );
    const result: GamblingLeagueMatchupWithUsers[] = [];
    
    for (const matchup of matchups) {
      const user1 = await this.getUser(matchup.user1Id);
      const user2 = matchup.user2Id ? await this.getUser(matchup.user2Id) : null;
      const winner = matchup.winnerId ? await this.getUser(matchup.winnerId) : null;
      
      if (user1) {
        result.push({ ...matchup, user1, user2: user2 || null, winner: winner || null });
      }
    }
    
    return result;
  }

  async gl_createMatchup(matchup: InsertGamblingLeagueMatchup): Promise<GamblingLeagueMatchup> {
    const [newMatchup] = await db.insert(gamblingLeagueMatchups).values(matchup).returning();
    return newMatchup;
  }

  async gl_updateMatchupResult(id: string, data: { user1Npw?: number; user2Npw?: number; winnerId?: string | null; isComplete?: boolean }): Promise<GamblingLeagueMatchup | undefined> {
    const [matchup] = await db.update(gamblingLeagueMatchups).set(data).where(eq(gamblingLeagueMatchups.id, id)).returning();
    return matchup || undefined;
  }

  async gl_getLeagueStandings(leagueId: string): Promise<GamblingLeagueStandingEntry[]> {
    const members = await this.gl_getLeagueMembers(leagueId);
    const matchups = await this.gl_getMatchups(leagueId);
    const allPicks = await db.select().from(gamblingLeaguePicks).where(eq(gamblingLeaguePicks.leagueId, leagueId));
    
    const standings: GamblingLeagueStandingEntry[] = [];
    
    for (const member of members) {
      const user = member.user;
      
      let wins = 0;
      let losses = 0;
      let draws = 0;
      let totalNpw = 0;
      
      for (const matchup of matchups) {
        if (!matchup.isComplete) continue;
        
        if (matchup.user1Id === user.id) {
          if (matchup.winnerId === user.id) wins++;
          else if (matchup.winnerId && matchup.winnerId !== user.id) losses++;
          else draws++;
          totalNpw += matchup.user1Npw || 0;
        } else if (matchup.user2Id === user.id) {
          if (matchup.winnerId === user.id) wins++;
          else if (matchup.winnerId && matchup.winnerId !== user.id) losses++;
          else draws++;
          totalNpw += matchup.user2Npw || 0;
        }
      }
      
      const userPicks = allPicks.filter(p => p.userId === user.id);
      const correctPicks = userPicks.filter(p => p.isCorrect === true).length;
      const totalPicks = userPicks.length;
      
      standings.push({
        userId: user.id,
        username: user.username,
        wins,
        losses,
        draws,
        totalNpw,
        correctPicks,
        totalPicks,
        pickPercentage: totalPicks > 0 ? Math.round((correctPicks / totalPicks) * 100) : 0,
      });
    }
    
    return standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.totalNpw !== a.totalNpw) return b.totalNpw - a.totalNpw;
      return b.pickPercentage - a.pickPercentage;
    });
  }
}

export const storage = new DatabaseStorage();

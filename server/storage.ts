// Database integration: blueprint:javascript_database
import { 
  appSettings,
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
  postseasonGames,
  postseasonPicks,
  golfGolfers,
  golfTournaments,
  golfTournamentGolfers,
  golfGolferScores,
  golfLeagues,
  golfLeagueMembers,
  golfDraftPicks,
  cfbTeams,
  cfbLeagues,
  cfbLeagueMembers,
  cfbDraftPicks,
  cfbRosters,
  cfbLineups,
  cfbGames,
  cfbMatchups,
  cfbTrades,
  cfbTransactions,
  POSTSEASON_ROUND_POINTS,
  POSTSEASON_ROUND_NAMES,
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
  type PostseasonGame,
  type InsertPostseasonGame,
  type PostseasonPick,
  type InsertPostseasonPick,
  type PostseasonGameWithPick,
  type PostseasonPickHistoryItem,
  type PostseasonLeaderboardEntry,
  type PostseasonUserStats,
  type PostseasonRound,
  type GolfGolfer,
  type InsertGolfGolfer,
  type UpdateGolfGolfer,
  type GolfTournament,
  type InsertGolfTournament,
  type GolfGolferScore,
  type GolfLeague,
  type InsertGolfLeague,
  type GolfLeagueMember,
  type GolfDraftPick,
  type GolfDraftPickWithDetails,
  type GolfDraftState,
  type GolfLeagueStandingEntry,
  type GolfLeagueDetail,
  type CfbTeam,
  type CfbLeague,
  type InsertCfbLeague,
  type CfbLeagueMember,
  type CfbDraftPick,
  type CfbRosterRow,
  type CfbLineupRow,
  type CfbGame,
  type CfbMatchup,
  type CfbTrade,
  type CfbDraftPickWithDetails,
  type CfbDraftState,
  type CfbLeagueDetail,
  type CfbRosterEntry,
  type CfbMatchupWithDetails,
  type CfbStandingEntry,
  type CfbTradeWithDetails,
} from "@shared/schema";
import { CFB_TEAM_SEED } from "./cfb-team-data";
import type { EspnCfbGame } from "./espn-cfb";
import { db } from "./db";
import { eq, and, gt, gte, sql, desc, asc, inArray, not } from "drizzle-orm";

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
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<Omit<User, "id">>): Promise<User | undefined>;
  setUserAdmin(userId: string, isAdmin: boolean): Promise<User | undefined>;
  getAllUsers(): Promise<Pick<User, "id" | "username" | "email">[]>;

  getPlatformOrder(): Promise<string[]>;
  setPlatformOrder(ids: string[]): Promise<void>;

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
  mm_getAllGames(userId?: string): Promise<MarchmadnessGameWithTeams[]>;
  
  // MarchMadness Pick methods
  mm_getPick(id: string): Promise<MarchmadnessPick | undefined>;
  mm_getPickByUserAndGame(userId: string, gameId: string): Promise<MarchmadnessPick | undefined>;
  mm_createPick(pick: InsertMarchmadnessPick & { visitorId: string }): Promise<MarchmadnessPick>;
  mm_updatePick(id: string, pickedTeamId: string): Promise<MarchmadnessPick | undefined>;
  mm_deletePick(id: string): Promise<void>;
  mm_getPicksByUser(userId: string): Promise<MarchmadnessPick[]>;
  mm_getPicksByGame(gameId: string): Promise<MarchmadnessPick[]>;
  mm_scorePicksForGame(gameId: string, winningTeamId: string, pointValue: number): Promise<void>;
  
  // MarchMadness Leaderboard
  mm_getLeaderboard(): Promise<MarchmadnessLeaderboardEntry[]>;
  mm_getUserStats(userId: string): Promise<MarchmadnessUserStats | undefined>;
  
  // MarchMadness initialization
  mm_initializeRounds(): Promise<void>;
  
  // Gambling League methods
  gl_getLeagues(): Promise<GamblingLeagueLeague[]>;
  gl_getLeague(id: string): Promise<GamblingLeagueLeague | undefined>;
  gl_getLeagueByJoinCode(code: string): Promise<GamblingLeagueLeague | undefined>;
  gl_createLeague(league: InsertGamblingLeagueLeague, creatorId: string): Promise<GamblingLeagueLeague>;
  gl_joinLeague(leagueId: string, userId: string): Promise<GamblingLeagueMember>;
  gl_getLeagueMembers(leagueId: string): Promise<(GamblingLeagueMember & { user: User })[]>;
  gl_getUserLeagues(userId: string): Promise<GamblingLeagueLeague[]>;
  gl_updateLeagueStatus(id: string, status: string): Promise<GamblingLeagueLeague | undefined>;
  gl_updateLeagueWeek(id: string, week: number): Promise<GamblingLeagueLeague | undefined>;
  
  gl_getGames(): Promise<GamblingLeagueGame[]>;
  gl_getGame(id: string): Promise<GamblingLeagueGame | undefined>;
  gl_getGamesByWeek(week: number): Promise<GamblingLeagueGame[]>;
  gl_createGame(game: InsertGamblingLeagueGame): Promise<GamblingLeagueGame>;
  gl_updateGameResult(id: string, data: UpdateGamblingLeagueGameResult): Promise<GamblingLeagueGame | undefined>;
  gl_getGamesWithPicks(week: number, userId: string, leagueId: string): Promise<GamblingLeagueGameWithPick[]>;
  
  gl_getPicks(leagueId: string, userId: string): Promise<GamblingLeaguePick[]>;
  gl_getPicksByUserLeagueWeek(userId: string, leagueId: string, week: number): Promise<GamblingLeaguePick[]>;
  gl_createPick(pick: InsertGamblingLeaguePick, userId: string): Promise<GamblingLeaguePick>;
  gl_updatePick(id: string, data: Partial<GamblingLeaguePick>): Promise<GamblingLeaguePick | undefined>;
  gl_deletePick(userId: string, leagueId: string, gameId: string): Promise<void>;
  
  gl_getMatchupById(id: string): Promise<GamblingLeagueMatchup | undefined>;
  gl_getMatchups(leagueId: string): Promise<GamblingLeagueMatchupWithUsers[]>;
  gl_getMatchupsByLeagueWeek(leagueId: string, week: number): Promise<GamblingLeagueMatchupWithUsers[]>;
  gl_createMatchup(matchup: InsertGamblingLeagueMatchup): Promise<GamblingLeagueMatchup>;
  gl_updateMatchupResult(id: string, data: { user1Npw?: number; user2Npw?: number; winnerId?: string | null; isComplete?: boolean }): Promise<GamblingLeagueMatchup | undefined>;
  gl_startSeason(leagueId: string): Promise<void>;
  gl_finalizeWeek(leagueId: string, week: number): Promise<{ currentWeek: number; status: string }>;
  gl_getChampion(leagueId: string): Promise<User | null>;
  
  gl_getLeagueStandings(leagueId: string): Promise<GamblingLeagueStandingEntry[]>;
  gl_getProjectedSeeds(leagueId: string): Promise<{ userId: string; username: string; wins: number; npw: number }[]>;
  
  // PostseasonATS methods
  ps_getGames(): Promise<PostseasonGame[]>;
  ps_getGamesByRound(round: string): Promise<PostseasonGame[]>;
  ps_getGame(id: string): Promise<PostseasonGame | undefined>;
  ps_getGamesWithPicks(userId?: string): Promise<PostseasonGameWithPick[]>;
  ps_createGame(game: InsertPostseasonGame): Promise<PostseasonGame>;
  ps_updateGame(id: string, data: Partial<PostseasonGame>): Promise<PostseasonGame | undefined>;
  ps_updateGameResult(id: string, homeScore: number, awayScore: number): Promise<PostseasonGame | undefined>;
  ps_deleteGame(id: string): Promise<void>;
  
  ps_getPicks(): Promise<PostseasonPick[]>;
  ps_getPicksByUser(userId: string): Promise<PostseasonPick[]>;
  ps_getPickByUserAndGame(userId: string, gameId: string): Promise<PostseasonPick | undefined>;
  ps_createPick(pick: InsertPostseasonPick & { userId: string }): Promise<PostseasonPick>;
  ps_updatePick(id: string, selectedTeam: string): Promise<PostseasonPick | undefined>;
  ps_deletePick(id: string): Promise<void>;
  
  ps_getLeaderboard(): Promise<PostseasonLeaderboardEntry[]>;
  ps_getPickHistory(userId: string): Promise<PostseasonPickHistoryItem[]>;
  ps_getUserStats(userId: string): Promise<PostseasonUserStats | undefined>;

  // Golf Fantasy methods
  golf_seedGolfersIfEmpty(): Promise<void>;
  golf_getGolfers(params?: { tournamentId?: string; excludeTournamentId?: string }): Promise<GolfGolfer[]>;
  golf_getGolfer(id: string): Promise<GolfGolfer | undefined>;
  golf_findGolferBySdioId(sdioPlayerId: number): Promise<GolfGolfer | undefined>;
  golf_findGolferByName(firstName: string, lastName: string): Promise<GolfGolfer | undefined>;
  golf_createGolfer(data: InsertGolfGolfer): Promise<GolfGolfer>;
  golf_updateGolfer(id: string, data: UpdateGolfGolfer): Promise<GolfGolfer | undefined>;
  golf_mergeDuplicateGolfers(): Promise<number>;

  golf_getTournaments(): Promise<GolfTournament[]>;
  golf_getTournament(id: string): Promise<GolfTournament | undefined>;
  golf_createTournament(data: InsertGolfTournament): Promise<GolfTournament>;
  golf_updateTournamentStatus(id: string, status: string): Promise<GolfTournament | undefined>;
  golf_updateTournament(id: string, data: Partial<Pick<GolfTournament, 'status' | 'sdioTournamentId'>>): Promise<GolfTournament | undefined>;
  golf_getTournamentGolfers(tournamentId: string): Promise<GolfGolfer[]>;
  golf_addGolferToTournament(tournamentId: string, golferId: string): Promise<void>;
  golf_removeGolferFromTournament(tournamentId: string, golferId: string): Promise<void>;

  golf_upsertScore(tournamentId: string, golferId: string, round: number, score: number, position?: string | null): Promise<GolfGolferScore>;
  golf_deleteScore(tournamentId: string, golferId: string, round: number): Promise<void>;
  golf_getScores(tournamentId: string): Promise<GolfGolferScore[]>;
  golf_getLastScoreUpdated(tournamentId: string): Promise<Date | null>;

  golf_createLeague(data: InsertGolfLeague, commissionerId: string): Promise<GolfLeague>;
  golf_getLeague(id: string): Promise<GolfLeague | undefined>;
  golf_getLeagueDetail(id: string): Promise<GolfLeagueDetail | undefined>;
  golf_getUserLeagues(userId: string): Promise<(GolfLeague & { tournament: GolfTournament })[]>;
  golf_getAllLeagues(): Promise<(GolfLeague & { tournament: GolfTournament })[]>;
  golf_getLeagueByJoinCode(code: string): Promise<GolfLeague | undefined>;
  golf_updateLeague(id: string, data: Partial<Pick<GolfLeague, 'draftStatus' | 'draftOrder'>>): Promise<GolfLeague | undefined>;
  golf_isLeagueMember(leagueId: string, userId: string): Promise<boolean>;
  golf_getLeagueMembers(leagueId: string): Promise<(GolfLeagueMember & { user: { id: string; username: string } })[]>;
  golf_addLeagueMember(leagueId: string, userId: string): Promise<GolfLeagueMember>;

  golf_getDraftState(leagueId: string): Promise<GolfDraftState | undefined>;
  golf_submitDraftPick(leagueId: string, userId: string, golferId: string): Promise<GolfDraftPick>;
  golf_getDraftPicks(leagueId: string): Promise<GolfDraftPickWithDetails[]>;

  golf_getLeagueStandings(leagueId: string): Promise<GolfLeagueStandingEntry[]>;

  // CFB Conferences methods
  cfb_seedTeamsIfEmpty(): Promise<void>;
  cfb_getTeams(): Promise<CfbTeam[]>;
  cfb_getTeam(id: string): Promise<CfbTeam | undefined>;

  cfb_createLeague(data: InsertCfbLeague, commissionerId: string, season: number): Promise<CfbLeague>;
  cfb_getLeague(id: string): Promise<CfbLeague | undefined>;
  cfb_getLeagueDetail(id: string): Promise<CfbLeagueDetail | undefined>;
  cfb_getUserLeagues(userId: string): Promise<CfbLeague[]>;
  cfb_getAllLeagues(): Promise<CfbLeague[]>;
  cfb_getLeagueByJoinCode(code: string): Promise<CfbLeague | undefined>;
  cfb_updateLeague(id: string, data: Partial<Pick<CfbLeague, 'draftStatus' | 'draftOrder' | 'currentWeek'>>): Promise<CfbLeague | undefined>;
  cfb_isLeagueMember(leagueId: string, userId: string): Promise<boolean>;
  cfb_getLeagueMembers(leagueId: string): Promise<(CfbLeagueMember & { user: { id: string; username: string } })[]>;
  cfb_addLeagueMember(leagueId: string, userId: string): Promise<CfbLeagueMember>;

  cfb_getDraftState(leagueId: string): Promise<CfbDraftState | undefined>;
  cfb_submitDraftPick(leagueId: string, userId: string, teamId: string): Promise<CfbDraftPick>;

  cfb_getRosterRows(leagueId: string, userId?: string): Promise<CfbRosterRow[]>;
  cfb_getRosterEntries(leagueId: string, userId: string): Promise<CfbRosterEntry[]>;
  cfb_getFreeAgents(leagueId: string): Promise<CfbTeam[]>;
  cfb_claimFreeAgent(leagueId: string, userId: string, addTeamId: string, dropTeamId: string): Promise<void>;

  cfb_getLineup(leagueId: string, userId: string, week: number): Promise<CfbLineupRow[]>;
  cfb_setLineup(leagueId: string, userId: string, week: number, teamIds: string[]): Promise<void>;

  cfb_upsertGames(games: EspnCfbGame[]): Promise<number>;
  cfb_getGamesByWeek(season: number, week: number): Promise<CfbGame[]>;

  cfb_getMatchups(leagueId: string, week?: number): Promise<CfbMatchup[]>;
  cfb_getMatchupsWithDetails(leagueId: string, week: number): Promise<CfbMatchupWithDetails[]>;
  cfb_finalizeWeek(leagueId: string, week: number): Promise<void>;

  cfb_getTrades(leagueId: string): Promise<CfbTradeWithDetails[]>;
  cfb_createTrade(leagueId: string, proposerId: string, receiverId: string, proposerTeamIds: string[], receiverTeamIds: string[]): Promise<CfbTrade>;
  cfb_respondTrade(leagueId: string, tradeId: string, userId: string, action: 'accept' | 'reject' | 'cancel'): Promise<CfbTrade>;

  cfb_getStandings(leagueId: string): Promise<CfbStandingEntry[]>;
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
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

  async setUserAdmin(userId: string, isAdmin: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isAdmin })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<Pick<User, "id" | "username" | "email">[]> {
    return db.select({ id: users.id, username: users.username, email: users.email })
      .from(users)
      .orderBy(users.username);
  }

  async getPlatformOrder(): Promise<string[]> {
    const rows = await db.select().from(appSettings).where(sql`key = 'platform_order'`);
    if (!rows.length) return [];
    try { return JSON.parse(rows[0].value); } catch { return []; }
  }

  async setPlatformOrder(ids: string[]): Promise<void> {
    await db.insert(appSettings)
      .values({ key: "platform_order", value: JSON.stringify(ids) })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: JSON.stringify(ids) } });
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

  async mm_getAllGames(userId?: string): Promise<MarchmadnessGameWithTeams[]> {
    const games = await db.select().from(marchmadnessGames).orderBy(marchmadnessGames.startTime);
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

  async mm_getPicksByGame(gameId: string): Promise<MarchmadnessPick[]> {
    return await db.select().from(marchmadnessPicks).where(eq(marchmadnessPicks.gameId, gameId));
  }

  async mm_scorePicksForGame(gameId: string, winningTeamId: string, pointValue: number): Promise<void> {
    await db.transaction(async (tx) => {
      const picks = await tx.select().from(marchmadnessPicks).where(eq(marchmadnessPicks.gameId, gameId));
      for (const pick of picks) {
        const isCorrect = pick.pickedTeamId === winningTeamId;
        const pointsEarned = isCorrect ? pointValue : 0;
        await tx.update(marchmadnessPicks)
          .set({ isCorrect, pointsEarned })
          .where(eq(marchmadnessPicks.id, pick.id));
      }
    });
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

  async gl_getLeagueByJoinCode(code: string): Promise<GamblingLeagueLeague | undefined> {
    const [league] = await db.select().from(gamblingLeagueLeagues).where(eq(gamblingLeagueLeagues.joinCode, code.toUpperCase()));
    return league || undefined;
  }

  async gl_createLeague(league: InsertGamblingLeagueLeague, creatorId: string): Promise<GamblingLeagueLeague> {
    let joinCode = this.generateJoinCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await this.gl_getLeagueByJoinCode(joinCode);
      if (!existing) break;
      joinCode = this.generateJoinCode();
      attempts++;
    }
    const [newLeague] = await db.insert(gamblingLeagueLeagues).values({ ...league, creatorId, joinCode }).returning();
    await db.insert(gamblingLeagueMembers).values({ leagueId: newLeague.id, userId: creatorId });
    return newLeague;
  }

  async gl_joinLeague(leagueId: string, userId: string): Promise<GamblingLeagueMember> {
    const { member, becameFull } = await db.transaction(async (tx) => {
      // Lock the league row so concurrent joins serialize on capacity
      const [league] = await tx.select().from(gamblingLeagueLeagues)
        .where(eq(gamblingLeagueLeagues.id, leagueId))
        .for('update');
      if (!league) throw new Error("League not found");
      if (league.status !== 'open') throw new Error("This league is not open for new members");

      const members = await tx.select().from(gamblingLeagueMembers)
        .where(eq(gamblingLeagueMembers.leagueId, leagueId));
      if (members.length >= league.capacity) throw new Error("This league is full");

      const [member] = await tx.insert(gamblingLeagueMembers).values({ leagueId, userId }).returning();

      let becameFull = false;
      if (members.length + 1 >= league.capacity) {
        await tx.update(gamblingLeagueLeagues).set({ status: 'full' })
          .where(eq(gamblingLeagueLeagues.id, leagueId));
        becameFull = true;
      }
      return { member, becameFull };
    });

    // Auto-start the season once the league fills (gl_startSeason has its own
    // conditional claim, so duplicate starts are safely rejected)
    if (becameFull) {
      await this.gl_startSeason(leagueId);
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

  async gl_getGame(id: string): Promise<GamblingLeagueGame | undefined> {
    const [game] = await db.select().from(gamblingLeagueGames).where(eq(gamblingLeagueGames.id, id));
    return game;
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

  async gl_getMatchupById(id: string): Promise<GamblingLeagueMatchup | undefined> {
    const [matchup] = await db.select().from(gamblingLeagueMatchups).where(eq(gamblingLeagueMatchups.id, id));
    return matchup;
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

  static readonly GL_REGULAR_SEASON_WEEKS = 14;
  static readonly GL_PLAYOFF_TEAMS = 6;

  /**
   * Generates the 14-week regular-season schedule using the circle method,
   * shuffles member order with Fisher-Yates, and sets the league to 'active'.
   * Odd member counts get a weekly bye (user2Id = null).
   *
   * Leagues with up to 14 members complete a full round robin within the 14
   * weeks (opponents repeat once the cycle wraps). Leagues with 15+ members
   * play a balanced partial schedule: 14 distinct rounds of the round robin,
   * so everyone plays every week and faces each opponent at most once, but
   * not every pairing occurs within the 14-week season.
   */
  async gl_startSeason(leagueId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Lock the league row so joins (which also lock it) serialize with the
      // member snapshot + activation, preventing a member from joining
      // between schedule generation and season start.
      const [league] = await tx.select().from(gamblingLeagueLeagues)
        .where(eq(gamblingLeagueLeagues.id, leagueId))
        .for('update');
      if (!league) throw new Error("League not found");
      if (league.status !== 'open' && league.status !== 'full') {
        throw new Error("Season has already started");
      }
      const members = await tx.select().from(gamblingLeagueMembers)
        .where(eq(gamblingLeagueMembers.leagueId, leagueId));
      if (members.length < 2) throw new Error("Need at least 2 members to start a season");

      const values = DatabaseStorage.gl_buildSchedule(leagueId, members.map(m => m.userId));
      await tx.update(gamblingLeagueLeagues).set({ status: 'active' })
        .where(eq(gamblingLeagueLeagues.id, leagueId));
      await tx.insert(gamblingLeagueMatchups).values(values);
    });
  }

  /** Builds the 14-week schedule (circle method, Fisher-Yates shuffled). */
  private static gl_buildSchedule(leagueId: string, memberIds: string[]): InsertGamblingLeagueMatchup[] {
    const ids: (string | null)[] = [...memberIds];
    // Fisher-Yates shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    if (ids.length % 2 === 1) ids.push(null); // bye slot

    const n = ids.length;
    const rounds = n - 1;
    const values: InsertGamblingLeagueMatchup[] = [];
    // Circle method: fix ids[0], rotate the rest
    const rotation = ids.slice(1);
    for (let week = 1; week <= DatabaseStorage.GL_REGULAR_SEASON_WEEKS; week++) {
      const round = (week - 1) % rounds;
      const arr = [ids[0], ...rotation.slice(rotation.length - round), ...rotation.slice(0, rotation.length - round)];
      for (let i = 0; i < n / 2; i++) {
        const a = arr[i];
        const b = arr[n - 1 - i];
        if (a === null && b === null) continue;
        const user1Id = (a ?? b)!;
        const user2Id = a === null || b === null ? null : b;
        values.push({ leagueId, week, user1Id, user2Id });
      }
    }

    return values;
  }

  /** Net picks won for a user in a week: correct picks minus incorrect (pushes excluded). */
  private async gl_netPicksWon(leagueId: string, userId: string, week: number): Promise<number> {
    const picks = await this.gl_getPicksByUserLeagueWeek(userId, leagueId, week);
    let net = 0;
    for (const p of picks) {
      if (p.isPush) continue;
      if (p.isCorrect === true) net++;
      else if (p.isCorrect === false) net--;
    }
    return net;
  }

  /** Playoff seeds: regular-season standings order (wins, then total NPW). */
  private async gl_getPlayoffSeeds(leagueId: string, dbc: Pick<typeof db, 'select' | 'insert' | 'update'> = db): Promise<string[]> {
    const members = await this.gl_getLeagueMembers(leagueId);
    const matchups = (await dbc.select().from(gamblingLeagueMatchups)
      .where(eq(gamblingLeagueMatchups.leagueId, leagueId)))
      .filter(m => !m.isPlayoff && m.isComplete);
    const rows = members.map(member => {
      let wins = 0, npw = 0;
      for (const m of matchups) {
        if (m.user1Id === member.userId) {
          if (m.winnerId === member.userId) wins++;
          npw += m.user1Npw || 0;
        } else if (m.user2Id === member.userId) {
          if (m.winnerId === member.userId) wins++;
          npw += m.user2Npw || 0;
        }
      }
      return { userId: member.userId, wins, npw };
    });
    // Deterministic final tiebreaker: stable userId ordering
    rows.sort((a, b) => b.wins - a.wins || b.npw - a.npw || a.userId.localeCompare(b.userId));
    return rows.map(r => r.userId);
  }

  /**
   * Projected playoff seeding "as of now": same computation and tiebreaks as
   * gl_getPlayoffSeeds (wins, then total NPW, then stable userId), with
   * display info attached. Used for the pre-playoffs projected bracket.
   */
  async gl_getProjectedSeeds(leagueId: string): Promise<{ userId: string; username: string; wins: number; npw: number }[]> {
    const members = await this.gl_getLeagueMembers(leagueId);
    const order = await this.gl_getPlayoffSeeds(leagueId);
    const byId = new Map(members.map(m => [m.userId, m]));
    const matchups = (await db.select().from(gamblingLeagueMatchups)
      .where(eq(gamblingLeagueMatchups.leagueId, leagueId)))
      .filter(m => !m.isPlayoff && m.isComplete);
    return order.map(userId => {
      let wins = 0, npw = 0;
      for (const m of matchups) {
        if (m.user1Id === userId) {
          if (m.winnerId === userId) wins++;
          npw += m.user1Npw || 0;
        } else if (m.user2Id === userId) {
          if (m.winnerId === userId) wins++;
          npw += m.user2Npw || 0;
        }
      }
      return { userId, username: byId.get(userId)?.user.username ?? "Unknown", wins, npw };
    });
  }

  /**
   * Scores all matchups for the given week from graded picks, advances the
   * week, and generates playoff rounds entering weeks 15-17. Playoff ties go
   * to the higher seed. After the championship week the league is completed.
   */
  async gl_finalizeWeek(leagueId: string, week: number): Promise<{ currentWeek: number; status: string }> {
    const league = await this.gl_getLeague(leagueId);
    if (!league) throw new Error("League not found");
    if (league.status !== 'active') throw new Error("Season is not active");
    if (week !== league.currentWeek) throw new Error(`Current week is ${league.currentWeek}, not ${week}`);

    const matchups = await this.gl_getMatchupsByLeagueWeek(leagueId, week);

    // Only require graded games when this league actually has matchups to
    // score this week (e.g. small leagues have empty playoff bye weeks)
    if (matchups.some(m => !m.isComplete)) {
      const weekGames = await this.gl_getGamesByWeek(week);
      if (weekGames.some(g => !g.isComplete)) {
        throw new Error("All games for this week must have results before finalizing");
      }
    }
    const seeds = week > DatabaseStorage.GL_REGULAR_SEASON_WEEKS
      ? await this.gl_getPlayoffSeeds(leagueId)
      : null;

    // Precompute NPW outside the transaction (reads graded picks only)
    const scored: { id: string; user1Npw: number; user2Npw: number; winnerId: string | null }[] = [];
    for (const m of matchups) {
      if (m.isComplete) continue;
      const user1Npw = await this.gl_netPicksWon(leagueId, m.user1Id, week);
      const user2Npw = m.user2Id ? await this.gl_netPicksWon(leagueId, m.user2Id, week) : 0;

      let winnerId: string | null = null;
      if (!m.user2Id) {
        winnerId = m.user1Id; // bye week counts as a win
      } else if (user1Npw > user2Npw) {
        winnerId = m.user1Id;
      } else if (user2Npw > user1Npw) {
        winnerId = m.user2Id;
      } else if (m.isPlayoff && seeds) {
        const seed1 = seeds.indexOf(m.user1Id);
        const seed2 = seeds.indexOf(m.user2Id);
        winnerId = seed1 <= seed2 ? m.user1Id : m.user2Id;
      }
      scored.push({ id: m.id, user1Npw, user2Npw, winnerId });
    }

    const nextWeek = week + 1;
    const isChampionshipWeek = week === DatabaseStorage.GL_REGULAR_SEASON_WEEKS + 3;
    const status = isChampionshipWeek ? 'completed' : league.status;

    await db.transaction(async (tx) => {
      // Conditional week advance guards against concurrent finalizations
      const claimed = await tx.update(gamblingLeagueLeagues)
        .set({ currentWeek: nextWeek, ...(isChampionshipWeek ? { status: 'completed' } : {}) })
        .where(and(
          eq(gamblingLeagueLeagues.id, leagueId),
          eq(gamblingLeagueLeagues.currentWeek, week),
          eq(gamblingLeagueLeagues.status, 'active')
        ))
        .returning();
      if (claimed.length === 0) throw new Error(`Week ${week} was already finalized`);

      for (const s of scored) {
        await tx.update(gamblingLeagueMatchups).set({
          user1Npw: s.user1Npw, user2Npw: s.user2Npw, winnerId: s.winnerId, isComplete: true,
        }).where(eq(gamblingLeagueMatchups.id, s.id));
      }

      if (!isChampionshipWeek) {
        if (nextWeek === 15) await this.gl_generateQuarterfinals(leagueId, tx);
        else if (nextWeek === 16) await this.gl_generateSemifinals(leagueId, tx);
        else if (nextWeek === 17) await this.gl_generateChampionship(leagueId, tx);
      }
    });

    return { currentWeek: nextWeek, status };
  }

  private async gl_getPlayoffMatchupsByWeek(leagueId: string, week: number, dbc: Pick<typeof db, 'select' | 'insert' | 'update'>) {
    return dbc.select().from(gamblingLeagueMatchups).where(and(
      eq(gamblingLeagueMatchups.leagueId, leagueId),
      eq(gamblingLeagueMatchups.week, week)
    ));
  }

  private async gl_generateQuarterfinals(leagueId: string, dbc: Pick<typeof db, 'select' | 'insert' | 'update'> = db): Promise<void> {
    const seeds = await this.gl_getPlayoffSeeds(leagueId, dbc);
    if (seeds.length < DatabaseStorage.GL_PLAYOFF_TEAMS) return;
    const existing = await this.gl_getPlayoffMatchupsByWeek(leagueId, 15, dbc);
    if (existing.length > 0) return;
    await dbc.insert(gamblingLeagueMatchups).values([
      { leagueId, week: 15, user1Id: seeds[2], user2Id: seeds[5], isPlayoff: true, playoffRound: "quarterfinal" },
      { leagueId, week: 15, user1Id: seeds[3], user2Id: seeds[4], isPlayoff: true, playoffRound: "quarterfinal" },
    ]);
  }

  private async gl_generateSemifinals(leagueId: string, dbc: Pick<typeof db, 'select' | 'insert' | 'update'> = db): Promise<void> {
    const seeds = await this.gl_getPlayoffSeeds(leagueId, dbc);
    const existing = await this.gl_getPlayoffMatchupsByWeek(leagueId, 16, dbc);
    if (existing.length > 0) return;

    if (seeds.length >= DatabaseStorage.GL_PLAYOFF_TEAMS) {
      const qf = (await this.gl_getPlayoffMatchupsByWeek(leagueId, 15, dbc)).filter(m => m.isPlayoff && m.isComplete);
      if (qf.length < 2) return;
      const winners = qf.map(m => m.winnerId).filter((id): id is string => !!id);
      winners.sort((a, b) => seeds.indexOf(a) - seeds.indexOf(b));
      await dbc.insert(gamblingLeagueMatchups).values([
        { leagueId, week: 16, user1Id: seeds[0], user2Id: winners[1] ?? null, isPlayoff: true, playoffRound: "semifinal" },
        { leagueId, week: 16, user1Id: seeds[1], user2Id: winners[0] ?? null, isPlayoff: true, playoffRound: "semifinal" },
      ]);
    } else if (seeds.length >= 4) {
      // 4-5 members: no quarterfinals, straight to semis (1v4, 2v3)
      await dbc.insert(gamblingLeagueMatchups).values([
        { leagueId, week: 16, user1Id: seeds[0], user2Id: seeds[3], isPlayoff: true, playoffRound: "semifinal" },
        { leagueId, week: 16, user1Id: seeds[1], user2Id: seeds[2], isPlayoff: true, playoffRound: "semifinal" },
      ]);
    }
    // 2-3 members: straight to the championship
  }

  private async gl_generateChampionship(leagueId: string, dbc: Pick<typeof db, 'select' | 'insert' | 'update'> = db): Promise<void> {
    const existing = await this.gl_getPlayoffMatchupsByWeek(leagueId, 17, dbc);
    if (existing.length > 0) return;
    const seeds = await this.gl_getPlayoffSeeds(leagueId, dbc);

    if (seeds.length >= 4) {
      const sf = (await this.gl_getPlayoffMatchupsByWeek(leagueId, 16, dbc)).filter(m => m.isPlayoff && m.isComplete);
      if (sf.length < 2) return;
      const winners = sf.map(m => m.winnerId).filter((id): id is string => !!id);
      if (winners.length < 2) return;
      await dbc.insert(gamblingLeagueMatchups).values([
        { leagueId, week: 17, user1Id: winners[0], user2Id: winners[1], isPlayoff: true, playoffRound: "championship" },
      ]);
    } else if (seeds.length >= 2) {
      await dbc.insert(gamblingLeagueMatchups).values([
        { leagueId, week: 17, user1Id: seeds[0], user2Id: seeds[1], isPlayoff: true, playoffRound: "championship" },
      ]);
    }
  }

  async gl_getChampion(leagueId: string): Promise<User | null> {
    const [champ] = await db.select().from(gamblingLeagueMatchups).where(
      and(
        eq(gamblingLeagueMatchups.leagueId, leagueId),
        eq(gamblingLeagueMatchups.isComplete, true),
        eq(gamblingLeagueMatchups.playoffRound, "championship")
      )
    );
    if (!champ?.winnerId) return null;
    return (await this.getUser(champ.winnerId)) || null;
  }

  async gl_getLeagueStandings(leagueId: string): Promise<GamblingLeagueStandingEntry[]> {
    const members = await this.gl_getLeagueMembers(leagueId);
    // Standings reflect the regular season only; playoff matchups are excluded
    const matchups = (await this.gl_getMatchups(leagueId)).filter(m => !m.isPlayoff);
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

  // PostseasonATS methods
  async ps_getGames(): Promise<PostseasonGame[]> {
    return await db.select().from(postseasonGames).orderBy(asc(postseasonGames.gameDate));
  }

  async ps_getGamesByRound(round: string): Promise<PostseasonGame[]> {
    return await db.select().from(postseasonGames).where(eq(postseasonGames.round, round)).orderBy(asc(postseasonGames.gameDate));
  }

  async ps_getGame(id: string): Promise<PostseasonGame | undefined> {
    const [game] = await db.select().from(postseasonGames).where(eq(postseasonGames.id, id));
    return game || undefined;
  }

  async ps_getGamesWithPicks(userId?: string): Promise<PostseasonGameWithPick[]> {
    const games = await this.ps_getGames();
    const result: PostseasonGameWithPick[] = [];

    for (const game of games) {
      let userPick: PostseasonPick | null = null;
      if (userId) {
        const pick = await this.ps_getPickByUserAndGame(userId, game.id);
        userPick = pick || null;
      }
      result.push({ ...game, userPick });
    }

    return result;
  }

  async ps_createGame(game: InsertPostseasonGame): Promise<PostseasonGame> {
    const [newGame] = await db.insert(postseasonGames).values({
      ...game,
      spread: String(game.spread),
    }).returning();
    return newGame;
  }

  async ps_updateGame(id: string, data: Partial<PostseasonGame>): Promise<PostseasonGame | undefined> {
    const updateData: Record<string, unknown> = { ...data };
    if (data.spread !== undefined) {
      updateData.spread = String(data.spread);
    }
    const [game] = await db.update(postseasonGames).set(updateData).where(eq(postseasonGames.id, id)).returning();
    return game || undefined;
  }

  async ps_updateGameResult(id: string, homeScore: number, awayScore: number): Promise<PostseasonGame | undefined> {
    const game = await this.ps_getGame(id);
    if (!game) return undefined;

    const spread = parseFloat(game.spread);
    const favoredTeam = game.favoredTeam;
    
    let winner: string;
    let margin: number;
    
    if (favoredTeam === 'HOME') {
      margin = homeScore - awayScore + spread;
    } else {
      margin = awayScore - homeScore + spread;
    }
    
    if (margin > 0) {
      winner = favoredTeam === 'HOME' ? game.homeTeam : game.awayTeam;
    } else if (margin < 0) {
      winner = favoredTeam === 'HOME' ? game.awayTeam : game.homeTeam;
    } else {
      winner = 'PUSH';
    }

    const [updatedGame] = await db.update(postseasonGames).set({
      homeScore,
      awayScore,
      isComplete: true,
      winner,
    }).where(eq(postseasonGames.id, id)).returning();

    if (updatedGame) {
      const picks = await db.select().from(postseasonPicks).where(eq(postseasonPicks.gameId, id));
      const roundPoints = POSTSEASON_ROUND_POINTS[updatedGame.round as PostseasonRound] || 0;

      for (const pick of picks) {
        let isCorrect: boolean | null = null;
        let pointsEarned = 0;

        if (winner === 'PUSH') {
          isCorrect = null;
          pointsEarned = 0;
        } else if (pick.selectedTeam === winner) {
          isCorrect = true;
          pointsEarned = roundPoints;
        } else {
          isCorrect = false;
          pointsEarned = 0;
        }

        await db.update(postseasonPicks).set({ isCorrect, pointsEarned }).where(eq(postseasonPicks.id, pick.id));
      }
    }

    return updatedGame || undefined;
  }

  async ps_deleteGame(id: string): Promise<void> {
    await db.delete(postseasonGames).where(eq(postseasonGames.id, id));
  }

  async ps_getPicks(): Promise<PostseasonPick[]> {
    return await db.select().from(postseasonPicks);
  }

  async ps_getPicksByUser(userId: string): Promise<PostseasonPick[]> {
    return await db.select().from(postseasonPicks).where(eq(postseasonPicks.userId, userId));
  }

  async ps_getPickByUserAndGame(userId: string, gameId: string): Promise<PostseasonPick | undefined> {
    const [pick] = await db.select().from(postseasonPicks).where(
      and(eq(postseasonPicks.userId, userId), eq(postseasonPicks.gameId, gameId))
    );
    return pick || undefined;
  }

  async ps_createPick(pick: InsertPostseasonPick & { userId: string }): Promise<PostseasonPick> {
    const [newPick] = await db.insert(postseasonPicks).values(pick).returning();
    return newPick;
  }

  async ps_updatePick(id: string, selectedTeam: string): Promise<PostseasonPick | undefined> {
    const [pick] = await db.update(postseasonPicks).set({ selectedTeam }).where(eq(postseasonPicks.id, id)).returning();
    return pick || undefined;
  }

  async ps_deletePick(id: string): Promise<void> {
    await db.delete(postseasonPicks).where(eq(postseasonPicks.id, id));
  }

  async ps_getLeaderboard(): Promise<PostseasonLeaderboardEntry[]> {
    const allUsers = await db.select().from(users);
    const allPicks = await db.select().from(postseasonPicks);
    const allGames = await db.select().from(postseasonGames);

    const leaderboard: PostseasonLeaderboardEntry[] = [];

    for (const user of allUsers) {
      const userPicks = allPicks.filter(p => p.userId === user.id);
      if (userPicks.length === 0) continue;

      const correctPicks = userPicks.filter(p => p.isCorrect === true).length;
      const totalPoints = userPicks.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
      
      let maxPossible = 0;
      let remaining = 0;
      
      for (const game of allGames) {
        const roundPoints = POSTSEASON_ROUND_POINTS[game.round as PostseasonRound] || 0;
        const hasPick = userPicks.some(p => p.gameId === game.id);
        
        if (game.isComplete) {
          if (hasPick) {
            maxPossible += roundPoints;
          }
        } else {
          if (hasPick) {
            remaining += roundPoints;
          }
        }
      }

      leaderboard.push({
        userId: user.id,
        username: user.username,
        totalPoints,
        correctPicks,
        totalPicks: userPicks.length,
        maxPossible: maxPossible + totalPoints,
        remaining,
      });
    }

    return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  }

  async ps_getPickHistory(userId: string): Promise<PostseasonPickHistoryItem[]> {
    const picks = await this.ps_getPicksByUser(userId);
    const result: PostseasonPickHistoryItem[] = [];

    for (const pick of picks) {
      const game = await this.ps_getGame(pick.gameId);
      if (game) {
        result.push({ ...pick, game });
      }
    }

    return result.sort((a, b) => new Date(b.game.gameDate).getTime() - new Date(a.game.gameDate).getTime());
  }

  async ps_getUserStats(userId: string): Promise<PostseasonUserStats | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const userPicks = await this.ps_getPicksByUser(userId);
    const allGames = await this.ps_getGames();
    const leaderboard = await this.ps_getLeaderboard();

    const correctPicks = userPicks.filter(p => p.isCorrect === true).length;
    const totalPoints = userPicks.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
    const rank = leaderboard.findIndex(e => e.userId === userId) + 1;

    const rounds: PostseasonRound[] = ['WILD_CARD', 'DIVISIONAL', 'CONFERENCE', 'SUPER_BOWL'];
    const roundStats = [];

    for (const round of rounds) {
      const roundGames = allGames.filter(g => g.round === round);
      const gameIds = new Set(roundGames.map(g => g.id));
      const roundPicks = userPicks.filter(p => gameIds.has(p.gameId));
      const roundCorrect = roundPicks.filter(p => p.isCorrect === true).length;
      const roundPoints = roundPicks.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);

      roundStats.push({
        round,
        roundName: POSTSEASON_ROUND_NAMES[round],
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

  // ─── Golf Fantasy ──────────────────────────────────────────────

  async golf_seedGolfersIfEmpty(): Promise<void> {
    const existing = await db.select({ id: golfGolfers.id }).from(golfGolfers).limit(1);
    if (existing.length > 0) return;

    const GOLFERS: { worldRank: number; firstName: string; lastName: string; country: string }[] = [
      { worldRank: 1, firstName: "Scottie", lastName: "Scheffler", country: "United States" },
      { worldRank: 2, firstName: "Rory", lastName: "McIlroy", country: "Northern Ireland" },
      { worldRank: 3, firstName: "Cameron", lastName: "Young", country: "United States" },
      { worldRank: 4, firstName: "Tommy", lastName: "Fleetwood", country: "England" },
      { worldRank: 5, firstName: "J.J.", lastName: "Spaun", country: "United States" },
      { worldRank: 6, firstName: "Matt", lastName: "Fitzpatrick", country: "England" },
      { worldRank: 7, firstName: "Collin", lastName: "Morikawa", country: "United States" },
      { worldRank: 8, firstName: "Robert", lastName: "MacIntyre", country: "Scotland" },
      { worldRank: 9, firstName: "Justin", lastName: "Rose", country: "England" },
      { worldRank: 10, firstName: "Xander", lastName: "Schauffele", country: "United States" },
      { worldRank: 11, firstName: "Chris", lastName: "Gotterup", country: "United States" },
      { worldRank: 12, firstName: "Russell", lastName: "Henley", country: "United States" },
      { worldRank: 13, firstName: "Sepp", lastName: "Straka", country: "Austria" },
      { worldRank: 14, firstName: "Hideki", lastName: "Matsuyama", country: "Japan" },
      { worldRank: 15, firstName: "Justin", lastName: "Thomas", country: "United States" },
      { worldRank: 16, firstName: "Ben", lastName: "Griffin", country: "United States" },
      { worldRank: 17, firstName: "Ludvig", lastName: "Aberg", country: "Sweden" },
      { worldRank: 18, firstName: "Jacob", lastName: "Bridgeman", country: "United States" },
      { worldRank: 19, firstName: "Alex", lastName: "Noren", country: "Sweden" },
      { worldRank: 20, firstName: "Harris", lastName: "English", country: "United States" },
      { worldRank: 21, firstName: "Akshay", lastName: "Bhatia", country: "United States" },
      { worldRank: 22, firstName: "Viktor", lastName: "Hovland", country: "Norway" },
      { worldRank: 23, firstName: "Patrick", lastName: "Reed", country: "United States" },
      { worldRank: 24, firstName: "Bryson", lastName: "DeChambeau", country: "United States" },
      { worldRank: 25, firstName: "Min Woo", lastName: "Lee", country: "Australia" },
      { worldRank: 26, firstName: "Keegan", lastName: "Bradley", country: "United States" },
      { worldRank: 27, firstName: "Maverick", lastName: "McNealy", country: "United States" },
      { worldRank: 28, firstName: "Si Woo", lastName: "Kim", country: "South Korea" },
      { worldRank: 29, firstName: "Ryan", lastName: "Gerard", country: "United States" },
      { worldRank: 30, firstName: "Jon", lastName: "Rahm", country: "Spain" },
      { worldRank: 31, firstName: "Tyrrell", lastName: "Hatton", country: "England" },
      { worldRank: 32, firstName: "Shane", lastName: "Lowry", country: "Ireland" },
      { worldRank: 33, firstName: "Sam", lastName: "Burns", country: "United States" },
      { worldRank: 34, firstName: "Kurt", lastName: "Kitayama", country: "United States" },
      { worldRank: 35, firstName: "Patrick", lastName: "Cantlay", country: "United States" },
      { worldRank: 36, firstName: "Nicolai", lastName: "Hojgaard", country: "Denmark" },
      { worldRank: 37, firstName: "Marco", lastName: "Penge", country: "England" },
      { worldRank: 38, firstName: "Daniel", lastName: "Berger", country: "United States" },
      { worldRank: 39, firstName: "Aaron", lastName: "Rai", country: "England" },
      { worldRank: 40, firstName: "Nicolas", lastName: "Echavarria", country: "Colombia" },
      { worldRank: 41, firstName: "Jason", lastName: "Day", country: "Australia" },
      { worldRank: 42, firstName: "Jake", lastName: "Knapp", country: "United States" },
      { worldRank: 43, firstName: "Michael", lastName: "Kim", country: "United States" },
      { worldRank: 44, firstName: "Corey", lastName: "Conners", country: "Canada" },
      { worldRank: 45, firstName: "Samuel", lastName: "Stevens", country: "United States" },
      { worldRank: 46, firstName: "Kristoffer", lastName: "Reitan", country: "Norway" },
      { worldRank: 47, firstName: "Michael", lastName: "Brennan", country: "United States" },
      { worldRank: 48, firstName: "Andrew", lastName: "Novak", country: "United States" },
      { worldRank: 49, firstName: "Matt", lastName: "McCarty", country: "United States" },
      { worldRank: 50, firstName: "Brian", lastName: "Harman", country: "United States" },
      { worldRank: 51, firstName: "Ryan", lastName: "Fox", country: "New Zealand" },
      { worldRank: 52, firstName: "Gary", lastName: "Woodland", country: "United States" },
      { worldRank: 53, firstName: "Adam", lastName: "Scott", country: "Australia" },
      { worldRank: 54, firstName: "Pierceson", lastName: "Coody", country: "United States" },
      { worldRank: 55, firstName: "Ryo", lastName: "Hisatsune", country: "Japan" },
      { worldRank: 56, firstName: "Sami", lastName: "Valimaki", country: "Finland" },
      { worldRank: 57, firstName: "Rasmus", lastName: "Hojgaard", country: "Denmark" },
      { worldRank: 58, firstName: "Michael", lastName: "Thorbjornsen", country: "United States" },
      { worldRank: 59, firstName: "Max", lastName: "Greyserman", country: "United States" },
      { worldRank: 60, firstName: "Thomas", lastName: "Detry", country: "Belgium" },
      { worldRank: 61, firstName: "Jordan", lastName: "Spieth", country: "United States" },
      { worldRank: 62, firstName: "Harry", lastName: "Hall", country: "England" },
      { worldRank: 63, firstName: "Jayden", lastName: "Schaper", country: "South Africa" },
      { worldRank: 64, firstName: "John", lastName: "Keefer", country: "United States" },
      { worldRank: 65, firstName: "Rickie", lastName: "Fowler", country: "United States" },
      { worldRank: 66, firstName: "Matt", lastName: "Wallace", country: "England" },
      { worldRank: 67, firstName: "Nick", lastName: "Taylor", country: "Canada" },
      { worldRank: 68, firstName: "Jordan", lastName: "Smith", country: "England" },
      { worldRank: 69, firstName: "Rasmus", lastName: "Neergaard-Petersen", country: "Denmark" },
      { worldRank: 70, firstName: "Casey", lastName: "Jarvis", country: "South Africa" },
      { worldRank: 71, firstName: "Sungjae", lastName: "Im", country: "South Korea" },
      { worldRank: 72, firstName: "Patrick", lastName: "Rodgers", country: "United States" },
      { worldRank: 73, firstName: "Sahith", lastName: "Theegala", country: "United States" },
      { worldRank: 74, firstName: "Taylor", lastName: "Pendrith", country: "Canada" },
      { worldRank: 75, firstName: "Max", lastName: "McGreevy", country: "United States" },
      { worldRank: 76, firstName: "Bud", lastName: "Cauley", country: "United States" },
      { worldRank: 77, firstName: "Aldrich", lastName: "Potgieter", country: "South Africa" },
      { worldRank: 78, firstName: "Wyndham", lastName: "Clark", country: "United States" },
      { worldRank: 79, firstName: "J.T.", lastName: "Poston", country: "United States" },
      { worldRank: 80, firstName: "Richard", lastName: "Hoey", country: "Philippines" },
      { worldRank: 81, firstName: "David", lastName: "Puig", country: "Spain" },
      { worldRank: 82, firstName: "John", lastName: "Parry", country: "England" },
      { worldRank: 83, firstName: "Elvis", lastName: "Smylie", country: "Australia" },
      { worldRank: 84, firstName: "Haotong", lastName: "Li", country: "China" },
      { worldRank: 85, firstName: "Garrick", lastName: "Higgo", country: "South Africa" },
      { worldRank: 86, firstName: "Austin", lastName: "Smotherman", country: "United States" },
      { worldRank: 87, firstName: "Ricky", lastName: "Castillo", country: "United States" },
      { worldRank: 88, firstName: "David", lastName: "Lipsky", country: "United States" },
      { worldRank: 89, firstName: "Matti", lastName: "Schmid", country: "Germany" },
      { worldRank: 90, firstName: "Christiaan", lastName: "Bezuidenhout", country: "South Africa" },
      { worldRank: 91, firstName: "Daniel", lastName: "Hillier", country: "New Zealand" },
      { worldRank: 92, firstName: "Daniel", lastName: "Brown", country: "England" },
      { worldRank: 93, firstName: "Andrew", lastName: "Putnam", country: "United States" },
      { worldRank: 94, firstName: "Billy", lastName: "Horschel", country: "United States" },
      { worldRank: 95, firstName: "Denny", lastName: "McCarthy", country: "United States" },
      { worldRank: 96, firstName: "Lucas", lastName: "Glover", country: "United States" },
      { worldRank: 97, firstName: "Adrien", lastName: "Saddier", country: "France" },
      { worldRank: 98, firstName: "Chris", lastName: "Kirk", country: "United States" },
      { worldRank: 99, firstName: "Stephan", lastName: "Jaeger", country: "Germany" },
      { worldRank: 100, firstName: "Thriston", lastName: "Lawrence", country: "South Africa" },
      { worldRank: 101, firstName: "Laurie", lastName: "Canter", country: "England" },
      { worldRank: 102, firstName: "Chun-an", lastName: "Yu", country: "Taiwan" },
      { worldRank: 103, firstName: "Thorbjorn", lastName: "Olesen", country: "Denmark" },
      { worldRank: 104, firstName: "Andy", lastName: "Sullivan", country: "England" },
      { worldRank: 105, firstName: "Tom", lastName: "McKibbin", country: "Northern Ireland" },
      { worldRank: 106, firstName: "Alex", lastName: "Smalley", country: "United States" },
      { worldRank: 107, firstName: "Jhonattan", lastName: "Vegas", country: "Venezuela" },
      { worldRank: 108, firstName: "Keith", lastName: "Mitchell", country: "United States" },
      { worldRank: 109, firstName: "Angel", lastName: "Ayora", country: "Spain" },
      { worldRank: 110, firstName: "Tom", lastName: "Hoge", country: "United States" },
      { worldRank: 111, firstName: "Tony", lastName: "Finau", country: "United States" },
      { worldRank: 112, firstName: "Brian", lastName: "Campbell", country: "United States" },
      { worldRank: 113, firstName: "Emiliano", lastName: "Grillo", country: "Argentina" },
      { worldRank: 114, firstName: "Ian", lastName: "Holt", country: "United States" },
      { worldRank: 115, firstName: "Chandler", lastName: "Blanchet", country: "United States" },
      { worldRank: 116, firstName: "McClure", lastName: "Meissner", country: "United States" },
      { worldRank: 117, firstName: "Davis", lastName: "Thompson", country: "United States" },
      { worldRank: 118, firstName: "Eric", lastName: "Cole", country: "United States" },
      { worldRank: 119, firstName: "Sudarshan", lastName: "Yellamaraju", country: "Canada" },
      { worldRank: 120, firstName: "Davis", lastName: "Riley", country: "United States" },
      { worldRank: 121, firstName: "Mackenzie", lastName: "Hughes", country: "Canada" },
      { worldRank: 122, firstName: "William", lastName: "Mouw", country: "United States" },
      { worldRank: 123, firstName: "Vincent", lastName: "Whaley", country: "United States" },
      { worldRank: 124, firstName: "Keita", lastName: "Nakajima", country: "Japan" },
      { worldRank: 125, firstName: "Eugenio", lastName: "Chacarra", country: "Spain" },
      { worldRank: 126, firstName: "Takumi", lastName: "Kanaya", country: "Japan" },
      { worldRank: 127, firstName: "Nacho", lastName: "Elvira", country: "Spain" },
      { worldRank: 128, firstName: "Shaun", lastName: "Norris", country: "South Africa" },
      { worldRank: 129, firstName: "Dan", lastName: "Bradbury", country: "England" },
      { worldRank: 130, firstName: "Calum", lastName: "Hill", country: "Scotland" },
      { worldRank: 131, firstName: "Tom", lastName: "Kim", country: "South Korea" },
      { worldRank: 132, firstName: "Seonghyeon", lastName: "Kim", country: "South Korea" },
      { worldRank: 133, firstName: "Lee", lastName: "Hodges", country: "United States" },
      { worldRank: 134, firstName: "Travis", lastName: "Smyth", country: "Australia" },
      { worldRank: 135, firstName: "Kevin", lastName: "Roy", country: "United States" },
      { worldRank: 136, firstName: "Byeong Hun", lastName: "An", country: "South Korea" },
      { worldRank: 137, firstName: "Kazuki", lastName: "Higa", country: "Japan" },
      { worldRank: 138, firstName: "Steven", lastName: "Fisk", country: "United States" },
      { worldRank: 139, firstName: "Jacob Skov", lastName: "Olesen", country: "Denmark" },
      { worldRank: 140, firstName: "Alex", lastName: "Fitzpatrick", country: "England" },
      { worldRank: 141, firstName: "Joe", lastName: "Highsmith", country: "United States" },
      { worldRank: 142, firstName: "Martin", lastName: "Couvra", country: "France" },
      { worldRank: 143, firstName: "Chad", lastName: "Ramey", country: "United States" },
      { worldRank: 144, firstName: "Adrien", lastName: "Dumont de Chassart", country: "Belgium" },
      { worldRank: 145, firstName: "Taylor", lastName: "Moore", country: "United States" },
      { worldRank: 146, firstName: "Joakim", lastName: "Lagergren", country: "Sweden" },
      { worldRank: 147, firstName: "Peter", lastName: "Uihlein", country: "United States" },
      { worldRank: 148, firstName: "Adam", lastName: "Schenk", country: "United States" },
      { worldRank: 149, firstName: "JC", lastName: "Ritchie", country: "South Africa" },
    ];

    await db.insert(golfGolfers).values(GOLFERS);
    console.log(`Seeded ${GOLFERS.length} golf golfers`);
  }

  async golf_getGolfers(params?: { tournamentId?: string; excludeTournamentId?: string }): Promise<GolfGolfer[]> {
    if (params?.tournamentId) {
      const tgRows = await db.select().from(golfTournamentGolfers)
        .where(eq(golfTournamentGolfers.tournamentId, params.tournamentId));
      const ids = tgRows.map(r => r.golferId);
      if (ids.length === 0) return [];
      return await db.select().from(golfGolfers)
        .where(inArray(golfGolfers.id, ids))
        .orderBy(asc(golfGolfers.worldRank));
    }
    if (params?.excludeTournamentId) {
      const tgRows = await db.select().from(golfTournamentGolfers)
        .where(eq(golfTournamentGolfers.tournamentId, params.excludeTournamentId));
      const ids = tgRows.map(r => r.golferId);
      if (ids.length === 0) {
        return await db.select().from(golfGolfers).orderBy(asc(golfGolfers.worldRank));
      }
      return await db.select().from(golfGolfers)
        .where(not(inArray(golfGolfers.id, ids)))
        .orderBy(asc(golfGolfers.worldRank));
    }
    return await db.select().from(golfGolfers).orderBy(asc(golfGolfers.worldRank));
  }

  async golf_getGolfer(id: string): Promise<GolfGolfer | undefined> {
    const [g] = await db.select().from(golfGolfers).where(eq(golfGolfers.id, id));
    return g || undefined;
  }

  async golf_findGolferBySdioId(sdioPlayerId: number): Promise<GolfGolfer | undefined> {
    const [g] = await db.select().from(golfGolfers).where(eq(golfGolfers.sdioPlayerId, sdioPlayerId));
    return g || undefined;
  }

  async golf_findGolferByName(firstName: string, lastName: string): Promise<GolfGolfer | undefined> {
    const [g] = await db.select().from(golfGolfers).where(
      and(
        sql`lower(${golfGolfers.firstName}) = lower(${firstName})`,
        sql`lower(${golfGolfers.lastName}) = lower(${lastName})`
      )
    );
    return g || undefined;
  }

  async golf_mergeDuplicateGolfers(): Promise<number> {
    const seeded = await db.select().from(golfGolfers).where(sql`${golfGolfers.sdioPlayerId} IS NULL`);
    let merged = 0;

    for (const canonical of seeded) {
      const dups = await db.select().from(golfGolfers).where(
        and(
          sql`lower(${golfGolfers.firstName}) = lower(${canonical.firstName})`,
          sql`lower(${golfGolfers.lastName}) = lower(${canonical.lastName})`,
          sql`${golfGolfers.sdioPlayerId} IS NOT NULL`
        )
      );
      if (dups.length === 0) continue;

      for (const dup of dups) {
        await db.transaction(async (tx) => {
          // Re-point golfTournamentGolfers: delete conflicts, then update remaining
          await tx.execute(sql`
            DELETE FROM golf_tournament_golfers
            WHERE golfer_id = ${dup.id}
            AND tournament_id IN (
              SELECT tournament_id FROM golf_tournament_golfers WHERE golfer_id = ${canonical.id}
            )
          `);
          await tx.update(golfTournamentGolfers).set({ golferId: canonical.id }).where(eq(golfTournamentGolfers.golferId, dup.id));

          // Re-point golfGolferScores: delete conflicts, then update remaining
          await tx.execute(sql`
            DELETE FROM golf_golfer_scores
            WHERE golfer_id = ${dup.id}
            AND (tournament_id, round) IN (
              SELECT tournament_id, round FROM golf_golfer_scores WHERE golfer_id = ${canonical.id}
            )
          `);
          await tx.update(golfGolferScores).set({ golferId: canonical.id }).where(eq(golfGolferScores.golferId, dup.id));

          // Re-point golfDraftPicks: delete conflicts, then update remaining
          await tx.execute(sql`
            DELETE FROM golf_draft_picks
            WHERE golfer_id = ${dup.id}
            AND league_id IN (
              SELECT league_id FROM golf_draft_picks WHERE golfer_id = ${canonical.id}
            )
          `);
          await tx.update(golfDraftPicks).set({ golferId: canonical.id }).where(eq(golfDraftPicks.golferId, dup.id));

          // Stamp SDIO ID onto canonical row and delete the duplicate
          await tx.update(golfGolfers).set({ sdioPlayerId: dup.sdioPlayerId }).where(eq(golfGolfers.id, canonical.id));
          await tx.delete(golfGolfers).where(eq(golfGolfers.id, dup.id));
        });

        merged++;
      }
    }

    return merged;
  }

  async golf_createGolfer(data: InsertGolfGolfer): Promise<GolfGolfer> {
    const [g] = await db.insert(golfGolfers).values(data).returning();
    return g;
  }

  async golf_updateGolfer(id: string, data: UpdateGolfGolfer): Promise<GolfGolfer | undefined> {
    const [g] = await db.update(golfGolfers).set(data).where(eq(golfGolfers.id, id)).returning();
    return g || undefined;
  }

  async golf_getTournaments(): Promise<GolfTournament[]> {
    return await db.select().from(golfTournaments).orderBy(desc(golfTournaments.startDate));
  }

  async golf_getTournament(id: string): Promise<GolfTournament | undefined> {
    const [t] = await db.select().from(golfTournaments).where(eq(golfTournaments.id, id));
    return t || undefined;
  }

  async golf_createTournament(data: InsertGolfTournament): Promise<GolfTournament> {
    const [t] = await db.insert(golfTournaments).values(data).returning();
    return t;
  }

  async golf_updateTournamentStatus(id: string, status: string): Promise<GolfTournament | undefined> {
    const [t] = await db.update(golfTournaments).set({ status }).where(eq(golfTournaments.id, id)).returning();
    return t || undefined;
  }

  async golf_updateTournament(id: string, data: Partial<Pick<GolfTournament, 'status' | 'sdioTournamentId'>>): Promise<GolfTournament | undefined> {
    const [t] = await db.update(golfTournaments).set(data).where(eq(golfTournaments.id, id)).returning();
    return t || undefined;
  }

  async golf_getTournamentGolfers(tournamentId: string): Promise<GolfGolfer[]> {
    return this.golf_getGolfers({ tournamentId });
  }

  async golf_addGolferToTournament(tournamentId: string, golferId: string): Promise<void> {
    await db.insert(golfTournamentGolfers).values({ tournamentId, golferId }).onConflictDoNothing();
  }

  async golf_removeGolferFromTournament(tournamentId: string, golferId: string): Promise<void> {
    await db.delete(golfTournamentGolfers).where(
      and(
        eq(golfTournamentGolfers.tournamentId, tournamentId),
        eq(golfTournamentGolfers.golferId, golferId)
      )
    );
  }

  async golf_deleteScore(tournamentId: string, golferId: string, round: number): Promise<void> {
    await db.delete(golfGolferScores).where(
      and(
        eq(golfGolferScores.tournamentId, tournamentId),
        eq(golfGolferScores.golferId, golferId),
        eq(golfGolferScores.round, round)
      )
    );
  }

  async golf_upsertScore(tournamentId: string, golferId: string, round: number, score: number, position?: string | null): Promise<GolfGolferScore> {
    const [existing] = await db.select().from(golfGolferScores).where(
      and(
        eq(golfGolferScores.tournamentId, tournamentId),
        eq(golfGolferScores.golferId, golferId),
        eq(golfGolferScores.round, round)
      )
    );
    const now = new Date();
    if (existing) {
      const [updated] = await db.update(golfGolferScores)
        .set({ score, position: position ?? null, updatedAt: now })
        .where(eq(golfGolferScores.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(golfGolferScores).values({ tournamentId, golferId, round, score, position: position ?? null, updatedAt: now }).returning();
    return created;
  }

  async golf_getScores(tournamentId: string): Promise<GolfGolferScore[]> {
    return await db.select().from(golfGolferScores).where(eq(golfGolferScores.tournamentId, tournamentId));
  }

  async golf_getLastScoreUpdated(tournamentId: string): Promise<Date | null> {
    const [result] = await db
      .select({ lastUpdated: sql<Date>`MAX(${golfGolferScores.updatedAt})` })
      .from(golfGolferScores)
      .where(eq(golfGolferScores.tournamentId, tournamentId));
    return result?.lastUpdated ?? null;
  }

  private generateJoinCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private snakePickUser(draftOrder: string[], pickIndex: number): string {
    const n = draftOrder.length;
    const round = Math.floor(pickIndex / n);
    const position = pickIndex % n;
    return round % 2 === 0 ? draftOrder[position] : draftOrder[n - 1 - position];
  }

  async golf_createLeague(data: InsertGolfLeague, commissionerId: string): Promise<GolfLeague> {
    let joinCode = this.generateJoinCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await this.golf_getLeagueByJoinCode(joinCode);
      if (!existing) break;
      joinCode = this.generateJoinCode();
      attempts++;
    }

    const [league] = await db.insert(golfLeagues).values({
      ...data,
      commissionerId,
      joinCode,
      draftStatus: "pending",
      draftOrder: [],
    }).returning();

    await db.insert(golfLeagueMembers).values({ leagueId: league.id, userId: commissionerId });

    if (data.draftOrderType === "random") {
      await db.update(golfLeagues)
        .set({ draftOrder: [commissionerId] })
        .where(eq(golfLeagues.id, league.id));
      const [updated] = await db.select().from(golfLeagues).where(eq(golfLeagues.id, league.id));
      return updated;
    }

    return league;
  }

  async golf_getLeague(id: string): Promise<GolfLeague | undefined> {
    const [l] = await db.select().from(golfLeagues).where(eq(golfLeagues.id, id));
    return l || undefined;
  }

  async golf_getLeagueDetail(id: string): Promise<GolfLeagueDetail | undefined> {
    const league = await this.golf_getLeague(id);
    if (!league) return undefined;

    const tournament = await this.golf_getTournament(league.tournamentId);
    if (!tournament) return undefined;

    const members = await this.golf_getLeagueMembers(id);

    return {
      ...league,
      tournament,
      members,
    };
  }

  async golf_getUserLeagues(userId: string): Promise<(GolfLeague & { tournament: GolfTournament })[]> {
    const memberships = await db.select().from(golfLeagueMembers).where(eq(golfLeagueMembers.userId, userId));
    const result: (GolfLeague & { tournament: GolfTournament })[] = [];
    for (const m of memberships) {
      const league = await this.golf_getLeague(m.leagueId);
      if (!league) continue;
      const tournament = await this.golf_getTournament(league.tournamentId);
      if (!tournament) continue;
      result.push({ ...league, tournament });
    }
    return result;
  }

  async golf_getAllLeagues(): Promise<(GolfLeague & { tournament: GolfTournament })[]> {
    const leagues = await db.select().from(golfLeagues);
    const result: (GolfLeague & { tournament: GolfTournament })[] = [];
    for (const league of leagues) {
      const tournament = await this.golf_getTournament(league.tournamentId);
      if (!tournament) continue;
      result.push({ ...league, tournament });
    }
    return result;
  }

  async golf_getLeagueByJoinCode(code: string): Promise<GolfLeague | undefined> {
    const [l] = await db.select().from(golfLeagues).where(eq(golfLeagues.joinCode, code.toUpperCase()));
    return l || undefined;
  }

  async golf_updateLeague(id: string, data: Partial<Pick<GolfLeague, 'draftStatus' | 'draftOrder'>>): Promise<GolfLeague | undefined> {
    const [l] = await db.update(golfLeagues).set(data).where(eq(golfLeagues.id, id)).returning();
    return l || undefined;
  }

  async golf_isLeagueMember(leagueId: string, userId: string): Promise<boolean> {
    const [m] = await db.select().from(golfLeagueMembers).where(
      and(eq(golfLeagueMembers.leagueId, leagueId), eq(golfLeagueMembers.userId, userId))
    );
    return !!m;
  }

  async golf_getLeagueMembers(leagueId: string): Promise<(GolfLeagueMember & { user: { id: string; username: string } })[]> {
    const members = await db.select().from(golfLeagueMembers).where(eq(golfLeagueMembers.leagueId, leagueId));
    const result: (GolfLeagueMember & { user: { id: string; username: string } })[] = [];
    for (const m of members) {
      const user = await this.getUser(m.userId);
      if (user) {
        result.push({ ...m, user: { id: user.id, username: user.username } });
      }
    }
    return result;
  }

  async golf_addLeagueMember(leagueId: string, userId: string): Promise<GolfLeagueMember> {
    const [m] = await db.insert(golfLeagueMembers).values({ leagueId, userId }).returning();

    const league = await this.golf_getLeague(leagueId);
    if (league && league.draftOrderType === "random") {
      const currentOrder = league.draftOrder ?? [];
      if (!currentOrder.includes(userId)) {
        const newOrder = [...currentOrder, userId];
        const shuffled = newOrder.sort(() => Math.random() - 0.5);
        await this.golf_updateLeague(leagueId, { draftOrder: shuffled });
      }
    }

    return m;
  }

  async golf_getDraftPicks(leagueId: string): Promise<GolfDraftPickWithDetails[]> {
    const picks = await db.select().from(golfDraftPicks)
      .where(eq(golfDraftPicks.leagueId, leagueId))
      .orderBy(asc(golfDraftPicks.pickNumber));
    const result: GolfDraftPickWithDetails[] = [];
    for (const pick of picks) {
      const golfer = await this.golf_getGolfer(pick.golferId);
      const user = await this.getUser(pick.userId);
      if (golfer && user) {
        result.push({ ...pick, golfer, user: { id: user.id, username: user.username } });
      }
    }
    return result;
  }

  async golf_getDraftState(leagueId: string): Promise<GolfDraftState | undefined> {
    const league = await this.golf_getLeague(leagueId);
    if (!league) return undefined;

    const members = await this.golf_getLeagueMembers(leagueId);
    const draftOrder = league.draftOrder ?? [];
    const draftOrderWithNames = draftOrder.map(uid => {
      const m = members.find(m => m.userId === uid);
      return { userId: uid, username: m?.user.username ?? uid };
    });

    const picks = await this.golf_getDraftPicks(leagueId);
    const numUsers = draftOrder.length;
    const totalPicks = numUsers * 4;
    const currentPickNumber = picks.length;
    const isComplete = (numUsers > 0 && currentPickNumber >= totalPicks) || league.draftStatus === "completed";

    let currentPickUserId: string | null = null;
    if (!isComplete && draftOrder.length > 0 && league.draftStatus === "active") {
      currentPickUserId = this.snakePickUser(draftOrder, currentPickNumber);
    }

    const draftedGolferIds = new Set(picks.map(p => p.golferId));
    const tournamentGolfers = await this.golf_getTournamentGolfers(league.tournamentId);
    const availableGolfers = tournamentGolfers.filter(g => !draftedGolferIds.has(g.id));

    return {
      league,
      picks,
      currentPickUserId,
      currentPickNumber,
      availableGolfers,
      isComplete,
      draftOrder: draftOrderWithNames,
    };
  }

  async golf_submitDraftPick(leagueId: string, userId: string, golferId: string): Promise<GolfDraftPick> {
    const league = await this.golf_getLeague(leagueId);
    if (!league) throw new Error("League not found");
    if (league.draftStatus !== "active") throw new Error("Draft is not active");

    const draftOrder = league.draftOrder ?? [];
    const picks = await db.select().from(golfDraftPicks).where(eq(golfDraftPicks.leagueId, leagueId));
    const pickNumber = picks.length;
    const expectedUser = this.snakePickUser(draftOrder, pickNumber);

    if (expectedUser !== userId) throw new Error("Not your turn");

    const alreadyDrafted = picks.find(p => p.golferId === golferId);
    if (alreadyDrafted) throw new Error("Golfer already drafted");

    const [pick] = await db.insert(golfDraftPicks).values({
      leagueId,
      userId,
      golferId,
      pickNumber,
    }).returning();

    const totalPicks = draftOrder.length * 4;
    if (picks.length + 1 >= totalPicks) {
      await this.golf_updateLeague(leagueId, { draftStatus: "completed" });
    }

    return pick;
  }

  async golf_getLeagueStandings(leagueId: string): Promise<GolfLeagueStandingEntry[]> {
    const league = await this.golf_getLeague(leagueId);
    if (!league) return [];

    const members = await this.golf_getLeagueMembers(leagueId);
    const picks = await this.golf_getDraftPicks(leagueId);
    const scores = await this.golf_getScores(league.tournamentId);

    const standings: GolfLeagueStandingEntry[] = [];

    for (const member of members) {
      const memberPicks = picks.filter(p => p.userId === member.userId);
      const roster = memberPicks.map(pick => {
        const golferScoreRows = scores
          .filter(s => s.golferId === pick.golferId)
          .sort((a, b) => a.round - b.round);
        const golferScores = golferScoreRows.map(s => ({ round: s.round, score: s.score }));
        const totalScore = golferScores.reduce((sum, s) => sum + s.score, 0);
        const latestRow = golferScoreRows[golferScoreRows.length - 1];
        const position = latestRow?.position ?? null;
        return {
          golfer: pick.golfer,
          scores: golferScores,
          totalScore,
          position,
        };
      });

      const hasAnyScore = roster.some(r => r.scores.length > 0);
      const totalScore = hasAnyScore
        ? roster.reduce((sum, r) => sum + r.totalScore, 0)
        : null;

      standings.push({
        userId: member.userId,
        username: member.user.username,
        roster,
        totalScore,
      });
    }

    standings.sort((a, b) => {
      if (a.totalScore === null && b.totalScore === null) return 0;
      if (a.totalScore === null) return 1;
      if (b.totalScore === null) return -1;
      return a.totalScore - b.totalScore;
    });

    return standings;
  }

  // ============ CFB Conferences ============

  static readonly CFB_ROSTER_SIZE = 7;
  static readonly CFB_LINEUP_SIZE = 5;
  static readonly CFB_REGULAR_SEASON_WEEKS = 11;
  static readonly CFB_PLAYOFF_TEAMS = 6;

  async cfb_seedTeamsIfEmpty(): Promise<void> {
    const [existing] = await db.select().from(cfbTeams).limit(1);
    if (existing) return;
    await db.insert(cfbTeams).values(
      CFB_TEAM_SEED.map(t => ({
        espnTeamId: t.espnTeamId,
        name: t.name,
        displayName: t.displayName,
        abbreviation: t.abbreviation,
        logoUrl: t.logoUrl,
      }))
    );
    console.log(`[cfb] Seeded ${CFB_TEAM_SEED.length} CFB teams`);
  }

  async cfb_getTeams(): Promise<CfbTeam[]> {
    return await db.select().from(cfbTeams).orderBy(asc(cfbTeams.name));
  }

  async cfb_getTeam(id: string): Promise<CfbTeam | undefined> {
    const [t] = await db.select().from(cfbTeams).where(eq(cfbTeams.id, id));
    return t || undefined;
  }

  async cfb_createLeague(data: InsertCfbLeague, commissionerId: string, season: number): Promise<CfbLeague> {
    let joinCode = this.generateJoinCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await this.cfb_getLeagueByJoinCode(joinCode);
      if (!existing) break;
      joinCode = this.generateJoinCode();
      attempts++;
    }

    const [league] = await db.insert(cfbLeagues).values({
      ...data,
      commissionerId,
      joinCode,
      season,
      draftStatus: "pending",
      draftOrder: [],
    }).returning();

    await db.insert(cfbLeagueMembers).values({ leagueId: league.id, userId: commissionerId });

    if (data.draftOrderType === "random") {
      await db.update(cfbLeagues)
        .set({ draftOrder: [commissionerId] })
        .where(eq(cfbLeagues.id, league.id));
      const [updated] = await db.select().from(cfbLeagues).where(eq(cfbLeagues.id, league.id));
      return updated;
    }

    return league;
  }

  async cfb_getLeague(id: string): Promise<CfbLeague | undefined> {
    const [l] = await db.select().from(cfbLeagues).where(eq(cfbLeagues.id, id));
    return l || undefined;
  }

  async cfb_getLeagueDetail(id: string): Promise<CfbLeagueDetail | undefined> {
    const league = await this.cfb_getLeague(id);
    if (!league) return undefined;
    const members = await this.cfb_getLeagueMembers(id);
    return { ...league, members };
  }

  async cfb_getUserLeagues(userId: string): Promise<CfbLeague[]> {
    const memberships = await db.select().from(cfbLeagueMembers).where(eq(cfbLeagueMembers.userId, userId));
    const result: CfbLeague[] = [];
    for (const m of memberships) {
      const league = await this.cfb_getLeague(m.leagueId);
      if (league) result.push(league);
    }
    return result;
  }

  async cfb_getAllLeagues(): Promise<CfbLeague[]> {
    return await db.select().from(cfbLeagues).orderBy(desc(cfbLeagues.createdAt));
  }

  async cfb_getLeagueByJoinCode(code: string): Promise<CfbLeague | undefined> {
    const [l] = await db.select().from(cfbLeagues).where(eq(cfbLeagues.joinCode, code.toUpperCase()));
    return l || undefined;
  }

  async cfb_updateLeague(id: string, data: Partial<Pick<CfbLeague, 'draftStatus' | 'draftOrder' | 'currentWeek'>>): Promise<CfbLeague | undefined> {
    const [l] = await db.update(cfbLeagues).set(data).where(eq(cfbLeagues.id, id)).returning();
    return l || undefined;
  }

  async cfb_isLeagueMember(leagueId: string, userId: string): Promise<boolean> {
    const [m] = await db.select().from(cfbLeagueMembers).where(
      and(eq(cfbLeagueMembers.leagueId, leagueId), eq(cfbLeagueMembers.userId, userId))
    );
    return !!m;
  }

  async cfb_getLeagueMembers(leagueId: string): Promise<(CfbLeagueMember & { user: { id: string; username: string } })[]> {
    const members = await db.select().from(cfbLeagueMembers).where(eq(cfbLeagueMembers.leagueId, leagueId));
    const result: (CfbLeagueMember & { user: { id: string; username: string } })[] = [];
    for (const m of members) {
      const user = await this.getUser(m.userId);
      if (user) result.push({ ...m, user: { id: user.id, username: user.username } });
    }
    return result;
  }

  async cfb_addLeagueMember(leagueId: string, userId: string): Promise<CfbLeagueMember> {
    const [m] = await db.insert(cfbLeagueMembers).values({ leagueId, userId }).returning();

    const league = await this.cfb_getLeague(leagueId);
    if (league && league.draftOrderType === "random") {
      const currentOrder = league.draftOrder ?? [];
      if (!currentOrder.includes(userId)) {
        const shuffled = [...currentOrder, userId];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        await this.cfb_updateLeague(leagueId, { draftOrder: shuffled });
      }
    }

    return m;
  }

  private async cfb_getDraftPicksWithDetails(leagueId: string): Promise<CfbDraftPickWithDetails[]> {
    const picks = await db.select().from(cfbDraftPicks)
      .where(eq(cfbDraftPicks.leagueId, leagueId))
      .orderBy(asc(cfbDraftPicks.pickNumber));
    const teams = await this.cfb_getTeams();
    const teamMap = new Map(teams.map(t => [t.id, t]));
    const result: CfbDraftPickWithDetails[] = [];
    for (const pick of picks) {
      const team = teamMap.get(pick.teamId);
      const user = await this.getUser(pick.userId);
      if (team && user) {
        result.push({ ...pick, team, user: { id: user.id, username: user.username } });
      }
    }
    return result;
  }

  async cfb_getDraftState(leagueId: string): Promise<CfbDraftState | undefined> {
    const league = await this.cfb_getLeague(leagueId);
    if (!league) return undefined;

    const members = await this.cfb_getLeagueMembers(leagueId);
    const draftOrder = league.draftOrder ?? [];
    const draftOrderWithNames = draftOrder.map(uid => {
      const m = members.find(m => m.userId === uid);
      return { userId: uid, username: m?.user.username ?? uid };
    });

    const picks = await this.cfb_getDraftPicksWithDetails(leagueId);
    const numUsers = draftOrder.length;
    const totalPicks = numUsers * DatabaseStorage.CFB_ROSTER_SIZE;
    const currentPickNumber = picks.length;
    const isComplete = (numUsers > 0 && currentPickNumber >= totalPicks) || league.draftStatus === "completed";

    let currentPickUserId: string | null = null;
    if (!isComplete && draftOrder.length > 0 && league.draftStatus === "active") {
      currentPickUserId = this.snakePickUser(draftOrder, currentPickNumber);
    }

    const draftedTeamIds = new Set(picks.map(p => p.teamId));
    const allTeams = await this.cfb_getTeams();
    const availableTeams = allTeams.filter(t => !draftedTeamIds.has(t.id));

    return {
      league,
      picks,
      currentPickUserId,
      currentPickNumber,
      availableTeams,
      isComplete,
      draftOrder: draftOrderWithNames,
    };
  }

  async cfb_submitDraftPick(leagueId: string, userId: string, teamId: string): Promise<CfbDraftPick> {
    const league = await this.cfb_getLeague(leagueId);
    if (!league) throw new Error("League not found");
    if (league.draftStatus !== "active") throw new Error("Draft is not active");

    const draftOrder = league.draftOrder ?? [];
    const picks = await db.select().from(cfbDraftPicks).where(eq(cfbDraftPicks.leagueId, leagueId));
    const pickNumber = picks.length;
    const expectedUser = this.snakePickUser(draftOrder, pickNumber);

    if (expectedUser !== userId) throw new Error("Not your turn");

    const alreadyDrafted = picks.find(p => p.teamId === teamId);
    if (alreadyDrafted) throw new Error("Team already drafted");

    const [pick] = await db.insert(cfbDraftPicks).values({
      leagueId,
      userId,
      teamId,
      pickNumber,
    }).returning();

    await db.insert(cfbRosters).values({ leagueId, userId, teamId, acquiredVia: "draft" });

    const totalPicks = draftOrder.length * DatabaseStorage.CFB_ROSTER_SIZE;
    if (picks.length + 1 >= totalPicks) {
      await this.cfb_updateLeague(leagueId, { draftStatus: "completed" });
      await this.cfb_generateSchedule(leagueId);
    }

    return pick;
  }

  /**
   * Generates a round-robin schedule for regular season weeks 1-11 using the
   * circle method. With N members there are N-1 unique rounds; rounds repeat
   * cyclically until week 11. Odd member counts give one member a bye each
   * week (no matchup row is created for byes).
   */
  private async cfb_generateSchedule(leagueId: string): Promise<void> {
    const members = await this.cfb_getLeagueMembers(leagueId);
    const ids = members.map(m => m.userId);
    if (ids.length < 2) return;

    const existing = await db.select().from(cfbMatchups).where(eq(cfbMatchups.leagueId, leagueId));
    if (existing.length > 0) return;

    const slots = [...ids];
    if (slots.length % 2 === 1) slots.push("__BYE__");
    const n = slots.length;
    const roundsCount = n - 1;

    const rounds: [string, string][][] = [];
    const rotating = slots.slice(1);
    for (let r = 0; r < roundsCount; r++) {
      const pairs: [string, string][] = [];
      const lineup = [slots[0], ...rotating];
      for (let i = 0; i < n / 2; i++) {
        const a = lineup[i];
        const b = lineup[n - 1 - i];
        if (a !== "__BYE__" && b !== "__BYE__") pairs.push([a, b]);
      }
      rounds.push(pairs);
      rotating.unshift(rotating.pop()!);
    }

    const values: { leagueId: string; week: number; user1Id: string; user2Id: string }[] = [];
    for (let week = 1; week <= DatabaseStorage.CFB_REGULAR_SEASON_WEEKS; week++) {
      const round = rounds[(week - 1) % roundsCount];
      for (const [a, b] of round) {
        values.push({ leagueId, week, user1Id: a, user2Id: b });
      }
    }
    if (values.length > 0) await db.insert(cfbMatchups).values(values);
  }

  async cfb_getRosterRows(leagueId: string, userId?: string): Promise<CfbRosterRow[]> {
    if (userId) {
      return await db.select().from(cfbRosters).where(
        and(eq(cfbRosters.leagueId, leagueId), eq(cfbRosters.userId, userId))
      );
    }
    return await db.select().from(cfbRosters).where(eq(cfbRosters.leagueId, leagueId));
  }

  async cfb_getRosterEntries(leagueId: string, userId: string): Promise<CfbRosterEntry[]> {
    const league = await this.cfb_getLeague(leagueId);
    if (!league) return [];

    const rows = await this.cfb_getRosterRows(leagueId, userId);
    const teams = await this.cfb_getTeams();
    const teamMap = new Map(teams.map(t => [t.id, t]));
    const seasonGames = await db.select().from(cfbGames).where(eq(cfbGames.season, league.season));

    const entries: CfbRosterEntry[] = [];
    for (const row of rows) {
      const team = teamMap.get(row.teamId);
      if (!team) continue;

      let wins = 0, losses = 0;
      for (const g of seasonGames) {
        if (g.status !== "final" || g.homeScore === null || g.awayScore === null) continue;
        if (g.homeEspnTeamId === team.espnTeamId) {
          g.homeScore > g.awayScore ? wins++ : g.homeScore < g.awayScore ? losses++ : null;
        } else if (g.awayEspnTeamId === team.espnTeamId) {
          g.awayScore > g.homeScore ? wins++ : g.awayScore < g.homeScore ? losses++ : null;
        }
      }

      const thisWeekGame = seasonGames.find(g =>
        g.week === league.currentWeek &&
        (g.homeEspnTeamId === team.espnTeamId || g.awayEspnTeamId === team.espnTeamId)
      ) ?? null;

      entries.push({ team, acquiredVia: row.acquiredVia, record: { wins, losses }, thisWeekGame });
    }

    entries.sort((a, b) => a.team.name.localeCompare(b.team.name));
    return entries;
  }

  async cfb_getFreeAgents(leagueId: string): Promise<CfbTeam[]> {
    const rostered = await this.cfb_getRosterRows(leagueId);
    const rosteredIds = new Set(rostered.map(r => r.teamId));
    const teams = await this.cfb_getTeams();
    return teams.filter(t => !rosteredIds.has(t.id));
  }

  async cfb_claimFreeAgent(leagueId: string, userId: string, addTeamId: string, dropTeamId: string): Promise<void> {
    const league = await this.cfb_getLeague(leagueId);
    if (!league) throw new Error("League not found");
    if (league.draftStatus !== "completed") throw new Error("Free agency opens after the draft");

    const myRoster = await this.cfb_getRosterRows(leagueId, userId);
    if (!myRoster.some(r => r.teamId === dropTeamId)) throw new Error("You don't own the team you're dropping");

    const allRostered = await this.cfb_getRosterRows(leagueId);
    if (allRostered.some(r => r.teamId === addTeamId)) throw new Error("That team is already on a roster");

    const addTeam = await this.cfb_getTeam(addTeamId);
    if (!addTeam) throw new Error("Team not found");

    await db.transaction(async (tx) => {
      await tx.delete(cfbRosters).where(
        and(eq(cfbRosters.leagueId, leagueId), eq(cfbRosters.userId, userId), eq(cfbRosters.teamId, dropTeamId))
      );
      await tx.insert(cfbRosters).values({ leagueId, userId, teamId: addTeamId, acquiredVia: "free_agency" });

      await tx.delete(cfbLineups).where(
        and(
          eq(cfbLineups.leagueId, leagueId),
          eq(cfbLineups.userId, userId),
          eq(cfbLineups.teamId, dropTeamId),
          gte(cfbLineups.week, league.currentWeek)
        )
      );

      await tx.insert(cfbTransactions).values({
        leagueId, userId, addTeamId, dropTeamId, week: league.currentWeek,
      });
    });
  }

  async cfb_getLineup(leagueId: string, userId: string, week: number): Promise<CfbLineupRow[]> {
    return await db.select().from(cfbLineups).where(
      and(eq(cfbLineups.leagueId, leagueId), eq(cfbLineups.userId, userId), eq(cfbLineups.week, week))
    );
  }

  async cfb_setLineup(leagueId: string, userId: string, week: number, teamIds: string[]): Promise<void> {
    const league = await this.cfb_getLeague(leagueId);
    if (!league) throw new Error("League not found");
    if (week < league.currentWeek) throw new Error("That week is already finalized");

    const matchups = await db.select().from(cfbMatchups).where(
      and(eq(cfbMatchups.leagueId, leagueId), eq(cfbMatchups.week, week))
    );
    const myMatchup = matchups.find(m => m.user1Id === userId || m.user2Id === userId);
    if (myMatchup?.isComplete) throw new Error("Your matchup for that week is already scored");

    const weekGames = await this.cfb_getGamesByWeek(league.season, week);
    if (weekGames.some(g => g.status !== "scheduled")) {
      throw new Error("Lineups are locked for this week — games have already started");
    }

    const myRoster = await this.cfb_getRosterRows(leagueId, userId);
    const myTeamIds = new Set(myRoster.map(r => r.teamId));
    for (const tid of teamIds) {
      if (!myTeamIds.has(tid)) throw new Error("You can only start teams on your roster");
    }
    if (new Set(teamIds).size !== teamIds.length) throw new Error("Duplicate teams in lineup");

    await db.delete(cfbLineups).where(
      and(eq(cfbLineups.leagueId, leagueId), eq(cfbLineups.userId, userId), eq(cfbLineups.week, week))
    );
    await db.insert(cfbLineups).values(
      teamIds.map(teamId => ({ leagueId, userId, week, teamId }))
    );
  }

  async cfb_upsertGames(games: EspnCfbGame[]): Promise<number> {
    let count = 0;
    for (const g of games) {
      await db.insert(cfbGames).values({
        espnGameId: g.espnGameId,
        season: g.season,
        week: g.week,
        homeEspnTeamId: g.homeEspnTeamId,
        awayEspnTeamId: g.awayEspnTeamId,
        homeTeamName: g.homeTeamName,
        awayTeamName: g.awayTeamName,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        status: g.status,
        gameDate: g.gameDate,
      }).onConflictDoUpdate({
        target: cfbGames.espnGameId,
        set: {
          homeScore: g.homeScore,
          awayScore: g.awayScore,
          status: g.status,
          gameDate: g.gameDate,
        },
      });
      count++;
    }
    return count;
  }

  async cfb_getGamesByWeek(season: number, week: number): Promise<CfbGame[]> {
    return await db.select().from(cfbGames).where(
      and(eq(cfbGames.season, season), eq(cfbGames.week, week))
    ).orderBy(asc(cfbGames.gameDate));
  }

  async cfb_getMatchups(leagueId: string, week?: number): Promise<CfbMatchup[]> {
    if (week !== undefined) {
      return await db.select().from(cfbMatchups).where(
        and(eq(cfbMatchups.leagueId, leagueId), eq(cfbMatchups.week, week))
      );
    }
    return await db.select().from(cfbMatchups).where(eq(cfbMatchups.leagueId, leagueId)).orderBy(asc(cfbMatchups.week));
  }

  /**
   * Determines whether a lineup team won its game in the given week.
   * Returns null when the result is unknown (no game or not final).
   */
  private cfb_teamWon(team: CfbTeam, weekGames: CfbGame[]): { game: CfbGame | null; won: boolean | null } {
    const game = weekGames.find(g =>
      g.homeEspnTeamId === team.espnTeamId || g.awayEspnTeamId === team.espnTeamId
    ) ?? null;
    if (!game || game.status !== "final" || game.homeScore === null || game.awayScore === null) {
      return { game, won: null };
    }
    const isHome = game.homeEspnTeamId === team.espnTeamId;
    const won = isHome ? game.homeScore > game.awayScore : game.awayScore > game.homeScore;
    return { game, won };
  }

  async cfb_getMatchupsWithDetails(leagueId: string, week: number): Promise<CfbMatchupWithDetails[]> {
    const league = await this.cfb_getLeague(leagueId);
    if (!league) return [];

    const matchups = await this.cfb_getMatchups(leagueId, week);
    const weekGames = await this.cfb_getGamesByWeek(league.season, week);
    const teams = await this.cfb_getTeams();
    const teamMap = new Map(teams.map(t => [t.id, t]));

    const buildLineup = async (userId: string) => {
      const lineupRows = await this.cfb_getLineup(leagueId, userId, week);
      return lineupRows.map(row => {
        const team = teamMap.get(row.teamId)!;
        const { game, won } = this.cfb_teamWon(team, weekGames);
        return { team, game, won };
      }).filter(e => e.team);
    };

    const result: CfbMatchupWithDetails[] = [];
    for (const m of matchups) {
      const user1 = await this.getUser(m.user1Id);
      const user2 = m.user2Id ? await this.getUser(m.user2Id) : null;
      if (!user1) continue;
      result.push({
        ...m,
        user1: { id: user1.id, username: user1.username },
        user2: user2 ? { id: user2.id, username: user2.username } : null,
        user1Lineup: await buildLineup(m.user1Id),
        user2Lineup: m.user2Id ? await buildLineup(m.user2Id) : [],
      });
    }
    return result;
  }

  /**
   * Scores all matchups for the given week, advances the league week, and
   * generates playoff matchups when entering weeks 12-14.
   * Playoff ties are broken in favor of the higher seed.
   */
  async cfb_finalizeWeek(leagueId: string, week: number): Promise<void> {
    const league = await this.cfb_getLeague(leagueId);
    if (!league) throw new Error("League not found");
    if (week !== league.currentWeek) throw new Error(`Current week is ${league.currentWeek}, not ${week}`);

    const matchups = await this.cfb_getMatchups(leagueId, week);
    const weekGames = await this.cfb_getGamesByWeek(league.season, week);
    const teams = await this.cfb_getTeams();
    const teamMap = new Map(teams.map(t => [t.id, t]));

    const seeds = league.currentWeek > DatabaseStorage.CFB_REGULAR_SEASON_WEEKS
      ? await this.cfb_getPlayoffSeeds(leagueId)
      : null;

    const countWins = async (userId: string): Promise<number> => {
      const lineupRows = await this.cfb_getLineup(leagueId, userId, week);
      let wins = 0;
      for (const row of lineupRows) {
        const team = teamMap.get(row.teamId);
        if (!team) continue;
        const { won } = this.cfb_teamWon(team, weekGames);
        if (won === true) wins++;
      }
      return wins;
    };

    for (const m of matchups) {
      if (m.isComplete) continue;
      const user1Wins = await countWins(m.user1Id);
      const user2Wins = m.user2Id ? await countWins(m.user2Id) : 0;

      let winnerId: string | null = null;
      if (!m.user2Id) {
        winnerId = m.user1Id;
      } else if (user1Wins > user2Wins) {
        winnerId = m.user1Id;
      } else if (user2Wins > user1Wins) {
        winnerId = m.user2Id;
      } else if (m.isPlayoff && seeds) {
        const seed1 = seeds.indexOf(m.user1Id);
        const seed2 = seeds.indexOf(m.user2Id);
        winnerId = seed1 <= seed2 ? m.user1Id : m.user2Id;
      }

      await db.update(cfbMatchups).set({
        user1Wins,
        user2Wins,
        winnerId,
        isComplete: true,
      }).where(eq(cfbMatchups.id, m.id));
    }

    const nextWeek = week + 1;
    await this.cfb_updateLeague(leagueId, { currentWeek: nextWeek });

    if (nextWeek === 12) await this.cfb_generateQuarterfinals(leagueId);
    else if (nextWeek === 13) await this.cfb_generateSemifinals(leagueId);
    else if (nextWeek === 14) await this.cfb_generateChampionship(leagueId);
  }

  /** Playoff seeds: standings order after the regular season (weeks 1-11). */
  private async cfb_getPlayoffSeeds(leagueId: string): Promise<string[]> {
    const standings = await this.cfb_getStandings(leagueId);
    return standings.map(s => s.userId);
  }

  private async cfb_generateQuarterfinals(leagueId: string): Promise<void> {
    const seeds = await this.cfb_getPlayoffSeeds(leagueId);
    if (seeds.length < DatabaseStorage.CFB_PLAYOFF_TEAMS) return;

    const existing = await this.cfb_getMatchups(leagueId, 12);
    if (existing.length > 0) return;

    await db.insert(cfbMatchups).values([
      { leagueId, week: 12, user1Id: seeds[2], user2Id: seeds[5], isPlayoff: true, playoffRound: "quarterfinal" },
      { leagueId, week: 12, user1Id: seeds[3], user2Id: seeds[4], isPlayoff: true, playoffRound: "quarterfinal" },
    ]);
  }

  private async cfb_generateSemifinals(leagueId: string): Promise<void> {
    const seeds = await this.cfb_getPlayoffSeeds(leagueId);
    const existing = await this.cfb_getMatchups(leagueId, 13);
    if (existing.length > 0) return;

    if (seeds.length >= DatabaseStorage.CFB_PLAYOFF_TEAMS) {
      // 6+ members: top 2 seeds get byes, face quarterfinal winners
      const qf = (await this.cfb_getMatchups(leagueId, 12)).filter(m => m.isPlayoff && m.isComplete);
      if (qf.length < 2) return;

      const winners = qf.map(m => m.winnerId).filter((id): id is string => !!id);
      winners.sort((a, b) => seeds.indexOf(a) - seeds.indexOf(b));

      await db.insert(cfbMatchups).values([
        { leagueId, week: 13, user1Id: seeds[0], user2Id: winners[1] ?? null, isPlayoff: true, playoffRound: "semifinal" },
        { leagueId, week: 13, user1Id: seeds[1], user2Id: winners[0] ?? null, isPlayoff: true, playoffRound: "semifinal" },
      ]);
    } else if (seeds.length >= 4) {
      // 4-5 members: no quarterfinals, straight to semis (1v4, 2v3)
      await db.insert(cfbMatchups).values([
        { leagueId, week: 13, user1Id: seeds[0], user2Id: seeds[3], isPlayoff: true, playoffRound: "semifinal" },
        { leagueId, week: 13, user1Id: seeds[1], user2Id: seeds[2], isPlayoff: true, playoffRound: "semifinal" },
      ]);
    }
    // 2-3 members: no semifinals; top 2 seeds go straight to the championship
  }

  private async cfb_generateChampionship(leagueId: string): Promise<void> {
    const existing = await this.cfb_getMatchups(leagueId, 14);
    if (existing.length > 0) return;

    const seeds = await this.cfb_getPlayoffSeeds(leagueId);

    if (seeds.length >= 4) {
      const sf = (await this.cfb_getMatchups(leagueId, 13)).filter(m => m.isPlayoff && m.isComplete);
      if (sf.length < 2) return;

      const winners = sf.map(m => m.winnerId).filter((id): id is string => !!id);
      if (winners.length < 2) return;

      await db.insert(cfbMatchups).values([
        { leagueId, week: 14, user1Id: winners[0], user2Id: winners[1], isPlayoff: true, playoffRound: "championship" },
      ]);
    } else if (seeds.length >= 2) {
      // 2-3 members: top 2 seeds play the championship directly
      await db.insert(cfbMatchups).values([
        { leagueId, week: 14, user1Id: seeds[0], user2Id: seeds[1], isPlayoff: true, playoffRound: "championship" },
      ]);
    }
  }

  async cfb_getTrades(leagueId: string): Promise<CfbTradeWithDetails[]> {
    const trades = await db.select().from(cfbTrades)
      .where(eq(cfbTrades.leagueId, leagueId))
      .orderBy(desc(cfbTrades.createdAt));
    const teams = await this.cfb_getTeams();
    const teamMap = new Map(teams.map(t => [t.id, t]));

    const result: CfbTradeWithDetails[] = [];
    for (const t of trades) {
      const proposer = await this.getUser(t.proposerId);
      const receiver = await this.getUser(t.receiverId);
      if (!proposer || !receiver) continue;
      result.push({
        ...t,
        proposer: { id: proposer.id, username: proposer.username },
        receiver: { id: receiver.id, username: receiver.username },
        proposerTeams: t.proposerTeamIds.map(id => teamMap.get(id)).filter((x): x is CfbTeam => !!x),
        receiverTeams: t.receiverTeamIds.map(id => teamMap.get(id)).filter((x): x is CfbTeam => !!x),
      });
    }
    return result;
  }

  async cfb_createTrade(leagueId: string, proposerId: string, receiverId: string, proposerTeamIds: string[], receiverTeamIds: string[]): Promise<CfbTrade> {
    const league = await this.cfb_getLeague(leagueId);
    if (!league) throw new Error("League not found");
    if (league.draftStatus !== "completed") throw new Error("Trades open after the draft");
    if (proposerId === receiverId) throw new Error("You can't trade with yourself");

    const isReceiverMember = await this.cfb_isLeagueMember(leagueId, receiverId);
    if (!isReceiverMember) throw new Error("That user is not in this league");

    const proposerRoster = await this.cfb_getRosterRows(leagueId, proposerId);
    const receiverRoster = await this.cfb_getRosterRows(leagueId, receiverId);
    const proposerOwned = new Set(proposerRoster.map(r => r.teamId));
    const receiverOwned = new Set(receiverRoster.map(r => r.teamId));

    for (const tid of proposerTeamIds) {
      if (!proposerOwned.has(tid)) throw new Error("You can only offer teams on your roster");
    }
    for (const tid of receiverTeamIds) {
      if (!receiverOwned.has(tid)) throw new Error("You can only request teams on their roster");
    }

    const [trade] = await db.insert(cfbTrades).values({
      leagueId,
      proposerId,
      receiverId,
      proposerTeamIds,
      receiverTeamIds,
      status: "pending",
    }).returning();
    return trade;
  }

  async cfb_respondTrade(leagueId: string, tradeId: string, userId: string, action: 'accept' | 'reject' | 'cancel'): Promise<CfbTrade> {
    const [trade] = await db.select().from(cfbTrades).where(
      and(eq(cfbTrades.id, tradeId), eq(cfbTrades.leagueId, leagueId))
    );
    if (!trade) throw new Error("Trade not found");
    if (trade.status !== "pending") throw new Error("Trade is no longer pending");

    if (action === "cancel") {
      if (trade.proposerId !== userId) throw new Error("Only the proposer can cancel");
      const [updated] = await db.update(cfbTrades).set({ status: "cancelled", resolvedAt: new Date() })
        .where(eq(cfbTrades.id, tradeId)).returning();
      return updated;
    }

    if (trade.receiverId !== userId) throw new Error("Only the receiver can respond to this trade");

    if (action === "reject") {
      const [updated] = await db.update(cfbTrades).set({ status: "rejected", resolvedAt: new Date() })
        .where(eq(cfbTrades.id, tradeId)).returning();
      return updated;
    }

    // Accept: re-verify ownership, then swap rosters
    const league = await this.cfb_getLeague(leagueId);
    if (!league) throw new Error("League not found");

    const proposerRoster = await this.cfb_getRosterRows(leagueId, trade.proposerId);
    const receiverRoster = await this.cfb_getRosterRows(leagueId, trade.receiverId);
    const proposerOwned = new Set(proposerRoster.map(r => r.teamId));
    const receiverOwned = new Set(receiverRoster.map(r => r.teamId));

    for (const tid of trade.proposerTeamIds) {
      if (!proposerOwned.has(tid)) throw new Error("Trade invalid: proposer no longer owns all offered teams");
    }
    for (const tid of trade.receiverTeamIds) {
      if (!receiverOwned.has(tid)) throw new Error("Trade invalid: you no longer own all requested teams");
    }

    return await db.transaction(async (tx) => {
      for (const tid of trade.proposerTeamIds) {
        await tx.update(cfbRosters).set({ userId: trade.receiverId, acquiredVia: "trade" })
          .where(and(eq(cfbRosters.leagueId, leagueId), eq(cfbRosters.teamId, tid)));
      }
      for (const tid of trade.receiverTeamIds) {
        await tx.update(cfbRosters).set({ userId: trade.proposerId, acquiredVia: "trade" })
          .where(and(eq(cfbRosters.leagueId, leagueId), eq(cfbRosters.teamId, tid)));
      }

      const movedTeamIds = [...trade.proposerTeamIds, ...trade.receiverTeamIds];
      if (movedTeamIds.length > 0) {
        await tx.delete(cfbLineups).where(
          and(
            eq(cfbLineups.leagueId, leagueId),
            inArray(cfbLineups.teamId, movedTeamIds),
            gte(cfbLineups.week, league.currentWeek)
          )
        );
      }

      const [updated] = await tx.update(cfbTrades).set({ status: "accepted", resolvedAt: new Date() })
        .where(eq(cfbTrades.id, tradeId)).returning();
      return updated;
    });
  }

  /** Standings sorted with the same logic as Gambling League: wins, then total team wins. */
  async cfb_getStandings(leagueId: string): Promise<CfbStandingEntry[]> {
    const members = await this.cfb_getLeagueMembers(leagueId);
    const allMatchups = await this.cfb_getMatchups(leagueId);
    const regularSeason = allMatchups.filter(m => !m.isPlayoff);

    const standings: CfbStandingEntry[] = [];
    for (const member of members) {
      const uid = member.userId;
      let wins = 0, losses = 0, draws = 0, totalTeamWins = 0;

      for (const m of regularSeason) {
        if (!m.isComplete) continue;
        if (m.user1Id === uid) {
          if (m.winnerId === uid) wins++;
          else if (m.winnerId && m.winnerId !== uid) losses++;
          else draws++;
          totalTeamWins += m.user1Wins ?? 0;
        } else if (m.user2Id === uid) {
          if (m.winnerId === uid) wins++;
          else if (m.winnerId && m.winnerId !== uid) losses++;
          else draws++;
          totalTeamWins += m.user2Wins ?? 0;
        }
      }

      standings.push({
        userId: uid,
        username: member.user.username,
        wins,
        losses,
        draws,
        totalTeamWins,
      });
    }

    return standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.totalTeamWins - a.totalTeamWins;
    });
  }
}

export const storage = new DatabaseStorage();

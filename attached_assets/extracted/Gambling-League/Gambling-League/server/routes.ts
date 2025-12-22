import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { 
  insertLeagueSchema, 
  insertGameSchema, 
  updateGameResultSchema, 
  insertUserSchema,
  loginUserSchema,
  changePasswordSchema,
  picks, 
  games,
  type User,
  type InsertGame,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

// Helper to generate round-robin schedule
function generateRoundRobinSchedule(memberIds: string[], totalWeeks: number = 14): any[] {
  const n = memberIds.length;
  const rounds = n % 2 === 0 ? n - 1 : n;
  const matchups: any[] = [];

  // If odd number, add a "bye" player
  const players = [...memberIds];
  if (n % 2 !== 0) {
    players.push('BYE');
  }

  const numPlayers = players.length;

  for (let week = 1; week <= totalWeeks; week++) {
    const roundIndex = (week - 1) % rounds;
    
    // Generate pairings for this round
    for (let i = 0; i < numPlayers / 2; i++) {
      const home = (roundIndex + i) % (numPlayers - 1);
      const away = (numPlayers - 1 - i + roundIndex) % (numPlayers - 1);

      let player1Index = i === 0 ? numPlayers - 1 : home;
      let player2Index = away;

      const player1 = players[player1Index];
      const player2 = players[player2Index];

      if (player1 !== 'BYE' && player2 !== 'BYE') {
        matchups.push({
          week,
          user1Id: player1,
          user2Id: player2,
        });
      } else if (player1 !== 'BYE') {
        matchups.push({
          week,
          user1Id: player1,
          user2Id: null, // Bye week
        });
      } else if (player2 !== 'BYE') {
        matchups.push({
          week,
          user1Id: player2,
          user2Id: null, // Bye week
        });
      }
    }
  }

  return matchups;
}

// Helper to generate playoff brackets based on standings
async function generatePlayoffBrackets(leagueId: string, week: number): Promise<any[]> {
  console.log(`[Playoffs] Generating playoff brackets for league ${leagueId}, week ${week}`);
  
  // Get standings after week 14 (regular season)
  const matchups = await storage.getLeagueMatchups(leagueId);
  const members = await storage.getLeagueMembers(leagueId);
  
  // Filter to regular season matchups (weeks 1-14) that are complete
  const regularSeasonMatchups = matchups.filter(m => m.week <= 14 && m.isComplete);
  
  // Calculate standings
  const standings = await Promise.all(
    members.map(async (member) => {
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let totalNPW = 0;
      
      const userMatchups = regularSeasonMatchups.filter(
        m => m.user1Id === member.userId || m.user2Id === member.userId
      );
      
      for (const matchup of userMatchups) {
        if (matchup.user1Id === member.userId) {
          totalNPW += matchup.user1Npw || 0;
          if (matchup.winnerId === member.userId) wins++;
          else if (!matchup.winnerId && matchup.user2Id) draws++;
          else if (matchup.user2Id) losses++;
        } else {
          totalNPW += matchup.user2Npw || 0;
          if (matchup.winnerId === member.userId) wins++;
          else if (!matchup.winnerId) draws++;
          else losses++;
        }
      }
      
      return {
        userId: member.userId,
        wins,
        draws,
        losses,
        totalNPW,
      };
    })
  );
  
  // Sort by wins, then draws, then NPW (same logic as standings endpoint)
  const sortedStandings = standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.draws !== a.draws) return b.draws - a.draws;
    return b.totalNPW - a.totalNPW;
  });
  
  console.log(`[Playoffs] Standings after week 14:`, sortedStandings.map((s, i) => ({
    seed: i + 1,
    userId: s.userId,
    record: `${s.wins}-${s.losses}-${s.draws}`,
    npw: s.totalNPW
  })));
  
  const playoffMatchups: any[] = [];
  
  if (week === 15) {
    // Week 15: Quarterfinals - Top 8 teams
    // Seed 1 vs 8, 2 vs 7, 3 vs 6, 4 vs 5
    if (sortedStandings.length >= 8) {
      playoffMatchups.push(
        { week: 15, user1Id: sortedStandings[0].userId, user2Id: sortedStandings[7].userId }, // 1 vs 8
        { week: 15, user1Id: sortedStandings[1].userId, user2Id: sortedStandings[6].userId }, // 2 vs 7
        { week: 15, user1Id: sortedStandings[2].userId, user2Id: sortedStandings[5].userId }, // 3 vs 6
        { week: 15, user1Id: sortedStandings[3].userId, user2Id: sortedStandings[4].userId }  // 4 vs 5
      );
      console.log(`[Playoffs] Created 4 quarterfinal matchups for week 15`);
    }
  } else if (week === 16) {
    // Week 16: Semifinals - Winners from week 15
    const week15Matchups = matchups.filter(m => m.week === 15 && m.isComplete);
    if (week15Matchups.length === 4) {
      // Sort matchups by ID to ensure consistent ordering
      const sortedWeek15 = [...week15Matchups].sort((a, b) => a.id.localeCompare(b.id));
      const winners = sortedWeek15.map(m => m.winnerId).filter(id => id !== null);
      
      if (winners.length === 4) {
        // Winner of matchup 0 (1v8) plays winner of matchup 1 (2v7)
        // Winner of matchup 2 (3v6) plays winner of matchup 3 (4v5)
        playoffMatchups.push(
          { week: 16, user1Id: winners[0], user2Id: winners[1] },
          { week: 16, user1Id: winners[2], user2Id: winners[3] }
        );
        console.log(`[Playoffs] Created 2 semifinal matchups for week 16`);
        console.log(`[Playoffs] Semifinal 1: ${winners[0]} vs ${winners[1]}`);
        console.log(`[Playoffs] Semifinal 2: ${winners[2]} vs ${winners[3]}`);
      }
    }
  } else if (week === 17) {
    // Week 17: Championship - Winners from week 16
    const week16Matchups = matchups.filter(m => m.week === 16 && m.isComplete);
    if (week16Matchups.length === 2) {
      // Sort matchups by ID to ensure consistent ordering
      const sortedWeek16 = [...week16Matchups].sort((a, b) => a.id.localeCompare(b.id));
      const winners = sortedWeek16.map(m => m.winnerId).filter(id => id !== null);
      
      if (winners.length === 2) {
        playoffMatchups.push(
          { week: 17, user1Id: winners[0], user2Id: winners[1] }
        );
        console.log(`[Playoffs] Created championship matchup for week 17`);
        console.log(`[Playoffs] Championship: ${winners[0]} vs ${winners[1]}`);
      }
    }
  }
  
  return playoffMatchups;
}

// Helper to calculate NPW for a user in a week
async function calculateUserNPW(userId: string, leagueId: string, week: number): Promise<number> {
  const userPicks = await storage.getUserPicks(userId, leagueId, week);
  // Exclude pushes from NPW calculation
  const correct = userPicks.filter(p => p.isCorrect === true && !p.isPush).length;
  const incorrect = userPicks.filter(p => p.isCorrect === false && !p.isPush).length;
  return correct - incorrect;
}

// Helper to determine if a date is in Daylight Saving Time (EDT) or Standard Time (EST)
// DST starts: Second Sunday in March at 2:00 AM
// DST ends: First Sunday in November at 2:00 AM
function isEasternDST(year: number, month: number, day: number, hour: number): boolean {
  // Outside the possible DST range
  if (month < 2 || month > 10) return false; // Before March or after November
  if (month > 2 && month < 10) return true; // April through October
  
  // Helper to find the nth occurrence of a day of week in a month
  function getNthSundayOfMonth(year: number, month: number, n: number): number {
    const firstDay = new Date(year, month, 1);
    const firstSunday = ((7 - firstDay.getDay()) % 7) + 1; // Day of first Sunday
    return firstSunday + ((n - 1) * 7);
  }
  
  if (month === 2) {
    // March: DST starts on second Sunday at 2:00 AM
    const secondSunday = getNthSundayOfMonth(year, 2, 2);
    if (day < secondSunday) return false;
    if (day > secondSunday) return true;
    // On the transition day, check the hour (DST starts at 2:00 AM)
    return hour >= 2;
  }
  
  if (month === 10) {
    // November: DST ends on first Sunday at 2:00 AM
    const firstSunday = getNthSundayOfMonth(year, 10, 1);
    if (day < firstSunday) return true;
    if (day > firstSunday) return false;
    // On the transition day, check the hour (DST ends at 2:00 AM)
    return hour < 2;
  }
  
  return false;
}

// Helper to convert Eastern Time to UTC
// Admin enters times in Eastern Time, we need to store in UTC
function convertEasternToUTC(dateTimeString: string): Date {
  // dateTimeString is like "2024-01-15T13:00" from datetime-local input
  // Admin intends this to be Eastern Time, e.g., 1:00 PM Eastern
  
  // Parse the components manually to avoid timezone interpretation
  const parts = dateTimeString.split('T');
  const dateParts = parts[0].split('-');
  const timeParts = parts[1].split(':');
  
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
  const day = parseInt(dateParts[2]);
  const hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);
  
  // Determine if we're in EST (UTC-5) or EDT (UTC-4)
  const isDST = isEasternDST(year, month, day, hour);
  
  // Eastern Time is UTC-5 (EST) or UTC-4 (EDT)
  // To convert Eastern to UTC, we ADD the offset
  // E.g., 1:00 PM EST = 1:00 PM + 5 hours = 6:00 PM UTC
  const offsetHours = isDST ? 4 : 5;
  
  // Create UTC date by adding the offset
  const utcTime = new Date(Date.UTC(year, month, day, hour + offsetHours, minute));
  
  console.log(`[Timezone Conversion] Input: ${dateTimeString} ET, DST: ${isDST}, Offset: +${offsetHours}h, UTC: ${utcTime.toISOString()}`);
  
  return utcTime;
}

// Helper to check if picks are locked (based on first game time of the week)
async function arePicksLocked(week: number): Promise<{ locked: boolean; firstGameTime?: Date }> {
  const games = await storage.getGamesByWeek(week);
  
  if (games.length === 0) {
    // No games scheduled for this week, picks are not locked
    return { locked: false };
  }
  
  // Find the earliest game time
  const firstGame = games.reduce((earliest, game) => {
    if (!earliest || game.gameTime < earliest.gameTime) {
      return game;
    }
    return earliest;
  });
  
  // Ensure both dates are proper Date objects and compare timestamps
  const now = new Date();
  const gameTime = new Date(firstGame.gameTime);
  
  // Compare using UTC timestamps to avoid timezone issues
  const locked = now.getTime() >= gameTime.getTime();
  
  console.log(`[Pick Lock Check] Week ${week}:`, {
    now: now.toISOString(),
    gameTime: gameTime.toISOString(),
    locked,
    difference: (gameTime.getTime() - now.getTime()) / 1000 / 60 / 60 // hours
  });
  
  return { locked, firstGameTime: firstGame.gameTime };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(userData.email!);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser(userData);
      
      // Log the user in after signup
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to log in after signup" });
        }
        // Don't send password back
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("Error creating account:", error);
      res.status(400).json({ message: error.message || "Failed to create account" });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: User | false, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to establish session" });
        }
        // Don't send password back
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as User;
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/change-password', isAuthenticated, async (req: any, res) => {
    try {
      const data = changePasswordSchema.parse(req.body);
      const user = req.user as User;
      
      // Verify current password
      const isValid = await storage.verifyPassword(user.id, data.currentPassword);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Update to new password
      await storage.changePassword(user.id, data.newPassword);
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      res.status(400).json({ message: error.message || "Failed to change password" });
    }
  });

  // League routes
  app.post('/api/leagues', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as User).id;
      const leagueData = insertLeagueSchema.parse(req.body);
      const league = await storage.createLeague(userId, leagueData);
      res.json(league);
    } catch (error: any) {
      console.error("Error creating league:", error);
      res.status(400).json({ message: error.message || "Failed to create league" });
    }
  });

  app.get('/api/leagues', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as User).id;
      const allLeagues = await storage.getLeagues(userId);
      
      // Get member counts and user membership info
      const leaguesWithDetails = await Promise.all(
        allLeagues.map(async (league) => {
          const members = await storage.getLeagueMembers(league.id);
          const userMember = members.find(m => m.userId === userId);
          return {
            ...league,
            memberCount: members.length,
            userMember,
          };
        })
      );

      res.json(leaguesWithDetails);
    } catch (error) {
      console.error("Error fetching leagues:", error);
      res.status(500).json({ message: "Failed to fetch leagues" });
    }
  });

  app.get('/api/leagues/search', isAuthenticated, async (req: any, res) => {
    try {
      const searchTerm = req.query.searchTerm as string;
      if (!searchTerm) {
        return res.json([]);
      }
      
      const leagues = await storage.searchLeagues(searchTerm);
      res.json(leagues);
    } catch (error) {
      console.error("Error searching leagues:", error);
      res.status(500).json({ message: "Failed to search leagues" });
    }
  });

  app.get('/api/leagues/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;
      
      const league = await storage.getLeagueById(id);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }

      const members = await storage.getLeagueMembers(id);
      
      // Get user details for each member
      const membersWithUsers = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return { ...member, user };
        })
      );

      res.json({
        ...league,
        members: membersWithUsers,
        memberCount: members.length,
      });
    } catch (error) {
      console.error("Error fetching league:", error);
      res.status(500).json({ message: "Failed to fetch league" });
    }
  });

  app.post('/api/leagues/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;

      const league = await storage.getLeagueById(id);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }

      if (league.status !== 'open') {
        return res.status(400).json({ message: "League is not open for joining" });
      }

      const currentMembers = await storage.getLeagueMemberCount(id);
      if (currentMembers >= league.capacity) {
        return res.status(400).json({ message: "League is full" });
      }

      await storage.joinLeague(userId, id);
      
      // Check if league is now full
      const newMemberCount = await storage.getLeagueMemberCount(id);
      if (newMemberCount === league.capacity) {
        // League is full, update status and generate schedule
        await storage.updateLeagueStatus(id, 'full');
        
        // Generate round-robin schedule
        const members = await storage.getLeagueMembers(id);
        const memberIds = members.map(m => m.userId);
        const schedule = generateRoundRobinSchedule(memberIds, 14);
        
        const matchups = schedule.map(s => ({
          ...s,
          leagueId: id,
        }));
        
        await storage.createMatchups(matchups);
      }

      res.json({ message: "Successfully joined league" });
    } catch (error: any) {
      console.error("Error joining league:", error);
      res.status(400).json({ message: error.message || "Failed to join league" });
    }
  });

  // Games routes
  app.get('/api/weeks/:weekNumber/games/:leagueId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as User).id;
      const { weekNumber, leagueId } = req.params;
      const week = parseInt(weekNumber);

      const games = await storage.getGamesByWeek(week);
      const userPicks = await storage.getUserPicks(userId, leagueId, week);

      // Combine games with user picks
      const gamesWithPicks = games.map(game => {
        const userPick = userPicks.find(p => p.gameId === game.id);
        return { ...game, userPick };
      });

      res.json(gamesWithPicks);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Picks routes
  app.post('/api/picks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as User).id;
      
      const { picks } = req.body;
      if (!Array.isArray(picks) || picks.length === 0) {
        return res.status(400).json({ message: "Invalid picks data" });
      }

      // Get the week from the first pick (all picks should be for the same week)
      const week = picks[0].week;
      
      const lockStatus = await arePicksLocked(week);
      if (lockStatus.locked) {
        const lockTime = lockStatus.firstGameTime?.toLocaleString('en-US', { 
          timeZone: 'America/New_York',
          weekday: 'short',
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });
        return res.status(400).json({ 
          message: `Picks are locked. The first game started at ${lockTime}` 
        });
      }

      await storage.submitPicks(userId, picks);
      res.json({ message: "Picks submitted successfully" });
    } catch (error: any) {
      console.error("Error submitting picks:", error);
      res.status(400).json({ message: error.message || "Failed to submit picks" });
    }
  });

  // Pick history and statistics
  app.get('/api/users/:userId/pick-history', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = (req.user as User).id;
      const { week, leagueId, season } = req.query;

      // Authorization: users can only view their own history unless admin
      const requestingUser = await storage.getUser(requestingUserId);
      if (userId !== requestingUserId && !requestingUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden: You can only view your own pick history" });
      }

      // Build query conditions
      const conditions: any[] = [eq(picks.userId, userId)];
      if (leagueId) conditions.push(eq(picks.leagueId, leagueId));
      if (week) conditions.push(eq(picks.week, parseInt(week as string)));
      
      // Season filter: 'regular' = weeks 1-17, 'playoffs' = weeks 18+
      if (season === 'regular') {
        conditions.push(sql`${picks.week} <= 17`);
      } else if (season === 'playoffs') {
        conditions.push(sql`${picks.week} > 17`);
      }

      // Get all picks with game details
      const query = db
        .select({
          pick: picks,
          game: {
            id: games.id,
            week: games.week,
            homeTeam: games.homeTeam,
            awayTeam: games.awayTeam,
            spread: games.spread,
            homeScore: games.homeScore,
            awayScore: games.awayScore,
            isComplete: games.isComplete,
          }
        })
        .from(picks)
        .innerJoin(games, eq(picks.gameId, games.id));
      
      const userPicks = conditions.length > 1 
        ? await query.where(and(...conditions))
        : await query.where(conditions[0]);

      // Calculate statistics
      const totalPicks = userPicks.length;
      const correctPicks = userPicks.filter(p => p.pick.isCorrect === true).length;
      const incorrectPicks = userPicks.filter(p => p.pick.isCorrect === false).length;
      const pendingPicks = userPicks.filter(p => p.pick.isCorrect === null).length;
      const accuracy = totalPicks > 0 ? (correctPicks / totalPicks) * 100 : 0;

      // Weekly performance breakdown
      const weeklyStats = userPicks.reduce((acc, pick) => {
        const week = pick.game.week;
        if (!acc[week]) {
          acc[week] = { week, correct: 0, incorrect: 0, pending: 0, npw: 0 };
        }
        if (pick.pick.isCorrect === true) {
          acc[week].correct++;
          acc[week].npw++;
        } else if (pick.pick.isCorrect === false) {
          acc[week].incorrect++;
          acc[week].npw--;
        } else {
          acc[week].pending++;
        }
        return acc;
      }, {} as Record<number, any>);

      // Calculate favorite teams (most picked)
      const teamPicks = userPicks.reduce((acc, pick) => {
        const team = pick.pick.pickedTeam === 'home' ? pick.game.homeTeam : pick.game.awayTeam;
        if (!acc[team]) {
          acc[team] = { team, count: 0, correct: 0 };
        }
        acc[team].count++;
        if (pick.pick.isCorrect === true) acc[team].correct++;
        return acc;
      }, {} as Record<string, any>);

      const favoriteTeams = Object.values(teamPicks)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5)
        .map((t: any) => ({
          ...t,
          accuracy: t.count > 0 ? ((t.correct / t.count) * 100).toFixed(1) : 0,
        }));

      // Find best and worst weeks
      const weeklyArray = Object.values(weeklyStats);
      const bestWeek = weeklyArray.reduce((best: any, curr: any) => 
        (!best || curr.npw > best.npw) ? curr : best, null);
      const worstWeek = weeklyArray.reduce((worst: any, curr: any) => 
        (!worst || curr.npw < worst.npw) ? curr : worst, null);

      res.json({
        picks: userPicks,
        statistics: {
          totalPicks,
          correctPicks,
          incorrectPicks,
          pendingPicks,
          accuracy: parseFloat(accuracy.toFixed(2)),
          weeklyBreakdown: weeklyArray,
          favoriteTeams,
          bestWeek,
          worstWeek,
        },
      });
    } catch (error) {
      console.error("Error fetching pick history:", error);
      res.status(500).json({ message: "Failed to fetch pick history" });
    }
  });

  // Standings routes
  app.get('/api/leagues/:id/standings', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { week, season, viewType, playoffRound } = req.query;

      const matchups = await storage.getLeagueMatchups(id);
      const members = await storage.getLeagueMembers(id);

      // Filter matchups based on query params
      let filteredMatchups = matchups.filter(m => m.isComplete);
      
      if (week) {
        // Weekly view: only this specific week
        filteredMatchups = filteredMatchups.filter(m => m.week === parseInt(week as string));
      } else if (playoffRound && season === 'playoffs') {
        // Specific playoff round: map round to week (round 1 = week 18, round 2 = week 19, etc.)
        const playoffWeek = 17 + parseInt(playoffRound as string);
        filteredMatchups = filteredMatchups.filter(m => m.week === playoffWeek);
      } else if (season === 'regular') {
        // Regular season: weeks 1-17
        filteredMatchups = filteredMatchups.filter(m => m.week <= 17);
      } else if (season === 'playoffs') {
        // All playoffs: weeks 18+
        filteredMatchups = filteredMatchups.filter(m => m.week > 17);
      }
      // else: cumulative (all weeks) - no filter needed

      // Calculate standings for each member
      const standings = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          
          // Calculate W-D-L from filtered matchups
          let wins = 0;
          let draws = 0;
          let losses = 0;
          let totalNPW = 0;

          const userMatchups = filteredMatchups.filter(
            m => m.user1Id === member.userId || m.user2Id === member.userId
          );

          for (const matchup of userMatchups) {
            if (matchup.user1Id === member.userId) {
              totalNPW += matchup.user1Npw || 0;
              if (matchup.winnerId === member.userId) wins++;
              else if (!matchup.winnerId && matchup.user2Id) draws++;
              else if (matchup.user2Id) losses++;
            } else {
              totalNPW += matchup.user2Npw || 0;
              if (matchup.winnerId === member.userId) wins++;
              else if (!matchup.winnerId) draws++;
              else losses++;
            }
          }

          // Calculate pick win percentage from filtered picks
          const pickConditions: any[] = [
            eq(picks.userId, member.userId),
            eq(picks.leagueId, id)
          ];
          
          if (week) {
            pickConditions.push(eq(picks.week, parseInt(week as string)));
          } else if (playoffRound && season === 'playoffs') {
            const playoffWeek = 17 + parseInt(playoffRound as string);
            pickConditions.push(eq(picks.week, playoffWeek));
          } else if (season === 'regular') {
            pickConditions.push(sql`${picks.week} <= 17`);
          } else if (season === 'playoffs') {
            pickConditions.push(sql`${picks.week} > 17`);
          }

          const allPicks = await db.select().from(picks).where(and(...pickConditions));
          const totalPicks = allPicks.length;
          const correctPicks = allPicks.filter(p => p.isCorrect === true).length;
          const pickWinPercentage = totalPicks > 0 ? (correctPicks / totalPicks) * 100 : 0;

          return {
            userId: member.userId,
            user,
            wins,
            draws,
            losses,
            totalNPW,
            totalPicks,
            correctPicks,
            pickWinPercentage,
          };
        })
      );

      // Sort based on view type
      if ((viewType === 'weekly' && week) || playoffRound) {
        // For weekly/playoff round view, sort primarily by NPW (since only 1 week of data)
        standings.sort((a, b) => {
          if (b.totalNPW !== a.totalNPW) return b.totalNPW - a.totalNPW;
          return b.pickWinPercentage - a.pickWinPercentage;
        });
      } else {
        // Cumulative view: sort by Wins DESC, Draws DESC, NPW DESC, Pick Win% DESC
        standings.sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (b.draws !== a.draws) return b.draws - a.draws;
          if (b.totalNPW !== a.totalNPW) return b.totalNPW - a.totalNPW;
          return b.pickWinPercentage - a.pickWinPercentage;
        });
      }

      // Add rank
      const standingsWithRank = standings.map((s, index) => ({
        ...s,
        rank: index + 1,
      }));

      res.json(standingsWithRank);
    } catch (error) {
      console.error("Error calculating standings:", error);
      res.status(500).json({ message: "Failed to calculate standings" });
    }
  });

  // Matchups/Schedule routes
  app.get('/api/leagues/:id/matchups', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const matchups = await storage.getLeagueMatchups(id);

      // Get user details for each matchup
      const matchupsWithUsers = await Promise.all(
        matchups.map(async (matchup) => {
          const user1 = await storage.getUser(matchup.user1Id);
          const user2 = matchup.user2Id ? await storage.getUser(matchup.user2Id) : null;
          const winner = matchup.winnerId ? await storage.getUser(matchup.winnerId) : null;
          return {
            ...matchup,
            user1,
            user2,
            winner,
          };
        })
      );

      res.json(matchupsWithUsers);
    } catch (error) {
      console.error("Error fetching matchups:", error);
      res.status(500).json({ message: "Failed to fetch matchups" });
    }
  });

  // Get detailed matchup with game-by-game picks
  app.get('/api/matchups/:matchupId/details', isAuthenticated, async (req: any, res) => {
    try {
      const { matchupId } = req.params;
      
      // Get matchup
      const matchup = await storage.getMatchupById(matchupId);
      if (!matchup) {
        return res.status(404).json({ message: "Matchup not found" });
      }

      // Get users
      const user1 = await storage.getUser(matchup.user1Id);
      const user2 = matchup.user2Id ? await storage.getUser(matchup.user2Id) : null;

      // Get all games for this week
      const weekGames = await storage.getGamesByWeek(matchup.week);

      // Check if picks should be revealed (first game has started)
      let picksRevealed = false;
      if (weekGames.length > 0) {
        // Find the earliest game time
        const firstGame = weekGames.reduce((earliest, game) => {
          if (!earliest || new Date(game.gameTime) < new Date(earliest.gameTime)) {
            return game;
          }
          return earliest;
        });
        
        const now = new Date();
        const firstGameTime = new Date(firstGame.gameTime);
        picksRevealed = now >= firstGameTime;
      }

      // Only return pick data if picks are revealed
      let gameDetails;
      if (picksRevealed) {
        // Get picks for both users
        const user1Picks = await storage.getUserPicks(matchup.user1Id, matchup.leagueId, matchup.week);
        const user2Picks = matchup.user2Id 
          ? await storage.getUserPicks(matchup.user2Id, matchup.leagueId, matchup.week)
          : [];

        // Combine data for each game
        gameDetails = weekGames.map(game => {
          const user1Pick = user1Picks.find(p => p.gameId === game.id);
          const user2Pick = user2Picks.find(p => p.gameId === game.id);
          
          return {
            game,
            user1Pick: user1Pick || null,
            user2Pick: user2Pick || null,
          };
        });
      } else {
        // Return games without pick data
        gameDetails = weekGames.map(game => ({
          game,
          user1Pick: null,
          user2Pick: null,
        }));
      }

      res.json({
        matchup: {
          ...matchup,
          user1,
          user2,
        },
        gameDetails,
        picksRevealed, // Include this flag so frontend knows picks are intentionally hidden
      });
    } catch (error) {
      console.error("Error fetching matchup details:", error);
      res.status(500).json({ message: "Failed to fetch matchup details" });
    }
  });

  // Admin routes
  app.get('/api/admin/weeks/:weekNumber/games', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { weekNumber } = req.params;
      const week = parseInt(weekNumber);
      const games = await storage.getGamesByWeek(week);
      res.json(games);
    } catch (error) {
      console.error("Error fetching admin games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.post('/api/admin/weeks/:weekNumber/games', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      
      // Convert gameTime from Eastern Time to UTC
      const gameDataWithUTC = {
        ...gameData,
        gameTime: convertEasternToUTC(gameData.gameTime),
      } as unknown as InsertGame;
      
      const game = await storage.createGame(gameDataWithUTC);
      
      console.log(`[Admin] Created game for week ${game.week}`);
      
      // Update all leagues to the new week if this game's week is greater than their current week
      const allLeagues = await storage.getLeagues('');
      console.log(`[Admin] Found ${allLeagues.length} leagues to check`);
      
      for (const league of allLeagues) {
        console.log(`[Admin] Checking league ${league.id}: currentWeek=${league.currentWeek}, gameWeek=${game.week}`);
        
        // Update league week if game week is greater
        if (game.week > league.currentWeek) {
          console.log(`[Admin] Updating league ${league.id} to week ${game.week}`);
          await storage.updateLeagueWeek(league.id, game.week);
        }
        
        // Generate playoff brackets for playoff weeks (15, 16, 17) if league is at or past that week
        if (game.week >= 15 && game.week <= 17 && league.currentWeek >= game.week) {
          console.log(`[Admin] Checking playoff bracket generation for league ${league.id}, week ${game.week}`);
          
          // Check if matchups already exist for this week
          const existingMatchups = await storage.getWeekMatchups(league.id, game.week);
          
          if (existingMatchups.length === 0) {
            const playoffMatchups = await generatePlayoffBrackets(league.id, game.week);
            
            if (playoffMatchups.length > 0) {
              const matchupsWithLeagueId = playoffMatchups.map(m => ({
                ...m,
                leagueId: league.id,
              }));
              
              await storage.createMatchups(matchupsWithLeagueId);
              console.log(`[Admin] Created ${playoffMatchups.length} playoff matchups for week ${game.week}`);
            } else {
              console.log(`[Admin] No playoff matchups created (prerequisites not met)`);
            }
          } else {
            console.log(`[Admin] Playoff matchups for week ${game.week} already exist, skipping creation`);
          }
        }
      }
      
      res.json(game);
    } catch (error: any) {
      console.error("Error creating game:", error);
      res.status(400).json({ message: error.message || "Failed to create game" });
    }
  });

  app.post('/api/admin/games/:gameId/results', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { gameId } = req.params;
      const resultData = updateGameResultSchema.parse(req.body);

      await storage.updateGameResult(gameId, resultData);
      await storage.updatePickResults(gameId);

      // Check if all games in the week are now complete
      const game = await storage.getGameById(gameId);
      if (game) {
        const weekGames = await storage.getGamesByWeek(game.week);
        const allGamesComplete = weekGames.every(g => g.isComplete);
        
        // Only update matchup results if ALL games in the week are complete
        if (allGamesComplete) {
          console.log(`[Standings] All games in week ${game.week} are complete. Calculating matchup results...`);
          
          // Get all leagues
          const allLeagues = await storage.getLeagues('');
          
          for (const league of allLeagues) {
            const weekMatchups = await storage.getWeekMatchups(league.id, game.week);
            
            for (const matchup of weekMatchups) {
              const user1NPW = await calculateUserNPW(matchup.user1Id, league.id, game.week);
              const user2NPW = matchup.user2Id 
                ? await calculateUserNPW(matchup.user2Id, league.id, game.week)
                : null;

              let winnerId: string | null = null;
              if (user2NPW === null) {
                // Bye week - user1 wins automatically
                winnerId = matchup.user1Id;
              } else if (user1NPW > user2NPW) {
                winnerId = matchup.user1Id;
              } else if (user2NPW > user1NPW) {
                winnerId = matchup.user2Id;
              }
              // else it's a draw (winnerId stays null)

              await storage.updateMatchupResult(matchup.id, user1NPW, user2NPW, winnerId);
            }
          }
          
          console.log(`[Standings] Week ${game.week} matchup results calculated for all leagues`);
          
          // Generate playoff brackets when completing key weeks
          if (game.week === 14 || game.week === 15 || game.week === 16) {
            const nextWeek = game.week + 1;
            console.log(`[Playoffs] Week ${game.week} complete. Checking if week ${nextWeek} playoff brackets should be generated...`);
            
            // Get all leagues
            const allLeagues = await storage.getLeagues('');
            
            for (const league of allLeagues) {
              // Generate playoff matchups for next week if advancing to playoffs
              if (nextWeek >= 15 && nextWeek <= 17 && league.currentWeek >= game.week) {
                const existingMatchups = await storage.getWeekMatchups(league.id, nextWeek);
                
                // Only generate if matchups don't already exist
                if (existingMatchups.length === 0) {
                  const playoffMatchups = await generatePlayoffBrackets(league.id, nextWeek);
                  
                  if (playoffMatchups.length > 0) {
                    const matchupsWithLeagueId = playoffMatchups.map(m => ({
                      ...m,
                      leagueId: league.id,
                    }));
                    
                    await storage.createMatchups(matchupsWithLeagueId);
                    console.log(`[Playoffs] Auto-generated ${playoffMatchups.length} playoff matchups for week ${nextWeek}`);
                  }
                }
              }
            }
          }
        } else {
          console.log(`[Standings] Week ${game.week} has incomplete games. Skipping matchup calculation.`);
        }
      }

      res.json({ message: "Results updated successfully" });
    } catch (error: any) {
      console.error("Error updating results:", error);
      res.status(400).json({ message: error.message || "Failed to update results" });
    }
  });

  // Update game details
  app.patch('/api/admin/games/:gameId', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { gameId } = req.params;
      const updateData = insertGameSchema.partial().parse(req.body);
      
      // Convert gameTime from Eastern Time to UTC if it's being updated
      const updateDataWithUTC = (updateData.gameTime
        ? { ...updateData, gameTime: convertEasternToUTC(updateData.gameTime) }
        : updateData) as unknown as Partial<InsertGame>;
      
      await storage.updateGame(gameId, updateDataWithUTC);
      res.json({ message: "Game updated successfully" });
    } catch (error: any) {
      console.error("Error updating game:", error);
      res.status(400).json({ message: error.message || "Failed to update game" });
    }
  });

  // Delete game
  app.delete('/api/admin/games/:gameId', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { gameId } = req.params;
      
      // Delete associated picks first
      await db.delete(picks).where(eq(picks.gameId, gameId));
      
      // Delete the game
      await storage.deleteGame(gameId);
      
      res.json({ message: "Game deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting game:", error);
      res.status(400).json({ message: error.message || "Failed to delete game" });
    }
  });

  // Reset all leagues
  app.post('/api/admin/reset-all-leagues', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      // Reset all data and league status
      await storage.resetAllLeagues();
      
      // Regenerate matchups for all full leagues
      const allLeagues = await storage.getLeagues('');
      for (const league of allLeagues) {
        // Only regenerate for leagues that have enough members (full, active, or completed leagues)
        if (league.status === 'full' || league.status === 'active' || league.status === 'completed') {
          const members = await storage.getLeagueMembers(league.id);
          if (members.length >= league.capacity) {
            // Generate round-robin schedule for 14 weeks
            const memberIds = members.map(m => m.userId);
            const schedule = generateRoundRobinSchedule(memberIds, 14);
            
            const matchups = schedule.map(s => ({
              ...s,
              leagueId: league.id,
            }));
            
            await storage.createMatchups(matchups);
          }
        }
      }
      
      res.json({ message: "All leagues have been reset to Week 1" });
    } catch (error: any) {
      console.error("Error resetting leagues:", error);
      res.status(500).json({ message: error.message || "Failed to reset leagues" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

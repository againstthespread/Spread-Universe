import { 
  User, InsertUser, 
  Team, InsertTeam,
  Round, InsertRound,
  Game, InsertGame, UpdateGame,
  Pick, InsertPick,
  Notification, InsertNotification,
  GameWithTeams, UserWithStats, LeaderboardEntry
} from "@shared/schema";

// Import the complete NCAA teams data
import { ncaaTeams } from "../attached_assets/ncaa-teams-full";
import { PgStorage } from "./pgStorage";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserWithStats(id: number): Promise<UserWithStats | undefined>;
  
  // Team methods
  getTeam(id: number): Promise<Team | undefined>;
  getTeamByName(name: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined>;
  getTeams(): Promise<Team[]>;
  
  // Round methods
  getRound(id: number): Promise<Round | undefined>;
  getRoundByName(name: string): Promise<Round | undefined>;
  createRound(round: InsertRound): Promise<Round>;
  getRounds(): Promise<Round[]>;
  
  // Game methods
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: UpdateGame): Promise<Game | undefined>;
  deleteGame(id: number): Promise<boolean>;
  getGamesByRound(roundId: number): Promise<Game[]>;
  getGameWithTeams(id: number): Promise<GameWithTeams | undefined>;
  getGamesByRoundWithTeams(roundId: number): Promise<GameWithTeams[]>;
  getUpcomingGames(): Promise<GameWithTeams[]>;
  getLiveGames(): Promise<GameWithTeams[]>;
  getCompletedGames(): Promise<GameWithTeams[]>;
  
  // Pick methods
  getPick(id: number): Promise<Pick | undefined>;
  getPickByUserAndGame(userId: number, gameId: number): Promise<Pick | undefined>;
  createPick(pick: InsertPick): Promise<Pick>;
  updatePick(id: number, pickData: Partial<Pick>): Promise<Pick | undefined>;
  updatePickResult(id: number, isCorrect: boolean, pointsEarned: number): Promise<Pick | undefined>;
  deletePick(id: number): Promise<boolean>;
  getPicksByUser(userId: number): Promise<Pick[]>;
  getPicksByGame(gameId: number): Promise<Pick[]>;
  
  // Notification methods
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: number): Promise<Notification[]>;
  
  // Stats and leaderboard
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  getUserStats(userId: number): Promise<{
    totalPoints: number;
    correctPicks: number;
    incorrectPicks: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private rounds: Map<number, Round>;
  private games: Map<number, Game>;
  private picks: Map<number, Pick>;
  private notifications: Map<number, Notification>;
  
  private currentUserId: number;
  private currentTeamId: number;
  private currentRoundId: number;
  private currentGameId: number;
  private currentPickId: number;
  private currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.rounds = new Map();
    this.games = new Map();
    this.picks = new Map();
    this.notifications = new Map();
    
    this.currentUserId = 1;
    this.currentTeamId = 1;
    this.currentRoundId = 1;
    this.currentGameId = 1;
    this.currentPickId = 1;
    this.currentNotificationId = 1;
    
    // Initialize with default data
    this.initializeDefaultRounds();
    this.initializeAllNcaaTeams();
  }

  private initializeDefaultRounds() {
    const defaultRounds = [
      { name: "round64", displayName: "Round of 64", pointValue: 10, order: 1 },
      { name: "round32", displayName: "Round of 32", pointValue: 20, order: 2 },
      { name: "sweet16", displayName: "Sweet 16", pointValue: 40, order: 3 },
      { name: "elite8", displayName: "Elite 8", pointValue: 80, order: 4 },
      { name: "finalFour", displayName: "Final Four", pointValue: 160, order: 5 },
      { name: "championship", displayName: "Championship", pointValue: 320, order: 6 },
    ];

    defaultRounds.forEach(round => {
      const id = this.currentRoundId++;
      this.rounds.set(id, { ...round, id });
    });

    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      email: "admin@example.com",
      displayName: "Administrator"
    }).then(user => {
      // Update the user to be an admin
      const admin = { ...user, isAdmin: true };
      this.users.set(admin.id, admin);
    });
  }
  
  private initializeAllNcaaTeams() {
    console.log("Initializing all NCAA Division I teams...");
    
    // Use the already imported ncaaTeams array from the top of the file
    let addedCount = 0;
    
    for (const team of ncaaTeams) {
      const id = this.currentTeamId++;
      const fullTeam: Team = {
        id,
        name: team.name,
        shortName: team.shortName || team.name.split(' ').pop() || null,
        mascot: team.mascot || null,
        logoUrl: `https://ncaa-logos.example.com/${encodeURIComponent(team.shortName.toLowerCase())}.png`,
        seed: null,
        record: null,
        conference: team.conference || null
      };
      this.teams.set(id, fullTeam);
      addedCount++;
    }
    
    console.log(`Added ${addedCount} NCAA teams to memory storage`);
  }
  
  private initializeDefaultTeams() {
    console.log("Initializing default NCAA teams...");
    
    // NCAA D-1 Teams (Major conferences)
    const defaultTeams = [
      // ACC - Atlantic Coast Conference
      { name: "Duke University", shortName: "Duke", mascot: "Blue Devils", conference: "ACC", logoUrl: "https://example.com/duke.png" },
      { name: "University of North Carolina", shortName: "North Carolina", mascot: "Tar Heels", conference: "ACC", logoUrl: "https://example.com/unc.png" },
      { name: "University of Virginia", shortName: "Virginia", mascot: "Cavaliers", conference: "ACC", logoUrl: "https://example.com/virginia.png" },
      { name: "University of Louisville", shortName: "Louisville", mascot: "Cardinals", conference: "ACC", logoUrl: "https://example.com/louisville.png" },
      { name: "Florida State University", shortName: "Florida State", mascot: "Seminoles", conference: "ACC", logoUrl: "https://example.com/fsu.png" },
      
      // Big East
      { name: "Villanova University", shortName: "Villanova", mascot: "Wildcats", conference: "Big East", logoUrl: "https://example.com/villanova.png" },
      { name: "University of Connecticut", shortName: "UConn", mascot: "Huskies", conference: "Big East", logoUrl: "https://example.com/uconn.png" },
      { name: "Creighton University", shortName: "Creighton", mascot: "Bluejays", conference: "Big East", logoUrl: "https://example.com/creighton.png" },
      { name: "Marquette University", shortName: "Marquette", mascot: "Golden Eagles", conference: "Big East", logoUrl: "https://example.com/marquette.png" },
      
      // Big Ten
      { name: "Michigan State University", shortName: "Michigan State", mascot: "Spartans", conference: "Big Ten", logoUrl: "https://example.com/michiganstate.png" },
      { name: "Purdue University", shortName: "Purdue", mascot: "Boilermakers", conference: "Big Ten", logoUrl: "https://example.com/purdue.png" },
      { name: "University of Illinois", shortName: "Illinois", mascot: "Fighting Illini", conference: "Big Ten", logoUrl: "https://example.com/illinois.png" },
      { name: "Indiana University", shortName: "Indiana", mascot: "Hoosiers", conference: "Big Ten", logoUrl: "https://example.com/indiana.png" },
      
      // Big 12
      { name: "University of Kansas", shortName: "Kansas", mascot: "Jayhawks", conference: "Big 12", logoUrl: "https://example.com/kansas.png" },
      { name: "Baylor University", shortName: "Baylor", mascot: "Bears", conference: "Big 12", logoUrl: "https://example.com/baylor.png" },
      { name: "University of Houston", shortName: "Houston", mascot: "Cougars", conference: "Big 12", logoUrl: "https://example.com/houston.png" },
      { name: "University of Arizona", shortName: "Arizona", mascot: "Wildcats", conference: "Big 12", logoUrl: "https://example.com/arizona.png" },
      
      // SEC
      { name: "University of Kentucky", shortName: "Kentucky", mascot: "Wildcats", conference: "SEC", logoUrl: "https://example.com/kentucky.png" },
      { name: "University of Alabama", shortName: "Alabama", mascot: "Crimson Tide", conference: "SEC", logoUrl: "https://example.com/alabama.png" },
      { name: "University of Tennessee", shortName: "Tennessee", mascot: "Volunteers", conference: "SEC", logoUrl: "https://example.com/tennessee.png" },
      { name: "Auburn University", shortName: "Auburn", mascot: "Tigers", conference: "SEC", logoUrl: "https://example.com/auburn.png" },
      
      // Other major programs
      { name: "Gonzaga University", shortName: "Gonzaga", mascot: "Bulldogs", conference: "WCC", logoUrl: "https://example.com/gonzaga.png" },
      { name: "San Diego State University", shortName: "San Diego State", mascot: "Aztecs", conference: "Mountain West", logoUrl: "https://example.com/sdsu.png" },
      { name: "Saint Mary's College", shortName: "Saint Mary's", mascot: "Gaels", conference: "WCC", logoUrl: "https://example.com/saintmarys.png" },
      
      // Mid-majors with tournament success
      { name: "Virginia Commonwealth University", shortName: "VCU", mascot: "Rams", conference: "Atlantic 10", logoUrl: "https://example.com/vcu.png" },
      { name: "Butler University", shortName: "Butler", mascot: "Bulldogs", conference: "Big East", logoUrl: "https://example.com/butler.png" },
      { name: "Loyola University Chicago", shortName: "Loyola Chicago", mascot: "Ramblers", conference: "Atlantic 10", logoUrl: "https://example.com/loyolachicago.png" },
      { name: "Davidson College", shortName: "Davidson", mascot: "Wildcats", conference: "Atlantic 10", logoUrl: "https://example.com/davidson.png" },
    ];
    
    // Add more teams from other conferences
    const additionalTeams = [
      // Mid-major teams with tournament history
      { name: "Wichita State University", shortName: "Wichita State", mascot: "Shockers", conference: "AAC", logoUrl: "https://example.com/wichitastate.png" },
      { name: "Murray State University", shortName: "Murray State", mascot: "Racers", conference: "Missouri Valley", logoUrl: "https://example.com/murraystate.png" },
      { name: "University of Memphis", shortName: "Memphis", mascot: "Tigers", conference: "AAC", logoUrl: "https://example.com/memphis.png" },
      { name: "University of Dayton", shortName: "Dayton", mascot: "Flyers", conference: "Atlantic 10", logoUrl: "https://example.com/dayton.png" },
      
      // Ivy League
      { name: "Princeton University", shortName: "Princeton", mascot: "Tigers", conference: "Ivy League", logoUrl: "https://example.com/princeton.png" },
      { name: "Yale University", shortName: "Yale", mascot: "Bulldogs", conference: "Ivy League", logoUrl: "https://example.com/yale.png" },
      { name: "Harvard University", shortName: "Harvard", mascot: "Crimson", conference: "Ivy League", logoUrl: "https://example.com/harvard.png" },
      
      // MAC (Mid-American Conference)
      { name: "University of Toledo", shortName: "Toledo", mascot: "Rockets", conference: "MAC", logoUrl: "https://example.com/toledo.png" },
      { name: "Kent State University", shortName: "Kent State", mascot: "Golden Flashes", conference: "MAC", logoUrl: "https://example.com/kentstate.png" },
      
      // Mountain West
      { name: "Utah State University", shortName: "Utah State", mascot: "Aggies", conference: "Mountain West", logoUrl: "https://example.com/utahstate.png" },
      { name: "Boise State University", shortName: "Boise State", mascot: "Broncos", conference: "Mountain West", logoUrl: "https://example.com/boisestate.png" },
      
      // Missouri Valley
      { name: "Drake University", shortName: "Drake", mascot: "Bulldogs", conference: "Missouri Valley", logoUrl: "https://example.com/drake.png" },
      { name: "Southern Illinois University", shortName: "SIU", mascot: "Salukis", conference: "Missouri Valley", logoUrl: "https://example.com/siu.png" },
      
      // Conference USA
      { name: "Western Kentucky University", shortName: "Western Kentucky", mascot: "Hilltoppers", conference: "Conference USA", logoUrl: "https://example.com/wku.png" },
      { name: "University of Texas at El Paso", shortName: "UTEP", mascot: "Miners", conference: "Conference USA", logoUrl: "https://example.com/utep.png" },
      
      // SWAC
      { name: "Texas Southern University", shortName: "Texas Southern", mascot: "Tigers", conference: "SWAC", logoUrl: "https://example.com/texassouthern.png" },
      { name: "Grambling State University", shortName: "Grambling", mascot: "Tigers", conference: "SWAC", logoUrl: "https://example.com/grambling.png" },
      
      // MEAC
      { name: "Norfolk State University", shortName: "Norfolk State", mascot: "Spartans", conference: "MEAC", logoUrl: "https://example.com/norfolkstate.png" },
      { name: "Howard University", shortName: "Howard", mascot: "Bison", conference: "MEAC", logoUrl: "https://example.com/howard.png" },
      
      // Horizon League
      { name: "Northern Kentucky University", shortName: "Northern Kentucky", mascot: "Norse", conference: "Horizon", logoUrl: "https://example.com/nku.png" },
      { name: "Wright State University", shortName: "Wright State", mascot: "Raiders", conference: "Horizon", logoUrl: "https://example.com/wrightstate.png" },
      
      // Summit League
      { name: "South Dakota State University", shortName: "South Dakota State", mascot: "Jackrabbits", conference: "Summit", logoUrl: "https://example.com/sdsu.png" },
      { name: "Oral Roberts University", shortName: "Oral Roberts", mascot: "Golden Eagles", conference: "Summit", logoUrl: "https://example.com/oralroberts.png" },
      
      // Other notable teams
      { name: "Abilene Christian University", shortName: "Abilene Christian", mascot: "Wildcats", conference: "WAC", logoUrl: "https://example.com/abilenechristian.png" },
      { name: "Saint Peter's University", shortName: "Saint Peter's", mascot: "Peacocks", conference: "MAAC", logoUrl: "https://example.com/saintpeters.png" },
      { name: "Florida Gulf Coast University", shortName: "FGCU", mascot: "Eagles", conference: "ASUN", logoUrl: "https://example.com/fgcu.png" },
      { name: "Merrimack College", shortName: "Merrimack", mascot: "Warriors", conference: "Northeast", logoUrl: "https://example.com/merrimack.png" },
      { name: "Furman University", shortName: "Furman", mascot: "Paladins", conference: "Southern", logoUrl: "https://example.com/furman.png" },
      { name: "University of North Carolina at Greensboro", shortName: "UNC Greensboro", mascot: "Spartans", conference: "Southern", logoUrl: "https://example.com/uncg.png" },
      { name: "University of Vermont", shortName: "Vermont", mascot: "Catamounts", conference: "America East", logoUrl: "https://example.com/vermont.png" },
      { name: "College of Charleston", shortName: "Charleston", mascot: "Cougars", conference: "Colonial", logoUrl: "https://example.com/cofc.png" },
      { name: "University of California, Irvine", shortName: "UC Irvine", mascot: "Anteaters", conference: "Big West", logoUrl: "https://example.com/ucirvine.png" },
      { name: "Liberty University", shortName: "Liberty", mascot: "Flames", conference: "Conference USA", logoUrl: "https://example.com/liberty.png" },
      { name: "Longwood University", shortName: "Longwood", mascot: "Lancers", conference: "Big South", logoUrl: "https://example.com/longwood.png" },
    ];
    
    // Combine all teams and add to storage
    const allTeams = [...defaultTeams, ...additionalTeams];
    let addedCount = 0;
    
    for (const team of allTeams) {
      const id = this.currentTeamId++;
      const teamShortName = team.shortName || team.name.split(' ').pop() || team.name;
      const fullTeam: Team = {
        id,
        name: team.name,
        shortName: teamShortName,
        mascot: team.mascot || null,
        logoUrl: team.logoUrl || `https://ncaa-logos.example.com/${encodeURIComponent(teamShortName.toLowerCase())}.png`,
        seed: null,
        record: null,
        conference: team.conference || null
      };
      this.teams.set(id, fullTeam);
      addedCount++;
    }
    
    console.log(`Added ${addedCount} NCAA teams to memory storage`);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin: false, 
      displayName: insertUser.displayName || insertUser.username 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserWithStats(id: number): Promise<UserWithStats | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const stats = await this.getUserStats(id);
    const leaderboard = await this.getLeaderboard();
    const userRank = leaderboard.find(entry => entry.user.id === id)?.rank;

    return {
      ...user,
      rank: userRank,
      ...stats
    };
  }

  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamByName(name: string): Promise<Team | undefined> {
    return Array.from(this.teams.values()).find(
      (team) => team.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.currentTeamId++;
    const team: Team = { 
      ...insertTeam, 
      id,
      name: insertTeam.name,
      shortName: insertTeam.shortName || insertTeam.name.split(' ').pop() || null,
      mascot: insertTeam.mascot || null,
      logoUrl: insertTeam.logoUrl || null,
      seed: insertTeam.seed || null,
      record: insertTeam.record || null,
      conference: insertTeam.conference || null
    };
    this.teams.set(id, team);
    return team;
  }

  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined> {
    const team = await this.getTeam(id);
    if (!team) return undefined;

    const updatedTeam = { ...team, ...teamData };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  // Round methods
  async getRound(id: number): Promise<Round | undefined> {
    return this.rounds.get(id);
  }

  async getRoundByName(name: string): Promise<Round | undefined> {
    return Array.from(this.rounds.values()).find(
      (round) => round.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async createRound(insertRound: InsertRound): Promise<Round> {
    const id = this.currentRoundId++;
    const round: Round = { ...insertRound, id };
    this.rounds.set(id, round);
    return round;
  }

  async getRounds(): Promise<Round[]> {
    return Array.from(this.rounds.values()).sort((a, b) => a.order - b.order);
  }

  // Game methods
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    
    // Ensure startTime is a Date object
    let startTime: Date;
    if (typeof insertGame.startTime === 'string') {
      startTime = new Date(insertGame.startTime);
    } else {
      startTime = insertGame.startTime;
    }
    
    const game: Game = { 
      ...insertGame, 
      id, 
      startTime,
      homeScore: null, 
      awayScore: null, 
      winningTeamId: null,
      status: insertGame.status || 'upcoming',
      region: insertGame.region || null,
      gameNumber: insertGame.gameNumber || null
    };
    this.games.set(id, game);
    return game;
  }

  async updateGame(id: number, updateData: UpdateGame): Promise<Game | undefined> {
    const game = await this.getGame(id);
    if (!game) return undefined;

    const updatedGame = { ...game, ...updateData };
    this.games.set(id, updatedGame);

    // If the game is completed and we have a winning team, update the picks
    if (updatedGame.status === 'completed' && updatedGame.winningTeamId) {
      const gamePicks = await this.getPicksByGame(id);
      const round = await this.getRound(game.roundId);
      
      for (const pick of gamePicks) {
        const isCorrect = pick.pickedTeamId === updatedGame.winningTeamId;
        const pointsEarned = isCorrect ? round!.pointValue : 0;
        
        await this.updatePickResult(pick.id, isCorrect, pointsEarned);
      }
    }

    return updatedGame;
  }

  async deleteGame(id: number): Promise<boolean> {
    return this.games.delete(id);
  }
  
  async getGamesByRound(roundId: number): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      (game) => game.roundId === roundId,
    );
  }

  async getGameWithTeams(id: number): Promise<GameWithTeams | undefined> {
    const game = await this.getGame(id);
    if (!game) return undefined;

    const homeTeam = await this.getTeam(game.homeTeamId);
    const awayTeam = await this.getTeam(game.awayTeamId);
    const round = await this.getRound(game.roundId);

    if (!homeTeam || !awayTeam || !round) return undefined;

    return {
      ...game,
      homeTeam,
      awayTeam,
      round
    };
  }

  async getGamesByRoundWithTeams(roundId: number): Promise<GameWithTeams[]> {
    const games = await this.getGamesByRound(roundId);
    const gamesWithTeams: GameWithTeams[] = [];

    for (const game of games) {
      const gameWithTeams = await this.getGameWithTeams(game.id);
      if (gameWithTeams) {
        gamesWithTeams.push(gameWithTeams);
      }
    }

    return gamesWithTeams;
  }

  async getGamesByStatus(status: string): Promise<GameWithTeams[]> {
    const games = Array.from(this.games.values()).filter(
      (game) => game.status === status,
    );
    
    const gamesWithTeams: GameWithTeams[] = [];

    for (const game of games) {
      const gameWithTeams = await this.getGameWithTeams(game.id);
      if (gameWithTeams) {
        gamesWithTeams.push(gameWithTeams);
      }
    }

    return gamesWithTeams;
  }

  async getUpcomingGames(): Promise<GameWithTeams[]> {
    return this.getGamesByStatus('upcoming');
  }

  async getLiveGames(): Promise<GameWithTeams[]> {
    return this.getGamesByStatus('live');
  }

  async getCompletedGames(): Promise<GameWithTeams[]> {
    return this.getGamesByStatus('completed');
  }

  // Pick methods
  async getPick(id: number): Promise<Pick | undefined> {
    return this.picks.get(id);
  }

  async getPickByUserAndGame(userId: number, gameId: number): Promise<Pick | undefined> {
    return Array.from(this.picks.values()).find(
      (pick) => pick.userId === userId && pick.gameId === gameId,
    );
  }

  async createPick(insertPick: InsertPick): Promise<Pick> {
    // Check if a pick already exists
    const existingPick = await this.getPickByUserAndGame(insertPick.userId, insertPick.gameId);
    if (existingPick) {
      // Update the existing pick
      const updatedPick = { ...existingPick, pickedTeamId: insertPick.pickedTeamId };
      this.picks.set(existingPick.id, updatedPick);
      return updatedPick;
    }

    // Create a new pick
    const id = this.currentPickId++;
    const pick: Pick = { 
      ...insertPick, 
      id, 
      isCorrect: null, 
      pointsEarned: null,
      createdAt: new Date()
    };
    
    this.picks.set(id, pick);
    return pick;
  }

  async updatePick(id: number, pickData: Partial<Pick>): Promise<Pick | undefined> {
    console.log(`Updating pick ${id} with data:`, pickData);
    
    const pick = await this.getPick(id);
    if (!pick) {
      console.log(`Pick ${id} not found`);
      return undefined;
    }

    const updatedPick = { 
      ...pick,
      ...pickData
    };
    
    console.log(`Updated pick ${id}:`, updatedPick);
    this.picks.set(id, updatedPick);
    return updatedPick;
  }
  
  async updatePickResult(id: number, isCorrect: boolean, pointsEarned: number): Promise<Pick | undefined> {
    const pick = await this.getPick(id);
    if (!pick) return undefined;

    const updatedPick = { ...pick, isCorrect, pointsEarned };
    this.picks.set(id, updatedPick);
    return updatedPick;
  }

  async getPicksByUser(userId: number): Promise<Pick[]> {
    return Array.from(this.picks.values()).filter(
      (pick) => pick.userId === userId,
    );
  }

  async getPicksByGame(gameId: number): Promise<Pick[]> {
    return Array.from(this.picks.values()).filter(
      (pick) => pick.gameId === gameId,
    );
  }
  
  async deletePick(id: number): Promise<boolean> {
    return this.picks.delete(id);
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      isRead: false,
      createdAt: new Date()
    };
    
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = await this.getNotification(id);
    if (!notification) return undefined;

    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    return (await this.getNotificationsByUser(userId)).filter(
      notification => !notification.isRead
    );
  }

  // Stats and leaderboard
  async getUserStats(userId: number): Promise<{
    totalPoints: number;
    correctPicks: number;
    incorrectPicks: number;
  }> {
    const userPicks = await this.getPicksByUser(userId);
    
    // Filter to only picks that have been graded
    const gradedPicks = userPicks.filter(pick => pick.isCorrect !== null);
    
    const correctPicks = gradedPicks.filter(pick => pick.isCorrect).length;
    const incorrectPicks = gradedPicks.filter(pick => !pick.isCorrect).length;
    
    const totalPoints = userPicks.reduce((total, pick) => {
      return total + (pick.pointsEarned || 0);
    }, 0);

    return {
      totalPoints,
      correctPicks,
      incorrectPicks
    };
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const users = await this.getUsers();
    const entries: LeaderboardEntry[] = [];

    for (const user of users) {
      const stats = await this.getUserStats(user.id);
      const userPicks = await this.getPicksByUser(user.id);
      const totalPicks = userPicks.filter(pick => pick.isCorrect !== null).length;
      
      entries.push({
        user,
        rank: 0, // Will be calculated after sorting
        totalPoints: stats.totalPoints,
        correctPicks: stats.correctPicks,
        totalPicks
      });
    }

    // Sort by total points, then by correct picks percentage
    entries.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      
      const aPercentage = a.totalPicks > 0 ? a.correctPicks / a.totalPicks : 0;
      const bPercentage = b.totalPicks > 0 ? b.correctPicks / b.totalPicks : 0;
      
      return bPercentage - aPercentage;
    });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }
}

// Switch from MemStorage to PgStorage for data persistence
export const storage = new PgStorage();

import pg from 'pg';
const { Pool } = pg;
type PoolType = typeof Pool;
import {
  User, Team, Round, Game, Pick, Notification,
  InsertUser, InsertTeam, InsertRound, InsertGame, UpdateGame, InsertPick, InsertNotification,
  UserWithStats, GameWithTeams, LeaderboardEntry
} from '../shared/schema';
import { IStorage } from './storage';
import { log } from './vite';

// Mapping helper to convert between snake_case DB columns and camelCase TypeScript properties
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

const mapDbToTs = <T>(row: Record<string, any>): T => {
  const result: Record<string, any> = {};
  for (const key in row) {
    result[toCamelCase(key)] = row[key];
  }
  return result as T;
};

export class PgStorage implements IStorage {
  private pool: InstanceType<PoolType>;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      const client = await this.pool.connect();
      try {
        // Create tables if they don't exist
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            display_name TEXT,
            is_admin BOOLEAN DEFAULT FALSE NOT NULL
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS teams (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            short_name TEXT,
            mascot TEXT,
            logo_url TEXT,
            seed INTEGER,
            record TEXT,
            conference TEXT,
            region TEXT
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS rounds (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            point_value INTEGER NOT NULL,
            "order" INTEGER NOT NULL
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS games (
            id SERIAL PRIMARY KEY,
            home_team_id INTEGER NOT NULL,
            away_team_id INTEGER NOT NULL,
            round_id INTEGER NOT NULL,
            start_time TIMESTAMP NOT NULL,
            region TEXT,
            game_number INTEGER,
            home_score INTEGER,
            away_score INTEGER,
            winning_team_id INTEGER,
            status TEXT NOT NULL DEFAULT 'upcoming',
            spread TEXT NOT NULL
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS picks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            game_id INTEGER NOT NULL,
            picked_team_id INTEGER NOT NULL,
            is_correct BOOLEAN,
            points_earned INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            UNIQUE(user_id, game_id)
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          );
        `);

        // Check if admin user exists, if not create one
        const adminExists = await client.query('SELECT COUNT(*) FROM users WHERE is_admin = true');
        
        if (parseInt(adminExists.rows[0].count) === 0) {
          await client.query(
            'INSERT INTO users (username, email, password, is_admin) VALUES ($1, $2, $3, $4)',
            ['admin', 'admin@example.com', 'admin123', true]
          );
          log('Created admin user', 'pgStorage');
        }

        // Check if default rounds exist, if not create them
        const roundsExist = await client.query('SELECT COUNT(*) FROM rounds');
        if (parseInt(roundsExist.rows[0].count) === 0) {
          await this.initializeDefaultRounds();
          log('Created default rounds', 'pgStorage');
        }

        // Check if teams exist, if not import NCAA teams
        const teamsExist = await client.query('SELECT COUNT(*) FROM teams');
        if (parseInt(teamsExist.rows[0].count) === 0) {
          await this.initializeAllNcaaTeams();
          log('Initialized NCAA teams', 'pgStorage');
        }

        log('Database initialized successfully', 'pgStorage');
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async initializeDefaultRounds() {
    const rounds = [
      { name: 'round64', displayName: 'Round of 64', pointValue: 10, order: 1 },
      { name: 'round32', displayName: 'Round of 32', pointValue: 20, order: 2 },
      { name: 'sweet16', displayName: 'Sweet 16', pointValue: 40, order: 3 },
      { name: 'elite8', displayName: 'Elite 8', pointValue: 80, order: 4 },
      { name: 'finalFour', displayName: 'Final Four', pointValue: 160, order: 5 },
      { name: 'championship', displayName: 'Championship', pointValue: 320, order: 6 },
    ];

    const client = await this.pool.connect();
    try {
      for (const round of rounds) {
        await client.query(
          'INSERT INTO rounds (name, display_name, point_value, "order") VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING',
          [round.name, round.displayName, round.pointValue, round.order]
        );
      }
    } finally {
      client.release();
    }
  }

  private async initializeAllNcaaTeams() {
    console.log('Initializing all NCAA Division I teams...');
    try {
      // Import the NCAA teams data
      const { ncaaTeams } = await import('../attached_assets/ncaa-teams-full');

      const client = await this.pool.connect();
      try {
        for (const team of ncaaTeams) {
          const logoUrl = `https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/${team.id}.png`;
          
          await client.query(
            'INSERT INTO teams (id, name, short_name, mascot, logo_url, conference) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
            [team.id, team.name, team.shortName, team.mascot, logoUrl, team.conference]
          );
        }
        console.log(`Added ${ncaaTeams.length} NCAA teams to database`);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error initializing NCAA teams:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs<User>(result.rows[0]);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.pool.query(
      'INSERT INTO users (username, email, password, display_name, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.username, user.email, user.password, user.displayName, false]
    );
    return mapDbToTs(result.rows[0]);
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (userData.username !== undefined) {
      updateFields.push(`username = $${paramCounter++}`);
      values.push(userData.username);
    }
    if (userData.email !== undefined) {
      updateFields.push(`email = $${paramCounter++}`);
      values.push(userData.email);
    }
    if (userData.password !== undefined) {
      updateFields.push(`password = $${paramCounter++}`);
      values.push(userData.password);
    }
    if (userData.displayName !== undefined) {
      updateFields.push(`display_name = $${paramCounter++}`);
      values.push(userData.displayName);
    }
    if (userData.isAdmin !== undefined) {
      updateFields.push(`is_admin = $${paramCounter++}`);
      values.push(userData.isAdmin);
    }

    if (updateFields.length === 0) {
      return await this.getUser(id);
    }

    values.push(id);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async getUsers(): Promise<User[]> {
    const result = await this.pool.query('SELECT * FROM users ORDER BY username');
    return result.rows.map((row) => mapDbToTs<User>(row));
  }

  async getUserWithStats(id: number): Promise<UserWithStats | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const stats = await this.getUserStats(id);
    
    // Get user rank
    const leaderboard = await this.getLeaderboard();
    const userEntry = leaderboard.find(entry => entry.user.id === id);

    return {
      ...user,
      rank: userEntry?.rank,
      totalPoints: stats.totalPoints,
      correctPicks: stats.correctPicks,
      incorrectPicks: stats.incorrectPicks
    };
  }

  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    const result = await this.pool.query('SELECT * FROM teams WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async getTeamByName(name: string): Promise<Team | undefined> {
    const result = await this.pool.query('SELECT * FROM teams WHERE name = $1', [name]);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await this.pool.query(
      'INSERT INTO teams (name, short_name, mascot, logo_url, conference, seed, record) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [team.name, team.shortName, team.mascot, team.logoUrl, team.conference, team.seed, team.record]
    );
    return mapDbToTs(result.rows[0]);
  }

  async updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (teamData.name !== undefined) {
      updateFields.push(`name = $${paramCounter++}`);
      values.push(teamData.name);
    }
    if (teamData.shortName !== undefined) {
      updateFields.push(`short_name = $${paramCounter++}`);
      values.push(teamData.shortName);
    }
    if (teamData.mascot !== undefined) {
      updateFields.push(`mascot = $${paramCounter++}`);
      values.push(teamData.mascot);
    }
    if (teamData.logoUrl !== undefined) {
      updateFields.push(`logo_url = $${paramCounter++}`);
      values.push(teamData.logoUrl);
    }
    if (teamData.conference !== undefined) {
      updateFields.push(`conference = $${paramCounter++}`);
      values.push(teamData.conference);
    }
    if (teamData.seed !== undefined) {
      updateFields.push(`seed = $${paramCounter++}`);
      values.push(teamData.seed);
    }
    if (teamData.record !== undefined) {
      updateFields.push(`record = $${paramCounter++}`);
      values.push(teamData.record);
    }

    if (updateFields.length === 0) {
      return await this.getTeam(id);
    }

    values.push(id);
    const query = `UPDATE teams SET ${updateFields.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async getTeams(): Promise<Team[]> {
    const result = await this.pool.query('SELECT * FROM teams ORDER BY name');
    return result.rows.map((row) => mapDbToTs<Team>(row));
  }

  // Round methods
  async getRound(id: number): Promise<Round | undefined> {
    const result = await this.pool.query('SELECT * FROM rounds WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async getRoundByName(name: string): Promise<Round | undefined> {
    const result = await this.pool.query('SELECT * FROM rounds WHERE name = $1', [name]);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async createRound(round: InsertRound): Promise<Round> {
    const result = await this.pool.query(
      'INSERT INTO rounds (name, display_name, point_value, "order") VALUES ($1, $2, $3, $4) RETURNING *',
      [round.name, round.displayName, round.pointValue, round.order]
    );
    return mapDbToTs(result.rows[0]);
  }

  async getRounds(): Promise<Round[]> {
    const result = await this.pool.query('SELECT * FROM rounds ORDER BY "order"');
    return result.rows.map((row) => mapDbToTs<Round>(row));
  }

  // Game methods
  async getGame(id: number): Promise<Game | undefined> {
    const result = await this.pool.query('SELECT * FROM games WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async createGame(game: InsertGame): Promise<Game> {
    let startTime: Date;
    if (typeof game.startTime === 'string') {
      startTime = new Date(game.startTime);
    } else {
      startTime = game.startTime;
    }

    const result = await this.pool.query(
      `INSERT INTO games (
        home_team_id, away_team_id, round_id, spread, start_time, status, region, game_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        game.homeTeamId, 
        game.awayTeamId, 
        game.roundId, 
        game.spread,
        startTime,
        game.status || 'upcoming',
        game.region || null,
        game.gameNumber || null
      ]
    );
    return mapDbToTs(result.rows[0]);
  }

  async updateGame(id: number, game: UpdateGame): Promise<Game | undefined> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (game.homeScore !== undefined) {
      updateFields.push(`home_score = $${paramCounter++}`);
      values.push(game.homeScore);
    }
    if (game.awayScore !== undefined) {
      updateFields.push(`away_score = $${paramCounter++}`);
      values.push(game.awayScore);
    }
    if (game.status !== undefined) {
      updateFields.push(`status = $${paramCounter++}`);
      values.push(game.status);
    }
    if (game.winningTeamId !== undefined) {
      updateFields.push(`winning_team_id = $${paramCounter++}`);
      values.push(game.winningTeamId);
    }

    if (updateFields.length === 0) {
      return await this.getGame(id);
    }

    values.push(id);
    const query = `UPDATE games SET ${updateFields.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs<Game>(result.rows[0]);
  }
  
  async deleteGame(id: number): Promise<boolean> {
    try {
      // Delete game
      const result = await this.pool.query('DELETE FROM games WHERE id = $1', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting game ${id}:`, error);
      return false;
    }
  }

  async getGamesByRound(roundId: number): Promise<Game[]> {
    const result = await this.pool.query('SELECT * FROM games WHERE round_id = $1 ORDER BY start_time', [roundId]);
    return result.rows.map((row) => mapDbToTs<Game>(row));
  }

  async getGameWithTeams(id: number): Promise<GameWithTeams | undefined> {
    const query = `
      SELECT 
        g.*,
        ht.id as home_team_id, ht.name as home_team_name, ht.short_name as home_team_short_name,
        ht.mascot as home_team_mascot, ht.logo_url as home_team_logo_url, ht.seed as home_team_seed,
        ht.record as home_team_record, ht.conference as home_team_conference,
        at.id as away_team_id, at.name as away_team_name, at.short_name as away_team_short_name,
        at.mascot as away_team_mascot, at.logo_url as away_team_logo_url, at.seed as away_team_seed,
        at.record as away_team_record, at.conference as away_team_conference,
        r.id as round_id, r.name as round_name, r.display_name as round_display_name,
        r.point_value as round_point_value, r."order" as round_order
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      JOIN rounds r ON g.round_id = r.id
      WHERE g.id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return undefined;
    
    const row = result.rows[0];
    
    const game = mapDbToTs(row) as Game;
    
    return {
      ...game,
      homeTeam: {
        id: row.home_team_id,
        name: row.home_team_name,
        shortName: row.home_team_short_name,
        mascot: row.home_team_mascot,
        logoUrl: row.home_team_logo_url,
        seed: row.home_team_seed,
        record: row.home_team_record,
        conference: row.home_team_conference
      },
      awayTeam: {
        id: row.away_team_id,
        name: row.away_team_name,
        shortName: row.away_team_short_name,
        mascot: row.away_team_mascot,
        logoUrl: row.away_team_logo_url,
        seed: row.away_team_seed,
        record: row.away_team_record,
        conference: row.away_team_conference
      },
      round: {
        id: row.round_id,
        name: row.round_name,
        displayName: row.round_display_name,
        pointValue: row.round_point_value,
        order: row.round_order
      }
    };
  }

  async getGamesByRoundWithTeams(roundId: number): Promise<GameWithTeams[]> {
    const query = `
      SELECT 
        g.*,
        ht.id as home_team_id, ht.name as home_team_name, ht.short_name as home_team_short_name,
        ht.mascot as home_team_mascot, ht.logo_url as home_team_logo_url, ht.seed as home_team_seed,
        ht.record as home_team_record, ht.conference as home_team_conference,
        at.id as away_team_id, at.name as away_team_name, at.short_name as away_team_short_name,
        at.mascot as away_team_mascot, at.logo_url as away_team_logo_url, at.seed as away_team_seed,
        at.record as away_team_record, at.conference as away_team_conference,
        r.id as round_id, r.name as round_name, r.display_name as round_display_name,
        r.point_value as round_point_value, r."order" as round_order
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      JOIN rounds r ON g.round_id = r.id
      WHERE g.round_id = $1
      ORDER BY g.start_time
    `;
    
    const result = await this.pool.query(query, [roundId]);
    
    return result.rows.map(row => {
      const game = mapDbToTs(row) as Game;
      
      return {
        ...game,
        homeTeam: {
          id: row.home_team_id,
          name: row.home_team_name,
          shortName: row.home_team_short_name,
          mascot: row.home_team_mascot,
          logoUrl: row.home_team_logo_url,
          seed: row.home_team_seed,
          record: row.home_team_record,
          conference: row.home_team_conference
        },
        awayTeam: {
          id: row.away_team_id,
          name: row.away_team_name,
          shortName: row.away_team_short_name,
          mascot: row.away_team_mascot,
          logoUrl: row.away_team_logo_url,
          seed: row.away_team_seed,
          record: row.away_team_record,
          conference: row.away_team_conference
        },
        round: {
          id: row.round_id,
          name: row.round_name,
          displayName: row.round_display_name,
          pointValue: row.round_point_value,
          order: row.round_order
        }
      };
    });
  }

  async getGamesByStatus(status: string): Promise<GameWithTeams[]> {
    const query = `
      SELECT 
        g.*,
        ht.id as home_team_id, ht.name as home_team_name, ht.short_name as home_team_short_name,
        ht.mascot as home_team_mascot, ht.logo_url as home_team_logo_url, ht.seed as home_team_seed,
        ht.record as home_team_record, ht.conference as home_team_conference,
        at.id as away_team_id, at.name as away_team_name, at.short_name as away_team_short_name,
        at.mascot as away_team_mascot, at.logo_url as away_team_logo_url, at.seed as away_team_seed,
        at.record as away_team_record, at.conference as away_team_conference,
        r.id as round_id, r.name as round_name, r.display_name as round_display_name,
        r.point_value as round_point_value, r."order" as round_order
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      JOIN rounds r ON g.round_id = r.id
      WHERE g.status = $1
      ORDER BY g.start_time
    `;
    
    const result = await this.pool.query(query, [status]);
    
    return result.rows.map(row => {
      const game = mapDbToTs(row) as Game;
      
      return {
        ...game,
        homeTeam: {
          id: row.home_team_id,
          name: row.home_team_name,
          shortName: row.home_team_short_name,
          mascot: row.home_team_mascot,
          logoUrl: row.home_team_logo_url,
          seed: row.home_team_seed,
          record: row.home_team_record,
          conference: row.home_team_conference
        },
        awayTeam: {
          id: row.away_team_id,
          name: row.away_team_name,
          shortName: row.away_team_short_name,
          mascot: row.away_team_mascot,
          logoUrl: row.away_team_logo_url,
          seed: row.away_team_seed,
          record: row.away_team_record,
          conference: row.away_team_conference
        },
        round: {
          id: row.round_id,
          name: row.round_name,
          displayName: row.round_display_name,
          pointValue: row.round_point_value,
          order: row.round_order
        }
      };
    });
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
    const result = await this.pool.query('SELECT * FROM picks WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async getPickByUserAndGame(userId: number, gameId: number): Promise<Pick | undefined> {
    const result = await this.pool.query('SELECT * FROM picks WHERE user_id = $1 AND game_id = $2', [userId, gameId]);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async createPick(pick: InsertPick): Promise<Pick> {
    const result = await this.pool.query(
      'INSERT INTO picks (user_id, game_id, picked_team_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, game_id) DO UPDATE SET picked_team_id = EXCLUDED.picked_team_id RETURNING *',
      [pick.userId, pick.gameId, pick.pickedTeamId]
    );
    return mapDbToTs(result.rows[0]);
  }

  async updatePick(id: number, pickData: Partial<Pick>): Promise<Pick | undefined> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (pickData.pickedTeamId !== undefined) {
      updateFields.push(`picked_team_id = $${paramCounter++}`);
      values.push(pickData.pickedTeamId);
    }
    if (pickData.isCorrect !== undefined) {
      updateFields.push(`is_correct = $${paramCounter++}`);
      values.push(pickData.isCorrect);
    }
    if (pickData.pointsEarned !== undefined) {
      updateFields.push(`points_earned = $${paramCounter++}`);
      values.push(pickData.pointsEarned);
    }

    if (updateFields.length === 0) {
      return await this.getPick(id);
    }

    values.push(id);
    const query = `UPDATE picks SET ${updateFields.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async updatePickResult(id: number, isCorrect: boolean, pointsEarned: number): Promise<Pick | undefined> {
    const result = await this.pool.query(
      'UPDATE picks SET is_correct = $1, points_earned = $2 WHERE id = $3 RETURNING *',
      [isCorrect, pointsEarned, id]
    );
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async getPicksByUser(userId: number): Promise<Pick[]> {
    const result = await this.pool.query('SELECT * FROM picks WHERE user_id = $1', [userId]);
    return result.rows.map((row) => mapDbToTs<Pick>(row));
  }

  async getPicksByGame(gameId: number): Promise<Pick[]> {
    const result = await this.pool.query('SELECT * FROM picks WHERE game_id = $1', [gameId]);
    return result.rows.map((row) => mapDbToTs<Pick>(row));
  }
  
  async deletePick(id: number): Promise<boolean> {
    try {
      const result = await this.pool.query('DELETE FROM picks WHERE id = $1', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting pick ${id}:`, error);
      return false;
    }
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    const result = await this.pool.query('SELECT * FROM notifications WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await this.pool.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2) RETURNING *',
      [notification.userId, notification.message]
    );
    return mapDbToTs(result.rows[0]);
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await this.pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return undefined;
    return mapDbToTs(result.rows[0]);
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    const result = await this.pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map((row) => mapDbToTs<Notification>(row));
  }

  async getUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    const result = await this.pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 AND is_read = FALSE ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map((row) => mapDbToTs<Notification>(row));
  }

  // Stats methods
  async getUserStats(userId: number): Promise<{
    totalPoints: number;
    correctPicks: number;
    incorrectPicks: number;
  }> {
    const result = await this.pool.query(`
      SELECT 
        COALESCE(SUM(points_earned), 0) as total_points,
        COUNT(CASE WHEN is_correct = TRUE THEN 1 END) as correct_picks,
        COUNT(CASE WHEN is_correct = FALSE THEN 1 END) as incorrect_picks
      FROM picks
      WHERE user_id = $1
    `, [userId]);

    return {
      totalPoints: parseInt(result.rows[0].total_points) || 0,
      correctPicks: parseInt(result.rows[0].correct_picks) || 0,
      incorrectPicks: parseInt(result.rows[0].incorrect_picks) || 0
    };
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const result = await this.pool.query(`
      WITH user_stats AS (
        SELECT 
          u.id,
          u.username,
          u.display_name,
          u.email,
          u.is_admin,
          u.password,
          COALESCE(SUM(p.points_earned), 0) as total_points,
          COUNT(CASE WHEN p.is_correct = TRUE THEN 1 END) as correct_picks,
          COUNT(p.id) as total_picks
        FROM users u
        LEFT JOIN picks p ON u.id = p.user_id
        GROUP BY u.id
      ),
      ranked_users AS (
        SELECT 
          *,
          RANK() OVER (ORDER BY total_points DESC, correct_picks DESC) as rank
        FROM user_stats
      )
      SELECT * FROM ranked_users
      ORDER BY rank ASC
    `);

    return result.rows.map(row => ({
      user: {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        email: row.email,
        password: row.password,
        isAdmin: row.is_admin
      },
      rank: row.rank,
      totalPoints: row.total_points,
      correctPicks: row.correct_picks,
      totalPicks: row.total_picks
    }));
  }
}
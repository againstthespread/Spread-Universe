import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

export const passwordResetCodes = pgTable("password_reset_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
});

export const crowdlineGames = pgTable("crowdline_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  gameDate: timestamp("game_date").notNull(),
  status: text("status").notNull().default("scheduled"),
  actualHomeScore: integer("actual_home_score"),
  actualAwayScore: integer("actual_away_score"),
  vegasSpread: decimal("vegas_spread", { precision: 4, scale: 1 }),
  vegasOverUnder: decimal("vegas_over_under", { precision: 4, scale: 1 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crowdlinePredictions = pgTable("crowdline_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorId: varchar("visitor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: varchar("game_id").notNull().references(() => crowdlineGames.id, { onDelete: "cascade" }),
  homeScore: integer("home_score").notNull(),
  awayScore: integer("away_score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  visitorGameUnique: unique().on(table.visitorId, table.gameId),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertCrowdlineGameSchema = createInsertSchema(crowdlineGames).omit({
  id: true,
  createdAt: true,
  actualHomeScore: true,
  actualAwayScore: true,
  vegasSpread: true,
  vegasOverUnder: true,
}).extend({
  gameDate: z.string().or(z.date()).transform((val) => new Date(val)),
});

export const updateCrowdlineGameResultSchema = z.object({
  actualHomeScore: z.number().int().min(0),
  actualAwayScore: z.number().int().min(0),
  vegasSpread: z.number().optional(),
  vegasOverUnder: z.number().optional(),
  status: z.string().optional(),
});

export const insertCrowdlinePredictionSchema = createInsertSchema(crowdlinePredictions).omit({
  id: true,
  createdAt: true,
  visitorId: true,
}).extend({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PasswordResetCode = typeof passwordResetCodes.$inferSelect;

export type CrowdlineGame = typeof crowdlineGames.$inferSelect;
export type InsertCrowdlineGame = z.infer<typeof insertCrowdlineGameSchema>;
export type CrowdlinePrediction = typeof crowdlinePredictions.$inferSelect;
export type InsertCrowdlinePrediction = z.infer<typeof insertCrowdlinePredictionSchema>;

export type CrowdlineGameWithStats = CrowdlineGame & {
  userPrediction?: { homeScore: number; awayScore: number } | null;
  totalPredictions: number;
  avgHomeScore: number;
  avgAwayScore: number;
};

export type Platform = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  url: string;
};

// MarchMadness Tables
export const marchmadnessTeams = pgTable("marchmadness_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  shortName: text("short_name"),
  mascot: text("mascot"),
  logoUrl: text("logo_url"),
  seed: integer("seed"),
  record: text("record"),
  conference: text("conference"),
});

export const marchmadnessRounds = pgTable("marchmadness_rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  pointValue: integer("point_value").notNull(),
  order: integer("order").notNull(),
});

export const marchmadnessGames = pgTable("marchmadness_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: varchar("round_id").notNull().references(() => marchmadnessRounds.id, { onDelete: "cascade" }),
  homeTeamId: varchar("home_team_id").notNull().references(() => marchmadnessTeams.id, { onDelete: "cascade" }),
  awayTeamId: varchar("away_team_id").notNull().references(() => marchmadnessTeams.id, { onDelete: "cascade" }),
  spread: text("spread").notNull(),
  startTime: timestamp("start_time").notNull(),
  region: text("region"),
  gameNumber: integer("game_number"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").notNull().default("upcoming"),
  winningTeamId: varchar("winning_team_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marchmadnessPicks = pgTable("marchmadness_picks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorId: varchar("visitor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: varchar("game_id").notNull().references(() => marchmadnessGames.id, { onDelete: "cascade" }),
  pickedTeamId: varchar("picked_team_id").notNull().references(() => marchmadnessTeams.id, { onDelete: "cascade" }),
  isCorrect: boolean("is_correct"),
  pointsEarned: integer("points_earned"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  visitorGameUnique: unique("mm_visitor_game_unique").on(table.visitorId, table.gameId),
}));

// MarchMadness Insert Schemas
export const insertMarchmadnessTeamSchema = createInsertSchema(marchmadnessTeams).omit({
  id: true,
});

export const insertMarchmadnessRoundSchema = createInsertSchema(marchmadnessRounds).omit({
  id: true,
});

export const insertMarchmadnessGameSchema = createInsertSchema(marchmadnessGames).omit({
  id: true,
  createdAt: true,
  homeScore: true,
  awayScore: true,
  winningTeamId: true,
}).extend({
  startTime: z.string().or(z.date()).transform((val) => new Date(val)),
});

export const updateMarchmadnessGameSchema = z.object({
  roundId: z.string().optional(),
  homeTeamId: z.string().optional(),
  awayTeamId: z.string().optional(),
  spread: z.string().optional(),
  startTime: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  region: z.string().optional(),
  gameNumber: z.number().int().optional(),
  homeScore: z.number().int().optional(),
  awayScore: z.number().int().optional(),
  status: z.string().optional(),
  winningTeamId: z.string().optional(),
});

export const insertMarchmadnessPickSchema = createInsertSchema(marchmadnessPicks).omit({
  id: true,
  createdAt: true,
  visitorId: true,
  isCorrect: true,
  pointsEarned: true,
});

// MarchMadness Types
export type MarchmadnessTeam = typeof marchmadnessTeams.$inferSelect;
export type InsertMarchmadnessTeam = z.infer<typeof insertMarchmadnessTeamSchema>;
export type MarchmadnessRound = typeof marchmadnessRounds.$inferSelect;
export type InsertMarchmadnessRound = z.infer<typeof insertMarchmadnessRoundSchema>;
export type MarchmadnessGame = typeof marchmadnessGames.$inferSelect;
export type InsertMarchmadnessGame = z.infer<typeof insertMarchmadnessGameSchema>;
export type UpdateMarchmadnessGame = z.infer<typeof updateMarchmadnessGameSchema>;
export type MarchmadnessPick = typeof marchmadnessPicks.$inferSelect;
export type InsertMarchmadnessPick = z.infer<typeof insertMarchmadnessPickSchema>;

// MarchMadness Composite Types
export type MarchmadnessGameWithTeams = MarchmadnessGame & {
  homeTeam: MarchmadnessTeam;
  awayTeam: MarchmadnessTeam;
  round: MarchmadnessRound;
  userPick?: MarchmadnessPick | null;
};

export type MarchmadnessLeaderboardEntry = {
  visitorId: string;
  username: string;
  totalPoints: number;
  correctPicks: number;
  totalPicks: number;
  winPercentage: number;
};

export type MarchmadnessUserStats = {
  totalPoints: number;
  correctPicks: number;
  totalPicks: number;
  winPercentage: number;
  rank: number;
  roundStats: {
    roundId: string;
    roundName: string;
    correctPicks: number;
    totalPicks: number;
    pointsEarned: number;
  }[];
};

// FantasyStream Schemas (no database tables - stateless display only)
export const fantasyStreamGameSchema = z.object({
  id: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
  quarter: z.string(),
  timeRemaining: z.string(),
  status: z.enum(['pre', 'in', 'post']),
});

export const fantasyStreamPlaySchema = z.object({
  id: z.string(),
  gameId: z.string(),
  team: z.string(),
  quarter: z.string(),
  timeRemaining: z.string(),
  down: z.number().optional(),
  distance: z.number().optional(),
  yardLine: z.string().optional(),
  playType: z.enum(['pass', 'rush', 'punt', 'kick', 'turnover', 'touchdown', 'fieldgoal', 'safety']),
  description: z.string(),
  playerName: z.string().optional(),
  receiverName: z.string().optional(),
  yards: z.number().optional(),
  timestamp: z.string(),
  isScoring: z.boolean().default(false),
  isLive: z.boolean().default(false),
});

export type FantasyStreamGame = z.infer<typeof fantasyStreamGameSchema>;
export type FantasyStreamPlay = z.infer<typeof fantasyStreamPlaySchema>;

// Gambling League Tables
export const gamblingLeagueLeagues = pgTable("gambling_league_leagues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  capacity: integer("capacity").notNull(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar("status", { length: 20 }).notNull().default('open'),
  currentWeek: integer("current_week").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gamblingLeagueMembers = pgTable("gambling_league_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => gamblingLeagueLeagues.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  leagueUserUnique: unique("gl_league_user_unique").on(table.leagueId, table.userId),
}));

export const gamblingLeagueGames = pgTable("gambling_league_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  week: integer("week").notNull(),
  homeTeam: varchar("home_team", { length: 100 }).notNull(),
  awayTeam: varchar("away_team", { length: 100 }).notNull(),
  spread: decimal("spread", { precision: 4, scale: 1 }).notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  isComplete: boolean("is_complete").default(false).notNull(),
  gameTime: timestamp("game_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gamblingLeaguePicks = pgTable("gambling_league_picks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  leagueId: varchar("league_id").notNull().references(() => gamblingLeagueLeagues.id, { onDelete: 'cascade' }),
  gameId: varchar("game_id").notNull().references(() => gamblingLeagueGames.id, { onDelete: 'cascade' }),
  week: integer("week").notNull(),
  pickedTeam: varchar("picked_team", { length: 10 }).notNull(),
  note: varchar("note", { length: 500 }),
  isCorrect: boolean("is_correct"),
  isPush: boolean("is_push").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userLeagueGameUnique: unique("gl_user_league_game_unique").on(table.userId, table.leagueId, table.gameId),
}));

export const gamblingLeagueMatchups = pgTable("gambling_league_matchups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => gamblingLeagueLeagues.id, { onDelete: 'cascade' }),
  week: integer("week").notNull(),
  user1Id: varchar("user1_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  user2Id: varchar("user2_id").references(() => users.id, { onDelete: 'cascade' }),
  user1Npw: integer("user1_npw"),
  user2Npw: integer("user2_npw"),
  winnerId: varchar("winner_id").references(() => users.id, { onDelete: 'set null' }),
  isComplete: boolean("is_complete").default(false).notNull(),
});

// Gambling League Insert Schemas
export const insertGamblingLeagueSchema = createInsertSchema(gamblingLeagueLeagues).omit({
  id: true,
  creatorId: true,
  status: true,
  currentWeek: true,
  createdAt: true,
}).extend({
  capacity: z.enum(['8', '10', '12', '16']).transform(val => parseInt(val)),
});

export const insertGamblingLeagueMemberSchema = createInsertSchema(gamblingLeagueMembers).omit({
  id: true,
  userId: true,
  joinedAt: true,
});

export const insertGamblingLeagueGameSchema = createInsertSchema(gamblingLeagueGames).omit({
  id: true,
  homeScore: true,
  awayScore: true,
  isComplete: true,
  createdAt: true,
}).extend({
  week: z.coerce.number().int().min(1).max(18),
  spread: z.coerce.number(),
  gameTime: z.string(),
});

export const updateGamblingLeagueGameResultSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});

export const insertGamblingLeaguePickSchema = createInsertSchema(gamblingLeaguePicks).omit({
  id: true,
  userId: true,
  isCorrect: true,
  isPush: true,
  createdAt: true,
}).extend({
  pickedTeam: z.enum(['home', 'away']),
});

export const insertGamblingLeagueMatchupSchema = createInsertSchema(gamblingLeagueMatchups).omit({
  id: true,
  user1Npw: true,
  user2Npw: true,
  winnerId: true,
  isComplete: true,
});

// Gambling League Types
export type GamblingLeagueLeague = typeof gamblingLeagueLeagues.$inferSelect;
export type InsertGamblingLeagueLeague = z.infer<typeof insertGamblingLeagueSchema>;
export type GamblingLeagueMember = typeof gamblingLeagueMembers.$inferSelect;
export type InsertGamblingLeagueMember = z.infer<typeof insertGamblingLeagueMemberSchema>;
export type GamblingLeagueGame = typeof gamblingLeagueGames.$inferSelect;
export type InsertGamblingLeagueGame = z.infer<typeof insertGamblingLeagueGameSchema>;
export type UpdateGamblingLeagueGameResult = z.infer<typeof updateGamblingLeagueGameResultSchema>;
export type GamblingLeaguePick = typeof gamblingLeaguePicks.$inferSelect;
export type InsertGamblingLeaguePick = z.infer<typeof insertGamblingLeaguePickSchema>;
export type GamblingLeagueMatchup = typeof gamblingLeagueMatchups.$inferSelect;
export type InsertGamblingLeagueMatchup = z.infer<typeof insertGamblingLeagueMatchupSchema>;

export type GamblingLeagueStandingEntry = {
  userId: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  totalNpw: number;
  correctPicks: number;
  totalPicks: number;
  pickPercentage: number;
};

export type GamblingLeagueGameWithPick = GamblingLeagueGame & {
  userPick?: GamblingLeaguePick | null;
};

export type GamblingLeagueMatchupWithUsers = GamblingLeagueMatchup & {
  user1: User;
  user2?: User | null;
  winner?: User | null;
};

// PostseasonATS Tables and Types
export const POSTSEASON_ROUND_POINTS = {
  WILD_CARD: 125,
  DIVISIONAL: 250,
  CONFERENCE: 500,
  SUPER_BOWL: 1000,
} as const;

export const POSTSEASON_ROUND_NAMES = {
  WILD_CARD: "Wild Card",
  DIVISIONAL: "Divisional Round",
  CONFERENCE: "Conference Championship",
  SUPER_BOWL: "Super Bowl",
} as const;

export type PostseasonRound = keyof typeof POSTSEASON_ROUND_POINTS;

export const postseasonGames = pgTable("postseason_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  round: varchar("round", { length: 20 }).notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  spread: decimal("spread", { precision: 4, scale: 1 }).notNull(),
  favoredTeam: varchar("favored_team", { length: 10 }).notNull(),
  gameDate: timestamp("game_date").notNull(),
  pickDeadline: timestamp("pick_deadline"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  isComplete: boolean("is_complete").notNull().default(false),
  winner: text("winner"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postseasonPicks = pgTable("postseason_picks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: varchar("game_id").notNull().references(() => postseasonGames.id, { onDelete: "cascade" }),
  selectedTeam: text("selected_team").notNull(),
  isCorrect: boolean("is_correct"),
  pointsEarned: integer("points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userGameUnique: unique("ps_user_game_unique").on(table.userId, table.gameId),
}));

export const insertPostseasonGameSchema = createInsertSchema(postseasonGames).omit({
  id: true,
  createdAt: true,
  homeScore: true,
  awayScore: true,
  isComplete: true,
  winner: true,
}).extend({
  round: z.enum(["WILD_CARD", "DIVISIONAL", "CONFERENCE", "SUPER_BOWL"]),
  favoredTeam: z.enum(["HOME", "AWAY"]),
  gameDate: z.string().or(z.date()).transform((val) => new Date(val)),
  pickDeadline: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
});

export const updatePostseasonGameResultSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});

export const insertPostseasonPickSchema = createInsertSchema(postseasonPicks).omit({
  id: true,
  createdAt: true,
  userId: true,
  isCorrect: true,
  pointsEarned: true,
});

export type PostseasonGame = typeof postseasonGames.$inferSelect;
export type InsertPostseasonGame = z.infer<typeof insertPostseasonGameSchema>;
export type PostseasonPick = typeof postseasonPicks.$inferSelect;
export type InsertPostseasonPick = z.infer<typeof insertPostseasonPickSchema>;

export type PostseasonGameWithPick = PostseasonGame & {
  userPick?: PostseasonPick | null;
};

export type PostseasonPickHistoryItem = PostseasonPick & {
  game: PostseasonGame;
};

export type PostseasonLeaderboardEntry = {
  userId: string;
  username: string;
  totalPoints: number;
  correctPicks: number;
  totalPicks: number;
  maxPossible: number;
  remaining: number;
};

export type PostseasonUserStats = {
  totalPoints: number;
  correctPicks: number;
  totalPicks: number;
  winPercentage: number;
  rank: number;
  roundStats: {
    round: PostseasonRound;
    roundName: string;
    correctPicks: number;
    totalPicks: number;
    pointsEarned: number;
  }[];
};

// Football-Weather Schemas (no database tables - display only)
export const footballWeatherStadiumSchema = z.object({
  name: z.string(),
  city: z.string(),
  state: z.string(),
  isDome: z.boolean(),
  lat: z.number(),
  lon: z.number(),
});

export type FootballWeatherStadium = z.infer<typeof footballWeatherStadiumSchema>;

export const footballWeatherTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviation: z.string(),
  displayName: z.string(),
  shortDisplayName: z.string(),
  logo: z.string().optional(),
});

export type FootballWeatherTeam = z.infer<typeof footballWeatherTeamSchema>;

export const footballWeatherWeatherSchema = z.object({
  temp: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  windGust: z.number().optional(),
  description: z.string(),
  icon: z.string(),
  precipitation: z.number(),
  snow: z.number().optional(),
  rain: z.number().optional(),
});

export type FootballWeatherWeather = z.infer<typeof footballWeatherWeatherSchema>;

export const footballWeatherFantasyImplicationSchema = z.enum([
  "ideal_passing",
  "rb_weather",
  "dome_game",
  "neutral",
]);

export type FootballWeatherFantasyImplication = z.infer<typeof footballWeatherFantasyImplicationSchema>;

export const footballWeatherGameSchema = z.object({
  id: z.string(),
  homeTeam: footballWeatherTeamSchema,
  awayTeam: footballWeatherTeamSchema,
  stadium: footballWeatherStadiumSchema,
  gameTime: z.string(),
  weather: footballWeatherWeatherSchema.nullable(),
  fantasyImplication: footballWeatherFantasyImplicationSchema,
});

export type FootballWeatherGame = z.infer<typeof footballWeatherGameSchema>;

export const footballWeatherGamesResponseSchema = z.object({
  games: z.array(footballWeatherGameSchema),
  lastUpdated: z.string(),
  weekNumber: z.number(),
});

export type FootballWeatherGamesResponse = z.infer<typeof footballWeatherGamesResponseSchema>;

// NFL Stadiums database with coordinates for weather lookup
export const NFL_STADIUMS: Record<string, FootballWeatherStadium> = {
  "State Farm Stadium": { name: "State Farm Stadium", city: "Glendale", state: "AZ", isDome: true, lat: 33.5276, lon: -112.2626 },
  "Mercedes-Benz Stadium": { name: "Mercedes-Benz Stadium", city: "Atlanta", state: "GA", isDome: true, lat: 33.7553, lon: -84.4006 },
  "Caesars Superdome": { name: "Caesars Superdome", city: "New Orleans", state: "LA", isDome: true, lat: 29.9511, lon: -90.0812 },
  "Ford Field": { name: "Ford Field", city: "Detroit", state: "MI", isDome: true, lat: 42.34, lon: -83.0456 },
  "U.S. Bank Stadium": { name: "U.S. Bank Stadium", city: "Minneapolis", state: "MN", isDome: true, lat: 44.9736, lon: -93.2575 },
  "AT&T Stadium": { name: "AT&T Stadium", city: "Arlington", state: "TX", isDome: true, lat: 32.7473, lon: -97.0945 },
  "NRG Stadium": { name: "NRG Stadium", city: "Houston", state: "TX", isDome: true, lat: 29.6847, lon: -95.4107 },
  "Lucas Oil Stadium": { name: "Lucas Oil Stadium", city: "Indianapolis", state: "IN", isDome: true, lat: 39.7601, lon: -86.1639 },
  "Allegiant Stadium": { name: "Allegiant Stadium", city: "Las Vegas", state: "NV", isDome: true, lat: 36.0909, lon: -115.1833 },
  "SoFi Stadium": { name: "SoFi Stadium", city: "Inglewood", state: "CA", isDome: true, lat: 33.9535, lon: -118.3392 },
  "Bank of America Stadium": { name: "Bank of America Stadium", city: "Charlotte", state: "NC", isDome: false, lat: 35.2258, lon: -80.8528 },
  "Soldier Field": { name: "Soldier Field", city: "Chicago", state: "IL", isDome: false, lat: 41.8623, lon: -87.6167 },
  "Paycor Stadium": { name: "Paycor Stadium", city: "Cincinnati", state: "OH", isDome: false, lat: 39.0954, lon: -84.516 },
  "Cleveland Browns Stadium": { name: "Cleveland Browns Stadium", city: "Cleveland", state: "OH", isDome: false, lat: 41.506, lon: -81.6995 },
  "Empower Field at Mile High": { name: "Empower Field at Mile High", city: "Denver", state: "CO", isDome: false, lat: 39.7439, lon: -105.02 },
  "Lambeau Field": { name: "Lambeau Field", city: "Green Bay", state: "WI", isDome: false, lat: 44.5013, lon: -88.0622 },
  "EverBank Stadium": { name: "EverBank Stadium", city: "Jacksonville", state: "FL", isDome: false, lat: 30.3239, lon: -81.6373 },
  "GEHA Field at Arrowhead Stadium": { name: "GEHA Field at Arrowhead Stadium", city: "Kansas City", state: "MO", isDome: false, lat: 39.0489, lon: -94.4839 },
  "Hard Rock Stadium": { name: "Hard Rock Stadium", city: "Miami Gardens", state: "FL", isDome: false, lat: 25.958, lon: -80.2389 },
  "Gillette Stadium": { name: "Gillette Stadium", city: "Foxborough", state: "MA", isDome: false, lat: 42.0909, lon: -71.2643 },
  "MetLife Stadium": { name: "MetLife Stadium", city: "East Rutherford", state: "NJ", isDome: false, lat: 40.8128, lon: -74.0742 },
  "Lincoln Financial Field": { name: "Lincoln Financial Field", city: "Philadelphia", state: "PA", isDome: false, lat: 39.9008, lon: -75.1675 },
  "Acrisure Stadium": { name: "Acrisure Stadium", city: "Pittsburgh", state: "PA", isDome: false, lat: 40.4468, lon: -80.0158 },
  "Levi's Stadium": { name: "Levi's Stadium", city: "Santa Clara", state: "CA", isDome: false, lat: 37.4033, lon: -121.9694 },
  "Lumen Field": { name: "Lumen Field", city: "Seattle", state: "WA", isDome: false, lat: 47.5952, lon: -122.3316 },
  "Raymond James Stadium": { name: "Raymond James Stadium", city: "Tampa", state: "FL", isDome: false, lat: 27.9759, lon: -82.5033 },
  "Nissan Stadium": { name: "Nissan Stadium", city: "Nashville", state: "TN", isDome: false, lat: 36.1665, lon: -86.7713 },
  "Northwest Stadium": { name: "Northwest Stadium", city: "Landover", state: "MD", isDome: false, lat: 38.9076, lon: -76.8645 },
  "Highmark Stadium": { name: "Highmark Stadium", city: "Orchard Park", state: "NY", isDome: false, lat: 42.7738, lon: -78.787 },
  "M&T Bank Stadium": { name: "M&T Bank Stadium", city: "Baltimore", state: "MD", isDome: false, lat: 39.278, lon: -76.6227 },
};

export const TEAM_STADIUMS: Record<string, string> = {
  "ARI": "State Farm Stadium",
  "ATL": "Mercedes-Benz Stadium",
  "BAL": "M&T Bank Stadium",
  "BUF": "Highmark Stadium",
  "CAR": "Bank of America Stadium",
  "CHI": "Soldier Field",
  "CIN": "Paycor Stadium",
  "CLE": "Cleveland Browns Stadium",
  "DAL": "AT&T Stadium",
  "DEN": "Empower Field at Mile High",
  "DET": "Ford Field",
  "GB": "Lambeau Field",
  "HOU": "NRG Stadium",
  "IND": "Lucas Oil Stadium",
  "JAX": "EverBank Stadium",
  "KC": "GEHA Field at Arrowhead Stadium",
  "LAC": "SoFi Stadium",
  "LAR": "SoFi Stadium",
  "LV": "Allegiant Stadium",
  "MIA": "Hard Rock Stadium",
  "MIN": "U.S. Bank Stadium",
  "NE": "Gillette Stadium",
  "NO": "Caesars Superdome",
  "NYG": "MetLife Stadium",
  "NYJ": "MetLife Stadium",
  "PHI": "Lincoln Financial Field",
  "PIT": "Acrisure Stadium",
  "SF": "Levi's Stadium",
  "SEA": "Lumen Field",
  "TB": "Raymond James Stadium",
  "TEN": "Nissan Stadium",
  "WSH": "Northwest Stadium",
};

// Golf Fantasy Tables
export const golfGolfers = pgTable("golf_golfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldRank: integer("world_rank").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  country: text("country").notNull(),
  photoUrl: text("photo_url"),
  sdioPlayerId: integer("sdio_player_id"),
});

export const golfTournaments = pgTable("golf_tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  status: text("status").notNull().default("upcoming"),
  startDate: timestamp("start_date").notNull(),
  sdioTournamentId: integer("sdio_tournament_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const golfTournamentGolfers = pgTable("golf_tournament_golfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull().references(() => golfTournaments.id, { onDelete: "cascade" }),
  golferId: varchar("golfer_id").notNull().references(() => golfGolfers.id, { onDelete: "cascade" }),
}, (table) => ({
  tournamentGolferUnique: unique("golf_tournament_golfer_unique").on(table.tournamentId, table.golferId),
}));

export const golfGolferScores = pgTable("golf_golfer_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull().references(() => golfTournaments.id, { onDelete: "cascade" }),
  golferId: varchar("golfer_id").notNull().references(() => golfGolfers.id, { onDelete: "cascade" }),
  round: integer("round").notNull(),
  score: integer("score").notNull(),
  position: text("position"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tournamentGolferRoundUnique: unique("golf_scores_unique").on(table.tournamentId, table.golferId, table.round),
}));

export const golfLeagues = pgTable("golf_leagues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull().references(() => golfTournaments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  commissionerId: varchar("commissioner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  maxSize: integer("max_size"),
  joinCode: varchar("join_code", { length: 8 }).notNull().unique(),
  draftStartTime: timestamp("draft_start_time"),
  draftStatus: text("draft_status").notNull().default("pending"),
  draftOrderType: text("draft_order_type").notNull().default("random"),
  draftOrder: text("draft_order").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const golfLeagueMembers = pgTable("golf_league_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => golfLeagues.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  golfLeagueUserUnique: unique("golf_league_user_unique").on(table.leagueId, table.userId),
}));

export const golfDraftPicks = pgTable("golf_draft_picks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => golfLeagues.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  golferId: varchar("golfer_id").notNull().references(() => golfGolfers.id, { onDelete: "cascade" }),
  pickNumber: integer("pick_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  golfLeaguePickNumberUnique: unique("golf_draft_pick_number_unique").on(table.leagueId, table.pickNumber),
  golfLeagueGolferUnique: unique("golf_draft_league_golfer_unique").on(table.leagueId, table.golferId),
}));

// Golf Insert Schemas
export const insertGolfGolferSchema = createInsertSchema(golfGolfers).omit({ id: true });
export const updateGolfGolferSchema = insertGolfGolferSchema.partial();

export const insertGolfTournamentSchema = createInsertSchema(golfTournaments).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  sdioTournamentId: z.coerce.number().int().positive().optional().nullable(),
});

export const insertGolfLeagueSchema = createInsertSchema(golfLeagues).omit({
  id: true,
  commissionerId: true,
  joinCode: true,
  draftStatus: true,
  draftOrder: true,
  createdAt: true,
}).extend({
  maxSize: z.coerce.number().int().min(2).max(20).optional().nullable(),
  draftStartTime: z.string().or(z.date()).transform((val) => new Date(val)).optional().nullable(),
  draftOrderType: z.enum(["manual", "random"]).default("random"),
});

export const insertGolfScoreSchema = z.object({
  golferId: z.string(),
  round: z.number().int().min(1).max(4),
  score: z.number().int(),
});

// Golf Types
export type GolfGolfer = typeof golfGolfers.$inferSelect;
export type InsertGolfGolfer = z.infer<typeof insertGolfGolferSchema>;
export type UpdateGolfGolfer = z.infer<typeof updateGolfGolferSchema>;
export type GolfTournament = typeof golfTournaments.$inferSelect;
export type InsertGolfTournament = z.infer<typeof insertGolfTournamentSchema>;
export type GolfTournamentGolfer = typeof golfTournamentGolfers.$inferSelect;
export type GolfGolferScore = typeof golfGolferScores.$inferSelect;
export type GolfLeague = typeof golfLeagues.$inferSelect;
export type InsertGolfLeague = z.infer<typeof insertGolfLeagueSchema>;
export type GolfLeagueMember = typeof golfLeagueMembers.$inferSelect;
export type GolfDraftPick = typeof golfDraftPicks.$inferSelect;

// Golf Composite Types
export type GolfDraftPickWithDetails = GolfDraftPick & {
  golfer: GolfGolfer;
  user: { id: string; username: string };
};

export type GolfDraftState = {
  league: GolfLeague;
  picks: GolfDraftPickWithDetails[];
  currentPickUserId: string | null;
  currentPickNumber: number;
  availableGolfers: GolfGolfer[];
  isComplete: boolean;
  draftOrder: { userId: string; username: string }[];
};

export type GolfRosterEntry = {
  golfer: GolfGolfer;
  scores: { round: number; score: number }[];
  totalScore: number;
  position: string | null;
};

export type GolfLeagueStandingEntry = {
  userId: string;
  username: string;
  roster: GolfRosterEntry[];
  totalScore: number | null;
};

export type GolfStandingsResponse = {
  standings: GolfLeagueStandingEntry[];
  lastUpdated: string | null;
  tournamentStatus: string;
};

export type GolfLeagueDetail = GolfLeague & {
  tournament: GolfTournament;
  members: (GolfLeagueMember & { user: { id: string; username: string } })[];
};

// ============ CFB Conferences ============

export const cfbTeams = pgTable("cfb_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  espnTeamId: integer("espn_team_id").notNull().unique(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  logoUrl: text("logo_url"),
});

export const cfbLeagues = pgTable("cfb_leagues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  commissionerId: varchar("commissioner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinCode: varchar("join_code", { length: 8 }).notNull().unique(),
  maxSize: integer("max_size").notNull().default(8),
  season: integer("season").notNull(),
  currentWeek: integer("current_week").notNull().default(1),
  draftStatus: text("draft_status").notNull().default("pending"),
  draftOrderType: text("draft_order_type").notNull().default("random"),
  draftOrder: text("draft_order").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cfbLeagueMembers = pgTable("cfb_league_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => cfbLeagues.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  cfbLeagueUserUnique: unique("cfb_league_user_unique").on(table.leagueId, table.userId),
}));

export const cfbDraftPicks = pgTable("cfb_draft_picks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => cfbLeagues.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamId: varchar("team_id").notNull().references(() => cfbTeams.id, { onDelete: "cascade" }),
  pickNumber: integer("pick_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  cfbPickNumberUnique: unique("cfb_draft_pick_number_unique").on(table.leagueId, table.pickNumber),
  cfbLeagueTeamPickUnique: unique("cfb_draft_league_team_unique").on(table.leagueId, table.teamId),
}));

export const cfbRosters = pgTable("cfb_rosters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => cfbLeagues.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamId: varchar("team_id").notNull().references(() => cfbTeams.id, { onDelete: "cascade" }),
  acquiredVia: text("acquired_via").notNull().default("draft"),
}, (table) => ({
  cfbRosterTeamUnique: unique("cfb_roster_league_team_unique").on(table.leagueId, table.teamId),
}));

export const cfbLineups = pgTable("cfb_lineups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => cfbLeagues.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  week: integer("week").notNull(),
  teamId: varchar("team_id").notNull().references(() => cfbTeams.id, { onDelete: "cascade" }),
}, (table) => ({
  cfbLineupUnique: unique("cfb_lineup_unique").on(table.leagueId, table.userId, table.week, table.teamId),
}));

export const cfbGames = pgTable("cfb_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  espnGameId: varchar("espn_game_id", { length: 20 }).notNull().unique(),
  season: integer("season").notNull(),
  week: integer("week").notNull(),
  homeEspnTeamId: integer("home_espn_team_id").notNull(),
  awayEspnTeamId: integer("away_espn_team_id").notNull(),
  homeTeamName: text("home_team_name").notNull(),
  awayTeamName: text("away_team_name").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").notNull().default("scheduled"),
  gameDate: timestamp("game_date"),
});

export const cfbMatchups = pgTable("cfb_matchups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => cfbLeagues.id, { onDelete: "cascade" }),
  week: integer("week").notNull(),
  user1Id: varchar("user1_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  user2Id: varchar("user2_id").references(() => users.id, { onDelete: "cascade" }),
  user1Wins: integer("user1_wins"),
  user2Wins: integer("user2_wins"),
  winnerId: varchar("winner_id").references(() => users.id, { onDelete: "set null" }),
  isComplete: boolean("is_complete").default(false).notNull(),
  isPlayoff: boolean("is_playoff").default(false).notNull(),
  playoffRound: text("playoff_round"),
});

export const cfbTrades = pgTable("cfb_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => cfbLeagues.id, { onDelete: "cascade" }),
  proposerId: varchar("proposer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  proposerTeamIds: text("proposer_team_ids").array().notNull(),
  receiverTeamIds: text("receiver_team_ids").array().notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const cfbTransactions = pgTable("cfb_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => cfbLeagues.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addTeamId: varchar("add_team_id").notNull().references(() => cfbTeams.id, { onDelete: "cascade" }),
  dropTeamId: varchar("drop_team_id").notNull().references(() => cfbTeams.id, { onDelete: "cascade" }),
  week: integer("week").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// CFB Insert Schemas
export const insertCfbLeagueSchema = createInsertSchema(cfbLeagues).omit({
  id: true,
  commissionerId: true,
  joinCode: true,
  season: true,
  currentWeek: true,
  draftStatus: true,
  draftOrder: true,
  createdAt: true,
}).extend({
  name: z.string().min(2, "League name must be at least 2 characters").max(60),
  maxSize: z.coerce.number().int().min(2).max(8).default(8),
  draftOrderType: z.enum(["manual", "random"]).default("random"),
});

export const cfbLineupSchema = z.object({
  week: z.coerce.number().int().min(1).max(14),
  teamIds: z.array(z.string()).length(5, "You must start exactly 5 teams"),
});

export const cfbClaimSchema = z.object({
  addTeamId: z.string(),
  dropTeamId: z.string(),
});

export const cfbTradeProposalSchema = z.object({
  receiverId: z.string(),
  proposerTeamIds: z.array(z.string()).min(1).max(3),
  receiverTeamIds: z.array(z.string()).min(1).max(3),
}).refine(d => d.proposerTeamIds.length === d.receiverTeamIds.length, {
  message: "Trades must swap an equal number of teams",
});

// CFB Types
export type CfbTeam = typeof cfbTeams.$inferSelect;
export type CfbLeague = typeof cfbLeagues.$inferSelect;
export type InsertCfbLeague = z.infer<typeof insertCfbLeagueSchema>;
export type CfbLeagueMember = typeof cfbLeagueMembers.$inferSelect;
export type CfbDraftPick = typeof cfbDraftPicks.$inferSelect;
export type CfbRosterRow = typeof cfbRosters.$inferSelect;
export type CfbLineupRow = typeof cfbLineups.$inferSelect;
export type CfbGame = typeof cfbGames.$inferSelect;
export type CfbMatchup = typeof cfbMatchups.$inferSelect;
export type CfbTrade = typeof cfbTrades.$inferSelect;
export type CfbTransaction = typeof cfbTransactions.$inferSelect;

// CFB Composite Types
export type CfbDraftPickWithDetails = CfbDraftPick & {
  team: CfbTeam;
  user: { id: string; username: string };
};

export type CfbDraftState = {
  league: CfbLeague;
  picks: CfbDraftPickWithDetails[];
  currentPickUserId: string | null;
  currentPickNumber: number;
  availableTeams: CfbTeam[];
  isComplete: boolean;
  draftOrder: { userId: string; username: string }[];
};

export type CfbLeagueDetail = CfbLeague & {
  members: (CfbLeagueMember & { user: { id: string; username: string } })[];
};

export type CfbRosterEntry = {
  team: CfbTeam;
  acquiredVia: string;
  record: { wins: number; losses: number };
  thisWeekGame: CfbGame | null;
};

export type CfbMatchupWithDetails = CfbMatchup & {
  user1: { id: string; username: string };
  user2: { id: string; username: string } | null;
  user1Lineup: { team: CfbTeam; game: CfbGame | null; won: boolean | null }[];
  user2Lineup: { team: CfbTeam; game: CfbGame | null; won: boolean | null }[];
};

export type CfbStandingEntry = {
  userId: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  totalTeamWins: number;
};

export type CfbTradeWithDetails = CfbTrade & {
  proposer: { id: string; username: string };
  receiver: { id: string; username: string };
  proposerTeams: CfbTeam[];
  receiverTeams: CfbTeam[];
};

export const platforms: Platform[] = [
  {
    id: "crowdline",
    name: "CrowdLine",
    description: "Real-time crowd-sourced betting insights",
    icon: "Users",
    color: "from-blue-500 to-blue-600",
    url: "/crowdline",
  },
  {
    id: "marchmadness",
    name: "March Madness ATS",
    description: "NCAA Tournament picks and brackets",
    icon: "Trophy",
    color: "from-orange-500 to-orange-600",
    url: "/marchmadness",
  },
  {
    id: "fantasystream",
    name: "FantasyStream",
    description: "Fantasy sports streaming and analytics",
    icon: "Play",
    color: "from-purple-500 to-purple-600",
    url: "/fantasystream",
  },
  {
    id: "gambling-league",
    name: "Gambling League",
    description: "Compete in betting leagues with friends",
    icon: "Medal",
    color: "from-green-500 to-green-600",
    url: "/gambling-league",
  },
  {
    id: "postseason",
    name: "Postseason ATS",
    description: "Playoff predictions and analysis",
    icon: "Star",
    color: "from-yellow-500 to-yellow-600",
    url: "/postseason",
  },
  {
    id: "footballweather",
    name: "Football Weather",
    description: "Weather-based football predictions",
    icon: "Cloud",
    color: "from-cyan-500 to-cyan-600",
    url: "/footballweather",
  },
  {
    id: "golf",
    name: "Golf Fantasy",
    description: "Snake draft fantasy golf leagues",
    icon: "Flag",
    color: "from-emerald-500 to-emerald-600",
    url: "/golf",
  },
  {
    id: "cfb",
    name: "CFB Conferences",
    description: "Draft college football teams and battle weekly",
    icon: "Shield",
    color: "from-red-500 to-red-600",
    url: "/cfb",
  },
];

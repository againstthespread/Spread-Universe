// Reference: javascript_log_in_with_replit and javascript_database blueprints
import { sql, relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  boolean,
  decimal,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (REQUIRED for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (email/password auth + admin flag)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // hashed password
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isAdmin: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Password must be at least 8 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Leagues table
export const leagues = pgTable("leagues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  capacity: integer("capacity").notNull(), // 8, 10, 12, or 16
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar("status", { length: 20 }).notNull().default('open'), // open, full, active, completed
  currentWeek: integer("current_week").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeagueSchema = createInsertSchema(leagues).omit({
  id: true,
  creatorId: true,
  status: true,
  currentWeek: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  capacity: z.enum(['8', '10', '12', '16']).transform(val => parseInt(val)),
});

export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type League = typeof leagues.$inferSelect;

// League members table
export const leagueMembers = pgTable("league_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => leagues.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  unique().on(table.leagueId, table.userId),
]);

export const insertLeagueMemberSchema = createInsertSchema(leagueMembers).omit({
  id: true,
  userId: true,
  joinedAt: true,
});

export type InsertLeagueMember = z.infer<typeof insertLeagueMemberSchema>;
export type LeagueMember = typeof leagueMembers.$inferSelect;

// Games table (weekly NFL games with spreads)
export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  week: integer("week").notNull(),
  homeTeam: varchar("home_team", { length: 100 }).notNull(),
  awayTeam: varchar("away_team", { length: 100 }).notNull(),
  spread: decimal("spread", { precision: 4, scale: 1 }).notNull(), // e.g., -3.5
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  isComplete: boolean("is_complete").default(false).notNull(),
  gameTime: timestamp("game_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_games_week").on(table.week),
]);

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  homeScore: true,
  awayScore: true,
  isComplete: true,
  createdAt: true,
}).extend({
  week: z.coerce.number().int().min(1).max(17),
  spread: z.coerce.number(),
  // Keep gameTime as string - backend will handle timezone conversion
  gameTime: z.string(),
});

export const updateGameResultSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type UpdateGameResult = z.infer<typeof updateGameResultSchema>;
export type Game = typeof games.$inferSelect;

// Picks table (user picks against the spread)
export const picks = pgTable("picks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  leagueId: varchar("league_id").notNull().references(() => leagues.id, { onDelete: 'cascade' }),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: 'cascade' }),
  week: integer("week").notNull(),
  pickedTeam: varchar("picked_team", { length: 10 }).notNull(), // 'home' or 'away'
  note: varchar("note", { length: 500 }), // Optional pick justification
  isCorrect: boolean("is_correct"),
  isPush: boolean("is_push").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.leagueId, table.gameId),
  index("idx_picks_user_league_week").on(table.userId, table.leagueId, table.week),
]);

export const insertPickSchema = createInsertSchema(picks).omit({
  id: true,
  userId: true,
  isCorrect: true,
  isPush: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  pickedTeam: z.enum(['home', 'away']),
});

export type InsertPick = z.infer<typeof insertPickSchema>;
export type Pick = typeof picks.$inferSelect;

// Weekly matchups table (head-to-head pairings)
export const weeklyMatchups = pgTable("weekly_matchups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => leagues.id, { onDelete: 'cascade' }),
  week: integer("week").notNull(),
  user1Id: varchar("user1_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  user2Id: varchar("user2_id").references(() => users.id, { onDelete: 'cascade' }), // null for bye week
  user1Npw: integer("user1_npw"), // Net Positive Wins for user1
  user2Npw: integer("user2_npw"), // Net Positive Wins for user2
  winnerId: varchar("winner_id").references(() => users.id, { onDelete: 'set null' }), // null for draw
  isComplete: boolean("is_complete").default(false).notNull(),
}, (table) => [
  index("idx_matchups_league_week").on(table.leagueId, table.week),
]);

export const insertWeeklyMatchupSchema = createInsertSchema(weeklyMatchups).omit({
  id: true,
  user1Npw: true,
  user2Npw: true,
  winnerId: true,
  isComplete: true,
});

export type InsertWeeklyMatchup = z.infer<typeof insertWeeklyMatchupSchema>;
export type WeeklyMatchup = typeof weeklyMatchups.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  leagues: many(leagues),
  leagueMembers: many(leagueMembers),
  picks: many(picks),
  matchupsAsUser1: many(weeklyMatchups, { relationName: 'user1' }),
  matchupsAsUser2: many(weeklyMatchups, { relationName: 'user2' }),
}));

export const leaguesRelations = relations(leagues, ({ one, many }) => ({
  creator: one(users, {
    fields: [leagues.creatorId],
    references: [users.id],
  }),
  members: many(leagueMembers),
  picks: many(picks),
  matchups: many(weeklyMatchups),
}));

export const leagueMembersRelations = relations(leagueMembers, ({ one }) => ({
  league: one(leagues, {
    fields: [leagueMembers.leagueId],
    references: [leagues.id],
  }),
  user: one(users, {
    fields: [leagueMembers.userId],
    references: [users.id],
  }),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  picks: many(picks),
}));

export const picksRelations = relations(picks, ({ one }) => ({
  user: one(users, {
    fields: [picks.userId],
    references: [users.id],
  }),
  league: one(leagues, {
    fields: [picks.leagueId],
    references: [leagues.id],
  }),
  game: one(games, {
    fields: [picks.gameId],
    references: [games.id],
  }),
}));

export const weeklyMatchupsRelations = relations(weeklyMatchups, ({ one }) => ({
  league: one(leagues, {
    fields: [weeklyMatchups.leagueId],
    references: [leagues.id],
  }),
  user1: one(users, {
    fields: [weeklyMatchups.user1Id],
    references: [users.id],
    relationName: 'user1',
  }),
  user2: one(users, {
    fields: [weeklyMatchups.user2Id],
    references: [users.id],
    relationName: 'user2',
  }),
  winner: one(users, {
    fields: [weeklyMatchups.winnerId],
    references: [users.id],
  }),
}));

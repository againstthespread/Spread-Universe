import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  displayName: text("display_name"),
  email: text("email").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
});

// Team schema
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name"),
  mascot: text("mascot"),
  logoUrl: text("logo_url"),
  seed: integer("seed"),
  record: text("record"),
  conference: text("conference"),
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  shortName: true,
  mascot: true,
  logoUrl: true,
  seed: true,
  record: true,
  conference: true,
});

// Round schema
export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  pointValue: integer("point_value").notNull(),
  order: integer("order").notNull(),
});

export const insertRoundSchema = createInsertSchema(rounds).pick({
  name: true,
  displayName: true,
  pointValue: true,
  order: true,
});

// Game schema
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").notNull(),
  homeTeamId: integer("home_team_id").notNull(),
  awayTeamId: integer("away_team_id").notNull(),
  spread: text("spread").notNull(),  // e.g. "-4.5" for home team favored by 4.5 points
  startTime: timestamp("start_time").notNull(),
  region: text("region"),
  gameNumber: integer("game_number"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").notNull().default("upcoming"), // upcoming, live, completed
  winningTeamId: integer("winning_team_id"),
});

// Create the base insert schema from Drizzle
const baseInsertGameSchema = createInsertSchema(games).pick({
  roundId: true,
  homeTeamId: true,
  awayTeamId: true,
  spread: true,
  startTime: true,
  region: true,
  gameNumber: true,
  status: true,
});

// Extend it to refine the startTime validation
export const insertGameSchema = baseInsertGameSchema.extend({
  // Ensure startTime is a valid date when it comes in as a string
  startTime: z.union([
    z.string().refine(
      (val) => {
        try {
          const date = new Date(val);
          return !isNaN(date.getTime());
        } catch (e) {
          return false;
        }
      },
      { message: "Expected date, received string" }
    ),
    z.date()
  ]),
});

export const updateGameSchema = createInsertSchema(games).pick({
  homeScore: true,
  awayScore: true,
  status: true,
  winningTeamId: true,
});

// Pick schema
export const picks = pgTable("picks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameId: integer("game_id").notNull(),
  pickedTeamId: integer("picked_team_id").notNull(),
  isCorrect: boolean("is_correct"),
  pointsEarned: integer("points_earned"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPickSchema = createInsertSchema(picks).pick({
  userId: true,
  gameId: true,
  pickedTeamId: true,
});

// Notification schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  message: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Round = typeof rounds.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type UpdateGame = z.infer<typeof updateGameSchema>;

export type Pick = typeof picks.$inferSelect;
export type InsertPick = z.infer<typeof insertPickSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Composite types for the UI
export interface GameWithTeams extends Game {
  homeTeam: Team;
  awayTeam: Team;
  round: Round;
  userPick?: Pick;
}

export interface UserWithStats extends User {
  rank?: number;
  totalPoints: number;
  correctPicks: number;
  incorrectPicks: number;
}

export interface LeaderboardEntry {
  user: User;
  rank: number;
  totalPoints: number;
  correctPicks: number;
  totalPicks: number;
}

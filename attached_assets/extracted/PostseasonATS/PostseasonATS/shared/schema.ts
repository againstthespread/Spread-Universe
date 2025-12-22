import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roundEnum = pgEnum("round", ["WILD_CARD", "DIVISIONAL", "CONFERENCE", "SUPER_BOWL"]);
export const favoredTeamEnum = pgEnum("favored_team", ["HOME", "AWAY"]);

// Users table with admin role support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  isAdmin: boolean("is_admin").notNull().default(false),
  email: text("email"),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  requirePasswordChange: boolean("require_password_change").notNull().default(false),
});

// Games table with playoff rounds and spreads
export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  round: roundEnum("round").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  spread: decimal("spread", { precision: 4, scale: 1 }).notNull(), // e.g., -3.5
  favoredTeam: favoredTeamEnum("favored_team").notNull(),
  gameDate: timestamp("game_date").notNull(),
  pickDeadline: timestamp("pick_deadline"), // Custom deadline for picks, defaults to gameDate if not set
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  isComplete: boolean("is_complete").notNull().default(false),
  winner: text("winner"), // Team abbreviation that covered the spread
});

// Picks table
export const picks = pgTable("picks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  selectedTeam: text("selected_team").notNull(), // Team abbreviation
  isCorrect: boolean("is_correct"), // null until game is scored
  pointsEarned: integer("points_earned").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  picks: many(picks),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  picks: many(picks),
}));

export const picksRelations = relations(picks, ({ one }) => ({
  user: one(users, {
    fields: [picks.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [picks.gameId],
    references: [games.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  emailNotifications: z.boolean().optional(),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  isComplete: true,
  winner: true,
}).extend({
  homeTeam: z.string().min(2, "Home team is required"),
  awayTeam: z.string().min(2, "Away team is required"),
  spread: z.string().regex(/^-?\d+\.?\d*$/, "Spread must be a valid number"),
  gameDate: z.string().or(z.date()),
  pickDeadline: z.string().or(z.date()).optional(),
});

export const insertPickSchema = createInsertSchema(picks).omit({
  id: true,
  isCorrect: true,
  pointsEarned: true,
  createdAt: true,
});

export const updateGameResultSchema = z.object({
  gameId: z.string(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export type InsertPick = z.infer<typeof insertPickSchema>;
export type Pick = typeof picks.$inferSelect;

export type UpdateGameResult = z.infer<typeof updateGameResultSchema>;

// Helper types for frontend
export type GameWithPicks = Game & { picks?: Pick[] };
export type UserWithPicks = User & { picks?: Pick[] };

export type PickHistoryItem = {
  pickId: string;
  userId: string;
  username: string;
  displayName: string | null;
  gameId: string;
  selectedTeam: string;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  round: "WILD_CARD" | "DIVISIONAL" | "CONFERENCE" | "SUPER_BOWL";
  homeTeam: string;
  awayTeam: string;
  spread: string;
  favoredTeam: "HOME" | "AWAY";
  gameDate: Date;
  homeScore: number | null;
  awayScore: number | null;
  isComplete: boolean;
  winner: string | null;
};

// Point values by round
export const ROUND_POINTS = {
  WILD_CARD: 125,
  DIVISIONAL: 250,
  CONFERENCE: 500,
  SUPER_BOWL: 1000,
} as const;

// Round display names
export const ROUND_NAMES = {
  WILD_CARD: "Wild Card",
  DIVISIONAL: "Divisional",
  CONFERENCE: "Conference",
  SUPER_BOWL: "Super Bowl",
} as const;

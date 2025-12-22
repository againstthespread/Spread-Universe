import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
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

export const predictions = pgTable("predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  homeScore: integer("home_score").notNull(),
  awayScore: integer("away_score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userGameUnique: unique().on(table.userId, table.gameId),
}));

export const usersRelations = relations(users, ({ many }) => ({
  predictions: many(predictions),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  predictions: many(predictions),
}));

export const predictionsRelations = relations(predictions, ({ one }) => ({
  user: one(users, {
    fields: [predictions.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [predictions.gameId],
    references: [games.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
  actualHomeScore: true,
  actualAwayScore: true,
  vegasSpread: true,
  vegasOverUnder: true,
}).extend({
  gameDate: z.string().or(z.date()).transform((val) => new Date(val)),
});

export const updateGameResultSchema = z.object({
  actualHomeScore: z.number().int().min(0),
  actualAwayScore: z.number().int().min(0),
  vegasSpread: z.number().optional(),
  vegasOverUnder: z.number().optional(),
  status: z.enum(["scheduled", "in_progress", "completed"]).optional(),
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;

export type GameWithStats = Game & {
  predictionCount: number;
  averageOverUnder: number | null;
  averageSpread: number | null;
  favoredTeam: string | null;
  isLocked: boolean;
  userPrediction?: {
    homeScore: number;
    awayScore: number;
  } | null;
};

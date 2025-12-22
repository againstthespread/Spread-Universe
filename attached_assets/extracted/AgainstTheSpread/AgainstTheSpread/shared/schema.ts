import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  category: text("category"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const clicks = pgTable("clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  clickedAt: timestamp("clicked_at").notNull().defaultNow(),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
}).extend({
  url: z.string().url("Please enter a valid URL"),
  thumbnailUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
});

export const insertClickSchema = createInsertSchema(clicks).omit({
  id: true,
  clickedAt: true,
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertClick = z.infer<typeof insertClickSchema>;
export type Click = typeof clicks.$inferSelect;

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  password: text("password").notNull(),
});

export const passwordResetCodes = pgTable("password_reset_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
});

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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PasswordResetCode = typeof passwordResetCodes.$inferSelect;

export type Platform = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  url: string;
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
    id: "gambingleague",
    name: "Gambling League",
    description: "Compete in betting leagues with friends",
    icon: "Medal",
    color: "from-green-500 to-green-600",
    url: "/gambingleague",
  },
  {
    id: "postseasonats",
    name: "Postseason ATS",
    description: "Playoff predictions and analysis",
    icon: "Star",
    color: "from-yellow-500 to-yellow-600",
    url: "/postseasonats",
  },
  {
    id: "footballweather",
    name: "Football Weather",
    description: "Weather-based football predictions",
    icon: "Cloud",
    color: "from-cyan-500 to-cyan-600",
    url: "/footballweather",
  },
];

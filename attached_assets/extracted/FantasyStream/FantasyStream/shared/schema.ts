import { z } from "zod";

// NFL Game Schema
export const gameSchema = z.object({
  id: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
  quarter: z.string(),
  timeRemaining: z.string(),
  status: z.enum(['pre', 'in', 'post']),
});

// NFL Play Schema
export const playSchema = z.object({
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

// ESPN API Response Schemas
export const espnGameResponseSchema = z.object({
  competitions: z.array(z.object({
    id: z.string(),
    status: z.object({
      type: z.object({
        state: z.string(),
      }),
      displayClock: z.string(),
      period: z.number(),
    }),
    competitors: z.array(z.object({
      team: z.object({
        abbreviation: z.string(),
      }),
      score: z.string(),
      homeAway: z.string(),
    })),
    drives: z.object({
      current: z.object({
        plays: z.array(z.object({
          id: z.string(),
          type: z.object({
            text: z.string(),
          }),
          text: z.string(),
          clock: z.object({
            displayValue: z.string(),
          }),
          period: z.object({
            number: z.number(),
          }),
          start: z.object({
            down: z.number().optional(),
            distance: z.number().optional(),
            yardLine: z.number().optional(),
          }).optional(),
          participants: z.array(z.object({
            athlete: z.object({
              displayName: z.string(),
            }),
          })).optional(),
          statYardage: z.number().optional(),
        })),
      }),
    }).optional(),
  })),
});

export type Game = z.infer<typeof gameSchema>;
export type Play = z.infer<typeof playSchema>;
export type ESPNGameResponse = z.infer<typeof espnGameResponseSchema>;

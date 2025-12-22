// Custom types beyond what's in @shared/schema.ts

// Types related to notifications
export interface NotificationData {
  id: number;
  message: string;
  timestamp: string;
  isRead: boolean;
}

// Types related to admin actions
export interface AdminActionResult {
  success: boolean;
  message: string;
}

// Types related to game picking
export interface PickSelection {
  gameId: number;
  teamId: number;
  spread: string;
}

// Types for the dashboard
export interface DashboardStats {
  totalPoints: number;
  correctPicks: number;
  incorrectPicks: number;
  rank: number | null;
}

// Extended user type with stats for frontend use
export interface UserWithStatsUI {
  id: number;
  username: string;
  displayName: string;
  isAdmin: boolean;
  stats: DashboardStats;
}

// Frontend-specific game status for UI
export enum GameStatusUI {
  UPCOMING = "upcoming",
  LIVE = "live",
  COMPLETED = "completed",
  LOCKED = "locked", // Game has started but not live yet
}

// Utility type for form errors
export interface FormErrors {
  [key: string]: string;
}

export interface Team {
  id: number;
  name: string;
  shortName: string | null;
  mascot: string | null;
  logoUrl: string | null;
  seed: number | null;
  record: string | null;
  conference: string | null;
}

export interface Round {
  id: number;
  name: string;
  displayName: string;
  pointValue: number;
  order: number;
}

export interface Game {
  id: number;
  status: string;
  roundId: number;
  homeTeamId: number;
  awayTeamId: number;
  spread: string;
  startTime: string;
  region: string | null;
  gameNumber: number | null;
  homeScore: number | null;
  awayScore: number | null;
  winningTeamId: number | null;
}

export interface GameWithTeams extends Game {
  homeTeam: Team;
  awayTeam: Team;
  round: Round;
}

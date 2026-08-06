import { formatInTimeZone, toDate } from "date-fns-tz";

const EASTERN_TZ = "America/New_York";

/**
 * Tiered pick locking (all day-of-week math in Eastern Time):
 * - Thu/Fri/Sat games (and any other early-week oddballs): lock 1 minute
 *   before the posted start time.
 * - Sun/Mon games: lock together at 12:59 PM ET on the Sunday of that
 *   weekend (Monday games lock the day before, on Sunday).
 *   Safety valve: a Sunday game that kicks off before 12:59 PM ET (e.g. a
 *   9:30 AM international game) still locks 1 minute before its own kickoff
 *   so nobody can pick a game already in progress.
 */
export function getPickLockTime(gameTime: string | Date): Date {
  const kickoff = new Date(gameTime);
  const oneMinBefore = new Date(kickoff.getTime() - 60_000);
  const day = formatInTimeZone(kickoff, EASTERN_TZ, "EEE"); // "Sun", "Mon", ...

  if (day !== "Sun" && day !== "Mon") {
    return oneMinBefore;
  }

  // The game's calendar date in ET; for Monday games, step back one ET day.
  let dateStr = formatInTimeZone(kickoff, EASTERN_TZ, "yyyy-MM-dd");
  if (day === "Mon") {
    // Noon ET of the game's date minus 24h is safely the prior ET day (DST-proof).
    const noonEt = toDate(`${dateStr}T12:00:00`, { timeZone: EASTERN_TZ });
    dateStr = formatInTimeZone(new Date(noonEt.getTime() - 24 * 3600 * 1000), EASTERN_TZ, "yyyy-MM-dd");
  }

  const sundayLock = toDate(`${dateStr}T12:59:00`, { timeZone: EASTERN_TZ });
  return sundayLock < oneMinBefore ? sundayLock : oneMinBefore;
}

/**
 * The Sunday 12:59 PM ET deadline for a Sun/Mon game's weekend, ignoring the
 * early-Sunday safety valve. Returns null for non-Sun/Mon games.
 */
export function getMainSlateLockTime(gameTime: string | Date): Date | null {
  const kickoff = new Date(gameTime);
  const day = formatInTimeZone(kickoff, EASTERN_TZ, "EEE");
  if (day !== "Sun" && day !== "Mon") return null;
  let dateStr = formatInTimeZone(kickoff, EASTERN_TZ, "yyyy-MM-dd");
  if (day === "Mon") {
    const noonEt = toDate(`${dateStr}T12:00:00`, { timeZone: EASTERN_TZ });
    dateStr = formatInTimeZone(new Date(noonEt.getTime() - 24 * 3600 * 1000), EASTERN_TZ, "yyyy-MM-dd");
  }
  return toDate(`${dateStr}T12:59:00`, { timeZone: EASTERN_TZ });
}

export function isPickLocked(gameTime: string | Date, now: Date = new Date()): boolean {
  return now >= getPickLockTime(gameTime);
}

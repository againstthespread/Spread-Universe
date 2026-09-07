import { formatInTimeZone, toDate } from "date-fns-tz";

const EASTERN_TZ = "America/New_York";

function isInMainSlateWindow(kickoff: Date): boolean {
  const day = formatInTimeZone(kickoff, EASTERN_TZ, "EEE");
  const hour = Number(formatInTimeZone(kickoff, EASTERN_TZ, "H"));
  const minute = Number(formatInTimeZone(kickoff, EASTERN_TZ, "m"));
  return (
    (day === "Sun" && hour >= 13) ||
    day === "Mon" ||
    (day === "Tue" && (hour < 9 || (hour === 9 && minute === 0)))
  );
}

function getMainSlateSundayLock(kickoff: Date): Date {
  const day = formatInTimeZone(kickoff, EASTERN_TZ, "EEE");
  let dateStr = formatInTimeZone(kickoff, EASTERN_TZ, "yyyy-MM-dd");
  const daysBack = day === "Mon" ? 1 : day === "Tue" ? 2 : 0;
  if (daysBack > 0) {
    const noonEt = toDate(`${dateStr}T12:00:00`, { timeZone: EASTERN_TZ });
    dateStr = formatInTimeZone(new Date(noonEt.getTime() - daysBack * 24 * 3600 * 1000), EASTERN_TZ, "yyyy-MM-dd");
  }
  return toDate(`${dateStr}T12:59:00`, { timeZone: EASTERN_TZ });
}

/**
 * Tiered pick locking (all day-of-week math in Eastern Time):
 * - Games from Sunday 1:00 PM through Tuesday 9:00 AM ET lock together at
 *   Sunday 12:59 PM ET ("show me what you got" main-slate deadline).
 * - Every other game locks 1 minute before its own kickoff.
 */
export function getPickLockTime(gameTime: string | Date): Date {
  const kickoff = new Date(gameTime);
  const oneMinBefore = new Date(kickoff.getTime() - 60_000);

  if (!isInMainSlateWindow(kickoff)) {
    return oneMinBefore;
  }

  return getMainSlateSundayLock(kickoff);
}

/**
 * The Sunday 12:59 PM ET deadline for a game in the main-slate window.
 * Returns null for games that lock one minute before their own kickoff.
 */
export function getMainSlateLockTime(gameTime: string | Date): Date | null {
  const kickoff = new Date(gameTime);
  return isInMainSlateWindow(kickoff) ? getMainSlateSundayLock(kickoff) : null;
}

export function isPickLocked(gameTime: string | Date, now: Date = new Date()): boolean {
  return now >= getPickLockTime(gameTime);
}

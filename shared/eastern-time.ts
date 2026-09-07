import { formatInTimeZone, toDate } from "date-fns-tz";

export const EASTERN_TIME_ZONE = "America/New_York";
export const EASTERN_WALL_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * Converts an admin-entered Eastern wall-clock value into an absolute instant.
 * A round-trip check rejects invalid/nonexistent values (notably the skipped
 * hour during the spring DST transition) instead of silently normalizing them.
 */
export function parseEasternWallTime(value: string): Date {
  if (!EASTERN_WALL_TIME_PATTERN.test(value)) {
    throw new Error("Game time must use YYYY-MM-DDTHH:mm in Eastern Time");
  }

  const instant = toDate(`${value}:00`, { timeZone: EASTERN_TIME_ZONE });
  if (
    Number.isNaN(instant.getTime()) ||
    formatInTimeZone(instant, EASTERN_TIME_ZONE, "yyyy-MM-dd'T'HH:mm") !== value
  ) {
    throw new Error("Game time is not a valid Eastern Time date and time");
  }
  return instant;
}

export function formatEasternWallTime(value: string | Date): string {
  return formatInTimeZone(value, EASTERN_TIME_ZONE, "yyyy-MM-dd'T'HH:mm");
}
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
  const formatted = (candidate: Date) =>
    formatInTimeZone(candidate, EASTERN_TIME_ZONE, "yyyy-MM-dd'T'HH:mm");
  if (
    Number.isNaN(instant.getTime()) ||
    formatted(instant) !== value
  ) {
    throw new Error("Game time is not a valid Eastern Time date and time");
  }

  // During the fall DST transition, e.g. 1:30 AM occurs twice. A
  // datetime-local field has no offset and cannot say which occurrence was
  // intended, so reject it instead of silently choosing EDT or EST.
  const oneHourEarlier = new Date(instant.getTime() - 60 * 60 * 1000);
  const oneHourLater = new Date(instant.getTime() + 60 * 60 * 1000);
  if (formatted(oneHourEarlier) === value || formatted(oneHourLater) === value) {
    throw new Error("Game time is ambiguous because clocks change then; choose a time outside the repeated 1:00 AM hour");
  }
  return instant;
}

export function formatEasternWallTime(value: string | Date): string {
  return formatInTimeZone(value, EASTERN_TIME_ZONE, "yyyy-MM-dd'T'HH:mm");
}
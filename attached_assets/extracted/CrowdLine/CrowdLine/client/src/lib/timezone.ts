import { format as formatDate } from 'date-fns';
import { formatInTimeZone, toZonedTime, toDate } from 'date-fns-tz';

const EASTERN_TZ = 'America/New_York';

/**
 * Converts a date and time string (entered in Eastern Time) to UTC ISO string
 * @param dateString - Date in format "YYYY-MM-DD"
 * @param timeString - Time in format "HH:mm"
 * @returns ISO string in UTC
 */
export function easternToUTC(dateString: string, timeString: string): string {
  const dateTimeString = `${dateString}T${timeString}:00`;
  const utcDate = toDate(dateTimeString, { timeZone: EASTERN_TZ });
  return utcDate.toISOString();
}

/**
 * Formats a UTC date to Eastern Time
 * @param utcDate - Date string or Date object in UTC
 * @param formatString - Format string (date-fns format)
 * @returns Formatted date string in Eastern Time
 */
export function formatInEastern(utcDate: string | Date, formatString: string): string {
  return formatInTimeZone(utcDate, EASTERN_TZ, formatString);
}

/**
 * Checks if a game has started based on Eastern Time
 * @param gameDate - UTC date string from database
 * @returns true if game has started
 */
export function hasGameStarted(gameDate: string): boolean {
  const now = new Date();
  const gameTime = new Date(gameDate);
  return now >= gameTime;
}

/**
 * Gets the current time in Eastern Time as a Date object
 */
export function getCurrentEasternTime(): Date {
  return toZonedTime(new Date(), EASTERN_TZ);
}

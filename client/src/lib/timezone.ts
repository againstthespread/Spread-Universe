import { formatInTimeZone, toDate } from 'date-fns-tz';

const EASTERN_TZ = 'America/New_York';

export function easternToUTC(dateString: string, timeString: string): string {
  const dateTimeString = `${dateString}T${timeString}:00`;
  const utcDate = toDate(dateTimeString, { timeZone: EASTERN_TZ });
  return utcDate.toISOString();
}

export function formatInEastern(utcDate: string | Date, formatString: string): string {
  return formatInTimeZone(utcDate, EASTERN_TZ, formatString);
}

// For date-only values stored as UTC midnight (e.g. tournament start dates):
// formatting those in Eastern would shift back a calendar day, so format in UTC.
export function formatDateOnly(utcDate: string | Date, formatString: string): string {
  return formatInTimeZone(utcDate, 'UTC', formatString);
}

export function hasGameStarted(gameDate: string): boolean {
  const now = new Date();
  const gameTime = new Date(gameDate);
  return now >= gameTime;
}

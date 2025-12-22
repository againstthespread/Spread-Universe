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

export function hasGameStarted(gameDate: string): boolean {
  const now = new Date();
  const gameTime = new Date(gameDate);
  return now >= gameTime;
}

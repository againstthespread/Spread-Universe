/**
 * Size-specific playoff formats for gambling leagues, keyed on league
 * capacity. Shared by the server engine (schedule + bracket generation) and
 * the client (Playoffs tab projection, Schedule tab week labels) so they can
 * never disagree.
 *
 * | Capacity | Teams | Byes | Start   | Structure                                  |
 * |----------|-------|------|---------|--------------------------------------------|
 * | 8        | 4     | 0    | Week 16 | Semifinals -> Championship                 |
 * | 10, 12   | 6     | 2    | Week 15 | Opening Round -> Semifinals -> Championship|
 * | 16       | 8     | 0    | Week 15 | Quarterfinals -> Semis -> Championship     |
 * | 18, 20   | 12    | 4    | Week 14 | Play-In -> QF -> Semis -> Championship     |
 *
 * Championship is always week 17. 18/20-capacity leagues play a 13-week
 * regular season; all others play 14 weeks (capacity 8 has an off week 15).
 *
 * Seeding conventions: byes go to the top seeds; each round pairs the highest
 * remaining seed vs the lowest remaining seed.
 */

export type PlayoffRoundKey = "playin" | "quarterfinal" | "semifinal" | "championship";

export type PlayoffRoundConfig = {
  key: PlayoffRoundKey;
  week: number;
  /** Display name, e.g. "Opening Round" for the 6-team first round. */
  label: string;
};

export type PlayoffConfig = {
  capacity: number;
  regularSeasonWeeks: number;
  playoffTeams: number;
  byes: number;
  /** Rounds in play order; the last round is always the championship (week 17). */
  rounds: PlayoffRoundConfig[];
};

export const CHAMPIONSHIP_WEEK = 17;

const CONFIGS: Record<number, PlayoffConfig> = {
  8: {
    capacity: 8, regularSeasonWeeks: 14, playoffTeams: 4, byes: 0,
    rounds: [
      { key: "semifinal", week: 16, label: "Semifinals" },
      { key: "championship", week: 17, label: "Championship" },
    ],
  },
  10: {
    capacity: 10, regularSeasonWeeks: 14, playoffTeams: 6, byes: 2,
    rounds: [
      { key: "quarterfinal", week: 15, label: "Opening Round" },
      { key: "semifinal", week: 16, label: "Semifinals" },
      { key: "championship", week: 17, label: "Championship" },
    ],
  },
  12: {
    capacity: 12, regularSeasonWeeks: 14, playoffTeams: 6, byes: 2,
    rounds: [
      { key: "quarterfinal", week: 15, label: "Opening Round" },
      { key: "semifinal", week: 16, label: "Semifinals" },
      { key: "championship", week: 17, label: "Championship" },
    ],
  },
  16: {
    capacity: 16, regularSeasonWeeks: 14, playoffTeams: 8, byes: 0,
    rounds: [
      { key: "quarterfinal", week: 15, label: "Quarterfinals" },
      { key: "semifinal", week: 16, label: "Semifinals" },
      { key: "championship", week: 17, label: "Championship" },
    ],
  },
  18: {
    capacity: 18, regularSeasonWeeks: 13, playoffTeams: 12, byes: 4,
    rounds: [
      { key: "playin", week: 14, label: "Play-In Round" },
      { key: "quarterfinal", week: 15, label: "Quarterfinals" },
      { key: "semifinal", week: 16, label: "Semifinals" },
      { key: "championship", week: 17, label: "Championship" },
    ],
  },
  20: {
    capacity: 20, regularSeasonWeeks: 13, playoffTeams: 12, byes: 4,
    rounds: [
      { key: "playin", week: 14, label: "Play-In Round" },
      { key: "quarterfinal", week: 15, label: "Quarterfinals" },
      { key: "semifinal", week: 16, label: "Semifinals" },
      { key: "championship", week: 17, label: "Championship" },
    ],
  },
};

/**
 * Returns the playoff format for a league capacity. Unknown capacities
 * (legacy data) fall back to the 12-team format, which matches the engine's
 * original 6-team / weeks-15-17 behavior.
 */
export function getPlayoffConfig(capacity: number): PlayoffConfig {
  return CONFIGS[capacity] ?? CONFIGS[12];
}

/**
 * Number of participants entering the round at `roundIdx`.
 * Round 0 excludes bye seeds (they don't play); round 1 adds them back.
 */
export function participantsInRound(config: PlayoffConfig, roundIdx: number): number {
  const { playoffTeams: t, byes: b } = config;
  if (roundIdx === 0) return t - b;
  let count = b + (t - b) / 2; // entering round 1
  for (let i = 1; i < roundIdx; i++) count = count / 2;
  return count;
}

/** Round config for a given week, or null if that week has no playoff round. */
export function roundForWeek(config: PlayoffConfig, week: number): { round: PlayoffRoundConfig; index: number } | null {
  const index = config.rounds.findIndex(r => r.week === week);
  return index === -1 ? null : { round: config.rounds[index], index };
}

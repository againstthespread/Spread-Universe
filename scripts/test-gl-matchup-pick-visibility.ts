import assert from "node:assert/strict";
import type { GamblingLeagueGame, GamblingLeaguePick } from "../shared/schema";
import { buildMatchupPicksResponse } from "../server/gl-matchup-picks";

const user1Id = "user-1";
const user2Id = "user-2";
const leagueMemberId = "user-3";

function game(id: string, gameTime: string): GamblingLeagueGame {
  return {
    id,
    week: 1,
    homeTeam: `${id}-home`,
    awayTeam: `${id}-away`,
    spread: "-3.5",
    homeScore: null,
    awayScore: null,
    isComplete: false,
    gameTime: new Date(gameTime),
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
  };
}

function pick(id: string, userId: string, gameId: string, note: string): GamblingLeaguePick {
  return {
    id,
    userId,
    leagueId: "league-1",
    gameId,
    week: 1,
    pickedTeam: "home",
    note,
    isCorrect: null,
    isPush: false,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
  };
}

const thursday = game("thursday", "2026-09-11T00:20:00.000Z");
const saturday = game("saturday", "2026-09-12T23:30:00.000Z");
const sunday = game("sunday", "2026-09-13T17:00:00.000Z");
const monday = game("monday", "2026-09-15T00:15:00.000Z");
const games = [thursday, saturday, sunday, monday];
const user1Picks = [
  pick("pick-thursday", user1Id, thursday.id, "Thursday note"),
  pick("pick-sunday", user1Id, sunday.id, "Sunday note"),
];
const user2Picks = [
  pick("pick-saturday", user2Id, saturday.id, "Saturday note"),
  pick("pick-sunday-user-2", user2Id, sunday.id, "Overlapping Sunday note"),
  pick("pick-monday", user2Id, monday.id, "Monday note"),
];

const beforeAnyLock = new Date("2026-09-11T00:18:59.000Z");
const afterThursdayLock = new Date("2026-09-11T00:19:01.000Z");
const afterSaturdayLock = new Date("2026-09-12T23:29:01.000Z");
const beforeMainSlateLock = new Date("2026-09-13T16:58:59.000Z");
const afterMainSlateLock = new Date("2026-09-13T16:59:01.000Z");

function responseFor(requesterId: string, now: Date) {
  return buildMatchupPicksResponse({
    games,
    user1Picks,
    user2Picks,
    user1Id,
    user2Id,
    requesterId,
    now,
  });
}

const ownerBeforeLock = responseFor(user1Id, beforeAnyLock);
assert.deepEqual(ownerBeforeLock.games.map(item => item.id), [thursday.id, sunday.id]);
assert(ownerBeforeLock.games.every(item => item.user1Pick?.note));
assert(ownerBeforeLock.games.every(item => item.user2Pick === null));
assert.equal(ownerBeforeLock.user1PickCount, 2);
assert.equal(ownerBeforeLock.user2PickCount, 0);

const opponentBeforeLock = responseFor(user2Id, beforeAnyLock);
assert.deepEqual(opponentBeforeLock.games.map(item => item.id), [saturday.id, sunday.id, monday.id]);
assert(opponentBeforeLock.games.every(item => item.user1Pick === null));
assert(opponentBeforeLock.games.every(item => item.user2Pick?.note));
assert.equal(opponentBeforeLock.user1PickCount, 0);
assert.equal(opponentBeforeLock.user2PickCount, 3);
assert.equal(opponentBeforeLock.picksRevealed, false);

const otherMemberBeforeLock = responseFor(leagueMemberId, beforeAnyLock);
assert.deepEqual(otherMemberBeforeLock.games, []);
assert.equal(otherMemberBeforeLock.user1PickCount, 0);
assert.equal(otherMemberBeforeLock.user2PickCount, 0);
assert.equal(otherMemberBeforeLock.picksRevealed, false);

const afterFirstLock = responseFor(leagueMemberId, afterThursdayLock);
assert.deepEqual(afterFirstLock.games.map(item => item.id), [thursday.id]);
assert.equal(afterFirstLock.games[0].user1Pick?.id, "pick-thursday");
assert.equal(afterFirstLock.games[0].user1Pick?.note, "Thursday note");
assert.equal(afterFirstLock.games[0].user2Pick, null);
assert.equal(afterFirstLock.user1PickCount, 1);
assert.equal(afterFirstLock.user2PickCount, 0);
assert.equal(afterFirstLock.picksRevealed, false);

const beforeSundayDeadline = responseFor(leagueMemberId, beforeMainSlateLock);
assert.deepEqual(
  beforeSundayDeadline.games.map(item => item.id),
  [thursday.id, saturday.id],
);
assert.equal(beforeSundayDeadline.games[1].user2Pick?.note, "Saturday note");

const afterSundayDeadline = responseFor(leagueMemberId, afterMainSlateLock);
assert.deepEqual(
  afterSundayDeadline.games.map(item => item.id),
  [thursday.id, saturday.id, sunday.id, monday.id],
);
assert(afterSundayDeadline.games.every(item => item.picksLocked));
assert.equal(afterSundayDeadline.games[2].user1Pick?.note, "Sunday note");
assert.equal(afterSundayDeadline.games[2].user2Pick?.note, "Overlapping Sunday note");
assert.equal(afterSundayDeadline.user1PickCount, 2);
assert.equal(afterSundayDeadline.user2PickCount, 3);
assert.equal(afterSundayDeadline.picksRevealed, true);

const afterSaturday = responseFor(leagueMemberId, afterSaturdayLock);
assert.deepEqual(afterSaturday.games.map(item => item.id), [thursday.id, saturday.id]);

console.log("Gambling League matchup pick visibility checks passed.");
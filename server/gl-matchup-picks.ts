import type { GamblingLeagueGame, GamblingLeaguePick } from "@shared/schema";
import { isPickLocked } from "@shared/pick-lock";

type MatchupGameWithPicks = GamblingLeagueGame & {
  picksLocked: boolean;
  user1Pick: GamblingLeaguePick | null;
  user2Pick: GamblingLeaguePick | null;
};

interface BuildMatchupPicksResponseInput {
  games: GamblingLeagueGame[];
  user1Picks: GamblingLeaguePick[];
  user2Picks: GamblingLeaguePick[];
  user1Id: string;
  user2Id: string | null;
  requesterId: string;
  now?: Date;
}

export interface MatchupPicksResponse {
  picksRevealed: boolean;
  user1PickCount: number;
  user2PickCount: number | null;
  games: MatchupGameWithPicks[];
}

export function buildMatchupPicksResponse({
  games,
  user1Picks,
  user2Picks,
  user1Id,
  user2Id,
  requesterId,
  now = new Date(),
}: BuildMatchupPicksResponseInput): MatchupPicksResponse {
  const gamesById = new Map(games.map(game => [game.id, game]));
  const lockedGameIds = new Set(
    games.filter(game => isPickLocked(game.gameTime, now)).map(game => game.id),
  );

  const canViewPick = (pickOwnerId: string, gameId: string) =>
    pickOwnerId === requesterId || lockedGameIds.has(gameId);

  // Do not list an unlocked game solely because another user picked it. Doing
  // so would reveal which games they selected even while withholding the team.
  const visiblePickedGameIds = new Set<string>();
  for (const pick of user1Picks) {
    if (canViewPick(user1Id, pick.gameId)) visiblePickedGameIds.add(pick.gameId);
  }
  if (user2Id !== null) {
    for (const pick of user2Picks) {
      if (canViewPick(user2Id, pick.gameId)) visiblePickedGameIds.add(pick.gameId);
    }
  }

  const user1PicksByGame = new Map(user1Picks.map(pick => [pick.gameId, pick]));
  const user2PicksByGame = new Map(user2Picks.map(pick => [pick.gameId, pick]));

  const visibleGames = Array.from(visiblePickedGameIds)
    .map(gameId => gamesById.get(gameId))
    .filter((game): game is GamblingLeagueGame => game !== undefined)
    .sort((a, b) => new Date(a.gameTime).getTime() - new Date(b.gameTime).getTime())
    .map(game => {
      const picksLocked = lockedGameIds.has(game.id);
      return {
        ...game,
        picksLocked,
        user1Pick: canViewPick(user1Id, game.id)
          ? user1PicksByGame.get(game.id) ?? null
          : null,
        user2Pick: user2Id !== null && canViewPick(user2Id, game.id)
          ? user2PicksByGame.get(game.id) ?? null
          : null,
      };
    });

  return {
    // Base this flag on game locks rather than whether hidden picks exist.
    // Otherwise the flag itself could reveal that an opponent selected one of
    // the remaining unlocked games.
    picksRevealed:
      (user2Id === null && requesterId === user1Id) ||
      games.every(game => lockedGameIds.has(game.id)),
    user1PickCount: user1Id === requesterId
      ? user1Picks.length
      : user1Picks.filter(pick => lockedGameIds.has(pick.gameId)).length,
    user2PickCount: user2Id === null
      ? null
      : user2Id === requesterId
        ? user2Picks.length
        : user2Picks.filter(pick => lockedGameIds.has(pick.gameId)).length,
    games: visibleGames,
  };
}

import { storage } from "../server/storage";
import { InsertGame } from "../shared/schema";

const games: InsertGame[] = [
  {
    homeTeamId: 246,
    awayTeamId: 33,
    roundId: 2,
    startTime: "2025-03-22T20:10:00.000Z",
    region: "Midwest",
    gameNumber: 33,
    status: "upcoming",
    spread: "+5.5"
  },
  {
    homeTeamId: 66,
    awayTeamId: 23,
    roundId: 2,
    startTime: "2025-03-22T22:40:00.000Z",
    region: "West",
    gameNumber: 34,
    status: "upcoming",
    spread: "+7.5"
  },
  {
    homeTeamId: 28,
    awayTeamId: 71,
    roundId: 2,
    startTime: "2025-03-23T01:15:00.000Z",
    region: "South",
    gameNumber: 35,
    status: "upcoming",
    spread: "+2.5"
  },
  {
    homeTeamId: 128,
    awayTeamId: 47,
    roundId: 2,
    startTime: "2025-03-23T02:10:00.000Z",
    region: "West",
    gameNumber: 36,
    status: "upcoming",
    spread: "+7.5"
  },
  {
    homeTeamId: 19,
    awayTeamId: 63,
    roundId: 2,
    startTime: "2025-03-23T03:10:00.000Z",
    region: "South",
    gameNumber: 37,
    status: "upcoming",
    spread: "+8.5"
  },
  {
    homeTeamId: 56,
    awayTeamId: 30,
    roundId: 2,
    startTime: "2025-03-23T03:45:00.000Z",
    region: "East",
    gameNumber: 38,
    status: "upcoming",
    spread: "+1.5"
  },
  {
    homeTeamId: 118,
    awayTeamId: 55,
    roundId: 2,
    startTime: "2025-03-23T04:40:00.000Z",
    region: "Midwest",
    gameNumber: 39,
    status: "upcoming",
    spread: "+5.5"
  },
  {
    homeTeamId: 42,
    awayTeamId: 62,
    roundId: 2,
    startTime: "2025-03-23T05:40:00.000Z",
    region: "Midwest",
    gameNumber: 40,
    status: "upcoming",
    spread: "+4.5"
  }
];

async function insertRound2Games() {
  console.log("Inserting Round 2 games...");
  
  for (const game of games) {
    try {
      const newGame = await storage.createGame(game);
      console.log(`Created game ${newGame.id} between teams ${game.homeTeamId} and ${game.awayTeamId}`);
    } catch (error) {
      console.error(`Error creating game between teams ${game.homeTeamId} and ${game.awayTeamId}:`, error);
    }
  }
  
  console.log("Finished inserting Round 2 games");
}

insertRound2Games()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

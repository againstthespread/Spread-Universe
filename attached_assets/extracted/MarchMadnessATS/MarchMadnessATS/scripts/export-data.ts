import { storage } from "../server/storage";

/**
 * Script to export all NCAA tournament data to a JSON file
 * This will help you transfer data between projects
 */
async function exportData() {
  console.log("Exporting NCAA tournament data...");

  try {
    // Export teams data
    const teams = await storage.getTeams();
    console.log(`Found ${teams.length} teams`);

    // Export rounds data
    const rounds = await storage.getRounds();
    console.log(`Found ${rounds.length} rounds`);

    // Export games data
    const games = await storage.getGamesByRoundWithTeams(1); // Round of 64
    console.log(`Found ${games.length} games for Round of 64`);

    // Create the full export object
    const exportData = {
      teams: teams.map(team => ({
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        mascot: team.mascot,
        logoUrl: team.logoUrl,
        seed: team.seed,
        record: team.record,
        conference: team.conference
      })),
      rounds,
      games: games.map(game => ({
        id: game.id,
        roundId: game.roundId,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        spread: game.spread,
        startTime: game.startTime,
        region: game.region,
        gameNumber: game.gameNumber,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        status: game.status,
        winningTeamId: game.winningTeamId,
        // Include team details for reference
        homeTeam: {
          id: game.homeTeam.id,
          name: game.homeTeam.name,
          shortName: game.homeTeam.shortName,
          mascot: game.homeTeam.mascot,
          seed: game.homeTeam.seed,
          logoUrl: game.homeTeam.logoUrl
        },
        awayTeam: {
          id: game.awayTeam.id,
          name: game.awayTeam.name,
          shortName: game.awayTeam.shortName,
          mascot: game.awayTeam.mascot,
          seed: game.awayTeam.seed,
          logoUrl: game.awayTeam.logoUrl
        }
      }))
    };

    // Output the formatted JSON
    console.log('\n=== START OF EXPORT DATA ===\n');
    console.log(JSON.stringify(exportData, null, 2));
    console.log('\n=== END OF EXPORT DATA ===\n');

    console.log("Export complete! Copy the JSON data above to import into another project.");
  } catch (error) {
    console.error("Error exporting data:", error);
  }
}

// Run the export function
exportData().catch(console.error);
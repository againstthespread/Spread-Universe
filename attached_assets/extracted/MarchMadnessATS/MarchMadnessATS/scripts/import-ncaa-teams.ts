import { storage } from "../server/storage";
import { ncaaTeams } from "../attached_assets/ncaa-teams-full";

/**
 * Script to import all NCAA Division I basketball teams
 * from the complete NCAA teams dataset
 */
async function importNcaaTeams() {
  console.log("Starting import of all NCAA Division I basketball teams...");
  
  // Track conferences for reporting
  const conferenceStats: Record<string, number> = {};
  let totalTeams = 0;
  
  for (const team of ncaaTeams) {
    try {
      // Check if the team already exists
      const existingTeam = await storage.getTeamByName(team.name);
      if (existingTeam) {
        console.log(`Team already exists: ${team.name}`);
        
        // Update the existing team with complete information
        await storage.updateTeam(existingTeam.id, {
          shortName: team.shortName,
          mascot: team.mascot,
          conference: team.conference,
          logoUrl: existingTeam.logoUrl || `https://ncaa-logos.example.com/${encodeURIComponent(team.shortName.toLowerCase())}.png`,
        });
        
        console.log(`Updated team info for: ${team.name}`);
      } else {
        // Create the new team
        await storage.createTeam({
          name: team.name,
          shortName: team.shortName,
          mascot: team.mascot,
          conference: team.conference,
          logoUrl: `https://ncaa-logos.example.com/${encodeURIComponent(team.shortName.toLowerCase())}.png`,
        });
        
        console.log(`Added new team: ${team.name} (${team.mascot})`);
      }
      
      // Track conference stats
      conferenceStats[team.conference] = (conferenceStats[team.conference] || 0) + 1;
      totalTeams++;
      
    } catch (error) {
      console.error(`Error adding team ${team.name}:`, error);
    }
  }
  
  // Report results
  console.log("\nImport completed!");
  console.log(`Total teams processed: ${totalTeams}`);
  console.log("\nConference breakdown:");
  
  Object.entries(conferenceStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([conference, count]) => {
      console.log(`${conference}: ${count} teams`);
    });
}

// Run the import function
importNcaaTeams()
  .then(() => {
    console.log("NCAA teams import completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during NCAA teams import:", error);
    process.exit(1);
  });
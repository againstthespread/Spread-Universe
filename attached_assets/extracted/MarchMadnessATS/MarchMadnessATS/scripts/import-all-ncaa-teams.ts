import { storage } from "../server/storage";
import { ncaaTeams } from "../attached_assets/ncaa-teams-full";

/**
 * Script to import all NCAA Division I basketball teams (365 teams)
 * from the complete NCAA teams dataset
 */
async function importAllNcaaTeams() {
  console.log("Starting import of all NCAA Division I basketball teams...");
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const team of ncaaTeams) {
    try {
      // Check if team already exists
      const existingTeam = await storage.getTeamByName(team.name);
      
      if (existingTeam) {
        console.log(`Team ${team.name} already exists, updating...`);
        
        // Update existing team with complete information
        await storage.updateTeam(existingTeam.id, {
          shortName: team.shortName,
          mascot: team.mascot,
          conference: team.conference,
          logoUrl: `https://ncaa-logos.example.com/${encodeURIComponent(team.shortName.toLowerCase())}.png`
        });
        
        successCount++;
      } else {
        // Create new team
        await storage.createTeam({
          name: team.name,
          shortName: team.shortName,
          mascot: team.mascot,
          conference: team.conference,
          logoUrl: `https://ncaa-logos.example.com/${encodeURIComponent(team.shortName.toLowerCase())}.png`
        });
        
        successCount++;
      }
    } catch (error) {
      console.error(`Error processing team ${team.name}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Import completed. Successfully processed ${successCount} teams.`);
  if (errorCount > 0) {
    console.log(`Failed to process ${errorCount} teams.`);
  }
  
  // Get and show conferences
  const teams = await storage.getTeams();
  const conferenceMap: Record<string, number> = {};
  
  teams.forEach(team => {
    if (team.conference) {
      conferenceMap[team.conference] = (conferenceMap[team.conference] || 0) + 1;
    }
  });
  
  console.log("\nConference breakdown:");
  Object.entries(conferenceMap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([conference, count]) => {
      console.log(`${conference}: ${count} teams`);
    });
}

// Run the import function
importAllNcaaTeams().catch(console.error);
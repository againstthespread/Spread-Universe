import { storage } from "../server/storage";

// NCAA Tournament Teams with their seeds
const tournamentTeams = [
  { name: "Alabama", seed: 1, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Alabama_Athletics_logo.svg/1200px-Alabama_Athletics_logo.svg.png" },
  { name: "Houston", seed: 1, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Houston_Cougars_logo.svg/1200px-Houston_Cougars_logo.svg.png" },
  { name: "Kansas", seed: 1, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Kansas_Jayhawks_logo.svg/1200px-Kansas_Jayhawks_logo.svg.png" },
  { name: "Purdue", seed: 1, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Purdue_Boilermakers_logo.svg/1200px-Purdue_Boilermakers_logo.svg.png" },
  { name: "Arizona", seed: 2, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Arizona_Wildcats_logo.svg/1200px-Arizona_Wildcats_logo.svg.png" },
  { name: "Marquette", seed: 2, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Marquette_Golden_Eagles_logo.svg/1200px-Marquette_Golden_Eagles_logo.svg.png" },
  { name: "Texas", seed: 2, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Texas_Longhorns_logo.svg/1200px-Texas_Longhorns_logo.svg.png" },
  { name: "UCLA", seed: 2, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/UCLA_Bruins_logo.svg/1200px-UCLA_Bruins_logo.svg.png" },
  { name: "Baylor", seed: 3, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Baylor_Athletics_logo.svg/1200px-Baylor_Athletics_logo.svg.png" },
  { name: "Gonzaga", seed: 3, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Gonzaga_Bulldogs_logo.svg/1200px-Gonzaga_Bulldogs_logo.svg.png" },
  { name: "Kansas State", seed: 3, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Kansas_State_Wildcats_logo.svg/1200px-Kansas_State_Wildcats_logo.svg.png" },
  { name: "Xavier", seed: 3, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Xavier_Musketeers_logo.svg/1200px-Xavier_Musketeers_logo.svg.png" },
  { name: "Connecticut", seed: 4, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Connecticut_Huskies_logo.svg/1200px-Connecticut_Huskies_logo.svg.png" },
  { name: "Indiana", seed: 4, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Indiana_Hoosiers_logo.svg/1200px-Indiana_Hoosiers_logo.svg.png" },
  { name: "Tennessee", seed: 4, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Tennessee_Volunteers_logo.svg/1200px-Tennessee_Volunteers_logo.svg.png" },
  { name: "Virginia", seed: 4, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Virginia_Cavaliers_logo.svg/1200px-Virginia_Cavaliers_logo.svg.png" },
  { name: "Duke", seed: 5, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Duke_Athletics_logo.svg/1200px-Duke_Athletics_logo.svg.png" },
  { name: "Miami (FL)", seed: 5, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Miami_Hurricanes_logo.svg/1200px-Miami_Hurricanes_logo.svg.png" },
  { name: "Saint Mary's", seed: 5, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Saint_Mary%27s_Gaels_logo.svg/1200px-Saint_Mary%27s_Gaels_logo.svg.png" },
  { name: "San Diego State", seed: 5, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/San_Diego_State_Aztecs_logo.svg/1200px-San_Diego_State_Aztecs_logo.svg.png" },
  { name: "Creighton", seed: 6, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Creighton_Bluejays_logo.svg/1200px-Creighton_Bluejays_logo.svg.png" },
  { name: "Iowa State", seed: 6, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Iowa_State_Cyclones_logo.svg/1200px-Iowa_State_Cyclones_logo.svg.png" },
  { name: "Kentucky", seed: 6, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Kentucky_Wildcats_logo.svg/1200px-Kentucky_Wildcats_logo.svg.png" },
  { name: "TCU", seed: 6, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/TCU_Horned_Frogs_logo.svg/1200px-TCU_Horned_Frogs_logo.svg.png" },
  { name: "Michigan State", seed: 7, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Michigan_State_Athletics_logo.svg/1200px-Michigan_State_Athletics_logo.svg.png" },
  { name: "Missouri", seed: 7, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Missouri_Tigers_logo.svg/1200px-Missouri_Tigers_logo.svg.png" },
  { name: "Northwestern", seed: 7, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Northwestern_Wildcats_logo.svg/1200px-Northwestern_Wildcats_logo.svg.png" },
  { name: "Texas A&M", seed: 7, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Texas_A%26M_University_logo.svg/1200px-Texas_A%26M_University_logo.svg.png" },
  { name: "Arkansas", seed: 8, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Arkansas_Razorbacks_logo.svg/1200px-Arkansas_Razorbacks_logo.svg.png" },
  { name: "Iowa", seed: 8, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Iowa_Hawkeyes_logo.svg/1200px-Iowa_Hawkeyes_logo.svg.png" },
  { name: "Maryland", seed: 8, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Maryland_Terrapins_logo.svg/1200px-Maryland_Terrapins_logo.svg.png" },
  { name: "Memphis", seed: 8, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Memphis_Tigers_logo.svg/1200px-Memphis_Tigers_logo.svg.png" },
  { name: "Auburn", seed: 9, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Auburn_Tigers_logo.svg/1200px-Auburn_Tigers_logo.svg.png" },
  { name: "Florida Atlantic", seed: 9, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Florida_Atlantic_Owls_logo.svg/1200px-Florida_Atlantic_Owls_logo.svg.png" },
  { name: "Illinois", seed: 9, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Illinois_Fighting_Illini_logo.svg/1200px-Illinois_Fighting_Illini_logo.svg.png" },
  { name: "West Virginia", seed: 9, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/West_Virginia_Mountaineers_logo.svg/1200px-West_Virginia_Mountaineers_logo.svg.png" },
  { name: "Boise State", seed: 10, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Boise_State_Broncos_logo.svg/1200px-Boise_State_Broncos_logo.svg.png" },
  { name: "Penn State", seed: 10, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Penn_State_Nittany_Lions_logo.svg/1200px-Penn_State_Nittany_Lions_logo.svg.png" },
  { name: "USC", seed: 10, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/USC_Trojans_logo.svg/1200px-USC_Trojans_logo.svg.png" },
  { name: "Utah State", seed: 10, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Utah_State_Aggies_logo.svg/1200px-Utah_State_Aggies_logo.svg.png" },
  { name: "Arizona State", seed: 11, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Arizona_State_Sun_Devils_logo.svg/1200px-Arizona_State_Sun_Devils_logo.svg.png" },
  { name: "Mississippi State", seed: 11, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Mississippi_State_Bulldogs_logo.svg/1200px-Mississippi_State_Bulldogs_logo.svg.png" },
  { name: "Nevada", seed: 11, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Nevada_Wolf_Pack_logo.svg/1200px-Nevada_Wolf_Pack_logo.svg.png" },
  { name: "Pittsburgh", seed: 11, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Pittsburgh_Panthers_logo.svg/1200px-Pittsburgh_Panthers_logo.svg.png" },
  { name: "Charleston", seed: 12, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/College_of_Charleston_logo.svg/1200px-College_of_Charleston_logo.svg.png" },
  { name: "Drake", seed: 12, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Drake_Bulldogs_logo.svg/1200px-Drake_Bulldogs_logo.svg.png" },
  { name: "Oral Roberts", seed: 12, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Oral_Roberts_Golden_Eagles_logo.svg/1200px-Oral_Roberts_Golden_Eagles_logo.svg.png" },
  { name: "VCU", seed: 12, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/VCU_Rams_logo.svg/1200px-VCU_Rams_logo.svg.png" },
  { name: "Furman", seed: 13, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Furman_Paladins_logo.svg/1200px-Furman_Paladins_logo.svg.png" },
  { name: "Iona", seed: 13, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Iona_Gaels_logo.svg/1200px-Iona_Gaels_logo.svg.png" },
  { name: "Kent State", seed: 13, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Kent_State_Golden_Flashes_logo.svg/1200px-Kent_State_Golden_Flashes_logo.svg.png" },
  { name: "Louisiana", seed: 13, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Louisiana_Ragin%27_Cajuns_logo.svg/1200px-Louisiana_Ragin%27_Cajuns_logo.svg.png" },
  { name: "Grand Canyon", seed: 14, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Grand_Canyon_Lopes_logo.svg/1200px-Grand_Canyon_Lopes_logo.svg.png" },
  { name: "Kennesaw State", seed: 14, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Kennesaw_State_Owls_logo.svg/1200px-Kennesaw_State_Owls_logo.svg.png" },
  { name: "Montana State", seed: 14, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Montana_State_Bobcats_logo.svg/1200px-Montana_State_Bobcats_logo.svg.png" },
  { name: "UC Santa Barbara", seed: 14, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/UC_Santa_Barbara_Gauchos_logo.svg/1200px-UC_Santa_Barbara_Gauchos_logo.svg.png" },
  { name: "Colgate", seed: 15, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Colgate_Raiders_logo.svg/1200px-Colgate_Raiders_logo.svg.png" },
  { name: "Princeton", seed: 15, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Princeton_Tigers_logo.svg/1200px-Princeton_Tigers_logo.svg.png" },
  { name: "UNC Asheville", seed: 15, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/UNC_Asheville_Bulldogs_logo.svg/1200px-UNC_Asheville_Bulldogs_logo.svg.png" },
  { name: "Vermont", seed: 15, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Vermont_Catamounts_logo.svg/1200px-Vermont_Catamounts_logo.svg.png" },
  { name: "FDU", seed: 16, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Fairleigh_Dickinson_Knights_logo.svg/1200px-Fairleigh_Dickinson_Knights_logo.svg.png" },
  { name: "Howard", seed: 16, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Howard_Bison_logo.svg/1200px-Howard_Bison_logo.svg.png" },
  { name: "Northern Kentucky", seed: 16, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Northern_Kentucky_Norse_logo.svg/1200px-Northern_Kentucky_Norse_logo.svg.png" },
  { name: "Texas A&M-CC", seed: 16, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Texas_A%26M%E2%80%93Corpus_Christi_Islanders_logo.svg/1200px-Texas_A%26M%E2%80%93Corpus_Christi_Islanders_logo.svg.png" },
  { name: "Texas Southern", seed: 16, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Texas_Southern_Tigers_logo.svg/1200px-Texas_Southern_Tigers_logo.svg.png" }
];

async function addTeams() {
  console.log("Starting to add teams...");
  
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const team of tournamentTeams) {
    try {
      // Check if team already exists
      const existingTeam = await storage.getTeamByName(team.name);
      
      if (!existingTeam) {
        await storage.createTeam({
          name: team.name,
          seed: team.seed,
          logoUrl: team.logoUrl
        });
        addedCount++;
        console.log(`Added team: ${team.name} (Seed: ${team.seed})`);
      } else {
        skippedCount++;
        console.log(`Skipped existing team: ${team.name}`);
      }
    } catch (error) {
      console.error(`Error adding team ${team.name}:`, error);
    }
  }
  
  console.log(`Finished! Added ${addedCount} teams, skipped ${skippedCount} teams.`);
}

// Run the function
addTeams().then(() => {
  console.log("Team addition script completed");
}).catch((error) => {
  console.error("Error in team addition script:", error);
});
import { storage } from "../server/storage";

// Process the input list of schools and nicknames
const schoolInput = `School     Nickname
Abilene Christian University    Wildcats
United States Air Force Academy (Air Force)     Falcons
University of Akron     Zips
University of Alabama   Crimson Tide
Alabama Agricultural and Mechanical University (Alabama A&M)    Bulldogs
Alabama State University        Hornets
University at Albany, SUNY (Albany or UAlbany)  Great Danes
Alcorn State University Braves
American University     Eagles
Appalachian State University    Mountaineers
University of Arizona   Wildcats
Arizona State University        Sun Devils
University of Arkansas  Razorbacks
University of Arkansas at Pine Bluff (Arkansas–Pine Bluff, UAPB)        Golden Lions
Arkansas State University       Red Wolves
United States Military Academy (Army or Army West Point)        Black Knights
Auburn University       Tigers
Austin Peay State University (Austin Peay)      Governors
Ball State University   Cardinals
Baylor University       Bears
Bellarmine University   Knights
Belmont University      Bruins
Bethune–Cookman University      Wildcats
Binghamton University   Bearcats
Boise State University  Broncos
Boston College (BC)     Eagles
Boston University       Terriers
Bowling Green State University (Bowling Green)  Falcons
Bradley University      Braves
Brown University        Bears
Bryant University       Bulldogs
Bucknell University     Bison
University at Buffalo   Bulls
Butler University       Bulldogs
Brigham Young University (BYU)  Cougars
University of California, Berkeley (California, Cal)    Golden Bears
California Baptist University (CBU)     Lancers
California Polytechnic State University (Cal Poly)      Mustangs
California State University, Bakersfield (CSU Bakersfield or Cal State Bakersfield)     Roadrunners
California State University, Fullerton (Cal State Fullerton)    Titans
California State University, Northridge (Cal State Northridge or CSUN)  Matadors
Campbell University     Fighting Camels
Canisius University     Golden Griffins
University of Central Arkansas  Bears
Central Connecticut State University (Central Connecticut)      Blue Devils
Central Michigan University     Chippewas
College of Charleston (Charleston)      Cougars
Charleston Southern University  Buccaneers
University of North Carolina at Charlotte (Charlotte)   49ers
University of Tennessee at Chattanooga (Chattanooga)    Mocs
Chicago State University        Cougars
University of Cincinnati (UC)   Bearcats
The Citadel     Bulldogs
Clemson University      Tigers
Cleveland State University      Vikings
Coastal Carolina University     Chanticleers
Colgate University      Raiders
University of Colorado Boulder (Colorado)       Buffaloes
Colorado State University       Rams
Columbia University     Lions
Coppin State University Eagles
Cornell University      Big Red
Creighton University    Bluejays
Dartmouth College       Big Green
Davidson College        Wildcats
University of Dayton    Flyers
University of Delaware  Fightin' Blue Hens
Delaware State University       Hornets
University of Denver    Pioneers
DePaul University       Blue Demons
University of Detroit Mercy     Titans
Drake University        Bulldogs
Drexel University       Dragons
Duke University Blue Devils
Duquesne University     Dukes
East Carolina University (ECU)  Pirates
East Tennessee State University (ETSU)  Buccaneers
East Texas A&M University       Lions
Eastern Illinois University     Panthers
Eastern Kentucky University     Colonels
Eastern Michigan University     Eagles
Eastern Washington University   Eagles
Elon University Phoenix
University of Evansville        Purple Aces
Fairfield University    Stags
Fairleigh Dickinson University  Knights
Florida International University (FIU)  Panthers
University of Florida   Gators
Florida Agricultural and Mechanical University (Florida A&M, FAMU)      Rattlers
Florida Atlantic University (FAU)       Owls
Florida Gulf Coast University (FGCU)    Eagles
Florida State University (FSU)  Seminoles
Fordham University      Rams
California State University, Fresno (Fresno State)      Bulldogs
Furman University       Paladins
Gardner–Webb University Runnin' Bulldogs
George Mason University Patriots
George Washington University (GW)       Revolutionaries
Georgetown University   Hoyas
University of Georgia (UGA)     Bulldogs
Georgia Southern University     Eagles
Georgia State University        Panthers
Georgia Institute of Technology (Georgia Tech)  Yellow Jackets
Gonzaga University      Bulldogs
Grambling State University      Tigers
Grand Canyon University Antelopes
University of Wisconsin–Green Bay (Green Bay)   Phoenix
Hampton University      Pirates
Harvard University      Crimson
University of Hawaiʻi at Mānoa (Hawaii) Rainbow Warriors
High Point University   Panthers
Hofstra University      Pride
College of the Holy Cross       Crusaders
University of Houston   Cougars
Houston Christian University (HCU)      Huskies
Howard University       Bison
University of Idaho     Vandals
Idaho State University  Bengals
University of Illinois Urbana–Champaign (Illinois, U of I)      Fighting Illini
Illinois State University       Redbirds
University of the Incarnate Word (UIW)  Cardinals
Indiana University Bloomington (Indiana, IU)    Hoosiers
Indiana State University        Sycamores
Iona University Gaels
University of Iowa      Hawkeyes
Iowa State University   Cyclones
Indiana University Indianapolis (IU Indy)       Jaguars
Jackson State University        Tigers
Jacksonville University Dolphins
Jacksonville State University   Gamecocks
James Madison University (JMU)  Dukes
University of Kansas    Jayhawks
University of Missouri–Kansas City (Kansas City)        Roos
Kansas State University Wildcats
Kennesaw State University       Owls
Kent State University   Golden Flashes
University of Kentucky (UK)     Wildcats
La Salle University     Explorers
Lafayette College       Leopards
Lamar University        Cardinals
Le Moyne College        Dolphins
Lehigh University       Mountain Hawks
Liberty University      Flames
Lindenwood University   Lions
Lipscomb University     Bisons
University of Arkansas at Little Rock (Little Rock)     Trojans
Long Island University (LIU)    Sharks
California State University, Long Beach (Long Beach State)      The Beach
Longwood University     Lancers
University of Louisiana at Lafayette (Louisiana)        Ragin' Cajuns
University of Louisiana at Monroe (Louisiana–Monroe or ULM)     Warhawks
Louisiana Tech University       Bulldogs
University of Louisville        Cardinals
Loyola University Chicago (Loyola Chicago)      Ramblers
Loyola University Maryland (Loyola Maryland)    Greyhounds
Loyola Marymount University     Lions
Louisiana State University (LSU)        Tigers
University of Maine (UMaine)    Black Bears
Manhattan University    Jaspers
Marist College  Red Foxes
Marquette University    Golden Eagles
Marshall University     Thundering Herd
University of Maryland, College Park (Maryland) Terrapins
University of Maryland Eastern Shore (UMES)     Hawks
University of Massachusetts Amherst (UMass)     Minutemen
McNeese State University (McNeese)      Cowboys
University of Memphis (U of M)  Tigers
Mercer University       Bears
Mercyhurst University   Lakers
Merrimack College       Warriors
University of Miami (often Miami (FL) or UM)    Hurricanes
Miami University (Miami (OH))   RedHawks
University of Michigan  Wolverines
Michigan State University       Spartans
Middle Tennessee State University (Middle Tennessee, MTSU)      Blue Raiders
University of Wisconsin-Milwaukee (Milwaukee)   Panthers
University of Minnesota Golden Gophers
Mississippi State University    Bulldogs
Mississippi Valley State University     Delta Devils
University of Missouri (Mizzou) Tigers
Missouri State University       Bears
Monmouth University     Hawks
University of Montana   Grizzlies
Montana State University        Bobcats
Morehead State University       Eagles
Morgan State University Bears
Mount St. Mary's University     Mountaineers
Murray State University Racers
United States Naval Academy (Navy)      Midshipmen
North Carolina State University (NC State)      Wolfpack
University of Nebraska–Lincoln (Nebraska)       Cornhuskers
University of Nevada, Reno (Nevada, UNR)        Wolf Pack
University of New Hampshire     Wildcats
University of New Mexico (UNM)  Lobos
New Mexico State University     Aggies
University of New Orleans       Privateers
Niagara University      Purple Eagles
Nicholls State University (Nicholls)    Colonels
New Jersey Institute of Technology (NJIT)       Highlanders
Norfolk State University        Spartans
University of North Alabama     Lions
University of North Carolina at Chapel Hill (North Carolina, UNC)       Tar Heels
North Carolina Agricultural and Technical State University (North Carolina A&T) Aggies
North Carolina Central University (NCCU)        Eagles
University of North Dakota      Fighting Hawks
North Dakota State University (NDSU)    Bison
University of North Florida     Ospreys
University of North Texas (UNT) Mean Green
Northeastern University Huskies
Northern Arizona University     Lumberjacks
University of Northern Colorado Bears
Northern Illinois University (NIU)      Huskies
University of Northern Iowa (UNI)       Panthers
Northern Kentucky University (NKU)      Norse
Northwestern University Wildcats
Northwestern State University   Demons
University of Notre Dame        Fighting Irish
Oakland University      Golden Grizzlies
Ohio University Bobcats
Ohio State University   Buckeyes
University of Oklahoma  Sooners
Oklahoma State University–Stillwater (Oklahoma State)   Cowboys
Old Dominion University Monarchs
University of Mississippi (Ole Miss)    Rebels
University of Nebraska Omaha (Omaha)    Mavericks
Oral Roberts University Golden Eagles
University of Oregon    Ducks
Oregon State University Beavers
University of the Pacific       Tigers
University of Pennsylvania (Penn)       Quakers
Pennsylvania State University (Penn State)      Nittany Lions
Pepperdine University   Waves
University of Pittsburgh (Pitt) Panthers
University of Portland  Pilots
Portland State University       Vikings
Prairie View A&M University     Panthers
Presbyterian College    Blue Hose
Princeton University    Tigers
Providence College      Friars
Purdue University Fort Wayne (Purdue Fort Wayne)        Mastodons
Purdue University       Boilermakers
Queens University of Charlotte  Royals
Quinnipiac University   Bobcats
Radford University      Highlanders
University of Rhode Island      Rams
Rice University Owls
University of Richmond  Spiders
Rider University        Broncs
Robert Morris University        Colonials
Rutgers University–New Brunswick (Rutgers)      Scarlet Knights
California State University, Sacramento (Sacramento State)      Hornets
Sacred Heart University Pioneers
Saint Bonaventure University    Bonnies
Saint Francis University        Red Flash
Saint Joseph's University (Saint Joseph's or St. Joe's) Hawks
Saint Louis University (SLU)    Billikens
Saint Mary's College of California (Saint Mary's)       Gaels
Saint Peter's University        Peacocks
Sam Houston State University (Sam Houston)      Bearkats
Samford University      Bulldogs
University of San Diego Toreros
San Diego State University (SDSU)       Aztecs
University of San Francisco (USF)       Dons
San Jose State University       Spartans
Santa Clara University  Broncos
Seattle University      Redhawks
Seton Hall University   Pirates
Siena College   Saints
University of South Alabama (South Alabama)     Jaguars
University of South Carolina (South Carolina)   Gamecocks
South Carolina State University Bulldogs
University of South Carolina Upstate (USC Upstate)      Spartans
University of South Dakota (USD)        Coyotes
South Dakota State University (SDSU)    Jackrabbits
University of South Florida (USF or South Florida)      Bulls
Southeast Missouri State University (Southeast Missouri, SEMO)  Redhawks
University of Southeastern Louisiana (Southeastern Louisiana)   Lions
Southern Illinois University Carbondale (Southern Illinois, SIU)        Salukis
Southern Illinois University Edwardsville (SIU Edwardsville)    Cougars
University of Southern Indiana  Screaming Eagles
Southern Methodist University (SMU)     Mustangs
University of Southern Mississippi (Southern Miss)      Golden Eagles
Southern University     Jaguars
Southern Utah University        Thunderbirds
St. Francis College, Brooklyn (St. Francis Brooklyn)    Terriers
St. John's University   Red Storm
St. Thomas University   Tommies
Stanford University     Cardinals
Stephen F. Austin State University (SFA)        Lumberjacks
Stetson University      Hatters
Stonehill College       Skyhawks
Stony Brook University  Seawolves
Syracuse University     Orange
Tarleton State University       Texans
Temple University       Owls
University of Tennessee (Tennessee)     Volunteers
Tennessee State University (TSU)        Tigers
Tennessee Technological University (Tennessee Tech)     Golden Eagles
University of Texas at Arlington (UT Arlington) Mavericks
University of Texas at Austin (Texas)   Longhorns
University of Texas at El Paso (UTEP)   Miners
University of Texas at San Antonio (UTSA)       Roadrunners
Texas A&M University (Texas A&M)        Aggies
Texas A&M University–Commerce (Texas A&M–Commerce)      Lions
Texas A&M University–Corpus Christi (Texas A&M–Corpus Christi)  Islanders
Texas Christian University (TCU)        Horned Frogs
Texas Southern University       Tigers
Texas State University  Bobcats
Texas Tech University   Red Raiders
University of Toledo    Rockets
Towson University       Tigers
Troy University Trojans
Tulane University       Green Wave
University of Tulsa     Golden Hurricane
United States Air Force Academy (Air Force)     Falcons
United States Military Academy (Army)   Black Knights
United States Naval Academy (Navy)      Midshipmen
University of California, Davis (UC Davis)      Aggies
University of California, Irvine (UC Irvine)    Anteaters
University of California, Los Angeles (UCLA)    Bruins
University of California, Riverside (UC Riverside)      Highlanders
University of California, San Diego (UC San Diego)      Tritons
University of California, Santa Barbara (UC Santa Barbara)      Gauchos
University of Central Florida (UCF)     Knights
University of Connecticut (UConn)       Huskies
University of Dayton    Flyers
University of Delaware  Fightin' Blue Hens
University of Denver    Pioneers
University of Detroit Mercy     Titans
University of Evansville        Purple Aces
University of Florida   Gators
University of Georgia (UGA)     Bulldogs
University of Hartford  Hawks
University of Hawaii at Manoa (Hawaii)  Rainbow Warriors
University of Houston   Cougars
University of Idaho     Vandals
University of Illinois Chicago (UIC)    Flames
University of Iowa      Hawkeyes
University of Kansas    Jayhawks
University of Kentucky  Wildcats
University of Louisville        Cardinals
University of Maine     Black Bears
University of Maryland, Baltimore County (UMBC) Retrievers
University of Maryland, College Park (Maryland) Terrapins
University of Massachusetts Amherst (UMass)     Minutemen
University of Massachusetts Lowell (UMass Lowell)       River Hawks
University of Memphis   Tigers
University of Miami     Hurricanes
University of Michigan  Wolverines
University of Minnesota Golden Gophers
University of Mississippi (Ole Miss)    Rebels
University of Missouri  Tigers
University of Missouri–Kansas City (Kansas City)        Roos
University of Montana   Grizzlies
University of Nebraska  Cornhuskers
University of Nebraska Omaha (Omaha)    Mavericks
University of Nevada, Las Vegas (UNLV)  Rebels
University of Nevada, Reno (Nevada)     Wolf Pack
University of New Hampshire (UNH)       Wildcats
University of New Mexico        Lobos
University of New Orleans       Privateers
University of North Carolina at Asheville (UNC Asheville)       Bulldogs
University of North Carolina at Chapel Hill (North Carolina)    Tar Heels
University of North Carolina at Charlotte (Charlotte)   49ers
University of North Carolina at Greensboro (UNC Greensboro)     Spartans
University of North Carolina Wilmington (UNC Wilmington)        Seahawks
University of North Dakota      Fighting Hawks
University of North Florida     Ospreys
University of North Texas       Mean Green
University of Northern Colorado Bears
University of Northern Iowa     Panthers
University of Notre Dame        Fighting Irish
University of Oklahoma  Sooners
University of Oregon    Ducks
University of Pennsylvania (Penn)       Quakers
University of Pittsburgh        Panthers
University of Portland  Pilots
University of Rhode Island (URI)        Rams
University of Richmond  Spiders
University of San Diego Toreros
University of San Francisco     Dons
University of South Alabama     Jaguars
University of South Carolina    Gamecocks
University of South Carolina Upstate (USC Upstate)      Spartans
University of South Dakota      Coyotes
University of South Florida (South Florida)     Bulls
University of Southern California (USC) Trojans
University of Southern Indiana (USI)    Screaming Eagles
University of Southern Mississippi (Southern Miss)      Golden Eagles
University of St. Thomas (Minnesota)    Tommies
University of Tampa     Spartans
University of Tennessee Volunteers
University of Tennessee at Martin (UT Martin)   Skyhawks
University of Texas at Arlington (UT Arlington, UTA)    Mavericks
University of Texas at Austin (Texas)   Longhorns
University of Texas at El Paso (UTEP)   Miners
University of Texas at San Antonio (UTSA)       Roadrunners
University of Texas Rio Grande Valley (UTRGV)   Vaqueros
University of the Incarnate Word (UIW)  Cardinals
University of the Pacific       Tigers
University of Toledo    Rockets
University of Tulsa     Golden Hurricane
University of Utah      Utes
University of Vermont   Catamounts
University of Virginia  Cavaliers
University of Washington        Huskies
University of Wisconsin–Green Bay (Green Bay)   Phoenix
University of Wisconsin–Madison (Wisconsin)     Badgers
University of Wisconsin–Milwaukee (Milwaukee)   Panthers
University of Wyoming   Cowboys
Utah State University   Aggies
Utah Tech University    Trailblazers
Utah Valley University  Wolverines
Valparaiso University   Beacons
Vanderbilt University   Commodores
Virginia Commonwealth University (VCU)  Rams
Virginia Military Institute (VMI)       Keydets
Virginia Polytechnic Institute and State University (Virginia Tech)     Hokies
Wagner College  Seahawks
Wake Forest University  Demon Deacons
Washington State University     Cougars
Wayne State University  Warriors
Weber State University  Wildcats
West Virginia University        Mountaineers
Western Carolina University     Catamounts
Western Illinois University     Leathernecks
Western Kentucky University (WKU)       Hilltoppers
Western Michigan University     Broncos
Wichita State University        Shockers
William & Mary  Tribe
Winthrop University     Eagles
University of Wisconsin–Madison (Wisconsin)     Badgers
Wofford College Terriers
Wright State University Raiders
Xavier University       Musketeers
Yale University Bulldogs
Youngstown State University     Penguins`;

// Function to parse the school input text and extract school names and nicknames
function parseSchoolData(input: string) {
  const lines = input.split('\n');
  // Skip the header line (School Nickname)
  const teams: { name: string, nickname: string }[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by tab character or multiple spaces
    const parts = line.split(/\t|\s{2,}/);
    
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const nickname = parts[1].trim();
      teams.push({ name, nickname });
    }
  }
  
  return teams;
}

// Convert the parsed teams to the format needed for storage
function formatTeamsForStorage(teams: { name: string, nickname: string }[]) {
  // Remove duplicates by using a Map with the school name as the key
  const uniqueTeams = new Map<string, { name: string, nickname: string }>();
  
  for (const team of teams) {
    // Extract the main school name from longer names with parentheses
    const simpleName = team.name.split('(')[0].trim();
    uniqueTeams.set(simpleName, team);
  }
  
  // Convert to array format needed for storage
  return Array.from(uniqueTeams.values()).map(team => ({
    name: team.name.split('(')[0].trim(), // Use simplified name
    nickname: team.nickname,
    logoUrl: `https://example.com/${encodeURIComponent(team.name.split('(')[0].trim())}.png`, // Placeholder logo URL
  }));
}

async function addAllTeams() {
  console.log("Starting to add all NCAA teams...");
  
  const parsedTeams = parseSchoolData(schoolInput);
  const teamsForStorage = formatTeamsForStorage(parsedTeams);
  
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const team of teamsForStorage) {
    try {
      // Check if team already exists
      const existingTeam = await storage.getTeamByName(team.name);
      
      if (!existingTeam) {
        const createdTeam = await storage.createTeam({
          name: team.name,
          logoUrl: team.logoUrl,
        });
        addedCount++;
        console.log(`Added team: ${team.name} (${team.nickname}) with ID: ${createdTeam.id}`);
      } else {
        skippedCount++;
        console.log(`Skipped existing team: ${team.name}`);
      }
    } catch (error) {
      console.error(`Error adding team ${team.name}:`, error);
    }
  }
  
  // Verify teams were added
  try {
    const allTeams = await storage.getTeams();
    console.log(`Verification: Storage contains ${allTeams.length} teams`);
    
    if (allTeams.length === 0) {
      console.log("WARNING: No teams found in storage after adding!");
    } else {
      console.log(`First few teams in storage: ${allTeams.slice(0, 5).map(t => t.name).join(', ')}`);
    }
  } catch (error) {
    console.error("Error verifying teams:", error);
  }
  
  console.log(`Finished! Added ${addedCount} teams, skipped ${skippedCount} teams.`);
}

// Run the function
addAllTeams().then(() => {
  console.log("NCAA team addition script completed");
}).catch((error) => {
  console.error("Error in team addition script:", error);
});
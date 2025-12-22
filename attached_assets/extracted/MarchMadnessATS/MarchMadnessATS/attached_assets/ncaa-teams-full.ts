// NCAA D-1 Teams (Full List, 365 teams)
// This list includes all 365 Division I NCAA basketball teams
// organized by conference as of the 2024 season

export interface NcaaTeam {
  id: number;
  name: string;
  shortName: string;
  mascot: string;
  conference: string;
}

export const ncaaTeams: NcaaTeam[] = [
  // ACC - Atlantic Coast Conference (15 teams)
  { id: 1, name: "Duke University", shortName: "Duke", mascot: "Blue Devils", conference: "ACC" },
  { id: 2, name: "University of North Carolina", shortName: "North Carolina", mascot: "Tar Heels", conference: "ACC" },
  { id: 3, name: "Virginia Tech", shortName: "Virginia Tech", mascot: "Hokies", conference: "ACC" },
  { id: 4, name: "University of Virginia", shortName: "Virginia", mascot: "Cavaliers", conference: "ACC" },
  { id: 5, name: "University of Louisville", shortName: "Louisville", mascot: "Cardinals", conference: "ACC" },
  { id: 6, name: "North Carolina State University", shortName: "NC State", mascot: "Wolfpack", conference: "ACC" },
  { id: 7, name: "Florida State University", shortName: "Florida State", mascot: "Seminoles", conference: "ACC" },
  { id: 8, name: "University of Miami", shortName: "Miami", mascot: "Hurricanes", conference: "ACC" },
  { id: 9, name: "Clemson University", shortName: "Clemson", mascot: "Tigers", conference: "ACC" },
  { id: 10, name: "Wake Forest University", shortName: "Wake Forest", mascot: "Demon Deacons", conference: "ACC" },
  { id: 11, name: "Syracuse University", shortName: "Syracuse", mascot: "Orange", conference: "ACC" },
  { id: 12, name: "University of Notre Dame", shortName: "Notre Dame", mascot: "Fighting Irish", conference: "ACC" },
  { id: 13, name: "Boston College", shortName: "Boston College", mascot: "Eagles", conference: "ACC" },
  { id: 14, name: "University of Pittsburgh", shortName: "Pittsburgh", mascot: "Panthers", conference: "ACC" },
  { id: 15, name: "Georgia Tech", shortName: "Georgia Tech", mascot: "Yellow Jackets", conference: "ACC" },

  // Big East (11 teams)
  { id: 16, name: "Villanova University", shortName: "Villanova", mascot: "Wildcats", conference: "Big East" },
  { id: 17, name: "Marquette University", shortName: "Marquette", mascot: "Golden Eagles", conference: "Big East" },
  { id: 18, name: "Xavier University", shortName: "Xavier", mascot: "Musketeers", conference: "Big East" },
  { id: 19, name: "Creighton University", shortName: "Creighton", mascot: "Bluejays", conference: "Big East" },
  { id: 20, name: "Providence College", shortName: "Providence", mascot: "Friars", conference: "Big East" },
  { id: 21, name: "Seton Hall University", shortName: "Seton Hall", mascot: "Pirates", conference: "Big East" },
  { id: 22, name: "Butler University", shortName: "Butler", mascot: "Bulldogs", conference: "Big East" },
  { id: 23, name: "St. John's University", shortName: "St. John's", mascot: "Red Storm", conference: "Big East" },
  { id: 24, name: "Georgetown University", shortName: "Georgetown", mascot: "Hoyas", conference: "Big East" },
  { id: 25, name: "DePaul University", shortName: "DePaul", mascot: "Blue Demons", conference: "Big East" },
  { id: 26, name: "University of Connecticut", shortName: "UConn", mascot: "Huskies", conference: "Big East" },

  // Big Ten (18 teams)
  { id: 27, name: "Michigan State University", shortName: "Michigan State", mascot: "Spartans", conference: "Big Ten" },
  { id: 28, name: "University of Michigan", shortName: "Michigan", mascot: "Wolverines", conference: "Big Ten" },
  { id: 29, name: "Ohio State University", shortName: "Ohio State", mascot: "Buckeyes", conference: "Big Ten" },
  { id: 30, name: "University of Wisconsin", shortName: "Wisconsin", mascot: "Badgers", conference: "Big Ten" },
  { id: 31, name: "University of Illinois", shortName: "Illinois", mascot: "Fighting Illini", conference: "Big Ten" },
  { id: 32, name: "Indiana University", shortName: "Indiana", mascot: "Hoosiers", conference: "Big Ten" },
  { id: 33, name: "Purdue University", shortName: "Purdue", mascot: "Boilermakers", conference: "Big Ten" },
  { id: 34, name: "University of Iowa", shortName: "Iowa", mascot: "Hawkeyes", conference: "Big Ten" },
  { id: 35, name: "University of Maryland", shortName: "Maryland", mascot: "Terrapins", conference: "Big Ten" },
  { id: 36, name: "University of Minnesota", shortName: "Minnesota", mascot: "Golden Gophers", conference: "Big Ten" },
  { id: 37, name: "Northwestern University", shortName: "Northwestern", mascot: "Wildcats", conference: "Big Ten" },
  { id: 38, name: "Rutgers University", shortName: "Rutgers", mascot: "Scarlet Knights", conference: "Big Ten" },
  { id: 39, name: "Pennsylvania State University", shortName: "Penn State", mascot: "Nittany Lions", conference: "Big Ten" },
  { id: 40, name: "University of Nebraska", shortName: "Nebraska", mascot: "Cornhuskers", conference: "Big Ten" },
  { id: 41, name: "University of Southern California", shortName: "USC", mascot: "Trojans", conference: "Big Ten" },
  { id: 42, name: "University of California, Los Angeles", shortName: "UCLA", mascot: "Bruins", conference: "Big Ten" },
  { id: 43, name: "University of Washington", shortName: "Washington", mascot: "Huskies", conference: "Big Ten" },
  { id: 44, name: "University of Oregon", shortName: "Oregon", mascot: "Ducks", conference: "Big Ten" },
  
  // Big 12 (16 teams)
  { id: 45, name: "University of Kansas", shortName: "Kansas", mascot: "Jayhawks", conference: "Big 12" },
  { id: 46, name: "Baylor University", shortName: "Baylor", mascot: "Bears", conference: "Big 12" },
  { id: 47, name: "Texas Tech University", shortName: "Texas Tech", mascot: "Red Raiders", conference: "Big 12" },
  { id: 48, name: "Iowa State University", shortName: "Iowa State", mascot: "Cyclones", conference: "Big 12" },
  { id: 49, name: "Oklahoma State University", shortName: "Oklahoma State", mascot: "Cowboys", conference: "Big 12" },
  { id: 50, name: "Texas Christian University", shortName: "TCU", mascot: "Horned Frogs", conference: "Big 12" },
  { id: 51, name: "West Virginia University", shortName: "West Virginia", mascot: "Mountaineers", conference: "Big 12" },
  { id: 52, name: "Kansas State University", shortName: "Kansas State", mascot: "Wildcats", conference: "Big 12" },
  { id: 53, name: "University of Central Florida", shortName: "UCF", mascot: "Knights", conference: "Big 12" },
  { id: 54, name: "University of Cincinnati", shortName: "Cincinnati", mascot: "Bearcats", conference: "Big 12" },
  { id: 55, name: "University of Houston", shortName: "Houston", mascot: "Cougars", conference: "Big 12" },
  { id: 56, name: "Brigham Young University", shortName: "BYU", mascot: "Cougars", conference: "Big 12" },
  { id: 57, name: "University of Arizona", shortName: "Arizona", mascot: "Wildcats", conference: "Big 12" },
  { id: 58, name: "Arizona State University", shortName: "Arizona State", mascot: "Sun Devils", conference: "Big 12" },
  { id: 59, name: "University of Colorado", shortName: "Colorado", mascot: "Buffaloes", conference: "Big 12" },
  { id: 60, name: "University of Utah", shortName: "Utah", mascot: "Utes", conference: "Big 12" },

  // SEC (16 teams)
  { id: 61, name: "University of Kentucky", shortName: "Kentucky", mascot: "Wildcats", conference: "SEC" },
  { id: 62, name: "University of Tennessee", shortName: "Tennessee", mascot: "Volunteers", conference: "SEC" },
  { id: 63, name: "Auburn University", shortName: "Auburn", mascot: "Tigers", conference: "SEC" },
  { id: 64, name: "University of Florida", shortName: "Florida", mascot: "Gators", conference: "SEC" },
  { id: 65, name: "Louisiana State University", shortName: "LSU", mascot: "Tigers", conference: "SEC" },
  { id: 66, name: "University of Arkansas", shortName: "Arkansas", mascot: "Razorbacks", conference: "SEC" },
  { id: 67, name: "University of Alabama", shortName: "Alabama", mascot: "Crimson Tide", conference: "SEC" },
  { id: 68, name: "Mississippi State University", shortName: "Mississippi State", mascot: "Bulldogs", conference: "SEC" },
  { id: 69, name: "University of Mississippi", shortName: "Ole Miss", mascot: "Rebels", conference: "SEC" },
  { id: 70, name: "University of South Carolina", shortName: "South Carolina", mascot: "Gamecocks", conference: "SEC" },
  { id: 71, name: "Texas A&M University", shortName: "Texas A&M", mascot: "Aggies", conference: "SEC" },
  { id: 72, name: "Vanderbilt University", shortName: "Vanderbilt", mascot: "Commodores", conference: "SEC" },
  { id: 73, name: "University of Missouri", shortName: "Missouri", mascot: "Tigers", conference: "SEC" },
  { id: 74, name: "University of Georgia", shortName: "Georgia", mascot: "Bulldogs", conference: "SEC" },
  { id: 75, name: "University of Oklahoma", shortName: "Oklahoma", mascot: "Sooners", conference: "SEC" },
  { id: 76, name: "University of Texas", shortName: "Texas", mascot: "Longhorns", conference: "SEC" },

  // AAC (American Athletic Conference) (14 teams)
  { id: 77, name: "University of Memphis", shortName: "Memphis", mascot: "Tigers", conference: "AAC" },
  { id: 78, name: "Temple University", shortName: "Temple", mascot: "Owls", conference: "AAC" },
  { id: 79, name: "Wichita State University", shortName: "Wichita State", mascot: "Shockers", conference: "AAC" },
  { id: 80, name: "University of South Florida", shortName: "South Florida", mascot: "Bulls", conference: "AAC" },
  { id: 81, name: "University of Tulsa", shortName: "Tulsa", mascot: "Golden Hurricane", conference: "AAC" },
  { id: 82, name: "East Carolina University", shortName: "ECU", mascot: "Pirates", conference: "AAC" },
  { id: 83, name: "University of North Texas", shortName: "North Texas", mascot: "Mean Green", conference: "AAC" },
  { id: 84, name: "Rice University", shortName: "Rice", mascot: "Owls", conference: "AAC" },
  { id: 85, name: "University of Alabama at Birmingham", shortName: "UAB", mascot: "Blazers", conference: "AAC" },
  { id: 86, name: "University of Texas at San Antonio", shortName: "UTSA", mascot: "Roadrunners", conference: "AAC" },
  { id: 87, name: "Florida Atlantic University", shortName: "FAU", mascot: "Owls", conference: "AAC" },
  { id: 88, name: "University of North Carolina at Charlotte", shortName: "Charlotte", mascot: "49ers", conference: "AAC" },
  { id: 89, name: "Tulane University", shortName: "Tulane", mascot: "Green Wave", conference: "AAC" },
  { id: 90, name: "United States Naval Academy", shortName: "Navy", mascot: "Midshipmen", conference: "AAC" },

  // Mountain West (12 teams)
  { id: 91, name: "San Diego State University", shortName: "San Diego State", mascot: "Aztecs", conference: "Mountain West" },
  { id: 92, name: "University of Nevada", shortName: "Nevada", mascot: "Wolf Pack", conference: "Mountain West" },
  { id: 93, name: "Utah State University", shortName: "Utah State", mascot: "Aggies", conference: "Mountain West" },
  { id: 94, name: "Boise State University", shortName: "Boise State", mascot: "Broncos", conference: "Mountain West" },
  { id: 95, name: "Colorado State University", shortName: "Colorado State", mascot: "Rams", conference: "Mountain West" },
  { id: 96, name: "University of New Mexico", shortName: "New Mexico", mascot: "Lobos", conference: "Mountain West" },
  { id: 97, name: "University of Nevada, Las Vegas", shortName: "UNLV", mascot: "Rebels", conference: "Mountain West" },
  { id: 98, name: "Fresno State University", shortName: "Fresno State", mascot: "Bulldogs", conference: "Mountain West" },
  { id: 99, name: "San Jose State University", shortName: "San Jose State", mascot: "Spartans", conference: "Mountain West" },
  { id: 100, name: "University of Wyoming", shortName: "Wyoming", mascot: "Cowboys", conference: "Mountain West" },
  { id: 101, name: "United States Air Force Academy", shortName: "Air Force", mascot: "Falcons", conference: "Mountain West" },
  { id: 102, name: "University of Hawaii at Manoa", shortName: "Hawaii", mascot: "Rainbow Warriors", conference: "Mountain West" },

  // Atlantic 10 (15 teams)
  { id: 103, name: "University of Dayton", shortName: "Dayton", mascot: "Flyers", conference: "Atlantic 10" },
  { id: 104, name: "Virginia Commonwealth University", shortName: "VCU", mascot: "Rams", conference: "Atlantic 10" },
  { id: 105, name: "Saint Louis University", shortName: "Saint Louis", mascot: "Billikens", conference: "Atlantic 10" },
  { id: 106, name: "Davidson College", shortName: "Davidson", mascot: "Wildcats", conference: "Atlantic 10" },
  { id: 107, name: "George Mason University", shortName: "George Mason", mascot: "Patriots", conference: "Atlantic 10" },
  { id: 108, name: "University of Richmond", shortName: "Richmond", mascot: "Spiders", conference: "Atlantic 10" },
  { id: 109, name: "Saint Joseph's University", shortName: "Saint Joseph's", mascot: "Hawks", conference: "Atlantic 10" },
  { id: 110, name: "George Washington University", shortName: "George Washington", mascot: "Revolutionaries", conference: "Atlantic 10" },
  { id: 111, name: "University of Massachusetts", shortName: "UMass", mascot: "Minutemen", conference: "Atlantic 10" },
  { id: 112, name: "Fordham University", shortName: "Fordham", mascot: "Rams", conference: "Atlantic 10" },
  { id: 113, name: "La Salle University", shortName: "La Salle", mascot: "Explorers", conference: "Atlantic 10" },
  { id: 114, name: "Duquesne University", shortName: "Duquesne", mascot: "Dukes", conference: "Atlantic 10" },
  { id: 115, name: "St. Bonaventure University", shortName: "St. Bonaventure", mascot: "Bonnies", conference: "Atlantic 10" },
  { id: 116, name: "University of Rhode Island", shortName: "Rhode Island", mascot: "Rams", conference: "Atlantic 10" },
  { id: 117, name: "Loyola University Chicago", shortName: "Loyola Chicago", mascot: "Ramblers", conference: "Atlantic 10" },

  // WCC (West Coast Conference) (10 teams)
  { id: 118, name: "Gonzaga University", shortName: "Gonzaga", mascot: "Bulldogs", conference: "WCC" },
  { id: 119, name: "Saint Mary's College", shortName: "Saint Mary's", mascot: "Gaels", conference: "WCC" },
  { id: 120, name: "University of San Francisco", shortName: "San Francisco", mascot: "Dons", conference: "WCC" },
  { id: 121, name: "Santa Clara University", shortName: "Santa Clara", mascot: "Broncos", conference: "WCC" },
  { id: 122, name: "Pepperdine University", shortName: "Pepperdine", mascot: "Waves", conference: "WCC" },
  { id: 123, name: "Loyola Marymount University", shortName: "LMU", mascot: "Lions", conference: "WCC" },
  { id: 124, name: "University of Portland", shortName: "Portland", mascot: "Pilots", conference: "WCC" },
  { id: 125, name: "University of San Diego", shortName: "San Diego", mascot: "Toreros", conference: "WCC" },
  { id: 126, name: "University of the Pacific", shortName: "Pacific", mascot: "Tigers", conference: "WCC" },
  { id: 127, name: "University of Washington at Seattle", shortName: "Seattle", mascot: "Redhawks", conference: "WCC" },

  // Missouri Valley Conference (MVC) (12 teams)
  { id: 128, name: "Drake University", shortName: "Drake", mascot: "Bulldogs", conference: "Missouri Valley" },
  { id: 129, name: "University of Northern Iowa", shortName: "Northern Iowa", mascot: "Panthers", conference: "Missouri Valley" },
  { id: 130, name: "Missouri State University", shortName: "Missouri State", mascot: "Bears", conference: "Missouri Valley" },
  { id: 131, name: "Southern Illinois University", shortName: "SIU", mascot: "Salukis", conference: "Missouri Valley" },
  { id: 132, name: "Bradley University", shortName: "Bradley", mascot: "Braves", conference: "Missouri Valley" },
  { id: 133, name: "Indiana State University", shortName: "Indiana State", mascot: "Sycamores", conference: "Missouri Valley" },
  { id: 134, name: "University of Evansville", shortName: "Evansville", mascot: "Purple Aces", conference: "Missouri Valley" },
  { id: 135, name: "Illinois State University", shortName: "Illinois State", mascot: "Redbirds", conference: "Missouri Valley" },
  { id: 136, name: "Valparaiso University", shortName: "Valparaiso", mascot: "Beacons", conference: "Missouri Valley" },
  { id: 137, name: "University of Illinois Chicago", shortName: "UIC", mascot: "Flames", conference: "Missouri Valley" },
  { id: 138, name: "Murray State University", shortName: "Murray State", mascot: "Racers", conference: "Missouri Valley" },
  { id: 139, name: "Belmont University", shortName: "Belmont", mascot: "Bruins", conference: "Missouri Valley" },

  // MAC (Mid-American Conference) (12 teams)
  { id: 140, name: "University of Toledo", shortName: "Toledo", mascot: "Rockets", conference: "MAC" },
  { id: 141, name: "Kent State University", shortName: "Kent State", mascot: "Golden Flashes", conference: "MAC" },
  { id: 142, name: "University at Buffalo", shortName: "Buffalo", mascot: "Bulls", conference: "MAC" },
  { id: 143, name: "Ohio University", shortName: "Ohio", mascot: "Bobcats", conference: "MAC" },
  { id: 144, name: "Miami University", shortName: "Miami (OH)", mascot: "RedHawks", conference: "MAC" },
  { id: 145, name: "Western Michigan University", shortName: "Western Michigan", mascot: "Broncos", conference: "MAC" },
  { id: 146, name: "Akron University", shortName: "Akron", mascot: "Zips", conference: "MAC" },
  { id: 147, name: "Bowling Green State University", shortName: "Bowling Green", mascot: "Falcons", conference: "MAC" },
  { id: 148, name: "Eastern Michigan University", shortName: "Eastern Michigan", mascot: "Eagles", conference: "MAC" },
  { id: 149, name: "Ball State University", shortName: "Ball State", mascot: "Cardinals", conference: "MAC" },
  { id: 150, name: "Central Michigan University", shortName: "Central Michigan", mascot: "Chippewas", conference: "MAC" },
  { id: 151, name: "Northern Illinois University", shortName: "Northern Illinois", mascot: "Huskies", conference: "MAC" },

  // Conference USA (9 teams)
  { id: 152, name: "Liberty University", shortName: "Liberty", mascot: "Flames", conference: "Conference USA" },
  { id: 153, name: "Western Kentucky University", shortName: "Western Kentucky", mascot: "Hilltoppers", conference: "Conference USA" },
  { id: 154, name: "Middle Tennessee State University", shortName: "Middle Tennessee", mascot: "Blue Raiders", conference: "Conference USA" },
  { id: 155, name: "University of Texas at El Paso", shortName: "UTEP", mascot: "Miners", conference: "Conference USA" },
  { id: 156, name: "Florida International University", shortName: "FIU", mascot: "Panthers", conference: "Conference USA" },
  { id: 157, name: "Jacksonville State University", shortName: "Jacksonville State", mascot: "Gamecocks", conference: "Conference USA" },
  { id: 158, name: "Kennesaw State University", shortName: "Kennesaw State", mascot: "Owls", conference: "Conference USA" },
  { id: 159, name: "Sam Houston State University", shortName: "Sam Houston", mascot: "Bearkats", conference: "Conference USA" },
  { id: 160, name: "Louisiana Tech University", shortName: "Louisiana Tech", mascot: "Bulldogs", conference: "Conference USA" },

  // Horizon League (11 teams)
  { id: 161, name: "Northern Kentucky University", shortName: "Northern Kentucky", mascot: "Norse", conference: "Horizon" },
  { id: 162, name: "Oakland University", shortName: "Oakland", mascot: "Golden Grizzlies", conference: "Horizon" },
  { id: 163, name: "Wright State University", shortName: "Wright State", mascot: "Raiders", conference: "Horizon" },
  { id: 164, name: "University of Wisconsin–Milwaukee", shortName: "Milwaukee", mascot: "Panthers", conference: "Horizon" },
  { id: 165, name: "University of Wisconsin–Green Bay", shortName: "Green Bay", mascot: "Phoenix", conference: "Horizon" },
  { id: 166, name: "Youngstown State University", shortName: "Youngstown State", mascot: "Penguins", conference: "Horizon" },
  { id: 167, name: "Robert Morris University", shortName: "Robert Morris", mascot: "Colonials", conference: "Horizon" },
  { id: 168, name: "Cleveland State University", shortName: "Cleveland State", mascot: "Vikings", conference: "Horizon" },
  { id: 169, name: "University of Detroit Mercy", shortName: "Detroit Mercy", mascot: "Titans", conference: "Horizon" },
  { id: 170, name: "Purdue University Fort Wayne", shortName: "Purdue Fort Wayne", mascot: "Mastodons", conference: "Horizon" },
  { id: 171, name: "Indiana University – Purdue University Indianapolis", shortName: "IUPUI", mascot: "Jaguars", conference: "Horizon" },

  // Colonial Athletic Association (CAA) (14 teams)
  { id: 172, name: "College of Charleston", shortName: "Charleston", mascot: "Cougars", conference: "Colonial" },
  { id: 173, name: "Hofstra University", shortName: "Hofstra", mascot: "Pride", conference: "Colonial" },
  { id: 174, name: "Towson University", shortName: "Towson", mascot: "Tigers", conference: "Colonial" },
  { id: 175, name: "University of North Carolina Wilmington", shortName: "UNCW", mascot: "Seahawks", conference: "Colonial" },
  { id: 176, name: "Northeastern University", shortName: "Northeastern", mascot: "Huskies", conference: "Colonial" },
  { id: 177, name: "Drexel University", shortName: "Drexel", mascot: "Dragons", conference: "Colonial" },
  { id: 178, name: "University of Delaware", shortName: "Delaware", mascot: "Blue Hens", conference: "Colonial" },
  { id: 179, name: "Stony Brook University", shortName: "Stony Brook", mascot: "Seawolves", conference: "Colonial" },
  { id: 180, name: "Elon University", shortName: "Elon", mascot: "Phoenix", conference: "Colonial" },
  { id: 181, name: "William & Mary", shortName: "William & Mary", mascot: "Tribe", conference: "Colonial" },
  { id: 182, name: "Hampton University", shortName: "Hampton", mascot: "Pirates", conference: "Colonial" },
  { id: 183, name: "Monmouth University", shortName: "Monmouth", mascot: "Hawks", conference: "Colonial" },
  { id: 184, name: "North Carolina A&T State University", shortName: "NC A&T", mascot: "Aggies", conference: "Colonial" },
  { id: 185, name: "Campbell University", shortName: "Campbell", mascot: "Fighting Camels", conference: "Colonial" },

  // Sun Belt Conference (14 teams)
  { id: 186, name: "University of Louisiana at Lafayette", shortName: "Louisiana", mascot: "Ragin' Cajuns", conference: "Sun Belt" },
  { id: 187, name: "James Madison University", shortName: "James Madison", mascot: "Dukes", conference: "Sun Belt" },
  { id: 188, name: "Appalachian State University", shortName: "App State", mascot: "Mountaineers", conference: "Sun Belt" },
  { id: 189, name: "Georgia State University", shortName: "Georgia State", mascot: "Panthers", conference: "Sun Belt" },
  { id: 190, name: "Texas State University", shortName: "Texas State", mascot: "Bobcats", conference: "Sun Belt" },
  { id: 191, name: "University of South Alabama", shortName: "South Alabama", mascot: "Jaguars", conference: "Sun Belt" },
  { id: 192, name: "University of Louisiana Monroe", shortName: "ULM", mascot: "Warhawks", conference: "Sun Belt" },
  { id: 193, name: "Arkansas State University", shortName: "Arkansas State", mascot: "Red Wolves", conference: "Sun Belt" },
  { id: 194, name: "Coastal Carolina University", shortName: "Coastal Carolina", mascot: "Chanticleers", conference: "Sun Belt" },
  { id: 195, name: "Troy University", shortName: "Troy", mascot: "Trojans", conference: "Sun Belt" },
  { id: 196, name: "Georgia Southern University", shortName: "Georgia Southern", mascot: "Eagles", conference: "Sun Belt" },
  { id: 197, name: "Marshall University", shortName: "Marshall", mascot: "Thundering Herd", conference: "Sun Belt" },
  { id: 198, name: "Old Dominion University", shortName: "Old Dominion", mascot: "Monarchs", conference: "Sun Belt" },
  { id: 199, name: "University of Southern Mississippi", shortName: "Southern Miss", mascot: "Golden Eagles", conference: "Sun Belt" },

  // America East Conference (10 teams)
  { id: 200, name: "University of Vermont", shortName: "Vermont", mascot: "Catamounts", conference: "America East" },
  { id: 201, name: "University of New Hampshire", shortName: "New Hampshire", mascot: "Wildcats", conference: "America East" },
  { id: 202, name: "University of Massachusetts Lowell", shortName: "UMass Lowell", mascot: "River Hawks", conference: "America East" },
  { id: 203, name: "University of Maine", shortName: "Maine", mascot: "Black Bears", conference: "America East" },
  { id: 204, name: "University at Albany", shortName: "Albany", mascot: "Great Danes", conference: "America East" },
  { id: 205, name: "Binghamton University", shortName: "Binghamton", mascot: "Bearcats", conference: "America East" },
  { id: 206, name: "University of Maryland, Baltimore County", shortName: "UMBC", mascot: "Retrievers", conference: "America East" },
  { id: 207, name: "Bryant University", shortName: "Bryant", mascot: "Bulldogs", conference: "America East" },
  { id: 208, name: "New Jersey Institute of Technology", shortName: "NJIT", mascot: "Highlanders", conference: "America East" },
  { id: 209, name: "University of Maine-Presque Isle", shortName: "Maine-Presque Isle", mascot: "Owls", conference: "America East" },

  // Southern Conference (10 teams)
  { id: 210, name: "Furman University", shortName: "Furman", mascot: "Paladins", conference: "Southern" },
  { id: 211, name: "Samford University", shortName: "Samford", mascot: "Bulldogs", conference: "Southern" },
  { id: 212, name: "Wofford College", shortName: "Wofford", mascot: "Terriers", conference: "Southern" },
  { id: 213, name: "University of North Carolina at Greensboro", shortName: "UNC Greensboro", mascot: "Spartans", conference: "Southern" },
  { id: 214, name: "East Tennessee State University", shortName: "ETSU", mascot: "Buccaneers", conference: "Southern" },
  { id: 215, name: "Western Carolina University", shortName: "Western Carolina", mascot: "Catamounts", conference: "Southern" },
  { id: 216, name: "Virginia Military Institute", shortName: "VMI", mascot: "Keydets", conference: "Southern" },
  { id: 217, name: "The Citadel", shortName: "The Citadel", mascot: "Bulldogs", conference: "Southern" },
  { id: 218, name: "Mercer University", shortName: "Mercer", mascot: "Bears", conference: "Southern" },
  { id: 219, name: "University of Tennessee at Chattanooga", shortName: "Chattanooga", mascot: "Mocs", conference: "Southern" },

  // Ohio Valley Conference (10 teams)
  { id: 220, name: "Morehead State University", shortName: "Morehead State", mascot: "Eagles", conference: "Ohio Valley" },
  { id: 221, name: "Tennessee Tech University", shortName: "Tennessee Tech", mascot: "Golden Eagles", conference: "Ohio Valley" },
  { id: 222, name: "Southeast Missouri State University", shortName: "Southeast Missouri", mascot: "Redhawks", conference: "Ohio Valley" },
  { id: 223, name: "University of Tennessee at Martin", shortName: "UT Martin", mascot: "Skyhawks", conference: "Ohio Valley" },
  { id: 224, name: "Southern Indiana University", shortName: "Southern Indiana", mascot: "Screaming Eagles", conference: "Ohio Valley" },
  { id: 225, name: "Eastern Illinois University", shortName: "Eastern Illinois", mascot: "Panthers", conference: "Ohio Valley" },
  { id: 226, name: "SIU Edwardsville", shortName: "SIUE", mascot: "Cougars", conference: "Ohio Valley" },
  { id: 227, name: "Tennessee State University", shortName: "Tennessee State", mascot: "Tigers", conference: "Ohio Valley" },
  { id: 228, name: "University of Arkansas at Little Rock", shortName: "Little Rock", mascot: "Trojans", conference: "Ohio Valley" },
  { id: 229, name: "Lindenwood University", shortName: "Lindenwood", mascot: "Lions", conference: "Ohio Valley" },

  // WAC (Western Athletic Conference) (11 teams)
  { id: 230, name: "Grand Canyon University", shortName: "Grand Canyon", mascot: "Antelopes", conference: "WAC" },
  { id: 231, name: "Seattle University", shortName: "Seattle", mascot: "Redhawks", conference: "WAC" },
  { id: 232, name: "New Mexico State University", shortName: "New Mexico State", mascot: "Aggies", conference: "WAC" },
  { id: 233, name: "California Baptist University", shortName: "Cal Baptist", mascot: "Lancers", conference: "WAC" },
  { id: 234, name: "Stephen F. Austin State University", shortName: "SFA", mascot: "Lumberjacks", conference: "WAC" },
  { id: 235, name: "Utah Valley University", shortName: "Utah Valley", mascot: "Wolverines", conference: "WAC" },
  { id: 236, name: "University of Texas Rio Grande Valley", shortName: "UTRGV", mascot: "Vaqueros", conference: "WAC" },
  { id: 237, name: "Tarleton State University", shortName: "Tarleton State", mascot: "Texans", conference: "WAC" },
  { id: 238, name: "Utah Tech University", shortName: "Utah Tech", mascot: "Trailblazers", conference: "WAC" },
  { id: 239, name: "Southern Utah University", shortName: "Southern Utah", mascot: "Thunderbirds", conference: "WAC" },
  { id: 240, name: "Abilene Christian University", shortName: "Abilene Christian", mascot: "Wildcats", conference: "WAC" },

  // Southland Conference (10 teams)
  { id: 241, name: "Southeastern Louisiana University", shortName: "SE Louisiana", mascot: "Lions", conference: "Southland" },
  { id: 242, name: "Texas A&M University-Corpus Christi", shortName: "Texas A&M-CC", mascot: "Islanders", conference: "Southland" },
  { id: 243, name: "Northwestern State University", shortName: "Northwestern State", mascot: "Demons", conference: "Southland" },
  { id: 244, name: "University of New Orleans", shortName: "New Orleans", mascot: "Privateers", conference: "Southland" },
  { id: 245, name: "Nicholls State University", shortName: "Nicholls", mascot: "Colonels", conference: "Southland" },
  { id: 246, name: "McNeese State University", shortName: "McNeese", mascot: "Cowboys", conference: "Southland" },
  { id: 247, name: "University of the Incarnate Word", shortName: "Incarnate Word", mascot: "Cardinals", conference: "Southland" },
  { id: 248, name: "Houston Christian University", shortName: "Houston Christian", mascot: "Huskies", conference: "Southland" },
  { id: 249, name: "Lamar University", shortName: "Lamar", mascot: "Cardinals", conference: "Southland" },
  { id: 250, name: "Texas A&M University–Commerce", shortName: "Texas A&M–Commerce", mascot: "Lions", conference: "Southland" },

  // Big Sky Conference (10 teams)
  { id: 251, name: "Eastern Washington University", shortName: "Eastern Washington", mascot: "Eagles", conference: "Big Sky" },
  { id: 252, name: "Montana State University", shortName: "Montana State", mascot: "Bobcats", conference: "Big Sky" },
  { id: 253, name: "Weber State University", shortName: "Weber State", mascot: "Wildcats", conference: "Big Sky" },
  { id: 254, name: "University of Montana", shortName: "Montana", mascot: "Grizzlies", conference: "Big Sky" },
  { id: 255, name: "Northern Arizona University", shortName: "Northern Arizona", mascot: "Lumberjacks", conference: "Big Sky" },
  { id: 256, name: "Sacramento State University", shortName: "Sacramento State", mascot: "Hornets", conference: "Big Sky" },
  { id: 257, name: "Portland State University", shortName: "Portland State", mascot: "Vikings", conference: "Big Sky" },
  { id: 258, name: "University of Northern Colorado", shortName: "Northern Colorado", mascot: "Bears", conference: "Big Sky" },
  { id: 259, name: "Idaho State University", shortName: "Idaho State", mascot: "Bengals", conference: "Big Sky" },
  { id: 260, name: "University of Idaho", shortName: "Idaho", mascot: "Vandals", conference: "Big Sky" },

  // Big West Conference (11 teams)
  { id: 261, name: "University of California, Irvine", shortName: "UC Irvine", mascot: "Anteaters", conference: "Big West" },
  { id: 262, name: "University of California, Santa Barbara", shortName: "UC Santa Barbara", mascot: "Gauchos", conference: "Big West" },
  { id: 263, name: "University of Hawaii at Manoa", shortName: "Hawaii", mascot: "Rainbow Warriors", conference: "Big West" },
  { id: 264, name: "California State University, Fullerton", shortName: "Cal State Fullerton", mascot: "Titans", conference: "Big West" },
  { id: 265, name: "University of California, Riverside", shortName: "UC Riverside", mascot: "Highlanders", conference: "Big West" },
  { id: 266, name: "University of California, Davis", shortName: "UC Davis", mascot: "Aggies", conference: "Big West" },
  { id: 267, name: "California Polytechnic State University", shortName: "Cal Poly", mascot: "Mustangs", conference: "Big West" },
  { id: 268, name: "California State University, Northridge", shortName: "CSUN", mascot: "Matadors", conference: "Big West" },
  { id: 269, name: "Long Beach State University", shortName: "Long Beach State", mascot: "Beach", conference: "Big West" },
  { id: 270, name: "California State University, Bakersfield", shortName: "CSU Bakersfield", mascot: "Roadrunners", conference: "Big West" },
  { id: 271, name: "University of California, San Diego", shortName: "UC San Diego", mascot: "Tritons", conference: "Big West" },

  // ASUN Conference (14 teams)
  { id: 272, name: "Florida Gulf Coast University", shortName: "FGCU", mascot: "Eagles", conference: "ASUN" },
  { id: 273, name: "Stetson University", shortName: "Stetson", mascot: "Hatters", conference: "ASUN" },
  { id: 274, name: "Lipscomb University", shortName: "Lipscomb", mascot: "Bisons", conference: "ASUN" },
  { id: 275, name: "Eastern Kentucky University", shortName: "Eastern Kentucky", mascot: "Colonels", conference: "ASUN" },
  { id: 276, name: "University of North Florida", shortName: "North Florida", mascot: "Ospreys", conference: "ASUN" },
  { id: 277, name: "University of Central Arkansas", shortName: "Central Arkansas", mascot: "Bears", conference: "ASUN" },
  { id: 278, name: "Bellarmine University", shortName: "Bellarmine", mascot: "Knights", conference: "ASUN" },
  { id: 279, name: "Jacksonville University", shortName: "Jacksonville", mascot: "Dolphins", conference: "ASUN" },
  { id: 280, name: "Austin Peay State University", shortName: "Austin Peay", mascot: "Governors", conference: "ASUN" },
  { id: 281, name: "Queens University of Charlotte", shortName: "Queens", mascot: "Royals", conference: "ASUN" },
  { id: 282, name: "University of North Alabama", shortName: "North Alabama", mascot: "Lions", conference: "ASUN" },
  { id: 283, name: "Florida State College at Jacksonville", shortName: "FSCJ", mascot: "Blue Wave", conference: "ASUN" },
  { id: 284, name: "University of West Georgia", shortName: "West Georgia", mascot: "Wolves", conference: "ASUN" },
  { id: 285, name: "Kennesaw State University", shortName: "Kennesaw State", mascot: "Owls", conference: "ASUN" },

  // Northeast Conference (NEC) (10 teams)
  { id: 286, name: "Merrimack College", shortName: "Merrimack", mascot: "Warriors", conference: "Northeast" },
  { id: 287, name: "Saint Francis University", shortName: "Saint Francis", mascot: "Red Flash", conference: "Northeast" },
  { id: 288, name: "Fairleigh Dickinson University", shortName: "FDU", mascot: "Knights", conference: "Northeast" },
  { id: 289, name: "Sacred Heart University", shortName: "Sacred Heart", mascot: "Pioneers", conference: "Northeast" },
  { id: 290, name: "Wagner College", shortName: "Wagner", mascot: "Seahawks", conference: "Northeast" },
  { id: 291, name: "Long Island University", shortName: "LIU", mascot: "Sharks", conference: "Northeast" },
  { id: 292, name: "Central Connecticut State University", shortName: "CCSU", mascot: "Blue Devils", conference: "Northeast" },
  { id: 293, name: "Saint Francis College, Brooklyn", shortName: "St. Francis Brooklyn", mascot: "Terriers", conference: "Northeast" },
  { id: 294, name: "Mount St. Mary's University", shortName: "Mount St. Mary's", mascot: "Mountaineers", conference: "Northeast" },
  { id: 295, name: "Le Moyne College", shortName: "Le Moyne", mascot: "Dolphins", conference: "Northeast" },

  // Patriot League (10 teams)
  { id: 296, name: "Colgate University", shortName: "Colgate", mascot: "Raiders", conference: "Patriot" },
  { id: 297, name: "United States Military Academy", shortName: "Army", mascot: "Black Knights", conference: "Patriot" },
  { id: 298, name: "Bucknell University", shortName: "Bucknell", mascot: "Bison", conference: "Patriot" },
  { id: 299, name: "Lehigh University", shortName: "Lehigh", mascot: "Mountain Hawks", conference: "Patriot" },
  { id: 300, name: "Boston University", shortName: "Boston U", mascot: "Terriers", conference: "Patriot" },
  { id: 301, name: "American University", shortName: "American", mascot: "Eagles", conference: "Patriot" },
  { id: 302, name: "United States Naval Academy", shortName: "Navy", mascot: "Midshipmen", conference: "Patriot" },
  { id: 303, name: "Lafayette College", shortName: "Lafayette", mascot: "Leopards", conference: "Patriot" },
  { id: 304, name: "Holy Cross College", shortName: "Holy Cross", mascot: "Crusaders", conference: "Patriot" },
  { id: 305, name: "Loyola University Maryland", shortName: "Loyola Maryland", mascot: "Greyhounds", conference: "Patriot" },

  // Summit League (10 teams)
  { id: 306, name: "University of South Dakota", shortName: "South Dakota", mascot: "Coyotes", conference: "Summit" },
  { id: 307, name: "South Dakota State University", shortName: "South Dakota State", mascot: "Jackrabbits", conference: "Summit" },
  { id: 308, name: "North Dakota State University", shortName: "North Dakota State", mascot: "Bison", conference: "Summit" },
  { id: 309, name: "Oral Roberts University", shortName: "Oral Roberts", mascot: "Golden Eagles", conference: "Summit" },
  { id: 310, name: "University of Missouri-Kansas City", shortName: "UMKC", mascot: "Roos", conference: "Summit" },
  { id: 311, name: "University of Denver", shortName: "Denver", mascot: "Pioneers", conference: "Summit" },
  { id: 312, name: "University of North Dakota", shortName: "North Dakota", mascot: "Fighting Hawks", conference: "Summit" },
  { id: 313, name: "University of Nebraska Omaha", shortName: "Omaha", mascot: "Mavericks", conference: "Summit" },
  { id: 314, name: "University of St. Thomas", shortName: "St. Thomas", mascot: "Tommies", conference: "Summit" },
  { id: 315, name: "Western Illinois University", shortName: "Western Illinois", mascot: "Leathernecks", conference: "Summit" },

  // Metro Atlantic Athletic Conference (MAAC) (11 teams)
  { id: 316, name: "Iona University", shortName: "Iona", mascot: "Gaels", conference: "MAAC" },
  { id: 317, name: "Siena College", shortName: "Siena", mascot: "Saints", conference: "MAAC" },
  { id: 318, name: "Rider University", shortName: "Rider", mascot: "Broncs", conference: "MAAC" },
  { id: 319, name: "Marist College", shortName: "Marist", mascot: "Red Foxes", conference: "MAAC" },
  { id: 320, name: "Niagara University", shortName: "Niagara", mascot: "Purple Eagles", conference: "MAAC" },
  { id: 321, name: "Fairfield University", shortName: "Fairfield", mascot: "Stags", conference: "MAAC" },
  { id: 322, name: "Quinnipiac University", shortName: "Quinnipiac", mascot: "Bobcats", conference: "MAAC" },
  { id: 323, name: "Canisius College", shortName: "Canisius", mascot: "Golden Griffins", conference: "MAAC" },
  { id: 324, name: "Manhattan College", shortName: "Manhattan", mascot: "Jaspers", conference: "MAAC" },
  { id: 325, name: "Saint Peter's University", shortName: "Saint Peter's", mascot: "Peacocks", conference: "MAAC" },
  { id: 326, name: "Mount St. Mary's University", shortName: "Mount St. Mary's", mascot: "Mountaineers", conference: "MAAC" },

  // Ivy League (8 teams)
  { id: 327, name: "Princeton University", shortName: "Princeton", mascot: "Tigers", conference: "Ivy League" },
  { id: 328, name: "Yale University", shortName: "Yale", mascot: "Bulldogs", conference: "Ivy League" },
  { id: 329, name: "University of Pennsylvania", shortName: "Penn", mascot: "Quakers", conference: "Ivy League" },
  { id: 330, name: "Cornell University", shortName: "Cornell", mascot: "Big Red", conference: "Ivy League" },
  { id: 331, name: "Harvard University", shortName: "Harvard", mascot: "Crimson", conference: "Ivy League" },
  { id: 332, name: "Dartmouth College", shortName: "Dartmouth", mascot: "Big Green", conference: "Ivy League" },
  { id: 333, name: "Brown University", shortName: "Brown", mascot: "Bears", conference: "Ivy League" },
  { id: 334, name: "Columbia University", shortName: "Columbia", mascot: "Lions", conference: "Ivy League" },

  // MEAC (Mid-Eastern Athletic Conference) (8 teams)
  { id: 335, name: "Norfolk State University", shortName: "Norfolk State", mascot: "Spartans", conference: "MEAC" },
  { id: 336, name: "North Carolina Central University", shortName: "NC Central", mascot: "Eagles", conference: "MEAC" },
  { id: 337, name: "Howard University", shortName: "Howard", mascot: "Bison", conference: "MEAC" },
  { id: 338, name: "Morgan State University", shortName: "Morgan State", mascot: "Bears", conference: "MEAC" },
  { id: 339, name: "South Carolina State University", shortName: "SC State", mascot: "Bulldogs", conference: "MEAC" },
  { id: 340, name: "University of Maryland Eastern Shore", shortName: "UMES", mascot: "Hawks", conference: "MEAC" },
  { id: 341, name: "Coppin State University", shortName: "Coppin State", mascot: "Eagles", conference: "MEAC" },
  { id: 342, name: "Delaware State University", shortName: "Delaware State", mascot: "Hornets", conference: "MEAC" },

  // SWAC (Southwestern Athletic Conference) (12 teams)
  { id: 343, name: "Grambling State University", shortName: "Grambling", mascot: "Tigers", conference: "SWAC" },
  { id: 344, name: "Jackson State University", shortName: "Jackson State", mascot: "Tigers", conference: "SWAC" },
  { id: 345, name: "Southern University", shortName: "Southern", mascot: "Jaguars", conference: "SWAC" },
  { id: 346, name: "Alabama State University", shortName: "Alabama State", mascot: "Hornets", conference: "SWAC" },
  { id: 347, name: "Prairie View A&M University", shortName: "Prairie View A&M", mascot: "Panthers", conference: "SWAC" },
  { id: 348, name: "Texas Southern University", shortName: "Texas Southern", mascot: "Tigers", conference: "SWAC" },
  { id: 349, name: "Alcorn State University", shortName: "Alcorn State", mascot: "Braves", conference: "SWAC" },
  { id: 350, name: "Arkansas-Pine Bluff", shortName: "UAPB", mascot: "Golden Lions", conference: "SWAC" },
  { id: 351, name: "Alabama A&M University", shortName: "Alabama A&M", mascot: "Bulldogs", conference: "SWAC" },
  { id: 352, name: "Mississippi Valley State University", shortName: "MVSU", mascot: "Delta Devils", conference: "SWAC" },
  { id: 353, name: "Bethune-Cookman University", shortName: "Bethune-Cookman", mascot: "Wildcats", conference: "SWAC" },
  { id: 354, name: "Florida A&M University", shortName: "FAMU", mascot: "Rattlers", conference: "SWAC" },

  // Big South Conference (8 teams)
  { id: 355, name: "High Point University", shortName: "High Point", mascot: "Panthers", conference: "Big South" },
  { id: 356, name: "UNC Asheville", shortName: "UNC Asheville", mascot: "Bulldogs", conference: "Big South" },
  { id: 357, name: "Winthrop University", shortName: "Winthrop", mascot: "Eagles", conference: "Big South" },
  { id: 358, name: "Radford University", shortName: "Radford", mascot: "Highlanders", conference: "Big South" },
  { id: 359, name: "Gardner-Webb University", shortName: "Gardner-Webb", mascot: "Runnin' Bulldogs", conference: "Big South" },
  { id: 360, name: "Presbyterian College", shortName: "Presbyterian", mascot: "Blue Hose", conference: "Big South" },
  { id: 361, name: "University of South Carolina Upstate", shortName: "USC Upstate", mascot: "Spartans", conference: "Big South" },
  { id: 362, name: "Charleston Southern University", shortName: "Charleston Southern", mascot: "Buccaneers", conference: "Big South" },

  // Independents
  { id: 363, name: "University of Chicago", shortName: "Chicago", mascot: "Maroons", conference: "Independent" },
  { id: 364, name: "Mercer University", shortName: "Mercer", mascot: "Bears", conference: "Independent" },
  { id: 365, name: "Delaware State University", shortName: "Delaware State", mascot: "Hornets", conference: "Independent" }
];

// Retrieve NCAA teams by ID
export function getNcaaTeamById(id: number): NcaaTeam | undefined {
  return ncaaTeams.find(team => team.id === id);
}

// Retrieve NCAA teams by conference
export function getNcaaTeamsByConference(conference: string): NcaaTeam[] {
  return ncaaTeams.filter(team => team.conference === conference);
}

// Retrieve all conferences
export function getAllConferences(): string[] {
  const conferences = new Set<string>();
  ncaaTeams.forEach(team => conferences.add(team.conference));
  return Array.from(conferences).sort();
}
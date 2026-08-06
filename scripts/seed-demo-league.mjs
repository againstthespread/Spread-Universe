// Seeds a playable demo gambling league:
// - 7 demo users (demou1..demou7) + the real user pdeluc99 (pdeluca789@gmail.com)
// - Weeks 1-3 fully played (games, picks for everyone incl. pdeluc99, results, finalized)
// - Week 4 (current) has 3 upcoming games; demo users have picked, pdeluc99 has NOT —
//   so the real user can log in and make picks themselves.
// Run: node scripts/seed-demo-league.mjs
import { execSync } from "node:child_process";

const BASE = "http://localhost:5000";
const REAL_USER_ID = process.env.REAL_USER_ID || "1fad9e0b-b244-468b-ba21-c655e37e3d8c"; // pdeluc99
const demos = Array.from({ length: 7 }, (_, i) => `demou${i + 1}`);
const cookies = {};

async function api(user, method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookies[user] ? { Cookie: cookies[user] } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const sc = res.headers.get("set-cookie");
  if (sc) cookies[user] = sc.split(";")[0];
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
function assert(cond, msg) { if (!cond) { console.error("FAIL:", msg); process.exit(1); } }
function sql(q) { return execSync(`psql "$DATABASE_URL" -q -t -c "${q.replace(/"/g, '\\"')}"`).toString().trim(); }

for (const u of demos) {
  let r = await api(u, "POST", "/api/auth/register", { username: u, email: `${u}@test.com`, password: "Passw0rd!23", confirmPassword: "Passw0rd!23" });
  if (r.status !== 200 && r.status !== 201) r = await api(u, "POST", "/api/auth/login", { email: `${u}@test.com`, password: "Passw0rd!23" });
  assert(r.status === 200 || r.status === 201, `auth ${u}: ${r.status}`);
}
sql(`UPDATE users SET is_admin=true WHERE username='demou1'`);
await api("demou1", "POST", "/api/auth/login", { email: "demou1@test.com", password: "Passw0rd!23" });

const cr = await api("demou1", "POST", "/api/gambling-league/leagues", { name: "Demo League", capacity: "8" });
assert(cr.status === 200 || cr.status === 201, `create: ${cr.status} ${JSON.stringify(cr.data)}`);
const leagueId = cr.data.id, joinCode = cr.data.joinCode;
console.log(`League "Demo League" created — id ${leagueId}, join code ${joinCode}`);

for (const u of demos.slice(1)) {
  const r = await api(u, "POST", "/api/gambling-league/leagues/join", { joinCode });
  assert(r.status === 200, `join ${u}: ${r.status} ${JSON.stringify(r.data)}`);
}
// Add the real user directly (we can't log in as them)
sql(`INSERT INTO gambling_league_members (league_id, user_id) SELECT '${leagueId}', '${REAL_USER_ID}' WHERE NOT EXISTS (SELECT 1 FROM gambling_league_members WHERE league_id='${leagueId}' AND user_id='${REAL_USER_ID}')`);

const st = await api("demou1", "POST", `/api/gambling-league/leagues/${leagueId}/start`);
assert(st.status === 200, `start: ${st.status} ${JSON.stringify(st.data)}`);
console.log("Season started (8 members)");

const teams = [
  ["Chiefs", "Bills"], ["Eagles", "Cowboys"], ["49ers", "Lions"],
  ["Ravens", "Bengals"], ["Packers", "Vikings"], ["Dolphins", "Jets"],
  ["Rams", "Seahawks"], ["Texans", "Colts"], ["Steelers", "Browns"],
  ["Chargers", "Broncos"], ["Falcons", "Saints"], ["Bucs", "Panthers"],
];
const spreads = ["-3.5", "-6.5", "-2.5"];
const pastScores = [[27, 20], [31, 17], [21, 24]]; // per game slot

async function makeGames(week, future) {
  const ids = [];
  for (let g = 0; g < 3; g++) {
    const [home, away] = teams[((week - 1) * 3 + g) % teams.length];
    const r = await api("demou1", "POST", "/api/gambling-league/admin/games", {
      week, homeTeam: home, awayTeam: away, spread: spreads[g],
      gameTime: new Date(Date.now() + (future ? (2 + g) * 86400000 : 86400000)).toISOString(),
    });
    assert(r.status === 200, `game w${week}g${g}: ${r.status} ${JSON.stringify(r.data)}`);
    ids.push(r.data.id);
  }
  return ids;
}
function realUserPicks(week, gameIds) {
  for (let g = 0; g < gameIds.length; g++) {
    const team = (g + week) % 2 === 0 ? "home" : "away";
    sql(`INSERT INTO gambling_league_picks (user_id, league_id, game_id, week, picked_team) VALUES ('${REAL_USER_ID}', '${leagueId}', '${gameIds[g]}', ${week}, '${team}') ON CONFLICT DO NOTHING`);
  }
}

// Weeks 1-3: full played weeks
for (let week = 1; week <= 3; week++) {
  const gameIds = await makeGames(week, false);
  for (let i = 0; i < demos.length; i++) {
    const picks = gameIds.map((gameId, g) => ({ gameId, leagueId, week, pickedTeam: (i + g + week) % 2 === 0 ? "home" : "away" }));
    const r = await api(demos[i], "POST", "/api/gambling-league/picks", { picks });
    assert(r.status === 200, `picks ${demos[i]} w${week}: ${r.status} ${JSON.stringify(r.data)}`);
  }
  realUserPicks(week, gameIds); // before results so they get graded
  for (let g = 0; g < 3; g++) {
    const r = await api("demou1", "PATCH", `/api/gambling-league/admin/games/${gameIds[g]}/result`, { homeScore: pastScores[g][0], awayScore: pastScores[g][1] });
    assert(r.status === 200, `result w${week}g${g}: ${r.status}`);
  }
  const fin = await api("demou1", "POST", `/api/gambling-league/admin/leagues/${leagueId}/finalize-week`, { week });
  assert(fin.status === 200, `finalize w${week}: ${fin.status} ${JSON.stringify(fin.data)}`);
  console.log(`Week ${week} played & finalized`);
}

// Week 4 (current): upcoming games; demo users pick, real user left open
const w4 = await makeGames(4, true);
for (let i = 0; i < demos.length; i++) {
  const picks = w4.map((gameId, g) => ({ gameId, leagueId, week: 4, pickedTeam: (i + g) % 2 === 0 ? "home" : "away" }));
  const r = await api(demos[i], "POST", "/api/gambling-league/picks", { picks });
  assert(r.status === 200, `picks ${demos[i]} w4: ${r.status} ${JSON.stringify(r.data)}`);
}
console.log("Week 4 games created with demo-user picks; pdeluc99 has open picks to make.");
console.log("DONE");

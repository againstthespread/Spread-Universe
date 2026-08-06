// Simulates a full gambling-league season end-to-end for a given league size.
// Usage: N=<8|10|12|16|18|20> node scripts/test-gl-season.mjs
// Optional: SCHEDULE_ONLY=1 to stop after schedule assertions.
// Covers: full-league start requirement, schedule generation (config-driven
// regular-season length), weekly picks + scoring, finalize-week advancement,
// size-specific playoff brackets (per shared/playoff-config.ts), and champion
// selection. Clean up SIM% leagues/games and glsim% users afterward.
const BASE = "http://localhost:5000";
const N = parseInt(process.env.N || "8", 10);

// Mirror of shared/playoff-config.ts (scripts can't import TS directly)
const CONFIGS = {
  8:  { regularSeasonWeeks: 14, playoffTeams: 4,  byes: 0, rounds: [["semifinal", 16], ["championship", 17]] },
  10: { regularSeasonWeeks: 14, playoffTeams: 6,  byes: 2, rounds: [["quarterfinal", 15], ["semifinal", 16], ["championship", 17]] },
  12: { regularSeasonWeeks: 14, playoffTeams: 6,  byes: 2, rounds: [["quarterfinal", 15], ["semifinal", 16], ["championship", 17]] },
  16: { regularSeasonWeeks: 14, playoffTeams: 8,  byes: 0, rounds: [["quarterfinal", 15], ["semifinal", 16], ["championship", 17]] },
  18: { regularSeasonWeeks: 13, playoffTeams: 12, byes: 4, rounds: [["playin", 14], ["quarterfinal", 15], ["semifinal", 16], ["championship", 17]] },
  20: { regularSeasonWeeks: 13, playoffTeams: 12, byes: 4, rounds: [["playin", 14], ["quarterfinal", 15], ["semifinal", 16], ["championship", 17]] },
};
const config = CONFIGS[N];
if (!config) { console.error(`N must be one of ${Object.keys(CONFIGS).join(", ")}`); process.exit(1); }
function participantsInRound(idx) {
  const { playoffTeams: t, byes: b } = config;
  if (idx === 0) return t - b;
  let count = b + (t - b) / 2;
  for (let i = 1; i < idx; i++) count /= 2;
  return count;
}

const users = Array.from({ length: N }, (_, i) => `glsim${N}u${i + 1}`);
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

for (const u of users) {
  let r = await api(u, "POST", "/api/auth/register", { username: u, email: `${u}@test.com`, password: "Passw0rd!23", confirmPassword: "Passw0rd!23" });
  if (r.status !== 200 && r.status !== 201) r = await api(u, "POST", "/api/auth/login", { email: `${u}@test.com`, password: "Passw0rd!23" });
  assert(r.status === 200 || r.status === 201, `auth ${u}: ${r.status}`);
}
// Bootstrap admin privileges for users[0] (no manual DB step needed)
{
  const { execSync } = await import("node:child_process");
  execSync(`psql "$DATABASE_URL" -q -c "UPDATE users SET is_admin=true WHERE username='${users[0]}'"`);
  // re-login so the session reflects any server-side user caching
  await api(users[0], "POST", "/api/auth/login", { email: `${users[0]}@test.com`, password: "Passw0rd!23" });
}
const cr = await api(users[0], "POST", "/api/gambling-league/leagues", { name: `SIM${N} League`, capacity: String(N) });
assert(cr.status === 200 || cr.status === 201, `create: ${cr.status} ${JSON.stringify(cr.data)}`);
const leagueId = cr.data.id, joinCode = cr.data.joinCode;

// Full-league start rule: starting before the league is full must fail
{
  const early = await api(users[0], "POST", `/api/gambling-league/leagues/${leagueId}/start`);
  assert(early.status !== 200, `start should fail before league is full, got ${early.status}`);
  console.log(`N=${N}: early start correctly rejected (${JSON.stringify(early.data?.message || early.data)})`);
}

for (const u of users.slice(1)) {
  const r = await api(u, "POST", "/api/gambling-league/leagues/join", { joinCode });
  assert(r.status === 200, `join ${u}: ${r.status} ${JSON.stringify(r.data)}`);
}
// Season auto-starts when the league fills; league must now be active
{
  const lg = (await api(users[0], "GET", `/api/gambling-league/leagues/${leagueId}`)).data;
  assert(lg.status === "active", `league should auto-start when full, got status=${lg.status}`);
}

const RS = config.regularSeasonWeeks;
const expectedRegular = Math.ceil(N / 2);
const wk1 = (await api(users[0], "GET", `/api/gambling-league/leagues/${leagueId}/matchups?week=1`)).data;
assert(wk1.length === expectedRegular, `week1 matchups: ${wk1.length} != ${expectedRegular}`);

// Schedule assertions across all regular-season weeks:
// - every member plays every week
// - regular season is exactly RS weeks (no regular matchups beyond)
// - N <= RS: full round robin; N > RS: no pairing repeats
{
  const pairCounts = new Map();
  for (let w = 1; w <= RS; w++) {
    const ms = (await api(users[0], "GET", `/api/gambling-league/leagues/${leagueId}/matchups?week=${w}`)).data;
    const seen = new Set();
    for (const m of ms) {
      seen.add(m.user1Id);
      if (m.user2Id) {
        seen.add(m.user2Id);
        const key = [m.user1Id, m.user2Id].sort().join("|");
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
    assert(seen.size === N, `week ${w}: ${seen.size}/${N} members scheduled`);
  }
  const beyond = (await api(users[0], "GET", `/api/gambling-league/leagues/${leagueId}/matchups?week=${RS + 1}`)).data;
  assert(beyond.length === 0, `no matchups should exist in week ${RS + 1} at season start, got ${beyond.length}`);
  const memberIds = new Set();
  for (const key of pairCounts.keys()) key.split("|").forEach(id => memberIds.add(id));
  const allIds = Array.from(memberIds);
  if (N <= RS) {
    for (let i = 0; i < allIds.length; i++) {
      for (let j = i + 1; j < allIds.length; j++) {
        const key = [allIds[i], allIds[j]].sort().join("|");
        assert((pairCounts.get(key) || 0) >= 1, `full round robin: pairing missing for N=${N}`);
      }
    }
  } else {
    for (const [key, count] of pairCounts) {
      assert(count <= 1, `partial schedule: pairing ${key} repeats (${count}x) for N=${N}`);
    }
  }
  console.log(`N=${N}: schedule assertions passed (${RS}-week regular season)`);
}

if (process.env.SCHEDULE_ONLY === "1") {
  console.log(`N=${N} SCHEDULE-ONLY CHECKS PASSED`);
  process.exit(0);
}

async function runWeek(week, withGames) {
  if (withGames) {
    const gameIds = [];
    for (let g = 0; g < 3; g++) {
      const r = await api(users[0], "POST", "/api/gambling-league/admin/games", {
        week, homeTeam: `Home W${week}G${g}`, awayTeam: `Away W${week}G${g}`, spread: "-3.5",
        gameTime: new Date(Date.now() + 86400000).toISOString(),
      });
      assert(r.status === 200, `game w${week}: ${r.status} ${JSON.stringify(r.data)}`);
      gameIds.push(r.data.id);
    }
    for (let i = 0; i < users.length; i++) {
      const picks = gameIds.map((gameId, g) => ({ gameId, leagueId, week, pickedTeam: (i + g + week) % 2 === 0 ? "home" : "away" }));
      const r = await api(users[i], "POST", "/api/gambling-league/picks", { picks });
      assert(r.status === 200, `picks ${users[i]} w${week}: ${r.status} ${JSON.stringify(r.data)}`);
    }
    const scores = [[24, 17], [28, 20], [14, 21]];
    for (let g = 0; g < 3; g++) {
      const r = await api(users[0], "PATCH", `/api/gambling-league/admin/games/${gameIds[g]}/result`, { homeScore: scores[g][0], awayScore: scores[g][1] });
      assert(r.status === 200, `result w${week}g${g}: ${r.status}`);
    }
  }
  const fin = await api(users[0], "POST", `/api/gambling-league/admin/leagues/${leagueId}/finalize-week`, { week });
  assert(fin.status === 200, `finalize w${week}: ${fin.status} ${JSON.stringify(fin.data)}`);
  return fin.data;
}

for (let w = 1; w <= RS; w++) await runWeek(w, true);
console.log(`N=${N}: regular season done (weeks 1-${RS})`);

// Seed order for verification (projected-seeds mirrors gl_getPlayoffSeeds:
// wins desc -> total NPW desc -> userId asc; standings may tiebreak differently)
const projected = (await api(users[0], "GET", `/api/gambling-league/leagues/${leagueId}/projected-seeds`)).data;
const seedOrder = projected.map(e => e.userId);

// Playoff weeks: RS+1 .. 17
let lastResult = null;
for (let week = RS + 1; week <= 17; week++) {
  const roundEntry = config.rounds.find(([, w]) => w === week);
  const ms = (await api(users[0], "GET", `/api/gambling-league/leagues/${leagueId}/matchups?week=${week}`)).data
    .filter(m => m.isPlayoff);
  if (!roundEntry) {
    assert(ms.length === 0, `week ${week} should be an off week for N=${N}, got ${ms.length} matchups`);
    lastResult = await runWeek(week, false);
    continue;
  }
  const [roundKey] = roundEntry;
  const idx = config.rounds.findIndex(([, w]) => w === week);
  const expectedGames = participantsInRound(idx) / 2;
  assert(ms.length === expectedGames, `week ${week} (${roundKey}): ${ms.length} games != ${expectedGames}`);
  assert(ms.every(m => m.playoffRound === roundKey), `week ${week}: wrong round keys ${JSON.stringify(ms.map(m => m.playoffRound))}`);
  assert(ms.every(m => m.user2Id), `week ${week}: playoff matchup missing opponent`);
  if (idx === 0) {
    // First round participants are seeds byes+1..playoffTeams paired high vs low
    const expectedPairs = new Set();
    for (let i = 0; i < expectedGames; i++) {
      const hi = seedOrder[config.byes + i];
      const lo = seedOrder[config.playoffTeams - 1 - i];
      expectedPairs.add([hi, lo].sort().join("|"));
    }
    for (const m of ms) {
      const key = [m.user1Id, m.user2Id].sort().join("|");
      assert(expectedPairs.has(key), `week ${week}: unexpected pairing ${key}`);
    }
    console.log(`N=${N}: ${roundKey} pairings match standings-based seeds`);
  }
  lastResult = await runWeek(week, true);
}
assert(lastResult.status === "completed", `should complete after week 17, got ${lastResult.status}`);

const champ = (await api(users[0], "GET", `/api/gambling-league/leagues/${leagueId}/champion`)).data;
assert(champ.champion?.username, `no champion: ${JSON.stringify(champ)}`);
console.log(`N=${N} CHAMPION: ${champ.champion.username} — ALL CHECKS PASSED`);

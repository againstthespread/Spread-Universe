const BASE = "http://localhost:5000";
const N = parseInt(process.env.N || "4", 10);
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
const cr = await api(users[0], "POST", "/api/gambling-league/leagues", { name: `SIM${N} League`, capacity: "20" });
assert(cr.status === 200 || cr.status === 201, `create: ${cr.status} ${JSON.stringify(cr.data)}`);
const leagueId = cr.data.id, joinCode = cr.data.joinCode;
for (const u of users.slice(1)) {
  const r = await api(u, "POST", "/api/gambling-league/leagues/join", { joinCode });
  assert(r.status === 200, `join ${u}: ${r.status} ${JSON.stringify(r.data)}`);
}
const st = await api(users[0], "POST", `/api/gambling-league/leagues/${leagueId}/start`);
assert(st.status === 200, `start: ${st.status} ${JSON.stringify(st.data)}`);

const expectedRegular = Math.ceil(N / 2); // incl. bye matchup for odd N
const wk1 = (await api(users[0], "GET", `/api/gambling-league/leagues/${leagueId}/matchups?week=1`)).data;
assert(wk1.length === expectedRegular, `week1 matchups: ${wk1.length} != ${expectedRegular}`);
if (N % 2 === 1) assert(wk1.some(m => !m.user2Id), "odd league should have a bye matchup");

// Schedule fairness assertions across all 14 regular-season weeks:
// - every member plays (or has a bye) every week
// - N <= 14: full round robin — every unordered pairing occurs at least once
// - N >= 15: balanced partial — every unordered pairing occurs at most once
{
  const pairCounts = new Map();
  for (let w = 1; w <= 14; w++) {
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
  const memberIds = new Set();
  for (const key of pairCounts.keys()) key.split("|").forEach(id => memberIds.add(id));
  const allIds = Array.from(memberIds);
  if (N <= 14) {
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
  console.log(`N=${N}: schedule assertions passed`);
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

for (let w = 1; w <= 14; w++) await runWeek(w, true);
console.log(`N=${N}: regular season done`);

// week 15: QF only for 6+
const wk15 = (await api(users[0], "GET", `/api/gambling-league/leagues/${leagueId}/matchups?week=15`)).data;
if (N >= 6) {
  assert(wk15.length === 2 && wk15.every(m => m.playoffRound === "quarterfinal"), `QF wrong: ${JSON.stringify(wk15.map(m=>m.playoffRound))}`);
  await runWeek(15, true);
} else {
  assert(wk15.length === 0, `expected no QF for N=${N}, got ${wk15.length}`);
  await runWeek(15, false);
}

// week 16: semis for 4+
const wk16 = (await api(users[0], "GET", `/api/gambling-league/leagues/${leagueId}/matchups?week=16`)).data;
if (N >= 4) {
  assert(wk16.length === 2 && wk16.every(m => m.playoffRound === "semifinal"), `semis wrong: ${JSON.stringify(wk16)}`);
  await runWeek(16, true);
} else {
  assert(wk16.length === 0, `expected no semis for N=${N}, got ${wk16.length}`);
  await runWeek(16, false);
}

// week 17: championship for all
const wk17 = (await api(users[0], "GET", `/api/gambling-league/leagues/${leagueId}/matchups?week=17`)).data;
assert(wk17.length === 1 && wk17[0].playoffRound === "championship", `champ wrong: ${JSON.stringify(wk17)}`);
const r17 = await runWeek(17, true);
assert(r17.status === "completed", `should complete, got ${r17.status}`);

const champ = (await api(users[0], "GET", `/api/gambling-league/leagues/${leagueId}/champion`)).data;
assert(champ.champion?.username, `no champion: ${JSON.stringify(champ)}`);
console.log(`N=${N} CHAMPION: ${champ.champion.username} — ALL CHECKS PASSED`);

// Usage: pre-register the admin user glsim<N>u1, set is_admin=true in the users
// table, then run: N=<members> node scripts/test-gl-season.mjs
// Covers: schedule generation (byes for odd N), weekly picks + scoring,
// finalize-week advancement, playoff paths (2-3 straight to championship,
// 4-5 to semifinals, 6+ quarterfinals), and champion selection.
// Clean up SIM% leagues/games and glsim% users afterward.

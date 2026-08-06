---
name: Fantasy league scoring-integrity rules
description: Design rules for league platforms (CFB Conferences etc.) so results can't be gamed
---

- Lock lineup edits for a week as soon as any of that week's synced games is non-`scheduled`. **Why:** the admin workflow is "sync final scores, then finalize" — without the lock, users can set lineups of teams that already won between sync and finalize. **How to apply:** check the week's games in the set-lineup storage method, not just past-week/completed-matchup guards.
- Playoff bracket generation must cover every league size that can actually start a season. Two valid designs: (a) allow partial leagues and provide fallback brackets for small sizes (CFB: 4-5 members → straight semis, 2-3 → top-2 championship), or (b) require the league to be full before starting and key a size-specific format off capacity (gambling leagues: shared capacity→format config drives schedule length, byes, and rounds on both server and client so they can't disagree). Either way, without full coverage small/odd leagues dead-end with no champion.
- Multi-step roster mutations (free-agent drop+add, trade roster swaps) must be wrapped in `db.transaction` — unique constraints catch races but leave partial state (e.g. 6-team roster) if steps commit separately.
- Avoid `arr.sort(() => Math.random()-0.5)` for draft-order shuffles — it's biased; use Fisher-Yates.

## Season/week finalization concurrency
Season-start and week-advance operations must claim league state atomically (row lock or conditional update inside one transaction covering the member/matchup reads and writes), so concurrent joins/starts/finalizations cannot produce duplicate schedules, duplicate playoff rounds, or schedules missing a just-joined member.
**Why:** check-then-act races on league status/week corrupt brackets.
**How to apply:** any league engine that starts seasons, advances weeks, or generates rounds.

## Pick submission locking
Pick endpoints must verify membership, league not completed, pick week == league current week, and game not complete — otherwise users can edit picks after results are in and manipulate standings/seeds.

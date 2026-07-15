---
name: Fantasy league scoring-integrity rules
description: Design rules for league platforms (CFB Conferences etc.) so results can't be gamed
---

- Lock lineup edits for a week as soon as any of that week's synced games is non-`scheduled`. **Why:** the admin workflow is "sync final scores, then finalize" — without the lock, users can set lineups of teams that already won between sync and finalize. **How to apply:** check the week's games in the set-lineup storage method, not just past-week/completed-matchup guards.
- Playoff bracket generation must handle every allowed league size, not just the full bracket. CFB leagues allow 2-8 members but the standard bracket needs 6. Fallbacks: 4-5 members → straight to semis (1v4, 2v3); 2-3 members → top-2 championship at the final week. Without a fallback, small leagues dead-end with no champion.
- Multi-step roster mutations (free-agent drop+add, trade roster swaps) must be wrapped in `db.transaction` — unique constraints catch races but leave partial state (e.g. 6-team roster) if steps commit separately.
- Avoid `arr.sort(() => Math.random()-0.5)` for draft-order shuffles — it's biased; use Fisher-Yates.

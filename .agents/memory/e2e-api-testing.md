---
name: E2E API testing in this environment
description: Quirks when curl-testing this app's API from bash in this Replit env
---

- No `python3` in the environment. Parse JSON in bash with a node one-liner helper, e.g. `jget() { node -e "...JSON.parse(stdin)... eval(argv[1])" "$1"; }`.
- `/api/auth/me` returns `{ user: {...} }` — the user id is `j.user.id`, not `j.id`. A "trade id undefined" style failure in a test script is usually this shape mismatch, not a backend bug.
- Registration requires `email` and `confirmPassword` (Zod refine on registerSchema).
- To exercise admin routes in tests: temporarily `UPDATE users SET is_admin=true` via psql for a throwaway test user, then delete the user afterward. Real admin is `pdeluc99`.
- ESPN's free CFB scoreboard API works without a key; syncing a past season/week (e.g. 2025 wk1) yields ~96 games all with status `final` — useful for testing lineup-locking and scoring paths.

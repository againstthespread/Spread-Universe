# Against The Spread

## Overview

Against The Spread is a unified sports betting platform that provides a single authentication hub for accessing multiple sports betting and fantasy sports sub-platforms. The application serves as a central account management system where users can register, login, and manage their profiles while accessing eight different platforms: CrowdLine, March Madness ATS, FantasyStream, Gambling League, Postseason ATS, Football Weather, Golf Fantasy, and CFB Conferences.

The project follows a full-stack TypeScript architecture with React on the frontend and Express on the backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend lives in `client/src/` with a standard structure:
- `pages/` - Route components (home, login, register, dashboard, account, forgot-password)
- `components/` - Reusable UI components including shadcn/ui primitives
- `lib/` - Utilities, auth context, and API client
- `hooks/` - Custom React hooks

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: express-session with MemoryStore (development) or connect-pg-simple (production)
- **Authentication**: Custom session-based auth with password hashing (SHA-256)

The backend lives in `server/` with:
- `index.ts` - Express app setup and middleware
- `routes.ts` - API route definitions for auth endpoints
- `storage.ts` - Database access layer implementing IStorage interface
- `db.ts` - Drizzle database connection
- `vite.ts` - Vite dev server integration
- `static.ts` - Static file serving for production

### Shared Code
The `shared/` directory contains:
- `schema.ts` - Drizzle table definitions and Zod validation schemas shared between frontend and backend

### Database Schema

**Core Authentication Tables:**
- `users` - id, email, username, password
- `password_reset_codes` - id, userId, code, expiresAt, used

**CrowdLine Tables (NFL score predictions):**
- `crowdline_games` - NFL games with Vegas spreads and over/under
- `crowdline_predictions` - User score predictions per game

**March Madness Tables (NCAA tournament picks):**
- `marchmadness_teams` - Tournament teams with seeds and conferences
- `marchmadness_rounds` - Tournament rounds with point values (10→320)
- `marchmadness_games` - Tournament games with spreads
- `marchmadness_picks` - User picks per game

**Gambling League Tables (betting leagues):**
- `gamblingLeague_leagues` - User-created leagues (8/10/12/16 capacity)
- `gamblingLeague_members` - League memberships
- `gamblingLeague_games` - Weekly NFL games
- `gamblingLeague_picks` - User picks per game per league
- `gamblingLeague_matchups` - Head-to-head weekly matchups

**Postseason ATS Tables (NFL playoff picks):**
- `postseason_games` - Playoff games by round (Wild Card→Super Bowl)
- `postseason_picks` - User picks with escalating point values (125→1000)

**Golf Fantasy Tables (snake-draft fantasy golf leagues):**
- `golf_golfers` - 149 world-ranked golfers (seeded on startup)
- `golf_tournaments` - Golf tournaments managed by admin
- `golf_tournament_golfers` - Golfers assigned to a specific tournament (field)
- `golf_golfer_scores` - Round scores per golfer per tournament (R1-R4)
- `golf_leagues` - User-created fantasy leagues tied to a tournament
- `golf_league_members` - League memberships
- `golf_draft_picks` - Snake draft selections (pick number + golfer + user)

**CFB Conferences Tables (fantasy college football leagues):**
- `cfb_teams` - 136 FBS teams seeded on startup from ESPN (name, abbreviation, logo)
- `cfb_leagues` - User-created leagues (2-8 members, snake draft, weeks 1-14)
- `cfb_league_members` - League memberships
- `cfb_draft_picks` - Snake draft selections (7 teams per member)
- `cfb_rosters` - Current team ownership (acquiredVia: draft/free_agency/trade)
- `cfb_lineups` - Weekly 5-team starting lineups
- `cfb_games` - Real CFB games synced from ESPN per season/week
- `cfb_matchups` - H2H weekly matchups (incl. playoffs weeks 12-14, byes)
- `cfb_trades` - Trade proposals (equal team counts 1-3, pending/accepted/rejected/cancelled)
- `cfb_transactions` - Free agency add/drop log

### API Structure

**Authentication (`/api/auth/`):**
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/request-reset` - Request password reset code
- `POST /api/auth/verify-code` - Verify reset code
- `POST /api/auth/reset-password` - Set new password
- `PUT /api/auth/profile` - Update username
- `PUT /api/auth/password` - Change password

**CrowdLine (`/api/crowdline/`):**
- Games with stats, predictions, leaderboard, admin game management

**March Madness (`/api/marchmadness/`):**
- Teams, rounds, games, picks, leaderboard, admin management

**FantasyStream (`/api/fantasystream/`):**
- Live games, plays with filtering

**Gambling League (`/api/gambling-league/`):**
- Leagues, membership, games, picks, matchups, standings
- Invite-only: leagues have unique 8-char join codes; `POST /leagues/join` with `joinCode` (no public league list)

**Postseason ATS (`/api/postseason/`):**
- Playoff games by round, picks, leaderboard, pick history

**Football Weather (`/api/football-weather/`):**
- Games with weather data and fantasy implications

**Golf Fantasy (`/api/golf/`):**
- `GET /api/golf/golfers` - List all golfers (optional ?tournamentId or ?excludeTournamentId)
- `GET/POST /api/golf/golfers/:id` - Golfer detail and admin CRUD
- `GET /api/golf/tournaments` - List tournaments with their golfer fields
- `POST /api/golf/tournaments` - Admin: create tournament
- `PATCH /api/golf/tournaments/:id/status` - Admin: set status (upcoming/active/completed)
- `PATCH /api/golf/tournaments/:id` - Admin: update tournament (status field accepted)
- `GET /api/golf/tournaments/:id/golfers` - Get golfers in tournament field
- `POST/DELETE /api/golf/tournaments/:id/golfers` - Admin: manage tournament field
- `POST /api/golf/tournaments/:id/scores` - Admin: upsert round score for golfer
- `POST /api/golf/leagues/join` - Join league by code (must be before /:id route)
- `GET /api/golf/leagues` - User's leagues
- `POST /api/golf/leagues` - Create league
- `GET /api/golf/leagues/:id` - League detail (members must be member)
- `POST /api/golf/leagues/:id/invite` - Commissioner: invite by username
- `PATCH /api/golf/leagues/:id/draft-order` - Commissioner: set manual draft order
- `POST /api/golf/leagues/:id/start-draft` - Commissioner: activate draft
- `POST /api/golf/leagues/:id/draft/start` - Commissioner: activate draft (alias)
- `GET /api/golf/leagues/:id/draft` - Draft state (4s poll when active)
- `POST /api/golf/leagues/:id/draft/pick` - Submit draft pick
- `GET /api/golf/leagues/:id/standings` - League standings

**CFB Conferences (`/api/cfb/`):**
- `GET /api/cfb/teams` - List all 136 FBS teams
- `GET /api/cfb/games?week=&season=` - Synced games for a week
- `POST /api/cfb/leagues/join` - Join league by code (must be before /:id route)
- `GET/POST /api/cfb/leagues` - User's leagues / create league (2-8 members)
- `GET /api/cfb/leagues/:id` - League detail with members (must be member)
- `POST /api/cfb/leagues/:id/invite` - Commissioner: invite by username
- `PATCH /api/cfb/leagues/:id/draft-order` - Commissioner: set manual draft order
- `POST /api/cfb/leagues/:id/start-draft` - Commissioner: activate snake draft
- `GET /api/cfb/leagues/:id/draft` - Draft state (4s poll when active)
- `POST /api/cfb/leagues/:id/draft/pick` - Submit draft pick (7 rounds)
- `GET /api/cfb/leagues/:id/roster?userId=` - Roster with records + this week's game
- `GET/POST /api/cfb/leagues/:id/lineup` - Weekly lineup (exactly 5 starters)
- `GET /api/cfb/leagues/:id/free-agents` - Unclaimed teams
- `POST /api/cfb/leagues/:id/free-agents/claim` - Drop-one/add-one claim
- `GET /api/cfb/leagues/:id/matchups?week=` - H2H matchups with lineup details
- `GET /api/cfb/leagues/:id/standings` - Standings (wins desc → totalTeamWins desc)
- `GET/POST /api/cfb/leagues/:id/trades` - Trade list / propose (equal counts 1-3)
- `POST /api/cfb/leagues/:id/trades/:tradeId/respond` - accept/reject/cancel
- `GET /api/cfb/admin/leagues` - Admin: all leagues
- `POST /api/cfb/admin/sync-games` - Admin: sync week's games from ESPN {week, season?}
- `POST /api/cfb/admin/leagues/:id/finalize-week` - Admin: score matchups + advance week

### Design System
The application follows documented design guidelines in `design_guidelines.md`:
- Sports-first aesthetic with bold, dynamic layouts
- Unified brand presence across all sub-platforms
- Dark/light theme support via CSS variables
- Component library based on shadcn/ui with Radix primitives

## External Dependencies

### Database
- **PostgreSQL** - Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM** - Type-safe database queries and migrations

### Frontend Libraries
- **@tanstack/react-query** - Async state management
- **@radix-ui/*** - Accessible UI primitives (dialog, dropdown, tabs, etc.)
- **lucide-react** - Icon library
- **date-fns** - Date formatting
- **embla-carousel-react** - Carousel component
- **vaul** - Drawer component
- **input-otp** - OTP input for password reset

### Backend Libraries
- **express-session** - Session management
- **memorystore** - Development session store
- **connect-pg-simple** - Production session store (PostgreSQL)

### Build & Development
- **Vite** - Frontend build tool with HMR
- **esbuild** - Server bundling for production
- **tsx** - TypeScript execution for development

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (optional, has default)

### Frontend Pages

**Core Pages:**
- `/` - Landing page with platform overview
- `/login`, `/register` - Authentication pages
- `/dashboard` - Platform selection hub (6 platforms)
- `/account` - Account management
- `/forgot-password` - Password reset with 6-digit code

**Platform Pages:**
- `/crowdline`, `/crowdline/leaderboard`, `/crowdline/admin` - NFL score predictions
- `/marchmadness`, `/marchmadness/leaderboard`, `/marchmadness/admin` - NCAA tournament picks
- `/fantasystream` - Live NFL play-by-play viewer
- `/gambling-league`, `/gambling-league/leagues/:id` - Betting leagues
- `/postseason`, `/postseason/leaderboard`, `/postseason/history`, `/postseason/admin` - NFL playoff picks
- `/footballweather` - Weather-based game analysis
- `/golf` - Golf Fantasy hub (create/join leagues)
- `/golf/leagues/:id` - League detail (members, join code, invite, start draft)
- `/golf/leagues/:id/draft` - Live snake draft room (4s polling while active)
- `/golf/leagues/:id/standings` - League standings
- `/cfb` - CFB Conferences hub (create/join leagues)
- `/cfb/leagues/:id` - League detail (tabs: Matchup, Roster/Lineup, Standings, Free Agency, Trades, Members)
- `/cfb/leagues/:id/draft` - Live snake draft room (4s polling while active)

## Recent Changes

### Platform Integrations (Dec 2024)
- Integrated 6 fully functional sports betting platforms:
  1. **CrowdLine** - NFL score predictions with crowd-sourced spreads and leaderboard
  2. **March Madness ATS** - NCAA tournament bracket picks with escalating point values
  3. **FantasyStream** - Live NFL play-by-play viewer with filtering
  4. **Gambling League** - Create/join invite-only betting leagues (join codes) with head-to-head matchups
  5. **Postseason ATS** - NFL playoff picks with history tracking
  6. **Football Weather** - Weather-based fantasy implications for games

### Authentication Flow Fixes (Dec 2024)
- Fixed JSON response parsing in login/register pages - `apiRequest` returns a Response object, so we call `res.json()` to get the data
- Added race condition prevention in auth-context using generation tracking to ignore stale responses
- Used React's `flushSync` from react-dom to ensure synchronous state updates before navigation after login/register
- Session persistence verified across page reloads via session cookies

### Golf Fantasy Platform (Apr 2026)
- Added Golf Fantasy as the 7th platform: snake-draft fantasy golf leagues
- 149 world-ranked golfers seeded on server startup from official rankings CSV (ranks 1-149)
- Features: create/join leagues, snake draft (4-golfer roster per team), lower score wins
- Commissioner workflow: create league → invite by username or share join code → set draft order → start draft
- Admin panel: create tournaments, manage golfer field, enter round scores
- Draft room polls every 4 seconds while active for real-time updates
- Standings show total strokes per team (lower = better), updated as scores are entered
- 7 new database tables: golf_golfers, golf_tournaments, golf_tournament_golfers, golf_golfer_scores, golf_leagues, golf_league_members, golf_draft_picks

### CFB Conferences Platform (Jul 2026)
- Added CFB Conferences as the 8th platform: fantasy college football leagues
- 136 FBS teams seeded on server startup from ESPN's free public API (name, abbreviation, logo)
- Features: create/join leagues (2-8 members), snake draft of 7 teams each, weekly lineups of 5 starters
- H2H scoring: most straight-up wins by starters wins the week; ties allowed
- Free agency (drop-one/add-one), trades (equal team counts 1-3, accept/reject/cancel)
- Standings sorted by matchup wins desc → total team wins desc
- Playoffs weeks 12-14: top 6 teams, top 2 get quarterfinal byes, championship week 14
- Admin tab in unified admin panel: sync real games from ESPN per week, finalize week (scores matchups + advances week)
- Draft room polls every 4 seconds while active for real-time updates
- 10 new database tables: cfb_teams, cfb_leagues, cfb_league_members, cfb_draft_picks, cfb_rosters, cfb_lineups, cfb_games, cfb_matchups, cfb_trades, cfb_transactions

### Admin Access
- Admin is controlled via `isAdmin` boolean field on user accounts
- User `pdeluc99` is designated as the admin user
- Admin users can access the unified admin panel at `/admin`
- The header shows an "Admin Panel" link for admin users only
- 19 admin routes are protected with `requireAdmin` middleware
- Admin privileges required for game management and results entry across all platforms

### Unified Admin Panel
Located at `/admin`, the unified admin panel consolidates all platform management into a single interface:
- **Crowdline**: Create/delete games, enter final scores
- **March Madness ATS**: Manage teams, rounds, games, and tournament results
- **Postseason ATS**: Create playoff games by round, enter results
- **Gambling League**: Add weekly games, enter results, reset leagues
- **FantasyStream**: Placeholder (backend tooling pending)
- **Football Weather**: Placeholder (backend tooling pending)
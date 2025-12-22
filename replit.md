# Against The Spread

## Overview

Against The Spread is a unified sports betting platform that provides a single authentication hub for accessing multiple sports betting and fantasy sports sub-platforms. The application serves as a central account management system where users can register, login, and manage their profiles while accessing six different platforms: CrowdLine, March Madness ATS, FantasyStream, Gambling League, Postseason ATS, and Football Weather.

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

**Postseason ATS (`/api/postseason/`):**
- Playoff games by round, picks, leaderboard, pick history

**Football Weather (`/api/football-weather/`):**
- Games with weather data and fantasy implications

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

## Recent Changes

### Platform Integrations (Dec 2024)
- Integrated 6 fully functional sports betting platforms:
  1. **CrowdLine** - NFL score predictions with crowd-sourced spreads and leaderboard
  2. **March Madness ATS** - NCAA tournament bracket picks with escalating point values
  3. **FantasyStream** - Live NFL play-by-play viewer with filtering
  4. **Gambling League** - Create/join betting leagues with head-to-head matchups
  5. **Postseason ATS** - NFL playoff picks with history tracking
  6. **Football Weather** - Weather-based fantasy implications for games

### Authentication Flow Fixes (Dec 2024)
- Fixed JSON response parsing in login/register pages - `apiRequest` returns a Response object, so we call `res.json()` to get the data
- Added race condition prevention in auth-context using generation tracking to ignore stale responses
- Used React's `flushSync` from react-dom to ensure synchronous state updates before navigation after login/register
- Session persistence verified across page reloads via session cookies

### Admin Access
- Admin users: admin@crowdline.com, admin@marchmadness.com, admin@postseason.com
- Admin privileges required for game management and results entry
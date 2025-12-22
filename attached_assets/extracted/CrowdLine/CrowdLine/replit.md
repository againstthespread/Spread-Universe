# NFL Score Prediction Platform

## Overview

An NFL score prediction platform where users can submit their predictions for upcoming NFL games and view crowd-sourced prediction statistics. The application features user authentication, game management by administrators, and real-time prediction tracking with aggregated statistics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Timezone Handling

**All game times use Eastern Time (America/New_York) timezone:**
- **Admin input**: Game times entered in Eastern Time with explicit "(Eastern Time)" label
- **Storage**: Converted to UTC using `easternToUTC()` before database storage
- **Display**: All displayed times use `formatInEastern()` to show in ET with " ET" suffix
- **Game locking**: Backend uses timezone-agnostic UTC comparison for accurate kickoff detection
- **Libraries**: `date-fns` and `date-fns-tz` for reliable timezone conversions

This ensures consistent behavior regardless of user/server location and handles DST automatically.

### Frontend Architecture

**Technology Stack:**
- **React** with TypeScript for type safety
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query** (React Query) for server state management and data fetching
- **shadcn/ui** components built on Radix UI primitives
- **Tailwind CSS** for styling with custom design system

**Design System:**
- Typography: Inter for UI elements and Bebas Neue for sports-style headings
- Custom color system with CSS variables for theming support
- Responsive grid layout (1-3 columns based on viewport)
- Mobile-first approach with breakpoint-based adaptations

**State Management:**
- Server state managed via TanStack Query with aggressive caching (staleTime: Infinity)
- Session-based authentication state checked via `/api/user` endpoint
- No global client state management library needed

**Key Components:**
- GameCard: Displays game info, prediction inputs, and crowd statistics
- Protected routes via AuthenticatedRoute wrapper component
- Toast notifications for user feedback
- Skeleton loaders for async content

### Backend Architecture

**Technology Stack:**
- **Node.js** with Express.js web framework
- **TypeScript** for type-safe server code
- **Drizzle ORM** for database operations
- **Neon (Serverless PostgreSQL)** as the database provider
- **express-session** for session management
- **bcryptjs** for password hashing

**API Design:**
- RESTful API endpoints under `/api` prefix
- Session-based authentication (not token-based)
- Middleware for authentication (`requireAuth`) and authorization (`requireAdmin`)
- JSON request/response format

**Authentication & Authorization:**
- Session cookies with 7-day expiration
- Password hashing via bcrypt (salt rounds: 10)
- Role-based access: regular users vs admin users (isAdmin flag)
- Admin-only routes for game management

**Database Schema (Drizzle):**
- **users**: id, username, password (hashed), isAdmin flag, createdAt
- **games**: id, homeTeam, awayTeam, gameDate, status (scheduled/in_progress/completed), actualHomeScore (optional), actualAwayScore (optional), vegasSpread (optional decimal), vegasOverUnder (optional decimal), createdAt
- **predictions**: id, userId, gameId, homeScore, awayScore, createdAt
  - Unique constraint on (userId, gameId) - one prediction per user per game
  - Cascade deletes when user or game is removed

**Storage Layer:**
- Interface-based storage pattern (IStorage) for testability
- DatabaseStorage implementation using Drizzle ORM
- Aggregated statistics computed via SQL joins (GameWithStats type)
- Predictions can be created or updated (upsert pattern)

### Data Flow

1. User submits prediction → POST `/api/predictions`
2. Server validates session, creates/updates prediction in database
3. Client invalidates queries to refetch updated game stats
4. GameCard re-renders with new crowd statistics (avg scores, prediction count)

### External Dependencies

**Database:**
- **Neon Serverless PostgreSQL** - Cloud-hosted Postgres with WebSocket support
- Connection pooling via `@neondatabase/serverless`
- DATABASE_URL environment variable required

**UI Libraries:**
- **Radix UI** - Headless component primitives (dialogs, dropdowns, etc.)
- **shadcn/ui** - Pre-built accessible components
- **Lucide React** - Icon library
- **date-fns** - Date formatting and manipulation

**Development Tools:**
- **Replit-specific plugins** for Vite (cartographer, dev banner, runtime error overlay)
- **drizzle-kit** - Database migrations and schema management
- **esbuild** - Production bundling for server code

**Session Storage:**
- Default in-memory session store (development)
- Can be extended with `connect-pg-simple` for production PostgreSQL session storage

**API Endpoints:**

*Authentication:*
- POST `/api/auth/register` - Create new user account
- POST `/api/auth/login` - Login existing user
- POST `/api/auth/logout` - End user session
- GET `/api/user` - Get current authenticated user

*Games (Public):*
- GET `/api/games` - Fetch all games with aggregated statistics and user predictions

*Games (Admin Only):*
- GET `/api/admin/games` - Fetch all games (admin view)
- POST `/api/admin/games` - Create new game
- PATCH `/api/admin/games/:id/result` - Update game with actual scores and Vegas lines
- DELETE `/api/admin/games/:id` - Delete game

*Predictions:*
- POST `/api/predictions` - Submit or update prediction (creates if new, updates if exists)

## Features

### Game Locking (October 30, 2025)
Games automatically lock at kickoff to prevent late predictions:
- **Backend validation**: Predictions rejected after game start time
- **Frontend indicators**: "Locked" badge displayed on game cards
- **Status tracking**: Games transition through scheduled → in_progress → completed states
- **User experience**: Disabled inputs with clear messaging when games are locked

### Historical Tracking (October 30, 2025)
Post-game analysis comparing crowd predictions to actual results:
- **Admin interface**: Dialog-based result entry with actual scores and optional Vegas lines
- **Comparison display**: Completed games show side-by-side comparisons:
  - Actual final scores (large display)
  - Actual vs Crowd vs Vegas Over/Under
  - Actual vs Crowd vs Vegas Spread
- **Data persistence**: Results stored as integers, Vegas lines as decimals
- **Accuracy analysis**: Visual comparison helps users see how crowd performed vs bookmakers

### User Leaderboard (October 30, 2025)
Competitive ranking system based on prediction accuracy:
- **Scoring algorithm**: 
  - 25 points for exact score prediction
  - 10 points for correct winner prediction
  - Up to 10 points for score proximity (max 45 points per game)
- **Statistics tracking**: Total points, games predicted, correct winners, exact scores, average point difference
- **Leaderboard page**: Rankings table with top 3 medal icons, current user highlighting
- **Personal stats card**: Shows individual rank and performance metrics
- **Public endpoint**: GET /api/leaderboard returns sorted rankings

### Planned Features
- **Data Export**: CSV/JSON export of crowd predictions for analysis
- **Email Reminders**: Weekly notifications for game predictions
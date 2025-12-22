# NFL Playoffs ATS Pick'em Game

## Overview

This is an NFL Playoffs Against The Spread (ATS) pick'em game where users compete by selecting teams to cover the spread throughout the playoff rounds. The application features role-based access with separate interfaces for administrators and regular users. Admins can both manage games/enter results AND participate by making picks like regular users. Points are awarded based on playoff round progression (Wild Card: 125pts, Divisional: 250pts, Conference: 500pts, Super Bowl: 1000pts).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**UI Component Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design follows a "New York" style variant with a focus on data density and sports platform aesthetics inspired by ESPN Fantasy and DraftKings.

**Routing**: wouter for client-side routing with protected routes requiring authentication.

**State Management**: 
- TanStack Query (React Query) for server state management with aggressive caching (staleTime: Infinity)
- React Context for authentication state via AuthProvider
- Local component state for form inputs and UI interactions

**Design System**:
- Typography: Inter for body text, Bebas Neue for headers
- Color scheme: Neutral base with HSL-based theming supporting light/dark modes
- Spacing: Tailwind units (2, 4, 6, 8, 12, 16)
- Responsive breakpoints: Mobile-first with `md` breakpoint for desktop layouts

**Key Pages**:
- `/auth` - Login/registration (admin accounts created via database)
- `/` - User picks page (users) or admin dashboard (admins)
- `/picks` - Make picks page (accessible to both admins and users)
- `/history` - Pick history showing all users' picks for completed games
- `/leaderboard` - Competitive standings with user performance metrics
- `/stats` - User statistics and analytics with performance breakdowns
- `/admin/games` - Game management (admin only)
- `/admin/results` - Results entry and scoring (admin only)
- `/admin/password-reset` - Password reset management (admin only)
- `/change-password` - Required password change page (users with requirePasswordChange flag)

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js.

**Authentication**: 
- Passport.js with Local Strategy for username/password authentication
- express-session for session management with PostgreSQL session store (connect-pg-simple)
- Scrypt for password hashing with salts
- Role-based access control (admin vs. regular user)

**API Design**:
- RESTful endpoints under `/api` prefix
- Middleware-based authorization (requireAuth, requireAdmin)
- JSON request/response format
- Standardized error handling with HTTP status codes

**Key Endpoints**:
- `POST /api/login`, `POST /api/register`, `POST /api/logout` - Authentication
- `GET /api/games/with-picks` - Games with user's picks
- `POST /api/picks` - Submit/update picks (validates against pickDeadline)
- `POST /api/games/results` - Enter game results (admin) with email notifications
- `GET /api/pick-history` - All picks for completed games with user and game details
- `GET /api/leaderboard` - Standings with remaining and max possible calculations
- `GET /api/stats/:userId` - Comprehensive user statistics and analytics
- `GET /api/admin/stats` - Dashboard statistics (admin)
- `GET /api/users` - All users list (admin only, for password reset)
- `POST /api/admin/reset-password` - Generate temporary password for a user (admin only)
- `POST /api/change-password` - Change user's own password (authenticated users)

**Business Logic**:
- Picks can be submitted/updated before pick deadline (or game time if no custom deadline)
- Results entry triggers automatic scoring of all picks and email notifications
- Point calculation based on spread coverage with round multipliers (125/250/500/1000)
- Leaderboard calculations:
  - Remaining: Total points from incomplete games (same for all users, starts at 3750)
  - Max Possible: User's current points + Remaining points
- Email notifications sent to users with email addresses and notifications enabled

### Data Storage

**Database**: PostgreSQL accessed via Neon serverless driver with WebSocket support.

**ORM**: Drizzle ORM for type-safe database operations with schema-first approach.

**Schema Design**:
- `users` - User accounts with admin flag, scrypt-hashed passwords, email, email notification preferences, requirePasswordChange flag
- `games` - Playoff games with round, teams, spread, favored team, game date, pick deadline, scores, completion status
- `picks` - User selections linked to games and users, with correctness and points earned

**Recent Features**:
- **Pick Deadline Management**: Custom deadlines per game (optional, defaults to game time)
- **Pick History View**: Displays all users' picks for completed games with filtering by round and user
- **Email Notifications**: System sends notifications when games are posted and results are entered (requires email integration setup)
- **Admin Participation**: Admins can now make picks alongside regular users via the "My Picks" page
- **User Statistics**: Comprehensive analytics showing accuracy, performance by round, streaks, and recent form
- **Admin Password Reset**: Admins can generate temporary passwords for users who forget their credentials, with forced password change on next login

**Admin Setup**:
- Admin accounts must be created by setting `isAdmin = true` directly in the database for specific user accounts
- Example SQL: `UPDATE users SET "isAdmin" = true WHERE username = 'adminuser';`

**Password Management**:
- Passwords are one-way hashed using scrypt with random salts (cannot be retrieved, only reset)
- Password reset flow (admin-assisted):
  1. Admin selects user from `/admin/password-reset` page
  2. System generates random 16-character temporary password
  3. Admin communicates temporary password to user securely
  4. User logs in with temporary password and is immediately redirected to `/change-password`
  5. User must set new password (min 6 characters) before accessing any other page
  6. Protected routes check `requirePasswordChange` flag and enforce password change
- All password changes clear the `requirePasswordChange` flag automatically

**Enums**:
- `round`: WILD_CARD, DIVISIONAL, CONFERENCE, SUPER_BOWL
- `favored_team`: HOME, AWAY

**Relations**: One-to-many from users to picks, games to picks. Cascade deletes configured.

**Session Store**: PostgreSQL-backed session storage for authentication persistence.

**Migrations**: Managed via drizzle-kit with schema defined in `shared/schema.ts`.

### External Dependencies

**Core Infrastructure**:
- Neon Database (PostgreSQL) - Serverless PostgreSQL hosting with WebSocket support
- Replit deployment environment with development plugins (cartographer, dev-banner, runtime-error-modal)

**UI/Styling**:
- Tailwind CSS - Utility-first CSS framework
- Radix UI - Accessible component primitives
- shadcn/ui - Pre-built component library
- Font Awesome - Icon library (v6.5.1 CDN)
- Google Fonts - Inter and Bebas Neue typography

**Data Management**:
- TanStack Query - Server state management and caching
- Drizzle ORM - TypeScript ORM for PostgreSQL
- Zod - Schema validation (via drizzle-zod)
- date-fns - Date manipulation and formatting

**Authentication/Session**:
- Passport.js - Authentication middleware
- express-session - Session management
- connect-pg-simple - PostgreSQL session store

**Form Handling**:
- React Hook Form - Form state management
- @hookform/resolvers - Validation resolver integration

**Development**:
- TypeScript - Type safety across frontend and backend
- Vite - Build tool and dev server
- tsx - TypeScript execution for server
- esbuild - Production bundling

**Utilities**:
- wouter - Lightweight routing
- clsx/tailwind-merge - Conditional class composition
- cmdk - Command palette component
- embla-carousel-react - Carousel functionality
- class-variance-authority - Component variant management

**Notifications**:
- Email notification service in `server/notifications.ts`
- Infrastructure ready for email provider integration (Resend, SendGrid, etc.)
- To enable: Set up email integration, install provider SDK, implement sendEmail function, set EMAIL_ENABLED=true
- Notifications sent when: new games posted, game results entered
- Users can opt-in/out via email and emailNotifications fields
- Currently logs to console until email provider is configured
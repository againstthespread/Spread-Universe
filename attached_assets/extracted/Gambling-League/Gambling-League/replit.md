# Fantasy Football League Platform

## Overview

A fantasy football league platform where users create or join leagues and compete weekly by picking NFL games against the spread. The application features league management, weekly matchups, pick tracking, standings calculation, and an admin panel for game management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling:**
- React with TypeScript using Vite as the build tool
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- Tailwind CSS for styling with shadcn/ui component library

**Design System:**
- Sports-centric design inspired by ESPN Fantasy Football and Yahoo Fantasy Sports
- Custom color palette with NFL Navy primary, Football Red secondary, and Field Gold accent colors
- Light/dark mode support with CSS custom properties
- Mobile-first responsive design approach
- Component library based on Radix UI primitives with New York style variant

**Key UI Patterns:**
- Dialog-based workflows for creating and joining leagues
- Tab-based navigation for league details (Picks, Standings, Schedule)
- Real-time pick deadline tracking with countdown timers
- Toast notifications for user feedback

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Session-based authentication using express-session
- Custom middleware for request logging and error handling
- RESTful API design pattern

**Authentication & Authorization:**
- Email/password authentication using Passport Local strategy
- Bcrypt for secure password hashing (10 salt rounds)
- Session storage in PostgreSQL using connect-pg-simple
- Role-based access control with admin flag on users
- Minimum password length: 8 characters
- Session cookies: secure in production, lax sameSite policy

**Business Logic:**
- Round-robin scheduling algorithm for league matchups
- NPW (Net Points Won) calculation system for standings
- Pick validation with deadline based on first game time of the week
- Automatic league status transitions (open → full → active → completed)

### Data Architecture

**Database:**
- PostgreSQL via Neon serverless with WebSocket support
- Drizzle ORM for type-safe database operations
- Schema-first approach with Zod validation

**Core Data Models:**
1. **Users** - Email, hashed password, firstName, lastName, admin flag, profile image URL
2. **Leagues** - League configuration (capacity, status, current week)
3. **League Members** - User-league relationships with win/loss/draw tracking
4. **Games** - NFL game data with spread, scores, and results
5. **Weekly Matchups** - Round-robin schedule with results
6. **Picks** - User game predictions against the spread
7. **Sessions** - Encrypted session storage for authentication

**Data Flow:**
- Storage layer abstraction (IStorage interface) for database operations
- Query-based API endpoints for data retrieval
- Mutation-based endpoints for data modifications
- Real-time data invalidation using React Query

### External Dependencies

**Database:**
- Neon PostgreSQL serverless database
- WebSocket connection for real-time capabilities

**Authentication:**
- Passport.js with Local strategy for email/password auth
- Bcrypt for password hashing and verification

**UI Components:**
- Radix UI primitives for accessible component foundations
- Google Fonts (Inter, Roboto) for typography

**Development Tools:**
- Replit-specific Vite plugins (runtime error overlay, cartographer, dev banner)
- TypeScript for type safety across client and server
- Drizzle Kit for database migrations

**Session Management:**
- PostgreSQL-based session store via connect-pg-simple
- 1 week session TTL
- Environment validation for SESSION_SECRET and DATABASE_URL

**Key Integrations:**
- No external NFL data API (admin manually enters game data)
- No email service (no email verification for signups)
- No file storage service (profile images stored as URLs)
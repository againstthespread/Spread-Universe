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
Two main tables:
- `users` - id, email, username, password
- `password_reset_codes` - id, userId, code, expiresAt, used

### API Structure
All API routes are prefixed with `/api/auth/`:
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/request-reset` - Request password reset code
- `POST /api/auth/verify-code` - Verify reset code
- `POST /api/auth/reset-password` - Set new password
- `PUT /api/auth/profile` - Update username
- `PUT /api/auth/password` - Change password

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

## Recent Changes

### Authentication Flow Fixes (Dec 2024)
- Fixed JSON response parsing in login/register pages - `apiRequest` returns a Response object, so we call `res.json()` to get the data
- Added race condition prevention in auth-context using generation tracking to ignore stale responses
- Used React's `flushSync` from react-dom to ensure synchronous state updates before navigation after login/register
- Session persistence verified across page reloads via session cookies
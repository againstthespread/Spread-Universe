# Against The Spread - Gaming Portal

## Overview

Against The Spread is a gaming portal web application that serves as a central hub for competitive gaming links. The application features a bold, gaming-inspired public-facing interface with a clean admin panel for managing game entries. Built with a modern full-stack architecture, it provides users with an engaging platform to discover and access various competitive gaming experiences, starting with "Gambling League" as the flagship game.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite for fast development and optimized production builds
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** TanStack Query (React Query) for server state management
- **Form Handling:** React Hook Form with Zod for schema validation via @hookform/resolvers

**UI Component System:**
- **Design System:** Shadcn/ui components built on Radix UI primitives
- **Styling:** Tailwind CSS with custom design tokens
- **Theme:** "New York" style variant with neutral base color
- **Typography:** Dual font system using "Bebas Neue" for display/headers and "Inter" for body text
- **Design Philosophy:** Hybrid approach combining Material Design principles for admin interfaces with bold gaming aesthetics for public pages

**Key Design Decisions:**
- Component library uses HSL color variables for theming flexibility
- CSS variables enable dynamic color scheme switching between light/dark modes
- Glassmorphism effects (backdrop blur) for hero section CTAs
- Responsive breakpoints follow Tailwind's standard mobile-first approach
- Custom spacing primitives in multiples of 4 (4, 6, 8, 12, 16) for consistent layouts

**Page Structure:**
- **Home (/):** Public landing page with hero section, game grid display, category filters
- **Login (/login):** Admin authentication page with password input
- **Admin (/admin):** Protected administrative interface for CRUD operations on games and analytics
- **404 Handler:** Custom not-found page

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js for RESTful API
- **Database ORM:** Drizzle ORM with type-safe queries
- **Build Process:** esbuild for production bundling, tsx for development

**API Design:**
- RESTful endpoints under `/api` namespace
- Authentication endpoints:
  - POST `/api/auth/login` - Admin login (requires ADMIN_PASSWORD)
  - POST `/api/auth/logout` - Admin logout (destroys session)
  - GET `/api/auth/status` - Check authentication status
- Public endpoints:
  - GET `/api/games` - Fetch all games
  - GET `/api/games/:id` - Fetch single game
  - POST `/api/clicks` - Record game click (for analytics)
- Protected admin endpoints (require authentication):
  - POST `/api/games` - Create new game
  - PATCH `/api/games/:id` - Update existing game
  - DELETE `/api/games/:id` - Remove game
  - POST `/api/games/reorder` - Reorder games by display order
  - GET `/api/analytics` - View click analytics
- Request/response logging middleware for API routes
- JSON body parsing with raw body preservation for webhook compatibility

**Data Layer:**
- Storage abstraction pattern via `IStorage` interface
- `DatabaseStorage` implementation for production database operations
- Separation of database logic from route handlers for maintainability
- Automatic seeding of initial "Gambling League" game on server startup

**Development Features:**
- Vite middleware integration for HMR in development
- Custom logger with timestamps for request tracking
- Error handling with process exit on critical Vite errors
- Static file serving for production builds

### Data Storage

**Database:**
- **Provider:** Neon Database (serverless PostgreSQL)
- **Connection:** WebSocket-based connection pooling via @neondatabase/serverless
- **Schema Management:** Drizzle Kit for migrations and schema synchronization

**Data Model:**

**Games Table:**
- `id` (varchar, primary key) - Auto-generated UUID
- `name` (text, required) - Game display name
- `url` (text, required) - External link to game (validated as URL)
- `description` (text, optional) - Game description for cards
- `thumbnailUrl` (text, optional) - URL to game thumbnail image
- `category` (text, optional) - Game category for filtering (Card Games, Sports, Strategy, etc.)
- `displayOrder` (integer, default: 0) - Sort order for game display
- `isActive` (boolean, default: true) - Visibility flag for public display

**Clicks Table:**
- `id` (varchar, primary key) - Auto-generated UUID
- `gameId` (varchar, required) - References game ID
- `clickedAt` (timestamp, default: now()) - When the click occurred

**Schema Validation:**
- Zod schemas generated from Drizzle tables via `drizzle-zod`
- Input validation ensures URL format compliance
- Type safety maintained from database to API to frontend

**Design Rationale:**
- UUID primary keys prevent enumeration attacks and enable distributed ID generation
- Boolean `isActive` flag allows soft-deletion and draft states
- Schema-first approach with Drizzle ensures database and TypeScript types stay synchronized

### External Dependencies

**Core Infrastructure:**
- **Database:** Neon Database (serverless PostgreSQL with WebSocket support)
- **Build Tools:** Vite, esbuild, TypeScript compiler
- **Package Manager:** npm with lockfile version 3

**UI Libraries:**
- Radix UI primitives (20+ component primitives for accessibility)
- Tailwind CSS with PostCSS and Autoprefixer
- Lucide React for iconography
- Class Variance Authority (CVA) for component variant management

**Development Tools:**
- Replit-specific plugins for runtime error overlay, cartographer, and dev banner
- WebSocket library (ws) for Neon Database connection in Node.js environment

**Validation & Data:**
- Zod for runtime type validation
- date-fns for date manipulation
- nanoid for unique ID generation

**Design Assets:**
- Google Fonts (Bebas Neue, Inter)
- Custom hero background image stored in `attached_assets/generated_images/`

**Configuration Files:**
- `components.json` - Shadcn/ui configuration with path aliases
- `tailwind.config.ts` - Extended theme with custom color system
- `tsconfig.json` - TypeScript configuration with path mapping
- `drizzle.config.ts` - Database migration settings
- `vite.config.ts` - Build and dev server configuration with aliases

**Environment Variables:**
- `DATABASE_URL` - Required for Neon Database connection (provisioned by Replit)
- `SESSION_SECRET` - Required for session encryption (provisioned by Replit)
- `ADMIN_PASSWORD` - Required for admin authentication (must be set by user)
- `NODE_ENV` - Environment detection (development/production)
- `REPL_ID` - Replit-specific identifier for dev plugins

## Features

### 1. Game Management
- Admin can add, edit, delete, and reorder games
- Each game has:
  - Name, URL, description
  - Optional thumbnail image
  - Optional category for organization
  - Active/inactive status
  - Display order for custom sorting
- Changes are reflected immediately on the public homepage

### 2. Game Thumbnails
- Optional thumbnail images for visual appeal
- Fallback gamepad icon when no thumbnail is provided
- Responsive image display in game cards

### 3. Link Reordering
- Up/down arrow controls in admin table
- Custom display order persisted in database
- Games displayed in order on public homepage

### 4. Category System
- Predefined categories: Card Games, Sports, Strategy, Puzzle, Action, Casino, Other
- Category badges displayed on game cards
- Filter buttons on homepage to view games by category
- Dynamic category list based on active games

### 5. Click Analytics
- Tracks when users click "Play Now" on games
- Analytics dashboard in admin panel showing:
  - Game name
  - Total click count
  - Sorted by most clicked
- Click data persists in database with timestamps

### 6. Admin Authentication
- Password-protected admin panel
- Session-based authentication using express-session
- Security features:
  - No default password fallback (ADMIN_PASSWORD env var required)
  - Session regeneration on login to prevent session fixation
  - httpOnly cookies to prevent XSS
  - SameSite='lax' for CSRF protection
  - Secure cookies in production
- Login page at /login
- Logout functionality to end session
- Protected API endpoints require authentication
- Automatic redirect to login for unauthenticated admin access

## Security

- Admin endpoints protected by session-based authentication
- Required environment variables (SESSION_SECRET, ADMIN_PASSWORD) validated on startup
- Session cookies use httpOnly, secure (in production), and sameSite flags
- Session regeneration on login prevents session fixation attacks
- Click recording endpoint is public (necessary for tracking user engagement)
- UUID primary keys prevent ID enumeration
- Input validation using Zod schemas on all API endpoints

## Recent Changes (October 28, 2025)

1. **Added game thumbnails** - Games can now have optional thumbnail images
2. **Implemented link reordering** - Admin can reorder games with up/down controls
3. **Added category system** - Games can be categorized and filtered on homepage
4. **Implemented click analytics** - Track and display game click statistics in admin
5. **Added admin password protection** - Secure authentication system for admin panel
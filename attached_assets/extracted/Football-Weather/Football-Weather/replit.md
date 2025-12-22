# NFL Weather Dashboard

## Overview

This is an NFL Weather Dashboard application designed to help fantasy football players make informed decisions based on game-day weather conditions. The app displays weather forecasts for NFL games, distinguishes between dome and outdoor stadiums, and provides fantasy-relevant insights (e.g., QB/WR favorable vs RB favorable conditions).

The application follows a monorepo structure with a React frontend and Express backend, using TypeScript throughout. It fetches real-time weather data from OpenWeatherMap and presents it in a scannable, data-first interface optimized for quickly reviewing 16+ games per week.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **Build Tool**: Vite for development and production builds

The frontend is located in `client/src/` with:
- `pages/` - Route-level components (dashboard, not-found)
- `components/` - Reusable UI components (game cards, weather icons, badges)
- `components/ui/` - shadcn/ui base components
- `hooks/` - Custom React hooks
- `lib/` - Utilities and query client configuration

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Structure**: RESTful endpoints under `/api/`
- **Development**: Vite middleware for HMR in development
- **Production**: Static file serving from built assets

The backend is located in `server/` with:
- `index.ts` - Express app setup and middleware
- `routes.ts` - API route definitions (game and weather data)
- `storage.ts` - In-memory storage implementation (interface-based for future database migration)
- `static.ts` - Production static file serving
- `vite.ts` - Development Vite integration

### Data Flow
1. Frontend queries `/api/games` endpoint
2. Backend fetches NFL schedule data and weather forecasts
3. Weather data is fetched from OpenWeatherMap using stadium coordinates
4. Fantasy implications are calculated based on weather conditions
5. Response includes games with weather, stadium info, and fantasy insights

### Shared Code
- `shared/schema.ts` - Zod schemas and TypeScript types for stadiums, teams, weather, and fantasy implications
- NFL stadium data with coordinates and dome/outdoor classification
- Team-to-stadium mapping

### Key Design Decisions
- **In-memory storage**: Currently uses MemStorage for user data; database schema exists in Drizzle config for future PostgreSQL integration
- **Weather caching**: Data is refreshed on request with stale time management via React Query
- **Weekly reset**: Auto-reset mechanism targeting Tuesday 8 AM EST for new NFL week
- **Responsive design**: Card-based layout on mobile, grid layout on desktop

## External Dependencies

### APIs and Services
- **OpenWeatherMap API**: Weather forecasts for stadium locations (requires `OPENWEATHER_API_KEY` environment variable)
- **ESPN API** (implied by schema): NFL schedule and team data

### Database
- **PostgreSQL**: Configured via Drizzle ORM but not actively used (in-memory storage currently)
- **Drizzle Kit**: Database migration tooling (`db:push` script available)
- **Connection**: Requires `DATABASE_URL` environment variable when using database features

### Key NPM Dependencies
- `@tanstack/react-query` - Server state management
- `drizzle-orm` / `drizzle-zod` - ORM and schema validation
- `date-fns` - Date formatting and manipulation
- `lucide-react` - Icon library
- `zod` - Runtime type validation
- Radix UI primitives - Accessible UI components
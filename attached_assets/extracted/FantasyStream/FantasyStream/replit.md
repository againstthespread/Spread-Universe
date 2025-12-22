# Overview

This is a full-stack NFL live data application that provides real-time game scores and play-by-play information. The application fetches data from ESPN's API and displays it in a modern, responsive web interface. Users can view live game scores in a top bar and see a feed of recent plays with detailed information including player names, play types, and game context.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation resolvers

## Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Data Storage**: In-memory storage with interface for future database integration
- **API Design**: RESTful endpoints for games, plays, and data refresh operations
- **Real-time Updates**: Automatic polling every 30 seconds for fresh data

## Data Layer
- **ORM**: Drizzle ORM configured for PostgreSQL (ready for database integration)
- **Schema Validation**: Zod schemas for type-safe data validation across client and server
- **Shared Types**: Common schema definitions in shared directory for consistency

## Development Environment
- **Build System**: Vite for frontend bundling with hot module replacement
- **TypeScript**: Strict configuration with path mapping for clean imports
- **Code Organization**: Monorepo structure with separate client, server, and shared directories
- **Development Tools**: ESBuild for server compilation and deployment builds

## Key Design Patterns
- **Component Architecture**: Atomic design with reusable UI components and custom hooks
- **Data Fetching**: Centralized API client with React Query for caching and background updates
- **Error Handling**: Comprehensive error boundaries and toast notifications for user feedback
- **Responsive Design**: Mobile-first approach with Tailwind's responsive utilities

# External Dependencies

## Core Framework Dependencies
- **React 18**: Component framework with hooks and modern features
- **Express.js**: Web application framework for the Node.js backend
- **Vite**: Build tool and development server with hot reload

## UI and Styling
- **shadcn/ui**: Pre-built accessible components based on Radix UI
- **Radix UI**: Headless UI primitives for accessibility and keyboard navigation
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography

## Data Management
- **TanStack Query**: Server state management with caching and background updates
- **Drizzle ORM**: TypeScript ORM for database operations (configured for PostgreSQL)
- **Zod**: Schema validation library for type safety

## Development and Build Tools
- **TypeScript**: Static type checking and enhanced developer experience
- **PostCSS**: CSS processing with Tailwind CSS integration
- **ESBuild**: Fast JavaScript bundler for production builds

## External APIs
- **ESPN API**: Real-time NFL game data including scores, plays, and game status
- **Neon Database**: Serverless PostgreSQL database (configured but not actively used with in-memory storage)

## Utility Libraries
- **date-fns**: Date manipulation and formatting utilities
- **clsx/class-variance-authority**: Conditional CSS class management
- **nanoid**: Unique ID generation for data records
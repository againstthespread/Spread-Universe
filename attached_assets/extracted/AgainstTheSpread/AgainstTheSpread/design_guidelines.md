# Design Guidelines: Against The Spread - Gaming Portal

## Design Approach

**Selected Approach:** Hybrid (Design System + Gaming Aesthetic)
- Base: Material Design principles for functional admin components
- Enhancement: Bold, energetic gaming-inspired layouts for public-facing sections
- Reference inspiration: Steam's game showcase + Discord's card layouts + Linear's clean admin interfaces

## Core Design Elements

### Typography Hierarchy

**Font Families:**
- Primary: 'Inter' (Google Fonts) - Clean, modern sans-serif for UI elements and body text
- Display: 'Bebas Neue' (Google Fonts) - Bold, impactful for headers and game titles

**Scale:**
- Hero Headline: text-6xl md:text-7xl lg:text-8xl font-bold (Bebas Neue)
- Game Card Titles: text-2xl md:text-3xl font-bold (Bebas Neue)
- Section Headers: text-4xl md:text-5xl font-bold (Bebas Neue)
- Body Text: text-base md:text-lg (Inter)
- Admin Interface: text-sm to text-base (Inter)
- Button Text: text-sm md:text-base font-semibold uppercase tracking-wide

### Layout System

**Spacing Primitives:** Use Tailwind units of 4, 6, 8, 12, and 16
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16, py-20
- Grid gaps: gap-4, gap-6, gap-8
- Margins: m-4, m-6, m-8

**Container Structure:**
- Max width: max-w-7xl for main content
- Section padding: px-4 md:px-6 lg:px-8
- Admin panel: max-w-6xl for form areas

### Component Library

#### Public Landing Page Components

**Hero Section:**
- Full-width hero with dynamic gaming imagery (use action-packed sports betting/gaming themed background)
- Height: min-h-screen with flex centering
- Overlay: Dark gradient overlay (implement with backdrop-blur)
- Content: Centered headline "AGAINST THE SPREAD" with tagline "Your Gateway to Competitive Gaming"
- CTA Button: Large, prominent "View Games" with blurred background (glassmorphism effect)

**Game Cards Grid:**
- Layout: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Card structure: Elevated cards with subtle shadow and border
- Card padding: p-6
- Elements per card:
  - Game icon/thumbnail placeholder (aspect-ratio-square, rounded-lg)
  - Game title (Bebas Neue, text-2xl)
  - Brief description (2-3 lines, text-gray-600)
  - "Play Now" button (full-width, prominent)
  - Player count/status badge (top-right corner)

**Navigation:**
- Sticky header with backdrop blur
- Left: "ATS" logo/brand (Bebas Neue, text-2xl)
- Right: "Admin" link (small, unobtrusive)
- Height: h-16
- Padding: px-6

**Footer:**
- Simple, centered layout
- Copyright text
- Social links (if applicable)
- Admin access link
- Padding: py-8

#### Admin Portal Components

**Admin Header:**
- Two-section layout: "Game Management" title + "Add New Game" button
- Breadcrumb: "Dashboard > Games"
- Background: Subtle elevated surface

**Game Management Table:**
- Clean table with alternating row backgrounds
- Columns: Game Name | URL | Status | Actions
- Actions: Edit (icon), Delete (icon), Toggle Active (switch)
- Responsive: Stack to cards on mobile (hidden table headers)

**Add/Edit Game Form:**
- Layout: Single column, max-w-2xl centered
- Form fields with consistent spacing (space-y-6):
  - Game Name (text input)
  - Game URL (text input with validation)
  - Description (textarea, rows-4)
  - Active Status (toggle switch)
  - Game Icon URL (optional text input with preview)
- Submit button: Full-width, primary style
- Cancel button: Secondary, outline style

**Admin Authentication:**
- Simple centered login card (max-w-md)
- Username and password fields
- "Login" button
- Minimal, focused design

## Images

**Hero Background:**
- Description: Dynamic, high-energy sports betting or gaming action shot. Think stadium lights, game action, or abstract geometric patterns with motion blur suggesting speed and competition. Dark enough to support white text with good contrast.
- Placement: Full-width background for hero section
- Treatment: Overlay with dark gradient (top to bottom, opacity 60-80%)

**Game Card Placeholders:**
- Description: Square thumbnails for each game (can be screenshots or icons)
- Placement: Top of each game card
- Size: aspect-ratio-square, rounded corners
- Treatment: Subtle border, hover scale effect

## Animations & Interactions

**Minimal Animation Strategy:**
- Card hover: Subtle lift (translate-y-1) + shadow enhancement
- Button hover: Slight scale (scale-105)
- Hero CTA: Gentle pulse animation to draw attention
- Admin table rows: Highlight on hover
- Form validation: Shake animation on error
- NO scroll-triggered animations
- NO complex transitions beyond these basics

## Accessibility & Responsive Behavior

**Breakpoints:**
- Mobile-first approach
- md: 768px (2-column game grid)
- lg: 1024px (3-column game grid)

**Touch Targets:**
- All buttons: min-h-12 for adequate touch area
- Table action icons: Minimum 40px × 40px

**Form Accessibility:**
- All inputs have associated labels (sr-only if visually hidden)
- Error states clearly indicated with text + color
- Focus states prominent on all interactive elements

## Layout Specifications

**Public Landing Structure:**
1. Hero Section (min-h-screen)
2. Games Grid Section (py-16, multiple rows as games are added)
3. Footer (py-8)

**Admin Portal Structure:**
1. Admin Header with navigation
2. Main content area with sidebar option for future expansion
3. Centered forms/tables with ample whitespace

**Vertical Rhythm:**
- Consistent section padding: py-12 (mobile), py-16 (tablet), py-20 (desktop)
- Card spacing: gap-6 for grid layouts
- Form field spacing: space-y-6

This design balances the energetic, competitive spirit of gaming with clean, functional admin tools for easy content management.
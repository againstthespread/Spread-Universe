# Fantasy Football League Platform - Design Guidelines

## Design Approach: Reference-Based
**Primary Reference:** ESPN Fantasy Football & Yahoo Fantasy Sports - known for clean data presentation, intuitive navigation, and sports-focused visual hierarchy.

**Key Principles:**
- Sports-centric professionalism with clear data hierarchy
- Action-oriented design emphasizing weekly picks and standings
- Mobile-first responsive layouts for on-the-go league management
- Trust-building through familiar fantasy sports patterns

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: `222 95% 21%` (NFL Navy #013369) - Headers, primary buttons, nav
- Secondary: `355 93% 44%` (Football Red #D50A0A) - CTAs, alerts, active states
- Accent: `43 100% 54%` (Field Gold #FFB612) - Highlights, badges, wins
- Background: `210 17% 98%` (Clean White #F8F9FA) - Main background
- Surface: `0 0% 100%` - Cards, modals
- Text Primary: `210 17% 19%` (Dark Slate #2C3E50)
- Text Secondary: `210 10% 40%` - Supporting text
- Success: `142 71% 41%` (Win Green #28A745) - Win indicators
- Danger: `355 93% 44%` - Loss indicators
- Border: `210 14% 89%` - Card borders, dividers

**Dark Mode:**
- Primary: `222 40% 65%` - Lighter navy for dark backgrounds
- Background: `210 17% 10%` - Dark slate
- Surface: `210 17% 14%` - Cards elevated
- Text Primary: `210 17% 95%`
- Borders: `210 14% 22%`

### B. Typography

**Font Families:**
- Primary: 'Inter', sans-serif (via Google Fonts)
- Headings: 'Roboto', sans-serif (via Google Fonts) - Bold for impact
- Monospace: Use for scores, records (e.g., "12-4-1")

**Scale:**
- Hero/Page Titles: text-4xl font-bold (Roboto)
- Section Headers: text-2xl font-semibold (Roboto)
- Card Titles: text-lg font-semibold (Inter)
- Body: text-base (Inter)
- Small/Meta: text-sm text-slate-500
- Tiny/Labels: text-xs uppercase tracking-wide

### C. Layout System

**Spacing Primitives:** Use Tailwind units: 2, 4, 6, 8, 12, 16, 20, 24
- Card padding: p-6
- Section spacing: py-12 md:py-20
- Component gaps: gap-4 to gap-8
- Button padding: px-6 py-3

**Containers:**
- Max width: max-w-7xl for dashboard layouts
- Content areas: max-w-4xl for forms, picks
- Centered: mx-auto for consistent alignment

**Grid Systems:**
- League cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Standings table: Full-width responsive with horizontal scroll on mobile
- Pick grid: grid-cols-1 md:grid-cols-2 gap-4

### D. Component Library

**Navigation:**
- Top nav with logo, league selector dropdown, user menu
- Secondary nav tabs for League Dashboard/My Picks/Standings/Schedule
- Sticky header on scroll (bg-white/dark shadow-md)
- Mobile: Hamburger menu with slide-out drawer

**League Cards (Dashboard):**
- White/dark surface cards with shadow-sm hover:shadow-lg transition
- League name as card title (text-xl font-bold)
- Member count badge (e.g., "12/12" with accent gold background)
- Quick stats: Your record, current rank
- "View League" button (primary navy)

**Weekly Pick Interface:**
- Game cards showing matchup (Team @ Team with spread)
- Spread displayed prominently: "-3.5" in accent gold
- Radio buttons or toggle for pick selection
- Lock indicator showing time until first game starts (dynamic deadline)
- "Submit Picks" sticky footer button (secondary red, full-width on mobile)
- Visual confirmation of submitted picks (success green checkmark)

**Standings Table:**
- Sticky header row with sortable columns
- Columns: Rank, User, W-D-L, NPW, Pick Win %
- Row hover states (bg-slate-50 dark:bg-slate-800)
- Your row highlighted with subtle accent gold border-l-4
- Playoff indicator (top 50% of teams) with playoff badge
- Responsive: Stack on mobile as cards showing key stats

**Admin Panel:**
- Clean form layouts for game/spread input
- Tuesday workflow: Add games with spreads in a table format
- Result input: Quick-entry checkboxes for winners
- "Calculate Results" prominent CTA button
- Confirmation modals for destructive actions

**Buttons:**
- Primary: bg-navy text-white hover:bg-navy/90
- Secondary: bg-red text-white hover:bg-red/90
- Outline: border-2 border-navy text-navy hover:bg-navy/5
- Disabled: opacity-50 cursor-not-allowed

**Badges & Indicators:**
- Win badge: bg-green text-white rounded-full px-3 py-1
- Draw badge: bg-slate-400
- Loss badge: bg-red
- Locked picks: Lock icon with text-slate-400
- Playoff seed: Gold star icon

**Forms:**
- Input fields: border-slate-300 focus:border-navy focus:ring-2 focus:ring-navy/20
- Labels: text-sm font-medium text-slate-700 mb-2
- Error states: border-red text-red-600 with error message below
- Dropdowns: Custom styled with chevron icons

**Modals:**
- Overlay: bg-black/50 backdrop-blur-sm
- Content: bg-white rounded-lg shadow-2xl max-w-lg p-8
- Close button: top-right X icon
- Actions: Right-aligned button group

### E. Animations

**Minimal Motion:**
- Card hover: transform scale-105 transition-all duration-200
- Button press: active:scale-95
- Page transitions: Fade in content opacity-0 to opacity-100 duration-300
- Loading states: Subtle pulse animation on skeleton screens
- NO scroll-triggered animations

## Images

**Hero Section:** 
Large hero image of an NFL stadium field with dramatic lighting (1920x600px). Overlay with dark gradient (black/90 to transparent) to ensure text readability. Place "Join Your League" headline and "Create League" CTA over the image.

**Empty States:**
Illustration of a football and clipboard for "No leagues yet" state (400x300px). Keep style flat and friendly, using brand colors.

**User Avatars:**
Circular avatar placeholders (48x48px) with user initials on navy background if no photo uploaded.

## Page-Specific Layouts

**Landing Page (if implementing):**
- Full-width hero with field image, headline, CTA
- 3-column feature grid: "Create Leagues" / "Weekly Picks" / "Track Standings"
- How It Works: 4-step timeline
- CTA section: "Start Your League Today"

**Dashboard:**
- Header: Welcome message, create league button
- My Leagues grid: 3-column card layout
- Quick Actions sidebar: This week's deadline, upcoming games

**League View:**
- Tab navigation (Overview/Picks/Standings/Schedule)
- Overview: League info, this week's matchups, recent results
- Responsive layout: Sidebar on desktop (league stats), stacked on mobile

**Playoffs Bracket:**
- Tournament bracket visualization with connecting lines
- Seed numbers in gold badges
- Matchup cards showing users and scores
- Championship trophy icon for final winner

## Responsive Breakpoints
- Mobile: < 768px (single column, stacked navigation)
- Tablet: 768px - 1024px (2-column grids, condensed tables)
- Desktop: > 1024px (3-column grids, full tables, sidebar layouts)
# NFL Score Prediction Platform - Design Guidelines

## Design Approach

**Hybrid Approach**: Drawing inspiration from ESPN's data clarity and DraftKings' prediction interfaces, combined with Material Design principles for consistent, efficient interactions. The design prioritizes quick data scanning, effortless input, and real-time feedback while maintaining sports authenticity.

**Core Principles**:
- Data-first hierarchy: Scores, odds, and game info should be instantly scannable
- Frictionless prediction entry: Minimize clicks between viewing games and submitting picks
- Trust through transparency: Display crowd-sourced data with confidence
- Mobile-optimized: Primary usage expected on mobile devices

---

## Typography System

**Font Families**:
- Primary: Inter (via Google Fonts) - Clean, modern sans-serif for UI elements, stats, and body text
- Accent: Bebas Neue - Bold, sports-style typography for headings and game emphasis

**Hierarchy**:
- Page Headers: Bebas Neue, 48px (mobile: 32px), tracking-wide
- Section Titles: Bebas Neue, 32px (mobile: 24px)
- Game Cards - Team Names: Inter Bold, 20px
- Game Cards - Scores/Odds: Inter Bold, 24px
- Game Cards - Metadata: Inter Regular, 14px
- Body Text: Inter Regular, 16px
- Button Text: Inter Semibold, 16px
- Small Labels: Inter Medium, 12px, uppercase, tracking-wider

---

## Layout System

**Spacing Primitives**: Consistent use of Tailwind units: `2, 4, 6, 8, 12, 16, 20`
- Micro spacing (form fields, icons): `p-2`, `gap-2`
- Component internal: `p-4`, `gap-4`
- Section padding: `py-12` (mobile), `py-20` (desktop)
- Major sections: `mb-16`, `mb-20`

**Container Strategy**:
- Max width: `max-w-7xl` for main content
- Game grids: `max-w-6xl` for optimal card layout
- Forms: `max-w-2xl` for prediction inputs

**Grid System**:
- Desktop: 2-3 columns for game cards (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Tablet: 2 columns
- Mobile: Single column, full-width cards

---

## Component Library

### Navigation Header
**Structure**: Sticky top navigation with transparent-to-solid transition on scroll
- Logo/Branding (left): Site name in Bebas Neue
- User info (right): Display username, logout button
- Admin indicator: Badge showing "ADMIN" for admin users
- Mobile: Hamburger menu collapsing to drawer

### Hero Section (Landing/Login)
**Layout**: Split-screen approach
- Left (50%): Login form card with soft shadow, centered vertically
- Right (50%): Large hero image showing NFL stadium atmosphere
- Image: Full-bleed, slightly darkened overlay for text readability
- Mobile: Stacked - hero image 40vh, form below

**Hero Image**: Professional NFL stadium shot - crowd energy, lights, field view. Should convey excitement and competitive atmosphere.

### Game Cards (Core Component)
**Structure**: Card-based design with clear visual hierarchy
- Header: Game date/time, venue (small, muted)
- Team Section: Two-row layout with team names
  - Each team: Logo placeholder (32x32), Name (bold)
  - Score inputs: Large number inputs (48px height) centered between teams
- Divider: Subtle line with "VS" centered
- Footer Stats: Two-column grid
  - Left: "O/U: [number]" with trend indicator
  - Right: "Spread: [team] -[number]" with trend indicator
- Action: "Submit Prediction" button (full-width on mobile, right-aligned desktop)

**Card Styling**:
- Border radius: `rounded-lg`
- Padding: `p-6`
- Shadow: Elevated on hover (`hover:shadow-xl transition-shadow`)
- Spacing between cards: `gap-6`

### Admin Dashboard
**Layout**: Clean table-based interface for game management
- Add Game Form: Compact horizontal form at top
  - Fields: Team 1, Team 2, Date, Time (side-by-side on desktop)
  - Add button: Prominent, right-aligned
- Games List: Table with columns
  - Matchup | Date/Time | Predictions Count | Actions
  - Actions: Edit, Delete (icon buttons)
- Responsive: Stack form fields vertically on mobile, cards instead of table

### Prediction Input Interface
**Layout**: Streamlined single-page view
- Week Header: "Week [X] Predictions" with current week auto-highlighted
- Filter Tabs: "All Games" | "Unpredicted" | "My Picks" (pill-style tabs)
- Game Grid: Cards showing all games
- Sticky Summary Footer: Shows "X of Y games predicted" with "Submit All" CTA

**Input Interaction**:
- Score inputs: Number type with increment/decrement buttons
- Auto-calculate: Display calculated O/U and spread immediately as user types
- Visual feedback: Subtle highlight when prediction differs from crowd average
- Save state: Auto-save drafts to localStorage

### Authentication Views
**Login Screen**:
- Centered card (max-w-md)
- Form fields: Username, Password (stacked, full-width)
- Primary CTA: "Login" button (full-width)
- Secondary link: "Create Account" (text link below)

**Registration Screen**:
- Similar card layout
- Fields: Username, Password, Confirm Password
- Validation: Real-time feedback on password strength

### Statistics Display
**Leaderboard Component** (Future feature foundation):
- Table showing most accurate predictors
- Columns: Rank | Username | Accuracy % | Games Predicted
- Sortable columns

**Trend Indicators**:
- Arrow icons for spread movement (up/down)
- Percentage change display for volatile predictions
- Small charts showing prediction distribution

---

## Forms & Inputs

**Text Inputs**:
- Height: `h-12`
- Padding: `px-4`
- Border radius: `rounded-md`
- Focus state: Ring effect with transition

**Number Inputs (Score Entry)**:
- Large touch targets: `h-16`
- Center-aligned text: `text-center`
- Bold font: `font-bold text-2xl`
- Increment buttons: `+/-` styled as icon buttons on sides

**Buttons**:
- Primary: Height `h-12`, padding `px-8`, rounded `rounded-lg`
- Text: Semibold, 16px
- Icon buttons: Square `w-10 h-10`, rounded `rounded-full`
- Disabled state: Reduced opacity with cursor-not-allowed

**Select Dropdowns**:
- Week selector: Prominent, top of prediction page
- Styled to match input fields

---

## Data Visualization

**Odds Display**:
- Large, bold numbers for current crowd-sourced odds
- Comparison to Vegas lines (when available): Small text showing difference
- Confidence indicator: Based on prediction count (e.g., "Based on 23 predictions")

**Prediction Distribution** (Optional enhancement):
- Simple bar chart showing score prediction clusters
- Histogram for O/U predictions

---

## Responsive Breakpoints

**Mobile-First Approach**:
- Base (< 640px): Single column, stacked layouts
- md (768px+): 2-column game grids, horizontal forms
- lg (1024px+): 3-column grids, full navigation
- xl (1280px+): Max container width, enhanced spacing

**Mobile Optimizations**:
- Larger touch targets (minimum 44x44px)
- Bottom sheet for quick predictions
- Swipe gestures for navigating between weeks
- Sticky "Submit" button at bottom

---

## Accessibility

**Form Accessibility**:
- All inputs have associated labels (visible or aria-label)
- Error messages: `aria-live="polite"` for dynamic validation
- Keyboard navigation: Logical tab order through prediction inputs
- Focus indicators: Clear, high-contrast rings

**Screen Reader Support**:
- Semantic HTML (header, main, nav, article)
- ARIA labels for icon-only buttons
- Status announcements for prediction submissions

---

## Animations

**Strategic Use Only**:
- Page transitions: Subtle fade-in for route changes (200ms)
- Card hover: Gentle scale (1.02) and shadow elevation
- Form submission: Loading spinner, success checkmark animation
- Real-time updates: Gentle highlight pulse when odds change
- NO scroll-triggered animations, NO complex parallax effects

---

## Images

**Hero Section**:
- Large hero image: Professional NFL stadium photograph
- Placement: Right 50% of split-screen login view
- Treatment: Subtle dark overlay (opacity 0.3) for text legibility on buttons
- Buttons over image: Use backdrop-blur for background, maintain clean white text

**Team Logos**:
- Placeholders throughout (32x32px circular or square with rounded corners)
- Consistent sizing across all card instances

**Empty States**:
- Illustration or icon for "No predictions yet" states
- Friendly, minimal graphics

This design creates a professional, data-focused sports prediction platform that balances clarity with visual appeal, optimized for frequent use and quick decision-making.
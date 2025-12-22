# NFL Playoffs ATS Design Guidelines

## Design Approach
**System:** Modern sports data platform inspired by ESPN Fantasy, DraftKings, and Linear's clarity, with emphasis on data density, quick scanning, and efficient interaction patterns optimized for sports pick'em gameplay.

## Core Design Principles
1. **Data-First Clarity**: Spreadsheet-inspired layouts that prioritize information hierarchy and quick decision-making
2. **Game-Ready Speed**: Minimal friction for making picks with clear visual feedback
3. **Competitive Context**: Leaderboard prominence to drive engagement and competitive dynamics

## Typography System
- **Primary Font**: Inter (Google Fonts) for clean data readability
- **Accent Font**: Bebas Neue for round headers and bold playoff atmosphere
- **Hierarchy**:
  - H1 (text-4xl font-bold): Page titles, "NFL Playoffs ATS"
  - H2 (text-2xl font-bold uppercase tracking-wide): Round names (WILD CARD, DIVISIONAL, etc.)
  - H3 (text-xl font-semibold): Section headers, user names in leaderboard
  - Body Large (text-base font-medium): Team names, matchup data
  - Body Small (text-sm): Spreads, point values, metadata
  - Caption (text-xs): Timestamps, helper text

## Layout System
**Spacing Units**: Use Tailwind units of 2, 4, 6, 8, 12, and 16 (e.g., p-4, gap-6, mb-8)

**Container Strategy**:
- Max-width: max-w-7xl for main content
- Dashboard grid: Two-column split on desktop (sidebar + main), single column on mobile
- Responsive breakpoints: Stack at md breakpoint

## Component Library

### Authentication Pages
- Centered card layout (max-w-md) on full-height screen
- Logo/title at top with large NFL football icon from Font Awesome
- Clean input fields with label-above pattern
- Full-width primary button
- Role toggle for admin/user during login
- "Remember me" checkbox, "Forgot password" link

### Navigation & Header
- Fixed top navigation bar with logo left, user info/logout right
- Active route indication with border-b treatment
- Admin nav: Dashboard, Games Management, Results Entry, Users
- User nav: Make Picks, My Performance, Leaderboard
- Mobile: Hamburger menu with slide-out drawer

### Admin Dashboard
**Games Management Table**:
- Dense table layout with columns: Round, Matchup, Spread, Game Date, Status, Actions
- Inline editing capability with pencil icon (Font Awesome)
- Add Game floating action button (bottom-right corner)
- Round grouping with collapsible sections
- Status badges (Upcoming, Live, Final) with distinct visual treatments

**Results Entry Interface**:
- Two-column card grid showing all active games
- Each card: Team names, score inputs, spread display, submit button
- Batch update option for multiple games
- Clear visual distinction between entered and pending results

### User Pick Interface
**Round-Based Layout**:
- Vertical stack of round sections with round name banner
- Point value badge prominently displayed (e.g., "250 PTS")
- Matchup cards in grid (grid-cols-1 md:grid-cols-2)
- Each card contains: Team A, spread indicator, Team B, radio buttons for selection
- Lock indicator icon when game has started (Font Awesome lock)
- Submit picks button sticky at bottom of each round section

**Pick Status Display**:
- Visual feedback system without color: checkmark icon (correct), X icon (incorrect), clock icon (pending)
- Distinct border treatments to differentiate states
- Score display when results are in

### Leaderboard
**Table Structure**:
- Rank, User Name, Total Points, Max Possible, Remaining Points columns
- Sticky header on scroll
- Current user row highlighted with distinct border treatment
- Trophy icon (Font Awesome) for top 3 positions
- Expandable detail view to see user's individual picks

**Personal Stats Card** (above leaderboard):
- Large point total display with label
- Progress bar showing points/max possible ratio
- Quick stats grid: Correct picks count, Win percentage, Current rank

### Forms & Inputs
- Input fields: border treatment with focus state indication
- Radio buttons for picks: Large clickable areas with team names
- Select dropdowns for filters (Round selection, Game status)
- Date/time pickers for game scheduling (admin)
- Helper text below inputs for guidance

### Data Tables
- Alternating row treatment for readability
- Hover state for interactive rows
- Sortable columns with arrow indicators
- Pagination for large datasets (10-20 items per page)
- Mobile: Transform to stacked cards showing key information

### Dashboard Cards
- Consistent card structure: Header with icon, content area, optional footer action
- Admin overview cards: Total games, Pending results, Active users, Current round
- Shadow elevation for depth perception
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4

## Spacing & Rhythm
- Page padding: px-4 md:px-8, py-6 md:py-12
- Section spacing: mb-12 md:mb-16
- Card padding: p-6
- Form field gaps: gap-4
- Table cell padding: px-4 py-3
- Grid gaps: gap-4 md:gap-6

## Icons
**Font Awesome (via CDN)** - Sports-optimized icon set:
- Football: fas fa-football-ball
- Trophy: fas fa-trophy
- Lock: fas fa-lock
- Check: fas fa-check-circle
- X: fas fa-times-circle
- Clock: fas fa-clock
- Edit: fas fa-pencil-alt
- User: fas fa-user-circle
- Dashboard: fas fa-chart-line
- Calendar: fas fa-calendar-alt

## Responsive Behavior
- Mobile-first approach
- Tables transform to card layouts on mobile
- Navigation collapses to hamburger menu
- Two-column layouts stack to single column at md breakpoint
- Fixed positioning for important CTAs on mobile (submit picks button)

## Interactive States
- Disabled state for locked picks with reduced opacity and lock icon
- Loading states with spinner for result submissions
- Confirmation modals for admin actions (entering results)
- Toast notifications for pick submissions, result updates
- Skeleton screens for initial data loading

## Images
No hero images needed. This is a data-focused utility application where functionality and clarity take precedence over decorative imagery. Team logos may be incorporated as small icons if needed for visual recognition.
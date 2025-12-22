# NFL Weather Dashboard Design Guidelines

## Design Approach
**System-Based Design** using Material Design principles optimized for data-heavy sports applications. Reference ESPN's dashboard clarity and The Athletic's modern sports interfaces for information hierarchy.

## Core Design Principles
- **Data-First**: Weather metrics and game info take visual priority
- **Scannable Layout**: Quick visual parsing of 16+ games simultaneously
- **Decision Support**: Clear visual indicators for fantasy-relevant conditions

## Typography System
- **Headers**: Bold, condensed sans-serif (600-700 weight) for team names and locations
- **Data Points**: Tabular figures, medium weight (500) for weather metrics
- **Labels**: Small caps or uppercase for category headers (TEMPERATURE, WIND, etc.)
- **Hierarchy**: Large title (2.5rem) → Section headers (1.5rem) → Data (1rem) → Labels (0.875rem)

## Layout System
**Spacing Units**: Tailwind 2, 4, 6, 8 for consistent rhythm
- Container: `max-w-7xl mx-auto px-4`
- Section spacing: `py-8` mobile, `py-12` desktop
- Card/row spacing: `gap-4` grids, `space-y-2` stacks

## Component Library

### Header
- Full-width with subtle border
- Logo/title left, refresh button + last updated timestamp right
- Sticky navigation on scroll for persistent access

### Game Cards/Rows (Primary Component)
Each game display includes:
- **Team matchup**: Away @ Home with logos (or abbreviations if no logos)
- **Stadium badge**: Dome icon or "OUTDOOR" label with distinct visual treatment
- **Weather module**: Temperature (large), precipitation %, wind speed in compact grid
- **Fantasy indicator**: Color-coded bar or badge showing QB/WR favorable vs RB favorable conditions
- **Game time**: Day + time in user's timezone

Layout: Card-based on mobile (stacked), table-row on desktop (scannable grid)

### Weather Icons
Use Heroicons or Font Awesome for: sun, cloud-rain, snowflake, wind indicators
Position inline with metrics, sized 1.25rem

### Action Elements
- **Refresh Button**: Prominent, top-right with loading state spinner
- **Auto-reset indicator**: Small banner showing "Next reset: Tuesday 8AM EST"

### Data Visualization
- **Weather bars**: Horizontal mini-bars showing wind speed intensity
- **Condition badges**: Pill-shaped tags for "IDEAL PASSING" or "RB WEATHER"
- **Stadium icons**: Simple dome vs open-air visual distinction

## Responsive Strategy
- **Mobile (base)**: Stacked cards, 1 column, full weather details per game
- **Tablet (md:)**: 2-column grid of condensed cards
- **Desktop (lg:)**: Table layout with 6-8 columns (Teams | Stadium | Temp | Precip | Wind | Forecast | Fantasy Edge)

## Page Structure
1. **Dashboard Header** (h-16): Title, week indicator, refresh controls
2. **Summary Strip** (h-20): Quick stats - total domes, outdoor games, severe weather alerts
3. **Game Grid/Table** (flex-1): Main content area with all matchups
4. **Footer** (h-12): Data sources, API attribution

## Accessibility
- ARIA labels for all icon-only buttons
- Table semantic markup with proper headers
- Focus indicators on interactive elements
- High contrast ratios for weather condition badges

## Key Interactions
- Hover states on game rows highlight full row
- Refresh button shows loading spinner during API calls
- Click game row to expand additional forecast details (optional)
- Mobile: Swipe cards for additional metrics

**No images needed** - this is a pure data dashboard focused on rapid information consumption for fantasy football decisions.
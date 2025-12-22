# Against The Spread - Unified Platform Design Guidelines

## Design Approach

**Reference-Based with System Foundation**
Drawing inspiration from leading sports betting platforms (DraftKings, FanDuel, ESPN Fantasy) while using Tailwind CSS as the foundational system. This approach balances the competitive, excitement-driven nature of sports betting with the reliability required for authentication and account management.

## Core Design Principles

1. **Unified Brand Presence**: Consistent header/navigation across all sub-sites with clear site switcher
2. **Trust & Security**: Professional, polished design that instills confidence in account management
3. **Sports-First Aesthetic**: Bold, dynamic layouts that match the energy of sports content
4. **Seamless Transitions**: Smooth navigation between different platform sections

## Typography

**Font System**: 
- Primary: Inter (via Google Fonts) - clean, modern sans-serif for UI
- Accent: Barlow Condensed - bold, sporty feel for headings and stats

**Hierarchy**:
- Hero/Page Titles: text-5xl md:text-6xl font-bold (Barlow Condensed)
- Section Headers: text-3xl md:text-4xl font-bold
- Card Titles: text-xl font-semibold
- Body Text: text-base leading-relaxed
- Labels/Meta: text-sm font-medium

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Component padding: p-4 to p-8
- Section spacing: py-12 md:py-20
- Container max-width: max-w-7xl

## Component Library

### Navigation & Header
- Sticky header with transparent-to-solid transition on scroll
- Logo left, site switcher center (dropdown showing all 7 platforms), account menu right
- Mobile: Hamburger menu with full-screen overlay
- Sub-navigation tabs for each platform's specific sections

### Authentication Components
**Login Form**:
- Card-based design with subtle elevation
- Email input with validation
- Password input with show/hide toggle
- "Remember me" checkbox and "Forgot password?" link
- Primary CTA button: Full-width, prominent
- Social login options below with divider

**Password Reset Flow**:
- Step 1: Email input requesting reset code
- Step 2: Code verification (6-digit input fields)
- Step 3: New password creation with strength indicator
- Success confirmation with auto-redirect timer

**Platform Switcher**:
- Grid layout showing all 7 platforms
- Each platform card: Icon, name, quick stats (e.g., "3 active bets")
- Hover state with subtle scale transform
- Current platform highlighted

### Cards & Containers
- Rounded corners: rounded-xl
- Subtle shadows: shadow-md for elevated elements
- Border treatment: border border-gray-200 for outlined cards
- Hover states: scale-[1.02] transition-transform

### Forms
- Input fields: h-12, px-4, rounded-lg with border
- Focus state: ring-2 ring-primary ring-offset-2
- Error states: Red border with icon and message below
- Success states: Green checkmark icon

### Buttons
Primary: Full padding (px-6 py-3), rounded-lg, font-semibold
Secondary: Outlined with border-2
Tertiary: Text-only with underline on hover

## Account Management Dashboard

**Layout**:
- Sidebar navigation (left, 250px) with platform quick-links
- Main content area with tabbed sections:
  - Account Settings
  - Linked Platforms (showing all 7 sites)
  - Security (password, 2FA, active sessions)
  - Preferences (notifications, display)

**Stats Overview**:
- Grid of 4 metric cards at top showing cross-platform activity
- Quick access to each platform's dashboard

## Visual Enhancements

**Icons**: Font Awesome via CDN for universal recognition
- Lock icon for security features
- Shield icon for account protection
- Grid icon for platform switcher
- Arrow icons for navigation

**Animations**: Minimal and purposeful
- Page transitions: Fade in content (300ms)
- Form submissions: Button loading spinner
- Success states: Checkmark animation
- No distracting scroll effects

## Images

**Hero Section**: Not applicable for authentication flows
**Platform Cards**: Use sport-specific imagery or icons for each of the 7 platforms
- CrowdLine: Crowd/stadium imagery
- MarchMadness: Basketball court/bracket
- FantasyStream: Multi-sport montage
- Gambling League: Casino/odds boards
- PostseasonATS: Trophy/championship imagery
- Football Weather: Weather + football field

**Account Dashboard**: Avatar placeholder with initials if no profile photo

## Responsive Behavior

- Desktop (lg): Full sidebar + multi-column layouts
- Tablet (md): Collapsible sidebar, 2-column grids
- Mobile (base): Single column, bottom tab navigation for platforms

## Critical Features

**Cross-Platform Session**:
- Single sign-on indicator showing active session across all 7 sites
- Clear logout option that affects all platforms
- Session timeout warning (15 minutes before expiry)

**Password Reset**:
- Code valid for 15 minutes
- Resend option with 60-second cooldown
- Clear expiration timer displayed
- Success message: "Password updated. You can now access all 7 platforms."

**Trust Indicators**:
- SSL badge in footer
- "Your data is encrypted" messaging
- Last login timestamp display
- Active sessions list with device info
# Club Cult Design Guidelines

## Design Approach

**Selected Approach**: Hybrid Design System
- Foundation: Modern SaaS dashboard aesthetics (Linear, Notion) for admin interfaces
- Student-facing: Event discovery platform inspiration (Eventbrite, Luma) with vibrant, engaging cards
- Key Principle: Professional utility for admins, exciting discovery for students

## Typography System

**Font Family**: Inter (Google Fonts)
- Display Headlines (Hero sections): 48px, Bold (font-bold)
- Page Titles: 36px, Bold (text-3xl font-bold)
- Section Headings: 24px, Semibold (text-2xl font-semibold)
- Card Titles: 20px, Semibold (text-xl font-semibold)
- Body Text: 16px, Regular (text-base)
- Secondary Text: 14px, Regular (text-sm)
- Caption/Metadata: 12px, Medium (text-xs font-medium)

**Hierarchy Notes**:
- Event titles prominently displayed, always above metadata
- Price/capacity badges use 14px bold for visibility
- Form labels 14px medium, inputs 16px for readability

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 (forms, cards), p-6 (modals), p-8 (page containers)
- Vertical spacing: space-y-4 (tight groupings), space-y-6 (section elements), space-y-8 (page sections)
- Margins: mb-8 between major sections, mb-4 between related elements
- Grid gaps: gap-4 (tight), gap-6 (standard cards), gap-8 (hero layouts)

**Container System**:
- Max-width content: max-w-7xl mx-auto (main content)
- Form containers: max-w-2xl mx-auto
- Modal dialogs: max-w-lg to max-w-2xl based on content
- Full-width sections with inner max-w-7xl for content centering

## Component Library

### Navigation
**Header Navigation** (Student & Admin):
- Fixed top bar, h-16, with backdrop blur (backdrop-blur-lg bg-white/80)
- Logo left, navigation center, user profile/actions right
- Mobile: Hamburger menu, slide-in drawer
- Admin: Additional quick-create button in header

**Sidebar Navigation** (Admin Dashboard):
- Fixed left sidebar, w-64, full-height
- Collapsible on mobile (overlay drawer)
- Icon + label navigation items
- Active state with subtle background fill

### Event Cards (Student Homepage)
**Grid Layout**: 
- Desktop: grid-cols-3, gap-6
- Tablet: grid-cols-2, gap-4
- Mobile: grid-cols-1, gap-4

**Card Structure**:
- Aspect ratio 16:9 banner image at top
- p-4 content area below image
- Title (text-xl font-semibold) with 2-line truncation
- Metadata row: date/time icon + venue icon (text-sm)
- Bottom row: Price badge left, "Register" button right
- Hover: Subtle lift (transform translate-y-[-4px]) + shadow increase

**Badge Components**:
- "Free" badge: rounded-full px-3 py-1 with background
- "Spots Left" counter: text-sm with warning styling at <20%
- Status badges: "Sold Out", "Registered", "Trending" - rounded-full px-3 py-1

### Event Detail Page
**Hero Section**:
- Full-width banner image (h-96 on desktop, h-64 mobile)
- Gradient overlay at bottom for text readability
- Title + quick metadata overlaid on image bottom
- Sticky "Register Now" button floats bottom-right on scroll

**Content Layout**:
- Two-column on desktop (8-col content, 4-col sidebar)
- Sidebar contains: Date/time card, venue card, organizer card, share buttons
- Single column mobile with sidebar content after description
- Rich text description with generous line-height (leading-relaxed)

### Forms (Registration & Event Creation)
**Input Fields**:
- Height: h-12 for all inputs (touch-friendly)
- Border: rounded-lg with focus ring
- Label above input: text-sm font-medium mb-2
- Error state: red border + error message below (text-sm)
- Required indicator: asterisk in label

**Multi-Step Forms** (Event Creation):
- Progress indicator at top (3 steps)
- Each section in separate card with h-fit
- "Continue" primary button, "Back" secondary button
- Save draft option always visible

**Form Layout**:
- Single column: max-w-2xl mx-auto
- Input groupings: space-y-4
- Related fields: grid-cols-2 gap-4 (e.g., start/end times)

### Dashboard Widgets (Admin)
**Stats Cards**:
- Grid: grid-cols-4 gap-4 (desktop), grid-cols-2 (mobile)
- Card: p-6, rounded-xl with subtle border
- Large number: text-3xl font-bold
- Label below: text-sm
- Icon in top-right corner

**Data Tables**:
- Alternating row backgrounds for readability
- Fixed header with sticky positioning
- Action buttons in last column (icon buttons)
- Responsive: Horizontal scroll on mobile with fixed first column

**Charts**:
- Embedded in cards with p-6 padding
- Use Recharts library with consistent styling
- Legend at bottom, grid lines subtle

### Modals & Overlays
**Modal Structure**:
- Centered overlay with backdrop (bg-black/50)
- Content card: rounded-2xl, p-6 to p-8
- Close button: absolute top-right
- Max height with scroll: max-h-[90vh] overflow-y-auto

**Success Modals**:
- Centered icon (checkmark animation)
- Success message: text-2xl font-bold
- Supporting text: text-base
- Primary action button below
- Confetti animation for registration success

### Buttons
**Primary Button**:
- h-12, px-6, rounded-lg
- Font: text-base font-semibold
- Disabled: opacity-50 cursor-not-allowed
- Loading: Spinner + "Processing..." text

**Secondary Button**:
- Same sizing as primary
- Outlined style with border-2

**Icon Buttons**:
- Square: h-10 w-10
- Rounded: rounded-lg
- For table actions, quick actions

### Tickets & QR Codes
**Ticket Card**:
- Max-width: max-w-md, centered
- White card with border, rounded-2xl
- QR code: 256x256px, centered
- Ticket ID below QR in monospace font
- Event details in condensed layout below
- Download PDF button at bottom

## Images

**Hero Images**:
- Student Homepage: Large hero banner (h-[500px]) with event collage or campus culture image, gradient overlay with "Discover Campus Events" headline centered
- Event Detail Pages: Full-width 16:9 banner showing event-specific imagery (workshop, concert, competition visuals)
- Admin Dashboard: Optional subtle background pattern or none (focus on data)

**Event Banners**:
- Required for all events: 1600x900px (16:9 ratio)
- Lazy loaded with skeleton placeholder
- Sharp, professional photography preferred
- Overlay gradient for text readability when needed

**Profile Images**:
- User avatars: 40x40px rounded-full in headers
- Event organizer: 64x64px rounded-full in event details
- Fallback: Initials in colored circle

**Empty States**:
- Illustrations for "No events yet", "No tickets", "No registrations"
- Simple, friendly line-art style
- Centered with message below

## Responsive Behavior

**Breakpoints**:
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md to lg)
- Desktop: > 1024px (lg+)

**Mobile Adaptations**:
- Navigation: Hamburger menu
- Event grid: Single column
- Tables: Horizontal scroll or card view
- Two-column layouts: Stack to single column
- Reduce padding: p-4 becomes p-3 on mobile
- Font sizes: Scale down by 2-4px on mobile

## Accessibility Standards

- Focus indicators: Prominent 2px ring on all interactive elements
- Form labels: Always visible, never placeholder-only
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Interactive elements: Minimum 44x44px touch targets
- Skip links: "Skip to main content" for keyboard users
- ARIA labels: On all icon-only buttons
- Loading states: Announce to screen readers

## Animation Principles

**Micro-interactions** (Use sparingly):
- Card hover: Subtle lift (150ms ease-out)
- Button press: Scale down slightly (transform scale-95, 100ms)
- Success states: Single confetti burst or checkmark animation
- Page transitions: Fade (200ms)

**Loading States**:
- Skeleton screens for content loading
- Spinner for action processing
- Progress bar for multi-step processes

**NO animations for**:
- Scroll effects
- Parallax
- Auto-playing carousels
- Excessive page transitions
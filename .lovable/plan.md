

## UI Modernization Plan — POA+SOCIAL BID

### Current State Assessment

The app has a solid foundation: dark sidebar, breadcrumb topbar, card-based layouts, and Recharts visualizations. However, the UI feels flat and utilitarian. Key areas for improvement:

- **Sidebar**: Functional but plain; no visual depth, no hover animations, monotone active state
- **Topbar**: Minimal and static; breadcrumbs lack interactivity polish
- **KPI Cards**: Basic left-border accent; no glassmorphism or gradient effects
- **Dashboard Cards**: Uniform white cards with no visual hierarchy or breathing room
- **Page Headers**: Plain text headers with no visual presence
- **Tables/Lists**: Standard styling, no row hover effects or visual grouping
- **General**: No subtle animations, no gradient accents, no modern depth effects

### Plan

The approach is to apply a cohesive modernization across the shared layout and key component files, keeping existing functionality intact.

#### 1. Global Styles (`src/index.css`)
- Add subtle background texture/pattern via CSS (very light dot grid on background)
- Add glass-card utility class (`backdrop-blur`, `bg-white/70`, subtle border)
- Add gradient text utility for headings
- Add smooth page transition animation (`animate-fade-in` on main content)
- Add modern hover card effect (slight lift + shadow on hover)
- Improve scrollbar styling (thinner, more subtle)
- Add a subtle shine/shimmer animation for loading states

#### 2. Sidebar (`src/components/layout/Sidebar.tsx`)
- Add subtle gradient background instead of flat color
- Improve active nav item: pill-shaped with glow effect and left indicator bar instead of full bg-primary
- Add smooth hover transitions with scale micro-animation
- Improve group labels with a subtle line accent
- Add avatar ring/glow on the user footer
- Improve collapse toggle button with smoother design

#### 3. Topbar (`src/components/layout/Topbar.tsx`)
- Add frosted glass effect (stronger backdrop-blur)
- Improve breadcrumb with chevron separators and subtle hover on segments
- Add a subtle bottom gradient border instead of plain border
- Style action buttons with softer hover states

#### 4. KPI Cards (`src/components/dashboard/KPICard.tsx`)
- Replace left-border accent with a top gradient bar
- Add subtle background gradient per variant
- Add hover lift effect with shadow transition
- Improve icon container with gradient background

#### 5. Dashboard Page (`src/pages/Dashboard.tsx`)
- Improve section dividers with gradient line and icon
- Add staggered fade-in animation to card grid
- Improve header with gradient text accent
- Style chart cards with subtle header gradients
- Improve context metrics cards with modern card styling

#### 6. App Layout (`src/components/layout/AppLayout.tsx`)
- Add fade-in animation to main content area on route change

#### 7. PEP Cockpit (`src/pages/PEP/Detalhe.tsx`)
- Improve hero card with rounded corners and shadow
- Better visual hierarchy on financial panel (gradient header)
- Improve impedimentos checklist styling
- Better evidence gallery grid with hover zoom

### Files to Edit (8 files)
1. `src/index.css` — new utility classes and animations
2. `tailwind.config.ts` — add new keyframes/animations
3. `src/components/layout/Sidebar.tsx` — modern nav styling
4. `src/components/layout/Topbar.tsx` — glass effect, better breadcrumbs
5. `src/components/layout/AppLayout.tsx` — content animation
6. `src/components/dashboard/KPICard.tsx` — modern card design
7. `src/pages/Dashboard.tsx` — visual polish
8. `src/pages/PEP/Detalhe.tsx` — cockpit visual improvements

### Design Principles
- Maintain the institutional BID navy/teal palette
- Use glassmorphism sparingly for depth
- Subtle animations (200-300ms) for polish without distraction
- Better visual hierarchy through gradients and spacing
- Keep all existing functionality intact


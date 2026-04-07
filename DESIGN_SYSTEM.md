# Focus — Design System

Complete design token reference and component specification. This is the single source of truth for every visual decision in the app.

---

## Color Palette

### Backgrounds & Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0a0a0a` | Page background (with radial gradient overlay) |
| `--color-surface` | `#141414` | Elevated surfaces: input field, bottom nav, sidebar, chips |
| `--color-surface-hover` | `#1a1a1a` | Hover state on surfaces |

**Background atmosphere:** The `#0a0a0a` base has a subtle radial gradient overlaid:
```css
background-image: radial-gradient(
  ellipse at 50% 0%,
  rgba(255, 107, 53, 0.03) 0%,
  transparent 60%
);
```
This creates an almost imperceptible warm glow from the top center.

### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--color-border` | `#222222` | Default borders, dividers, input outlines |
| `--color-border-light` | `#333333` | Hover borders, checkbox borders, emphasized edges |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text` | `#e8e4df` | Primary text (warm off-white, never pure white) |
| `--color-text-dim` | `#6b6560` | Secondary text, labels, metadata, inactive nav |
| `--color-text-faint` | `#3d3a37` | Minimum contrast: placeholders, ghost text, hints |
| `--color-done-text` | `#3a3a3a` | Completed task text (with line-through) |

### Accent & Status

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent` | `#ff6b35` | Active states, focus rings, active chips, CTA elements |
| `--color-accent-glow` | `rgba(255, 107, 53, 0.15)` | Focus halos, input glow, active chip box-shadow |
| `--color-danger` | `#ff3b30` | Delete actions, overdue dates |
| `--color-urgent` | `#ff3b30` | Priority 1 dot |
| `--color-high` | `#ff9f0a` | Priority 2 dot |
| `--color-normal` | `#30d158` | Priority 3 dot |

### Color Rules
- Background is near-black, **never** pure black
- Text is warm off-white, **never** pure white (`#fff`)
- Accent orange is used **sparingly** — active tab, focus ring, active chips, completion flash
- Borders are barely visible — they define edges without drawing attention
- Completed items use grays (`#2a2a2a` checkbox, `#555` checkmark), **never** accent color

---

## Typography

| Role | Font | Weight | Size | Letter-spacing | Usage |
|------|------|--------|------|----------------|-------|
| Display | Playfair Display | 900 | 32–36px | — | App title only (sidebar brand) |
| View title | DM Sans | 700 | 32px | -0.02em | "Inbox", "Today", "Upcoming" in header |
| Body | DM Sans | 400 | 15px | — | Task text |
| Caption | DM Sans | 500 | 11–12px | — | Labels, metadata, chip text, date badges |
| Overline | DM Sans | 500–600 | 11–12px | 0.08–0.15em | Section headers ("VIEWS", "COMPLETED"), greeting |
| Nav label | DM Sans | 500 | 11px | — | Bottom nav item labels |

### Typography Rules
- Playfair Display is **ONLY** for the app title — nowhere else
- DM Sans does everything else
- Task text is always 15px
- `font-optical-sizing: auto` enabled globally
- `-webkit-font-smoothing: antialiased` on all text

### Title text-shadow
The view title has a barely-visible warm halo:
```css
text-shadow: 0 0 40px rgba(255, 107, 53, 0.1);
```

---

## Spacing System

Base unit: 4px. All spacing uses multiples.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps, metadata spacing |
| sm | 8px | Between related elements, chip-to-input gap |
| md | 12px | Component internal padding, gaps between sections |
| lg | 16px | Between sections |
| xl | 20px | **Page horizontal padding (mobile)** — all content |
| 2xl | 24px | Section margins (completed section) |
| 3xl | 32px | Major section breaks |
| 4xl | 48px | Header top padding (below safe area) |

### The 20px Rule
Every piece of content has exactly 20px horizontal padding from the screen edge. Backgrounds (input container, nav bar) can go edge-to-edge, but their inner content is always inset 20px.

---

## Layout

### App Shell
```
┌─────────────────────────┐
│ Header                  │  ← safe-top + 48px top padding
├─────────────────────────┤
│                         │
│ Task List (scrollable)  │  ← flex-1, min-h-0, overflow-y-auto
│                         │
├─────────────────────────┤
│ Chip Bar (when focused) │  ← animated slide-down
│ Input Field             │  ← bg-surface container
│ Bottom Nav              │  ← bg-surface, 64px height
└─────────────────────────┘
```

- **Max width:** 640px, centered on desktop
- **Input + Nav:** wrapped in a single `border-t border-border` container
- **Nav hides** when input is focused (keyboard open)
- **View swipe:** Left/right swipe on task list switches between Inbox → Today → Upcoming

### Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 640px (mobile) | Full-width, bottom nav, slide-over space picker |
| 640–1024px (tablet) | Wider padding (24px), input max-width 560px |
| > 1024px (desktop) | Centered content max-width 640px |

---

## Components

### Header

**Expanded (default):**
```
┌─────────────────────────────────┐
│                                 │  ← 48px + safe-area top padding
│  GOOD MORNING                   │  ← 12px, uppercase, 0.12em spacing, text-dim
│  Inbox                          │  ← 32px, DM Sans 700, warm text-shadow
│  3 remaining · 1 done           │  ← 13px, text-dim, 8px top margin
│  ─────────────────── (gradient) │  ← 1px, accent → transparent, 20px top margin
└─────────────────────────────────┘
```

**Collapsed (input focused):**
```
┌─────────────────────────────────┐
│  Inbox                       3  │  ← 14px semibold + count, 8px vertical padding
└─────────────────────────────────┘
```

**Stagger animation:** Greeting (0ms) → Title (80ms) → Stats (160ms), each with `taskEnter` animation.

### Task Item

**Active state:**
```
┌─────────────────────────────────┐
│  ○  ● Buy groceries for dinner  │  ← 22px checkbox, 6px priority dot, 15px text
│        Apr 11                    │  ← date pill: 11px, rgba(255,255,255,0.04) bg, 6px radius
└─────────────────────────────────┘
```

- **Padding:** 14px 20px
- **Divider:** 1px `rgba(255,255,255,0.03)` — no divider after last item
- **Hover:** background fades to `rgba(255,255,255,0.02)`, border-radius 12px
- **Active/pressed:** background `rgba(255,255,255,0.04)`, scale 0.98 (100ms)
- **Priority dot:** inline before text on the same line, 6px circle
  - Urgent: `#ff3b30`, box-shadow `0 0 6px rgba(255,59,48,0.4)`
  - High: `#ff9f0a`
  - Normal: `#30d158`
- **Date badge:** mini pill with `rgba(255,255,255,0.04)` background, `2px 8px` padding, 6px radius

**Completed state:**
- **Padding:** 10px 20px (denser)
- **Opacity:** 0.35 (hover → 0.60)
- **Checkbox:** `#2a2a2a` fill, `#555` checkmark — **never** accent color
- **Text:** `--color-done-text`, line-through

**Checkbox interaction:**
- **Default:** 22px circle, 2px solid `--color-border-light`
- **Hover:** border → `--color-accent`, box-shadow `0 0 0 4px rgba(255,107,53,0.1)`
- **Checked:** fill `#2a2a2a`, 2px border `#2a2a2a`, checkmark stroke `#555`

### Task Input

```
┌─────────────────────────────────┐
│  +  What needs doing?        ↑  │
└─────────────────────────────────┘
```

- **Container:** `--color-surface` background, 12px border-radius, 14px 16px padding
- **Default border:** 1px solid `--color-border`
- **Focus border:** 1px solid `--color-accent`
- **Focus shadow:** `inset 0 1px 2px rgba(0,0,0,0.3), 0 0 0 3px rgba(255,107,53,0.15)`
- **"+" symbol:** `--color-accent`, 20px, pulses once on focus (scale 1→1.2→1, 300ms)
- **Placeholder:** `--color-text-dim`
- **Send "↑":** `--color-accent` when text exists (fades in + slides up 200ms), `--color-text-dim` at 30% opacity when empty but focused
- **Type:** `search` (prevents Android autofill toolbar)
- **Submit feedback:** text flies up (-20px translateY, opacity 0), "+" becomes "✓", border flashes accent, haptic 8ms
- **Swipe hint:** "swipe up to send", 11px, `--color-text-dim` at 25% opacity — only visible while typing

### Chip Bar

**Container:** Frosted glass effect
```css
background: rgba(20, 20, 20, 0.8);
backdrop-filter: blur(8px);
border-top: 1px solid rgba(255, 255, 255, 0.05);
padding: 8px 0;
border-radius: 12px;
```

**Chip (inactive):**
- Border: 1px solid `--color-border`
- Background: transparent
- Text: `--color-text-dim`, 12px, font-medium
- Padding: 6px 14px
- Border-radius: 9999px (pill)
- Hover: border → `--color-border-light`, text → `--color-text`
- Click: micro-bounce scale(1.08) for 150ms

**Chip (active):**
- Background: `--color-accent`
- Border: 1px solid `--color-accent`
- Text: white
- Box-shadow: `0 0 8px rgba(255, 107, 53, 0.25)` (glow)

**Chip groups:** Spaces → 16px gap → Dates (Today, Tomorrow, Saturday, Monday, Pick date)

### Completed Section

```
     ──── Completed · 2 ▾ ────
```

- **Divider lines:** 1px height, `--color-border`, flex-1 on each side
- **Text:** 11px, font-medium, `--color-text-dim`, letter-spacing 0.08em
- **Collapsed by default** if > 3 completed tasks (shows first 3 + "Show all N" link)
- **Toggles** between ▾ (collapsed) and ▴ (expanded)

### Bottom Navigation

```
┌─────────────────────────────────┐
│    ↓        ◉        →       ◫  │
│  Inbox    Today   Upcoming  Spaces│
│    •                             │
└─────────────────────────────────┘
```

- **Background:** `--color-surface`
- **Top border:** 1px solid `rgba(255, 107, 53, 0.1)` — accent whisper, not gray
- **Height:** 64px + safe-area-inset-bottom
- **Icons:** text symbols, 22px font size
- **Labels:** 11px, font-medium
- **Active state:** `--color-accent` text + text-shadow `0 0 8px rgba(255,107,53,0.3)` on icon
- **Active dot:** 4px circle, `--color-accent`, breathing animation (opacity 0.6↔1.0, 3s loop)
- **Inactive:** `--color-text-dim`
- **Spaces tab:** opens sidebar slide-over (not a view switch)

### Space Picker (Sidebar)

- **Width:** 80%, max-width 320px
- **Background:** `--color-surface`, border-right: 1px solid `--color-border`
- **Backdrop:** `rgba(0,0,0,0.6)`, `backdrop-filter: blur(8px)`
- **Animation:** translateX, 350ms, `cubic-bezier(0.16, 1, 0.3, 1)`
- **Section labels:** "VIEWS", "SPACES" — 12px, uppercase, 0.12em letter-spacing, `--color-text-dim`
- **Items:** 48px height, 20px horizontal padding, 15px text
- **Active item:** 3px solid `--color-accent` left border, text in `--color-accent`
- **List sub-items:** 40px height, 52px left padding, 13px text
- **Divider:** accent gradient line between Views and Spaces sections
- **"+ Add list":** `--color-text-dim`, hover → `--color-accent`
- **Checklist indicator:** ☑ symbol at 10px, 40% opacity

### Undo Toast

```
         ┌──────────────────────────┐
         │  Task completed · Undo   │
         └──────────────────────────┘
```

- **Background:** `--color-surface`, border 1px solid `--color-border`
- **Border-radius:** 9999px (pill)
- **Padding:** 10px 20px
- **Backdrop-filter:** blur(12px)
- **Text:** 13px, `--color-text`
- **"Undo":** `--color-accent`, font-medium
- **Position:** 80px from bottom, centered
- **Animation:** slides up from below (300ms), auto-dismisses after 4 seconds

### Empty State

```
                    ○
              All clear
        Your inbox is empty
```

- **Circle:** 48px, opacity 0.2
- **Title:** 22px, DM Sans 600, `--color-text-dim`
- **Subtitle:** 14px, `--color-text-dim`, opacity 0.5
- **Background:** animated breathing gradient — `radial-gradient(ellipse at 50% 40%, rgba(255,107,53,0.02) 0%, transparent 70%)`, `background-size: 200% 200%`, animates position over 8s
- **Animation:** fadeIn 400ms

### Ghost Item (Checklist Previous)

- **Opacity:** 0.3, hover → 0.5
- **Checkbox:** 22px, 2px **dashed** border `--color-border-light` (dashed distinguishes from active)
- **Text:** 15px, `--color-text-dim`
- **Count:** 11px, `--color-text-faint`, right-aligned (e.g. "3×")

---

## Animations

### Easing Functions

| Name | Value | Usage |
|------|-------|-------|
| Spring enter | `cubic-bezier(0.16, 1, 0.3, 1)` | Elements entering the screen |
| Standard exit | `ease-out` | Elements leaving, fades |
| Standard | `ease` | General transitions |

### Animation Library

| Name | Duration | Easing | Transform | Usage |
|------|----------|--------|-----------|-------|
| `slideUp` | 300ms | spring enter | translateY(20px→0), opacity 0→1 | Toasts, general entrance |
| `slideDown` | 250ms | spring enter | translateY(-10px→0), opacity 0→1 | Chip bar, dropdowns |
| `fadeIn` | 400ms | ease-out | opacity 0→1 | Empty state, overlays |
| `taskEnter` | 350ms | spring enter | translateY(-12px→0), opacity 0→1 | Task items, header stagger |
| `viewFadeIn` | 250ms | ease-out | translateY(6px→0), opacity 0→1 | View transitions |
| `checkPop` | 200ms | ease-out | scale 1→1.15→1 | Checkbox completion |
| `pulseOnce` | 300ms | ease-out | scale 1→1.2→1 | Input "+" on focus |
| `breathe` | 3s | ease-in-out, infinite | opacity 0.6↔1.0 | Active nav dot |
| `ghostGradient` | 8s | ease-in-out, infinite | background-position shift | Empty state breathing |

### Stagger Pattern
Tasks stagger in 40ms apart on initial load and view transitions:
```jsx
style={{ animationDelay: `${index * 40}ms` }}
```

### Transition Defaults
```css
button, a { transition: all 200ms ease; }
input { transition: border-color 200ms ease, box-shadow 200ms ease; }
```

---

## Interaction — Fling System

Tasks can be flung in four directions, each triggering a different completion mini-game.

### Gesture Detection
- **Threshold:** 60px drag distance before activation
- **Drag visual:** item follows finger at 60% horizontal / 40% vertical, rotates `dx * 0.02deg`, scales down `1 - progress * 0.05`, fades `1 - progress * 0.25`
- **Velocity tracking:** last 6 touch points over ~100ms window

### Direction → Effect Map

| Direction | Angle Range | Effect |
|-----------|-------------|--------|
| ↑ Up | -135° to -45° | **Slingshot** |
| → Right | -45° to 45° | **Pinball** |
| ↓ Down | 45° to 135° | **Basketball** |
| ← Left | 135° to -135° | **Action panel** (snooze/delete) |

### Basketball Mode
- **Entry:** Task morphs into 48px ball (400ms), falls with gravity during morph
- **Ball visual:** 2.5px border `--color-border-light`, `rgba(255,255,255,0.04)` fill
- **Physics:** gravity 0.55, bounce damping 0.68, wall bounce 0.5
- **Squash & stretch:** proportional to impact speed, snaps back in 80ms
- **Floor shadow:** scales with height above floor
- **Hoop:** SVG backboard + orange rim, centered at 110px from top
- **Scoring:** ball must fall DOWN through hoop (vy > 0, within rim width)
- **Swish phase:** ball passes behind rim, shrinks 15%, snaps to center, fills with accent + checkmark
- **Aim assist:** gentle 2% horizontal nudge toward hoop center
- **Score text:** "Task complete" at 28px semibold

### Slingshot Mode
- **Entry:** Ball appears at 55% screen height in fork cradle
- **Elastic bands:** 2 lines from fork tips to ball, thickness scales with pull (2–4px)
- **Band color:** `--color-border` → `--color-border-light` → `--color-accent` (by tension)
- **Power indicator:** 120px tall bar on left edge, fills proportionally
- **Trajectory guide:** 5 dotted prediction points when pull > 30%
- **Launch:** velocity = pull distance × 0.12, opposite direction
- **Exhaust trail:** particles emitted every 40ms during flight

### Pinball Mode
- **Entry:** Ball launches at initial random velocity (6–10 horizontal, -8 to -12 vertical)
- **Bumpers:** 5 randomly placed 50px circles
- **Bumper collision:** elastic reflection, speed boost if < 8, scale pop 1.3→1 in 150ms
- **Bumper hit:** border → `--color-accent`, fill → `rgba(255,107,53,0.15)`, 8 particles, haptic
- **Hit counter:** top-right corner, 20px bold accent text

### Action Panel (Left Swipe)
```
  Buy groceries for dinner
  Later today    Tomorrow    Delete    ×
```
- Flat inline text buttons, 13px, `--color-text-dim`
- Delete in `--color-danger` at 60% opacity (hover → full)
- Appears with slideUp animation

---

## Particle System

Global canvas overlay (`position: fixed`, `pointer-events: none`, z-index 50).

### Particle Properties
- Gravity: 0.12/frame
- Friction: 0.985
- Life decay: 0.012–0.030/frame (randomized)
- Shapes: square (default), circle
- Rotation: random initial, ±0.15 speed

### Effect Presets

| Effect | Particles | Colors | Size | Gravity | Usage |
|--------|-----------|--------|------|---------|-------|
| Explosion | 15–70 | Accent palette | 2–13px | 0.12 | Fling completion, score |
| Exhaust | 5/burst | Orange + smoke grays | 3–7px | 0.05 | Rocket trail, slingshot |
| Starburst | 30 | Accent palette | 2–6px | 0.08 | Score celebration, exit |
| Vortex | 32 + 35 burst | Accent palette | 3–7px | 0 → 0.12 | Converge then explode |
| Trail | 3/point | `#ff6b3580` | 2–4px | 0.02 | Arc paths |

### Accent Palette
`#ff6b35`, `#ff8c5a`, `#e8e4df`, `#ff3b30`, `#ff9f0a`, `#ffffff`

---

## PWA Configuration

- **App name:** Focus
- **Display:** standalone
- **Orientation:** portrait
- **Theme color:** `#0a0a0a`
- **Background color:** `#0a0a0a`
- **Icons:** 192×192 PNG, 512×512 PNG (+ maskable)
- **Service worker:** Workbox (auto-generated by vite-plugin-pwa)
- **Precache:** all JS, CSS, HTML, images, fonts
- **Runtime caching:** Google Fonts (CacheFirst, 365-day expiry)

### Required Meta Tags
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0a0a0a">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

---

## Haptic Feedback

Uses `navigator.vibrate()` (Android Chrome only).

| Action | Pattern | Feel |
|--------|---------|------|
| Task submit | 8ms | Quick tick |
| Fling initiate | 5ms | Light tap |
| Basketball bounce | 3–8ms (proportional) | Impact weight |
| Basketball score | [10, 30, 10, 30, 20]ms | Celebration pattern |
| Bumper hit | 8ms | Solid bounce |
| Wall bounce | 3–4ms | Light tap |
| Slingshot release | 15ms | Snap |
| Completion (fling) | 10ms | Confirmation |

---

## Do NOT

- Use emoji as icons in navigation (use text symbols: ↓ ◉ → ◫)
- Use a sidebar on mobile (use slide-over space picker)
- Use any shade of purple
- Use gradients on buttons or chips
- Use shadows heavier than `0 1px 3px rgba(0,0,0,0.3)` (except focus glows)
- Use rounded corners larger than 16px (except pills at 9999px)
- Make the input field full-width with no padding
- Show all metadata on every task (priority dot + one label max)
- Use loading spinners (use skeleton placeholders)
- Use accent orange for completed checkboxes (use `#2a2a2a`)
- Animate everything simultaneously (stagger by 30–50ms)

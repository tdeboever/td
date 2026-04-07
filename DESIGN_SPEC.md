# Design Spec

Visual and interaction design reference for the todo app. Claude Code should read this alongside ARCHITECTURE.md when building or modifying any UI component.

---

## Design Philosophy

**Refined dark brutalism.** High contrast, bold typography, generous spacing, sharp accent color. Every element should feel intentional and tactile. No decoration for decoration's sake — but never flat or lifeless either. The app should feel like a luxury tool, not a prototype.

**The test:** If it looks like a default Material UI or Bootstrap dark theme, it's wrong. If it looks like something Teenage Engineering or Nothing would ship, it's right.

---

## Color Palette

Use CSS variables defined in `globals.css`. Never hardcode colors.

| Token               | Hex                          | Usage                              |
|---------------------|------------------------------|------------------------------------|
| `--color-bg`        | `#0a0a0a`                    | Page background                    |
| `--color-surface`   | `#141414`                    | Cards, input fields, elevated areas|
| `--color-surface-hover` | `#1a1a1a`                | Hover states on surfaces           |
| `--color-border`    | `#222222`                    | Subtle dividers, input borders     |
| `--color-border-light` | `#333333`                 | Hover borders, active states       |
| `--color-text`      | `#e8e4df`                    | Primary text (warm off-white)      |
| `--color-text-dim`  | `#6b6560`                    | Secondary text, labels, metadata   |
| `--color-accent`    | `#ff6b35`                    | Active states, highlights, CTAs    |
| `--color-accent-glow` | `rgba(255, 107, 53, 0.15)` | Focus rings, subtle glows         |
| `--color-danger`    | `#ff3b30`                    | Delete, urgent priority            |
| `--color-urgent`    | `#ff3b30`                    | Priority 1 dot                     |
| `--color-high`      | `#ff9f0a`                    | Priority 2 dot                     |
| `--color-normal`    | `#30d158`                    | Priority 3 dot                     |

**Rules:**
- Background is near-black, never pure black
- Text is warm off-white, never pure white
- Accent (orange) is used sparingly — active tab, focus ring, active chips, completion flash
- Borders are barely visible — they define edges without drawing attention

---

## Typography

| Role        | Font              | Weight    | Size   | Usage                        |
|-------------|-------------------|-----------|--------|------------------------------|
| Display     | Playfair Display  | 900       | 32-36px | App title on sidebar/header only |
| Heading     | DM Sans           | 600       | 18-20px | View titles (Inbox, Today)   |
| Body        | DM Sans           | 400       | 15px   | Task text                    |
| Caption     | DM Sans           | 500       | 11-12px | Labels, metadata, chip text  |
| Overline    | DM Sans           | 500       | 11px   | Section headers ("SPACES", "COMPLETED") — uppercase, letter-spacing 0.1em |

**Rules:**
- Never use Inter, Roboto, Arial, or system-ui as primary
- Playfair Display is ONLY for the app title — nowhere else
- DM Sans does everything else
- Task text is always 15px — readable without being large

---

## Layout — Mobile (Primary)

No sidebar on mobile. Ever. Full-screen views with bottom navigation.

### Bottom Navigation Bar

Fixed to bottom, 3 items. Simple, tappable, always visible.

```
┌─────────────────────────────────┐
│    ↓           ◉           →    │
│  Inbox       Today      Upcoming│
│    •                            │  ← dot under active item
└─────────────────────────────────┘
```

- Height: 64px + safe-area-inset-bottom
- Background: `--color-surface` with top border `--color-border`
- Icons: text symbols, not emoji. ↓ for Inbox, ◉ for Today, → for Upcoming
- Active state: `--color-accent` text + small dot below
- Inactive: `--color-text-dim`
- Font: 11px DM Sans 500 for labels

### Header (per view)

Compact. One line when keyboard is open, expands when keyboard is closed.

**Collapsed (keyboard open):**
```
┌─────────────────────────────────┐
│  ☰    Inbox  3                  │  ← hamburger (opens space picker), view name, count
└─────────────────────────────────┘
```
- Height: 48px
- Hamburger opens a slide-over panel for spaces (not a full sidebar)

**Expanded (keyboard closed):**
```
┌─────────────────────────────────┐
│  Good morning                   │  ← greeting, 13px, uppercase, letter-spaced, dim
│  Inbox                          │  ← view name, 24px, DM Sans 600
│  3 remaining · 7 completed     │  ← stats, 13px, dim
└─────────────────────────────────┘
```
- Padding: 24px horizontal, 20px top (+ safe area), 16px bottom
- Bottom edge: 1px gradient line from accent to transparent (left to right)

### Space Picker (slide-over)

Triggered by hamburger icon. Slides in from the left, 80% screen width, backdrop blur behind.

```
┌──────────────────────────┬─────┐
│                          │     │
│  SMART VIEWS             │     │
│  ↓  Inbox           4    │░░░░░│
│  ◉  Today            2   │░░░░░│
│  →  Upcoming         1   │░░░░░│
│                          │░░░░░│
│  SPACES                  │░░░░░│
│  💼  Work                │░░░░░│
│     General Tasks   3    │░░░░░│
│     Meetings        1    │░░░░░│
│  🏠  Home                │░░░░░│
│     Groceries       5    │░░░░░│
│     Chores          2    │░░░░░│
│                          │░░░░░│
│  + New space              │░░░░░│
│                          │░░░░░│
└──────────────────────────┴─────┘
```

- Background: `--color-surface`
- Items: 48px height, 20px horizontal padding
- Active item: accent-colored left border (3px), text in `--color-accent`
- Counts: right-aligned, `--color-text-dim`
- Section labels ("SMART VIEWS", "SPACES"): overline style
- "+ New space": `--color-text-dim`, accent on hover

---

## Components

### Task Item

```
┌─────────────────────────────────┐
│  ○  Buy groceries for dinner    │
│     ● Today · Work              │  ← priority dot + metadata
└─────────────────────────────────┘
```

- Padding: 14px vertical, 4px horizontal (within list padding)
- Checkbox: 22px circle, 2px border `--color-border-light`
- Checkbox hover: border turns `--color-accent`, fills with `--color-accent-glow`
- Checkbox checked: fills `--color-accent`, white ✓ inside
- Task text: 15px DM Sans 400, `--color-text`
- Completed task text: `--color-done-text`, line-through
- Metadata row: 4px below text, 11px, `--color-text-dim`
- Priority dot: 6px circle, colors per priority level, subtle box-shadow on urgent
- Divider between items: 1px `rgba(255,255,255,0.03)` — almost invisible
- Delete button: × symbol, invisible until hover/long-press, `--color-danger`

**Swipe states:**
- Swipe right: green background reveals behind, checkmark icon, complete on release
- Swipe left: amber background, clock icon, snooze options appear

### Task Input

Pinned above the keyboard (or above bottom nav when keyboard closed).

```
┌─────────────────────────────────┐
│  +  What needs doing?        ↑  │
└─────────────────────────────────┘
```

- Background: `--color-surface`
- Border: 1px `--color-border`, radius 12px
- Padding: 14px 16px
- "+" symbol: `--color-accent`, 20px, left side
- Placeholder: "What needs doing?", `--color-text-dim`
- Send hint "↑": right side, dim, appears on focus
- Focus state: border becomes `--color-accent`, outer glow `0 0 0 3px --color-accent-glow`
- Margin: 12px from chip bar above, 12px from bottom nav below

### Chip Bar

Sits directly above the input. Single scrollable row on mobile.

```
[Work]  [Home]  │  [● Urgent]  [↑ High]  [— Normal]  │  [Today]  [Tomorrow]
```

- Chips: pill-shaped, radius 100px
- Default: 1px border `--color-border`, transparent background, `--color-text-dim` text
- Active: `--color-accent` background, `--color-accent` border, white text
- Size: padding 6px 14px, font 12px DM Sans 500
- Scrollable horizontally, no scrollbar visible
- Separated into three groups (space | priority | date) by subtle gaps (16px vs 6px between chips)
- Current space auto-highlighted based on active view
- Visibility: always visible when input is focused, fades to 0 height when not focused (animated)

### Undo Toast

Appears at bottom center, above bottom nav.

```
         ┌──────────────────────────┐
         │  Task completed · Undo   │
         └──────────────────────────┘
```

- Background: `--color-surface` with 1px `--color-border`
- Border-radius: 100px (pill)
- Padding: 10px 20px
- Font: 13px DM Sans 400
- "Undo" text: `--color-accent`, tappable
- Backdrop-filter: blur(12px)
- Animation: slides up from below, fades in
- Auto-dismisses after 4 seconds with a fade out
- Position: 16px above bottom nav

### Empty State

Centered in the task list area when no tasks exist.

```
                    ○
              All clear
        Add a task to get started
```

- Icon: large "○" or similar, 48px, opacity 0.3
- Title: 22px Playfair Display 700 (exception to the "only app title" rule), `--color-text-dim`
- Subtitle: 14px DM Sans 400, `--color-text-dim` at 60% opacity
- Fade-in animation on mount

### Ghost Item (checklist mode)

Same as task item but:
- Text: `--color-text-dim` at 40% opacity
- Checkbox: dashed border instead of solid
- Positioned below active items, above completed section
- One tap reactivates (returns to active, no confirmation)

### Snooze Panel (swipe left reveal)

Three options slide in from the right:

```
┌─────────────────────────────────┐
│  🕐 Later today                 │
│  📅 Tomorrow                    │
│  📆 Pick a date                 │
└─────────────────────────────────┘
```

- Background: amber-tinted surface
- Each option: full width, 48px height, tappable
- Selecting one snoozes and shows undo toast
- "Pick a date" opens a minimal date picker (modal)

---

## Spacing System

Use consistent spacing throughout. Base unit: 4px.

| Token | Value | Usage |
|-------|-------|-------|
| xs    | 4px   | Tight gaps, metadata spacing |
| sm    | 8px   | Between related elements |
| md    | 12px  | Component internal padding |
| lg    | 16px  | Between sections |
| xl    | 20px  | Page horizontal padding (mobile) |
| 2xl   | 24px  | Page horizontal padding (tablet+) |
| 3xl   | 32px  | Major section breaks |
| 4xl   | 48px  | Top-of-page safe area |

---

## Animation & Motion

**Principles:**
- Every state change should animate (never snap)
- Duration: 200-300ms for micro-interactions, 400ms for layout shifts
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for elements entering (spring-like), `ease-out` for exits

**Specific animations:**

| Action | Animation |
|--------|-----------|
| Task added | Slides down from top of list, fades in (300ms) |
| Task completed | Strike-through draws left-to-right (200ms), then item slides right and fades (300ms) |
| Task deleted | Item collapses height to 0, fades (250ms) |
| Task snoozed | Item slides left off screen (300ms) |
| Chip toggled | Scale bounce 1.0 → 1.1 → 1.0 (150ms) |
| Input focus | Border color transition (200ms), glow appears (200ms) |
| Undo toast | Slide up + fade in (300ms), auto-dismiss fade out (400ms) |
| Space picker open | Slide from left (350ms), backdrop fades in |
| View switch | Cross-fade between task lists (200ms) |
| Ghost reactivation | Item floats up from ghost section to active section (400ms) |

**Haptic feedback (if available via navigator.vibrate):**
- Task completed: short buzz (10ms)
- Task snoozed: double buzz (10ms, pause, 10ms)
- Swipe threshold crossed: single tick (5ms)

---

## Responsive Breakpoints

| Breakpoint | Width     | Layout Changes |
|-----------|-----------|----------------|
| Mobile    | < 640px   | Bottom nav, full-width views, slide-over space picker |
| Tablet    | 640-1024px | Bottom nav, wider padding (24px), input field max-width 560px |
| Desktop   | > 1024px  | Side nav (permanent), centered content max-width 640px |

Mobile is the primary design target. Tablet and desktop should feel like a comfortable mobile layout with more breathing room, not a fundamentally different UI.

---

## Do NOT

- Use emoji as icons in navigation (use text symbols: ↓ ◉ →)
- Use a sidebar on mobile
- Use any shade of purple
- Use gradients on buttons or chips
- Use shadows heavier than `box-shadow: 0 1px 3px rgba(0,0,0,0.3)`
- Use rounded corners larger than 16px (except pills which are 9999px)
- Make the input field full-width with no padding (always inset from screen edge)
- Show all metadata on every task (keep it minimal — priority dot + one label max)
- Use loading spinners (use skeleton placeholders if needed)
- Animate everything simultaneously (stagger reveals by 30-50ms each)

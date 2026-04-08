# Focus — Design System v3

### The app that makes you *want* to do things.

---

## Creative Direction: "Soft Machine"

Focus v3 is a **soft, luminous, playful object** — like a well-loved toy that happens to organize your life. The aesthetic is inspired by physical objects that bring joy: the click of a mechanical keyboard, the snap of a magnetic case, the satisfying weight of a ceramic mug. Everything has **roundness, weight, tactility, and warmth.**

Not dark-and-moody. Not flat-and-corporate. **Soft, bright, bouncy, and alive.**

### The Three Feelings

1. **Pillowy** — rounded corners, soft shadows, surfaces that look touchable and cushioned
2. **Luminous** — light emanates from within; glowing accents, radiant gradients, lit-from-behind effects
3. **Snappy** — every interaction has spring physics, overshoot, and a satisfying "thwip" quality

### What Makes This Unforgettable

Checking off a task should feel like popping bubble wrap. The whole UI has a **gentle bounciness** — things squish, spring, glow, and settle. Colors shift with time of day. Surfaces have depth like frosted glass over a gradient sky. It's a todo app that makes you smile.

---

## Color System

### The Big Shift: Dark → Dusk

The old design was black with orange. The new design is **deep dusk with living color.** The background is a rich, warm dark — not black, not gray — with a slowly shifting gradient that gives the whole app an atmosphere like a sunset that never ends.

### Base Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | `#1a1625` | Deepest base — warm purple-black |
| `--bg-mid` | `#221e2e` | App shell background |
| `--bg-raised` | `#2a2537` | Elevated cards, input containers |
| `--bg-float` | `#332d42` | Popovers, modals, active states |

These are NOT pure darks. They have a **violet undertone** that gives them richness and warmth — like the sky 30 minutes after sunset.

### Living Gradient Background

The app sits on a mesh gradient that shifts subtly based on time of day. This is the soul of the app — it makes the background feel like a living sky.

```css
.app-bg {
  background-color: var(--bg-deep);
  background-image:
    radial-gradient(ellipse at 15% 5%, rgba(255, 140, 90, 0.10) 0%, transparent 50%),
    radial-gradient(ellipse at 85% 15%, rgba(236, 120, 198, 0.08) 0%, transparent 45%),
    radial-gradient(ellipse at 50% 90%, rgba(100, 160, 255, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 30% 60%, rgba(120, 230, 200, 0.04) 0%, transparent 40%);
}
```

This creates a warm peach glow top-left, a soft rose bloom top-right, a cool blue pool at the bottom, and a faint mint whisper mid-left. The overall feeling: **twilight garden.**

### Surface System

Surfaces are **translucent with blur**, creating frosted-glass depth. Every layer reveals the gradient beneath.

| Token | Value | Usage |
|-------|-------|-------|
| `--surface-card` | `rgba(255, 255, 255, 0.05)` | Task items on hover, cards |
| `--surface-input` | `rgba(255, 255, 255, 0.07)` | Input field, chip bar |
| `--surface-active` | `rgba(255, 255, 255, 0.10)` | Active/pressed states |
| `--surface-glass` | `rgba(255, 255, 255, 0.06)` | Bottom nav, sidebar, toast — with `backdrop-filter: blur(20px)` |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#f4f0ed` | Primary text — soft warm white |
| `--text-secondary` | `rgba(244, 240, 237, 0.50)` | Labels, metadata, inactive states |
| `--text-ghost` | `rgba(244, 240, 237, 0.22)` | Placeholders, ultra-dim hints |
| `--text-done` | `rgba(244, 240, 237, 0.15)` | Completed task text |

### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` | Default dividers |
| `--border-visible` | `rgba(255, 255, 255, 0.10)` | Input outlines, card edges |
| `--border-hover` | `rgba(255, 255, 255, 0.16)` | Hover states |

### Accent Colors — The Joy Palette

This is the biggest departure from v1/v2. Instead of monochrome orange, Focus v3 uses a **multi-hue accent system** where each color has a purpose:

| Token | Value | Name | Usage |
|-------|-------|------|-------|
| `--accent-coral` | `#ff7b54` | Coral | Primary CTA, active nav, brand energy |
| `--accent-rose` | `#f472b6` | Rose | Completed checkmarks, celebration, achievement |
| `--accent-sky` | `#60a5fa` | Sky | Date badges, scheduling, time-related |
| `--accent-mint` | `#4ade80` | Mint | Success confirmations, "all clear" states |
| `--accent-amber` | `#fbbf24` | Amber | Priority high, warnings, stars |
| `--accent-lavender` | `#a78bfa` | Lavender | Spaces/categories, organization |

**Why multi-hue?** Because a single accent color creates monotony. When everything is orange, nothing stands out. With distinct colors for distinct purposes, each element has its own identity, and the overall palette feels **rich, playful, and alive.**

### Accent Gradients

For high-impact moments (active chips, score text, celebrations):
```css
--gradient-sunset: linear-gradient(135deg, #ff7b54, #f472b6);
--gradient-sky: linear-gradient(135deg, #60a5fa, #a78bfa);
--gradient-aurora: linear-gradient(135deg, #4ade80, #60a5fa);
```

### Glow Effects

Each accent has a matching glow for focus states and highlights:
```css
--glow-coral: 0 0 20px rgba(255, 123, 84, 0.25);
--glow-rose: 0 0 20px rgba(244, 114, 182, 0.25);
--glow-sky: 0 0 20px rgba(96, 165, 250, 0.25);
--glow-mint: 0 0 20px rgba(74, 222, 128, 0.25);
```

### Priority Colors

| Priority | Color | Glow |
|----------|-------|------|
| Urgent (P1) | `#ff6b6b` | `0 0 10px rgba(255, 107, 107, 0.4)` |
| High (P2) | `#fbbf24` | — |
| Normal (P3) | `#4ade80` | — |

Priority dots use radial gradients for dimensionality:
```css
.dot-urgent {
  background: radial-gradient(circle at 35% 35%, #ff9b9b, #ff6b6b);
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.4);
  animation: pulse-soft 2.5s ease-in-out infinite;
}
```

### Color Rules

- Background is warm purple-dark (`#1a1625`), **never** pure black, never gray-black
- Surfaces are translucent white-on-base, **never** opaque hex fills
- Text is warm off-white (`#f4f0ed`), **never** pure white
- Accents are **multi-hue** — coral for action, rose for completion, sky for time, mint for success
- Completed checkboxes use `--accent-rose` — completion IS celebration
- Borders are always translucent `rgba`, **never** flat hex grays

---

## Typography

### Font Stack

| Role | Font | Fallback | Why |
|------|------|----------|-----|
| Display | **Nunito** | system-ui, sans-serif | Rounded terminals on every letter — the typography equivalent of the pillowy, bouncy UI. Bold and friendly without being childish. At 800 weight, it's confident and toylike. |
| Body | **General Sans** | system-ui, sans-serif | Clean, modern, excellent readability. Slightly friendlier than Inter/Satoshi without being juvenile. |
| Mono | **IBM Plex Mono** | monospace | Warm, readable monospace for data. More character than JetBrains Mono. |

**Font loading:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,700;0,800;0,900;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap" rel="stylesheet">
```

### Type Scale

| Role | Font | Weight | Size | Line Height | Letter Spacing | Usage |
|------|------|--------|------|-------------|----------------|-------|
| Brand title | Nunito | 800 | 26px | 1.1 | -0.02em | "Focus" in sidebar |
| View title | Nunito | 800 | 34px | 1.1 | -0.03em | "Inbox", "Today", "Upcoming" |
| Empty state title | Nunito | 400 italic | 22px | 1.3 | 0 | "All clear" — warm and celebratory |
| Section label | General Sans | 600 | 11px | 1.4 | 0.12em | "COMPLETED", "SPACES" — uppercase |
| Task text | General Sans | 500 | 15px | 1.5 | -0.01em | Task content |
| Body | General Sans | 400 | 14px | 1.5 | 0 | Descriptions, tooltips |
| Caption | General Sans | 500 | 12px | 1.4 | 0 | Chip text, metadata |
| Micro / data | IBM Plex Mono | 400 | 10px | 1.3 | 0.02em | Date badges, stats line, counters |
| Nav label | General Sans | 500 | 10px | 1 | 0.01em | Bottom nav labels |

### View Title Treatment

The view title uses Nunito at weight 800 with tight tracking. The rounded terminals echo every soft corner in the UI — the font IS the brand:

```css
.view-title {
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 34px;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}
```

No gradient text, no text-shadow trickery. The font's natural roundness and warmth is the spectacle.

### Typography Rules

- Nunito is for **display text only** — view titles, brand title, empty state headings. Nowhere else.
- General Sans handles all functional/body text
- IBM Plex Mono is **only** for numerical/data displays
- Task text is always 15px / 500 weight
- Section labels are always uppercase + 0.12em tracking + 600 weight
- `-webkit-font-smoothing: antialiased` globally
- `font-optical-sizing: auto` globally

---

## Spacing System

Base unit: **4px.** No exceptions.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Icon gaps, tight inline |
| `--space-2` | 8px | Between related elements |
| `--space-3` | 12px | Component internal padding |
| `--space-4` | 16px | Between sections |
| `--space-5` | 20px | Page horizontal margins |
| `--space-6` | 24px | Section dividers |
| `--space-8` | 32px | Major breaks |
| `--space-10` | 40px | Header-to-content gap |
| `--space-12` | 48px | Header top padding |

### The 20px Rule

All content has 20px horizontal padding from screen edge. Full-bleed backgrounds extend edge-to-edge, inner content inset 20px.

---

## Radius System — The Pillow Scale

Radii are **generous and soft** — this is core to the "pillowy" feeling. Everything looks touchable.

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 10px | Chips, date badges, small buttons |
| `--radius-md` | 16px | Cards, input field, task hover |
| `--radius-lg` | 22px | Modals, popovers, sidebar |
| `--radius-xl` | 30px | Large cards, empty state container |
| `--radius-pill` | 9999px | Pills, tags, nav indicator, toasts |

Note: these are significantly rounder than v1/v2. The minimum radius is 10px. Nothing should look sharp.

---

## Shadow System — Soft Depth

Shadows are **large, diffused, and colored** — they create the "floating pillow" effect.

| Level | Shadow | Usage |
|-------|--------|-------|
| Ambient | `0 1px 2px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05)` | Default card edge |
| Lifted | `0 4px 16px rgba(0,0,0,0.20), 0 0 0 1px rgba(255,255,255,0.06)` | Hover states, input |
| Float | `0 12px 40px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.08)` | Modals, popovers |
| Glow(color) | `0 0 24px rgba(COLOR, 0.25)` | Focus rings, active elements (use each accent's glow) |

The 1px white inner ring on every shadow creates the "frosted glass edge" effect.

---

## Layout

### App Shell
```
┌──────────────────────────────────────────────┐
│  ░░░░░░ living gradient sky ░░░░░░░░░░░░░░░  │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ GOOD MORNING                        │    │  ← safe-top + 48px
│  │ Inbox            (Nunito 800)       │    │
│  │ 3 remaining · 1 done  (Plex Mono)  │    │
│  │ ━━━━━━━━━━ (gradient divider) ━━━━ │    │
│  ├──────────────────────────────────────┤    │
│  │                                      │    │
│  │  ┌──────────────────────────────┐    │    │
│  │  │  ○  ● get groceries          │    │    │  ← 16px radius on hover
│  │  │        Tomorrow              │    │    │
│  │  └──────────────────────────────┘    │    │
│  │                                      │    │
│  ├──────────────────────────────────────┤    │
│  │ 〔chip bar — frosted glass〕         │    │
│  │ 〔◆ What needs doing?           ↑〕  │    │  ← pillowy input
│  │ ──────────────────────────────────── │    │
│  │ ↓ Inbox    ◉ Today    → Upcoming  ◫ │    │  ← frosted glass nav
│  └──────────────────────────────────────┘    │
│                                              │
└──────────────────────────────────────────────┘
```

- **Max width:** 480px, centered on desktop
- **Desktop frame:** floating with large shadow + subtle gradient border
- **Mobile:** full-width, no frame

### Desktop Frame
```css
@media (min-width: 641px) {
  .app-shell {
    max-width: 480px;
    margin: 40px auto;
    border-radius: 28px;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.08),
      0 25px 80px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
}
```

---

## Components

### Header

```
┌──────────────────────────────────────┐
│                                      │  ← 48px + safe-area
│  GOOD MORNING                        │  ← General Sans 600, 11px, uppercase
│                                      │     0.12em tracking, --text-secondary
│  Inbox                               │  ← Nunito 800, 34px
│                                      │     opsz 144, --text-primary
│  3 remaining · 1 done                │  ← IBM Plex Mono 400, 10px
│                                      │     --text-secondary
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  ← gradient divider (see below)
└──────────────────────────────────────┘
```

**Divider** — a multi-hue gradient that whispers "this app has soul":
```css
.header-divider {
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--accent-coral) 15%,
    var(--accent-rose) 40%,
    var(--accent-lavender) 65%,
    var(--accent-sky) 85%,
    transparent 100%
  );
  opacity: 0.5;
  margin-top: 16px;
}
```

This rainbow-whisper divider is one of the most distinctive elements — it previews the multi-hue palette in one subtle stroke.

**Stagger:** greeting (0ms) → title (50ms) → stats (100ms) → divider (150ms)

### Task Item

**Active:**
```
┌──────────────────────────────────────┐
│                                      │
│   ○   ● Buy groceries for dinner     │  ← 22px checkbox, 6px dot, 15px text
│          Tomorrow                    │  ← IBM Plex Mono 10px, sky-colored badge
│                                      │
└──────────────────────────────────────┘
```

- **Padding:** 14px 20px
- **Background:** transparent (gradient sky visible)
- **Divider:** `1px solid var(--border-subtle)` between items — none after last
- **Hover:** `var(--surface-card)` fades in, radius 16px, `box-shadow: var(--shadow-ambient)`, 200ms ease
- **Active/pressed:** `var(--surface-active)`, `transform: scale(0.98)`, 100ms with spring overshoot on release
- **Task text:** General Sans 500, 15px

**Date badge** — sky-colored to associate with time:
```css
.date-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.02em;
  color: var(--accent-sky);
  background: rgba(96, 165, 250, 0.10);
  border: 1px solid rgba(96, 165, 250, 0.15);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}
```

**Completed task:**
- Opacity: 0.35 (hover 0.55)
- Text: `var(--text-done)`, `text-decoration: line-through; text-decoration-color: rgba(244, 240, 237, 0.08);`
- Checkbox: rose-colored fill (see below) — completion is celebration

### Checkbox — The Joy Button

This is the most-touched element in the app. It must feel **incredible.**

**Unchecked:**
```css
.checkbox {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1); /* bounce */
}
```

**Hover:**
```css
.checkbox:hover {
  border-color: var(--accent-rose);
  box-shadow: 0 0 0 4px rgba(244, 114, 182, 0.12);
  transform: scale(1.08);
}
```

**Checked — the celebration moment:**
```css
.checkbox.checked {
  background: linear-gradient(135deg, var(--accent-rose), var(--accent-coral));
  border-color: transparent;
  box-shadow: 0 0 12px rgba(244, 114, 182, 0.30);
}
.checkbox.checked svg {
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
}
```

The checkmark is **white on a rose-to-coral gradient**, with a soft glow. This is intentionally the most colorful element in the UI — checking a task off should feel like lighting a candle.

**Check animation sequence:**
1. Scale pop: `1 → 1.3 → 1.0` (250ms, bounce easing)
2. Background fills with gradient (150ms)
3. Micro-burst of 8-12 tiny particles in accent colors (200ms) — this is the bubble-wrap pop
4. Haptic: 8ms tick

### Task Input — The Invitation

```
┌──────────────────────────────────────────┐
│  ◇  What needs doing?               ↑   │
└──────────────────────────────────────────┘
```

- **"◇" icon:** outlined diamond, 14px, `var(--accent-coral)` — NOT a filled square
- **Container:** `background: var(--bg-raised)`, border-radius 16px, padding 14px 16px
- **Ring:** `box-shadow: 0 0 0 1px var(--border-visible), var(--shadow-ambient);` — NO CSS `border`

**Focus state:**
```css
.input:focus-within {
  box-shadow:
    0 0 0 2px rgba(255, 123, 84, 0.3),
    0 0 0 6px rgba(255, 123, 84, 0.08),
    0 4px 20px rgba(255, 123, 84, 0.10);
  background: var(--bg-float);
}
```

The focus glow is **wide and soft** (6px spread), not tight and hard. It looks like the input is lit from within.

- **"◇" on focus:** fills to "◆" (solid), scale(1.1), 200ms spring — the diamond "lights up"
- **Send "↑":** `var(--accent-coral)` when text exists, scale from 0.8→1 + fade in
- **Submit animation:** text flies up, "◆" does a checkPop (scale 1→1.2→1), brief coral flash
- **Placeholder:** `var(--text-ghost)`, General Sans 400

### Chip Bar

**Container:** frosted glass
```css
.chip-bar {
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(1.3);
  -webkit-backdrop-filter: blur(20px) saturate(1.3);
  border-top: 1px solid var(--border-subtle);
  padding: 10px 0;
}
```

**Inactive chip:**
```css
.chip {
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-visible);
  background: transparent;
  color: var(--text-secondary);
  font: 500 12px 'General Sans', sans-serif;
  transition: all 150ms ease;
}
.chip:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
  background: var(--surface-card);
}
```

**Active chip:**
```css
.chip.active {
  background: var(--gradient-sunset);
  border-color: transparent;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 12px rgba(255, 123, 84, 0.25);
}
```

Active chips use the **sunset gradient** (coral → rose) — it's warmer and more alive than a flat color.

### Bottom Navigation

```
┌──────────────────────────────────────────┐
│                                          │
│    ↓        ◉        →        ◫         │
│  Inbox    Today   Upcoming   Spaces      │
│    ━━                                    │
│                                          │
└──────────────────────────────────────────┘
```

- **Background:** `var(--surface-glass)` + `backdrop-filter: blur(24px) saturate(1.3)`
- **Top edge:** `1px solid var(--border-subtle)`
- **Height:** 64px + safe-area-inset-bottom
- **Icons:** 20px, **Labels:** General Sans 500, 10px
- **Inactive:** `var(--text-secondary)`

**Active state:**
```css
.nav-item.active {
  color: var(--accent-coral);
}
.nav-item.active .icon {
  text-shadow: 0 0 14px rgba(255, 123, 84, 0.35);
}
```

**Active indicator** — a glowing pill that slides between tabs:
```css
.nav-indicator {
  width: 24px;
  height: 3px;
  border-radius: var(--radius-pill);
  background: var(--gradient-sunset);
  box-shadow: 0 0 10px rgba(255, 123, 84, 0.35);
  transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Completed Section

```
      ──── Completed · 3 ▾ ────
```

- Divider lines: 1px, `var(--border-subtle)`, flex-1 each side
- Text: General Sans 600, 11px, uppercase, 0.12em tracking, `var(--text-secondary)`
- Chevron: rotates 180° on expand with spring easing
- Collapsed by default when > 3 completed

### Space Picker (Sidebar)

- **Panel:** `background: rgba(26, 22, 37, 0.95); backdrop-filter: blur(24px);`
- **Backdrop:** `background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(12px);`
- **Edge:** `1px solid var(--border-subtle)` on visible side
- **Slide:** translateX(-100% → 0), 400ms spring
- **Section labels:** General Sans 600, 11px, uppercase, 0.12em
- **Active item:** 3px left border `var(--accent-lavender)`, text `var(--accent-lavender)` — lavender for organization/spaces
- **"+ Add list":** `var(--text-secondary)`, hover → `var(--accent-coral)`
- **Space name input focus ring:** same diffused glow as main input — NOT a hard border

### Undo Toast

```
      ┌───────────────────────────┐
      │  ✓ Task completed · Undo  │
      └───────────────────────────┘
```

- **Background:** `rgba(255, 255, 255, 0.08)` + `backdrop-filter: blur(20px)`
- **Ring:** `box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.10)` — NOT CSS border
- **Radius:** 9999px (pill), **Padding:** 12px 20px
- **Shadow:** `0 8px 32px rgba(0, 0, 0, 0.25)`
- **"✓":** `var(--accent-mint)` — success/confirmation color
- **Text:** General Sans 500, 13px, `var(--text-primary)`
- **"Undo":** General Sans 600, `var(--accent-coral)`
- **Enter:** slides up 20px + fade, 350ms spring
- **Auto-dismiss:** 4s, fade out 200ms

### Empty State

```
                  ✦

            All clear

       Everything's done
```

- **"✦" icon:** 36px, `var(--accent-amber)`, `text-shadow: 0 0 20px rgba(251, 191, 36, 0.4)` — a warm star
- **Title:** Nunito 400 italic, 22px, `var(--text-secondary)` — gentle and celebratory
- **Subtitle:** General Sans 400, 14px, `var(--text-ghost)`
- **Background area:** enhanced gradient glow with slow breathing animation (12s cycle):
  ```css
  @keyframes breathe {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }
  ```
- **Stagger:** icon (0ms) → title (80ms) → subtitle (160ms)

---

## Animations

### Easing Functions

| Name | Value | Feel | Usage |
|------|-------|------|-------|
| `--ease-spring` | `cubic-bezier(0.16, 1, 0.3, 1)` | Fast start, gentle overshoot | Enter animations, tab switching |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful overshoot | Checkbox pop, chip tap, celebrations |
| `--ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Smooth and refined | Fades, general transitions |

### Keyframes

```css
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes taskEnter {
  from { transform: translateY(-12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes checkPop {
  0% { transform: scale(1); }
  40% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
@keyframes chipTap {
  0% { transform: scale(1); }
  50% { transform: scale(1.06); }
  100% { transform: scale(1); }
}
@keyframes pulse-soft {
  0%, 100% { box-shadow: 0 0 6px rgba(255, 107, 107, 0.3); }
  50% { box-shadow: 0 0 14px rgba(255, 107, 107, 0.5); }
}
@keyframes diamond-fill {
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1.1); }
}
```

### Stagger Pattern
- Tasks: **50ms** intervals on load
- Header: **50ms** intervals
- Completed tasks: **30ms** intervals (faster, less dramatic)

### Transition Defaults
```css
button, a, .interactive {
  transition: all 180ms var(--ease-smooth);
}
input {
  transition: box-shadow 250ms var(--ease-smooth), background 200ms var(--ease-smooth);
}
```

---

## Interaction — Fling System

Retained from v1. Physics, gesture detection, direction mapping, and game mechanics are ALL unchanged. Only visual treatments are updated:

### Ball Visual
```css
.fling-ball {
  border: 2px solid rgba(255, 255, 255, 0.12);
  background: radial-gradient(circle at 40% 35%, rgba(255,255,255,0.10), rgba(255,255,255,0.03));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
```

### Score Text
Nunito 700, 28px, `var(--text-primary)`. On goal/score, flash with `var(--accent-mint)`.

### Action Panel (Left Swipe)
```css
.action-panel {
  background: var(--surface-glass);
  backdrop-filter: blur(16px);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  box-shadow: var(--shadow-lifted);
}
```

### Particle Palette
`['#ff7b54', '#f472b6', '#60a5fa', '#4ade80', '#fbbf24', '#a78bfa', '#f4f0ed']`

Seven colors matching the full joy palette. Particles are now visually rich and varied — not monochrome orange.

---

## Glassmorphism Spec

```css
.glass {
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(1.3);
  -webkit-backdrop-filter: blur(20px) saturate(1.3);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
```

**Use glass:** chip bar, bottom nav, undo toast, action panel, sidebar backdrop.
**Don't use glass:** task items (too busy), input field (needs solidity), header (must be crisp).

---

## Focus Ring

```css
:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--bg-deep),
    0 0 0 4px var(--accent-coral);
}
```

For inputs specifically, use the wider diffused glow (see Task Input section) instead of this sharp ring.

---

## PWA

- **Theme color:** `#1a1625`
- **Background color:** `#1a1625`

```html
<meta name="theme-color" content="#1a1625">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

---

## Haptic Feedback

Unchanged from v1.

| Action | Pattern |
|--------|---------|
| Task submit | 8ms |
| Fling initiate | 5ms |
| Basketball bounce | 3–8ms |
| Basketball score | [10, 30, 10, 30, 20]ms |
| Bumper hit | 8ms |
| Slingshot release | 15ms |
| Checkbox completion | 10ms |

---

## Do NOT

- Use emoji as nav icons (use text symbols: ↓ ◉ → ◫)
- Use a sidebar on mobile (use slide-over)
- Use pure black (`#000`) or gray-black (`#0a0a0a`, `#111`) backgrounds
- Use opaque hex fills for surfaces
- Use pure white (`#fff`) for text
- Use a single accent color for everything (use the multi-hue joy palette)
- Use monochrome orange as the only accent
- Use neutral/gray checkboxes for completed state (completion = rose gradient celebration)
- Use CSS `border` for focus states (use box-shadow glows)
- Use hard, sharp border-radius (minimum 10px everywhere)
- Use shadows darker than the Float level
- Use flat, unblurred backgrounds on glass surfaces
- Use Inter, Roboto, Arial, or system-ui as visible fonts
- Make completed checkboxes look sad or neutral — they should glow with satisfaction
- Show loading spinners (use skeleton shimmer)
- Animate everything simultaneously (stagger 30-50ms)

---

## Migration Checklist: v2 → v3

| Area | v2 | v3 |
|------|-----|-----|
| Background | Blue-black `#060608` | Warm dusk `#1a1625` with violet undertone |
| Gradient | Subtle orange-only | Multi-hue: peach, rose, blue, mint |
| Accent | 5-stop orange scale | 6-color joy palette (coral, rose, sky, mint, amber, lavender) |
| Completed checkbox | Neutral gray | Rose-to-coral gradient with glow — celebration! |
| Display font | Instrument Serif italic | Nunito 800 (rounded sans) |
| Body font | Satoshi | General Sans |
| Mono font | JetBrains Mono | IBM Plex Mono |
| Date badges | Orange-tinted | Sky-blue (time = sky) |
| Active chip | Orange gradient | Sunset gradient (coral→rose) |
| Active sidebar item | Orange | Lavender (organization = lavender) |
| Header divider | Orange glow line | Rainbow whisper (coral→rose→lavender→sky) |
| Particles | Orange palette | Full 7-color joy palette |
| Min border-radius | 8px | 10px |
| Shadow style | Minimal | Soft, diffused, pillow-like |
| Input icon | ◆ filled diamond | ◇ outlined → fills on focus |
| Success/confirm | (none) | Mint green |
| Overall feel | Dark moody utility | Warm twilight toy |

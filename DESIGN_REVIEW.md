# Design Review — Current State

Harsh, honest, actionable. Fix everything in this file before adding any new features.

---

## Overall Verdict

It looks like a developer's debug view, not an app anyone would choose over Apple Reminders. The structure is there but the styling is phoned in. Every element needs more care.

---

## Problems (top to bottom)

### 1. No horizontal padding — STILL

Everything bleeds to the left edge of the screen. "GOOD EVENING", "Inbox", the stats line, the tasks — all flush left against the screen bezel. This is the single biggest thing making it look unfinished.

**Fix:** 20px padding on left and right for ALL content. The input and bottom nav can go edge-to-edge for their background, but their inner content still needs 20px inset.

```css
/* Every content container */
padding-left: 20px;
padding-right: 20px;
```

---

### 2. Header is lifeless

"GOOD EVENING" → "Inbox" → "1 remaining 11 done" is three lines of raw text with no hierarchy, no spacing, no presence. The greeting and stats are the same dim color and nearly the same size — there's no visual separation.

**Fix:**
- Add 48px top padding (plus safe area) to push the header down from the browser chrome
- Greeting: 12px, uppercase, letter-spacing 0.12em, `--color-text-dim` — this is fine but needs top spacing
- View title ("Inbox"): bump to 28px, DM Sans 700, `--color-text` — this needs to be commanding
- Stats: 13px, `--color-text-dim` — add 8px gap above it
- Add a bottom accent line: `border-bottom: 1px solid` with a gradient from `--color-accent` to transparent. This gives the header a finished edge
- Total header bottom padding: 20px before the task list starts

---

### 3. "COMPLETED" section header is too prominent and wrong position

It says "COMPLETED" in overline style right below the stats, then ALL visible tasks are completed. The one remaining active task is either scrolled off or missing. The completed section dominates the entire screen.

**Fix:**
- Active tasks ALWAYS come first, completed tasks are below a collapsible divider
- The "Completed" divider should be: a thin line with the word "Completed · 11" centered in it, 11px, dim, with a chevron to collapse. Like:
```
  ──── Completed · 11  ▾ ────
```
- Completed tasks should be collapsed by default if there are more than 5. Show first 3 with a "Show all" link
- Completed tasks are taking too much vertical space — reduce their padding to 10px vertical (vs 14px for active tasks). They're done, they don't need breathing room

---

### 4. Completed task styling is wrong

Orange filled checkboxes with white checks on struck-through dim text. The orange is your ACCENT color — it should mean "active, important, look at me." Using it for completed tasks inverts the visual hierarchy. Done things are screaming louder than active things.

**Fix:**
- Completed checkbox: `--color-border-light` (#333) fill, subtle white/gray check mark. NOT orange
- Completed text: `--color-done-text` (#3a3a3a) with line-through in `#333` — this is correct, keep it
- The whole completed row should feel like it's receding, not announcing itself
- Reduce completed task opacity to 0.5 for the entire row

---

### 5. Tasks have too much vertical padding

Each completed task takes roughly 70-80px of height. That's enormous for a single line of text. You can only see about 7 tasks on screen. In a todo app, density matters — you should see 12-15.

**Fix:**
- Active task: 14px vertical padding, fine as-is
- Completed task: 10px vertical padding
- Reduce checkbox size from what looks like 40px+ to 22px
- Task text should be vertically centered with the checkbox, not offset

---

### 6. Divider lines between tasks are too visible

The lines between completed tasks are heavier than they should be. They create a striped/banded look that's distracting.

**Fix:**
- Use `border-bottom: 1px solid rgba(255, 255, 255, 0.03)` — almost invisible, just enough to separate
- No divider after the last task in a section
- No divider between section header and first task

---

### 7. Input field — better but still floating

The input now has the "+" and placeholder text, which is good. But it still looks like it's barely there — no visible container, no surface color.

**Fix:**
- Background: `--color-surface` (#141414)
- Border: 1px solid `--color-border` (#222)
- Border-radius: 12px
- Padding: 14px 16px
- Margin: 0 12px (inset from screen edge)
- The "+" should be `--color-accent`
- On focus: border becomes `--color-accent`, add `box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15)`
- There should be 12px gap between the input and the bottom nav below it

---

### 8. Bottom nav — functional but bland

The icons (↓ ◉ → and a grid icon for Spaces) are correct. But there's no visual container for the nav bar — it just sits on the same black background as everything else.

**Fix:**
- Background: `--color-surface` (#141414)
- Top border: 1px solid `--color-border` (#222)
- Height: 64px + safe-area-inset-bottom
- Active item: `--color-accent` for both icon and label, with a 4px dot below the label
- Inactive items: `--color-text-dim`
- The nav bar should feel like a distinct surface, separated from the content above

---

### 9. No empty state design

When you complete all tasks, the screen is just... black. There's no delight, no message, nothing to tell you "nice work, you're done" or "add something new."

**Fix:**
- When active tasks = 0, show centered empty state:
  - Large thin circle "○" at 48px, opacity 0.3
  - "All clear" in 22px DM Sans 600, `--color-text-dim`
  - "Your inbox is empty" in 14px, `--color-text-dim` at 0.6 opacity
  - Fade-in animation

---

### 10. No visual rhythm or delight anywhere

The app is technically dark mode but it's not *atmospheric*. It's just black with some gray text. There's no moment where you think "oh that's nice."

**Fix — quick wins that add life:**
- Header accent line (gradient left to right, orange to transparent)
- Input focus glow (the 3px accent-glow ring)
- Task completion animation: checkbox fills with a scale pop (1.0 → 1.15 → 1.0 over 200ms), then the text gets strike-through drawn left-to-right over 150ms, then the whole row slides right and fades over 300ms
- When adding a task: new item slides down from above with a subtle fade-in (300ms, ease-out)
- Stagger animation on initial load: each task appears 30ms after the previous one
- Chip bar chips should have a micro-bounce when toggled (scale 1.0 → 1.08 → 1.0, 150ms)

---

## Priority Order

Do these in order. Each one makes a visible difference:

1. **Padding** — 20px horizontal everywhere (5 minutes, biggest visual impact)
2. **Input container** — surface, border, focus glow (10 minutes)
3. **Bottom nav surface** — background, top border (5 minutes)
4. **Completed checkbox color** — change from orange to gray (5 minutes)
5. **Header spacing and accent line** (10 minutes)
6. **Task density** — reduce completed task padding and checkbox size (10 minutes)
7. **Completed section collapse** — divider line, collapse by default (15 minutes)
8. **Divider weight** — make nearly invisible (2 minutes)
9. **Empty state** (10 minutes)
10. **Animations** — completion, add, load stagger (20 minutes)

---

## The Vibe Check

Ask yourself after each fix: "Would I delete Apple Reminders for this?"

If no, keep going.

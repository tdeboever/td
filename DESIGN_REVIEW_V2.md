# Design Review v2 — From Clean to Exceptional

The bones are right. Padding is there, input has a container, completed section collapses, bottom nav has a surface, focus glow works. The app is *correct* now. But correct isn't the goal. The goal is someone pulls this up and says "what IS this?" 

Right now it's a dark todo app. It needs to become a *beautiful* dark todo app. Here's everything standing between where we are and that.

---

## The Core Problem: It's Flat

Every element is the same visual weight. Background is flat black. Surfaces are flat dark gray. Text is flat dim or flat white. There's no depth, no atmosphere, no layers. It reads like a single plane of content on a void.

Great dark UIs feel like you're looking INTO something — layers of glass, subtle gradients, light bleeding from edges. Right now this feels like a spreadsheet with the lights off.

---

## 1. Add Atmosphere to the Background

The background is pure flat `#0a0a0a`. That's correct as a base but it needs texture or a subtle gradient to feel alive.

**Fix:** Add a very subtle radial gradient from the top of the page. Not a color — just a hint of warmth.

```css
body {
  background: #0a0a0a;
  background-image: radial-gradient(
    ellipse at 50% 0%,
    rgba(255, 107, 53, 0.03) 0%,
    transparent 60%
  );
}
```

This creates an almost imperceptible warm glow from the top center. You shouldn't consciously notice it, but it makes the whole screen feel less dead.

---

## 2. The Header Needs Presence

"GOOD AFTERNOON" / "Inbox" / "1 remaining 1 done" is laid out correctly but it's just text. There's no moment of arrival.

**Fix:**
- The view title ("Inbox") should be 32px, DM Sans 700, and it should have a very subtle text-shadow: `0 0 40px rgba(255, 107, 53, 0.1)` — a barely-there warm halo
- Add a staggered fade-in on load: greeting appears first (0ms), title second (80ms), stats third (160ms). Use `opacity 0→1` and `translateY 8px→0` over 400ms with `cubic-bezier(0.16, 1, 0.3, 1)`
- The accent line below the header is good — but make it thinner (1px, not 2px) and add a slight fade animation when the view changes

---

## 3. Task Items Need More Design

Each task is a checkbox + text + date. Visually it's a list of strings. There's nothing that makes each task feel like a *card* or an *object* you interact with.

**Fix — give tasks a subtle surface on interaction:**
- Default state: no background (transparent), as-is
- Hover/touch state: background fades to `rgba(255, 255, 255, 0.02)`, border-radius 12px. This makes each task feel tangible when you reach for it
- Active/pressed state: background `rgba(255, 255, 255, 0.04)`, slight scale `0.98` (press-in effect, 100ms)
- The checkbox should have a hover glow: `box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1)` on hover/touch

**Fix — metadata styling:**
- "Apr 11" is too plain. Make it a mini pill: `background: rgba(255,255,255,0.04)`, `padding: 2px 8px`, `border-radius: 6px`, `font-size: 11px`
- If a task has a priority, show the colored dot BEFORE the text on the same line, not as metadata below

---

## 4. The Input is Good But Not Delightful

The input container, orange border on focus, "swipe up to send" — all correct. But it's still just a text field.

**Fix:**
- Add a subtle inner shadow when focused: `box-shadow: inset 0 1px 2px rgba(0,0,0,0.3), 0 0 0 3px rgba(255, 107, 53, 0.15)` — this makes it feel recessed, like a real input
- The "+" icon should pulse gently once when the input receives focus (scale 1.0→1.2→1.0, 300ms). Just once, not looping
- "swipe up to send" text — make this even more subtle. `opacity: 0.25`, only visible while typing. It's a hint, not a label
- The send arrow (↑) should only appear when there's text in the input. When it appears, fade in + slide up 4px over 200ms

---

## 5. Date Chips Are Close But Need Polish

The date chips (Today, Tomorrow, Saturday, Monday, Pick) have pill shapes now which is good. But they look like buttons on a form, not part of a cohesive design.

**Fix:**
- Add a subtle frosted glass effect to the chip row background: `background: rgba(20, 20, 20, 0.8)`, `backdrop-filter: blur(8px)`
- When a chip is active (selected), don't just change background to accent. Add a subtle glow: `box-shadow: 0 0 8px rgba(255, 107, 53, 0.25)`
- The chip row should be separated from the input by 8px, and have its own visual container (thin top border, `rgba(255,255,255,0.05)`)
- Missing: space chips (home/work) and priority chips should also be visible here. Three groups in one scrollable row: `[home] [work] | [● urgent] [↑ high] | [Today] [Tomorrow] [Sat]` — separated by 16px gaps between groups

---

## 6. The Completed Section Divider is Perfect — Protect It

"Completed · 1 ▾" as a centered divider line is exactly right. Don't change this. But the completed task below it needs work.

**Fix:**
- Completed tasks should have `opacity: 0.35` on the entire row, not just dim text
- On hover, completed tasks should rise to `opacity: 0.6` — they come alive when you reach for them
- The completed checkbox should be `#2a2a2a` fill (dark gray), not the current style. The checkmark inside should be `#555` — subtle, not attention-grabbing

---

## 7. The Space Picker (slide-over) Needs Love

The slide-over panel is functional but raw. Folder emoji icons, plain text, "List name..." input field just hanging there.

**Fix:**
- Drop the folder emoji (📁). Use colored dots or single-letter avatars instead: a 28px circle with the space's color, first letter of the space name inside it in white. `W` for Work on a blue circle, `H` for Home on a green circle
- Active view indicator: instead of a red left border, use the accent color as a subtle left bar (3px wide, rounded, with a glow: `box-shadow: 0 0 6px rgba(255, 107, 53, 0.3)`)
- The list items under each space should be indented 40px (aligned with the space name, not the dot)
- "+ Add list" and "+ New space" should be `--color-text-dim` with the "+" in `--color-accent`
- The "List name..." input and "Tasks / Checklist" toggle need a container — right now they float. Wrap them in a surface with border-radius 8px, padding 12px, `background: rgba(255,255,255,0.03)`
- The backdrop behind the panel: `background: rgba(0,0,0,0.5)`, `backdrop-filter: blur(4px)`

---

## 8. Bottom Nav — Functional But Generic

It works but it looks like every bottom nav ever made. The icons and labels are fine, the surface is fine. It just doesn't have any character.

**Fix:**
- Active indicator: instead of just orange text, add a small glowing dot (4px circle) below the label. Give it a subtle pulse animation on first activation (one pulse, not continuous)
- The active icon should have a very faint glow: `text-shadow: 0 0 8px rgba(255, 107, 53, 0.3)`
- Add a top edge highlight: instead of a flat 1px border, use `border-top: 1px solid rgba(255, 107, 53, 0.1)` — a whisper of the accent color, not gray
- Increase icon size slightly — they're a bit small. 22px for icons, 11px for labels

---

## 9. Animations Are Missing

The app has no motion. Every state change snaps instantly. This is the #1 reason it doesn't feel premium.

**Fix — implement these in priority order:**

### Task added
New task slides in from top, staggered:
```css
@keyframes taskEnter {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}
/* duration: 350ms, easing: cubic-bezier(0.16, 1, 0.3, 1) */
```

### Task completed
Three-phase animation:
1. Checkbox fills with accent color, scales 1.0→1.15→1.0 (200ms)
2. Text gets strikethrough drawn left-to-right (CSS `background-size` animation, 200ms)
3. Entire row slides right 30px and fades to 0 (300ms, then moves to completed section)
```css
/* Use transition on the row */
.task-completing {
  transform: translateX(30px);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

### View transitions
When switching between Inbox/Today/Upcoming, cross-fade the task list:
```css
@keyframes viewFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
/* duration: 250ms */
```

### Space picker
Slides in from left over 300ms with the backdrop fading in simultaneously.

### Initial load
Each task staggers in 40ms apart:
```css
.task-item:nth-child(1) { animation-delay: 0ms; }
.task-item:nth-child(2) { animation-delay: 40ms; }
.task-item:nth-child(3) { animation-delay: 80ms; }
/* etc — use style={{ animationDelay: `${index * 40}ms` }} in React */
```

---

## 10. Add One Signature Detail

Every great app has one detail that makes people say "oh that's nice." Pick ONE:

**Option A — Completion confetti:** When you complete the last active task, a burst of 6-8 tiny orange particles explode from the checkbox position and fade out. CSS-only, no library needed.

**Option B — Breathing dot:** The active nav indicator dot gently pulses opacity between 0.6 and 1.0 on a 3-second loop. Subtle, hypnotic, alive.

**Option C — Ghost gradient:** When the task list is empty, a very subtle animated gradient (accent color, 2% opacity) slowly shifts position in the background. The app feels like it's breathing even when idle.

I'd go with **Option C** — it makes the empty state feel intentional rather than just "no tasks."

---

## Priority Order

1. Background atmosphere gradient (2 minutes)
2. Task interaction states — hover surface, pressed scale (15 minutes)
3. Animations — task enter, complete, view transitions, load stagger (30 minutes)
4. Input polish — inner shadow, "+" pulse, send arrow fade-in (10 minutes)
5. Chip row — all three groups visible, frosted container, active glow (15 minutes)
6. Header text-shadow and stagger entrance (10 minutes)
7. Completed task opacity and checkbox color (5 minutes)
8. Space picker redesign — letter avatars, active glow bar, backdrop blur (20 minutes)
9. Bottom nav — glow dot, accent border-top, icon sizing (10 minutes)
10. Signature detail — pick one and implement (15 minutes)

---

## The Standard

After these changes, screenshot the app and compare it side-by-side with Things 3, Todoist dark mode, and Apple Reminders. If it doesn't hold its own, something is still off.

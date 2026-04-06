# Focus — Personal Todo App

## Architecture Document v1

---

## Vision

A personal todo app built for speed and beauty. Instant task capture, effortless organization, works everywhere — phone, tablet, desktop. Offline-first, syncs across devices.

---

## Tech Stack

| Layer         | Choice           | Why                                                    |
|---------------|------------------|--------------------------------------------------------|
| Framework     | React + Vite     | Fast dev, fast builds, great ecosystem                 |
| Styling       | Tailwind CSS     | Ship fast, responsive, consistent                      |
| State         | Zustand          | Tiny, simple, pairs with persistence middleware        |
| Cloud Sync    | Supabase         | Free tier, real-time sync, auth, Postgres underneath   |
| PWA           | vite-plugin-pwa  | Service worker, offline cache, install prompt          |
| Hosting       | Vercel / Netlify | Zero-config deploys from GitHub                        |

---

## Data Model

### Spaces

Top-level separation of contexts (e.g., Work, Home, Side Project). Users can create, rename, reorder, and delete spaces.

### Lists

Live inside a space. Examples: "Meetings" under Work, "Groceries" under Home. Two types:

- **`tasks`** — standard todo list, completed items fade to bottom
- **`checklist`** — enables ghost items and reset (for recurring lists like groceries)

### Todos

The atomic unit. Belongs to a list, which belongs to a space.

### Smart Views (cross-space)

- **Inbox** — unsorted todos, not yet assigned to a list
- **Today** — all todos due today, from any space
- **Upcoming** — all todos with future due dates

### Schema

```
Space
  id            string (uuid)
  name          string
  icon          string (emoji)
  color         string (hex)
  position      number
  user_id       string (fk)
  created_at    timestamp
  updated_at    timestamp

List
  id            string (uuid)
  name          string
  type          'tasks' | 'checklist'
  space_id      string (fk)
  position      number
  user_id       string (fk)
  created_at    timestamp
  updated_at    timestamp

Todo
  id            string (uuid)
  text          string
  status        'active' | 'done' | 'ghost'
  priority      0 | 1 | 2 | 3          (0=none, 1=urgent, 2=high, 3=normal)
  list_id       string (fk, nullable)   (null = Inbox)
  space_id      string (fk, nullable)   (null = Inbox)
  due_date      date (nullable)
  snoozed_until timestamp (nullable)    (hidden from view until this time)
  position      number
  completion_count  number (default 0)  (drives autocomplete ranking)
  last_completed_at timestamp (nullable)
  user_id       string (fk)
  created_at    timestamp
  updated_at    timestamp
```

---

## Information Architecture

```
App
├── Smart Views (cross-space)
│   ├── Inbox        → unsorted todos, assign later
│   ├── Today        → due today, all spaces
│   └── Upcoming     → future due dates
│
├── Space: Work
│   ├── List: General Tasks
│   ├── List: Meetings
│   └── List: Projects
│
├── Space: Home
│   ├── List: Groceries (checklist type)
│   ├── List: Chores
│   └── List: Errands
│
└── Space: [user-created...]
```

---

## Interaction Model

### Adding Tasks

**Principle: Capture in under 2 seconds. Organize whenever you want.**

Three submit paths (user picks what feels natural):
- **Swipe up** on the input area — "toss" the task into your list
- **Tap** the send arrow
- **Keyboard return** key

**Contextual defaults:** If viewing Work space, new task auto-assigns to Work. Viewing Home → Home. Viewing Today/Inbox → Inbox. Zero extra taps for the common case.

**Chip bar (always visible, never required):**
Displayed above the input field so it's visible when the keyboard is open.

```
[Work] [Home] [...]          ← space chips, current auto-highlighted
[● Urgent] [↑ High] [— Normal]  ← priority chips
[Today] [Tomorrow] [No date]    ← due date chips
```

All chips are optional. Defaults: current space, no priority, no date. Tapping a chip is a toggle — one tap on, one tap off.

### Completing Tasks

- **Swipe right** to complete (primary gesture on mobile)
- **Tap checkbox** (fallback, works everywhere)
- Completion triggers: strike-through animation, task slides down to "done" section, haptic buzz if available
- **Undo toast** — "Task completed · Undo" — lingers 4 seconds. Always.

### Gesture Vocabulary

| Gesture       | Action          |
|---------------|-----------------|
| Swipe up      | Submit new task |
| Swipe right   | Complete task   |
| Swipe left    | Snooze → shows: Later today / Tomorrow / Pick a date |
| Tap chip      | Toggle metadata |
| Long press    | Reorder (v2)    |

### Snoozing Tasks

- **Swipe left** on a task to reveal snooze options
- Three choices appear as a slide-out panel:
  - **Later today** — reschedules to 3 hours from now (or 9 AM tomorrow if evening)
  - **Tomorrow** — sets due date to tomorrow morning
  - **Pick a date** — opens a minimal date picker
- Snoozed tasks disappear from current view, reappear when due
- Undo toast: "Snoozed to tomorrow · Undo" — 4 seconds

### Ghost Items (checklist mode)

For recurring lists like groceries:
- Completing an item turns it into a "ghost" — greyed out, at the bottom
- One tap on a ghost reactivates it
- Ghost items sorted by `completion_count` (most frequently used first)
- List-level "Reset" action → all items go back to unchecked

### Autocomplete

When typing in a list that has history, past item texts surface as tappable suggestion chips above the keyboard. Ranked by `completion_count`.

---

## Mobile-First Layout (Keyboard Open)

The keyboard takes ~40% of the screen. The remaining ~55% must fit everything.

```
┌─────────────────────────┐
│ Work              3 tasks│  ← collapsed 1-line header
│─────────────────────────│
│ ☐ prep slides Thu        │  ← 1-2 tasks peek through
│ ☐ email janet            │
│                          │
│ [Work] [Home]            │  ← space chips
│ [●] [↑] [—]  [Today]    │  ← priority + date, single row
│┌───────────────────────┐│
││ buy groceries        ↑ ││  ← input + send hint
│└───────────────────────┘│
│▔▔▔▔▔▔ swipe up ▔▔▔▔▔▔▔▔│  ← swipe zone
├─────────────────────────┤
│                          │
│       keyboard           │
│                          │
│                          │
└─────────────────────────┘
```

When keyboard closes: header expands, full task list visible, chip bar tucks away.

---

## Sync Strategy (Offline-First)

1. **Local Zustand store is the source of truth**
2. Changes write locally first → instant UI
3. Background push to Supabase
4. On app load: pull remote state, reconcile using `updated_at` (last-write-wins)
5. Real-time subscription for multi-device updates
6. App works fully offline — sync resumes when connection returns

---

## Project Structure

```
focus/
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── BottomNav.jsx
│   │   ├── todo/
│   │   │   ├── TodoItem.jsx
│   │   │   ├── TodoList.jsx
│   │   │   ├── TodoInput.jsx
│   │   │   ├── ChipBar.jsx
│   │   │   ├── SwipeHandler.jsx
│   │   │   ├── GhostItem.jsx
│   │   │   └── UndoToast.jsx
│   │   ├── spaces/
│   │   │   ├── SpaceSelector.jsx
│   │   │   └── SpaceManager.jsx
│   │   └── common/
│   │       ├── Chip.jsx
│   │       └── EmptyState.jsx
│   ├── stores/
│   │   ├── todoStore.js
│   │   ├── spaceStore.js
│   │   ├── listStore.js
│   │   └── uiStore.js
│   ├── hooks/
│   │   ├── useSync.js
│   │   ├── useAuth.js
│   │   ├── useKeyboard.js
│   │   ├── useSwipe.js
│   │   └── useAutocomplete.js
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── storage.js
│   │   └── utils.js
│   ├── pages/
│   │   ├── App.jsx
│   │   ├── Login.jsx
│   │   └── Settings.jsx
│   ├── styles/
│   │   └── globals.css
│   ├── main.jsx
│   └── sw.js
├── index.html
├── tailwind.config.js
├── vite.config.js
├── package.json
└── README.md
```

---

## Phase Plan

### Phase 1 — Scaffold
- Vite + React + Tailwind + PWA config
- Folder structure, routing, app shell
- Zustand stores with local persistence
- No backend yet

### Phase 2 — Core UI
- TodoInput with chip bar and swipe-to-submit
- TodoList with swipe-to-complete
- Undo toast
- Smart views (Inbox, Today, Upcoming)
- Spaces and lists navigation

### Phase 3 — Checklist Mode
- Ghost items
- Autocomplete from history
- List reset

### Phase 4 — Supabase Integration
- Auth (Google sign-in only)
- Database tables matching schema
- Sync hook (offline-first reconciliation)
- Real-time subscriptions
- Push notifications for due dates

### Phase 5 — Polish
- Animations and transitions
- Haptic feedback
- PWA install prompt
- Keyboard shortcuts (desktop)
- Dark theme only (no toggle needed)

---

## Resolved Decisions

| Question | Decision |
|----------|----------|
| Swipe left | Snooze — three options: later today, tomorrow, pick a date |
| Sub-tasks | No. Flat structure, keep it simple |
| Tags / labels | No. Spaces + lists is enough |
| Shared lists | Architect for it (user_id on all models) but build later |
| Notifications | Push notifications for due dates |
| Theme | Dark only |
| Auth | Google sign-in only |
| Default spaces | None — blank slate, user creates their own |
| App name | TBD |
| Smart filtering | No ML — replaced by always-visible chip bar for instant tapping |

---

## Future Scope (not in v1)

- Shared lists (partner can add to grocery list)
- Drag-to-reorder tasks (long press)
- Search across all tasks
- Bulk actions (select multiple → move, delete, snooze)
- Widgets (iOS/Android home screen via PWA)
- Calendar view for upcoming tasks

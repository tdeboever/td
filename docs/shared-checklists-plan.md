# Shared Checklists — Implementation Plan

## Architecture Overview

The core challenge: everything is currently single-user (`user_id` = you). Sharing means User B needs to read/write rows User A owns. This touches database, RLS policies, realtime sync, and UI.

---

## Phase 1: Database Schema

### New table: `user_profiles`

Auto-created on signup via trigger. Stores email/name/avatar so users can find each other.

```sql
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index idx_user_profiles_email on user_profiles(email);
alter table user_profiles enable row level security;

-- Anyone authenticated can read profiles (needed for looking up share targets)
create policy "Authenticated users read profiles" on user_profiles
  for select using (auth.role() = 'authenticated');

-- Users can only update their own profile
create policy "Users update own profile" on user_profiles
  for update using (auth.uid() = id);
```

Auto-create trigger:

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

### New table: `list_shares`

Junction table representing sharing relationships.

```sql
create table list_shares (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references lists(id) on delete cascade not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  shared_with_id uuid references auth.users(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  role text check (role in ('editor', 'viewer')) default 'editor',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(list_id, shared_with_id)
);

create index idx_list_shares_owner on list_shares(owner_id);
create index idx_list_shares_shared on list_shares(shared_with_id);
create index idx_list_shares_list on list_shares(list_id);

alter table list_shares enable row level security;

-- Owners can manage shares they created
create policy "Owners manage shares" on list_shares
  for all using (auth.uid() = owner_id);

-- Shared users can view and update (accept/decline) shares directed at them
create policy "Shared users view their shares" on list_shares
  for select using (auth.uid() = shared_with_id);

create policy "Shared users update their shares" on list_shares
  for update using (auth.uid() = shared_with_id)
  with check (auth.uid() = shared_with_id);
```

### RLS policy changes for `lists`

```sql
-- Drop existing policy
drop policy "Users manage own lists" on lists;

-- Users can do everything with their own lists
create policy "Users manage own lists" on lists
  for all using (auth.uid() = user_id);

-- Shared users can SELECT lists shared with them (accepted shares only)
create policy "Shared users read lists" on lists
  for select using (
    exists (
      select 1 from list_shares
      where list_shares.list_id = lists.id
        and list_shares.shared_with_id = auth.uid()
        and list_shares.status = 'accepted'
    )
  );

-- Shared users can UPDATE lists shared with them (editors only)
create policy "Shared users update lists" on lists
  for update using (
    exists (
      select 1 from list_shares
      where list_shares.list_id = lists.id
        and list_shares.shared_with_id = auth.uid()
        and list_shares.status = 'accepted'
        and list_shares.role = 'editor'
    )
  );
```

### RLS policy changes for `todos`

```sql
drop policy "Users manage own todos" on todos;

-- Users manage their own todos
create policy "Users manage own todos" on todos
  for all using (auth.uid() = user_id);

-- Owners can see all todos in their shared lists (including those added by collaborators)
create policy "Owners read shared list todos" on todos
  for select using (
    list_id is not null and exists (
      select 1 from lists
      where lists.id = todos.list_id
        and lists.user_id = auth.uid()
    )
  );

-- Shared users can SELECT todos in shared lists
create policy "Shared users read shared todos" on todos
  for select using (
    list_id is not null and exists (
      select 1 from list_shares
      where list_shares.list_id = todos.list_id
        and list_shares.shared_with_id = auth.uid()
        and list_shares.status = 'accepted'
    )
  );

-- Shared users can INSERT todos into shared lists
create policy "Shared users insert shared todos" on todos
  for insert with check (
    list_id is not null and exists (
      select 1 from list_shares
      where list_shares.list_id = todos.list_id
        and list_shares.shared_with_id = auth.uid()
        and list_shares.status = 'accepted'
        and list_shares.role = 'editor'
    )
  );

-- Shared users can UPDATE todos in shared lists
create policy "Shared users update shared todos" on todos
  for update using (
    list_id is not null and exists (
      select 1 from list_shares
      where list_shares.list_id = todos.list_id
        and list_shares.shared_with_id = auth.uid()
        and list_shares.status = 'accepted'
        and list_shares.role = 'editor'
    )
  );

-- Shared users can DELETE todos in shared lists
create policy "Shared users delete shared todos" on todos
  for delete using (
    list_id is not null and exists (
      select 1 from list_shares
      where list_shares.list_id = todos.list_id
        and list_shares.shared_with_id = auth.uid()
        and list_shares.status = 'accepted'
        and list_shares.role = 'editor'
    )
  );
```

---

## Phase 2: Invitation & Sharing Flow

### Edge Function: `share-list`

File: `supabase/functions/share-list/index.ts`

- Client calls with `{ listId, email }`
- Verifies caller owns the list
- Looks up target user by email in `user_profiles`
- Creates `list_shares` row with `status: 'pending'`
- Optionally sends push notification to invitee

### Zustand store: `shareStore.js`

File: `src/stores/shareStore.js`

```
State:
  shares: []          // list_shares rows relevant to this user
  sharedLists: []     // lists shared with this user
  sharedTodos: []     // todos in shared lists

Actions:
  fetchShares(userId)           // pull list_shares where owner_id or shared_with_id = userId
  acceptShare(shareId)          // update status to 'accepted'
  declineShare(shareId)         // update status to 'declined'
  revokeShare(shareId)          // delete the share row (owner action)
  inviteUser(listId, email)     // call the Edge Function
  fetchSharedLists()            // pull lists the user has accepted shares for
  fetchSharedTodos(listIds)     // pull todos for those lists

Selectors:
  getPendingInvites()           // shares where shared_with_id = me, status = 'pending'
  getMySharedLists()            // shares where owner_id = me
  getListCollaborators(listId)  // all accepted shares for a given list
```

### Accept/decline flow

1. User opens app → `fetchShares` called alongside normal sync
2. Pending invites shown as banner/notification
3. Accept → `list_shares.status` updated to `'accepted'`
4. Shared list + todos fetched, realtime subscription established

---

## Phase 3: Realtime Sync Changes

### Separate realtime channels for shared lists

Currently `useSync` subscribes filtered by `user_id`. Shared todos have a different `user_id`, so they need separate channels.

```js
// Per shared list
for (const share of acceptedShares) {
  supabase
    .channel(`shared-list-${share.list_id}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'todos',
      filter: `list_id=eq.${share.list_id}`
    }, handleSharedRealtimeChange)
    .subscribe()
}

// For new invites
supabase
  .channel('share-invites')
  .on('postgres_changes', {
    event: '*', schema: 'public', table: 'list_shares',
    filter: `shared_with_id=eq.${userId}`
  }, handleShareChange)
  .subscribe()
```

### Immediate push for shared mutations

Shared list changes must push to Supabase immediately (not batch sync). The todoStore actions need to detect shared list membership and push right away.

### Don't overwrite `user_id`

When pushing updates to other users' todos (e.g., checking off their item), preserve the original `user_id`. The current `pushAll` always sets `userId` — this must be skipped for shared todos created by others.

---

## Phase 4: UI Components

### New components

| Component | File | Description |
|-----------|------|-------------|
| `ShareSheet` | `src/components/sharing/ShareSheet.jsx` | Bottom sheet: invite by email, see collaborators, revoke access |
| `InviteBanner` | `src/components/sharing/InviteBanner.jsx` | Notification for pending invites |
| `SharedListBadge` | `src/components/sharing/SharedListBadge.jsx` | Small people icon next to shared lists |

### Modifications to existing components

- **`Sidebar.jsx`** — Add "Shared with me" section, share button on checklists, invite notification badge
- **`Header.jsx`** — Show collaborator avatars or "shared" indicator when viewing a shared list
- **`TodoInput.jsx`** — Ensure `userId` is set to current user when adding to shared lists
- **`TodoItem.jsx`** — Optionally show avatar/initial of who added each item

### Navigation

Shared lists appear in a "Shared" section in the sidebar. Tapping navigates using existing `activeView: 'list'` with `activeListId` set to the shared list ID.

---

## Phase 5: Edge Cases

### Offline edits
- Local changes to shared lists queue up, push on reconnect
- Only push todos where `userId === currentUserId` (don't re-push other user's items)
- Updates to other user's todos (check-off) tracked separately and pushed as updates (not upserts with new user_id)

### Conflict resolution
- Last-write-wins with server `updatedAt` timestamps
- Fine for grocery list use case (both checking off same item → same result)

### Revocation
- Owner deletes `list_shares` row
- `ON DELETE CASCADE` cleans up
- Revoked user's realtime subscription stops receiving events (RLS blocks)
- Client handles removal from local state

### Owner deletes shared list
- `ON DELETE CASCADE` on `list_shares.list_id` removes all shares
- Cascade on todos removes all items
- Shared users' realtime subscriptions fire DELETE events
- Client removes list from "Shared" section

### Attribution
- Each todo keeps its creator's `user_id`
- Allows showing who added what in shared lists

---

## Build Order

1. **DB migration** — `supabase/migrations/002_shared_checklists.sql`
2. **Edge function** — `supabase/functions/share-list/index.ts`
3. **Store/sync changes** — `shareStore.js`, modify `useSync.js`, `todoStore.js`, `listStore.js`
4. **UI components** — ShareSheet, InviteBanner, SharedListBadge, Sidebar/Header modifications
5. **Polish** — offline handling, revocation cleanup, loading/error states, concurrent editing tests

---

## Critical Files

| File | Change needed |
|------|---------------|
| `supabase/migrations/` | New migration for schema + RLS |
| `src/hooks/useSync.js` | Shared list realtime subscriptions, modified push/pull |
| `src/stores/todoStore.js` | Immediate push for shared mutations, handle shared todos |
| `src/stores/listStore.js` | Track shared-with-me lists |
| `src/components/layout/Sidebar.jsx` | Shared lists section, share actions, invite notifications |

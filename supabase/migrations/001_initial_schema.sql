-- Focus Todo App — Initial Schema
-- Run in Supabase SQL editor or via `supabase db push`

-- ============================================
-- Tables
-- ============================================

-- Spaces
create table spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text default '📁',
  color text default '#ff6b35',
  position int default 0,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Lists
create table lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('tasks', 'checklist')) default 'tasks',
  space_id uuid references spaces(id) on delete cascade not null,
  position int default 0,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Todos
create table todos (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  status text check (status in ('active', 'done', 'ghost')) default 'active',
  priority int check (priority between 0 and 3) default 0,
  list_id uuid references lists(id) on delete cascade,
  space_id uuid references spaces(id) on delete set null,
  due_date date,
  snoozed_until timestamptz,
  position int default 0,
  completion_count int default 0,
  last_completed_at timestamptz,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Push subscriptions (for notifications)
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  keys jsonb not null,
  created_at timestamptz default now()
);

-- ============================================
-- Indexes
-- ============================================

create index idx_todos_user on todos(user_id);
create index idx_todos_list on todos(list_id);
create index idx_todos_space on todos(space_id);
create index idx_todos_due on todos(due_date) where due_date is not null;
create index idx_todos_snoozed on todos(snoozed_until) where snoozed_until is not null;
create index idx_lists_space on lists(space_id);
create index idx_spaces_user on spaces(user_id);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger spaces_updated_at before update on spaces
  for each row execute function update_updated_at();
create trigger lists_updated_at before update on lists
  for each row execute function update_updated_at();
create trigger todos_updated_at before update on todos
  for each row execute function update_updated_at();

-- ============================================
-- Row Level Security
-- ============================================

alter table spaces enable row level security;
alter table lists enable row level security;
alter table todos enable row level security;
alter table push_subscriptions enable row level security;

create policy "Users manage own spaces" on spaces
  for all using (auth.uid() = user_id);

create policy "Users manage own lists" on lists
  for all using (auth.uid() = user_id);

create policy "Users manage own todos" on todos
  for all using (auth.uid() = user_id);

create policy "Users manage own subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id);

-- FixLog initial schema
-- Auth: Clerk via Supabase third-party auth. The Clerk user id is the JWT `sub`
-- claim and is stored as text in every row's user_id column.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.requesting_user_id()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'sub', '')::text
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.assets (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null default public.requesting_user_id(),
  name             text not null check (char_length(name) between 1 and 120),
  category         text not null check (category ~ '^[a-z_]{2,40}$'),
  item_type        text not null check (item_type ~ '^[a-z_]{2,40}$'),
  location         text check (char_length(location) <= 120),
  brand            text check (char_length(brand) <= 120),
  model            text check (char_length(model) <= 120),
  serial_number    text check (char_length(serial_number) <= 120),
  purchased_on     date,
  warranty_until   date,
  notes            text check (char_length(notes) <= 4000),
  archived         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.maintenance_tasks (
  id                 uuid primary key default gen_random_uuid(),
  user_id            text not null default public.requesting_user_id(),
  asset_id           uuid not null references public.assets (id) on delete cascade,
  title              text not null check (char_length(title) between 1 and 160),
  description        text check (char_length(description) <= 4000),
  interval_value     integer check (interval_value between 1 and 1000),
  interval_unit      text check (interval_unit in ('day', 'week', 'month', 'year')),
  next_due_on        date,
  last_completed_on  date,
  priority           text not null default 'medium'
                       check (priority in ('low', 'medium', 'high', 'critical')),
  status             text not null default 'pending'
                       check (status in ('pending', 'in_progress', 'waiting_parts',
                                         'scheduled_pro', 'on_hold', 'done')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint interval_both_or_neither
    check ((interval_value is null) = (interval_unit is null))
);

create table public.service_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null default public.requesting_user_id(),
  asset_id       uuid not null references public.assets (id) on delete cascade,
  task_id        uuid references public.maintenance_tasks (id) on delete set null,
  title          text not null check (char_length(title) between 1 and 160),
  performed_on   date not null,
  performed_by   text check (char_length(performed_by) <= 120),
  cost_cents     bigint check (cost_cents between 0 and 100000000000),
  currency       text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  reading        text check (char_length(reading) <= 60),
  notes          text check (char_length(notes) <= 4000),
  created_at     timestamptz not null default now()
);

create table public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null default public.requesting_user_id(),
  task_id     uuid not null references public.maintenance_tasks (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index assets_user_idx          on public.assets (user_id, archived, category);
create index tasks_user_due_idx       on public.maintenance_tasks (user_id, next_due_on);
create index tasks_asset_idx          on public.maintenance_tasks (asset_id);
create index logs_user_date_idx       on public.service_logs (user_id, performed_on desc);
create index logs_asset_idx           on public.service_logs (asset_id);
create index logs_task_idx            on public.service_logs (task_id);
create index comments_task_idx        on public.task_comments (task_id, created_at);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger assets_updated_at before update on public.assets
  for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.maintenance_tasks
  for each row execute function public.set_updated_at();

-- Ownership cannot be changed after insert.
create or replace function public.prevent_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id is immutable';
  end if;
  return new;
end;
$$;

create trigger assets_owner_immutable before update on public.assets
  for each row execute function public.prevent_owner_change();
create trigger tasks_owner_immutable before update on public.maintenance_tasks
  for each row execute function public.prevent_owner_change();
create trigger logs_owner_immutable before update on public.service_logs
  for each row execute function public.prevent_owner_change();
create trigger comments_owner_immutable before update on public.task_comments
  for each row execute function public.prevent_owner_change();

-- Children must reference parents owned by the same user. RLS on the parent
-- table is not enough because FK checks bypass RLS.
create or replace function public.enforce_same_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_owner text;
begin
  -- Updates that keep the same parents (including ON DELETE SET NULL cascades)
  -- need no re-check; this also keeps cascading deletes working.
  if tg_op = 'UPDATE' then
    if tg_table_name = 'task_comments' then
      if new.task_id = old.task_id then return new; end if;
    elsif tg_table_name = 'maintenance_tasks' then
      if new.asset_id = old.asset_id then return new; end if;
    elsif tg_table_name = 'service_logs' then
      if new.asset_id = old.asset_id
         and (new.task_id is null or new.task_id is not distinct from old.task_id) then
        return new;
      end if;
    end if;
  end if;

  if tg_table_name in ('maintenance_tasks', 'service_logs') then
    select a.user_id into parent_owner from public.assets a where a.id = new.asset_id;
    if parent_owner is distinct from new.user_id then
      raise exception 'asset does not belong to user' using errcode = '42501';
    end if;
  end if;

  if tg_table_name = 'service_logs' then
    if new.task_id is not null then
      select t.user_id into parent_owner from public.maintenance_tasks t
        where t.id = new.task_id and t.asset_id = new.asset_id;
      if parent_owner is distinct from new.user_id then
        raise exception 'task does not belong to user/asset' using errcode = '42501';
      end if;
    end if;
  end if;

  if tg_table_name = 'task_comments' then
    select t.user_id into parent_owner from public.maintenance_tasks t where t.id = new.task_id;
    if parent_owner is distinct from new.user_id then
      raise exception 'task does not belong to user' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_same_owner() from public, anon, authenticated;

create trigger tasks_same_owner before insert or update on public.maintenance_tasks
  for each row execute function public.enforce_same_owner();
create trigger logs_same_owner before insert or update on public.service_logs
  for each row execute function public.enforce_same_owner();
create trigger comments_same_owner before insert or update on public.task_comments
  for each row execute function public.enforce_same_owner();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.assets            enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.service_logs      enable row level security;
alter table public.task_comments     enable row level security;

alter table public.assets            force row level security;
alter table public.maintenance_tasks force row level security;
alter table public.service_logs      force row level security;
alter table public.task_comments     force row level security;

-- Only signed-in users (Clerk JWT with role=authenticated) get table access.
revoke all on public.assets, public.maintenance_tasks, public.service_logs, public.task_comments from anon;
grant select, insert, update, delete
  on public.assets, public.maintenance_tasks, public.service_logs, public.task_comments
  to authenticated;

create policy "assets: owner select" on public.assets for select to authenticated
  using (user_id = (select public.requesting_user_id()));
create policy "assets: owner insert" on public.assets for insert to authenticated
  with check (user_id = (select public.requesting_user_id()));
create policy "assets: owner update" on public.assets for update to authenticated
  using (user_id = (select public.requesting_user_id()))
  with check (user_id = (select public.requesting_user_id()));
create policy "assets: owner delete" on public.assets for delete to authenticated
  using (user_id = (select public.requesting_user_id()));

create policy "tasks: owner select" on public.maintenance_tasks for select to authenticated
  using (user_id = (select public.requesting_user_id()));
create policy "tasks: owner insert" on public.maintenance_tasks for insert to authenticated
  with check (user_id = (select public.requesting_user_id()));
create policy "tasks: owner update" on public.maintenance_tasks for update to authenticated
  using (user_id = (select public.requesting_user_id()))
  with check (user_id = (select public.requesting_user_id()));
create policy "tasks: owner delete" on public.maintenance_tasks for delete to authenticated
  using (user_id = (select public.requesting_user_id()));

create policy "logs: owner select" on public.service_logs for select to authenticated
  using (user_id = (select public.requesting_user_id()));
create policy "logs: owner insert" on public.service_logs for insert to authenticated
  with check (user_id = (select public.requesting_user_id()));
create policy "logs: owner update" on public.service_logs for update to authenticated
  using (user_id = (select public.requesting_user_id()))
  with check (user_id = (select public.requesting_user_id()));
create policy "logs: owner delete" on public.service_logs for delete to authenticated
  using (user_id = (select public.requesting_user_id()));

create policy "comments: owner select" on public.task_comments for select to authenticated
  using (user_id = (select public.requesting_user_id()));
create policy "comments: owner insert" on public.task_comments for insert to authenticated
  with check (user_id = (select public.requesting_user_id()));
create policy "comments: owner delete" on public.task_comments for delete to authenticated
  using (user_id = (select public.requesting_user_id()));

-- ---------------------------------------------------------------------------
-- Atomic "mark done": log the service and roll the schedule forward.
-- Runs as the caller (security invoker) so RLS still applies.
-- ---------------------------------------------------------------------------

create or replace function public.complete_task(
  p_task_id      uuid,
  p_performed_on date,
  p_performed_by text default null,
  p_cost_cents   bigint default null,
  p_currency     text default 'USD',
  p_reading      text default null,
  p_notes        text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  t public.maintenance_tasks%rowtype;
  log_id uuid;
  next_due date;
begin
  select * into t from public.maintenance_tasks where id = p_task_id for update;
  if not found then
    raise exception 'task not found' using errcode = 'P0002';
  end if;

  insert into public.service_logs
    (asset_id, task_id, title, performed_on, performed_by, cost_cents, currency, reading, notes)
  values
    (t.asset_id, t.id, t.title, p_performed_on, p_performed_by, p_cost_cents,
     coalesce(p_currency, 'USD'), p_reading, p_notes)
  returning id into log_id;

  if t.interval_value is not null then
    next_due := (p_performed_on + make_interval(
      days   => case when t.interval_unit = 'day'   then t.interval_value else 0 end,
      weeks  => case when t.interval_unit = 'week'  then t.interval_value else 0 end,
      months => case when t.interval_unit = 'month' then t.interval_value else 0 end,
      years  => case when t.interval_unit = 'year'  then t.interval_value else 0 end
    ))::date;
    update public.maintenance_tasks
      set last_completed_on = greatest(coalesce(last_completed_on, p_performed_on), p_performed_on),
          next_due_on = next_due,
          status = 'pending'
      where id = t.id;
  else
    update public.maintenance_tasks
      set last_completed_on = p_performed_on,
          status = 'done'
      where id = t.id;
  end if;

  return log_id;
end;
$$;

revoke all on function public.complete_task(uuid, date, text, bigint, text, text, text) from public, anon;
grant execute on function public.complete_task(uuid, date, text, bigint, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (RLS-filtered change feed for the live dashboard)
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.assets, public.maintenance_tasks,
      public.service_logs, public.task_comments;
  end if;
end;
$$;

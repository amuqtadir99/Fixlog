-- Email reminder preferences (one row per user).
--
-- Users may edit only their preferences (email, enabled, frequency, lead_days,
-- timezone). Verification state, tokens and send bookkeeping are written by the
-- server with the service role, so nobody can mark an address "verified"
-- through the public Data API and have the cron job email a stranger.

create table public.notification_settings (
  user_id            text primary key default public.requesting_user_id(),
  email              text check (email is null or (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  enabled            boolean not null default false,
  frequency          text not null default 'weekly' check (frequency in ('daily', 'weekly')),
  lead_days          integer not null default 7 check (lead_days between 0 and 60),
  timezone           text check (timezone is null or timezone ~ '^[A-Za-z0-9_+\-/]{1,64}$'),
  email_verified_at  timestamptz,
  verify_token_hash  text,
  verify_sent_at     timestamptz,
  unsubscribe_token  text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  last_sent_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index notification_settings_due_idx on public.notification_settings (enabled, last_sent_at)
  where enabled and email_verified_at is not null;
create unique index notification_settings_unsub_idx on public.notification_settings (unsubscribe_token);
create index notification_settings_verify_idx on public.notification_settings (verify_token_hash)
  where verify_token_hash is not null;

create trigger notification_settings_updated_at before update on public.notification_settings
  for each row execute function public.set_updated_at();
create trigger notification_settings_owner_immutable before update on public.notification_settings
  for each row execute function public.prevent_owner_change();

-- Changing the address always drops verification (for every role).
create or replace function public.reset_email_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    new.email_verified_at := null;
    new.verify_token_hash := null;
    new.verify_sent_at := null;
  end if;
  return new;
end;
$$;

create trigger notification_settings_reset_verification before update on public.notification_settings
  for each row execute function public.reset_email_verification();

alter table public.notification_settings enable row level security;
alter table public.notification_settings force row level security;

revoke all on public.notification_settings from anon, authenticated;
grant select, delete on public.notification_settings to authenticated;
-- Column-level: users can only write their preferences.
grant insert (user_id, email, enabled, frequency, lead_days, timezone) on public.notification_settings to authenticated;
grant update (email, enabled, frequency, lead_days, timezone) on public.notification_settings to authenticated;
grant all on public.notification_settings to service_role;

create policy "notifications: owner select" on public.notification_settings for select to authenticated
  using (user_id = (select public.requesting_user_id()));
create policy "notifications: owner insert" on public.notification_settings for insert to authenticated
  with check (user_id = (select public.requesting_user_id()));
create policy "notifications: owner update" on public.notification_settings for update to authenticated
  using (user_id = (select public.requesting_user_id()))
  with check (user_id = (select public.requesting_user_id()));
create policy "notifications: owner delete" on public.notification_settings for delete to authenticated
  using (user_id = (select public.requesting_user_id()));

-- complete_task: write the service log with the task owner's user_id explicitly
-- (instead of relying on the JWT default), so the function also works for the
-- server-side service role used by demo mode. Callers are still bound by RLS
-- when invoked as `authenticated` (security invoker): the SELECT ... FOR UPDATE
-- only sees the caller's own tasks.

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
    (user_id, asset_id, task_id, title, performed_on, performed_by, cost_cents, currency, reading, notes)
  values
    (t.user_id, t.asset_id, t.id, t.title, p_performed_on, p_performed_by, p_cost_cents,
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
grant execute on function public.complete_task(uuid, date, text, bigint, text, text, text) to authenticated, service_role;

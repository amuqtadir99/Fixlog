-- RLS / integrity tests. Run after supabase_shim.sql and all migrations:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
-- Any failed assertion raises and aborts with a non-zero exit code.
\set ON_ERROR_STOP 1
begin;

-- ---- user A creates data --------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_a","role":"authenticated"}', true);

insert into public.assets (id, name, category, item_type)
  values ('00000000-0000-0000-0000-00000000000a', 'Civic', 'vehicle', 'car');
insert into public.maintenance_tasks (id, asset_id, title, interval_value, interval_unit, next_due_on)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a',
          'Oil change', 6, 'month', '2026-01-01');
insert into public.task_comments (task_id, body)
  values ('00000000-0000-0000-0000-0000000000a1', 'Use 0W-20');

do $$ begin
  assert (select user_id from public.assets) = 'user_a', 'user_id default from JWT';
end $$;

-- complete_task rolls the schedule forward and writes history
select public.complete_task('00000000-0000-0000-0000-0000000000a1', '2026-02-10', 'Jiffy', 4999, 'USD', '52000 km', null);
do $$ begin
  assert (select next_due_on from public.maintenance_tasks) = '2026-08-10', 'next due rolled by 6 months';
  assert (select last_completed_on from public.maintenance_tasks) = '2026-02-10', 'last completed set';
  assert (select count(*) from public.service_logs) = 1, 'service log written';
end $$;

-- ---- user B cannot see or touch A's data -----------------------------------
select set_config('request.jwt.claims', '{"sub":"user_b","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.assets) = 0, 'B cannot read A assets';
  assert (select count(*) from public.maintenance_tasks) = 0, 'B cannot read A tasks';
  assert (select count(*) from public.service_logs) = 0, 'B cannot read A logs';
  assert (select count(*) from public.task_comments) = 0, 'B cannot read A comments';
end $$;

update public.assets set name = 'pwned';
delete from public.assets;

-- B cannot attach a task/log/comment to A's rows (FK bypasses RLS; trigger blocks it)
do $$ begin
  begin
    insert into public.maintenance_tasks (asset_id, title) values ('00000000-0000-0000-0000-00000000000a', 'x');
    raise exception 'B attached task to A asset';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.task_comments (task_id, body) values ('00000000-0000-0000-0000-0000000000a1', 'x');
    raise exception 'B commented on A task';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.assets (name, category, item_type, user_id) values ('x', 'vehicle', 'car', 'user_a');
    raise exception 'B inserted row as A';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.complete_task('00000000-0000-0000-0000-0000000000a1', '2026-03-01');
    raise exception 'B completed A task';
  exception when no_data_found then null;
  end;
end $$;

-- ---- anon has no access -----------------------------------------------------
select set_config('request.jwt.claims', '', true);
set local role anon;
do $$ begin
  begin
    perform count(*) from public.assets;
    raise exception 'anon could read assets';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---- A's data is intact; ownership immutable; cascades work -----------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_a","role":"authenticated"}', true);
do $$ begin
  assert (select name from public.assets) = 'Civic', 'A asset untouched by B';
  begin
    update public.assets set user_id = 'user_b';
    raise exception 'owner change allowed';
  exception when others then
    if sqlerrm = 'owner change allowed' then raise; end if;
  end;
end $$;

delete from public.maintenance_tasks;
do $$ begin
  assert (select task_id from public.service_logs) is null, 'log survives task delete';
end $$;
delete from public.assets;
do $$ begin
  assert (select count(*) from public.service_logs) = 0, 'cascade delete';
end $$;

-- ---- service role (demo mode) ----------------------------------------------
reset role;
select set_config('request.jwt.claims', '', true);
set local role service_role;
insert into public.assets (id, user_id, name, category, item_type)
  values ('00000000-0000-0000-0000-00000000000d', 'demo_user', 'Demo car', 'vehicle', 'car');
insert into public.maintenance_tasks (id, user_id, asset_id, title, interval_value, interval_unit, next_due_on)
  values ('00000000-0000-0000-0000-0000000000d1', 'demo_user', '00000000-0000-0000-0000-00000000000d',
          'Oil', 1, 'year', '2026-01-01');
select public.complete_task('00000000-0000-0000-0000-0000000000d1', '2026-03-01');
do $$ begin
  assert (select user_id from public.service_logs where task_id = '00000000-0000-0000-0000-0000000000d1') = 'demo_user',
    'service-role completion logs under the task owner';
  assert (select next_due_on from public.maintenance_tasks where id = '00000000-0000-0000-0000-0000000000d1') = '2027-03-01',
    'service-role completion reschedules';
  begin
    insert into public.maintenance_tasks (user_id, asset_id, title)
      values ('someone_else', '00000000-0000-0000-0000-00000000000d', 'x');
    raise exception 'cross-owner task allowed for service role';
  exception when insufficient_privilege then null;
  end;
end $$;

rollback;
\echo 'RLS tests passed'

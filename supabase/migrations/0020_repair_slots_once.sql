-- Supersedes 0018, which was correct but 99 lines long — too much to paste by
-- hand, which is its own kind of unsafe.
--
-- The real lesson from 0017 being applied twice is that nothing recorded that
-- it had been applied at all. So this keeps a ledger, and guards the fix with
-- it: running this a second time does nothing.
--
-- The shift is +3:30, undoing one of the two applications of 0017. After it,
-- slots read the times the specialist actually picked: 12:00, 13:30, 14:40,
-- 19:00, 22:55 Tehran.

create table if not exists applied_fixes (
  name text primary key,
  applied_at timestamptz not null default now()
);

-- No policies, so PostgREST exposes nothing. Direct SQL still works, which is
-- the only thing that should touch this table.
alter table applied_fixes enable row level security;

do $$
begin
  if not exists (select 1 from applied_fixes where name = 'slots_tehran_repair') then
    update availability_slots
    set start_time = start_time + interval '3 hours 30 minutes',
        end_time   = end_time   + interval '3 hours 30 minutes';

    insert into applied_fixes (name) values ('slots_tehran_repair');
    raise notice 'Slot times repaired.';
  else
    raise notice 'Already repaired — nothing to do.';
  end if;
end $$;

-- Who is allowed to do what, checked against the real database.
--
-- Every check impersonates a real person the way PostgREST does — the role
-- plus a JWT claim — because scripts/db.js connects as superuser and bypasses
-- RLS, so anything tested without switching role proves nothing.
--
-- Everything runs inside transactions that roll back. It is safe against the
-- live database and leaves nothing behind.
--
--   node scripts/db.js supabase/tests/access_rules.sql
--
-- Every row of every table it prints should say pass = true.

-- ============================================================
-- Booking a session
-- ============================================================
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.seed() returns void language plpgsql as $$
begin
  perform pg_temp.act_as_nobody();

  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
    ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}'),
    ('dddddddd-0000-4000-8000-000000000004','u@example.invalid','{"role":"mentor","full_name":"Mentor U"}');

  insert into mentor_profiles (id, bio, status) values
    ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved'),
    ('dddddddd-0000-4000-8000-000000000004','not yet approved','pending');

  insert into mentor_meeting_links (id, meeting_link)
    values ('cccccccc-0000-4000-8000-000000000003','https://meet.example.invalid/m');

  insert into availability_slots (id, mentor_id, start_time, end_time) values
    ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003', now()+interval '2 day', now()+interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003', now()+interval '3 day', now()+interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003', now()+interval '4 day', now()+interval '4 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000005','cccccccc-0000-4000-8000-000000000003', now()+interval '5 day', now()+interval '5 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003', now()-interval '2 day', now()-interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003', now()-interval '3 day', now()-interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000011','cccccccc-0000-4000-8000-000000000003', now()-interval '4 day', now()-interval '4 day' + interval '22 min'),
    ('22222222-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004', now()+interval '1 day', now()+interval '1 day' + interval '22 min');
end $$;
-- Attempt a booking as a given person, and write down what happened.
create or replace function pg_temp.try_book(
  actor uuid, slot uuid, mentor uuid, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  perform pg_temp.act_as(actor);
  begin
    execute 'set local role authenticated';
    insert into bookings (slot_id, mentor_id, seeker_id, message)
    values (slot, mentor, actor, 'test message');
    outcome := 'ok';
  exception when others then
    outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;

select pg_temp.seed();

-- A seeker takes an open slot from an approved specialist.
select pg_temp.try_book(
  'aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001',
  'cccccccc-0000-4000-8000-000000000003','booking','seeker books an open slot','ok');

select pg_temp.act_as_nobody();
select pg_temp.record('booking','the slot is marked taken','true',
  (select is_booked::text from availability_slots where id='11111111-0000-4000-8000-000000000001'));

-- Somebody else wants the same slot.
select pg_temp.try_book(
  'bbbbbbbb-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000001',
  'cccccccc-0000-4000-8000-000000000003','booking','a taken slot cannot be taken twice','refused');

-- A specialist nobody has approved yet.
select pg_temp.try_book(
  'aaaaaaaa-0000-4000-8000-000000000001','22222222-0000-4000-8000-000000000001',
  'dddddddd-0000-4000-8000-000000000004','booking','an unapproved specialist cannot be booked','refused');

-- The slot belongs to M, but the booking claims U.
select pg_temp.try_book(
  'aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000002',
  'dddddddd-0000-4000-8000-000000000004','booking','the booking must name the slot''s own specialist','refused');

-- Filling up to the cap, then one past it.
select pg_temp.try_book(
  'aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000002',
  'cccccccc-0000-4000-8000-000000000003','cap','second live request','ok');
select pg_temp.try_book(
  'aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000003',
  'cccccccc-0000-4000-8000-000000000003','cap','third live request','ok');
select pg_temp.try_book(
  'aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000004',
  'cccccccc-0000-4000-8000-000000000003','cap','fourth is refused','refused: pending_request_cap');

-- Requests whose time has passed are dead and must not hold a place.
select pg_temp.try_book(
  'bbbbbbbb-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000009',
  'cccccccc-0000-4000-8000-000000000003','booking','a slot whose time has passed cannot be booked','refused');
select pg_temp.try_book(
  'bbbbbbbb-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000010',
  'cccccccc-0000-4000-8000-000000000003','booking','nor a second one','refused');
select pg_temp.try_book(
  'bbbbbbbb-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000011',
  'cccccccc-0000-4000-8000-000000000003','booking','nor a third','refused');

select 'Booking a session' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ============================================================
-- The cap on live requests
-- ============================================================
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.seed() returns void language plpgsql as $$
begin
  perform pg_temp.act_as_nobody();

  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
    ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}'),
    ('dddddddd-0000-4000-8000-000000000004','u@example.invalid','{"role":"mentor","full_name":"Mentor U"}');

  insert into mentor_profiles (id, bio, status) values
    ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved'),
    ('dddddddd-0000-4000-8000-000000000004','not yet approved','pending');

  insert into mentor_meeting_links (id, meeting_link)
    values ('cccccccc-0000-4000-8000-000000000003','https://meet.example.invalid/m');

  insert into availability_slots (id, mentor_id, start_time, end_time) values
    ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003', now()+interval '2 day', now()+interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003', now()+interval '3 day', now()+interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003', now()+interval '4 day', now()+interval '4 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000005','cccccccc-0000-4000-8000-000000000003', now()+interval '5 day', now()+interval '5 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003', now()-interval '2 day', now()-interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003', now()-interval '3 day', now()-interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000011','cccccccc-0000-4000-8000-000000000003', now()-interval '4 day', now()-interval '4 day' + interval '22 min'),
    ('22222222-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004', now()+interval '1 day', now()+interval '1 day' + interval '22 min');
end $$;
create or replace function pg_temp.try_book(
  actor uuid, slot uuid, mentor uuid, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  perform pg_temp.act_as(actor);
  begin
    execute 'set local role authenticated';
    insert into bookings (slot_id, mentor_id, seeker_id, message)
    values (slot, mentor, actor, 'test message');
    outcome := 'ok';
  exception when others then
    outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;

select pg_temp.seed();

-- Three live requests, then the fourth.
select pg_temp.try_book('aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003','cap','first','ok');
select pg_temp.try_book('aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003','cap','second','ok');
select pg_temp.try_book('aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003','cap','third','ok');
select pg_temp.try_book('aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003','cap','fourth is refused at the cap','refused: pending_request_cap');

-- Time passes: those three slots are now in the past, and the specialist
-- never answered any of them. Nobody should be held hostage by that.
select pg_temp.act_as_nobody();
update availability_slots
   set start_time = now() - interval '2 day', end_time = now() - interval '2 day' + interval '22 min'
 where id in ('11111111-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000003');

select pg_temp.try_book('aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003','cap','unanswered requests that went stale free the place up','ok');

select pg_temp.record('cap','the stale ones are still pending, not deleted','3',
  (select count(*)::text from bookings where seeker_id='aaaaaaaa-0000-4000-8000-000000000001' and status='pending' and slot_id in ('11111111-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000003')));

select 'The cap on live requests' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ============================================================
-- Answering and cancelling
-- ============================================================
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.seed() returns void language plpgsql as $$
begin
  perform pg_temp.act_as_nobody();

  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
    ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}'),
    ('dddddddd-0000-4000-8000-000000000004','u@example.invalid','{"role":"mentor","full_name":"Mentor U"}');

  insert into mentor_profiles (id, bio, status) values
    ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved'),
    ('dddddddd-0000-4000-8000-000000000004','not yet approved','pending');

  insert into mentor_meeting_links (id, meeting_link)
    values ('cccccccc-0000-4000-8000-000000000003','https://meet.example.invalid/m');

  insert into availability_slots (id, mentor_id, start_time, end_time) values
    ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003', now()+interval '2 day', now()+interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003', now()+interval '3 day', now()+interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003', now()+interval '4 day', now()+interval '4 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000005','cccccccc-0000-4000-8000-000000000003', now()+interval '5 day', now()+interval '5 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003', now()-interval '2 day', now()-interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003', now()-interval '3 day', now()-interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000011','cccccccc-0000-4000-8000-000000000003', now()-interval '4 day', now()-interval '4 day' + interval '22 min'),
    ('22222222-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004', now()+interval '1 day', now()+interval '1 day' + interval '22 min');
end $$;
create or replace function pg_temp.try_as(
  actor uuid, stmt text, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role authenticated';
    execute stmt;
    outcome := 'ok';
  exception when others then
    outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;

create or replace function pg_temp.state(bk uuid) returns text
language sql as $$
  select b.status || ' / slot ' || case when s.is_booked then 'held' else 'free' end
  from bookings b join availability_slots s on s.id = b.slot_id where b.id = bk;
$$;

select pg_temp.seed();
select pg_temp.act_as_nobody();

insert into bookings (id, slot_id, mentor_id, seeker_id, status, message) values
 ('0b000001-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003','aaaaaaaa-0000-4000-8000-000000000001','pending','x'),
 ('0b000002-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003','aaaaaaaa-0000-4000-8000-000000000001','pending','x'),
 ('0b000003-0000-4000-8000-000000000003','11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003','bbbbbbbb-0000-4000-8000-000000000002','pending','x'),
 ('0b000004-0000-4000-8000-000000000004','11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003','bbbbbbbb-0000-4000-8000-000000000002','pending','x'),
 ('0b000005-0000-4000-8000-000000000005','11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003','aaaaaaaa-0000-4000-8000-000000000001','confirmed','x'),
 ('0b000006-0000-4000-8000-000000000006','11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003','bbbbbbbb-0000-4000-8000-000000000002','confirmed','x');

-- Who may answer a request
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001','select respond_to_booking(''0b000001-0000-4000-8000-000000000001'',true)','answering','the seeker cannot accept their own request','refused');
select pg_temp.try_as('bbbbbbbb-0000-4000-8000-000000000002','select respond_to_booking(''0b000001-0000-4000-8000-000000000001'',true)','answering','a stranger cannot answer it','refused');
select pg_temp.try_as(null,'select respond_to_booking(''0b000001-0000-4000-8000-000000000001'',true)','answering','a signed-out visitor cannot answer it','refused');

-- Declining frees the slot again
select pg_temp.try_as('cccccccc-0000-4000-8000-000000000003','select respond_to_booking(''0b000001-0000-4000-8000-000000000001'',false)','answering','the specialist declines','ok');
select pg_temp.act_as_nobody();
select pg_temp.record('answering','declining hands the slot back','declined / slot free',pg_temp.state('0b000001-0000-4000-8000-000000000001'));

-- Accepting holds it
select pg_temp.try_as('cccccccc-0000-4000-8000-000000000003','select respond_to_booking(''0b000002-0000-4000-8000-000000000002'',true)','answering','the specialist accepts','ok');
select pg_temp.act_as_nobody();
select pg_temp.record('answering','accepting keeps the slot held','confirmed / slot held',pg_temp.state('0b000002-0000-4000-8000-000000000002'));

-- The clock
select pg_temp.try_as('cccccccc-0000-4000-8000-000000000003','select respond_to_booking(''0b000004-0000-4000-8000-000000000004'',true)','answering','a session whose time has gone cannot be accepted','refused: That session time has already passed');
select pg_temp.try_as('cccccccc-0000-4000-8000-000000000003','select respond_to_booking(''0b000004-0000-4000-8000-000000000004'',false)','answering','but it can still be declined','ok');

-- Cancelling
select pg_temp.try_as('bbbbbbbb-0000-4000-8000-000000000002','select cancel_booking(''0b000005-0000-4000-8000-000000000005'',null)','cancelling','a stranger cannot cancel','refused');
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001','select cancel_booking(''0b000005-0000-4000-8000-000000000005'',''changed my mind'')','cancelling','the seeker cancels a confirmed session','ok');
select pg_temp.act_as_nobody();
select pg_temp.record('cancelling','cancelling hands the slot back','cancelled / slot free',pg_temp.state('0b000005-0000-4000-8000-000000000005'));
select pg_temp.record('cancelling','the reason is kept','changed my mind',(select cancel_reason from bookings where id='0b000005-0000-4000-8000-000000000005'));

select pg_temp.try_as('bbbbbbbb-0000-4000-8000-000000000002','select cancel_booking(''0b000006-0000-4000-8000-000000000006'',null)','cancelling','a session that already happened cannot be undone','refused: That session has already finished');
select pg_temp.try_as('bbbbbbbb-0000-4000-8000-000000000002','select cancel_booking(''0b000003-0000-4000-8000-000000000003'',null)','cancelling','an unanswered request can be withdrawn','ok');
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001','select cancel_booking(''0b000005-0000-4000-8000-000000000005'',null)','cancelling','cancelling twice does nothing','refused');

select 'Answering and cancelling' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ============================================================
-- Nobody can appoint themselves
-- ============================================================
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.seed() returns void language plpgsql as $$
begin
  perform pg_temp.act_as_nobody();

  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
    ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}'),
    ('dddddddd-0000-4000-8000-000000000004','u@example.invalid','{"role":"mentor","full_name":"Mentor U"}');

  insert into mentor_profiles (id, bio, status) values
    ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved'),
    ('dddddddd-0000-4000-8000-000000000004','not yet approved','pending');

  insert into mentor_meeting_links (id, meeting_link)
    values ('cccccccc-0000-4000-8000-000000000003','https://meet.example.invalid/m');

  insert into availability_slots (id, mentor_id, start_time, end_time) values
    ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003', now()+interval '2 day', now()+interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003', now()+interval '3 day', now()+interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003', now()+interval '4 day', now()+interval '4 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000005','cccccccc-0000-4000-8000-000000000003', now()+interval '5 day', now()+interval '5 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003', now()-interval '2 day', now()-interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003', now()-interval '3 day', now()-interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000011','cccccccc-0000-4000-8000-000000000003', now()-interval '4 day', now()-interval '4 day' + interval '22 min'),
    ('22222222-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004', now()+interval '1 day', now()+interval '1 day' + interval '22 min');
end $$;
create or replace function pg_temp.try_as(
  actor uuid, stmt text, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role authenticated';
    execute stmt;
    outcome := 'ok';
  exception when others then
    outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;

select pg_temp.seed();
select pg_temp.act_as_nobody();

-- Door 1
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'update profiles set role = ''admin'' where id = ''aaaaaaaa-0000-4000-8000-000000000001''',
  'shut','a seeker cannot promote themselves','refused: Only an admin can grant the admin role');
select pg_temp.act_as_nobody();
select pg_temp.record('shut','their role is untouched','seeker',
  (select role from profiles where id='aaaaaaaa-0000-4000-8000-000000000001'));
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'select count(*) from admin_list_members()','shut','so the member list stays shut',
  'refused: Only an admin can list members');

-- Nor by inventing a role name
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'update profiles set role = ''superadmin'' where id = ''aaaaaaaa-0000-4000-8000-000000000001''',
  'shut','nor by inventing a role','refused');

-- Door 2
select pg_temp.act_as_nobody();
insert into auth.users (id, email, raw_user_meta_data) values
  ('eeeeeeee-0000-4000-8000-000000000005','evil@example.invalid','{"role":"admin","full_name":"Evil"}'),
  ('ffffffff-0000-4000-8000-000000000006','honest@example.invalid','{"role":"mentor","full_name":"Honest"}'),
  ('ffffffff-0000-4000-8000-000000000007','plain@example.invalid','{"full_name":"Plain"}');
select pg_temp.record('shut','signing up as admin lands as seeker','seeker',
  (select role from profiles where id='eeeeeeee-0000-4000-8000-000000000005'));

-- The paths that must keep working
select pg_temp.record('still works','signing up as a specialist','mentor',
  (select role from profiles where id='ffffffff-0000-4000-8000-000000000006'));
select pg_temp.record('still works','signing up with no role at all','seeker',
  (select role from profiles where id='ffffffff-0000-4000-8000-000000000007'));

-- The OAuth callback aligning a first sign-in with the button they pressed
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'update profiles set role = ''mentor'' where id = ''aaaaaaaa-0000-4000-8000-000000000001''',
  'still works','switching yourself between seeker and specialist','ok');

-- And an admin can still hand out a role
select pg_temp.try_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4',
  'update profiles set role = ''admin'' where id = ''bbbbbbbb-0000-4000-8000-000000000002''',
  'still works','an admin can appoint another admin','ok');

-- A specialist still cannot rewrite a booking around the clock guard
select pg_temp.act_as_nobody();
insert into bookings (id, slot_id, mentor_id, seeker_id, status, message) values
 ('0b000009-0000-4000-8000-000000000009','11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003','aaaaaaaa-0000-4000-8000-000000000001','pending','x');
select pg_temp.try_as('cccccccc-0000-4000-8000-000000000003',
  'update bookings set status = ''confirmed'' where id = ''0b000009-0000-4000-8000-000000000009''',
  'shut','a specialist cannot confirm a passed session by hand','refused');

select 'Nobody can appoint themselves' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ============================================================
-- What each person can see
-- ============================================================
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.seed() returns void language plpgsql as $$
begin
  perform pg_temp.act_as_nobody();

  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
    ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}'),
    ('dddddddd-0000-4000-8000-000000000004','u@example.invalid','{"role":"mentor","full_name":"Mentor U"}');

  insert into mentor_profiles (id, bio, status) values
    ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved'),
    ('dddddddd-0000-4000-8000-000000000004','not yet approved','pending');

  insert into mentor_meeting_links (id, meeting_link)
    values ('cccccccc-0000-4000-8000-000000000003','https://meet.example.invalid/m');

  insert into availability_slots (id, mentor_id, start_time, end_time) values
    ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003', now()+interval '2 day', now()+interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003', now()+interval '3 day', now()+interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003', now()+interval '4 day', now()+interval '4 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000005','cccccccc-0000-4000-8000-000000000003', now()+interval '5 day', now()+interval '5 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003', now()-interval '2 day', now()-interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003', now()-interval '3 day', now()-interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000011','cccccccc-0000-4000-8000-000000000003', now()-interval '4 day', now()-interval '4 day' + interval '22 min'),
    ('22222222-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004', now()+interval '1 day', now()+interval '1 day' + interval '22 min');
end $$;
create or replace function pg_temp.read_as(
  actor uuid, dbrole text, q text, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role ' || quote_ident(dbrole);
    execute q into outcome;
    outcome := coalesce(outcome, 'null');
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;

create or replace function pg_temp.write_as(
  actor uuid, stmt text, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  perform pg_temp.act_as(actor);
  begin
    execute 'set local role authenticated';
    execute stmt;
    outcome := 'ok';
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;

select pg_temp.seed();
select pg_temp.act_as_nobody();

insert into mentor_contacts (id, phone) values ('cccccccc-0000-4000-8000-000000000003','09120000000');
insert into mentor_services (mentor_id, kind, title, is_active)
  values ('cccccccc-0000-4000-8000-000000000003','hourly_project','Project work',true);
insert into bookings (id, slot_id, mentor_id, seeker_id, status, message) values
 ('0b000001-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003','aaaaaaaa-0000-4000-8000-000000000001','confirmed','private note');

-- Bookings are between the two people in them
select pg_temp.read_as(null,'anon','select count(*)::text from bookings','privacy','a signed-out visitor sees no bookings','0');
select pg_temp.read_as('bbbbbbbb-0000-4000-8000-000000000002','authenticated','select count(*)::text from bookings','privacy','another seeker sees none of them','0');
select pg_temp.read_as('aaaaaaaa-0000-4000-8000-000000000001','authenticated','select count(*)::text from bookings','privacy','the seeker sees their own','1');
select pg_temp.read_as('cccccccc-0000-4000-8000-000000000003','authenticated','select count(*)::text from bookings','privacy','the specialist sees it too','1');

-- The phone number
select pg_temp.read_as('bbbbbbbb-0000-4000-8000-000000000002','authenticated','select count(*)::text from mentor_contacts','privacy','a stranger cannot read the phone','0');
select pg_temp.read_as('aaaaaaaa-0000-4000-8000-000000000001','authenticated','select count(*)::text from mentor_contacts','privacy','nor can someone who booked them','0');
select pg_temp.read_as('cccccccc-0000-4000-8000-000000000003','authenticated','select count(*)::text from mentor_contacts','privacy','the specialist reads their own','1');
select pg_temp.read_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4','authenticated','select count(*)::text from mentor_contacts','privacy','the admin can read it','2');

-- Who is publicly visible
select pg_temp.read_as(null,'anon','select count(*)::text from mentor_profiles where id=''cccccccc-0000-4000-8000-000000000003''','privacy','an approved specialist is public','1');
select pg_temp.read_as(null,'anon','select count(*)::text from mentor_profiles where id=''dddddddd-0000-4000-8000-000000000004''','privacy','one still waiting for approval is not','0');

-- The meeting link
select pg_temp.read_as('aaaaaaaa-0000-4000-8000-000000000001','authenticated','select count(*)::text from mentor_meeting_links','privacy','the seeker who booked gets the link','1');
select pg_temp.read_as('bbbbbbbb-0000-4000-8000-000000000002','authenticated','select count(*)::text from mentor_meeting_links','privacy','a seeker who did not, does not','0');

-- Addressing an email about a booking
select pg_temp.read_as('bbbbbbbb-0000-4000-8000-000000000002','authenticated','select count(*)::text from booking_parties(''0b000001-0000-4000-8000-000000000001'')','privacy','a stranger cannot look up the parties','refused: Not your booking');
select pg_temp.read_as('aaaaaaaa-0000-4000-8000-000000000001','authenticated','select count(*)::text from booking_parties(''0b000001-0000-4000-8000-000000000001'')','privacy','either party can','1');

-- The public count on a profile
select pg_temp.read_as(null,'anon','select held_session_count(''cccccccc-0000-4000-8000-000000000003'')::text','privacy','anyone may count held sessions','0');

-- Project briefs
select pg_temp.write_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into project_briefs (id, mentor_id, seeker_id, brief) values (''0c000001-0000-4000-8000-000000000001'',''cccccccc-0000-4000-8000-000000000003'',''aaaaaaaa-0000-4000-8000-000000000001'',''I need help building a small internal reporting tool'')',
  'briefs','a seeker sends a brief to an approved specialist','ok');
select pg_temp.write_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into project_briefs (mentor_id, seeker_id, brief) values (''dddddddd-0000-4000-8000-000000000004'',''aaaaaaaa-0000-4000-8000-000000000001'',''I need help building a small internal reporting tool'')',
  'briefs','but not to an unapproved one','refused');
select pg_temp.read_as('bbbbbbbb-0000-4000-8000-000000000002','authenticated','select count(*)::text from project_briefs','briefs','a stranger cannot read it','0');
select pg_temp.write_as('bbbbbbbb-0000-4000-8000-000000000002',
  'select respond_to_brief(''0c000001-0000-4000-8000-000000000001'',true,1000000,5,null)',
  'briefs','a stranger cannot answer it','refused: No open brief of yours with that id');
select pg_temp.write_as('cccccccc-0000-4000-8000-000000000003',
  'select respond_to_brief(''0c000001-0000-4000-8000-000000000001'',true,null,null,null)',
  'briefs','accepting without a price is refused','refused: Accepting needs a rate and an estimate');
select pg_temp.write_as('cccccccc-0000-4000-8000-000000000003',
  'select respond_to_brief(''0c000001-0000-4000-8000-000000000001'',true,1000000,5,''happy to help'')',
  'briefs','the specialist quotes for it','ok');
select pg_temp.write_as('aaaaaaaa-0000-4000-8000-000000000001',
  'select withdraw_brief(''0c000001-0000-4000-8000-000000000001'')',
  'briefs','an answered brief can no longer be withdrawn','refused: No open brief of yours with that id');

select 'What each person can see' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ============================================================
-- A seeker is someone too
-- ============================================================
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.seed() returns void language plpgsql as $$
begin
  perform pg_temp.act_as_nobody();

  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
    ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}'),
    ('dddddddd-0000-4000-8000-000000000004','u@example.invalid','{"role":"mentor","full_name":"Mentor U"}');

  insert into mentor_profiles (id, bio, status) values
    ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved'),
    ('dddddddd-0000-4000-8000-000000000004','not yet approved','pending');

  insert into mentor_meeting_links (id, meeting_link)
    values ('cccccccc-0000-4000-8000-000000000003','https://meet.example.invalid/m');

  insert into availability_slots (id, mentor_id, start_time, end_time) values
    ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003', now()+interval '2 day', now()+interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003', now()+interval '3 day', now()+interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003', now()+interval '4 day', now()+interval '4 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000005','cccccccc-0000-4000-8000-000000000003', now()+interval '5 day', now()+interval '5 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003', now()-interval '2 day', now()-interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003', now()-interval '3 day', now()-interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000011','cccccccc-0000-4000-8000-000000000003', now()-interval '4 day', now()-interval '4 day' + interval '22 min'),
    ('22222222-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004', now()+interval '1 day', now()+interval '1 day' + interval '22 min');
end $$;
create or replace function pg_temp.try_as(
  actor uuid, stmt text, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role authenticated';
    execute stmt;
    outcome := 'ok';
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;

create or replace function pg_temp.read_as(
  actor uuid, dbrole text, q text, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role ' || quote_ident(dbrole);
    execute q into outcome;
    outcome := coalesce(outcome, 'null');
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;

select pg_temp.seed();
select pg_temp.act_as_nobody();

-- A seeker stores their own number
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into seeker_contacts (id, phone) values (''aaaaaaaa-0000-4000-8000-000000000001'',''09120000001'')',
  'seeker contacts','a seeker stores their own number','ok');

-- and nobody else''s
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into seeker_contacts (id, phone) values (''bbbbbbbb-0000-4000-8000-000000000002'',''09120000002'')',
  'seeker contacts','but not somebody else''''s','refused');

select pg_temp.read_as('bbbbbbbb-0000-4000-8000-000000000002','authenticated','select count(*)::text from seeker_contacts','seeker contacts','another seeker cannot read it','0');
select pg_temp.read_as('cccccccc-0000-4000-8000-000000000003','authenticated','select count(*)::text from seeker_contacts','seeker contacts','nor can a specialist','0');
select pg_temp.read_as(null,'anon','select count(*)::text from seeker_contacts','seeker contacts','nor a signed-out visitor','0');
select pg_temp.read_as('aaaaaaaa-0000-4000-8000-000000000001','authenticated','select count(*)::text from seeker_contacts','seeker contacts','the seeker reads their own','1');
select pg_temp.read_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4','authenticated','select count(*)::text from seeker_contacts','seeker contacts','the admin can read it','1');

-- The admin list carries the number, and still refuses everyone else
select pg_temp.read_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4','authenticated',
  'select phone from admin_list_members() where id=''aaaaaaaa-0000-4000-8000-000000000001''',
  'seeker contacts','the admin list shows the seeker number','09120000001');
select pg_temp.read_as('aaaaaaaa-0000-4000-8000-000000000001','authenticated',
  'select count(*)::text from admin_list_members()',
  'seeker contacts','and still refuses a seeker','refused: Only an admin can list members');

select 'A seeker is someone too' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ============================================================
-- Who may ask about a Google connection
-- ============================================================
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.seed() returns void language plpgsql as $$
begin
  perform pg_temp.act_as_nobody();

  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
    ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}'),
    ('dddddddd-0000-4000-8000-000000000004','u@example.invalid','{"role":"mentor","full_name":"Mentor U"}');

  insert into mentor_profiles (id, bio, status) values
    ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved'),
    ('dddddddd-0000-4000-8000-000000000004','not yet approved','pending');

  insert into mentor_meeting_links (id, meeting_link)
    values ('cccccccc-0000-4000-8000-000000000003','https://meet.example.invalid/m');

  insert into availability_slots (id, mentor_id, start_time, end_time) values
    ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003', now()+interval '2 day', now()+interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003', now()+interval '3 day', now()+interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003', now()+interval '4 day', now()+interval '4 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000005','cccccccc-0000-4000-8000-000000000003', now()+interval '5 day', now()+interval '5 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003', now()-interval '2 day', now()-interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003', now()-interval '3 day', now()-interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000011','cccccccc-0000-4000-8000-000000000003', now()-interval '4 day', now()-interval '4 day' + interval '22 min'),
    ('22222222-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004', now()+interval '1 day', now()+interval '1 day' + interval '22 min');
end $$;
create or replace function pg_temp.read_as(
  actor uuid, dbrole text, q text, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role ' || quote_ident(dbrole);
    execute q into outcome;
    outcome := coalesce(outcome, 'null');
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;

select pg_temp.seed();
select pg_temp.act_as_nobody();

insert into mentor_google_accounts (id, google_email, refresh_token)
  values ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','secret-token');

-- The question the approve button asks
select pg_temp.read_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4','authenticated',
  'select mentor_has_google(''cccccccc-0000-4000-8000-000000000003'')::text',
  'google','the admin can see a connection exists','true');
select pg_temp.read_as('cccccccc-0000-4000-8000-000000000003','authenticated',
  'select mentor_has_google(''cccccccc-0000-4000-8000-000000000003'')::text',
  'google','and so can the specialist about themselves','true');
select pg_temp.read_as('aaaaaaaa-0000-4000-8000-000000000001','authenticated',
  'select mentor_has_google(''cccccccc-0000-4000-8000-000000000003'')::text',
  'google','a stranger cannot ask','refused: Not yours to ask');
select pg_temp.read_as(null,'anon',
  'select mentor_has_google(''cccccccc-0000-4000-8000-000000000003'')::text',
  'google','nor a signed-out visitor','refused');

-- The token stays out of reach whatever happens
select pg_temp.read_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4','authenticated',
  'select count(*)::text from mentor_google_accounts',
  'google','the admin still cannot read the tokens','0');

-- And the members list carries the flag
select pg_temp.read_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4','authenticated',
  'select has_google::text from admin_list_members() where id=''cccccccc-0000-4000-8000-000000000003''',
  'google','the members list shows it','true');

select 'Who may ask about a Google connection' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ============================================================
-- An edited profile goes back in the queue
-- ============================================================
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.seed() returns void language plpgsql as $$
begin
  perform pg_temp.act_as_nobody();

  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
    ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}'),
    ('dddddddd-0000-4000-8000-000000000004','u@example.invalid','{"role":"mentor","full_name":"Mentor U"}');

  insert into mentor_profiles (id, bio, status) values
    ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved'),
    ('dddddddd-0000-4000-8000-000000000004','not yet approved','pending');

  insert into mentor_meeting_links (id, meeting_link)
    values ('cccccccc-0000-4000-8000-000000000003','https://meet.example.invalid/m');

  insert into availability_slots (id, mentor_id, start_time, end_time) values
    ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003', now()+interval '2 day', now()+interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003', now()+interval '3 day', now()+interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003', now()+interval '4 day', now()+interval '4 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000005','cccccccc-0000-4000-8000-000000000003', now()+interval '5 day', now()+interval '5 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003', now()-interval '2 day', now()-interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003', now()-interval '3 day', now()-interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000011','cccccccc-0000-4000-8000-000000000003', now()-interval '4 day', now()-interval '4 day' + interval '22 min'),
    ('22222222-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004', now()+interval '1 day', now()+interval '1 day' + interval '22 min');
end $$;
create or replace function pg_temp.edit_as(
  actor uuid, stmt text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  perform pg_temp.act_as_nobody();
  update mentor_profiles set status='approved', review_note=null
   where id='cccccccc-0000-4000-8000-000000000003';

  perform pg_temp.act_as(actor);
  begin
    execute 'set local role authenticated';
    execute stmt;
  exception when others then
    execute 'reset role';
    perform pg_temp.act_as_nobody();
    perform pg_temp.record('re-review', chk, expected, 'refused: ' || sqlerrm);
    return;
  end;
  execute 'reset role';

  perform pg_temp.act_as_nobody();
  perform pg_temp.record('re-review', chk, expected,
    (select status from mentor_profiles where id='cccccccc-0000-4000-8000-000000000003'));
end $$;

select pg_temp.seed();
select pg_temp.act_as_nobody();
insert into mentor_contacts (id, phone) values ('cccccccc-0000-4000-8000-000000000003','09120000000');

-- Public edits put them back in the queue
select pg_temp.edit_as('cccccccc-0000-4000-8000-000000000003',
  'update mentor_profiles set bio=''a new and different bio entirely'' where id=''cccccccc-0000-4000-8000-000000000003''',
  'editing the bio returns them to review','pending');
select pg_temp.edit_as('cccccccc-0000-4000-8000-000000000003',
  'update mentor_profiles set headline=''مدیر پروژه'' where id=''cccccccc-0000-4000-8000-000000000003''',
  'so does the job title','pending');
select pg_temp.edit_as('cccccccc-0000-4000-8000-000000000003',
  'update mentor_profiles set linkedin_url=''https://linkedin.com/in/someone-else'' where id=''cccccccc-0000-4000-8000-000000000003''',
  'and the linkedin address above all','pending');
select pg_temp.edit_as('cccccccc-0000-4000-8000-000000000003',
  'update mentor_profiles set seniority=''principal'' where id=''cccccccc-0000-4000-8000-000000000003''',
  'and the years claimed','pending');
select pg_temp.edit_as('cccccccc-0000-4000-8000-000000000003',
  'update mentor_profiles set expertise_tags=array[''نفت و گاز'',''هوش مصنوعی''] where id=''cccccccc-0000-4000-8000-000000000003''',
  'and the fields','pending');

-- Private ones do not
select pg_temp.edit_as('cccccccc-0000-4000-8000-000000000003',
  'update mentor_contacts set phone=''09121111111'' where id=''cccccccc-0000-4000-8000-000000000003''',
  'changing the phone leaves them published','approved');
select pg_temp.edit_as('cccccccc-0000-4000-8000-000000000003',
  'update mentor_meeting_links set meeting_link=''https://meet.example.invalid/x'' where id=''cccccccc-0000-4000-8000-000000000003''',
  'so does the meeting link','approved');

-- Saving without changing anything does not
select pg_temp.edit_as('cccccccc-0000-4000-8000-000000000003',
  'update mentor_profiles set bio=bio where id=''cccccccc-0000-4000-8000-000000000003''',
  'saving an unchanged profile leaves them alone','approved');

-- The photo is a public edit
select pg_temp.edit_as('cccccccc-0000-4000-8000-000000000003',
  'update profiles set photo_url=''https://example.invalid/new.jpg'' where id=''cccccccc-0000-4000-8000-000000000003''',
  'a new photo returns them to review','pending');

-- An admin tidying somebody else's page does not unpublish them
select pg_temp.edit_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4',
  'update mentor_profiles set bio=''tidied by the admin, still fine'' where id=''cccccccc-0000-4000-8000-000000000003''',
  'an admin editing them does not','approved');

-- And they still cannot approve themselves
select pg_temp.edit_as('cccccccc-0000-4000-8000-000000000003',
  'update mentor_profiles set status=''approved'', bio=''sneaky'' where id=''cccccccc-0000-4000-8000-000000000003''',
  'asking to stay approved while editing does not work','pending');

select 'An edited profile goes back in the queue' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ============================================================
-- Only somebody who was there can review
-- ============================================================
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.seed() returns void language plpgsql as $$
begin
  perform pg_temp.act_as_nobody();

  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
    ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}'),
    ('dddddddd-0000-4000-8000-000000000004','u@example.invalid','{"role":"mentor","full_name":"Mentor U"}');

  insert into mentor_profiles (id, bio, status) values
    ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved'),
    ('dddddddd-0000-4000-8000-000000000004','not yet approved','pending');

  insert into mentor_meeting_links (id, meeting_link)
    values ('cccccccc-0000-4000-8000-000000000003','https://meet.example.invalid/m');

  insert into availability_slots (id, mentor_id, start_time, end_time) values
    ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003', now()+interval '2 day', now()+interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003', now()+interval '3 day', now()+interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003', now()+interval '4 day', now()+interval '4 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000005','cccccccc-0000-4000-8000-000000000003', now()+interval '5 day', now()+interval '5 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003', now()-interval '2 day', now()-interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003', now()-interval '3 day', now()-interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000011','cccccccc-0000-4000-8000-000000000003', now()-interval '4 day', now()-interval '4 day' + interval '22 min'),
    ('22222222-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004', now()+interval '1 day', now()+interval '1 day' + interval '22 min');
end $$;
create or replace function pg_temp.read_as(
  actor uuid, dbrole text, q text, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role ' || quote_ident(dbrole);
    execute q into outcome;
    outcome := coalesce(outcome, 'null');
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;
create or replace function pg_temp.try_as(
  actor uuid, stmt text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role ' || case when actor is null then 'anon' else 'authenticated' end;
    execute stmt;
    outcome := 'ok';
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record('reviews', chk, expected, outcome);
end $$;

select pg_temp.seed();
select pg_temp.act_as_nobody();

-- A session that happened, and one that has not been accepted.
insert into bookings (id, slot_id, mentor_id, seeker_id, status, message) values
 ('0a000001-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003','aaaaaaaa-0000-4000-8000-000000000001','confirmed','x'),
 ('0a000002-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003','aaaaaaaa-0000-4000-8000-000000000001','pending','x'),
 ('0a000003-0000-4000-8000-000000000003','11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003','aaaaaaaa-0000-4000-8000-000000000001','confirmed','x');

-- The seeker who was there
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into reviews (booking_id, mentor_id, seeker_id, rating, body) values (''0a000001-0000-4000-8000-000000000001'',''cccccccc-0000-4000-8000-000000000003'',''aaaaaaaa-0000-4000-8000-000000000001'',5,''جلسه‌ی بسیار مفیدی بود و دقیقا همان چیزی را گفت که لازم داشتم.'')',
  'the seeker who had the session can review it','ok');

-- Twice
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into reviews (booking_id, mentor_id, seeker_id, rating, body) values (''0a000001-0000-4000-8000-000000000001'',''cccccccc-0000-4000-8000-000000000003'',''aaaaaaaa-0000-4000-8000-000000000001'',1,''نظر دوم درباره همان جلسه که نباید ثبت شود.'')',
  'but only once for the same session','refused');

-- A session that was never accepted
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into reviews (booking_id, mentor_id, seeker_id, rating, body) values (''0a000002-0000-4000-8000-000000000002'',''cccccccc-0000-4000-8000-000000000003'',''aaaaaaaa-0000-4000-8000-000000000001'',1,''جلسه‌ای که هیچ‌وقت پذیرفته نشد و برگزار نشد.'')',
  'an unanswered request cannot be reviewed','refused');

-- A session still in the future
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into reviews (booking_id, mentor_id, seeker_id, rating, body) values (''0a000003-0000-4000-8000-000000000003'',''cccccccc-0000-4000-8000-000000000003'',''aaaaaaaa-0000-4000-8000-000000000001'',5,''جلسه‌ای که هنوز برگزار نشده و فردا است.'')',
  'nor one that has not happened yet','refused');

-- Somebody who was not there
select pg_temp.try_as('bbbbbbbb-0000-4000-8000-000000000002',
  'insert into reviews (booking_id, mentor_id, seeker_id, rating, body) values (''0a000001-0000-4000-8000-000000000001'',''cccccccc-0000-4000-8000-000000000003'',''bbbbbbbb-0000-4000-8000-000000000002'',1,''من در این جلسه نبودم ولی نظر می‌دهم.'')',
  'a stranger cannot review it','refused');

-- The specialist reviewing themselves
select pg_temp.try_as('cccccccc-0000-4000-8000-000000000003',
  'insert into reviews (booking_id, mentor_id, seeker_id, rating, body) values (''0a000001-0000-4000-8000-000000000001'',''cccccccc-0000-4000-8000-000000000003'',''cccccccc-0000-4000-8000-000000000003'',5,''خودم درباره خودم نظر می‌دهم که عالی بودم.'')',
  'nor the specialist about themselves','refused');

-- A rating outside the scale, and a one-word review
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'update reviews set rating = 9 where booking_id = ''0a000001-0000-4000-8000-000000000001''',
  'editing a review runs but changes nothing','ok');
select pg_temp.act_as_nobody();
select pg_temp.record('reviews','the score it was given still stands','5', (select rating::text from reviews where booking_id='0a000001-0000-4000-8000-000000000001'));

-- Reading
select pg_temp.act_as_nobody();
select pg_temp.record('reviews','a signed-out visitor can read them','1',
  (select count(*)::text from reviews));

-- Taking it back
select pg_temp.try_as('bbbbbbbb-0000-4000-8000-000000000002',
  'delete from reviews where booking_id = ''0a000001-0000-4000-8000-000000000001''',
  'a stranger cannot delete it','ok');
select pg_temp.act_as_nobody();
select pg_temp.record('reviews','and it is still there afterwards','1',
  (select count(*)::text from reviews));

select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'delete from reviews where booking_id = ''0a000001-0000-4000-8000-000000000001''',
  'the author can take it back','ok');
select pg_temp.act_as_nobody();
select pg_temp.record('reviews','and then it is gone','0',
  (select count(*)::text from reviews));

-- The public reader: a signed-out visitor sees the review and the name of who
-- wrote it, without profiles being readable to them.
select pg_temp.act_as_nobody();
insert into reviews (booking_id, mentor_id, seeker_id, rating, body) values
 ('0a000001-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003','aaaaaaaa-0000-4000-8000-000000000001',4,'توضیح‌هایش دقیق بود و مسیر را روشن کرد.');

select pg_temp.read_as(null,'anon',
  'select count(*)::text from mentor_reviews(''cccccccc-0000-4000-8000-000000000003'')',
  'reviews','a visitor can read the reviews of a specialist','1');
select pg_temp.read_as(null,'anon',
  'select seeker_name from mentor_reviews(''cccccccc-0000-4000-8000-000000000003'') limit 1',
  'reviews','and the name of whoever wrote it','Seeker A');
select pg_temp.read_as(null,'anon',
  'select count(*)::text from profiles where id=''aaaaaaaa-0000-4000-8000-000000000001''',
  'reviews','while that seeker profile stays unreadable','0');

select 'Only somebody who was there can review' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ============================================================
-- The summary only the admin writes
-- ============================================================
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.seed() returns void language plpgsql as $$
begin
  perform pg_temp.act_as_nobody();

  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
    ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}'),
    ('dddddddd-0000-4000-8000-000000000004','u@example.invalid','{"role":"mentor","full_name":"Mentor U"}');

  insert into mentor_profiles (id, bio, status) values
    ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved'),
    ('dddddddd-0000-4000-8000-000000000004','not yet approved','pending');

  insert into mentor_meeting_links (id, meeting_link)
    values ('cccccccc-0000-4000-8000-000000000003','https://meet.example.invalid/m');

  insert into availability_slots (id, mentor_id, start_time, end_time) values
    ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003', now()+interval '2 day', now()+interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003', now()+interval '3 day', now()+interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003', now()+interval '4 day', now()+interval '4 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000005','cccccccc-0000-4000-8000-000000000003', now()+interval '5 day', now()+interval '5 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003', now()-interval '2 day', now()-interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003', now()-interval '3 day', now()-interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000011','cccccccc-0000-4000-8000-000000000003', now()-interval '4 day', now()-interval '4 day' + interval '22 min'),
    ('22222222-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004', now()+interval '1 day', now()+interval '1 day' + interval '22 min');
end $$;
create or replace function pg_temp.read_as(
  actor uuid, dbrole text, q text, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role ' || quote_ident(dbrole);
    execute q into outcome;
    outcome := coalesce(outcome, 'null');
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;
create or replace function pg_temp.try_as(
  actor uuid, stmt text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  perform pg_temp.act_as(actor);
  begin
    execute 'set local role authenticated';
    execute stmt;
    outcome := 'ok';
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.act_as_nobody();
  perform pg_temp.record('summary', chk, expected, outcome);
end $$;

select pg_temp.seed();
select pg_temp.act_as_nobody();

select pg_temp.try_as('cccccccc-0000-4000-8000-000000000003',
  'update mentor_profiles set admin_summary = ''من خودم درباره خودم نوشتم'' where id=''cccccccc-0000-4000-8000-000000000003''',
  'the specialist cannot write their own summary','refused: Only an admin can write the summary');

select pg_temp.record('summary','so it is still empty','null',
  coalesce((select admin_summary from mentor_profiles where id='cccccccc-0000-4000-8000-000000000003'), 'null'));

select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'update mentor_profiles set admin_summary = ''یک متقاضی نوشت'' where id=''cccccccc-0000-4000-8000-000000000003''',
  'nor can a seeker','ok');
select pg_temp.record('summary','and a seeker changes nothing','null',
  coalesce((select admin_summary from mentor_profiles where id='cccccccc-0000-4000-8000-000000000003'), 'null'));

select pg_temp.try_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4',
  'update mentor_profiles set admin_summary = ''معرفی نوشته‌ی ادمین'' where id=''cccccccc-0000-4000-8000-000000000003''',
  'the admin can','ok');
select pg_temp.record('summary','and it is saved','معرفی نوشته‌ی ادمین',
  (select admin_summary from mentor_profiles where id='cccccccc-0000-4000-8000-000000000003'));

-- Writing it must not knock an approved specialist off the site.
select pg_temp.record('summary','and does not send them back for review','approved',
  (select status from mentor_profiles where id='cccccccc-0000-4000-8000-000000000003'));

-- And a signed-out visitor can read it.
select pg_temp.read_as(null,'anon',
  'select admin_summary from mentor_profiles where id=''cccccccc-0000-4000-8000-000000000003''',
  'summary','a visitor can read it on the profile','معرفی نوشته‌ی ادمین');

select 'The summary only the admin writes' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ============================================================
-- A saved specialist stays private
-- ============================================================
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.seed() returns void language plpgsql as $$
begin
  perform pg_temp.act_as_nobody();

  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
    ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}'),
    ('dddddddd-0000-4000-8000-000000000004','u@example.invalid','{"role":"mentor","full_name":"Mentor U"}');

  insert into mentor_profiles (id, bio, status) values
    ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved'),
    ('dddddddd-0000-4000-8000-000000000004','not yet approved','pending');

  insert into mentor_meeting_links (id, meeting_link)
    values ('cccccccc-0000-4000-8000-000000000003','https://meet.example.invalid/m');

  insert into availability_slots (id, mentor_id, start_time, end_time) values
    ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003', now()+interval '2 day', now()+interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003', now()+interval '3 day', now()+interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003', now()+interval '4 day', now()+interval '4 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000005','cccccccc-0000-4000-8000-000000000003', now()+interval '5 day', now()+interval '5 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003', now()-interval '2 day', now()-interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003', now()-interval '3 day', now()-interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000011','cccccccc-0000-4000-8000-000000000003', now()-interval '4 day', now()-interval '4 day' + interval '22 min'),
    ('22222222-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004', now()+interval '1 day', now()+interval '1 day' + interval '22 min');
end $$;
create or replace function pg_temp.read_as(
  actor uuid, dbrole text, q text, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role ' || quote_ident(dbrole);
    execute q into outcome;
    outcome := coalesce(outcome, 'null');
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;
create or replace function pg_temp.try_as(
  actor uuid, stmt text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role ' || case when actor is null then 'anon' else 'authenticated' end;
    execute stmt;
    outcome := 'ok';
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.act_as_nobody();
  perform pg_temp.record('saved', chk, expected, outcome);
end $$;

select pg_temp.seed();
select pg_temp.act_as_nobody();

select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into saved_specialists (seeker_id, mentor_id) values (''aaaaaaaa-0000-4000-8000-000000000001'',''cccccccc-0000-4000-8000-000000000003'')',
  'a seeker keeps a specialist','ok');

select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into saved_specialists (seeker_id, mentor_id) values (''bbbbbbbb-0000-4000-8000-000000000002'',''cccccccc-0000-4000-8000-000000000003'')',
  'but cannot save on somebody else''''s behalf','refused');

-- Nobody else sees it, including the specialist being considered.
select pg_temp.read_as('bbbbbbbb-0000-4000-8000-000000000002','authenticated',
  'select count(*)::text from saved_specialists','saved','another seeker sees none of it','0');
select pg_temp.read_as('cccccccc-0000-4000-8000-000000000003','authenticated',
  'select count(*)::text from saved_specialists','saved','nor the specialist themselves','0');
select pg_temp.read_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4','authenticated',
  'select count(*)::text from saved_specialists','saved','nor the admin','0');
select pg_temp.read_as(null,'anon',
  'select count(*)::text from saved_specialists','saved','nor a signed-out visitor','0');
select pg_temp.read_as('aaaaaaaa-0000-4000-8000-000000000001','authenticated',
  'select count(*)::text from saved_specialists','saved','the person who saved it does','1');

select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'delete from saved_specialists where mentor_id=''cccccccc-0000-4000-8000-000000000003''',
  'and can unsave it','ok');
select pg_temp.record('saved','after which it is gone','0',
  (select count(*)::text from saved_specialists));

select 'A saved specialist stays private' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ============================================================
-- A first message is a request
-- ============================================================
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.seed() returns void language plpgsql as $$
begin
  perform pg_temp.act_as_nobody();

  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
    ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}'),
    ('dddddddd-0000-4000-8000-000000000004','u@example.invalid','{"role":"mentor","full_name":"Mentor U"}');

  insert into mentor_profiles (id, bio, status) values
    ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved'),
    ('dddddddd-0000-4000-8000-000000000004','not yet approved','pending');

  insert into mentor_meeting_links (id, meeting_link)
    values ('cccccccc-0000-4000-8000-000000000003','https://meet.example.invalid/m');

  insert into availability_slots (id, mentor_id, start_time, end_time) values
    ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000002','cccccccc-0000-4000-8000-000000000003', now()+interval '2 day', now()+interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000003','cccccccc-0000-4000-8000-000000000003', now()+interval '3 day', now()+interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000004','cccccccc-0000-4000-8000-000000000003', now()+interval '4 day', now()+interval '4 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000005','cccccccc-0000-4000-8000-000000000003', now()+interval '5 day', now()+interval '5 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000009','cccccccc-0000-4000-8000-000000000003', now()-interval '2 day', now()-interval '2 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000010','cccccccc-0000-4000-8000-000000000003', now()-interval '3 day', now()-interval '3 day' + interval '22 min'),
    ('11111111-0000-4000-8000-000000000011','cccccccc-0000-4000-8000-000000000003', now()-interval '4 day', now()-interval '4 day' + interval '22 min'),
    ('22222222-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004', now()+interval '1 day', now()+interval '1 day' + interval '22 min');
end $$;
create or replace function pg_temp.read_as(
  actor uuid, dbrole text, q text, flow text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role ' || quote_ident(dbrole);
    execute q into outcome;
    outcome := coalesce(outcome, 'null');
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.record(flow, chk, expected, outcome);
end $$;
create or replace function pg_temp.try_as(
  actor uuid, stmt text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role ' || case when actor is null then 'anon' else 'authenticated' end;
    execute stmt;
    outcome := 'ok';
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.act_as_nobody();
  perform pg_temp.record('inquiries', chk, expected, outcome);
end $$;

select pg_temp.seed();
select pg_temp.act_as_nobody();

select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into inquiries (mentor_id, seeker_id, body) values (''cccccccc-0000-4000-8000-000000000003'',''aaaaaaaa-0000-4000-8000-000000000001'',''سلام، سؤالی درباره مسیر شغلی دارم و می‌خواهم بدانم کمکم می‌کنی؟'')',
  'a seeker asks an approved specialist','ok');

select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into inquiries (mentor_id, seeker_id, body) values (''cccccccc-0000-4000-8000-000000000003'',''aaaaaaaa-0000-4000-8000-000000000001'',''یک سؤال دیگر پیش از آنکه به اولی جواب بدهد.'')',
  'but not a second one while the first waits','refused');

select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into inquiries (mentor_id, seeker_id, body) values (''dddddddd-0000-4000-8000-000000000004'',''aaaaaaaa-0000-4000-8000-000000000001'',''سؤال از کارشناسی که هنوز تأیید نشده است.'')',
  'and never a specialist the site has not approved','refused');

select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into inquiries (mentor_id, seeker_id, body) values (''cccccccc-0000-4000-8000-000000000003'',''bbbbbbbb-0000-4000-8000-000000000002'',''پیامی که به اسم کس دیگری فرستاده می‌شود.'')',
  'nor send one in somebody else''''s name','refused');

-- Privacy: between the two of them only
select pg_temp.read_as('bbbbbbbb-0000-4000-8000-000000000002','authenticated',
  'select count(*)::text from inquiries','inquiries','another seeker cannot read it','0');
select pg_temp.read_as(null,'anon',
  'select count(*)::text from inquiries','inquiries','nor a signed-out visitor','0');
select pg_temp.read_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4','authenticated',
  'select count(*)::text from inquiries','inquiries','nor even the admin','0');
select pg_temp.read_as('cccccccc-0000-4000-8000-000000000003','authenticated',
  'select count(*)::text from inquiries','inquiries','the specialist it was sent to can','1');
select pg_temp.read_as('aaaaaaaa-0000-4000-8000-000000000001','authenticated',
  'select count(*)::text from inquiries','inquiries','and so can whoever wrote it','1');

-- Answering is the specialist's, and it unblocks the next question
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'update inquiries set answered_at = now() where mentor_id=''cccccccc-0000-4000-8000-000000000003''',
  'a seeker cannot close their own question','ok');
select pg_temp.record('inquiries','so it is still open','1',
  (select count(*)::text from inquiries where answered_at is null));

select pg_temp.try_as('cccccccc-0000-4000-8000-000000000003',
  'update inquiries set answered_at = now() where mentor_id=''cccccccc-0000-4000-8000-000000000003''',
  'the specialist closes it','ok');
select pg_temp.record('inquiries','and then none are open','0',
  (select count(*)::text from inquiries where answered_at is null));

select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into inquiries (mentor_id, seeker_id, body) values (''cccccccc-0000-4000-8000-000000000003'',''aaaaaaaa-0000-4000-8000-000000000001'',''حالا که جواب داد، سؤال بعدی را می‌پرسم.'')',
  'which lets the next question through','ok');

select 'A first message is a request' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ---------------------------------------------------------------------------
-- The admin can fix a photo, and nobody else can touch one that is not theirs.
--
-- The capability is a function rather than a widened policy, so what has to be
-- proved is the function: that it refuses everyone except an admin, that it
-- actually writes when an admin calls it, and -- the part that would be easy
-- to get wrong -- that an admin using it does not send an approved specialist
-- back into the review queue. That trigger fires on `new.id = auth.uid()`, and
-- a SECURITY DEFINER function does not change auth.uid(), so it must not fire
-- here. This is the check that says so out loud.
-- ---------------------------------------------------------------------------
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.try_as(
  actor uuid, stmt text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role ' || case when actor is null then 'anon' else 'authenticated' end;
    execute stmt;
    outcome := 'ok';
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.act_as_nobody();
  perform pg_temp.record('admin photo', chk, expected, outcome);
end $$;

select set_config('request.jwt.claims', '', true);

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
  ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}');

insert into mentor_profiles (id, bio, status) values
  ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved');

-- Nobody but an admin gets to touch it.
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'select admin_set_photo(''cccccccc-0000-4000-8000-000000000003'', ''https://example.invalid/hijack.jpg'')',
  'a seeker cannot change somebody''s photo','refused');

select pg_temp.try_as('cccccccc-0000-4000-8000-000000000003',
  'select admin_set_photo(''aaaaaaaa-0000-4000-8000-000000000001'', ''https://example.invalid/hijack.jpg'')',
  'nor can a specialist, on somebody else','refused');

select pg_temp.try_as('cccccccc-0000-4000-8000-000000000003',
  'select admin_set_photo(''cccccccc-0000-4000-8000-000000000003'', ''https://example.invalid/self.jpg'')',
  'nor a specialist on their own row, through this door','refused');

select pg_temp.try_as(null,
  'select admin_set_photo(''cccccccc-0000-4000-8000-000000000003'', ''https://example.invalid/hijack.jpg'')',
  'nor a signed-out visitor','refused');

-- None of that got through.
select pg_temp.record('admin photo','and none of them changed anything','0',
  (select count(*)::text from profiles
    where id='cccccccc-0000-4000-8000-000000000003'
      and photo_url like '%example.invalid%'));

-- The admin can, and it lands.
select pg_temp.try_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4',
  'select admin_set_photo(''cccccccc-0000-4000-8000-000000000003'', ''https://example.invalid/fixed.jpg'')',
  'the admin can','ok');

select pg_temp.record('admin photo','and the photo is the new one','https://example.invalid/fixed.jpg',
  (select coalesce(photo_url,'null') from profiles
    where id='cccccccc-0000-4000-8000-000000000003'));

-- And the person whose photo it is stays published.
select pg_temp.record('admin photo','and they are still approved','approved',
  (select status from mentor_profiles
    where id='cccccccc-0000-4000-8000-000000000003'));

select 'The admin can fix a photo' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

-- ---------------------------------------------------------------------------
-- A suspended account can do nothing, and a suspended specialist is off the
-- site -- but neither is deleted, and neither loses sight of their own page.
-- ---------------------------------------------------------------------------
begin;
create temp table if not exists results(
  flow text, check_name text, expected text, actual text
) on commit drop;
grant all on results to authenticated;

create or replace function pg_temp.act_as(u uuid) returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_nobody() returns void
language plpgsql security definer as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(f text, c text, e text, a text)
returns void language plpgsql security definer as $$
begin
  insert into results values (f, c, e, a);
end $$;

create or replace function pg_temp.try_as(
  actor uuid, stmt text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  if actor is null then perform pg_temp.act_as_nobody();
  else perform pg_temp.act_as(actor); end if;
  begin
    execute 'set local role ' || case when actor is null then 'anon' else 'authenticated' end;
    execute stmt;
    outcome := 'ok';
  exception when others then outcome := 'refused: ' || sqlerrm;
  end;
  execute 'reset role';
  perform pg_temp.act_as_nobody();
  perform pg_temp.record('suspension', chk, expected, outcome);
end $$;

create or replace function pg_temp.count_as(
  actor uuid, q text, chk text, expected text
) returns void language plpgsql as $$
declare outcome text;
begin
  perform pg_temp.act_as(actor);
  execute 'set local role authenticated';
  begin execute q into outcome;
  exception when others then outcome := 'refused: ' || sqlerrm; end;
  execute 'reset role';
  perform pg_temp.act_as_nobody();
  perform pg_temp.record('suspension', chk, expected, coalesce(outcome,'null'));
end $$;

select set_config('request.jwt.claims', '', true);

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001','a@example.invalid','{"role":"seeker","full_name":"Seeker A"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002','b@example.invalid','{"role":"seeker","full_name":"Seeker B"}'),
  ('cccccccc-0000-4000-8000-000000000003','m@example.invalid','{"role":"mentor","full_name":"Mentor M"}');

insert into mentor_profiles (id, bio, status) values
  ('cccccccc-0000-4000-8000-000000000003','approved mentor','approved');

insert into availability_slots (id, mentor_id, start_time, end_time) values
  ('11111111-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000003', now()+interval '1 day', now()+interval '1 day' + interval '22 min');

-- Nobody but an admin can suspend, and an admin cannot suspend themselves.
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'select admin_set_suspended(''bbbbbbbb-0000-4000-8000-000000000002'', true)',
  'a seeker cannot suspend anybody','refused');
select pg_temp.try_as('cccccccc-0000-4000-8000-000000000003',
  'select admin_set_suspended(''aaaaaaaa-0000-4000-8000-000000000001'', true)',
  'nor can a specialist','refused');
select pg_temp.try_as(null,
  'select admin_set_suspended(''aaaaaaaa-0000-4000-8000-000000000001'', true)',
  'nor a signed-out visitor','refused');
select pg_temp.try_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4',
  'select admin_set_suspended(''13d63926-8e4a-469e-bd9f-11521e4d5fe4'', true)',
  'and an admin cannot suspend themselves','refused');

-- Before: an ordinary seeker can book.
select pg_temp.try_as('aaaaaaaa-0000-4000-8000-000000000001',
  'insert into bookings (mentor_id, seeker_id, slot_id, message) values (''cccccccc-0000-4000-8000-000000000003'',''aaaaaaaa-0000-4000-8000-000000000001'',''11111111-0000-4000-8000-000000000001'',''سلام، وقت داری؟'')',
  'a seeker who is fine can book','ok');

-- The admin suspends that seeker.
select pg_temp.try_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4',
  'select admin_set_suspended(''bbbbbbbb-0000-4000-8000-000000000002'', true)',
  'the admin can suspend a seeker','ok');

-- After: the suspended one can do none of the four things.
select pg_temp.try_as('bbbbbbbb-0000-4000-8000-000000000002',
  'insert into inquiries (mentor_id, seeker_id, body) values (''cccccccc-0000-4000-8000-000000000003'',''bbbbbbbb-0000-4000-8000-000000000002'',''سؤال از حساب معلق'')',
  'a suspended seeker cannot ask','refused');

select pg_temp.try_as('bbbbbbbb-0000-4000-8000-000000000002',
  'insert into bookings (mentor_id, seeker_id, slot_id, message) values (''cccccccc-0000-4000-8000-000000000003'',''bbbbbbbb-0000-4000-8000-000000000002'',''11111111-0000-4000-8000-000000000001'',''رزرو از حساب معلق'')',
  'nor book','refused');

-- Lifting it puts them back.
select pg_temp.try_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4',
  'select admin_set_suspended(''bbbbbbbb-0000-4000-8000-000000000002'', false)',
  'the admin can lift it','ok');
select pg_temp.count_as('bbbbbbbb-0000-4000-8000-000000000002',
  'select is_suspended()::text','and then they are not suspended','false');

-- A suspended specialist comes off the site, for everybody but themselves.
select pg_temp.try_as('13d63926-8e4a-469e-bd9f-11521e4d5fe4',
  'select admin_set_suspended(''cccccccc-0000-4000-8000-000000000003'', true)',
  'the admin can suspend a specialist','ok');

select pg_temp.count_as('aaaaaaaa-0000-4000-8000-000000000001',
  'select count(*)::text from mentor_profiles where id=''cccccccc-0000-4000-8000-000000000003''',
  'a suspended specialist is not public','0');
select pg_temp.count_as('aaaaaaaa-0000-4000-8000-000000000001',
  'select count(*)::text from availability_slots where mentor_id=''cccccccc-0000-4000-8000-000000000003''',
  'and their slots are not visible','0');
select pg_temp.count_as('cccccccc-0000-4000-8000-000000000003',
  'select count(*)::text from mentor_profiles where id=''cccccccc-0000-4000-8000-000000000003''',
  'but they can still see their own page','1');

select 'An account can be suspended' as section, check_name, expected, actual,
       (actual like expected || '%') as pass
  from results order by 2;
rollback;

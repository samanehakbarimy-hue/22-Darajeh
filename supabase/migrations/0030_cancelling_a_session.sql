-- Cancelling: the lever that existed but nothing pulled.
--
-- 'cancelled' has been in the status constraint since 0001, the trigger that
-- frees the slot handles it, and both dashboards already render a "لغو شده"
-- label — but no code path ever set it. Once a specialist accepted, neither
-- side could back out.
--
-- While adding it, the policy that was supposed to allow this turned out to
-- allow everything. "Seekers and mentors can cancel a booking" was
--
--   using (seeker_id = auth.uid() or mentor_id = auth.uid())
--
-- on UPDATE with no restriction on columns or values, so a seeker could set
-- their own pending request to 'confirmed' and skip the specialist entirely,
-- or write bookings.meeting_link — the link the SPECIALIST is then shown and
-- invited to click. Verified against the real schema as an authenticated
-- seeker: both went through.

alter table bookings
  add column if not exists cancelled_by uuid references profiles(id),
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text;

-- Who may still change a booking row directly, and to what.
--
-- Exactly one legitimate direct update exists in the app: the specialist
-- storing a generated meeting link on their own booking. Everything else —
-- answering a request, editing the message, cancelling — goes through a
-- SECURITY DEFINER function that checks who is asking. Those run as the owner,
-- so neither this policy nor the column grant below constrains them.
drop policy if exists "Seekers and mentors can cancel a booking" on bookings;

create policy "A specialist can store a meeting link on their own booking"
  on bookings for update
  using (mentor_id = auth.uid())
  with check (mentor_id = auth.uid());

-- RLS cannot limit which columns an update touches; column privileges can.
revoke update on bookings from authenticated;
grant update (meeting_link) on bookings to authenticated;

-- Cancelling proper.
--
-- Either side may cancel, at any point up to the moment the session ends. A
-- session that has already finished is history and cannot be undone; one that
-- is in progress still can, because that is exactly when something has gone
-- wrong. The reason is recorded because the other person is about to find a
-- session missing and deserves to know who called it off and why.
create or replace function public.cancel_booking(
  booking_id uuid,
  reason text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  ends_at timestamptz;
  is_party boolean;
begin
  select s.end_time, (b.seeker_id = auth.uid() or b.mentor_id = auth.uid())
    into ends_at, is_party
  from public.bookings b
  join public.availability_slots s on s.id = b.slot_id
  where b.id = booking_id
    and b.status in ('pending', 'confirmed');

  if not found or not is_party then
    raise exception 'No live booking of yours with that id';
  end if;

  if ends_at is not null and ends_at <= now() then
    raise exception 'That session has already finished';
  end if;

  update public.bookings
    set status = 'cancelled',
        cancelled_by = auth.uid(),
        cancelled_at = now(),
        cancel_reason = nullif(btrim(coalesce(reason, '')), '')
    where id = booking_id;
end;
$$;

revoke execute on function public.cancel_booking(uuid, text) from public, anon;
grant execute on function public.cancel_booking(uuid, text) to authenticated;

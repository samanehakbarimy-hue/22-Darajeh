-- 0030 refused to cancel anything whose slot had passed. That is right for a
-- confirmed session — it happened, and pretending otherwise helps nobody — but
-- wrong for a request that was never accepted. Nothing took place, so there is
-- nothing to have finished, and the seeker was told "That session has already
-- finished" about a session that never existed.
--
-- It also left them stuck: an unanswered request sat on their account with no
-- way to clear it, while the specialist could tidy the same row away from their
-- own list by declining it.
--
-- A pending request can now be withdrawn whatever the clock says. The guard
-- stays exactly as it was for confirmed sessions.
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
  current_status text;
  is_party boolean;
begin
  select s.end_time, b.status, (b.seeker_id = auth.uid() or b.mentor_id = auth.uid())
    into ends_at, current_status, is_party
  from public.bookings b
  join public.availability_slots s on s.id = b.slot_id
  where b.id = booking_id
    and b.status in ('pending', 'confirmed');

  if not found or not is_party then
    raise exception 'No live booking of yours with that id';
  end if;

  if current_status = 'confirmed' and ends_at is not null and ends_at <= now() then
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

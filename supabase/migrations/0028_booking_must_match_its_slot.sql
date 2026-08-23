-- A booking had to name a specialist and a slot, and nothing checked that the
-- slot belonged to that specialist.
--
-- The page sends both, so through the site they always agree. Sent directly,
-- they need not: specialist A's free slot could be booked against specialist
-- B, who would then see a request for a time they never offered, while A's
-- slot was consumed. If B accepted, a Meet link would be created on B's
-- calendar for A's time. Harmless while there is one specialist; live the
-- moment there are two.
--
-- Also refuses a slot that has already passed. is_booked stays false on old
-- slots that were never taken, so nothing stopped booking a time in the past —
-- the page only hides them.
drop policy if exists "Seekers can book themselves into an open slot" on bookings;

create policy "Seekers can book themselves into an open slot"
  on bookings for insert
  with check (
    seeker_id = auth.uid()
    and exists (
      select 1 from availability_slots s
      where s.id = bookings.slot_id
        and s.is_booked = false
        and s.mentor_id = bookings.mentor_id
        and s.start_time > now()
    )
  );

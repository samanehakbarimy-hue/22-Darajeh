-- A declined or cancelled slot could never be booked again.
--
-- UNIQUE (slot_id) was unconditional, so the row left behind by a declined
-- request kept owning that slot forever. Meanwhile the trigger set
-- is_booked = false, so the time reappeared as available: a seeker saw it
-- offered, tried to book, and was told "someone just booked this" — plausible,
-- untrue, and unfixable by retrying. Every declined request permanently burned
-- one of the specialist's times.
--
-- The constraint is still wanted, but only for bookings that are actually
-- live. Two people racing for the same free slot must still collide; a slot
-- whose booking was declined must be reusable.
alter table bookings drop constraint if exists bookings_slot_id_key;

drop index if exists bookings_one_live_per_slot;
create unique index bookings_one_live_per_slot
  on bookings (slot_id)
  where status in ('pending', 'confirmed');

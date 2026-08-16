-- Adds the seeker's short invitation message to a booking (ADPList-style:
-- write why you want the call before picking a time).
alter table public.bookings
  add column message text not null default '';

-- Slot times were built with new Date("YYYY-MM-DDTHH:MM:00"), which reads
-- those digits in whatever zone the machine happens to run in. On Vercel that
-- is UTC, so a specialist choosing 19:00 in Tehran had 19:00 UTC stored — the
-- same digits, three and a half hours from the moment they meant.
--
-- Nobody noticed because the pages listing slots are server components and
-- formatted them back in UTC, printing the digits that were typed. The picker
-- is a client component, formatted on the device, and disagreed.
--
-- Re-read each stored value as the Tehran wall-clock time it was always meant
-- to be: take the UTC clock face off the stored instant, then interpret that
-- same face as Tehran. Correct across any offset change, unlike subtracting a
-- fixed interval.
--
-- ONE-SHOT, and that was the flaw: it shifts by a relative amount, so it
-- was in fact applied twice and moved every slot 7 hours instead of 3.5.
-- 0018 repairs it with absolute timestamps, which cannot compound.
--
-- ALREADY APPLIED. Do not run again.
update availability_slots
set start_time = (start_time at time zone 'UTC') at time zone 'Asia/Tehran',
    end_time   = (end_time   at time zone 'UTC') at time zone 'Asia/Tehran';

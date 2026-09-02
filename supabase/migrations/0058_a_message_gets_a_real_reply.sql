-- A message gets a real reply, and stops vanishing when somebody clicks.
--
-- The specialist's only control was «جواب دادم» — a claim, not an action. It
-- wrote answered_at, the card disappeared, and nothing was sent anywhere. The
-- seeker had been told «وقتی جواب داد، خبردار می‌شوی» and there was no
-- mechanism by which they ever could be: no reply field, no email on the way
-- back, and no page where the sender could see their own message at all.
--
-- Worse, the specialist had no channel even if he wanted one. He never sees a
-- seeker's address; bookings solve that with booking_parties(), and inquiries
-- had no equivalent. So the button answered a question that could not be
-- answered.
--
-- Two columns and one function fix all of it. Deliberately not a thread: one
-- question, one reply, and the free 22-minute call for anything longer.

alter table public.inquiries
  add column if not exists reply      text,
  add column if not exists replied_at timestamptz;

comment on column public.inquiries.reply is
  'The specialist''s single reply. There is no thread: a conversation that '
  'needs more than this is what the 22-minute call is for.';

-- A reply and its timestamp arrive together or not at all. Either alone means
-- a reply nobody can date or a date with nothing under it.
alter table public.inquiries
  drop constraint if exists inquiries_reply_has_a_time;
alter table public.inquiries
  add constraint inquiries_reply_has_a_time
    check ((reply is null) = (replied_at is null));

-- answered_at stays, and replying sets it. It is what
-- inquiries_one_open_per_pair keys on, so a real reply is what frees the
-- seeker to ask again — which is what that index always meant.

-- The existing UPDATE policy is already (mentor_id = auth.uid()) for both USING
-- and WITH CHECK, so it covers the new columns without being touched. A seeker
-- cannot write a reply to themselves, and neither can a passer-by.

-- ---------------------------------------------------------------------------
-- Who to write to, without handing anybody an address they should not have.
--
-- The same shape as booking_parties(): refuse unless the caller is one of the
-- two people in it, then return what an email needs. Definer because addresses
-- live in auth.users and there is deliberately no service-role key.
-- ---------------------------------------------------------------------------
create or replace function public.inquiry_parties(inquiry_id uuid)
returns table (
  seeker_name  text,
  seeker_email text,
  mentor_name  text,
  mentor_email text,
  replied      boolean
)
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  if not exists (
    select 1 from public.inquiries i
    where i.id = inquiry_id
      and (i.seeker_id = auth.uid() or i.mentor_id = auth.uid())
  ) then
    raise exception 'Not your message';
  end if;

  return query
    select
      sp.full_name,
      su.email::text,
      mp.full_name,
      mu.email::text,
      i.replied_at is not null
    from public.inquiries i
    join public.profiles sp on sp.id = i.seeker_id
    join auth.users   su on su.id = i.seeker_id
    join public.profiles mp on mp.id = i.mentor_id
    join auth.users   mu on mu.id = i.mentor_id
    where i.id = inquiry_id;
end;
$fn$;

revoke all on function public.inquiry_parties(uuid) from public, anon;
grant execute on function public.inquiry_parties(uuid) to authenticated;

-- A sender needs to find their own messages, not just the recipient's.
create index if not exists inquiries_seeker_idx
  on public.inquiries (seeker_id, created_at desc);

-- ---------------------------------------------------------------------------
-- One reply, enforced where it cannot be talked out of.
--
-- The action already refuses a second one, but an action is a suggestion to
-- anybody holding an anon key and a terminal. Narrowing the policy's USING
-- clause makes a second attempt match zero rows instead.
-- ---------------------------------------------------------------------------
drop policy if exists "the specialist marks it answered" on public.inquiries;
drop policy if exists "the specialist replies, once" on public.inquiries;
create policy "the specialist replies, once"
  on public.inquiries for update to authenticated
  using (mentor_id = auth.uid() and replied_at is null)
  with check (mentor_id = auth.uid());

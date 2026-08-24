-- Answering a brief, and withdrawing one.
--
-- Both go through definer functions rather than an update policy. bookings had
-- a policy named "cancel a booking" that permitted any column change, and a
-- seeker could use it to confirm their own request; the lesson was to grant no
-- direct update at all and let a checked function do the work.
create or replace function public.respond_to_brief(
  brief_id uuid,
  accept boolean,
  rate_toman bigint default null,
  hours integer default null,
  note text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  owner uuid;
begin
  select mentor_id into owner
  from public.project_briefs
  where id = brief_id and status = 'pending';

  if owner is null or owner <> auth.uid() then
    raise exception 'No open brief of yours with that id';
  end if;

  if accept and (rate_toman is null or hours is null) then
    raise exception 'Accepting needs a rate and an estimate';
  end if;

  update public.project_briefs
    set status = case when accept then 'accepted' else 'declined' end,
        quoted_rate_toman = case when accept then rate_toman else null end,
        estimated_hours = case when accept then hours else null end,
        reply_note = nullif(btrim(coalesce(note, '')), ''),
        responded_at = now()
    where id = brief_id;
end;
$$;

revoke execute on function public.respond_to_brief(uuid, boolean, bigint, integer, text) from public, anon;
grant execute on function public.respond_to_brief(uuid, boolean, bigint, integer, text) to authenticated;

-- A seeker can take back a brief that has not been answered. Nothing has been
-- agreed yet, so there is nothing to be too late for.
create or replace function public.withdraw_brief(brief_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  sender uuid;
begin
  select seeker_id into sender
  from public.project_briefs
  where id = brief_id and status = 'pending';

  if sender is null or sender <> auth.uid() then
    raise exception 'No open brief of yours with that id';
  end if;

  update public.project_briefs
    set status = 'withdrawn', responded_at = now()
    where id = brief_id;
end;
$$;

revoke execute on function public.withdraw_brief(uuid) from public, anon;
grant execute on function public.withdraw_brief(uuid) to authenticated;

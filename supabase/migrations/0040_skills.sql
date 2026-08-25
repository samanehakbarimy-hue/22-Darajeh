-- What a specialist uses, as opposed to where they work.
--
-- expertise_tags answers "which field" — نفت و گاز, توسعه نرم‌افزار — and a
-- person has one or two. Skills answer "with what": AutoCAD, PV Elite, ASME
-- VIII for a static equipment engineer; Python, React, Docker for a front-end
-- one. A person has many, and they are the specific thing a mentee is actually
-- looking for.
--
-- They were briefly the same list, which was wrong in both directions: it put
-- Python beside نفت و گاز as though they were the same kind of answer, and it
-- meant a specialist could only say the broad thing.
alter table public.mentor_profiles
  add column if not exists skills text[] not null default '{}';

-- Same column-level grant the rest of the editable fields have. The row policy
-- already restricts this to the owner and admins; the grant is what stops a
-- column being written that no form should be writing.
grant update (skills) on public.mentor_profiles to authenticated;

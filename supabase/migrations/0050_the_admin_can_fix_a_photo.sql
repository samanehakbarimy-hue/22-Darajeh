-- The admin can replace a specialist's photo.
--
-- Why this is needed at all: the photo most specialists arrive with is
-- LinkedIn's 100x100 thumbnail, which is the only size their OIDC scope
-- offers. Shown at 192px it is visibly soft, and the only fix is a better
-- picture -- which today can come from nobody but the specialist themselves,
-- because both halves of the job are locked to the owner:
--
--   profiles UPDATE  is  (id = auth.uid())
--   storage avatars  is  (storage.foldername(name))[1] = auth.uid()
--
-- Rather than widen the profiles policy to `or is_admin()` -- which would hand
-- an admin every column on every row to solve a problem about one column --
-- the capability is a function that can do exactly one thing.

create or replace function public.admin_set_photo(target uuid, url text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can change somebody else''s photo';
  end if;

  update public.profiles
     set photo_url = url
   where id = target;
end;
$$;

-- Definer, so it runs as the owner and is not stopped by the policy above.
-- The admin check inside is therefore the whole gate, and it is checked
-- first, before anything is written.
revoke all on function public.admin_set_photo(uuid, text) from public, anon;
grant execute on function public.admin_set_photo(uuid, text) to authenticated;

-- Note on what this deliberately does NOT trip:
--
-- photo_change_returns_to_review() sends an approved specialist back to the
-- queue when their photo changes, and it is right to. But it fires only when
-- `new.id = auth.uid()` -- when somebody edits their own row -- and a definer
-- function does not change auth.uid(), only which role executes. So an admin
-- fixing a photo does not unpublish the person whose photo it is, which is
-- the entire point of an admin fixing it.

-- The bytes have to land somewhere, and the avatars bucket is keyed by folder
-- to the owner's id. An admin needs to write into somebody else's folder for
-- the row above to have anything to point at.
--
-- Scoped to the one bucket. Avatars are public to read already; nothing here
-- widens who can see them, only who can replace one.
drop policy if exists "Admins can upload any avatar" on storage.objects;
create policy "Admins can upload any avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and public.is_admin());

drop policy if exists "Admins can replace any avatar" on storage.objects;
create policy "Admins can replace any avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and public.is_admin())
  with check (bucket_id = 'avatars' and public.is_admin());

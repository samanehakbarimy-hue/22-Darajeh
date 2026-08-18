-- Makes the auto-profile-creation trigger robust to OAuth providers
-- (LinkedIn OIDC), which populate user metadata under different key
-- names than our own email/password signup does.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, photo_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'seeker'),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(
        trim(
          coalesce(new.raw_user_meta_data ->> 'given_name', '')
          || ' ' || coalesce(new.raw_user_meta_data ->> 'family_name', '')
        ),
        ''
      ),
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  );
  return new;
end;
$$;

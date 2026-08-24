-- A brief can carry a file: a drawing, a spec, a CV, whatever makes the job
-- legible. Storing what it is as well as where it lives, because the stored
-- name is a uuid and nobody wants to download "8f3a…-b2.pdf".
alter table project_briefs
  add column if not exists attachment_path text,
  add column if not exists attachment_name text check (
    attachment_name is null or length(attachment_name) <= 200
  );

-- Private. The avatars bucket is public because a profile photo is meant to be
-- seen; a brief's attachment is somebody's unpublished work and must not be
-- readable by anyone holding the URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  20971520, -- 20 MB: engineering drawings are not small
  array[
    'application/pdf',
    'image/png','image/jpeg','image/webp',
    'application/zip','application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Uploading: into a folder named after yourself, and nowhere else. The file is
-- put in place before the brief row exists, so this cannot depend on the brief.
drop policy if exists "upload a brief attachment into your own folder" on storage.objects;
create policy "upload a brief attachment into your own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Reading: only the two people named on the brief that points at this file.
-- Keyed on the brief rather than on the folder, because the specialist has to
-- read a file sitting in the seeker's folder.
drop policy if exists "read an attachment on a brief you are part of" on storage.objects;
create policy "read an attachment on a brief you are part of"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.project_briefs b
      where b.attachment_path = storage.objects.name
        and (b.seeker_id = auth.uid() or b.mentor_id = auth.uid())
    )
  );

-- Clearing up after yourself is allowed; a file nobody attached to a brief
-- would otherwise sit there forever after an abandoned form.
drop policy if exists "delete your own upload" on storage.objects;
create policy "delete your own upload"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

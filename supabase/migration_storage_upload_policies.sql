-- Restore the intended designer upload flow without disabling RLS.
-- Existing bucket MIME and size restrictions remain in force.
begin;

create policy "savana_designer_upload_own_model"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'designs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'designer'
  )
);

create policy "savana_designer_upload_own_preview"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'previews'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'designer'
  )
);

commit;

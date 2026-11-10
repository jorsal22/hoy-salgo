drop policy if exists "Configured admin can upload club logos" on storage.objects;
create policy "Configured admin can upload club logos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and name like 'flyers/%-club-logo.jpg'
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'salsamendi.jorge@gmail.com'
  );

drop policy if exists "Configured admin can delete club logos" on storage.objects;
create policy "Configured admin can delete club logos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and name like 'flyers/%-club-logo.jpg'
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'salsamendi.jorge@gmail.com'
  );

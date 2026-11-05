-- Buckets ---------------------------------------------------------------------------
-- Public-read so the static public site can display images without an
-- authenticated request; writes are gated by the policies below.
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('hero-images', 'hero-images', true, 10485760),
  ('pastors', 'pastors', true, 10485760),
  ('directors', 'directors', true, 10485760),
  ('churches', 'churches', true, 10485760),
  ('events', 'events', true, 10485760),
  ('pages', 'pages', true, 10485760)
on conflict (id) do nothing;

-- Policies ---------------------------------------------------------------------------
-- storage.objects already has RLS enabled by default on every Supabase
-- project, and that table is owned by Supabase's internal roles rather than
-- `postgres` — so re-issuing ENABLE ROW LEVEL SECURITY here isn't just
-- redundant, it actively fails with "must be owner of table objects" when
-- run via the SQL Editor. Policies can still be created on it without
-- owning it (Supabase grants `postgres` that specifically), so only the
-- policies below are needed.

-- hero-images
create policy "hero-images_public_read" on storage.objects
  for select using (bucket_id = 'hero-images');
create policy "hero-images_admin_insert" on storage.objects
  for insert with check (bucket_id = 'hero-images' and public.is_admin());
create policy "hero-images_admin_update" on storage.objects
  for update using (bucket_id = 'hero-images' and public.is_admin())
  with check (bucket_id = 'hero-images' and public.is_admin());
create policy "hero-images_admin_delete" on storage.objects
  for delete using (bucket_id = 'hero-images' and public.is_admin());

-- pastors
create policy "pastors_public_read" on storage.objects
  for select using (bucket_id = 'pastors');
create policy "pastors_admin_insert" on storage.objects
  for insert with check (bucket_id = 'pastors' and public.is_admin());
create policy "pastors_admin_update" on storage.objects
  for update using (bucket_id = 'pastors' and public.is_admin())
  with check (bucket_id = 'pastors' and public.is_admin());
create policy "pastors_admin_delete" on storage.objects
  for delete using (bucket_id = 'pastors' and public.is_admin());

-- directors
create policy "directors_public_read" on storage.objects
  for select using (bucket_id = 'directors');
create policy "directors_admin_insert" on storage.objects
  for insert with check (bucket_id = 'directors' and public.is_admin());
create policy "directors_admin_update" on storage.objects
  for update using (bucket_id = 'directors' and public.is_admin())
  with check (bucket_id = 'directors' and public.is_admin());
create policy "directors_admin_delete" on storage.objects
  for delete using (bucket_id = 'directors' and public.is_admin());

-- churches
create policy "churches_public_read" on storage.objects
  for select using (bucket_id = 'churches');
create policy "churches_admin_insert" on storage.objects
  for insert with check (bucket_id = 'churches' and public.is_admin());
create policy "churches_admin_update" on storage.objects
  for update using (bucket_id = 'churches' and public.is_admin())
  with check (bucket_id = 'churches' and public.is_admin());
create policy "churches_admin_delete" on storage.objects
  for delete using (bucket_id = 'churches' and public.is_admin());

-- events
create policy "events_public_read" on storage.objects
  for select using (bucket_id = 'events');
create policy "events_admin_insert" on storage.objects
  for insert with check (bucket_id = 'events' and public.is_admin());
create policy "events_admin_update" on storage.objects
  for update using (bucket_id = 'events' and public.is_admin())
  with check (bucket_id = 'events' and public.is_admin());
create policy "events_admin_delete" on storage.objects
  for delete using (bucket_id = 'events' and public.is_admin());

-- pages (inline body-content images)
create policy "pages_bucket_public_read" on storage.objects
  for select using (bucket_id = 'pages');
create policy "pages_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'pages' and public.is_admin());
create policy "pages_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'pages' and public.is_admin())
  with check (bucket_id = 'pages' and public.is_admin());
create policy "pages_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'pages' and public.is_admin());

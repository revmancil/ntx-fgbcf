-- Seed data for local development / initial deploy. Values below are the
-- real current values already live on the static site, so the admin
-- dashboard starts in sync with production rather than with placeholders.

insert into public.site_settings (key, value) values
  ('site_name', 'North Texas State'),
  ('site_tagline', 'Full Gospel Baptist Church Fellowship'),
  ('contact_email', 'info@ntxfullgospel.org'),
  ('primary_color', '#7600d1'),
  ('logo_url', 'images/ntx-logo.jpg'),
  ('site_domain', 'https://ntxfullgospel.org')
on conflict (key) do nothing;

-- One row per existing static page, in current navigation order, so Menu
-- Visibility Controls and Page Management have something to render against
-- immediately. `content` is left as an empty block array: the actual HTML
-- body content is migrated separately (see supabase/seed/migrate-pages.mjs,
-- a follow-up task) rather than hand-copied here.
insert into public.pages (slug, title, menu_visible, nav_order) values
  ('home', 'Home', true, 0),
  ('fellowship', 'The Fellowship', true, 1),
  ('about', 'About North Texas', true, 2),
  ('leadership', 'Leadership', true, 3),
  ('churches', 'Our Churches', true, 4),
  ('faq', 'FAQ', true, 5),
  ('contact', 'Contact', true, 6),
  ('giving', 'Give', true, 7)
on conflict (slug) do nothing;

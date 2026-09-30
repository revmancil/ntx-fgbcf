-- Enable RLS everywhere -------------------------------------------------------------
alter table public.pastors enable row level security;
alter table public.directors enable row level security;
alter table public.churches enable row level security;
alter table public.events enable row level security;
alter table public.pages enable row level security;
alter table public.hero_images enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_users enable row level security;
alter table public.churches_history enable row level security;
alter table public.profile_history enable row level security;
alter table public.events_history enable row level security;
alter table public.pages_history enable row level security;
alter table public.settings_history enable row level security;
alter table public.admin_audit_log enable row level security;

-- pastors ---------------------------------------------------------------------------
-- Not sensitive: readable by everyone, including anonymous/public site visitors.
create policy "pastors_public_read" on public.pastors
  for select using (true);

create policy "pastors_admin_write" on public.pastors
  for insert with check (public.is_admin());
create policy "pastors_admin_update" on public.pastors
  for update using (public.is_admin()) with check (public.is_admin());
create policy "pastors_super_admin_delete" on public.pastors
  for delete using (public.is_super_admin());

-- directors ---------------------------------------------------------------------------
create policy "directors_public_read" on public.directors
  for select using (true);

create policy "directors_admin_write" on public.directors
  for insert with check (public.is_admin());
create policy "directors_admin_update" on public.directors
  for update using (public.is_admin()) with check (public.is_admin());
create policy "directors_super_admin_delete" on public.directors
  for delete using (public.is_super_admin());

-- churches ------------------------------------------------------------------------------
-- Public may only read active churches; admins can read every row (including
-- deactivated ones) so the dashboard list can show them with the active toggle off.
create policy "churches_public_read_active" on public.churches
  for select using (active = true or public.is_admin());

create policy "churches_admin_write" on public.churches
  for insert with check (public.is_admin());
create policy "churches_admin_update" on public.churches
  for update using (public.is_admin()) with check (public.is_admin());
create policy "churches_super_admin_delete" on public.churches
  for delete using (public.is_super_admin());

-- events --------------------------------------------------------------------------------
create policy "events_public_read_active" on public.events
  for select using (active = true or public.is_admin());

create policy "events_admin_write" on public.events
  for insert with check (public.is_admin());
create policy "events_admin_update" on public.events
  for update using (public.is_admin()) with check (public.is_admin());
create policy "events_super_admin_delete" on public.events
  for delete using (public.is_super_admin());

-- pages ---------------------------------------------------------------------------------
-- Pages are not soft-deletable the same way churches/events are (per spec),
-- so all pages are publicly readable regardless of menu_visible — a hidden
-- page is just not linked from navigation, not access-restricted.
create policy "pages_public_read" on public.pages
  for select using (true);

create policy "pages_admin_write" on public.pages
  for insert with check (public.is_admin());
create policy "pages_admin_update" on public.pages
  for update using (public.is_admin()) with check (public.is_admin());
create policy "pages_super_admin_delete" on public.pages
  for delete using (public.is_super_admin());

-- hero_images -----------------------------------------------------------------------------
create policy "hero_images_public_read" on public.hero_images
  for select using (true);

create policy "hero_images_admin_insert" on public.hero_images
  for insert with check (public.is_admin());
-- Append-only: no update policy. Super Admins may prune old history rows.
create policy "hero_images_super_admin_delete" on public.hero_images
  for delete using (public.is_super_admin());

-- site_settings ---------------------------------------------------------------------------
create policy "site_settings_public_read" on public.site_settings
  for select using (true);

create policy "site_settings_admin_write" on public.site_settings
  for insert with check (public.is_admin());
create policy "site_settings_admin_update" on public.site_settings
  for update using (public.is_admin()) with check (public.is_admin());
create policy "site_settings_super_admin_delete" on public.site_settings
  for delete using (public.is_super_admin());

-- admin_users ----------------------------------------------------------------------------
-- A user may always see their own row (so the dashboard can tell what role
-- the signed-in user has); Super Admins can see everyone.
create policy "admin_users_self_or_super_admin_read" on public.admin_users
  for select using (id = auth.uid() or public.is_super_admin());

create policy "admin_users_super_admin_insert" on public.admin_users
  for insert with check (public.is_super_admin());
create policy "admin_users_super_admin_update" on public.admin_users
  for update using (public.is_super_admin()) with check (public.is_super_admin());
create policy "admin_users_super_admin_delete" on public.admin_users
  for delete using (public.is_super_admin());

-- History tables ---------------------------------------------------------------------------
-- Read-only from the client's perspective (rows are written exclusively by
-- the triggers in 20260930190400_history_triggers.sql, which run as
-- security definer and so bypass these policies on insert).
create policy "churches_history_admin_read" on public.churches_history
  for select using (public.is_admin());

create policy "profile_history_admin_read" on public.profile_history
  for select using (public.is_admin());

create policy "events_history_admin_read" on public.events_history
  for select using (public.is_admin());

create policy "pages_history_admin_read" on public.pages_history
  for select using (public.is_admin());

create policy "settings_history_admin_read" on public.settings_history
  for select using (public.is_admin());

-- admin_audit_log is a security record: Super Admin read-only, per spec.
create policy "admin_audit_log_super_admin_read" on public.admin_audit_log
  for select using (public.is_super_admin());

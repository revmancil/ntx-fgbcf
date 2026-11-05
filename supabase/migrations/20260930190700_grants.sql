-- Tables created through raw SQL (as every migration here is) do NOT get
-- Supabase's default anon/authenticated grants automatically — that only
-- happens when a table is created through the Supabase Dashboard's Table
-- Editor UI. Without this, the RLS policies in
-- 20260930190500_rls_policies.sql are correct but never even get evaluated:
-- Postgres checks table-level GRANTs first, and a role with no GRANT at all
-- gets "permission denied for table ..." before RLS has any say. This
-- migration adds the baseline grants; the policies already in place
-- continue to do all the real row-level restriction.

grant usage on schema public to anon, authenticated;

-- Publicly readable content: anon gets read-only, authenticated gets full
-- CRUD (RLS policies still gate writes to admin roles).
grant select on
  public.pastors,
  public.directors,
  public.churches,
  public.events,
  public.pages,
  public.hero_images,
  public.site_settings
to anon;

grant select, insert, update, delete on
  public.pastors,
  public.directors,
  public.churches,
  public.events,
  public.pages,
  public.site_settings
to authenticated;

-- hero_images is insert/select/delete only (append-only design, no update
-- policy exists for it).
grant select, insert, delete on public.hero_images to authenticated;

-- admin_users and every history/audit table: signed-in users only, never
-- anon. RLS further restricts these to admins (and, for admin_users, each
-- user's own row).
grant select, insert, update, delete on public.admin_users to authenticated;
grant select on
  public.churches_history,
  public.profile_history,
  public.events_history,
  public.pages_history,
  public.settings_history,
  public.admin_audit_log
to authenticated;

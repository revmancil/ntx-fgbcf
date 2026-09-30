-- These tables are populated exclusively by the triggers defined in
-- 20260930190400_history_triggers.sql — application code never writes to them
-- directly. Each row is a full snapshot of the parent row immediately before
-- an update or delete, which is what lets the admin dashboard render a
-- "restore this version" action.

create table public.churches_history (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null,
  name text,
  location text,
  county public.county_t,
  pastor_id uuid,
  director_id uuid,
  image_url text,
  active boolean,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create index churches_history_church_id_idx on public.churches_history(church_id, changed_at desc);

-- Shared by both pastors and directors, distinguished by profile_type, so the
-- Pastor & Director Management screen can query one table for either.
create table public.profile_history (
  id uuid primary key default gen_random_uuid(),
  profile_type text not null check (profile_type in ('pastor', 'director')),
  profile_id uuid not null,
  name text,
  bio text,
  image_url text,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create index profile_history_profile_idx on public.profile_history(profile_type, profile_id, changed_at desc);

create table public.events_history (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  title text,
  description text,
  date timestamptz,
  location text,
  image_url text,
  active boolean,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create index events_history_event_id_idx on public.events_history(event_id, changed_at desc);

create table public.pages_history (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null,
  slug text,
  title text,
  content jsonb,
  hero_image_url text,
  menu_visible boolean,
  nav_order integer,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create index pages_history_page_id_idx on public.pages_history(page_id, changed_at desc);

-- Lightweight generic log (field-level, not full-row snapshots) for
-- site_settings key/value changes and for page nav/menu_visible toggles, per
-- the spec's note that these are logged "alongside site_settings changes"
-- rather than needing the heavier per-table history above.
create table public.settings_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('site_settings', 'page_nav')),
  entity_id text not null,
  field text not null,
  old_value text,
  new_value text,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create index settings_history_entity_idx on public.settings_history(entity_type, entity_id, changed_at desc);

-- Security-relevant admin actions (role grants/revocations, invites). This log
-- is intentionally not user-rollback-able — see admin-spec.md Authentication
-- & Permissions section.
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_user_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_actor_idx on public.admin_audit_log(actor_id, created_at desc);

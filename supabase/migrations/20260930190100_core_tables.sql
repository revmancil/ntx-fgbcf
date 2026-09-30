-- pastors ---------------------------------------------------------------------
create table public.pastors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pastors_set_updated_at
  before update on public.pastors
  for each row execute function public.set_updated_at();

-- directors (State Ministry Directors) -----------------------------------------
create table public.directors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger directors_set_updated_at
  before update on public.directors
  for each row execute function public.set_updated_at();

-- churches ----------------------------------------------------------------------
create table public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  county public.county_t not null,
  pastor_id uuid references public.pastors(id) on delete set null,
  director_id uuid references public.directors(id) on delete set null,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index churches_county_idx on public.churches(county);
create index churches_active_idx on public.churches(active);
create index churches_pastor_id_idx on public.churches(pastor_id);
create index churches_director_id_idx on public.churches(director_id);

create trigger churches_set_updated_at
  before update on public.churches
  for each row execute function public.set_updated_at();

-- events --------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date timestamptz not null,
  location text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_date_idx on public.events(date);
create index events_active_idx on public.events(active);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- pages ---------------------------------------------------------------------------
-- nav_order supports the Menu Visibility Controls drag-and-drop reorder feature.
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content jsonb not null default '[]'::jsonb,
  hero_image_url text,
  menu_visible boolean not null default true,
  nav_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pages_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint pages_slug_not_reserved check (slug not in ('admin', 'api', 'login'))
);

create index pages_menu_visible_idx on public.pages(menu_visible);

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

-- hero_images ---------------------------------------------------------------------
-- Append-only history of hero images per page. pages.hero_image_url always
-- mirrors the most recent row here for fast public reads; this table is what
-- the Hero Image Management "restore a previous image" feature reads from.
create table public.hero_images (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null references public.pages(slug) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

create index hero_images_page_slug_idx on public.hero_images(page_slug, created_at desc);

-- site_settings ---------------------------------------------------------------------
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

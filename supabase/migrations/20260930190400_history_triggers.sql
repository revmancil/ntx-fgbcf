-- churches ---------------------------------------------------------------------
create or replace function public.log_churches_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.churches_history
    (church_id, name, location, county, pastor_id, director_id, image_url, active, changed_by)
  values
    (old.id, old.name, old.location, old.county, old.pastor_id, old.director_id, old.image_url, old.active, auth.uid());
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger churches_history_on_update
  before update on public.churches
  for each row execute function public.log_churches_history();

create trigger churches_history_on_delete
  before delete on public.churches
  for each row execute function public.log_churches_history();

-- pastors & directors (shared profile_history) -----------------------------------
create or replace function public.log_profile_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile_history (profile_type, profile_id, name, bio, image_url, changed_by)
  values (tg_argv[0], old.id, old.name, old.bio, old.image_url, auth.uid());
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger pastors_history_on_update
  before update on public.pastors
  for each row execute function public.log_profile_history('pastor');

create trigger pastors_history_on_delete
  before delete on public.pastors
  for each row execute function public.log_profile_history('pastor');

create trigger directors_history_on_update
  before update on public.directors
  for each row execute function public.log_profile_history('director');

create trigger directors_history_on_delete
  before delete on public.directors
  for each row execute function public.log_profile_history('director');

-- events ---------------------------------------------------------------------------
create or replace function public.log_events_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.events_history
    (event_id, title, description, date, location, image_url, active, changed_by)
  values
    (old.id, old.title, old.description, old.date, old.location, old.image_url, old.active, auth.uid());
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger events_history_on_update
  before update on public.events
  for each row execute function public.log_events_history();

create trigger events_history_on_delete
  before delete on public.events
  for each row execute function public.log_events_history();

-- pages (full content snapshot) -----------------------------------------------------
create or replace function public.log_pages_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pages_history
    (page_id, slug, title, content, hero_image_url, menu_visible, nav_order, changed_by)
  values
    (old.id, old.slug, old.title, old.content, old.hero_image_url, old.menu_visible, old.nav_order, auth.uid());

  -- Menu visibility/order changes are additionally logged to the lightweight
  -- settings_history log, per the spec.
  if tg_op = 'UPDATE' then
    if new.menu_visible is distinct from old.menu_visible then
      insert into public.settings_history (entity_type, entity_id, field, old_value, new_value, changed_by)
      values ('page_nav', old.id::text, 'menu_visible', old.menu_visible::text, new.menu_visible::text, auth.uid());
    end if;
    if new.nav_order is distinct from old.nav_order then
      insert into public.settings_history (entity_type, entity_id, field, old_value, new_value, changed_by)
      values ('page_nav', old.id::text, 'nav_order', old.nav_order::text, new.nav_order::text, auth.uid());
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger pages_history_on_update
  before update on public.pages
  for each row execute function public.log_pages_history();

create trigger pages_history_on_delete
  before delete on public.pages
  for each row execute function public.log_pages_history();

-- Enforce: the home page (slug = 'home') can never be hidden from the menu,
-- and at least one page must always remain menu_visible.
create or replace function public.enforce_menu_visibility_rules()
returns trigger
language plpgsql
as $$
declare
  remaining_visible integer;
begin
  if new.slug = 'home' and new.menu_visible = false then
    raise exception 'The home page cannot be hidden from the menu';
  end if;

  if old.menu_visible = true and new.menu_visible = false then
    select count(*) into remaining_visible
    from public.pages
    where menu_visible = true and id <> old.id;

    if remaining_visible = 0 then
      raise exception 'At least one page must remain visible in the menu';
    end if;
  end if;

  return new;
end;
$$;

create trigger pages_enforce_menu_visibility
  before update on public.pages
  for each row execute function public.enforce_menu_visibility_rules();

-- site_settings (field-level log) -----------------------------------------------------
create or replace function public.log_site_settings_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.settings_history (entity_type, entity_id, field, old_value, new_value, changed_by)
  values ('site_settings', old.key, 'value', old.value, new.value, auth.uid());
  return new;
end;
$$;

create trigger site_settings_history_on_update
  before update on public.site_settings
  for each row execute function public.log_site_settings_history();

-- Updates the history-logging triggers from
-- 20260930190400_history_triggers.sql to also snapshot the new columns
-- added in 20261105140000_public_site_fields.sql. Uses CREATE OR REPLACE
-- rather than editing that earlier migration file directly, since this is
-- an already-applied, already-deployed project — the fix has to arrive as
-- a new migration.

create or replace function public.log_churches_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.churches_history
    (church_id, name, location, county, pastor_id, director_id, image_url, active,
     aka, leader_title, leader_role, website, is_district_overseer, changed_by)
  values
    (old.id, old.name, old.location, old.county, old.pastor_id, old.director_id, old.image_url, old.active,
     old.aka, old.leader_title, old.leader_role, old.website, old.is_district_overseer, auth.uid());
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.log_events_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.events_history
    (event_id, title, description, date, location, image_url, active,
     subtitle, host, date_text, end_date, event_time, address, link_url, link_text, tag, featured, orientation, notes, changed_by)
  values
    (old.id, old.title, old.description, old.date, old.location, old.image_url, old.active,
     old.subtitle, old.host, old.date_text, old.end_date, old.event_time, old.address, old.link_url, old.link_text, old.tag, old.featured, old.orientation, old.notes, auth.uid());
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

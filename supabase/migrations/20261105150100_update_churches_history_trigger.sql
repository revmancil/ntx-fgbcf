-- Updates log_churches_history() to also snapshot churches.featured,
-- added in 20261105150000_churches_featured.sql.

create or replace function public.log_churches_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.churches_history
    (church_id, name, location, county, pastor_id, director_id, image_url, active,
     aka, city, leader_title, leader_role, website, is_district_overseer, featured, changed_by)
  values
    (old.id, old.name, old.location, old.county, old.pastor_id, old.director_id, old.image_url, old.active,
     old.aka, old.city, old.leader_title, old.leader_role, old.website, old.is_district_overseer, old.featured, auth.uid());
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

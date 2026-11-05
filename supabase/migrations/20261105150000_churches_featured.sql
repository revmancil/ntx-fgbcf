-- Adds an admin-controlled "featured" flag to churches, so the home
-- page's featured-church grid can be hand-picked rather than inferred
-- from leader_role/is_district_overseer (which shrinks the grid whenever
-- a district seat is vacant).

alter table public.churches
  add column featured boolean not null default false;

comment on column public.churches.featured is 'Shown in the home page''s featured-church grid. Admin-set; independent of is_district_overseer.';

alter table public.churches_history
  add column featured boolean;

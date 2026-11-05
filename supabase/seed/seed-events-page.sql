-- One-time seed: registers the new events.html page in public.pages so it
-- gets the same hero-image/menu-visibility admin controls as every other
-- page. nav_order only affects ordering within the admin's own Pages list
-- (the public nav's order is fixed in each page's HTML), so the existing
-- faq/contact/giving rows are bumped up by one to keep that list sensible
-- without colliding on the same number.
update public.pages set nav_order = nav_order + 1 where slug in ('faq', 'contact', 'giving');

insert into public.pages (slug, title, menu_visible, nav_order) values
  ('events', 'Events', true, 5)
on conflict (slug) do nothing;

-- One-time seed: registers the ticker_messages site setting with the same
-- messages already hardcoded in index.html's announcement ticker, so
-- switching it over to the database doesn't change anything visually until
-- an admin edits it from Site Settings. One message per line.
insert into public.site_settings (key, value) values
  ('ticker_messages', 'PROPEL 10 — Building What Matters • Oct 13–15, 2026 • Atlanta, GA • Register at fullgospelbaptist.org
Endless Love Marriage Retreat • Sept 11–12, 2026 • Aloft DFW Airport North, Irving
ROAR — RED Women’s Conference • Oct 10, 2026 • Hurst Conference Center
Save the Date: Leadership Huddle 2027 • Saturday, January 30, 2027 • The Jubilee Church, DeSoto
Where Everybody Is Somebody')
on conflict (key) do nothing;

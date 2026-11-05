-- Extends churches/events with fields the public static site actually
-- displays but the original admin-spec.md schema didn't capture — found
-- while wiring the public site to read from this database instead of
-- js/churches-data.js and js/events-data.js. Admin-editable going forward
-- via the Churches and Events screens.

alter table public.churches
  add column aka text,
  add column leader_title text,
  add column leader_role text,
  add column website text,
  add column is_district_overseer boolean not null default false;

comment on column public.churches.leader_title is 'e.g. Bishop, Pastor, Co-Pastor, Elder — the title shown before the leader''s name';
comment on column public.churches.leader_role is 'e.g. State Bishop, Pastor, Tarrant District Overseer, Pulpit Vacant';
comment on column public.churches.is_district_overseer is 'At most one true per county in practice; a county with none shows a Vacant overseer banner on the public site';

alter table public.events
  add column subtitle text,
  add column host text,
  add column date_text text,
  add column end_date timestamptz,
  add column event_time text,
  add column address text,
  add column link_url text,
  add column link_text text,
  add column tag text,
  add column featured boolean not null default false,
  add column orientation text,
  add column notes text;

comment on column public.events.date_text is 'Human-readable date shown on the card, e.g. "October 13-15, 2026" — kept separate from the sortable `date`/`end_date` timestamps';
comment on column public.events.orientation is '''landscape'' for wide flyers shown uncropped; null/omitted for portrait';

-- History tables need the matching columns too, since the existing
-- triggers in 20260930190400_history_triggers.sql snapshot every column
-- of the row they're logging.
alter table public.churches_history
  add column aka text,
  add column leader_title text,
  add column leader_role text,
  add column website text,
  add column is_district_overseer boolean;

alter table public.events_history
  add column subtitle text,
  add column host text,
  add column date_text text,
  add column end_date timestamptz,
  add column event_time text,
  add column address text,
  add column link_url text,
  add column link_text text,
  add column tag text,
  add column featured boolean,
  add column orientation text,
  add column notes text;

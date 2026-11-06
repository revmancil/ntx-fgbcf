-- Same class of bug as 20260930190700_grants.sql, this time for
-- service_role: tables created through raw SQL (every migration here) only
-- pick up Supabase's default grants for roles that were explicitly set up
-- with ALTER DEFAULT PRIVILEGES at the time the table is created, and this
-- project's tables apparently didn't inherit that for service_role either.
-- service_role bypasses Row Level Security (it has the BYPASSRLS role
-- attribute), but that doesn't exempt it from ordinary GRANT checks —
-- without these, any service_role-authenticated request (e.g. the
-- invite-admin Edge Function inserting into admin_users) fails with
-- "permission denied for schema public" before RLS is ever evaluated.
--
-- Includes ALTER DEFAULT PRIVILEGES so future tables created by this role
-- grant service_role access automatically, instead of needing another
-- migration like this one every time.

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;

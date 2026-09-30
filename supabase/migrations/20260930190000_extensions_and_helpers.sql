-- Extensions ---------------------------------------------------------------
create extension if not exists pgcrypto;

-- Shared enums ---------------------------------------------------------------
create type public.county_t as enum ('Dallas', 'Tarrant');
create type public.admin_role_t as enum ('super_admin', 'editor', 'viewer');

-- updated_at trigger helper ---------------------------------------------------
-- Attached to every table that has an `updated_at` column so callers never
-- have to remember to set it themselves.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- admin_users lookup helpers ---------------------------------------------------
-- Defined here (ahead of the admin_users table) as forward declarations is not
-- possible in Postgres, so the real bodies live in
-- 20260930190300_admin_users_and_audit.sql once admin_users exists. This file
-- only sets up the extension and the updated_at trigger, which have no
-- dependency on admin_users.

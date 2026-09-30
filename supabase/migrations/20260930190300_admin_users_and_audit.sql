-- admin_users maps a Supabase Auth user (auth.users.id) to a dashboard role.
-- id is *not* auto-generated: it is always set equal to the corresponding
-- auth.users.id, which is what lets policies check auth.uid() against this
-- table's primary key directly.
create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.admin_role_t not null default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

-- Auth helper functions -------------------------------------------------------
-- security definer + a hardcoded search_path so these are safe to call from
-- RLS policies regardless of the caller's role/search_path.

create or replace function public.current_admin_role()
returns public.admin_role_t
language sql
stable
security definer
set search_path = public
as $$
  select role from public.admin_users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid() and role in ('super_admin', 'editor')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Guard against demoting/removing the last remaining Super Admin, per the
-- spec's validation rule under Authentication & Permissions.
create or replace function public.prevent_last_super_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_super_admins integer;
begin
  if (tg_op = 'DELETE' and old.role = 'super_admin')
     or (tg_op = 'UPDATE' and old.role = 'super_admin' and new.role <> 'super_admin') then
    select count(*) into remaining_super_admins
    from public.admin_users
    where role = 'super_admin' and id <> old.id;

    if remaining_super_admins = 0 then
      raise exception 'Cannot remove or demote the last remaining Super Admin';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger admin_users_prevent_last_super_admin
  before update or delete on public.admin_users
  for each row execute function public.prevent_last_super_admin_removal();

-- Every insert/update/delete on admin_users is itself a security-relevant
-- event, so mirror it into admin_audit_log automatically.
create or replace function public.log_admin_users_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.admin_audit_log (actor_id, action, target_user_id, details)
    values (auth.uid(), 'admin_user_invited', new.id, jsonb_build_object('email', new.email, 'role', new.role));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.admin_audit_log (actor_id, action, target_user_id, details)
    values (auth.uid(), 'admin_user_role_changed', new.id,
      jsonb_build_object('old_role', old.role, 'new_role', new.role));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.admin_audit_log (actor_id, action, target_user_id, details)
    values (auth.uid(), 'admin_user_removed', old.id, jsonb_build_object('email', old.email, 'role', old.role));
    return old;
  end if;
  return null;
end;
$$;

create trigger admin_users_audit
  after insert or update or delete on public.admin_users
  for each row execute function public.log_admin_users_change();

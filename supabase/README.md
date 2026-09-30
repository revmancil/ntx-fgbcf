# Supabase Schema — NTX FGBCF Admin Dashboard

Implements the schema defined in `admin-spec.md`. Requires the
[Supabase CLI](https://supabase.com/docs/guides/cli).

## Layout

- `migrations/` — schema migrations, applied in filename order:
  1. `20260930190000_extensions_and_helpers.sql` — extensions, enums, the shared `updated_at` trigger
  2. `20260930190100_core_tables.sql` — `pastors`, `directors`, `churches`, `events`, `pages`, `hero_images`, `site_settings`
  3. `20260930190200_history_tables.sql` — append-only audit/versioning tables
  4. `20260930190300_admin_users_and_audit.sql` — `admin_users`, role-check helper functions, admin audit logging
  5. `20260930190400_history_triggers.sql` — triggers that populate history tables automatically on update/delete
  6. `20260930190500_rls_policies.sql` — Row Level Security policies for every table
  7. `20260930190600_storage_buckets.sql` — the six Storage buckets and their access policies
- `seed.sql` — real `site_settings` and `pages` rows matching the current live site
- `seed/migrate-churches-data.mjs` — generates `seed/data-import.sql` from the site's actual `js/churches-data.js`, so the real churches/pastors and the State Ministry Directors (from `leadership.html`) can be imported without hand-transcription
- `config.toml` — local dev config for `supabase start`

## Applying locally

```bash
supabase start
supabase db reset   # applies all migrations, then seed.sql
node supabase/seed/migrate-churches-data.mjs
psql "$(supabase status -o json | jq -r '.DB_URL')" -f supabase/seed/data-import.sql
```

(Adjust the last command's path/connection string to wherever your local
Postgres is listening — `supabase status` prints it.)

## Applying to a hosted Supabase project

```bash
supabase link --project-ref <your-project-ref>
supabase db push                       # applies migrations/
psql "$SUPABASE_DB_URL" -f seed.sql
node seed/migrate-churches-data.mjs
psql "$SUPABASE_DB_URL" -f seed/data-import.sql
```

## After the first real admin user signs up

`admin_users` has no rows by default, so no one can write to any table yet.
Promote the first Supabase Auth user to Super Admin directly in the SQL
editor:

```sql
insert into public.admin_users (id, email, role)
values ('<the auth.users.id of the account>', '<their email>', 'super_admin');
```

Every subsequent admin user can then be invited from inside the dashboard
itself (Authentication & Permissions, per `admin-spec.md`).

## Regenerating the church/pastor/director data import

`js/churches-data.js` remains the source of truth until the admin dashboard
is live. Whenever it changes, re-run:

```bash
node supabase/seed/migrate-churches-data.mjs
```

This overwrites `supabase/seed/data-import.sql`; review the diff, then
re-apply it. The script generates deterministic ids (UUIDv5 from each
record's existing string id/name), so re-applying is idempotent and will
update existing rows rather than duplicate them.

The six State Ministry Directors are not in `churches-data.js` (they're
static markup in `leadership.html`), so they're listed by hand inside the
script itself, transcribed from the live page. Update that list in the
script if the roster on `leadership.html` changes.

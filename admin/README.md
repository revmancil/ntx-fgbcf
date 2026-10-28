# NTX FGBCF Admin Portal

A React + TypeScript + Vite single-page app implementing the admin
dashboard defined in `admin-spec.md`. It talks directly to Supabase
(Auth, Database, Storage) via `@supabase/supabase-js` — there is no
custom backend server; all authorization is enforced by the Row Level
Security policies in `supabase/migrations/`.

## Local development

```bash
cd admin
npm install
cp .env.example .env   # fill in your Supabase project's URL + anon key
npm run dev
```

Without a real Supabase project configured, the app still renders (it
shows a "Supabase not configured" message instead of crashing), but
nothing will actually load or save.

## Building

```bash
npm run build    # outputs to admin/dist, base path /admin/
npm run preview  # serve the production build locally
```

The Vite config sets `base: '/admin/'` so the build is meant to be
deployed as a subpath of the public site (`ntxfullgospel.org/admin/`),
not at its own domain root.

## Deploying alongside the public static site

The simplest approach: add a build step to the existing GitHub Actions
Pages workflow (`.github/workflows/pages.yml`) that runs `npm ci && npm
run build` inside `admin/` and copies `admin/dist/` into the root
artifact's `admin/` folder before the `actions/upload-pages-artifact`
step — so the deployed site serves the public pages at `/` and this SPA
at `/admin/` from the same GitHub Pages deployment, with the Supabase
URL/anon key injected as repository secrets (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`) at build time.

The Supabase anon key is safe to expose client-side by design — it has
no access beyond what the RLS policies in `supabase/migrations/` grant
it. Never put the service role key anywhere in this app; that's only
used server-side in `supabase/functions/invite-admin`.

## What's implemented

- Supabase Auth email/password login, with route protection based on
  the signed-in user's role from `admin_users`
- Dashboard with record counts
- Churches: list, county filter, search, bulk county reassignment,
  create/edit (with photo upload), active/inactive toggle,
  super-admin-only delete, full history with restore
- Pastors & Directors: shared card-grid UI, create/edit (with photo
  upload), delete blocked while still assigned to a church, history
  with restore
- Events: upcoming/past split, active-only filter, create/edit (with
  flyer upload), history with restore
- Pages & Menu: create pages, a block-based content editor
  (heading/paragraph/image/button/accordion), hero image upload,
  menu visibility toggle (home page and the last visible page are
  protected from being hidden), drag-free up/down reordering, history
  with restore
- Hero Images: per-page thumbnail grid, upload, and a full restorable
  history strip
- Site Settings: key/value editor for branding/contact/etc.
- Admin Users (Super Admin only): role changes, access revocation, and
  an invite flow that calls the `invite-admin` Edge Function

## What's intentionally out of scope for this first pass

- Drag-and-drop page reordering (up/down buttons instead)
- A calendar view for events (list view only)
- Rich-text/WYSIWYG editing for page blocks (plain textareas)
- Code-splitting the bundle (it's an internal tool, not the public
  site — the ~520KB bundle warning from `vite build` is fine here)

# NTX FGBCF Admin Dashboard Specification

## 1. Purpose

This document specifies an Admin Dashboard for the North Texas Full Gospel Baptist Church Fellowship (NTX FGBCF) website. The dashboard replaces manual code edits with a authenticated, database-backed content management system covering:

- Editing text throughout the website
- Updating pastor and director profiles
- Adding, editing, and deleting churches
- Assigning churches to Dallas or Tarrant County
- Updating hero section images on all pages
- Adding, editing, and deleting events
- Adding, editing, and deleting pages
- Controlling whether pages appear in the navigation menu or remain hidden
- Updating church names, locations, and descriptions
- Managing global site settings (branding, contact info, etc.)

## 2. Required Technology

The Admin Dashboard requires:

- **Supabase Database** (Postgres) — the system of record for all editable content
- **Supabase Storage** — hosts all uploaded images (hero images, pastor/director photos, church photos, event flyers)
- **Supabase Auth** — authenticates and authorizes admin users
- **Frontend Admin Panel** — a modern framework (Next.js or Astro recommended) that authenticates against Supabase Auth, reads/writes via the Supabase client, and renders CRUD interfaces for every content type below

The public-facing site is rebuilt to fetch its content from Supabase at build time or request time, rather than from hardcoded HTML/JS files.

### Why GitHub Pages Alone Cannot Support Admin Editing

- GitHub Pages serves static files only; it has no server-side runtime, no database, and no way to execute authenticated write operations.
- The current site's content (church directory, leadership bios, page copy) lives in static HTML and in `js/churches-data.js` — any change requires a code commit, a build, and a deploy. There is no mechanism for a non-technical admin to make a change without a developer.
- GitHub Pages has no built-in authentication layer, so there is no safe way to gate who can edit content.
- There is no persistent, queryable storage — file-based JS data objects cannot support relational lookups (e.g., "all churches in Tarrant County with an active pastor"), audit trails, or concurrent edits.
- Image uploads have no server to receive them; every image currently must be committed to the `images/` directory by hand.
- Supabase supplies the missing pieces (database, storage, auth) that a static host structurally cannot provide, while the public site can still be statically generated/exported and deployed to GitHub Pages (or a comparable static host) from that data.

## 3. Database Schema Requirements

All tables use Postgres `uuid` primary keys (`gen_random_uuid()`) unless noted, and `created_at` / `updated_at` timestamp columns on every table.

### `churches`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | text | Required |
| `location` | text | Street address / city |
| `county` | text | Enum: `Dallas`, `Tarrant` |
| `pastor_id` | uuid | Foreign key → `pastors.id`, nullable |
| `director_id` | uuid | Foreign key → `directors.id`, nullable |
| `image_url` | text | Storage URL |
| `active` | boolean | Default `true`; inactive churches are hidden from the public directory |

### `pastors`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | text | Required |
| `bio` | text | Rich text / Markdown |
| `image_url` | text | Storage URL |

### `directors`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | text | Required |
| `bio` | text | Rich text / Markdown |
| `image_url` | text | Storage URL |

### `events`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `title` | text | Required |
| `description` | text | Rich text / Markdown |
| `date` | timestamptz | Required |
| `location` | text | Venue name / address |
| `image_url` | text | Flyer image, Storage URL |
| `active` | boolean | Default `true`; inactive events are hidden from the public events list |

### `pages`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `slug` | text | Unique, URL-safe (e.g. `about`, `faq`) |
| `title` | text | Required |
| `content` | jsonb | Structured block content (see Page Management) |
| `hero_image_url` | text | Storage URL, nullable |
| `menu_visible` | boolean | Default `true`; controls navigation menu inclusion |

### `hero_images`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `page_slug` | text | Foreign key → `pages.slug` |
| `image_url` | text | Storage URL |

> Note: `pages.hero_image_url` stores the *current* hero image for fast reads; `hero_images` stores the full history of hero images per page for rollback (see Section 5, Versioning).

### `site_settings`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `key` | text | Unique (e.g. `site_name`, `contact_email`, `contact_phone`, `primary_color`, `logo_url`, `social_facebook_url`) |
| `value` | text | Setting value; stored as text, parsed by type on read |

## 4. Storage Buckets

| Bucket | Purpose |
|---|---|
| `hero-images/` | Hero background images for all pages |
| `pastors/` | Pastor profile photos |
| `directors/` | State Ministry Director profile photos |
| `churches/` | Church photos used in the directory |
| `events/` | Event flyer images |
| `pages/` | Inline images used within page body content |

All buckets are public-read (so the static site can serve images without authentication) and write-restricted to authenticated admin users via Storage policies.

## 5. Admin Dashboard Features

### Church Management

- **UI layout:** A table/list view of all churches (name, county, pastor, active status) with search and county filter tabs (All / Dallas / Tarrant). Selecting a row opens an edit form in a side panel or dedicated route.
- **CRUD operations:** Create new church, edit existing fields, soft-delete via the `active` toggle, hard-delete with a confirmation dialog (only available to Super Admins).
- **Validation rules:** `name` and `county` required; `county` restricted to `Dallas` or `Tarrant`; `pastor_id`/`director_id` must reference existing records or be null; duplicate church names trigger a non-blocking warning, not a hard error.
- **Image upload workflow:** Drag-and-drop or file picker uploads to the `churches/` bucket; image is resized/compressed client-side before upload; the resulting public URL is written to `churches.image_url`; a preview is shown before save.
- **Propagation to public site:** Saving triggers a rebuild/revalidation of the public Churches directory page (via on-demand ISR/rebuild webhook, see Section 6) so the change appears without a manual redeploy.
- **Versioning/rollback:** Every update writes a row to a `churches_history` audit table (previous values + timestamp + editor id); admins can view history per church and restore a prior version, which writes a new current row rather than mutating history.

### Pastor & Director Management

- **UI layout:** Two parallel sections (Pastors, Directors) sharing one component, each a card grid showing photo, name, and an "assigned to N churches" count.
- **CRUD operations:** Create/edit/delete profile (name, bio, photo). Deleting a pastor/director who is still assigned to a church is blocked until the admin reassigns or clears those churches.
- **Validation rules:** `name` required; `bio` limited to a sane max length (e.g. 5,000 characters) rendered as Markdown; image required before publishing a new profile (fallback to a placeholder avatar otherwise).
- **Image upload workflow:** Same pattern as Church Management, targeting the `pastors/` or `directors/` bucket respectively.
- **Propagation to public site:** Updates revalidate the Leadership page and any church directory entries referencing that person.
- **Versioning/rollback:** Bio and photo changes are tracked in a `profile_history` table keyed by profile type + id, with restore support.

### Event Management

- **UI layout:** Chronological list (upcoming first, past events collapsed) with an "Active only" toggle and a calendar-view option.
- **CRUD operations:** Create/edit/delete events; `active` toggle to unpublish without deleting (e.g., postponed events).
- **Validation rules:** `title`, `date`, and `location` required; `date` must be a valid future or past timestamp (no hard restriction, to allow archiving past events); `description` optional but recommended via a UI nudge.
- **Image upload workflow:** Flyer upload to `events/` bucket, with a recommended-dimensions hint in the UI matching the site's flyer card aspect ratio.
- **Propagation to public site:** Saving revalidates the Events listing and the Home page's featured-events section.
- **Versioning/rollback:** `events_history` table records prior states; deleted events are retained for 90 days in a trash view before permanent purge.

### Page Management

- **UI layout:** A list of all pages (slug, title, menu-visible status) plus a "New Page" action. Editing opens a block-based content editor (rich text blocks: heading, paragraph, image, button/CTA, accordion — matching the site's existing section patterns).
- **CRUD operations:** Create new page (auto-generates a unique slug from the title, editable before first save), edit content blocks, delete page (blocked if the page is referenced by the primary navigation and still `menu_visible`; admin must hide it from the menu first).
- **Validation rules:** `slug` must be unique, lowercase, URL-safe (`[a-z0-9-]+`); `title` required; reserved slugs (`admin`, `api`, `login`) are disallowed.
- **Image upload workflow:** Hero image upload uses the shared Hero Image Management flow (below); inline body images upload to the `pages/` bucket and are inserted as image blocks.
- **Propagation to public site:** Saving a page revalidates that page's route; publishing a brand-new page adds it to the site's route table and, if `menu_visible` is true, to the navigation.
- **Versioning/rollback:** Every save writes the full prior `content` jsonb blob to a `pages_history` table; admins can preview any historical version side-by-side with the current one and roll back with one click.

### Hero Image Management

- **UI layout:** A dedicated panel listing every page with its current hero image thumbnail; clicking a thumbnail opens the upload/replace dialog and a history strip of previous hero images for that page.
- **CRUD operations:** Upload a new hero image (writes a new `hero_images` row and updates `pages.hero_image_url`); restore a previous hero image from history (same effect, no re-upload needed).
- **Validation rules:** Enforced minimum resolution (e.g., 1600×900) with a warning (not a hard block) if the uploaded image is smaller; accepted formats limited to JPEG/PNG/WebP.
- **Image upload workflow:** Client-side crop/preview tool constrained to the site's hero aspect ratio before upload to `hero-images/`.
- **Propagation to public site:** Immediate revalidation of the affected page only.
- **Versioning/rollback:** Full history retained indefinitely in `hero_images`, since these rows are the append-only versioning mechanism for this feature.

### Menu Visibility Controls

- **UI layout:** A drag-and-drop navigation editor showing every page as a row with a visibility toggle and a drag handle for reordering.
- **CRUD operations:** Toggle `menu_visible` per page; reorder pages within the menu (requires an additional `nav_order` integer column on `pages`, or a separate `nav_order` table if multiple menus are needed later).
- **Validation rules:** At least one page must remain visible and designated as the home page; the home page's visibility cannot be toggled off.
- **Propagation to public site:** Navigation changes revalidate the shared header/footer component across all pages (a global revalidation, since nav appears site-wide).
- **Versioning/rollback:** Menu order/visibility changes are logged in a lightweight `settings_history` alongside `site_settings` changes; no dedicated rollback UI is required beyond re-toggling manually, given the low complexity of this data.

### Global Text Editing

- **UI layout:** A searchable list of editable text regions per page (derived from the page's content blocks), reached either through the Page Management block editor directly, or a flattened "find text across the site" search view for quick typo fixes.
- **CRUD operations:** Inline edit of any text block's content; changes save to the owning page's `content` jsonb.
- **Validation rules:** No length restrictions on body text beyond reasonable database limits; required fields (page title, block headings where applicable) cannot be saved empty.
- **Propagation to public site:** Same as Page Management — revalidates the owning page.
- **Versioning/rollback:** Inherits Page Management's `pages_history` versioning, since text lives inside page content blocks.

### County Assignment

- **UI layout:** Part of the Church Management edit form — a required two-option selector (Dallas / Tarrant); the church list view supports filtering and bulk-reassignment (select multiple churches, apply a county to all selected).
- **CRUD operations:** Update `churches.county` individually or in bulk.
- **Validation rules:** Only `Dallas` or `Tarrant` accepted; bulk reassignment requires a confirmation step showing the count of affected churches.
- **Propagation to public site:** Revalidates the Churches directory page's county-filtered views.
- **Versioning/rollback:** Captured in `churches_history` as part of the standard church edit audit trail.

### Authentication & Permissions

- **UI layout:** A dedicated login screen (email + password, or magic link) backed by Supabase Auth; an Admin Users panel (Super Admin only) listing all admin accounts with their role.
- **Roles:**
  - **Super Admin** — full access to all CRUD operations, admin user management, global site settings, and hard-delete actions.
  - **Editor** — full access to churches, pastors, directors, events, pages, and hero images; cannot manage admin users or global site settings; cannot hard-delete (soft-delete/deactivate only).
  - **Viewer** *(optional, future)* — read-only access to the admin dashboard for reporting/oversight purposes.
- **CRUD operations:** Super Admins can invite new admin users (via Supabase Auth invite), assign roles, and revoke access.
- **Validation rules:** Email must be a valid address; role must be one of the defined enum values; an account cannot demote itself out of Super Admin if it is the last remaining Super Admin.
- **Propagation to public site:** None — this section only affects dashboard access, not public content.
- **Versioning/rollback:** Role changes and access grants/revocations are logged in an `admin_audit_log` table (actor, action, target user, timestamp) for security review; not user-rollback-able, intentionally, since this is a security record.

## 6. API Requirements

- **Access pattern:** The admin frontend communicates with Supabase directly via the Supabase JS client (`@supabase/supabase-js`), using the anon key on the client paired with Row Level Security (RLS) policies — not a custom REST layer — for all CRUD operations described above.
- **Server-side revalidation endpoint:** A single authenticated serverless function/route (e.g. `/api/revalidate`) accepts a `{ type, slug }` payload from Supabase Database Webhooks (fired on insert/update/delete to `pages`, `churches`, `events`, `pastors`, `directors`, `site_settings`) and triggers the appropriate static rebuild or on-demand revalidation for the public site.
- **Auth protection:**
  - All write operations require a valid Supabase Auth session; RLS policies check `auth.uid()` against an `admin_users` table mapping user IDs to roles.
  - Public (anonymous) reads are allowed only for `active = true` rows on `churches`, `events`, and for all `pages` rows (page content is not soft-deletable the same way).
  - The `/api/revalidate` endpoint verifies a shared secret header from Supabase Webhooks; it is not exposed to the admin frontend directly.
- **Error handling:**
  - All Supabase client calls in the admin UI wrap responses in a consistent `{ data, error }` check; errors surface as inline form errors (validation) or toast notifications (network/server errors), never silent failures.
  - Foreign-key violations (e.g., deleting a pastor still assigned to a church) return a descriptive error mapped to a friendly message rather than a raw Postgres error string.
- **Rate limiting:**
  - Supabase's built-in Auth rate limits apply to login attempts.
  - The `/api/revalidate` endpoint is rate-limited (e.g., 60 requests/minute) to prevent rebuild storms from bulk edits; rapid successive webhook calls for the same slug are debounced server-side.
- **Security rules (Row Level Security):**
  - RLS is enabled on every table.
  - `select` policies: public/anon role may `select` where `active = true` (churches, events) or unconditionally (pages, pastors, directors, site_settings, hero_images) since these are not sensitive.
  - `insert`/`update`/`delete` policies: restricted to authenticated users present in `admin_users` with role `Super Admin` or `Editor`; hard-delete operations additionally restricted to `Super Admin` only via a policy check on the role column.
  - Storage bucket policies mirror this: public `select` (read), authenticated-admin-only `insert`/`update`/`delete`.

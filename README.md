# North Texas State — Full Gospel Baptist Church Fellowship

Official-style website for the **North Texas State** of the Full Gospel Baptist Church Fellowship International (FGBCF), led by **State Bishop Gregory L. Drake** (Senior Pastor, The Jubilee Church, DeSoto, TX).

The State is organized into two districts:

| District | Overseer | Church | Spreadsheet colour |
|---|---|---|---|
| **Dallas County District** | Dallas District Overseer Billy Adkinson | Higher Mark FGBC, DeSoto | Orange |
| **Tarrant County District** | Tarrant District Overseer Elvis L. Bowman | Greater Mt. Tabor Christian Center, Fort Worth | Blue |

**State Administrator:** Cherri Rowe (shown under Bishop Drake on Leadership, in the About org chart, and on Contact).

Other titles: General Overseer Montreal Dukes (Christ Lifters Community of Faith); Pastor Gaylon Foreman (Carver Park Baptist Church).
District Overseers are flagged `featured: true` in `js/churches-data.js` and rendered as prominent banners (`overseerBannerHtml` in `js/main.js`) at the top of their district in the directory and on the Leadership page.

## 🎨 Design (v2)
Rebuilt to match the bold, high-energy feel of **fullgospelbaptist.org**:
- Dark violet/black base (`#0b0514`) with **violet → magenta → pink** gradient (`#3b0066 → #9e007e → #e0248f`) and **gold** accents (`#f5b041`)
- Heavy condensed uppercase typography: **Anton** (display), **Oswald** (headings), **Inter** (body)
- Full-bleed photographic heroes with purple/magenta duotone overlays (`images/*.jpg` — CC-licensed worship photos)
- Scrolling gold announcement ticker, spotlight "poster" tiles, gradient stats band, glowing pill buttons
- District colours: Dallas = orange `#ff9f1c`, Tarrant = blue `#35b8ff`

## ✅ Completed Features

- **Home (`index.html`)** – announcement ticker (current events), full-bleed photo hero with **welcome-video placeholder**, gradient stats band, **Spotlight**: full-width *Featured* flyer card (PROPEL 10, `featured: true`; flyer left / details right) stacked above a full-width **rotating flyer slider** (`js/events-data.js` + `js/events.js`) — auto-advances every 6s, pauses on hover/focus, prev/next arrows, dots, pause button, progress bar, swipe on touch, keyboard arrows, honours `prefers-reduced-motion`; date badges, district tags, auto "Past Event" flag, click-to-enlarge lightbox; quick-link posters (Bishop, Dallas, Tarrant), Bishop welcome, "Who We Are" pillars, district cards, featured churches, CTA.
- **Official state seal** (`images/ntx-logo.jpg`) used as the brand mark in every header and footer.
- **About (`about.html`)** – FGBCF history (founded 1994, Bishop Paul S. Morton Sr.), statement of beliefs, state org chart, district cards.
- **The Fellowship (`fellowship.html`)** – dedicated page about Full Gospel Baptist Church Fellowship International: overview, facts card, history timeline, Full Gospel distinctives, international leadership structure, ministries/departments, link to fullgospelbaptist.org. Linked from the main nav, footer, About page, and Home "Who We Are" section.
- **Leadership (`leadership.html`)** – State Bishop feature, District Overseer cards, all pastors (auto‑generated from data, sorted by last name).
- **Church Directory (`churches.html`)** – all 19 churches grouped by district with:
  - live search (church, pastor, city, county, address)
  - district filter buttons (All / Dallas County / Tarrant County)
  - Google Maps "Directions" links and church website links
  - URL parameters: `?district=dallas`, `?district=tarrant`, `?q=fort+worth`
  - deep links per church: `churches.html#church-{id}`
- **Contact (`contact.html`)** – State office info + contact form that saves to the `contact_messages` table via the RESTful Table API.
- Fully responsive (mobile hamburger nav), accessible markup, purple/gold design with Cormorant Garamond + Inter typography.

## 📂 Structure

```
index.html            Home
about.html            About the North Texas State
fellowship.html       About FGBCF International (the parent Fellowship)
leadership.html       Bishop, Overseers, Pastors
churches.html         Searchable church directory
contact.html          Contact form
css/style.css         Shared stylesheet (design system v2)
images/               ntx-logo.jpg (state seal), bishop-drake-portrait.jpg (extracted from State Conference flyer),
                      flyer-propel.jpg, flyer-leadership-huddle.jpg, flyer-endless-love.jpg, flyer-roar.jpg,
                      dallas-skyline.jpg, fort-worth-skyline.jpg (public domain/CC), bishop-drake-ministry.jpg (user photo; screenshot
                      with black bars — cropped via CSS in .poster-bishop),
                      hero-worship.jpg, worship-hands.jpg, crowd-lights.jpg (CC-licensed)
js/churches-data.js   ★ Single source of truth for all church/district data
js/events-data.js     ★ Spotlight events (title, dates, venue, flyer path, link, tag)
js/events.js          Events grid + flyer lightbox
js/main.js            Nav, reveal animations, shared card renderer
js/home.js            Home/About page dynamic sections
js/directory.js       Directory search + filter
js/leadership.js      Leadership cards
js/contact.js         Contact form (Formspree or mailto — static-host friendly)
404.html              Branded not-found page (GitHub Pages)
.nojekyll             Disables Jekyll processing on GitHub Pages
data/NTX_FGBCF_Church_Locations.xlsx   Original source spreadsheet
```

## 🗄️ Data

### Church data (`js/churches-data.js`)
Each church record: `id, church, aka, title, role, firstName, middleName, lastName, city, address, county, district ("dallas"|"tarrant"), status, website, links`.
Status values follow the spreadsheet legend: `Confirmed`, `Confirmed (city)`, `Confirmed (area)`. Churches without a confirmed street address display "street address pending".

**To add/edit a church:** edit `js/churches-data.js` — every page updates automatically.

### Events (`js/events-data.js`)
Each event: `id, title, subtitle, host, dateText, date (ISO), endDate, time, location, address, flyer, link, linkText, tag, featured`.
**To add an event:** save the flyer to `images/`, add an entry — the Spotlight sorts upcoming events first and auto-marks past ones.

### Contact form (`js/contact.js`) — no backend required
The site is 100% static, so the form works one of two ways (set at the top of `js/contact.js`):
1. **Formspree (recommended)** – create a free form at [formspree.io](https://formspree.io), paste the endpoint into `FORMSPREE_ENDPOINT`. Submissions are emailed to you.
2. **mailto fallback (default)** – if no endpoint is set, the form opens the visitor's email app pre-filled, addressed to `FALLBACK_EMAIL`. **Change `FALLBACK_EMAIL` to the real State office address.**

## 🚧 Not Yet Implemented / Recommended Next Steps

1. **Contact email** – set `FALLBACK_EMAIL` (or a Formspree endpoint) in `js/contact.js`.
2. **Bishop photo** – currently `images/bishop-drake-portrait.jpg` (cleaned from the State Conference flyer). Replace with an official high-res portrait when available (same filename = no code changes).
2. **Hero video** – the home hero has a "Welcome Video — Coming Soon" placeholder (`#hero-video` in `index.html`). Replace the `.video-placeholder` div with a `<video class="hero-video" controls playsinline>` tag or a YouTube/Vimeo `<iframe class="hero-video">` (instructions are in an HTML comment right above it). Styles in `.video-frame` handle sizing automatically.
2. **Events / calendar page** – state meetings, district fellowships, annual conference.
3. **Confirm pending addresses** – Walking In His Image Ministries, Cedar Grove BC (Satin), Victory Christian Center‑Crowley, Church Within Christian Ministries.
4. **Official contact details** – phone/email for the State office (currently displays HQ church address only).
5. **Photo gallery / news section** and social media links.
6. **Embedded map** of all churches (e.g., Leaflet + OpenStreetMap).

## 🌐 Hosting on GitHub Pages

The site is plain HTML/CSS/JS with **no build step** and all **relative paths**, so it runs directly on GitHub Pages (or any static host).

Deployment is automated via `.github/workflows/pages.yml`: every push to `main` builds and publishes the repo root straight to GitHub Pages using GitHub Actions.

### One-time setup
1. In the repo go to **Settings → Pages**. Under *Build and deployment* choose **Source: GitHub Actions** (not "Deploy from a branch").
2. Push (or merge) to `main` — the **Deploy static site to GitHub Pages** workflow runs automatically and publishes the site.
3. Your site is live at `https://<your-username>.github.io/<repo-name>/` (check the workflow run or Settings → Pages for the exact URL).
4. Future updates: just push to `main` — the workflow redeploys automatically within about a minute.

### Optional
- **Custom domain** (e.g. `www.ntxfullgospel.org`): Settings → Pages → *Custom domain*, then add the DNS records GitHub shows you. GitHub provides free HTTPS.
- **Contact form email**: set `FORMSPREE_ENDPOINT` or `FALLBACK_EMAIL` in `js/contact.js` (see above).
- **Updating the site**: edit files and push/commit — Pages redeploys automatically within a minute.

### Files included for Pages
| File | Purpose |
|---|---|
| `.nojekyll` | Tells GitHub not to run Jekyll, so folders/files are served exactly as-is |
| `404.html` | Branded "page not found" page (GitHub Pages serves it automatically) |
| `.gitignore` | Excludes OS junk and Genspark-only folders (`.tables/`, `.meta/`) |

> The `data/NTX_FGBCF_Church_Locations.xlsx` spreadsheet is the original source and isn't used by the site at runtime — keep it for reference or remove it before publishing if you'd rather not make it public.

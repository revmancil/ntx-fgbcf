/**
 * NTX FGBCF — shared site behaviour
 * - Mobile navigation toggle
 * - Active nav highlighting
 * - Scroll reveal animations
 * - Directory rendering helpers (used by churches.html and index.html)
 */
(function () {
  'use strict';

  /* ---------- Navigation ---------- */
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
  }
  // Highlight the current page in the nav
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === current) a.setAttribute('aria-current', 'page');
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- Copy to clipboard (e.g. Zelle email) ---------- */
  document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const icon = btn.querySelector('i');
      const prevClass = icon.className;
      btn.classList.add('copied');
      icon.className = 'fa-solid fa-check';
      btn.setAttribute('aria-label', 'Copied!');
      setTimeout(() => {
        btn.classList.remove('copied');
        icon.className = prevClass;
        btn.setAttribute('aria-label', 'Copy');
      }, 1800);
    });
  });
})();

/* ---------- Shared helpers (global) ---------- */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function mapsUrl(c) {
  const q = c.location ? c.location : `${c.name}${c.city ? ' ' + c.city : ''} TX`;
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}

function initials(c) {
  const name = (c.pastor && c.pastor.name) || '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0] ? parts[0][0] : '') + (parts.length > 1 ? parts[parts.length - 1][0] : '');
}

/** Full display name of the church's leader, e.g. "Bishop Gregory L. Drake" */
function ntxLeaderName(c, withTitle = true) {
  const name = (c.pastor && c.pastor.name) || '';
  return withTitle ? `${c.leader_title || ''} ${name}`.trim() : name;
}

/** Prominent banner for a District Overseer (used at the top of each district in the directory) */
function overseerBannerHtml(c, d) {
  const district = c.county.toLowerCase();
  const address = c.location
    ? escapeHtml(c.location)
    : c.city
      ? escapeHtml(c.city) + ', TX'
      : 'Location pending';
  const website = c.website
    ? `<a href="${escapeHtml(c.website)}" target="_blank" rel="noopener" class="btn btn-outline-light"><i class="fa-solid fa-globe"></i> Website</a>` : '';
  return `
    <article class="overseer-banner ${district}" id="church-${escapeHtml(c.id)}" data-district="${district}">
      <div class="overseer-avatar" aria-hidden="true">${escapeHtml(initials(c))}</div>
      <div class="overseer-body">
        <span class="overseer-kicker"><i class="fa-solid fa-user-shield"></i> ${escapeHtml(d.overseerTitle)}</span>
        <h3>${escapeHtml(ntxLeaderName(c))}</h3>
        <p class="overseer-church"><i class="fa-solid fa-church"></i> ${escapeHtml(c.name)}</p>
        <p class="overseer-address"><i class="fa-solid fa-location-dot"></i> ${address} &nbsp;•&nbsp; ${escapeHtml(c.county)} County</p>
      </div>
      <div class="overseer-actions">
        <a href="${mapsUrl(c)}" target="_blank" rel="noopener" class="btn btn-gold"><i class="fa-solid fa-diamond-turn-right"></i> Directions</a>
        ${website}
      </div>
    </article>`;
}

/** Build a church directory card */
function churchCardHtml(c) {
  const district = c.county.toLowerCase();
  const d = NTX_DISTRICTS[district];
  const address = c.location
    ? `<p class="meta"><i class="fa-solid fa-location-dot"></i><span>${escapeHtml(c.location)}</span></p>`
    : c.city
      ? `<p class="meta"><i class="fa-solid fa-location-dot"></i><span>${escapeHtml(c.city)}, TX <em>(street address pending)</em></span></p>`
      : `<p class="meta"><i class="fa-solid fa-location-dot"></i><span><em>Location pending</em></span></p>`;
  const county = c.county ? `<p class="meta"><i class="fa-solid fa-map"></i><span>${escapeHtml(c.county)} County</span></p>` : '';
  const website = c.website
    ? `<a href="${escapeHtml(c.website)}" target="_blank" rel="noopener"><i class="fa-solid fa-globe"></i> Website</a>` : '';
  const aka = c.aka ? `<span class="aka">“${escapeHtml(c.aka)}”</span>` : '';
  return `
    <article class="card church-card ${district}" id="church-${escapeHtml(c.id)}" data-district="${district}">
      <div class="church-top">
        <h3>${escapeHtml(c.name)} ${aka}</h3>
        <span class="badge ${district}">${escapeHtml(d.shortName)}</span>
      </div>
      <div class="pastor">
        <i class="fa-solid fa-user-tie"></i>
        <div>${escapeHtml(ntxLeaderName(c))}<small>${escapeHtml(c.leader_role || '')}</small></div>
      </div>
      ${address}
      ${county}
      <div class="actions">
        <a href="${mapsUrl(c)}" target="_blank" rel="noopener"><i class="fa-solid fa-diamond-turn-right"></i> Directions</a>
        ${website}
      </div>
    </article>`;
}

/** Banner for a district whose Overseer seat is currently vacant */
function vacantOverseerBannerHtml(d) {
  return `
    <article class="overseer-banner ${d.key} vacant" data-district="${d.key}">
      <div class="overseer-avatar" aria-hidden="true"><i class="fa-solid fa-user-slash"></i></div>
      <div class="overseer-body">
        <span class="overseer-kicker"><i class="fa-solid fa-user-shield"></i> ${escapeHtml(d.overseerTitle)}</span>
        <h3>Vacant</h3>
        <p>This position is currently vacant.</p>
      </div>
      <div class="overseer-actions">
        <a href="contact.html" class="btn btn-outline-light"><i class="fa-solid fa-envelope"></i> Interested? Contact Us</a>
      </div>
    </article>`;
}

/* ---------- Hero image + menu visibility from the database ----------------- */
/* Runs on every page; falls back silently to the hardcoded hero image/nav
   already in the HTML if the fetch fails, so there's never a broken page. */
(async function applyPageData() {
  if (!window.NTX_DATA) return;
  const { data: pages, error } = await window.NTX_DATA.getPages();
  if (error || !pages) return;

  const slug = document.body.dataset.pageSlug;
  const page = pages.find((p) => p.slug === slug);

  const heroBg = document.getElementById('hero-bg');
  if (page && page.hero_image_url && heroBg) {
    heroBg.style.backgroundImage = `url('${page.hero_image_url}')`;
  }

  document.querySelectorAll('.nav-links li[data-page-slug]').forEach((li) => {
    const match = pages.find((p) => p.slug === li.dataset.pageSlug);
    if (match && match.menu_visible === false) li.hidden = true;
  });
})();


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
})();

/* ---------- Shared helpers (global) ---------- */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function mapsUrl(c) {
  const q = c.address ? c.address : `${c.church} ${c.city} TX`;
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}

function initials(c) {
  return (c.firstName[0] || '') + (c.lastName[0] || '');
}

/** Prominent banner for a District Overseer (used at the top of each district in the directory) */
function overseerBannerHtml(c, d) {
  const address = c.address ? escapeHtml(c.address) : escapeHtml(c.city) + ', TX';
  const website = c.website
    ? `<a href="${escapeHtml(c.website)}" target="_blank" rel="noopener" class="btn btn-outline-light"><i class="fa-solid fa-globe"></i> Website</a>` : '';
  return `
    <article class="overseer-banner ${c.district}" id="church-${escapeHtml(c.id)}" data-district="${c.district}">
      <div class="overseer-avatar" aria-hidden="true">${escapeHtml(initials(c))}</div>
      <div class="overseer-body">
        <span class="overseer-kicker"><i class="fa-solid fa-user-shield"></i> ${escapeHtml(d.overseerTitle)}</span>
        <h3>${escapeHtml(c.title)} ${escapeHtml(ntxLeaderName(c, false))}</h3>
        <p class="overseer-church"><i class="fa-solid fa-church"></i> ${escapeHtml(c.church)}</p>
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
  const d = NTX_DISTRICTS[c.district];
  const address = c.address
    ? `<p class="meta"><i class="fa-solid fa-location-dot"></i><span>${escapeHtml(c.address)}</span></p>`
    : `<p class="meta"><i class="fa-solid fa-location-dot"></i><span>${escapeHtml(c.city)}, TX <em>(street address pending)</em></span></p>`;
  const website = c.website
    ? `<a href="${escapeHtml(c.website)}" target="_blank" rel="noopener"><i class="fa-solid fa-globe"></i> Website</a>` : '';
  const aka = c.aka ? `<span class="aka">“${escapeHtml(c.aka)}”</span>` : '';
  return `
    <article class="card church-card ${c.district}" id="church-${escapeHtml(c.id)}" data-district="${c.district}">
      <div class="church-top">
        <h3>${escapeHtml(c.church)} ${aka}</h3>
        <span class="badge ${c.district}">${escapeHtml(d.shortName)}</span>
      </div>
      <div class="pastor">
        <i class="fa-solid fa-user-tie"></i>
        <div>${escapeHtml(ntxLeaderName(c))}<small>${escapeHtml(c.role)}</small></div>
      </div>
      ${address}
      <p class="meta"><i class="fa-solid fa-map"></i><span>${escapeHtml(c.county)} County</span></p>
      <div class="actions">
        <a href="${mapsUrl(c)}" target="_blank" rel="noopener"><i class="fa-solid fa-diamond-turn-right"></i> Directions</a>
        ${website}
      </div>
    </article>`;
}

/**
 * Events page (events.html): full upcoming + past event listing, built from
 * the live events table in Supabase and rendered with the shared
 * eventCardHtml() helper in js/main.js (also used by the home spotlight).
 */
(async function () {
  'use strict';
  const upcomingWrap = document.getElementById('events-upcoming');
  const pastWrap = document.getElementById('events-past');
  const pastHeading = pastWrap ? pastWrap.previousElementSibling : null;
  if ((!upcomingWrap && !pastWrap) || !window.NTX_DATA) return;

  const { data: events, error } = await window.NTX_DATA.getEvents();
  if (error || !events) {
    if (upcomingWrap) upcomingWrap.innerHTML = `<div class="empty-state">Unable to load events right now. Please try again shortly.</div>`;
    if (pastWrap) pastWrap.hidden = true;
    if (pastHeading) pastHeading.hidden = true;
    return;
  }

  const upcoming = events.filter((e) => !isEventPast(e)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = events.filter((e) => isEventPast(e)).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (upcomingWrap) {
    upcomingWrap.innerHTML = upcoming.length
      ? upcoming.map(eventCardHtml).join('')
      : `<div class="empty-state">No upcoming events right now — check back soon.</div>`;
  }
  if (pastWrap) {
    if (past.length) {
      pastWrap.innerHTML = past.map(eventCardHtml).join('');
    } else {
      // Nothing to look back on yet — hide the whole "Past Events" section.
      pastWrap.hidden = true;
      if (pastHeading) pastHeading.hidden = true;
    }
  }

  /* ---------- Lightbox ---------- */
  const lb = document.getElementById('flyer-lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbClose = document.getElementById('lightbox-close');
  if (!lb) return;
  function open(src, title) { lbImg.src = src; lbImg.alt = title + ' flyer'; lb.hidden = false; document.body.style.overflow = 'hidden'; lbClose.focus(); }
  function close() { lb.hidden = true; lbImg.src = ''; document.body.style.overflow = ''; }
  document.addEventListener('click', (ev) => { const b = ev.target.closest('[data-flyer]'); if (b) open(b.dataset.flyer, b.dataset.title); });
  lbClose.addEventListener('click', close);
  lb.addEventListener('click', (ev) => { if (ev.target === lb) close(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !lb.hidden) close(); });
})();

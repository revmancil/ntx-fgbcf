/**
 * Spotlight: featured flyer + rotating flyer slider, with lightbox (home page)
 */
(function () {
  'use strict';
  const wrap = document.getElementById('events-spotlight');
  if (!wrap || typeof NTX_EVENTS === 'undefined') return;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const fmt = d => new Date(d + 'T00:00:00');
  const isPast = e => fmt(e.endDate || e.date) < today;
  const tagClass = tag => /dallas/i.test(tag) ? 'dallas' : /tarrant/i.test(tag) ? 'tarrant' : /state/i.test(tag) ? 'state' : 'intl';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Featured = first event flagged featured (PROPEL); the rest rotate in the slider
  const featured = NTX_EVENTS.find(e => e.featured) || NTX_EVENTS[0];
  const slides = NTX_EVENTS
    .filter(e => e !== featured)
    .sort((a, b) => (isPast(a) !== isPast(b)) ? (isPast(a) ? 1 : -1) : fmt(a.date) - fmt(b.date));

  function metaHtml(e) {
    return `
      <p class="event-meta"><i class="fa-solid fa-calendar-days"></i> ${escapeHtml(e.dateText)}${e.time ? ` <span class="dot-sep">•</span> ${escapeHtml(e.time)}` : ''}</p>
      <p class="event-meta"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(e.location)}${e.address ? `, ${escapeHtml(e.address)}` : ''}</p>
      <p class="event-meta"><i class="fa-solid fa-users"></i> ${escapeHtml(e.host)}</p>`;
  }
  function actionsHtml(e) {
    const external = /^https?:/i.test(e.link || '');
    const link = e.link ? `<a href="${escapeHtml(e.link)}"${external ? ' target="_blank" rel="noopener"' : ''} class="btn btn-gold btn-sm"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${escapeHtml(e.linkText || 'Learn More')}</a>` : '';
    return `<div class="event-actions">${link}<button type="button" class="btn btn-outline btn-sm" data-flyer="${escapeHtml(e.flyer)}" data-title="${escapeHtml(e.title)}"><i class="fa-solid fa-image"></i> View Flyer</button></div>`;
  }
  function flyerHtml(e) {
    const d = fmt(e.date);
    return `
      <button type="button" class="event-flyer fit" style="background-image:url('${escapeHtml(e.flyer)}')" data-flyer="${escapeHtml(e.flyer)}" data-title="${escapeHtml(e.title)}" aria-label="View flyer: ${escapeHtml(e.title)}">
        <img src="${escapeHtml(e.flyer)}" alt="${escapeHtml(e.title)} flyer">
        <span class="event-date-badge"><strong>${d.getDate()}</strong><span>${d.toLocaleString('en-US', { month: 'short' })}</span></span>
        <span class="event-tag ${tagClass(e.tag)}">${escapeHtml(e.tag)}</span>
        ${isPast(e) ? '<span class="event-past">Past Event</span>' : ''}
        <span class="event-zoom"><i class="fa-solid fa-expand"></i></span>
      </button>`;
  }

  /* ---------- Render ---------- */
  wrap.innerHTML = `
    <article class="event-card featured" id="event-${escapeHtml(featured.id)}">
      <span class="featured-ribbon"><i class="fa-solid fa-star"></i> Featured</span>
      ${flyerHtml(featured)}
      <div class="event-body">
        <h3>${escapeHtml(featured.title)}</h3>
        ${featured.subtitle ? `<p class="event-sub">${escapeHtml(featured.subtitle)}</p>` : ''}
        ${metaHtml(featured)}
        ${featured.notes ? `<p class="event-notes">${escapeHtml(featured.notes)}</p>` : ''}
        ${actionsHtml(featured)}
      </div>
    </article>

    <section class="flyer-slider" id="flyer-slider" aria-roledescription="carousel" aria-label="Upcoming events">
      <div class="slider-viewport">
        <div class="slider-track" id="slider-track">
          ${slides.map((e, i) => `
            <article class="slide event-card" id="event-${escapeHtml(e.id)}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}: ${escapeHtml(e.title)}">
              ${flyerHtml(e)}
              <div class="event-body">
                <h3>${escapeHtml(e.title)}</h3>
                ${e.subtitle ? `<p class="event-sub">${escapeHtml(e.subtitle)}</p>` : ''}
                ${metaHtml(e)}
                ${actionsHtml(e)}
              </div>
            </article>`).join('')}
        </div>
      </div>
      <div class="slider-controls">
        <button type="button" class="slider-btn" id="slider-prev" aria-label="Previous flyer"><i class="fa-solid fa-chevron-left"></i></button>
        <div class="slider-dots" id="slider-dots" role="tablist">
          ${slides.map((e, i) => `<button type="button" role="tab" data-index="${i}" aria-label="Go to ${escapeHtml(e.title)}" aria-selected="${i === 0}"></button>`).join('')}
        </div>
        <button type="button" class="slider-btn" id="slider-pause" aria-label="Pause rotation" aria-pressed="false"><i class="fa-solid fa-pause"></i></button>
        <button type="button" class="slider-btn" id="slider-next" aria-label="Next flyer"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
      <div class="slider-progress" id="slider-progress" aria-hidden="true"><span></span></div>
    </section>`;

  /* ---------- Slider logic ---------- */
  const track = document.getElementById('slider-track');
  const dots = Array.from(document.querySelectorAll('#slider-dots button'));
  const pauseBtn = document.getElementById('slider-pause');
  const progress = document.querySelector('#slider-progress span');
  const INTERVAL = 6000;
  let index = 0, timer = null, paused = reduceMotion, hovering = false;

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, n) => d.setAttribute('aria-selected', String(n === index)));
    restartProgress();
  }
  function restartProgress() {
    if (!progress) return;
    progress.style.transition = 'none'; progress.style.width = '0%';
    if (paused || hovering) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      progress.style.transition = `width ${INTERVAL}ms linear`; progress.style.width = '100%';
    }));
  }
  function start() {
    stop();
    if (paused || hovering || slides.length < 2) return;
    timer = setInterval(() => go(index + 1), INTERVAL);
    restartProgress();
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  document.getElementById('slider-prev').addEventListener('click', () => { go(index - 1); start(); });
  document.getElementById('slider-next').addEventListener('click', () => { go(index + 1); start(); });
  dots.forEach(d => d.addEventListener('click', () => { go(+d.dataset.index); start(); }));
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.setAttribute('aria-label', paused ? 'Resume rotation' : 'Pause rotation');
    pauseBtn.innerHTML = paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
    start();
  });
  const slider = document.getElementById('flyer-slider');
  slider.addEventListener('mouseenter', () => { hovering = true; stop(); restartProgress(); });
  slider.addEventListener('mouseleave', () => { hovering = false; start(); });
  slider.addEventListener('focusin', () => { hovering = true; stop(); restartProgress(); });
  slider.addEventListener('focusout', e => { if (!slider.contains(e.relatedTarget)) { hovering = false; start(); } });
  slider.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { go(index - 1); start(); }
    if (e.key === 'ArrowRight') { go(index + 1); start(); }
  });
  // Touch swipe
  let sx = 0;
  track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); start(); }
  });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

  if (paused) { pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; pauseBtn.setAttribute('aria-pressed', 'true'); }
  go(0); start();

  /* ---------- Lightbox ---------- */
  const lb = document.getElementById('flyer-lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbClose = document.getElementById('lightbox-close');
  if (!lb) return;
  function open(src, title) { lbImg.src = src; lbImg.alt = title + ' flyer'; lb.hidden = false; document.body.style.overflow = 'hidden'; lbClose.focus(); stop(); }
  function close() { lb.hidden = true; lbImg.src = ''; document.body.style.overflow = ''; start(); }
  wrap.addEventListener('click', ev => { const b = ev.target.closest('[data-flyer]'); if (b) open(b.dataset.flyer, b.dataset.title); });
  lbClose.addEventListener('click', close);
  lb.addEventListener('click', ev => { if (ev.target === lb) close(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !lb.hidden) close(); });
})();

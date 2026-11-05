/**
 * Home page: stats, district cards, and featured churches — built from the
 * live church directory in Supabase (see js/supabase-client.js).
 */
(async function () {
  'use strict';
  if (!window.NTX_DATA) return;

  const { data: churches, error } = await window.NTX_DATA.getChurches();
  if (error || !churches) return;

  function cityName(c) {
    return (c.city || '').split(/[/(]/)[0].trim();
  }

  // Stats
  const statChurches = document.getElementById('stat-churches');
  const statCities = document.getElementById('stat-cities');
  if (statChurches) statChurches.textContent = churches.length;
  if (statCities) {
    const cities = new Set(churches.map(cityName).filter(Boolean));
    statCities.textContent = cities.size;
  }

  // About page "at a glance" card
  const gc = document.getElementById('glance-churches');
  const gci = document.getElementById('glance-cities');
  if (gc) gc.textContent = churches.length;
  if (gci) gci.textContent = new Set(churches.map(cityName).filter(Boolean)).size;

  // Spotlight counts
  const dallasCount = churches.filter((c) => c.county === 'Dallas').length;
  const tarrantCount = churches.filter((c) => c.county === 'Tarrant').length;
  const sd = document.getElementById('spot-dallas-count');
  const st = document.getElementById('spot-tarrant-count');
  if (sd) sd.textContent = dallasCount;
  if (st) st.textContent = tarrantCount;

  // District cards
  const districtWrap = document.getElementById('district-cards');
  if (districtWrap) {
    districtWrap.innerHTML = Object.keys(NTX_DISTRICTS)
      .map((key) => {
        const d = NTX_DISTRICTS[key];
        const count = churches.filter((c) => c.county.toLowerCase() === key).length;
        const overseerChurch = churches.find((c) => c.county.toLowerCase() === key && c.is_district_overseer);
        const overseerName = overseerChurch ? ntxLeaderName(overseerChurch) : 'Vacant';
        const overseerChurchName = overseerChurch ? overseerChurch.name : '';
        const overseerAvatar = overseerChurch && overseerChurch.pastor && overseerChurch.pastor.image_url
          ? `<img src="${escapeHtml(overseerChurch.pastor.image_url)}" alt="${escapeHtml(overseerName)}">`
          : escapeHtml(overseerName.split(' ').filter((p) => p.length > 2).map((p) => p[0]).join(''));
        return `
          <article class="district-card ${key} reveal in">
            <span class="pill">${escapeHtml(d.shortName)}</span>
            <h3>${escapeHtml(d.name)}</h3>
            <div class="overseer">
              <div class="overseer-initials" aria-hidden="true">${overseerAvatar}</div>
              <div>
                <span class="overseer-title">${escapeHtml(d.overseerTitle)}</span>
                <strong>${escapeHtml(overseerName)}</strong>
                <span>${escapeHtml(overseerChurchName)}</span>
              </div>
            </div>
            <p>${escapeHtml(d.description)}</p>
            <div class="cta-row">
              <div><span class="count">${count}</span><div class="count-label">Member Churches</div></div>
              <a href="churches.html?district=${key}" class="btn btn-outline">View Churches <i class="fa-solid fa-arrow-right"></i></a>
            </div>
          </article>`;
      })
      .join('');
  }

  // Featured churches: admin-picked via the Church form's "Featured" checkbox
  const featuredEl = document.getElementById('featured-church-grid');
  if (featuredEl) {
    const featuredChurches = churches.filter((c) => c.featured);
    featuredEl.innerHTML = featuredChurches.map(churchCardHtml).join('');
  }
})();

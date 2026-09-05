/**
 * Home page: stats, district cards, and featured churches
 */
(function () {
  'use strict';

  // Stats
  const statChurches = document.getElementById('stat-churches');
  const statCities = document.getElementById('stat-cities');
  if (statChurches) statChurches.textContent = NTX_CHURCHES.length;
  if (statCities) {
    const cities = new Set(NTX_CHURCHES.map(c => c.city.split(/[\/(]/)[0].trim()));
    statCities.textContent = cities.size;
  }

  // Spotlight counts
  const dallasCount = NTX_CHURCHES.filter(c => c.district === 'dallas').length;
  const tarrantCount = NTX_CHURCHES.filter(c => c.district === 'tarrant').length;
  const sd = document.getElementById('spot-dallas-count');
  const st = document.getElementById('spot-tarrant-count');
  if (sd) sd.textContent = dallasCount;
  if (st) st.textContent = tarrantCount;

  // District cards
  const districtWrap = document.getElementById('district-cards');
  if (districtWrap) {
    districtWrap.innerHTML = Object.values(NTX_DISTRICTS).map(d => {
      const count = NTX_CHURCHES.filter(c => c.district === d.key).length;
      return `
        <article class="district-card ${d.key} reveal in">
          <span class="pill">${escapeHtml(d.shortName)}</span>
          <h3>${escapeHtml(d.name)}</h3>
          <div class="overseer">
            <div class="overseer-initials" aria-hidden="true">${escapeHtml(d.overseerName.split(' ').filter(p => p.length > 2).map(p => p[0]).join(''))}</div>
            <div>
              <span class="overseer-title">${escapeHtml(d.overseerTitle)}</span>
              <strong>${escapeHtml(d.overseerName)}</strong>
              <span>${escapeHtml(d.overseerChurch)}</span>
            </div>
          </div>
          <p>${escapeHtml(d.description)}</p>
          <div class="cta-row">
            <div><span class="count">${count}</span><div class="count-label">Member Churches</div></div>
            <a href="churches.html?district=${d.key}" class="btn btn-outline">View Churches <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </article>`;
    }).join('');
  }

  // Featured churches: State Bishop's church + the two District Overseers' churches
  const featured = document.getElementById('featured-church-grid');
  if (featured) {
    const ids = ['jubilee-community-church', 'higher-mark-fgbc', 'greater-mt-tabor'];
    featured.innerHTML = ids
      .map(id => NTX_CHURCHES.find(c => c.id === id))
      .filter(Boolean)
      .map(churchCardHtml).join('');
  }
})();

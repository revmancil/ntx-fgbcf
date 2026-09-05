/**
 * Church directory: search + district filter, grouped by district.
 * Supports ?district=dallas|tarrant and ?q=search in the URL.
 */
(function () {
  'use strict';

  const results = document.getElementById('directory-results');
  const countEl = document.getElementById('results-count');
  const searchInput = document.getElementById('search-input');
  const filterBtns = Array.from(document.querySelectorAll('#district-filters .filter-btn'));

  const params = new URLSearchParams(location.search);
  let activeDistrict = ['dallas', 'tarrant'].includes(params.get('district')) ? params.get('district') : 'all';
  let query = params.get('q') || '';
  if (query) searchInput.value = query;

  // Sort: State Bishop first, then Overseers, then alphabetical by church
  const rank = c => c.role === 'State Bishop' ? 0 : c.featured ? 1 : 2;
  const sorted = [...NTX_CHURCHES].sort((a, b) => rank(a) - rank(b) || a.church.localeCompare(b.church));

  function matches(c, q) {
    if (!q) return true;
    const hay = [c.church, c.aka, c.firstName, c.middleName, c.lastName, c.title, c.role, c.city, c.county, c.address]
      .join(' ').toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(t => hay.includes(t));
  }

  function render() {
    const filtered = sorted.filter(c => (activeDistrict === 'all' || c.district === activeDistrict) && matches(c, query));
    countEl.textContent = `Showing ${filtered.length} of ${NTX_CHURCHES.length} churches`;

    if (!filtered.length) {
      results.innerHTML = `<div class="empty-state"><i class="fa-solid fa-church" style="font-size:2rem; margin-bottom:.5rem; display:block;"></i>
        No churches match your search. Try a different name, city, or district.</div>`;
      return;
    }

    const groups = activeDistrict === 'all' ? ['dallas', 'tarrant'] : [activeDistrict];
    results.innerHTML = groups.map(key => {
      const d = NTX_DISTRICTS[key];
      const list = filtered.filter(c => c.district === key);
      if (!list.length) return '';
      // District Overseer gets a prominent banner at the top of the district (only when not filtered out by search)
      const overseer = list.find(c => c.id === d.overseerId);
      const rest = list.filter(c => c.id !== d.overseerId);
      const overseerBanner = overseer ? overseerBannerHtml(overseer, d) : '';
      return `
        <section aria-labelledby="heading-${key}">
          <div class="district-heading">
            <span class="dot ${key}"></span>
            <h2 id="heading-${key}">${escapeHtml(d.name)}</h2>
            <small>${list.length} ${list.length === 1 ? 'church' : 'churches'}</small>
          </div>
          ${overseerBanner}
          <div class="church-grid">${rest.map(churchCardHtml).join('')}</div>
        </section>`;
    }).join('');
  }

  filterBtns.forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.district === activeDistrict));
    btn.addEventListener('click', () => {
      activeDistrict = btn.dataset.district;
      filterBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      const url = new URL(location.href);
      if (activeDistrict === 'all') url.searchParams.delete('district'); else url.searchParams.set('district', activeDistrict);
      history.replaceState(null, '', url);
      render();
    });
  });

  searchInput.addEventListener('input', () => { query = searchInput.value.trim(); render(); });

  render();
})();

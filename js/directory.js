/**
 * Church directory: search + district filter, grouped by district.
 * Supports ?district=dallas|tarrant and ?q=search in the URL.
 * Data comes from Supabase (see js/supabase-client.js) rather than a
 * hardcoded array, so admin-portal edits appear here without a code change.
 */
(async function () {
  'use strict';

  const results = document.getElementById('directory-results');
  const countEl = document.getElementById('results-count');
  const searchInput = document.getElementById('search-input');
  const filterBtns = Array.from(document.querySelectorAll('#district-filters .filter-btn'));

  if (!results || !window.NTX_DATA) return;

  const { data: churches, error } = await window.NTX_DATA.getChurches();
  if (error || !churches) {
    results.innerHTML = `<div class="empty-state">Unable to load the church directory right now. Please try again shortly.</div>`;
    return;
  }

  const params = new URLSearchParams(location.search);
  let activeDistrict = ['dallas', 'tarrant'].includes(params.get('district')) ? params.get('district') : 'all';
  let query = params.get('q') || '';
  if (query) searchInput.value = query;

  // Sort: State Bishop first, then District Overseers, then alphabetical by church name
  const rank = (c) => (c.leader_role === 'State Bishop' ? 0 : c.is_district_overseer ? 1 : 2);
  const sorted = [...churches].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));

  function matches(c, q) {
    if (!q) return true;
    const hay = [c.name, c.aka, c.pastor && c.pastor.name, c.leader_title, c.leader_role, c.city, c.county, c.location]
      .filter(Boolean).join(' ').toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
  }

  function render() {
    const filtered = sorted.filter(
      (c) => (activeDistrict === 'all' || c.county.toLowerCase() === activeDistrict) && matches(c, query)
    );
    countEl.textContent = `Showing ${filtered.length} of ${churches.length} churches`;

    if (!filtered.length) {
      results.innerHTML = `<div class="empty-state"><i class="fa-solid fa-church" style="font-size:2rem; margin-bottom:.5rem; display:block;"></i>
        No churches match your search. Try a different name, city, or district.</div>`;
      return;
    }

    const groups = activeDistrict === 'all' ? ['dallas', 'tarrant'] : [activeDistrict];
    results.innerHTML = groups
      .map((key) => {
        const d = NTX_DISTRICTS[key];
        const list = filtered.filter((c) => c.county.toLowerCase() === key);
        if (!list.length) return '';
        const overseer = list.find((c) => c.is_district_overseer);
        const rest = list.filter((c) => c !== overseer);
        const overseerBanner = overseer ? overseerBannerHtml(overseer, d) : vacantOverseerBannerHtml(d);
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
      })
      .join('');
  }

  filterBtns.forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.district === activeDistrict));
    btn.addEventListener('click', () => {
      activeDistrict = btn.dataset.district;
      filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      const url = new URL(location.href);
      if (activeDistrict === 'all') url.searchParams.delete('district');
      else url.searchParams.set('district', activeDistrict);
      history.replaceState(null, '', url);
      render();
    });
  });

  searchInput.addEventListener('input', () => {
    query = searchInput.value.trim();
    render();
  });

  render();
})();

/**
 * Leadership page: District Overseer cards and Pastor cards, built from
 * the live church directory in Supabase (see js/supabase-client.js).
 */
(async function () {
  'use strict';

  const overseerWrap = document.getElementById('overseer-cards');
  const pastorWrap = document.getElementById('pastor-cards');
  if ((!overseerWrap && !pastorWrap) || !window.NTX_DATA) return;

  const { data: churches, error } = await window.NTX_DATA.getChurches();
  if (error || !churches) return;

  function leaderCard(c, roleLabel) {
    const district = c.county.toLowerCase();
    const d = NTX_DISTRICTS[district];
    return `
      <article class="card leader-card reveal in">
        <div class="avatar" aria-hidden="true">${escapeHtml(initials(c))}</div>
        <h3>${escapeHtml(ntxLeaderName(c))}</h3>
        <p class="leader-role">${escapeHtml(roleLabel)}</p>
        <p class="leader-church">${escapeHtml(c.name)}<small>${escapeHtml(c.city || '')}, TX</small></p>
        <span class="tag ${district}">${escapeHtml(d.shortName)}</span>
        <div style="margin-top:1rem;">
          <a href="churches.html#church-${escapeHtml(c.id)}" style="font-size:.9rem; font-weight:600;">View church <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </article>`;
  }

  // District Overseers (one per county; a county with no seated overseer shows a Vacant banner)
  if (overseerWrap) {
    overseerWrap.innerHTML = Object.keys(NTX_DISTRICTS)
      .map((key) => {
        const d = NTX_DISTRICTS[key];
        const c = churches.find((ch) => ch.county.toLowerCase() === key && ch.is_district_overseer);
        return c ? overseerBannerHtml(c, d) : vacantOverseerBannerHtml(d);
      })
      .join('');
  }

  // Pastors: everyone except the State Bishop and the seated District Overseer(s)
  if (pastorWrap) {
    const pastors = churches
      .filter((c) => c.leader_role !== 'State Bishop' && !c.is_district_overseer)
      .sort((a, b) => {
        const lastA = ((a.pastor && a.pastor.name) || '').trim().split(/\s+/).pop() || '';
        const lastB = ((b.pastor && b.pastor.name) || '').trim().split(/\s+/).pop() || '';
        return lastA.localeCompare(lastB);
      });
    pastorWrap.innerHTML = pastors.map((c) => leaderCard(c, c.leader_role || '')).join('');
  }
})();

/**
 * Leadership page: District Overseer cards and Pastor cards built from church data
 */
(function () {
  'use strict';

  function leaderCard(c, roleLabel, extraClass) {
    const d = NTX_DISTRICTS[c.district];
    return `
      <article class="card leader-card ${extraClass || ''} reveal in">
        <div class="avatar" aria-hidden="true">${escapeHtml(initials(c))}</div>
        <h3>${escapeHtml(c.title)} ${escapeHtml(ntxLeaderName(c, false))}</h3>
        <p class="leader-role">${escapeHtml(roleLabel)}</p>
        <p class="leader-church">${escapeHtml(c.church)}<small>${escapeHtml(c.city)}, TX</small></p>
        <span class="tag ${c.district}">${escapeHtml(d.shortName)}</span>
        <div style="margin-top:1rem;">
          <a href="churches.html#church-${escapeHtml(c.id)}" style="font-size:.9rem; font-weight:600;">View church <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </article>`;
  }

  // District Overseers (one per district; a district with no overseerId has a vacant seat)
  const overseerWrap = document.getElementById('overseer-cards');
  if (overseerWrap) {
    overseerWrap.innerHTML = Object.values(NTX_DISTRICTS).map(d => {
      const c = d.overseerId ? NTX_CHURCHES.find(ch => ch.id === d.overseerId) : null;
      return c ? overseerBannerHtml(c, d) : vacantOverseerBannerHtml(d);
    }).join('');
  }

  // Pastors: everyone except the State Bishop and the seated District Overseer(s)
  const pastorWrap = document.getElementById('pastor-cards');
  if (pastorWrap) {
    const seatedOverseerIds = Object.values(NTX_DISTRICTS).map(d => d.overseerId).filter(Boolean);
    const exclude = new Set(['jubilee-community-church', ...seatedOverseerIds]);
    const pastors = NTX_CHURCHES
      .filter(c => !exclude.has(c.id))
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
    pastorWrap.innerHTML = pastors.map(c => leaderCard(c, c.role)).join('');
  }
})();

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

  // District Overseers (the two officially designated district leaders)
  const overseerWrap = document.getElementById('overseer-cards');
  if (overseerWrap) {
    const overseers = ['higher-mark-fgbc', 'greater-mt-tabor']
      .map(id => NTX_CHURCHES.find(c => c.id === id)).filter(Boolean);
    overseerWrap.innerHTML = overseers.map(c => overseerBannerHtml(c, NTX_DISTRICTS[c.district])).join('');
  }

  // Pastors: everyone except the State Bishop and the two District Overseers
  const pastorWrap = document.getElementById('pastor-cards');
  if (pastorWrap) {
    const exclude = new Set(['jubilee-community-church', 'higher-mark-fgbc', 'greater-mt-tabor']);
    const pastors = NTX_CHURCHES
      .filter(c => !exclude.has(c.id))
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
    pastorWrap.innerHTML = pastors.map(c => leaderCard(c, c.role)).join('');
  }
})();

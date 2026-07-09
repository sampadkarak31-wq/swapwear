async function renderProfile(app, params) {
  app.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;

  let data;
  try {
    data = await api.getUser(params.id);
  } catch (err) {
    app.innerHTML = `<div class="empty-state"><h2>User not found</h2><p>${escapeHtml(err.message)}</p></div>`;
    return;
  }

  const { user, listings, reviews } = data;

  app.innerHTML = `
    <div class="container" style="padding:40px 0 80px;">
      <div class="dash-card" style="display:flex; gap:20px; align-items:center; flex-wrap:wrap;">
        <img src="${user.avatar?.url || fallbackAvatar(user.name)}" alt="" style="width:96px;height:96px;border-radius:50%;object-fit:cover;"/>
        <div style="flex:1;">
          <h1 style="margin-bottom:4px;">${escapeHtml(user.name)}</h1>
          <div class="rating">${renderStars(user.ratingAverage)} <span style="color:var(--color-ink-soft);">(${user.ratingCount || 0} reviews)</span></div>
          ${user.location ? `<p style="margin:6px 0 0;">📍 ${escapeHtml(user.location)}</p>` : ''}
          ${user.bio ? `<p style="margin-top:10px;">${escapeHtml(user.bio)}</p>` : ''}
        </div>
        <div class="stat-box" style="min-width:140px;">
          <b>${user.completedSwaps || 0}</b><span>Completed swaps</span>
        </div>
      </div>

      <section class="section" style="padding-top:30px;">
        <div class="section-head" style="text-align:left; max-width:none;"><h2>Current listings</h2></div>
        ${listings.length ? `<div class="listing-grid">${listings.map(listingCardHtml).join('')}</div>` : '<p>No active listings right now.</p>'}
      </section>

      <section class="section section-alt">
        <div class="section-head" style="text-align:left; max-width:none;"><h2>Reviews</h2></div>
        ${reviews.length ? reviews.map((r) => `
          <div class="review-item">
            <div style="display:flex; justify-content:space-between;">
              <b>${escapeHtml(r.reviewer?.name || 'Anonymous')}</b>
              <span class="rating-stars">${renderStars(r.rating)}</span>
            </div>
            ${r.comment ? `<p>${escapeHtml(r.comment)}</p>` : ''}
          </div>`).join('') : '<p>No reviews yet.</p>'}
      </section>
    </div>`;

  attachWishlistHandlers(app);
}

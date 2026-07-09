async function renderListingDetail(app, params) {
  app.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;

  let data;
  try {
    data = await api.getListing(params.id);
  } catch (err) {
    app.innerHTML = `<div class="empty-state"><h2>Listing not found</h2><p>${escapeHtml(err.message)}</p><a href="#/browse" data-link class="btn btn-primary">Back to browse</a></div>`;
    return;
  }

  const { listing, related } = data;
  const owner = listing.owner || {};
  const images = listing.images && listing.images.length ? listing.images : [{ url: '' }];
  const isOwner = state.user && state.user._id === owner._id;

  app.innerHTML = `
    <div class="container">
      <div class="detail-layout">
        <div>
          <div class="gallery-main" id="gallery-main">
            <img src="${images[0].url}" alt="${escapeHtml(listing.title)}" id="gallery-img"/>
          </div>
          <div class="gallery-thumbs">
            ${images.map((img, i) => `<img src="${img.url}" data-idx="${i}" class="${i === 0 ? 'active' : ''}" alt="thumbnail ${i + 1}"/>`).join('')}
          </div>
        </div>
        <div>
          <span class="eyebrow">${escapeHtml(listing.category)} · ${escapeHtml(listing.gender)}</span>
          <h1 class="detail-title">${escapeHtml(listing.title)}</h1>
          <div class="detail-price">Estimated swap value: ${currency(listing.estimatedValue)}</div>
          <p>${escapeHtml(listing.description)}</p>
          <div class="detail-tags">
            <span class="pill">Brand: ${escapeHtml(listing.brand || 'Unbranded')}</span>
            <span class="pill">Size: ${escapeHtml(listing.size)}</span>
            <span class="pill">Condition: ${escapeHtml(listing.condition)}</span>
            <span class="pill">📍 ${escapeHtml(listing.location)}</span>
          </div>

          <a href="#/profile/${owner._id}" data-link class="owner-card">
            <img src="${owner.avatar?.url || fallbackAvatar(owner.name)}" alt="${escapeHtml(owner.name || '')}"/>
            <div>
              <b>${escapeHtml(owner.name || 'SwapWear user')}</b>
              <div class="rating">${renderStars(owner.ratingAverage)} <span style="color:var(--color-ink-soft)">(${owner.ratingCount || 0})</span></div>
            </div>
          </a>

          <div class="detail-actions">
            ${isOwner
              ? `<a href="#/edit-listing/${listing._id}" data-link class="btn btn-ghost">Edit listing</a>
                 <button class="btn btn-danger" id="delete-listing">Delete listing</button>`
              : `<button class="btn btn-primary" id="request-swap-btn" ${listing.status !== 'available' ? 'disabled' : ''}>
                  ${listing.status === 'available' ? 'Request swap' : 'Not available'}
                 </button>
                 <button class="btn btn-ghost" data-wish="${listing._id}">Save to wishlist</button>`
            }
          </div>
        </div>
      </div>

      ${related && related.length ? `
      <section class="section">
        <div class="section-head" style="text-align:left; max-width:none;"><h2>You might also like</h2></div>
        <div class="listing-grid">${related.map(listingCardHtml).join('')}</div>
      </section>` : ''}
    </div>

    <div id="swap-modal-root"></div>
  `;

  document.getElementById('gallery-main').addEventListener('click', () => {
    openLightbox(document.getElementById('gallery-img').src, listing.title);
  });
  document.querySelectorAll('.gallery-thumbs img').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      document.getElementById('gallery-img').src = thumb.src;
      document.querySelectorAll('.gallery-thumbs img').forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  attachWishlistHandlers(app);

  const swapBtn = document.getElementById('request-swap-btn');
  if (swapBtn) swapBtn.addEventListener('click', () => openSwapModal(listing));

  const deleteBtn = document.getElementById('delete-listing');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Delete this listing permanently?')) return;
      try {
        await api.deleteListing(listing._id);
        toast('Listing deleted', 'success');
        navigate('/dashboard');
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }
}

function fallbackAvatar(name = 'U') {
  const initial = encodeURIComponent((name || 'U').charAt(0).toUpperCase());
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%232E5E4E'/><text x='50' y='58' font-size='42' fill='white' text-anchor='middle' font-family='sans-serif'>${initial}</text></svg>`)}`;
}

async function openSwapModal(listing) {
  if (!requireAuth()) return;

  let myListings = [];
  try {
    const { listings } = await api.getListings(`?owner=${state.user._id}&limit=50`);
    myListings = listings;
  } catch (e) { /* non-fatal */ }

  const root = document.getElementById('swap-modal-root');
  root.innerHTML = `
    <div class="lightbox" style="align-items:flex-start; padding-top:60px;">
      <div style="background:var(--color-surface); border-radius:var(--radius-lg); padding:30px; max-width:480px; width:92%; color:var(--color-ink);">
        <h2 style="margin-top:0;">Request a swap</h2>
        <p>You're requesting <b>${escapeHtml(listing.title)}</b>.</p>
        <div class="field">
          <label>Offer one of your listings (optional)</label>
          <select id="offered-listing">
            <option value="">No specific item — just ask</option>
            ${myListings.map((l) => `<option value="${l._id}">${escapeHtml(l.title)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Message to the owner</label>
          <textarea id="swap-message" rows="3" placeholder="Hi! I'd love to swap for this..."></textarea>
        </div>
        <div class="detail-actions">
          <button class="btn btn-primary" id="send-swap-request">Send request</button>
          <button class="btn btn-ghost" id="cancel-swap-request">Cancel</button>
        </div>
      </div>
    </div>`;

  const modal = root.querySelector('.lightbox');
  const close = () => { root.innerHTML = ''; };
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.getElementById('cancel-swap-request').addEventListener('click', close);
  document.getElementById('send-swap-request').addEventListener('click', async (e) => {
    e.target.disabled = true;
    try {
      await api.createSwap({
        requestedListingId: listing._id,
        offeredListingId: document.getElementById('offered-listing').value || undefined,
        message: document.getElementById('swap-message').value.trim(),
      });
      toast('Swap request sent!', 'success');
      close();
      navigate('/dashboard');
    } catch (err) {
      toast(err.message, 'error');
      e.target.disabled = false;
    }
  });
}

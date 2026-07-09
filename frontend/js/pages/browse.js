function listingCardHtml(listing) {
  const img = listing.images && listing.images[0] ? listing.images[0].url : '';
  const owner = listing.owner || {};
  const wished = state.wishlistIds.has(listing._id);
  return `
    <div class="listing-card">
      <a href="#/listing/${listing._id}" data-link>
        <div class="listing-thumb">
          <img src="${img}" alt="${escapeHtml(listing.title)}" loading="lazy"/>
          <span class="listing-badge">${escapeHtml(listing.condition)}</span>
        </div>
      </a>
      <button class="listing-wish ${wished ? 'active' : ''}" data-wish="${listing._id}" aria-label="Toggle wishlist">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.7-10-9.3C.4 8 2 4.5 5.6 4c2-.3 3.9.6 5 2.2a5.6 5.6 0 0 1 5-2.2c3.6.5 5.2 4 3.6 7.7C19.5 16.3 12 21 12 21Z"/></svg>
      </button>
      <a href="#/listing/${listing._id}" data-link class="listing-body">
        <div class="listing-title">${escapeHtml(listing.title)}</div>
        <div class="listing-meta"><span>${escapeHtml(owner.name || '')} · ${escapeHtml(listing.size || '')}</span><span class="listing-value">${currency(listing.estimatedValue)}</span></div>
      </a>
    </div>`;
}

function attachWishlistHandlers(container) {
  container.querySelectorAll('[data-wish]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!requireAuth()) return;
      const id = btn.dataset.wish;
      try {
        const { wishlisted } = await api.toggleWishlist(id);
        btn.classList.toggle('active', wishlisted);
        if (wishlisted) state.wishlistIds.add(id);
        else state.wishlistIds.delete(id);
        toast(wishlisted ? 'Added to wishlist' : 'Removed from wishlist', 'success');
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

async function renderBrowse(app, params, query) {
  app.innerHTML = `
    <div class="container">
      <div class="page-title-bar"><h1>Browse listings</h1></div>
      <div class="browse-layout">
        <aside class="filters-panel">
          <h3>Filters</h3>
          <form id="filter-form">
            <div class="field">
              <label for="f-category">Category</label>
              <select id="f-category" name="category">
                <option value="">All categories</option>
                ${['Tops','Bottoms','Dresses','Outerwear','Footwear','Accessories','Ethnic Wear','Activewear'].map((c) => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label for="f-gender">Gender</label>
              <select id="f-gender" name="gender">
                <option value="">Any</option>
                <option>Men</option><option>Women</option><option>Unisex</option><option>Kids</option>
              </select>
            </div>
            <div class="field">
              <label for="f-condition">Condition</label>
              <select id="f-condition" name="condition">
                <option value="">Any condition</option>
                <option>New with tags</option><option>Like new</option><option>Gently used</option><option>Well loved</option>
              </select>
            </div>
            <div class="field">
              <label for="f-brand">Brand</label>
              <input type="text" id="f-brand" name="brand" placeholder="e.g. Levi's"/>
            </div>
            <div class="field">
              <label for="f-location">Location</label>
              <input type="text" id="f-location" name="location" placeholder="City"/>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Apply filters</button>
            <button type="button" id="clear-filters" class="btn btn-ghost btn-block" style="margin-top:8px;">Clear all</button>
          </form>
        </aside>

        <div>
          <div class="search-bar">
            <input type="text" id="search-input" placeholder="Search by title, brand, or tag..." value="${escapeHtml(query.get('search') || '')}"/>
          </div>
          <div class="sort-bar">
            <span class="result-count" id="result-count">Loading...</span>
            <select id="sort-select">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="value_high">Value: high to low</option>
              <option value="value_low">Value: low to high</option>
              <option value="popular">Most viewed</option>
            </select>
          </div>
          <div id="results-grid" class="listing-grid">${skeletonCards(6)}</div>
          <div class="pagination" id="pagination"></div>
        </div>
      </div>
    </div>`;

  // Prefill from query params
  const form = document.getElementById('filter-form');
  ['category', 'gender', 'condition', 'brand', 'location'].forEach((key) => {
    const val = query.get(key);
    if (val && form.elements[key]) form.elements[key].value = val;
  });
  if (query.get('sort')) document.getElementById('sort-select').value = query.get('sort');

  let currentPage = parseInt(query.get('page') || '1', 10);

  const buildQueryString = (page = 1) => {
    const params = new URLSearchParams();
    const fd = new FormData(form);
    for (const [key, val] of fd.entries()) if (val) params.set(key, val);
    const search = document.getElementById('search-input').value.trim();
    if (search) params.set('search', search);
    params.set('sort', document.getElementById('sort-select').value);
    params.set('page', page);
    params.set('limit', 12);
    return params;
  };

  const load = async (page = 1) => {
    currentPage = page;
    const grid = document.getElementById('results-grid');
    grid.innerHTML = skeletonCards(6);
    const qs = buildQueryString(page);
    history.replaceState(null, '', `#/browse?${qs.toString()}`);
    try {
      const data = await api.getListings(`?${qs.toString()}`);
      document.getElementById('result-count').textContent = `${data.total} item${data.total === 1 ? '' : 's'} found`;
      if (!data.listings.length) {
        grid.innerHTML = `<div class="empty-state"><h3>No listings match those filters</h3><p>Try broadening your search.</p></div>`;
      } else {
        grid.innerHTML = data.listings.map(listingCardHtml).join('');
        attachWishlistHandlers(grid);
      }
      renderPagination(data.page, data.pages, load);
    } catch (err) {
      grid.innerHTML = `<p>Could not load listings: ${escapeHtml(err.message)}</p>`;
    }
  };

  form.addEventListener('submit', (e) => { e.preventDefault(); load(1); });
  document.getElementById('sort-select').addEventListener('change', () => load(1));
  document.getElementById('search-input').addEventListener('input', debounce(() => load(1), 400));
  document.getElementById('clear-filters').addEventListener('click', () => {
    form.reset();
    document.getElementById('search-input').value = '';
    load(1);
  });

  load(currentPage);
}

function renderPagination(page, pages, onPage) {
  const el = document.getElementById('pagination');
  if (!el) return;
  if (pages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  el.innerHTML = html;
  el.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => onPage(parseInt(btn.dataset.page, 10)));
  });
}

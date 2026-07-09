async function renderDashboard(app, params, query) {
  const tab = query.get('tab') || 'overview';

  app.innerHTML = `
    <div class="container">
      <div class="page-title-bar"><h1>My dashboard</h1></div>
      <div class="dash-layout">
        <nav class="dash-nav">
          <button data-tab="overview" class="${tab === 'overview' ? 'active' : ''}">Overview</button>
          <button data-tab="listings" class="${tab === 'listings' ? 'active' : ''}">My listings</button>
          <button data-tab="swaps" class="${tab === 'swaps' ? 'active' : ''}">Swap requests</button>
          <button data-tab="profile" class="${tab === 'profile' ? 'active' : ''}">Profile settings</button>
          ${state.user.role === 'admin' ? `<button data-tab="admin-link">Admin dashboard</button>` : ''}
        </nav>
        <div id="dash-content"><div class="page-loader"><div class="spinner"></div></div></div>
      </div>
    </div>`;

  document.querySelectorAll('.dash-nav button').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === 'admin-link') { navigate('/admin'); return; }
      history.replaceState(null, '', `#/dashboard?tab=${btn.dataset.tab}`);
      document.querySelectorAll('.dash-nav button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadTab(btn.dataset.tab);
    });
  });

  loadTab(tab);
}

async function loadTab(tab) {
  const content = document.getElementById('dash-content');
  content.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;

  if (tab === 'overview') return loadOverview(content);
  if (tab === 'listings') return loadMyListings(content);
  if (tab === 'swaps') return loadMySwaps(content);
  if (tab === 'profile') return loadProfileSettings(content);
}

async function loadOverview(content) {
  try {
    const [listingsRes, swapsRes] = await Promise.all([
      api.getListings(`?owner=${state.user._id}&limit=50`),
      api.getSwaps(''),
    ]);
    const activeListings = listingsRes.listings.length;
    const pendingSwaps = swapsRes.swaps.filter((s) => s.status === 'pending').length;
    const completed = swapsRes.swaps.filter((s) => s.status === 'completed').length;

    content.innerHTML = `
      <div class="stat-grid">
        <div class="stat-box"><b>${activeListings}</b><span>Active listings</span></div>
        <div class="stat-box"><b>${pendingSwaps}</b><span>Pending requests</span></div>
        <div class="stat-box"><b>${completed}</b><span>Swaps completed</span></div>
        <div class="stat-box"><b>${state.user.ratingAverage ? state.user.ratingAverage.toFixed(1) : '—'}</b><span>Average rating</span></div>
      </div>
      <div class="dash-card">
        <h3>Recent activity</h3>
        ${swapsRes.swaps.slice(0, 5).map((s) => `
          <div style="padding:10px 0; border-bottom:1px solid var(--color-line); display:flex; justify-content:space-between;">
            <span>${escapeHtml(s.requestedListing?.title || 'Listing')}</span>
            <span class="status-chip status-${s.status}">${s.status}</span>
          </div>`).join('') || '<p>No recent swap activity yet.</p>'}
      </div>`;
  } catch (err) {
    content.innerHTML = `<p>Could not load overview: ${escapeHtml(err.message)}</p>`;
  }
}

async function loadMyListings(content) {
  try {
    const { listings } = await api.getListings(`?owner=${state.user._id}&limit=50`);
    content.innerHTML = `
      <div class="dash-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="margin:0;">My listings (${listings.length})</h3>
          <a href="#/add-listing" data-link class="btn btn-primary btn-sm">+ New listing</a>
        </div>
        ${listings.length ? `<div class="listing-grid">${listings.map(listingCardHtml).join('')}</div>` : '<p>You haven\'t listed anything yet.</p>'}
      </div>`;
    attachWishlistHandlers(content);
  } catch (err) {
    content.innerHTML = `<p>Could not load listings: ${escapeHtml(err.message)}</p>`;
  }
}

async function loadMySwaps(content) {
  try {
    const { swaps } = await api.getSwaps('');
    content.innerHTML = `
      <div class="dash-card">
        <h3>Swap requests</h3>
        ${swaps.length ? `
        <table class="table-simple">
          <thead><tr><th>Item</th><th>With</th><th>Direction</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${swaps.map((s) => renderSwapRow(s)).join('')}
          </tbody>
        </table>` : '<p>No swap requests yet.</p>'}
      </div>`;

    content.querySelectorAll('[data-swap-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const [id, status] = btn.dataset.swapAction.split('|');
        btn.disabled = true;
        try {
          await api.updateSwap(id, status);
          toast(`Swap ${status}`, 'success');
          loadMySwaps(content);
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    content.innerHTML = `<p>Could not load swap requests: ${escapeHtml(err.message)}</p>`;
  }
}

function renderSwapRow(s) {
  const isRecipient = s.recipient._id === state.user._id;
  const direction = isRecipient ? 'Received' : 'Sent';
  const other = isRecipient ? s.requester : s.recipient;

  let actions = `<a href="#/swaps/${s._id}" data-link class="btn btn-ghost btn-sm">Chat</a>`;
  if (s.status === 'pending' && isRecipient) {
    actions += ` <button class="btn btn-primary btn-sm" data-swap-action="${s._id}|accepted">Accept</button>
                 <button class="btn btn-danger btn-sm" data-swap-action="${s._id}|rejected">Reject</button>`;
  }
  if (s.status === 'pending' && !isRecipient) {
    actions += ` <button class="btn btn-danger btn-sm" data-swap-action="${s._id}|cancelled">Cancel</button>`;
  }
  if (s.status === 'accepted') {
    actions += ` <button class="btn btn-primary btn-sm" data-swap-action="${s._id}|completed">Mark completed</button>`;
  }

  return `
    <tr>
      <td>${escapeHtml(s.requestedListing?.title || 'Listing removed')}</td>
      <td>${escapeHtml(other?.name || '')}</td>
      <td>${direction}</td>
      <td><span class="status-chip status-${s.status}">${s.status}</span></td>
      <td>${actions}</td>
    </tr>`;
}

async function loadProfileSettings(content) {
  const user = state.user;
  content.innerHTML = `
    <div class="dash-card">
      <h3>Profile settings</h3>
      <form id="profile-form">
        <div class="field">
          <label>Avatar</label>
          <div style="display:flex; align-items:center; gap:14px;">
            <img src="${user.avatar?.url || fallbackAvatar(user.name)}" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;"/>
            <input type="file" id="avatar-input" accept="image/*"/>
          </div>
        </div>
        <div class="field">
          <label for="p-name">Name</label>
          <input type="text" id="p-name" value="${escapeHtml(user.name)}" required/>
        </div>
        <div class="field">
          <label for="p-bio">Bio</label>
          <textarea id="p-bio" rows="3" maxlength="500">${escapeHtml(user.bio || '')}</textarea>
        </div>
        <div class="field">
          <label for="p-location">Location</label>
          <input type="text" id="p-location" value="${escapeHtml(user.location || '')}"/>
        </div>
        <button type="submit" class="btn btn-primary">Save changes</button>
      </form>
    </div>`;

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    const fd = new FormData();
    fd.append('name', document.getElementById('p-name').value.trim());
    fd.append('bio', document.getElementById('p-bio').value.trim());
    fd.append('location', document.getElementById('p-location').value.trim());
    const avatarFile = document.getElementById('avatar-input').files[0];
    if (avatarFile) fd.append('avatar', avatarFile);

    try {
      const { user } = await api.updateProfile(fd);
      state.user = user;
      toast('Profile updated successfully', 'success');
      loadProfileSettings(content);
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
    }
  });
}

async function renderWishlist(app) {
  app.innerHTML = `<div class="container"><div class="page-title-bar"><h1>My wishlist</h1></div><div id="wishlist-grid" class="listing-grid">${skeletonCards(3)}</div></div>`;
  try {
    const { wishlist } = await api.getWishlist();
    state.wishlistIds = new Set(wishlist.map((w) => w.listing._id));
    const grid = document.getElementById('wishlist-grid');
    grid.innerHTML = wishlist.length
      ? wishlist.map((w) => listingCardHtml(w.listing)).join('')
      : `<div class="empty-state"><h3>Your wishlist is empty</h3><p>Save items you love while browsing.</p></div>`;
    attachWishlistHandlers(grid);
  } catch (err) {
    document.getElementById('wishlist-grid').innerHTML = `<p>${escapeHtml(err.message)}</p>`;
  }
}

async function renderNotifications(app) {
  app.innerHTML = `<div class="container"><div class="page-title-bar"><h1>Notifications</h1></div><div id="notif-list" class="dash-card">${'<div class="page-loader"><div class="spinner"></div></div>'}</div></div>`;
  try {
    const { notifications } = await api.getNotifications();
    document.getElementById('notif-dot').classList.add('hidden');
    const list = document.getElementById('notif-list');
    list.innerHTML = notifications.length
      ? notifications.map((n) => `
        <div style="padding:12px 0; border-bottom:1px solid var(--color-line); display:flex; justify-content:space-between; ${n.read ? 'opacity:.6;' : ''}">
          <span>${escapeHtml(n.text)}</span>
          <span class="field-hint">${timeAgo(n.createdAt)}</span>
        </div>`).join('')
      : '<p>No notifications yet.</p>';
    await api.markAllNotificationsRead();
  } catch (err) {
    document.getElementById('notif-list').innerHTML = `<p>${escapeHtml(err.message)}</p>`;
  }
}

async function renderAdmin(app, params, query) {
  const tab = query.get('tab') || 'stats';
  app.innerHTML = `
    <div class="container">
      <div class="page-title-bar"><h1>Admin dashboard</h1></div>
      <div class="dash-layout">
        <nav class="dash-nav">
          <button data-tab="stats" class="${tab === 'stats' ? 'active' : ''}">Statistics</button>
          <button data-tab="users" class="${tab === 'users' ? 'active' : ''}">Users</button>
          <button data-tab="listings" class="${tab === 'listings' ? 'active' : ''}">Listings</button>
        </nav>
        <div id="admin-content"><div class="page-loader"><div class="spinner"></div></div></div>
      </div>
    </div>`;

  document.querySelectorAll('.dash-nav button').forEach((btn) => {
    btn.addEventListener('click', () => {
      history.replaceState(null, '', `#/admin?tab=${btn.dataset.tab}`);
      document.querySelectorAll('.dash-nav button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadAdminTab(btn.dataset.tab);
    });
  });

  loadAdminTab(tab);
}

async function loadAdminTab(tab) {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;
  if (tab === 'stats') return loadAdminStats(content);
  if (tab === 'users') return loadAdminUsers(content);
  if (tab === 'listings') return loadAdminListings(content);
}

async function loadAdminStats(content) {
  try {
    const { stats } = await api.getAdminStats();
    const maxCat = Math.max(1, ...stats.listingsByCategory.map((c) => c.count));

    content.innerHTML = `
      <div class="stat-grid">
        <div class="stat-box"><b>${stats.userCount}</b><span>Total users</span></div>
        <div class="stat-box"><b>${stats.listingCount}</b><span>Active listings</span></div>
        <div class="stat-box"><b>${stats.swapCount}</b><span>Total swap requests</span></div>
        <div class="stat-box"><b>${stats.completedSwaps}</b><span>Completed swaps</span></div>
      </div>
      <div class="dash-card">
        <h3>Listings by category</h3>
        ${stats.listingsByCategory.map((c) => `
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <span style="width:110px; font-size:.82rem;">${escapeHtml(c._id)}</span>
            <div style="flex:1; background:var(--color-secondary); border-radius:6px; height:14px;">
              <div style="width:${(c.count / maxCat) * 100}%; background:var(--color-primary); height:100%; border-radius:6px;"></div>
            </div>
            <span style="font-size:.82rem; width:30px; text-align:right;">${c.count}</span>
          </div>`).join('')}
      </div>
      <div class="dash-card">
        <h3>Swap request status breakdown</h3>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          ${stats.swapsByStatus.map((s) => `<span class="status-chip status-${s._id}">${s._id}: ${s.count}</span>`).join('')}
        </div>
      </div>
      <div class="dash-card">
        <h3>Signups (last 30 days)</h3>
        ${stats.signupsOverTime.length ? `
          <div style="display:flex; align-items:flex-end; gap:4px; height:120px;">
            ${stats.signupsOverTime.map((d) => `<div title="${d._id}: ${d.count}" style="flex:1; background:var(--color-accent); height:${Math.max(6, (d.count / Math.max(...stats.signupsOverTime.map(x=>x.count))) * 100)}%; border-radius:3px 3px 0 0;"></div>`).join('')}
          </div>` : '<p>No signups recorded in this period.</p>'}
      </div>`;
  } catch (err) {
    content.innerHTML = `<p>${escapeHtml(err.message)}</p>`;
  }
}

async function loadAdminUsers(content) {
  try {
    const { users } = await api.getAdminUsers('?limit=100');
    content.innerHTML = `
      <div class="dash-card">
        <h3>All users (${users.length})</h3>
        <table class="table-simple">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            ${users.map((u) => `
              <tr>
                <td>${escapeHtml(u.name)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td>${u.role}</td>
                <td>${u.isBanned ? '<span class="status-chip status-rejected">Banned</span>' : '<span class="status-chip status-accepted">Active</span>'}</td>
                <td>${formatDate(u.createdAt)}</td>
                <td>
                  ${u.role !== 'admin' ? `
                    <button class="btn btn-ghost btn-sm" data-ban="${u._id}">${u.isBanned ? 'Unban' : 'Ban'}</button>
                    <button class="btn btn-danger btn-sm" data-delete-user="${u._id}">Delete</button>` : '<span class="field-hint">—</span>'}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    content.querySelectorAll('[data-ban]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api.toggleBanUser(btn.dataset.ban);
          toast('User status updated', 'success');
          loadAdminUsers(content);
        } catch (err) { toast(err.message, 'error'); }
      });
    });
    content.querySelectorAll('[data-delete-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this user permanently?')) return;
        try {
          await api.deleteAdminUser(btn.dataset.deleteUser);
          toast('User deleted', 'success');
          loadAdminUsers(content);
        } catch (err) { toast(err.message, 'error'); }
      });
    });
  } catch (err) {
    content.innerHTML = `<p>${escapeHtml(err.message)}</p>`;
  }
}

async function loadAdminListings(content) {
  try {
    const { listings } = await api.getAdminListings('?limit=100');
    content.innerHTML = `
      <div class="dash-card">
        <h3>All listings (${listings.length})</h3>
        <table class="table-simple">
          <thead><tr><th>Title</th><th>Owner</th><th>Category</th><th>Status</th><th>Listed</th><th>Actions</th></tr></thead>
          <tbody>
            ${listings.map((l) => `
              <tr>
                <td><a href="#/listing/${l._id}" data-link>${escapeHtml(l.title)}</a></td>
                <td>${escapeHtml(l.owner?.name || '—')}</td>
                <td>${escapeHtml(l.category)}</td>
                <td><span class="status-chip status-${l.status}">${l.status}</span></td>
                <td>${formatDate(l.createdAt)}</td>
                <td><button class="btn btn-danger btn-sm" data-delete-listing="${l._id}">Remove</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    content.querySelectorAll('[data-delete-listing]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this listing?')) return;
        try {
          await api.deleteAdminListing(btn.dataset.deleteListing);
          toast('Listing removed', 'success');
          loadAdminListings(content);
        } catch (err) { toast(err.message, 'error'); }
      });
    });
  } catch (err) {
    content.innerHTML = `<p>${escapeHtml(err.message)}</p>`;
  }
}

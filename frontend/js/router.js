const routes = [
  { path: '/', handler: renderLanding },
  { path: '/browse', handler: renderBrowse },
  { path: '/how-it-works', handler: renderHowItWorks },
  { path: '/login', handler: renderLogin },
  { path: '/register', handler: renderRegister },
  { path: '/forgot-password', handler: renderForgotPassword },
  { path: '/listing/:id', handler: renderListingDetail },
  { path: '/add-listing', handler: renderAddListing, protected: true },
  { path: '/edit-listing/:id', handler: renderAddListing, protected: true },
  { path: '/dashboard', handler: renderDashboard, protected: true },
  { path: '/wishlist', handler: renderWishlist, protected: true },
  { path: '/notifications', handler: renderNotifications, protected: true },
  { path: '/swaps/:id', handler: renderChat, protected: true },
  { path: '/messages', handler: renderChat, protected: true },
  { path: '/profile/:id', handler: renderProfile },
  { path: '/admin', handler: renderAdmin, protected: true, adminOnly: true },
];

function matchRoute(hashPath) {
  const [pathOnly] = hashPath.split('?');
  const segments = pathOnly.split('/').filter(Boolean);

  for (const route of routes) {
    const routeSegments = route.path.split('/').filter(Boolean);
    if (routeSegments.length !== segments.length) continue;

    const params = {};
    let match = true;
    for (let i = 0; i < routeSegments.length; i++) {
      if (routeSegments[i].startsWith(':')) {
        params[routeSegments[i].slice(1)] = segments[i];
      } else if (routeSegments[i] !== segments[i]) {
        match = false;
        break;
      }
    }
    if (match) return { route, params };
  }
  return null;
}

function getQueryParams(hash) {
  const [, queryString] = hash.split('?');
  return new URLSearchParams(queryString || '');
}

function navigate(path) {
  window.location.hash = `#${path}`;
}

async function handleRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const matched = matchRoute(hash);
  const app = document.getElementById('app');

  window.scrollTo(0, 0);

  if (!matched) {
    app.innerHTML = renderNotFound();
    return;
  }

  const { route, params } = matched;

  if (route.protected && !state.user) {
    toast('Please log in to access that page', 'error');
    navigate('/login');
    return;
  }
  if (route.adminOnly && (!state.user || state.user.role !== 'admin')) {
    toast('Admin access required', 'error');
    navigate('/');
    return;
  }

  highlightActiveNav(hash);

  try {
    await route.handler(app, params, getQueryParams(hash));
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="empty-state"><h2>Something went wrong</h2><p>${escapeHtml(err.message || '')}</p></div>`;
  }
}

function highlightActiveNav(hash) {
  document.querySelectorAll('.main-nav a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href') === `#${hash.split('?')[0]}`);
  });
}

function renderNotFound() {
  return `
    <div class="error-page">
      <h1>404</h1>
      <h2>This page wandered off the rack</h2>
      <p>The page you're looking for doesn't exist.</p>
      <a href="#/" data-link class="btn btn-primary">Back to home</a>
    </div>`;
}

window.addEventListener('hashchange', handleRoute);

document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-link]');
  if (link) {
    e.preventDefault();
    const href = link.getAttribute('href').replace(/^#/, '');
    navigate(href);
    const nav = document.getElementById('main-nav');
    nav.classList.remove('mobile-open');
    nav.style.display = '';
  }
});

document.getElementById('nav-logout').addEventListener('click', async () => {
  try {
    await api.logout();
  } catch (e) {
    // ignore network errors on logout
  }
  clearSession();
  toast('Logged out successfully', 'success');
  navigate('/');
});

async function bootstrap() {
  document.getElementById('year').textContent = new Date().getFullYear();
  initTheme();
  initMobileNav();
  await loadSession();
  if (state.user && state.user.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach((el) => el.classList.remove('hidden'));
  }
  handleRoute();
}

bootstrap();

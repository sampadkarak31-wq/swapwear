function toast(message, type = 'default') {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(30px)';
    el.style.transition = 'all .25s ease';
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  const units = [
    ['year', 31536000], ['month', 2592000], ['day', 86400],
    ['hour', 3600], ['minute', 60],
  ];
  for (const [name, secs] of units) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val} ${name}${val > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

function renderStars(avg = 0) {
  const rounded = Math.round(avg);
  return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
}

function currency(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function initTheme() {
  const saved = localStorage.getItem('swapwear_theme');
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('swapwear_theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('swapwear_theme', 'dark');
    }
  });
}

function initMobileNav() {
  const toggle = document.getElementById('mobile-toggle');
  const nav = document.getElementById('main-nav');
  toggle.addEventListener('click', () => {
    nav.classList.toggle('mobile-open');
    nav.style.display = nav.classList.contains('mobile-open') ? 'flex' : '';
    if (nav.classList.contains('mobile-open')) {
      nav.style.position = 'absolute';
      nav.style.top = 'var(--header-h)';
      nav.style.left = '0';
      nav.style.right = '0';
      nav.style.background = 'var(--color-surface)';
      nav.style.flexDirection = 'column';
      nav.style.padding = '16px 24px';
      nav.style.borderBottom = '1px solid var(--color-line)';
    }
  });
}

function openLightbox(src, alt = '') {
  const tpl = document.getElementById('tpl-image-lightbox');
  const node = tpl.content.cloneNode(true);
  const box = node.querySelector('.lightbox');
  node.querySelector('img').src = src;
  node.querySelector('img').alt = alt;
  document.body.appendChild(node);
  const liveBox = document.getElementById('lightbox');
  liveBox.addEventListener('click', (e) => {
    if (e.target === liveBox || e.target.classList.contains('lightbox-close')) liveBox.remove();
  });
}

function skeletonCards(count = 6) {
  return Array.from({ length: count }).map(() => `<div class="skeleton skeleton-card"></div>`).join('');
}

function debounce(fn, delay = 350) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

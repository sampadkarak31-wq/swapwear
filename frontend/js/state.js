const state = {
  user: null,
  socket: null,
  wishlistIds: new Set(),
};

function setSession(token, user) {
  if (token) localStorage.setItem('swapwear_token', token);
  state.user = user || null;
  refreshAuthUI();
  connectSocket();
}

function clearSession() {
  localStorage.removeItem('swapwear_token');
  state.user = null;
  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }
  refreshAuthUI();
}

async function loadSession() {
  const token = getToken();
  if (!token) return refreshAuthUI();
  try {
    const { user } = await api.me();
    state.user = user;
  } catch (e) {
    localStorage.removeItem('swapwear_token');
    state.user = null;
  }
  refreshAuthUI();
  if (state.user) connectSocket();
}

function refreshAuthUI() {
  const isAuthed = !!state.user;
  document.querySelectorAll('.auth-only').forEach((el) => el.classList.toggle('hidden', !isAuthed));
  document.querySelectorAll('.guest-only').forEach((el) => el.classList.toggle('hidden', isAuthed));
  if (isAuthed && state.user.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach((el) => el.classList.remove('hidden'));
  }
}

function connectSocket() {
  const token = getToken();
  if (!token || state.socket) return;
  try {
    if (typeof io !== 'function') {
      console.warn('Socket.IO client not loaded — real-time chat will be unavailable this session.');
      return;
    }
    state.socket = io({ auth: { token } });
    state.socket.on('notification', () => {
      const dot = document.getElementById('notif-dot');
      if (dot) dot.classList.remove('hidden');
    });
  } catch (err) {
    console.warn('Socket connection failed:', err.message);
  }
}

function requireAuth() {
  if (!state.user) {
    toast('Please log in to continue', 'error');
    navigate('/login');
    return false;
  }
  return true;
}

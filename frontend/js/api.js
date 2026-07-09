// Lightweight fetch wrapper for the SwapWear API.
// Same-origin deployment: backend serves this frontend, so base is empty.
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('swapwear_token');
}

async function apiRequest(path, { method = 'GET', body, isForm = false, auth = true } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = { success: false, message: 'Unexpected server response' };
  }

  if (!res.ok || data.success === false) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

const api = {
  // Auth
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload, auth: false }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/auth/me'),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (token, password) =>
    apiRequest(`/auth/reset-password/${token}`, { method: 'POST', body: { password }, auth: false }),

  // Listings
  getListings: (query = '') => apiRequest(`/listings${query}`, { auth: false }),
  getListing: (id) => apiRequest(`/listings/${id}`, { auth: false }),
  createListing: (formData) => apiRequest('/listings', { method: 'POST', body: formData, isForm: true }),
  updateListing: (id, formData) => apiRequest(`/listings/${id}`, { method: 'PUT', body: formData, isForm: true }),
  deleteListing: (id) => apiRequest(`/listings/${id}`, { method: 'DELETE' }),

  // Users
  getUser: (id) => apiRequest(`/users/${id}`, { auth: false }),
  updateProfile: (formData) => apiRequest('/users/profile', { method: 'PATCH', body: formData, isForm: true }),
  toggleWishlist: (listingId) => apiRequest(`/users/wishlist/${listingId}`, { method: 'POST' }),
  getWishlist: () => apiRequest('/users/wishlist'),

  // Swaps
  createSwap: (payload) => apiRequest('/swaps', { method: 'POST', body: payload }),
  getSwaps: (query = '') => apiRequest(`/swaps${query}`),
  updateSwap: (id, status) => apiRequest(`/swaps/${id}`, { method: 'PATCH', body: { status } }),

  // Messages
  getMessages: (swapId) => apiRequest(`/messages/${swapId}`),
  sendMessage: (swapId, formData) => apiRequest(`/messages/${swapId}`, { method: 'POST', body: formData, isForm: true }),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'PATCH' }),

  // Admin
  getAdminStats: () => apiRequest('/admin/stats'),
  getAdminUsers: (query = '') => apiRequest(`/admin/users${query}`),
  deleteAdminUser: (id) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }),
  toggleBanUser: (id) => apiRequest(`/admin/users/${id}/ban`, { method: 'PATCH' }),
  getAdminListings: (query = '') => apiRequest(`/admin/listings${query}`),
  deleteAdminListing: (id) => apiRequest(`/admin/listings/${id}`, { method: 'DELETE' }),
};

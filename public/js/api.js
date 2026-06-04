/**
 * KSoM Guesthouse API Client
 * Centralized fetch wrapper with auth token management
 */

const API_BASE = (() => {
  const host = window.location.hostname;
  if (host === 'guesthouse.ksom.res.in') {
    return '/api';
  }
  if (host.endsWith('.pages.dev')) {
    return 'https://ksom-guesthouse-worker.office-896.workers.dev/api';
  }
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:8787/api';
  }
  return '/api';
})();

const TOKEN_KEY = 'ksom_token';
const USER_KEY  = 'ksom_user';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser:  () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } },
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
};

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, options);

  if (res.status === 401) {
    auth.clearSession();
    window.location.href = '/admin/login.html';
    return;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),

  // Auth
  login:  (email, password) => request('POST', '/auth/login', { email, password }),
  logout: ()                 => request('POST', '/auth/logout'),
  me:     ()                 => request('GET',  '/auth/me'),

  // Rooms
  getRooms:  (params = {}) => {
    const qs = typeof params === 'string' ? `type=${params}` : new URLSearchParams(params).toString();
    return request('GET', `/rooms${qs ? `?${qs}` : ''}`);
  },
  getRoom:   (id)      => request('GET', `/rooms/${id}`),
  createRoom:(body)    => request('POST',   '/rooms', body),
  updateRoom:(id, body)=> request('PUT',    `/rooms/${id}`, body),
  deleteRoom:(id)      => request('DELETE', `/rooms/${id}`),

  // Bookings
  getBookings:  (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/bookings${qs ? `?${qs}` : ''}`);
  },
  getBooking:   (id)      => request('GET',    `/bookings/${id}`),
  createBooking:(body)    => request('POST',    '/bookings', body),
  updateBooking:(id, body)=> request('PUT',     `/bookings/${id}`, body),
  cancelBooking:(id)      => request('DELETE',  `/bookings/${id}`),

  // Guests
  getGuests:  (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/guests${qs ? `?${qs}` : ''}`);
  },
  getGuest:   (id)      => request('GET', `/guests/${id}`),
  updateGuest:(id, body)=> request('PUT', `/guests/${id}`, body),

  // Availability
  getAvailability: (start, end, roomId) => {
    const params = new URLSearchParams({ start, end });
    if (roomId) params.append('room_id', roomId);
    return request('GET', `/availability?${params}`);
  },

  // Invoices
  getInvoices:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/invoices${qs ? `?${qs}` : ''}`);
  },
  getInvoice:   (id)      => request('GET',  `/invoices/${id}`),
  createInvoice:(body)    => request('POST',  '/invoices', body),
  updateInvoice:(id, body)=> request('PUT',   `/invoices/${id}`, body),

  // Users
  getUsers:   ()          => request('GET',    '/users'),
  createUser: (body)      => request('POST',   '/users', body),
  updateUser: (id, body)  => request('PUT',    `/users/${id}`, body),
  deleteUser: (id)        => request('DELETE', `/users/${id}`),

  // Stats
  getStats: () => request('GET', '/stats'),

  // Site Settings (CMS)
  getSettings:    ()     => request('GET', '/settings'),
  updateSettings: (body) => request('PUT', '/settings', body),
};

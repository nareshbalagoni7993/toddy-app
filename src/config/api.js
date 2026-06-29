import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Base URL ─────────────────────────────────────────────────────────────────
// Use your machine's local IP when testing on a physical device.
// For Android Emulator: use 10.0.2.2. For iOS Simulator: use localhost.
export const BASE_URL = 'http://192.168.1.100:5000'; // ← change to your LAN IP
export const API_URL = `${BASE_URL}/api`;

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach access token ─────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('tc_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — auto-refresh on 401 TOKEN_EXPIRED ─────────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const data = error.response?.data;

    if (error.response?.status === 401 && data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = await AsyncStorage.getItem('tc_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data: refreshData } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = refreshData;

        await AsyncStorage.multiSet([
          ['tc_access_token', accessToken],
          ['tc_refresh_token', newRefresh],
        ]);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Clear tokens and force logout
        await AsyncStorage.multiRemove(['tc_access_token', 'tc_refresh_token', 'tc_user']);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Named API methods ─────────────────────────────────────────────────────────

// Auth
export const authAPI = {
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  updatePushToken: (pushToken) => api.put('/auth/push-token', { pushToken }),
};

// Shops (public — no auth needed)
export const shopsAPI = {
  getNearby: () => api.get('/admin/nearby'),
};

// Orders
export const ordersAPI = {
  place: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status, rejectionReason) =>
    api.patch(`/orders/${id}/status`, { status, rejectionReason }),
};

// Products
export const productsAPI = {
  getByAdmin: (adminId) => api.get('/products', { params: { adminId } }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  toggle: (id) => api.patch(`/products/${id}/toggle`),
  delete: (id) => api.delete(`/products/${id}`),
};

// Admin self-management
export const adminAPI = {
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data) => api.put('/admin/profile', data),
  getDashboard: () => api.get('/admin/dashboard'),
  getStock: () => api.get('/admin/stock'),
  updateStock: (data) => api.put('/admin/stock', data),
};

// Notifications
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Super Admin
export const superAdminAPI = {
  getDashboard: () => api.get('/super/dashboard'),
  getAdmins: (params) => api.get('/super/admins', { params }),
  getAdmin: (id) => api.get(`/super/admins/${id}`),
  createAdmin: (data) => api.post('/super/admins', data),
  updateAdmin: (id, data) => api.put(`/super/admins/${id}`, data),
  toggleAdmin: (id) => api.patch(`/super/admins/${id}/toggle`),
  deleteAdmin: (id) => api.delete(`/super/admins/${id}`),
  getOrders: (params) => api.get('/super/orders', { params }),
  getUsers: (params) => api.get('/super/users', { params }),
};

export default api;

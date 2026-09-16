import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3002/api';

export const apiClient = axios.create({ baseURL: API_BASE_URL });

// Attach the stored tenant token to every request. Distinct storage keys
// from the Super Admin frontend (decoration_admin_*) — these are two
// separate apps that could plausibly be open in the same browser.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('decoration_tenant_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 anywhere means the token is missing/expired — send back to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('decoration_tenant_token');
      localStorage.removeItem('decoration_tenant_session');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // Token is handled via httpOnly cookie; keep hook for future headers if needed
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error?.response?.data?.message || 'Request failed';
    console.error('API error:', message);

    if (error?.response?.status === 401) {
      // If token is stale (password changed / expired), force a re-login so a fresh cookie is issued
      if (/Password recently changed|Token expired|Invalid token/i.test(message)) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

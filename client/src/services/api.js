import axios from 'axios';

const api = axios.create({
  baseURL: 'https://notemind-ai-rhmn.onrender.com',
  timeout: 180000, // 3 minutes — AI processing takes time
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('notemind_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('notemind_token');
      localStorage.removeItem('notemind_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

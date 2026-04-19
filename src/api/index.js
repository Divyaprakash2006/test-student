import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://test-backend-8l27.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('student_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

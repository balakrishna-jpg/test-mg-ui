// /app/utils/axios.js
import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000';  // API base URL
const domain = 'https://electionapi.aadhan.in/'
// const domain = 'http://0.0.0.0:8080/'

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: domain,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to the request headers if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  // If token exists, add Authorization header
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

// Handle response errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If there is no response, it's a network error (e.g., offline)
    if (!error.response) {
      console.warn("Network Error: Make sure you have an active internet connection.");
      // We still reject the promise so callers can handle it, 
      // but the unhandledrejection listener in entry.client.tsx will suppress the global crash overlay.
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401) {
      // Only redirect to login if user is already authenticated (has a token)
      // This prevents redirect during login attempts with wrong credentials
      const token = localStorage.getItem('token');
      const isLoginRequest = error.config?.url?.includes('/auth/login');

      if (token && !isLoginRequest) {
        // Token exists but is invalid/expired - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_info');
        window.location.href = '/login';
      }
      // If it's a login request, let the error pass through to be handled by the login function
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
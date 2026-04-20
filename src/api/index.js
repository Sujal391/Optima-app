import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://192.168.1.29:5000';

export const BASE_URL = API_URL;

console.log('API BASE_URL:', BASE_URL);

const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';
  if (typeof error === 'string') return error;

  // 1. Trust server-provided messages first
  const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
  if (serverMsg && typeof serverMsg === 'string') return serverMsg;

  // 2. Handle known Axios/Network issues
  if (error.message === 'Network Error') {
    return 'Connection failed. Please check your internet and try again.';
  }
  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again later.';
  }

  // 3. Fallback to status code based messages if no server message
  if (error.response) {
    const status = error.response.status;
    switch (status) {
      case 400: return 'Invalid information provided. Please check and try again.';
      case 401: return 'Your session has expired. Please sign in again.';
      case 403: return 'Access denied. You do not have permission for this.';
      case 404: return 'The requested information was not found.';
      case 422: return 'Could not process some details. Please check your input.';
      case 500: return 'Internal server error. Our team has been notified.';
      case 502: case 503: case 504: return 'Server is temporarily unavailable. Please try again in a moment.';
    }
    return `Error: ${status} - Something went wrong.`;
  }

  return error.message || 'Something went wrong. Please try again.';
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach token automatically to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Log FormData requests
  if (config.data instanceof FormData) {
    console.log('FormData request to:', config.url);
    console.log('FormData keys:', Array.from(config.data._parts || []).map(p => p[0]));
  }

  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.log('API Error - Status:', error?.response?.status);
    console.log('API Error - Data:', error?.response?.data);
    console.log('API Error - Message:', error?.message);
    console.log('API Error - Code:', error?.code);

    const normalizedError = new Error(getErrorMessage(error));
    normalizedError.status = error?.response?.status;
    normalizedError.data = error?.response?.data;
    normalizedError.originalError = error;
    return Promise.reject(normalizedError);
  }
);

// ─── Auth ───────────────────────────────────────────────
export const login = (userCode, password) =>
  api.post('/auth/login', { userCode, password });

export const register = (data) =>
  api.post('/auth/register/customer', data);

// ─── Products ───────────────────────────────────────────
export const getProducts = () =>
  api.get('/user/products');

export const getOffers = () => api.get('/user/offers');

export const getBanners = () => api.get('/user/banners');

// ─── Cart ────────────────────────────────────────────────
export const getCart = () => api.get('/user/cart');

export const addToCart = (product, boxes) =>
  api.post('/user/cart', { product, boxes });

export const removeFromCart = ({ product }) =>
  api.delete('/user/cart/product', { data: { product } });

// ─── Orders ──────────────────────────────────────────────
export const createOrder = (payload) =>
  api.post('/user/create-order', payload);

export const getOrderHistory = () => api.get('/user/orders/history');

// ─── Payment ─────────────────────────────────────────────
export const submitPayment = (formData) =>
  api.post('/user/submit-payment-details', formData, {
    headers: {
      // Must be set explicitly so the browser/RN runtime sets the correct boundary
      'Content-Type': 'multipart/form-data',
    },
    // Bypass axios default JSON serialization — required for FormData in React Native
    transformRequest: (data) => data,
    timeout: 30000, // uploads can be slow; give extra time
  });

export const getPaymentDetails = (paymentId) =>
  api.get(`/user/payments/${paymentId}`);

// ─── Profile ─────────────────────────────────────────────
export const getProfile = () => api.get('/user/profile');

export const getProfileWithToken = (token) =>
  api.get('/user/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateProfile = (data) => api.put('/user/profile', data);

export const changePassword = (currentPassword, newPassword) =>
  api.post('/user/profile/change-password', { currentPassword, newPassword });

// ─── Marketing ───────────────────────────────────────────
export const getMyActivities = () => api.get('/marketing/activities');

export const getActivityById = (id) => api.get(`/marketing/activities/${id}`);

export const addActivity = (formData) =>
  api.post('/marketing/activities', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: (data) => data,
    timeout: 30000,
  });

export default api;

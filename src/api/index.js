import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Change this to your deployed server URL before Play Store build
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL; // 10.0.2.2 = localhost on Android emulator

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach token automatically to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ─── Auth ───────────────────────────────────────────────
export const login = (userCode, password) =>
  api.post('/auth/login', { userCode, password });

export const register = (data) =>
  api.post('/auth/register', data);

// ─── Products ───────────────────────────────────────────
export const getProducts = () =>
  api.get('/user/products');

export const getOffers = () => api.get('/offers');

export const getBanners = () => api.get('/banners');

// ─── Cart ────────────────────────────────────────────────
export const getCart = () => api.get('/cart');

export const addToCart = (productId, quantity, boxes) =>
  api.post('/cart', { productId, quantity, boxes });

export const removeFromCart = (productId) =>
  api.delete('/cart/product', { data: { productId } });

// ─── Orders ──────────────────────────────────────────────
export const createOrder = (products, totalAmount, address) =>
  api.post('/create-order', { products, totalAmount, address });

export const getOrderHistory = () => api.get('/user/orders/history');

// ─── Payment ─────────────────────────────────────────────
export const submitPayment = (formData) =>
  api.post('/submit-payment-details', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getPaymentDetails = (paymentId) =>
  api.get(`/payments/${paymentId}`);

// ─── Profile ─────────────────────────────────────────────
export const getProfile = () => api.get('/user/profile');

export const updateProfile = (data) => api.put('/user/profile', data);

export const changePassword = (currentPassword, newPassword) =>
  api.post('/user/profile/change-password', { currentPassword, newPassword });

export default api;

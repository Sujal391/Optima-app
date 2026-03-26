import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileWithToken } from '../api';

const AuthContext = createContext(null);

const normalizeProfile = (data, fallback = {}) => {
  const user = data?.user || data || {};
  const customerDetails = user.customerDetails || fallback.customerDetails || {};
  const address = customerDetails.address || fallback.addressObj || {};

  return {
    ...fallback,
    ...user,
    userCode: user.userCode || fallback.userCode || '',
    role: user.role || fallback.role || 'user',
    photo: user.photo ?? fallback.photo ?? null,
    firmName: customerDetails.firmName || user.firmName || fallback.firmName || '',
    customerDetails: {
      ...customerDetails,
      address,
    },
    addressObj: address,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        // Marketing users have no /user/profile endpoint — skip hydration
        const isMarketing = parsedUser?.role === 'marketing';
        if (!isMarketing && (!parsedUser?.name || !parsedUser?.phoneNumber || !parsedUser?.customerDetails)) {
          await hydrateUserProfile(storedToken, parsedUser);
        }
      }
    } catch (e) {
      console.log('Auth load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const hydrateUserProfile = async (tokenValue, fallbackUser = null) => {
    try {
      const res = await getProfileWithToken(tokenValue);
      const normalized = normalizeProfile(res.data, fallbackUser || {});
      await AsyncStorage.setItem('user', JSON.stringify(normalized));
      setUser(normalized);
      return normalized;
    } catch (e) {
      const normalizedFallback = normalizeProfile(fallbackUser || {});
      await AsyncStorage.setItem('user', JSON.stringify(normalizedFallback));
      setUser(normalizedFallback);
      return normalizedFallback;
    }
  };

  const signIn = async (tokenValue, userData) => {
    const normalizedUser = normalizeProfile(userData || {});
    await AsyncStorage.setItem('token', tokenValue);
    await AsyncStorage.setItem('user', JSON.stringify(normalizedUser));
    setToken(tokenValue);
    setUser(normalizedUser);
    // Marketing users have no /user/profile endpoint — skip hydration
    if (normalizedUser.role !== 'marketing') {
      await hydrateUserProfile(tokenValue, normalizedUser);
    }
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    const normalizedUser = normalizeProfile(userData, user || {});
    setUser(normalizedUser);
    AsyncStorage.setItem('user', JSON.stringify(normalizedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';

const ToastContext = createContext(null);

const TOAST_TYPES = {
  success: { bg: COLORS.successLight, text: COLORS.success, icon: '✓' },
  error:   { bg: COLORS.errorLight,   text: COLORS.error,   icon: '✕' },
  warning: { bg: COLORS.warningLight, text: COLORS.warning, icon: '⚠' },
  info:    { bg: '#E8F0FE',           text: '#1A73E8',       icon: 'ℹ' },
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timer = useRef(null);

  const show = useCallback((message, type = 'success', duration = 2800) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type });
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true, tension: 80 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80 }),
    ]).start();
    timer.current = setTimeout(hide, duration);
  }, []);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, []);

  const cfg = toast ? TOAST_TYPES[toast.type] || TOAST_TYPES.info : null;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && cfg && (
        <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
          <View style={[styles.toastInner, { backgroundColor: cfg.bg }]}>
            <View style={[styles.iconCircle, { backgroundColor: cfg.text + '22' }]}>
              <Text style={[styles.icon, { color: cfg.text }]}>{cfg.icon}</Text>
            </View>
            <Text style={[styles.message, { color: cfg.text }]} numberOfLines={2}>
              {toast.message}
            </Text>
            <TouchableOpacity onPress={hide} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: cfg.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 52,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 9999,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOW.md,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  message: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    lineHeight: 18,
  },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 11 },
});

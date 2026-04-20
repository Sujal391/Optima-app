import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  Playfair_700Bold,
  Playfair_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ToastProvider } from './src/components/Toast';
import { AlertProvider } from './src/components/CustomAlert';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/theme';

try {
  SplashScreen.preventAutoHideAsync();
} catch (_) {}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          Playfair_700Bold,
          Playfair_700Bold_Italic,
          DMSans_400Regular,
          DMSans_500Medium,
          DMSans_700Bold,
        });
        if (mounted) {
          setFontsLoaded(true);
        }
      } catch (error) {
        if (mounted) {
          setFontError(error);
          setFontsLoaded(true);
        }
      }
    };

    loadFonts();

    return () => {
      mounted = false;
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (!fontsLoaded) return;
    await SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (fontError) {
    console.warn('Font loading error:', fontError?.message || String(fontError));
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }} onLayout={onLayoutRootView}>
      <ErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <AlertProvider>
                <AppNavigator />
              </AlertProvider>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ErrorBoundary>
    </View>
  );
}

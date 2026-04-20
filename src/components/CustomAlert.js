import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Modal, TouchableOpacity,
  Dimensions, TouchableWithoutFeedback
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Button } from './UI';

const { width, height } = Dimensions.get('window');

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    buttons: [],
  });

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const alert = useCallback((title, message, buttons = []) => {
    setConfig({
      title,
      message,
      buttons: buttons.length > 0 ? buttons : [{ text: 'OK', onPress: () => {} }],
    });
    setVisible(true);
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const hide = useCallback((callback) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      if (typeof callback === 'function') {
        callback();
      }
    });
  }, [scaleAnim, opacityAnim]);

  const handleButtonPress = (btn) => {
    hide(() => {
      if (btn.onPress) btn.onPress();
    });
  };

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={() => hide()}
      >
        <TouchableWithoutFeedback onPress={() => hide()}>
          <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.alertBox, 
                  { 
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
                <View style={styles.content}>
                  <Text style={styles.title}>{config.title}</Text>
                  <Text style={styles.message}>{config.message}</Text>
                </View>
                
                <View style={[
                  styles.actionRow,
                  config.buttons.length > 2 && styles.actionRowVertical
                ]}>
                  {config.buttons.map((btn, idx) => (
                    <Button
                      key={idx}
                      title={btn.text}
                      onPress={() => handleButtonPress(btn)}
                      variant={
                        btn.style === 'destructive' ? 'danger' : 
                        btn.style === 'cancel' ? 'outline' : 
                        idx === 0 ? 'primary' : 'secondary'
                      }
                      style={[
                        styles.actionBtn,
                        config.buttons.length > 2 && styles.actionBtnVertical
                      ]}
                      size="md"
                    />
                  ))}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...SHADOW.lg,
  },
  content: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.lg,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    padding: SPACING.md,
    paddingTop: 0,
    gap: SPACING.sm,
  },
  actionRowVertical: {
    flexDirection: 'column',
    paddingBottom: SPACING.lg,
  },
  actionBtn: {
    flex: 1,
    minWidth: 100,
  },
  actionBtnVertical: {
    flex: 0,
    width: '100%',
  }
});

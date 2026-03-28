import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme';
import { Button, Input, BrandMark, Icon } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { login } from '../api';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email/User code is required';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await login(email.trim().toLowerCase(), password);
      // Response: { token, role, userCode }  OR  { token, user: {...} }
      const { token, user, role, userCode } = res.data;
      // Pass role + userCode so AuthContext stores the correct role without hydration
      await signIn(token, user || { role, userCode });
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBg}>
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />
        </View>

        <View style={styles.logoSection}>
          <BrandMark size={76} style={styles.brandMark} />
          <Text style={styles.brandName}>Optima Polyplast</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to your account</Text>

          <Input
            label="Email or User Code"
            placeholder="e.g. USER-000021"
            value={email}
            onChangeText={setEmail}
            keyboardType="default"
            autoCapitalize="none"
            error={errors.email}
            style={{ marginTop: SPACING.xl }}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            error={errors.password}
            rightIcon={(
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Icon name={showPass ? 'eye-off' : 'eye'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={{ marginTop: SPACING.xl }}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerLink}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: SPACING.xxxl,
  },
  headerBg: {
    height: 260,
    backgroundColor: COLORS.burgundy,
    overflow: 'hidden',
    position: 'relative',
  },
  headerCircle1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.burgundyLight,
    top: -80,
    right: -60,
    opacity: 0.5,
  },
  headerCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.gold,
    bottom: -60,
    left: -40,
    opacity: 0.15,
  },
  logoSection: {
    position: 'absolute',
    top: 58,
    alignSelf: 'center',
    alignItems: 'center',
  },
  brandMark: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  brandName: {
    fontSize: TYPOGRAPHY.xxxl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textInverse,
    letterSpacing: 0.6,
    marginTop: 14,
  },
  formCard: {
    marginTop: -30,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    shadowColor: '#1A0A0E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  heading: {
    fontSize: TYPOGRAPHY.xxl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  subheading: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
    gap: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    fontFamily: 'DMSans_400Regular',
  },
  registerBtn: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    fontFamily: 'DMSans_400Regular',
  },
  registerLink: {
    color: COLORS.burgundy,
    fontFamily: 'DMSans_700Bold',
  },
});

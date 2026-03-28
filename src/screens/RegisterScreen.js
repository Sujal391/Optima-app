import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme';
import { Button, Input, Icon } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { register } from '../api';

export default function RegisterScreen({ navigation }) {
  const { signIn } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phoneNumber: '',
    firmName: '', gstNumber: '', panNumber: '', address: '', city: '', state: '', pinCode: '', password: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    
    // Phone: Exactly 10 digits
    if (!form.phoneNumber || !/^\d{10}$/.test(form.phoneNumber)) {
      e.phoneNumber = 'Exactly 10 digits required';
    }

    // Password: Min 6 characters
    if (!form.password || form.password.length < 6) {
      e.password = 'Minimum 6 characters';
    }

    // Pincode: Exactly 6 digits
    if (!form.pinCode || !/^\d{6}$/.test(form.pinCode)) {
      e.pinCode = 'Exactly 6 digits required';
    }

    // GST: Exactly 15 digits alphanumeric (optional in form, but validate if entered)
    if (form.gstNumber && !/^[A-Z0-9]{15}$/.test(form.gstNumber.toUpperCase())) {
      e.gstNumber = 'Exactly 15-digit alphanumeric required';
    }

    // PAN: Exactly 10 digits alphanumeric (optional in form, but validate if entered)
    if (form.panNumber && !/^[A-Z0-9]{10}$/.test(form.panNumber.toUpperCase())) {
      e.panNumber = 'Exactly 10-digit alphanumeric required';
    }

    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        firmName: form.firmName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        gstNumber: form.gstNumber.trim(),
        panNumber: form.panNumber.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pinCode: form.pinCode.trim(),
      };
      const res = await register(payload);
      const { token, user, ...authData } = res.data;
      await signIn(token, user || authData);
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.heading}>Create Account</Text>
            <Text style={styles.subheading}>Create your Optima Polyplast account</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <View style={styles.sectionLabel}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionLabelText}>Personal Info</Text>
            </View>

            <Input label="Full Name" placeholder="John Doe" value={form.name}
              onChangeText={set('name')} autoCapitalize="words" error={errors.name} />
            <Input label="Email" placeholder="you@example.com" value={form.email}
              onChangeText={set('email')} keyboardType="email-address" error={errors.email} />
            <Input label="Phone Number" placeholder="9876543210" value={form.phoneNumber}
              onChangeText={set('phoneNumber')} keyboardType="phone-pad" error={errors.phoneNumber} />
            <Input
              label="Password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChangeText={set('password')}
              secureTextEntry={!showPass}
              error={errors.password}
              rightIcon={(
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Icon name={showPass ? 'eye-off' : 'eye'} size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionLabel}>
              <View style={[styles.sectionDot, { backgroundColor: COLORS.gold }]} />
              <Text style={styles.sectionLabelText}>Business Info <Text style={styles.optional}>(Optional)</Text></Text>
            </View>

            <Input label="Firm / Company Name" placeholder="My Business Pvt Ltd"
              value={form.firmName} onChangeText={set('firmName')} autoCapitalize="words" />
            <Input label="GST Number" placeholder="GSTIN123456789"
              value={form.gstNumber} onChangeText={set('gstNumber')} autoCapitalize="characters"
              error={errors.gstNumber} />
            <Input label="PAN Number" placeholder="ABCDE1234F"
              value={form.panNumber} onChangeText={set('panNumber')} autoCapitalize="characters"
              error={errors.panNumber} />
            <Input label="Address" placeholder="Street, City, State, PIN"
              value={form.address} onChangeText={set('address')}
              multiline numberOfLines={3} autoCapitalize="sentences" />
            <Input label="City" placeholder="Ahmedabad"
              value={form.city} onChangeText={set('city')}
              autoCapitalize="words" error={errors.city} />
            <Input label="State" placeholder="Gujarat"
              value={form.state} onChangeText={set('state')}
              autoCapitalize="words" error={errors.state} />
            <Input label="Pin Code" placeholder="380001"
              value={form.pinCode} onChangeText={set('pinCode')}
              keyboardType="number-pad" error={errors.pinCode} maxLength={6} />
          </View>

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={{ marginTop: SPACING.md }}
          />

          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Sign in</Text>
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
  header: {
    backgroundColor: COLORS.burgundy,
    padding: SPACING.xl,
    paddingTop: 60,
    paddingBottom: SPACING.xxl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  heading: {
    fontSize: TYPOGRAPHY.xxl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textInverse,
  },
  subheading: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.goldLight,
    marginTop: 2,
  },
  form: {
    padding: SPACING.xl,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.burgundy,
  },
  sectionLabelText: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  optional: {
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sm,
  },
  loginBtn: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  loginText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    fontFamily: 'DMSans_400Regular',
  },
  loginLink: {
    color: COLORS.burgundy,
    fontFamily: 'DMSans_700Bold',
  },
});

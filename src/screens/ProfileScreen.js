import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Button, Input, Divider } from '../components/UI';
import { getProfile, updateProfile, changePassword } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, signOut, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [form, setForm] = useState({});
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      // API: { user: { name, email, phoneNumber, createdAt,
      //                customerDetails: { firmName, photo,
      //                  address: { address, city, state, pinCode } } } }
      const data = res.data?.user || res.data;
      const cd   = data?.customerDetails || {};
      const addr = cd.address || {};           // address is an object, not a string

      setProfile({ ...data, firmName: cd.firmName || '', addressObj: addr });
      setForm({
        name:        data.name        || '',
        phoneNumber: data.phoneNumber || '',
        firmName:    cd.firmName      || '',
        addressLine: addr.address     || '',
        city:        addr.city        || '',
        state:       addr.state       || '',
        pinCode:     addr.pinCode     || '',
      });
    } catch (e) {
      console.log('Profile error:', e);
    }
  };

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const setPass = (key) => (val) => setPassForm((f) => ({ ...f, [key]: val }));

  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }
    setLoading(true);
    try {
      // Send nested structure matching what the API expects
      const payload = {
        name:        form.name,
        phoneNumber: form.phoneNumber,
        customerDetails: {
          firmName: form.firmName,
          address: {
            address: form.addressLine,
            city:    form.city,
            state:   form.state,
            pinCode: form.pinCode,
          },
        },
      };
      await updateProfile(payload);
      updateUser({ ...user, name: form.name, phoneNumber: form.phoneNumber });
      setProfile((p) => ({
        ...p,
        name:        form.name,
        phoneNumber: form.phoneNumber,
        firmName:    form.firmName,
        addressObj:  { address: form.addressLine, city: form.city, state: form.state, pinCode: form.pinCode },
      }));
      setEditing(false);
      Alert.alert('Saved!', 'Profile updated successfully.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passForm.current || !passForm.newPass) {
      Alert.alert('Error', 'Please fill all password fields.');
      return;
    }
    if (passForm.newPass !== passForm.confirm) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (passForm.newPass.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }
    setPassLoading(true);
    try {
      await changePassword(passForm.current, passForm.newPass);
      setPassForm({ current: '', newPass: '', confirm: '' });
      setChangingPass(false);
      Alert.alert('Done!', 'Password changed successfully.');
    } catch (e) {
      Alert.alert('Failed', e.message);
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const displayProfile = profile || user;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xxxl }}>
        {/* Profile Header */}
        <View style={styles.headerBg}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayProfile?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          </View>
          <Text style={styles.profileName}>{displayProfile?.name || 'My Profile'}</Text>
          <Text style={styles.profileEmail}>{displayProfile?.email}</Text>
          {displayProfile?.firmName && (
            <View style={styles.firmBadge}>
              <Text style={styles.firmText}>🏢 {displayProfile.firmName}</Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📦</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={styles.statLabel}>My Orders</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🛒</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
              <Text style={styles.statLabel}>My Cart</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🏷️</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products', { showOffers: true })}>
              <Text style={styles.statLabel}>Offers</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info / Edit Form */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Personal Info</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>{editing ? 'Cancel' : '✏️ Edit'}</Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <>
              <Input label="Full Name" value={form.name} onChangeText={set('name')}
                autoCapitalize="words" error={errors.name} />
              <Input label="Phone Number" value={form.phoneNumber} onChangeText={set('phoneNumber')}
                keyboardType="phone-pad" />
              <Input label="Firm / Company" value={form.firmName} onChangeText={set('firmName')}
                autoCapitalize="words" />
              <Input label="Street / House No." value={form.addressLine} onChangeText={set('addressLine')}
                autoCapitalize="sentences" />
              <Input label="City" value={form.city} onChangeText={set('city')}
                autoCapitalize="words" />
              <Input label="State" value={form.state} onChangeText={set('state')}
                autoCapitalize="words" />
              <Input label="Pin Code" value={form.pinCode} onChangeText={set('pinCode')}
                keyboardType="number-pad" />
              <Button title="Save Changes" onPress={handleSaveProfile} loading={loading} />
            </>
          ) : (
            <View style={styles.infoList}>
              {(() => {
                const addr = displayProfile?.addressObj || {};
                const addrStr = [addr.address, addr.city, addr.state, addr.pinCode]
                  .filter(Boolean).join(', ');
                return [
                  { label: 'Email',   value: displayProfile?.email },
                  { label: 'Phone',   value: displayProfile?.phoneNumber },
                  { label: 'Firm',    value: displayProfile?.firmName },
                  { label: 'Address', value: addrStr || null },
                ].filter((item) => item.value).map(({ label, value }) => (
                  <View key={label}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{label}</Text>
                      <Text style={styles.infoValue}>{value}</Text>
                    </View>
                    <Divider />
                  </View>
                ));
              })()}
            </View>
          )}
        </View>

        {/* Change Password */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeaderRow}
            onPress={() => setChangingPass(!changingPass)}
          >
            <Text style={styles.sectionTitle}>🔒 Change Password</Text>
            <Text style={styles.chevron}>{changingPass ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {changingPass && (
            <>
              <Input label="Current Password" placeholder="••••••••"
                value={passForm.current} onChangeText={setPass('current')} secureTextEntry />
              <Input label="New Password" placeholder="Min. 6 characters"
                value={passForm.newPass} onChangeText={setPass('newPass')} secureTextEntry />
              <Input label="Confirm New Password" placeholder="Re-enter new password"
                value={passForm.confirm} onChangeText={setPass('confirm')} secureTextEntry />
              <Button title="Update Password" onPress={handleChangePassword} loading={passLoading} />
            </>
          )}
        </View>

        {/* Logout */}
        <View style={{ paddingHorizontal: SPACING.lg }}>
          <Button
            title="Sign Out"
            variant="danger"
            onPress={handleLogout}
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    backgroundColor: COLORS.burgundy,
    paddingTop: 60,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.xxxl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  profileName: {
    fontSize: TYPOGRAPHY.xxl,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  profileEmail: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.goldLight,
    marginTop: 4,
  },
  firmBadge: {
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  firmText: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: -20,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
  },
  statIcon: { fontSize: 22 },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.burgundy,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  section: {
    margin: SPACING.lg,
    marginBottom: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  editBtn: {
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  editBtnText: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.burgundy,
  },
  chevron: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
  },
  infoList: { gap: 0 },
  infoRow: {
    paddingVertical: SPACING.sm,
    gap: 4,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textPrimary,
  },
});

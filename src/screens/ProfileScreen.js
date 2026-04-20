import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, RefreshControl
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Button, Input, Icon } from '../components/UI';
import { getProfile, updateProfile, changePassword } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../components/CustomAlert';

export default function ProfileScreen({ navigation }) {
  const { user, signOut, updateUser } = useAuth();
  const { alert } = useAlert();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [form, setForm] = useState({});
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      const data = res.data?.user || res.data;
      const cd = data?.customerDetails || {};
      const addr = cd.address || {};

      setProfile({
        ...data,
        userCode: data.userCode || cd.userCode || '',
        firmName: cd.firmName || '',
        addressObj: addr
      });
      setForm({
        name: data.name || '',
        phoneNumber: data.phoneNumber || '',
        firmName: cd.firmName || '',
        addressLine: addr.address || '',
        city: addr.city || '',
        state: addr.state || '',
        pinCode: addr.pinCode || '',
      });
    } catch (e) {
      console.log('Profile error:', e?.message || String(e));
    }
  };

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const setPass = (key) => (val) => setPassForm((f) => ({ ...f, [key]: val }));

  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }
    if (!form.phoneNumber || !/^\d{10}$/.test(form.phoneNumber)) {
      setErrors({ phoneNumber: 'Exactly 10 digits required' });
      return;
    }
    if (form.pinCode && !/^\d{6}$/.test(form.pinCode)) {
      setErrors({ pinCode: 'Exactly 6 digits required' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        phoneNumber: form.phoneNumber,
        customerDetails: {
          address: {
            address: form.addressLine,
            city: form.city,
            state: form.state,
            pinCode: form.pinCode,
          },
        },
      };
      await updateProfile(payload);
      updateUser({ ...user, name: form.name, phoneNumber: form.phoneNumber });
      setProfile((p) => ({
        ...p,
        name: form.name,
        phoneNumber: form.phoneNumber,
        firmName: form.firmName,
        addressObj: {
          address: form.addressLine,
          city: form.city,
          state: form.state,
          pinCode: form.pinCode,
        },
      }));
      setEditing(false);
      alert('Saved!', 'Profile updated successfully.');
    } catch (e) {
      alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passForm.current || !passForm.newPass) {
      alert('Error', 'Please fill all password fields.');
      return;
    }
    if (passForm.newPass !== passForm.confirm) {
      alert('Error', 'New passwords do not match.');
      return;
    }
    if (passForm.newPass.length < 6) {
      alert('Error', 'New password must be at least 6 characters.');
      return;
    }
    setPassLoading(true);
    try {
      await changePassword(passForm.current, passForm.newPass);
      setPassForm({ current: '', newPass: '', confirm: '' });
      setChangingPass(false);
      alert('Done!', 'Password changed successfully.');
    } catch (e) {
      const msg = e.message?.toLowerCase();
      if (msg?.includes('wrong') || msg?.includes('incorrect') || msg?.includes('mismatch')) {
        alert('Update Failed', 'Current password is incorrect');
      } else {
        alert('Failed', e.message);
      }
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => {
    alert('Sign Out', 'Are you sure you want to sign out?', [
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
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: SPACING.xxxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.burgundy} />
        }
      >
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
          {!!displayProfile?.userCode && (
            <View style={styles.userCodeBadge}>
              <Text style={styles.userCodeText}>{displayProfile.userCode}</Text>
            </View>
          )}
          {displayProfile?.firmName && (
            <View style={styles.firmBadge}>
              <View style={styles.firmBadgeInner}>
                <Icon name="briefcase" size={12} color="#fff" />
                <Text style={styles.firmText}>{displayProfile.firmName}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Orders')} activeOpacity={0.8}>
            <View style={styles.statIconWrap}>
              <Icon name="archive" size={18} color={COLORS.burgundy} />
            </View>
            <Text style={styles.statLabel}>My Orders</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Cart')} activeOpacity={0.8}>
            <View style={styles.statIconWrap}>
              <Icon name="shopping-cart" size={18} color={COLORS.burgundy} />
            </View>
            <Text style={styles.statLabel}>My Cart</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Products')} activeOpacity={0.8}>
            <View style={styles.statIconWrap}>
              <Icon name="package" size={18} color={COLORS.burgundy} />
            </View>
            <Text style={styles.statLabel}>Products</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Personal Info</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>{editing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <>
              <Input label="Full Name" value={form.name} onChangeText={set('name')}
                autoCapitalize="words" error={errors.name} />
              <Input label="Phone Number" value={form.phoneNumber} onChangeText={set('phoneNumber')}
                keyboardType="phone-pad" error={errors.phoneNumber} maxLength={10} />
              <Input label="Firm / Company" value={form.firmName} editable={false}
                autoCapitalize="words" />
              <Input label="Street / House No." value={form.addressLine} onChangeText={set('addressLine')}
                autoCapitalize="sentences" />
              <Input label="City" value={form.city} onChangeText={set('city')}
                autoCapitalize="words" />
              <Input label="State" value={form.state} onChangeText={set('state')}
                autoCapitalize="words" />
              <Input label="Pin Code" value={form.pinCode} onChangeText={set('pinCode')}
                keyboardType="number-pad" error={errors.pinCode} maxLength={6} />
              <Button title="Save Changes" onPress={handleSaveProfile} loading={loading} />
            </>
          ) : (
            <View style={styles.infoList}>
              {(() => {
                const addr = displayProfile?.addressObj || {};
                const addrStr = [addr.address, addr.city, addr.state, addr.pinCode]
                  .filter(Boolean).join(', ');
                const rows = [
                  { label: 'User Code', value: displayProfile?.userCode },
                  { label: 'Email', value: displayProfile?.email },
                  { label: 'Phone', value: displayProfile?.phoneNumber },
                  { label: 'Firm', value: displayProfile?.firmName },
                  { label: 'Address', value: addrStr || null },
                ].filter((item) => item.value);
                return rows.map(({ label, value }) => (
                  <View key={label} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{value}</Text>
                  </View>
                ));
              })()}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeaderRow}
            onPress={() => setChangingPass(!changingPass)}
          >
            <View style={styles.sectionTitleRow}>
              <Icon name="lock" size={16} color={COLORS.textPrimary} />
              <Text style={styles.sectionTitle}>Change Password</Text>
            </View>
            <Icon
              name={changingPass ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>

          {changingPass && (
            <>
              <Input
                label="Current Password"
                placeholder="Enter current password"
                value={passForm.current}
                onChangeText={setPass('current')}
                secureTextEntry={!showPass.current}
                rightIcon={(
                  <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, current: !s.current }))}>
                    <Icon name={showPass.current ? 'eye-off' : 'eye'} size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              />
              <Input
                label="New Password"
                placeholder="Min. 6 characters"
                value={passForm.newPass}
                onChangeText={setPass('newPass')}
                secureTextEntry={!showPass.new}
                rightIcon={(
                  <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, new: !s.new }))}>
                    <Icon name={showPass.new ? 'eye-off' : 'eye'} size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              />
              <Input
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={passForm.confirm}
                onChangeText={setPass('confirm')}
                secureTextEntry={!showPass.confirm}
                rightIcon={(
                  <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, confirm: !s.confirm }))}>
                    <Icon name={showPass.confirm ? 'eye-off' : 'eye'} size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              />
              <Button title="Update Password" onPress={handleChangePassword} loading={passLoading} />
            </>
          )}
        </View>

        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl }}>
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
    color: COLORS.cream,
    marginTop: 4,
  },
  firmBadge: {
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  firmBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  firmText: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    color: '#fff',
  },
  userCodeBadge: {
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  userCodeText: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
    letterSpacing: 0.4,
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
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.burgundyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

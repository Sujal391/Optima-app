import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Button, Input, Divider } from '../components/UI';
import { createOrder } from '../api';
import { useAuth } from '../context/AuthContext';

export default function CheckoutScreen({ navigation, route }) {
  const { items = [], total = 0, subtotal = 0 } = route.params || {};
  const { user } = useAuth();
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!address.trim() || address.length < 10) e.address = 'Please enter a complete delivery address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const orderProducts = items.map((item) => {
        const product = item.product || item;
        return {
          product: product._id || product.id,
          quantity: item.quantity || 1,
          price: product.offerPrice || product.price || item.price || 0,
        };
      });

      const res = await createOrder(orderProducts, total, address);
      const order = res.data;

      navigation.replace('Payment', {
        order,
        total,
        items,
      });
    } catch (e) {
      Alert.alert('Order Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const deliveryFee = subtotal > 2000 ? 0 : 99;

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progress}>
          {['Cart', 'Checkout', 'Payment', 'Done'].map((step, i) => (
            <React.Fragment key={step}>
              <View style={[styles.progressStep, i <= 1 && styles.progressStepActive]}>
                <View style={[styles.progressDot, i <= 1 && styles.progressDotActive]}>
                  <Text style={[styles.progressDotText, i <= 1 && styles.progressDotTextActive]}>
                    {i < 1 ? '✓' : i + 1}
                  </Text>
                </View>
                <Text style={[styles.progressLabel, i <= 1 && styles.progressLabelActive]}>{step}</Text>
              </View>
              {i < 3 && <View style={[styles.progressLine, i < 1 && styles.progressLineActive]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Delivery Address</Text>
          <Input
            label="Full Address"
            placeholder="House no., Street, Area, City, State, PIN"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={4}
            error={errors.address}
            autoCapitalize="sentences"
          />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Order Summary</Text>
          {items.slice(0, 5).map((item, i) => {
            const product = item.product || item;
            const price = product.offerPrice || product.price || item.price || 0;
            return (
              <View key={i} style={styles.orderItem}>
                <Text style={styles.orderItemName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.orderItemDetail}>x{item.quantity || 1}</Text>
                <Text style={styles.orderItemPrice}>₹{(price * (item.quantity || 1)).toLocaleString()}</Text>
              </View>
            );
          })}
          {items.length > 5 && (
            <Text style={styles.moreItems}>+ {items.length - 5} more items</Text>
          )}
        </View>

        {/* Payment Breakdown */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, deliveryFee === 0 && { color: COLORS.success }]}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>
          <Divider style={{ marginVertical: SPACING.md }} />
          <View style={styles.billRow}>
            <Text style={styles.billTotalLabel}>Grand Total</Text>
            <Text style={styles.billTotalValue}>₹{total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            💳 Payment via Razorpay on next step. COD not available.
          </Text>
        </View>

        <Button
          title="Place Order →"
          onPress={handlePlaceOrder}
          loading={loading}
          size="lg"
          style={{ marginHorizontal: SPACING.lg, marginBottom: SPACING.xxxl }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingBottom: SPACING.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: TYPOGRAPHY.lg },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressStep: { alignItems: 'center', gap: 4 },
  progressStepActive: {},
  progressDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: COLORS.burgundy },
  progressDotText: {
    fontSize: 11, fontFamily: 'DMSans_700Bold', color: COLORS.textMuted,
  },
  progressDotTextActive: { color: '#fff' },
  progressLabel: {
    fontSize: 10, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted,
  },
  progressLabelActive: { color: COLORS.burgundy, fontFamily: 'DMSans_500Medium' },
  progressLine: {
    flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4, marginBottom: 14,
  },
  progressLineActive: { backgroundColor: COLORS.burgundy },
  section: {
    margin: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  orderItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.sm,
  },
  orderItemName: {
    flex: 1, fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_400Regular', color: COLORS.textSecondary,
  },
  orderItemDetail: {
    fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_500Medium', color: COLORS.textMuted,
  },
  orderItemPrice: {
    fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary,
    minWidth: 70, textAlign: 'right',
  },
  moreItems: {
    fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted,
    textAlign: 'center', marginTop: SPACING.sm,
  },
  billCard: {
    margin: SPACING.lg,
    marginTop: 0,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  billTitle: {
    fontSize: TYPOGRAPHY.md, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  billRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm,
  },
  billLabel: {
    fontSize: TYPOGRAPHY.base, fontFamily: 'DMSans_400Regular', color: COLORS.textSecondary,
  },
  billValue: {
    fontSize: TYPOGRAPHY.base, fontFamily: 'DMSans_500Medium', color: COLORS.textPrimary,
  },
  billTotalLabel: {
    fontSize: TYPOGRAPHY.lg, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary,
  },
  billTotalValue: {
    fontSize: TYPOGRAPHY.xl, fontFamily: 'DMSans_700Bold', color: COLORS.burgundy,
  },
  noteBox: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.lg,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.md, padding: SPACING.md,
  },
  noteText: {
    fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_400Regular', color: COLORS.warning,
    lineHeight: 20,
  },
});

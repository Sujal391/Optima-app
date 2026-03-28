import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Button, Icon } from '../components/UI';
import { useCart } from '../context/CartContext';

function ProgressHeader({ onDone }) {
  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onDone}>
          <Icon name="check-circle" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Success</Text>
      </View>

      <View style={styles.progress}>
        {['Cart', 'Checkout', 'Payment', 'Done'].map((step, i) => (
          <React.Fragment key={step}>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotActive]}>
                <Text style={[styles.progressDotText, styles.progressDotTextActive]}>
                  {i < 3 ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[styles.progressLabel, styles.progressLabelActive]}>{step}</Text>
            </View>
            {i < 3 ? <View style={[styles.progressLine, styles.progressLineActive]} /> : null}
          </React.Fragment>
        ))}
      </View>
    </>
  );
}

export default function OrderSuccessScreen({ navigation, route }) {
  const { orderId, total, itemCount, paymentMode, remainingAmount } = route.params || {};
  const { refreshCart } = useCart();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    refreshCart();
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const goHome = () => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  const goOrders = () => navigation.navigate('Orders');
  const subtitle = paymentMode === 'Cash'
    ? 'Your order has been placed successfully. Payment will be collected offline.'
    : 'Your order and payment proof have been submitted successfully.';

  return (
    <View style={styles.container}>
      <ProgressHeader onDone={goHome} />

      <View style={styles.contentWrap}>
        <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkmark}>✓</Text>
        </Animated.View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Order Placed Successfully</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order ID</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{orderId || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Items</Text>
              <Text style={styles.detailValue}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Mode</Text>
              <Text style={styles.detailValue}>{paymentMode || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total</Text>
              <Text style={[styles.detailValue, styles.totalValue]}>Rs.{total?.toLocaleString()}</Text>
            </View>
            {remainingAmount !== undefined && (
              <View style={[styles.detailRow, { marginTop: SPACING.xs }]}>
                <Text style={styles.detailLabel}>Remaining Balance</Text>
                <Text style={[styles.detailValue, { color: COLORS.error }]}>
                  Rs.{remainingAmount.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          <Button
            title="View My Orders"
            onPress={goOrders}
            size="lg"
            style={{ marginBottom: SPACING.md }}
          />
          <Button
            title="Continue Shopping"
            variant="outline"
            onPress={goHome}
            size="lg"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
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
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: COLORS.burgundy },
  progressDotText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textMuted,
  },
  progressDotTextActive: { color: '#fff' },
  progressLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
  },
  progressLabelActive: {
    color: COLORS.burgundy,
    fontFamily: 'DMSans_500Medium',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
    marginBottom: 14,
  },
  progressLineActive: { backgroundColor: COLORS.burgundy },
  contentWrap: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    ...SHADOW.lg,
  },
  checkmark: {
    fontSize: 48,
    color: '#fff',
    fontFamily: 'DMSans_700Bold',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  detailCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  totalValue: {
    color: COLORS.burgundy,
  },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Button, Input, Divider } from '../components/UI';
import { submitPayment } from '../api';

export default function PaymentScreen({ navigation, route }) {
  const { order, total, items } = route.params || {};
  const orderId = order?._id || order?.id || order?.orderId;

  const [razorpayPaymentId, setRazorpayPaymentId] = useState('');
  const [razorpayOrderId, setRazorpayOrderId] = useState('');
  const [razorpaySignature, setRazorpaySignature] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!razorpayPaymentId.trim()) e.paymentId = 'Razorpay Payment ID is required';
    if (!razorpayOrderId.trim()) e.orderId = 'Razorpay Order ID is required';
    if (!screenshot) e.screenshot = 'Payment screenshot is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickScreenshot = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]) {
      setScreenshot(result.assets[0]);
    }
  };

  const handleSubmitPayment = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('razorpay_payment_id', razorpayPaymentId.trim());
      formData.append('razorpay_order_id', razorpayOrderId.trim());
      formData.append('razorpay_signature', razorpaySignature.trim());
      formData.append('amount', String(total));
      formData.append('screenshot', {
        uri: screenshot.uri,
        type: 'image/jpeg',
        name: `payment_${Date.now()}.jpg`,
      });

      await submitPayment(formData);

      navigation.replace('OrderSuccess', {
        orderId,
        total,
        itemCount: items?.length || 0,
      });
    } catch (e) {
      Alert.alert('Payment Failed', e.message || 'Could not submit payment details.');
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payment Details</Text>
          <Text style={styles.headerSubtitle}>Step 3 of 4</Text>
        </View>

        {/* Order Info Box */}
        <View style={styles.orderInfoBox}>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Order ID</Text>
            <Text style={styles.orderInfoValue} numberOfLines={1}>{orderId}</Text>
          </View>
          <Divider style={{ marginVertical: SPACING.sm }} />
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Amount to Pay</Text>
            <Text style={styles.orderInfoAmount}>₹{total?.toLocaleString()}</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>How to pay</Text>
          {[
            { step: '1', text: 'Open Razorpay, Google Pay, or your bank app' },
            { step: '2', text: `Transfer ₹${total?.toLocaleString()} to our account` },
            { step: '3', text: 'Take a screenshot of the successful payment' },
            { step: '4', text: 'Enter the payment IDs below and upload the screenshot' },
          ].map(({ step, text }) => (
            <View key={step} style={styles.instructionRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{step}</Text>
              </View>
              <Text style={styles.instructionText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Payment Form */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Payment Confirmation</Text>

          <Input
            label="Razorpay Payment ID"
            placeholder="pay_XXXXXXXXXXXXXXXXXX"
            value={razorpayPaymentId}
            onChangeText={setRazorpayPaymentId}
            autoCapitalize="none"
            error={errors.paymentId}
          />
          <Input
            label="Razorpay Order ID"
            placeholder="order_XXXXXXXXXXXXXXXXXX"
            value={razorpayOrderId}
            onChangeText={setRazorpayOrderId}
            autoCapitalize="none"
            error={errors.orderId}
          />
          <Input
            label="Payment Signature (Optional)"
            placeholder="Razorpay signature"
            value={razorpaySignature}
            onChangeText={setRazorpaySignature}
            autoCapitalize="none"
          />

          {/* Screenshot Upload */}
          <Text style={styles.uploadLabel}>PAYMENT SCREENSHOT</Text>
          <TouchableOpacity
            style={[styles.uploadBox, errors.screenshot && { borderColor: COLORS.error }]}
            onPress={pickScreenshot}
          >
            {screenshot ? (
              <>
                <Image source={{ uri: screenshot.uri }} style={styles.uploadPreview} resizeMode="cover" />
                <View style={styles.changeOverlay}>
                  <Text style={styles.changeText}>Tap to change</Text>
                </View>
              </>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadTitle}>Upload Screenshot</Text>
                <Text style={styles.uploadHint}>Tap to select from gallery</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.screenshot && (
            <Text style={styles.uploadError}>{errors.screenshot}</Text>
          )}
        </View>

        <Button
          title="Submit Payment Details"
          onPress={handleSubmitPayment}
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
    backgroundColor: COLORS.burgundy,
    padding: SPACING.xl,
    paddingTop: 56,
    paddingBottom: SPACING.xxl,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xxl,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.goldLight,
    marginTop: 4,
  },
  orderInfoBox: {
    margin: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: -SPACING.xl,
    ...SHADOW.md,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfoLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
  },
  orderInfoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  orderInfoAmount: {
    fontSize: TYPOGRAPHY.xl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.burgundy,
  },
  instructionCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.goldMuted,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  instructionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumber: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  instructionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  formSection: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  uploadLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  uploadBox: {
    height: 180,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundDark,
  },
  uploadPreview: {
    width: '100%',
    height: '100%',
  },
  changeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_500Medium',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  uploadIcon: { fontSize: 36 },
  uploadTitle: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textSecondary,
  },
  uploadHint: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
  },
  uploadError: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.error,
    marginTop: 4,
    fontFamily: 'DMSans_400Regular',
  },
});

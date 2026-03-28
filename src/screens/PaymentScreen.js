import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Button, Input, Divider, Icon } from '../components/UI';
import { submitPayment, createOrder } from '../api';
import { useCart } from '../context/CartContext';

function ProgressHeader({ currentStep, onBack }) {
  const handleStepPress = (stepIndex) => {
    if (stepIndex < currentStep) {
      onBack(stepIndex);
    }
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onBack(currentStep - 1)}>
          <Icon name="arrow-left" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
      </View>

      <View style={styles.progress}>
        {['Cart', 'Checkout', 'Payment', 'Done'].map((step, i) => {
          const active = i <= currentStep;
          const lineActive = i < currentStep;
          return (
            <React.Fragment key={step}>
              <TouchableOpacity
                style={styles.progressStep}
                onPress={() => handleStepPress(i)}
                disabled={i >= currentStep}
                activeOpacity={0.8}
              >
                <View style={[styles.progressDot, active && styles.progressDotActive]}>
                  <Text style={[styles.progressDotText, active && styles.progressDotTextActive]}>
                    {i < currentStep ? '✓' : i + 1}
                  </Text>
                </View>
                <Text style={[styles.progressLabel, active && styles.progressLabelActive]}>{step}</Text>
              </TouchableOpacity>
              {i < 3 ? <View style={[styles.progressLine, lineActive && styles.progressLineActive]} /> : null}
            </React.Fragment>
          );
        })}
      </View>
    </>
  );
}

export default function PaymentScreen({ navigation, route }) {
  const { order: initialOrder, total, items, subtotal, totalBoxes, gst, shippingAddress } = route.params || {};
  const { refreshCart } = useCart();
  const [order, setOrder] = useState(initialOrder);
  const orderId = order?._id || order?.id || order?.orderId || order?.paymentId;

  console.log('Order object received:', order);
  console.log('Extracted orderId:', orderId);

  const [paymentId, setPaymentId] = useState(order?.paymentId || order?.payment?._id || '');
  const [referenceId, setReferenceId] = useState('');
  const [submittedAmount, setSubmittedAmount] = useState(String(total || ''));
  const [paymentType, setPaymentType] = useState('partial'); // Defaulting to partial as per image
  const [paymentMode, setPaymentMode] = useState('online'); // Defaulting to online as per image
  const [screenshot, setScreenshot] = useState(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  const handleBackNavigation = (targetStep) => {
    if (targetStep <= 0) {
      navigation.navigate('MainTabs', { screen: 'Cart' });
      return;
    }
    navigation.goBack();
  };

  const validate = () => {
    const nextErrors = {};
    if (!paymentId.trim()) nextErrors.paymentId = 'Payment ID is required';
    if (!referenceId.trim() || referenceId.trim().length < 12) {
      nextErrors.referenceId = 'Reference ID must be at least 12 characters';
    }
    if (!submittedAmount.trim()) nextErrors.submittedAmount = 'Submitted amount is required';
    if (!screenshot) nextErrors.screenshot = 'Payment screenshot is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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

  const handleContinue = async () => {
    if (!validate()) return;
    setShowConfirmModal(true);
  };

  const processPayment = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const currentPaymentId = order?.paymentId || order?.payment?._id;

      if (!currentPaymentId) {
        throw new Error('Payment ID not found. Please try again.');
      }

      // Submit payment details
      const formData = new FormData();
      formData.append('paymentId', currentPaymentId);
      formData.append('referenceId', referenceId.trim());
      formData.append('submittedAmount', submittedAmount.trim());
      formData.append('paymentType', paymentType.trim());
      formData.append('paymentMode', 'online'); 
      formData.append('paymentMethod', 'online'); 

      const mimeType = screenshot.mimeType || screenshot.type || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      formData.append('screenshot', {
        uri: screenshot.uri,
        type: mimeType,
        name: screenshot.fileName || `payment_${Date.now()}.${ext}`,
      });

      console.log('[API Call] submitPayment being called. Payment ID:', currentPaymentId);

      const res = await submitPayment(formData);
      console.log('[API Success] submitPayment called successfully.');
      
      const paymentData = res.data?.payment || {};
      const remainingAmount = paymentData.remainingAmount;

      navigation.replace('OrderSuccess', {
        order: order,
        orderId,
        total,
        remainingAmount,
        itemCount: items?.length || 0,
        paymentMode: 'Online',
      });
    } catch (e) {
      console.error('[API Error] submitPayment failed. Reason:', e.message || 'Unknown error');
      console.error('Full Error Object:', e);
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
        <ProgressHeader currentStep={2} onBack={handleBackNavigation} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scan & Pay</Text>
          <View style={styles.qrCard}>
            <Image source={require('../../assets/image.png')} style={styles.qrImage} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <Input
            label="Payment ID"
            placeholder="MongoDB payment ID"
            value={paymentId}
            editable={false}
            selectTextOnFocus={false}
            autoCapitalize="none"
            error={errors.paymentId}
          />
          <Input
            label="Reference ID"
            placeholder="Transaction / UTR / Reference ID"
            value={referenceId}
            onChangeText={setReferenceId}
            autoCapitalize="none"
            error={errors.referenceId}
          />
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => setShowTypeDropdown(!showTypeDropdown)}
          >
            <Input
              label="Payment Type"
              placeholder="Select Type"
              value={paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}
              editable={false}
              rightIcon={(
                <Icon name={showTypeDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
              )}
            />
          </TouchableOpacity>

          {showTypeDropdown && (
            <View style={styles.dropdownMenu}>
              {['partial', 'completed'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setPaymentType(type);
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownText,
                    paymentType === type && { color: COLORS.burgundy, fontFamily: 'DMSans_700Bold' }
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                  {paymentType === type && <Icon name="check" size={16} color={COLORS.burgundy} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Input
            label="Payment Mode"
            value={paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1)}
            editable={false}
          />
          <Input
            label="Submitted Amount"
            placeholder="Amount paid"
            value={submittedAmount}
            onChangeText={setSubmittedAmount}
            keyboardType="decimal-pad"
            error={errors.submittedAmount}
          />

          <Text style={styles.uploadLabel}>PAYMENT SCREENSHOT</Text>
          <TouchableOpacity
            style={[styles.uploadBox, errors.screenshot && styles.uploadBoxError]}
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
                <Icon name="image" size={28} color={COLORS.textMuted} />
                <Text style={styles.uploadTitle}>Upload Screenshot</Text>
                <Text style={styles.uploadHint}>Pick the payment proof image</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.screenshot ? <Text style={styles.uploadError}>{errors.screenshot}</Text> : null}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order ID</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>{orderId}</Text>
          </View>
          <Divider style={{ marginVertical: SPACING.sm }} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryAmount}>Rs.{total?.toLocaleString()}</Text>
          </View>
        </View>

        <Button
          title={loading ? 'Submitting...' : 'Continue'}
          onPress={handleContinue}
          loading={loading}
          size="lg"
          style={{ marginHorizontal: SPACING.lg, marginBottom: SPACING.xxxl }}
        />

        <Modal
          visible={showConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Icon name="info" size={24} color={COLORS.burgundy} />
                <Text style={styles.modalTitle}>Confirm Order</Text>
              </View>
              
              <Text style={styles.modalMessage}>
                Please Note: Delivery charges are not included in the total and must be settled directly at the time of delivery.
              </Text>

              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => setIsTermsAccepted(!isTermsAccepted)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isTermsAccepted && styles.checkboxActive]}>
                  {isTermsAccepted && <Icon name="check" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>I agree to the Terms & Conditions</Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <Button 
                  title="Cancel" 
                  variant="outline" 
                  onPress={() => setShowConfirmModal(false)}
                  style={{ flex: 1 }}
                />
                <Button 
                  title="Confirm" 
                  onPress={processPayment}
                  disabled={!isTermsAccepted}
                  style={{ flex: 1.5 }}
                />
              </View>
            </View>
          </View>
        </Modal>
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
  section: {
    margin: SPACING.lg,
    marginBottom: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  qrCard: {
    borderRadius: RADIUS.xl,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOW.sm,
  },
  qrTitle: {
    fontSize: TYPOGRAPHY.xxl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  qrUpi: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.lg,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.burgundy,
    textAlign: 'center',
  },
  qrHint: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  qrImage: {
    width: 240,
    height: 240,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  qrBank: {
    marginTop: SPACING.lg,
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.burgundy,
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
  uploadBoxError: {
    borderColor: COLORS.error,
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
  summaryCard: {
    margin: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textPrimary,
  },
  summaryAmount: {
    fontSize: TYPOGRAPHY.xl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.burgundy,
  },
  dropdownMenu: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownText: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOW.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  modalMessage: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.burgundy,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.burgundy,
  },
  checkboxLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
});

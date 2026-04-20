import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme';
import { Button, Input, Divider, Icon } from '../components/UI';
import { createOrder } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAlert } from '../components/CustomAlert';


const getShippingAddress = (user) => {
  const address = user?.addressObj || user?.customerDetails?.address || {};
  return {
    address: address.address || '',
    city: address.city || '',
    state: address.state || '',
    pinCode: address.pinCode || '',
  };
};

export default function CheckoutScreen({ navigation, route }) {
  const { items = [], total = 0, subtotal = 0, totalBoxes = 0, gst = 0 } = route.params || {};
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const { alert } = useAlert();
  const profileAddress = getShippingAddress(user);
  const [address, setAddress] = useState(profileAddress.address);
  const [city, setCity] = useState(profileAddress.city);
  const [stateName, setStateName] = useState(profileAddress.state);
  const [pinCode, setPinCode] = useState(profileAddress.pinCode);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const nextAddress = getShippingAddress(user);
    setAddress(nextAddress.address);
    setCity(nextAddress.city);
    setStateName(nextAddress.state);
    setPinCode(nextAddress.pinCode);
  }, [user]);

  const validate = () => {
    const nextErrors = {};
    if (!address.trim() || address.trim().length < 5) {
      nextErrors.address = 'Please Enter Full Address.';
    }
    if (!city.trim()) {
      nextErrors.city = 'Please Enter City.';
    }
    if (!stateName.trim()) {
      nextErrors.state = 'Please Enter State.';
    }
    if (!/^\d{6}$/.test(pinCode.trim())) {
      nextErrors.pinCode = 'Please Enter Valid 6-Digit PIN Code.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) {
      return;
    }

    alert(
      'Payment Mode',
      'Select how you want to pay for this order.',
      [
        {
          text: 'Cash (COD)',
          onPress: () => processOrder('COD'),
        },
        {
          text: 'Online',
          onPress: () => processOrder('online'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const processOrder = async (method) => {
    setLoading(true);
    const payload = {
      paymentMethod: 'COD', // Always use COD for backend compatibility
      deliveryChoice: 'homeDelivery',
      shippingAddress: {
        address: address.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pinCode: pinCode.trim(),
      },
      products: items.map((item) => {
        const product = item.product || item;
        return {
          productId: product._id || product.id,
          boxes: item.boxes || item.quantity || 1,
        };
      }),
    };

    console.log(`[API Call] createOrder being called for ${method} mode. Payload:`, payload);

    try {
      const res = await createOrder(payload);
      const order = res.data;
      console.log('[API Success] createOrder called successfully. Order ID:', order?._id || order?.id);
      
      refreshCart();
      
      if (method === 'online') {
        navigation.navigate('Payment', {
          order,
          total,
          items,
          subtotal,
          totalBoxes,
          gst,
          shippingAddress: {
            address: address.trim(),
            city: city.trim(),
            state: stateName.trim(),
            pinCode: pinCode.trim(),
          },
        });
      } else {
        navigation.replace('OrderSuccess', {
          order,
          orderId: order?._id || order?.id || order?.orderId,
          total,
          itemCount: items?.length || 0,
          paymentMode: 'Cash',
        });
      }
    } catch (e) {
      console.error(`[API Error] createOrder failed for ${method}. Reason:`, e.message || 'Unknown error');
      console.error('Full Error Object:', e);
      alert('Order Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const deliveryFee = subtotal > 2000 ? 0 : 99;
  const goToStep = (stepIndex) => {
    if (stepIndex === 0) {
      navigation.goBack();
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
            <Icon name="arrow-left" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>

        <View style={styles.progress}>
          {['Cart', 'Checkout', 'Payment', 'Done'].map((step, i) => (
            <React.Fragment key={step}>
              <TouchableOpacity
                style={[styles.progressStep, i <= 1 && styles.progressStepActive]}
                onPress={() => goToStep(i)}
                disabled={i !== 0}
                activeOpacity={0.8}
              >
                <View style={[styles.progressDot, i <= 1 && styles.progressDotActive]}>
                  <Text style={[styles.progressDotText, i <= 1 && styles.progressDotTextActive]}>
                    {i < 1 ? '✓' : i + 1}
                  </Text>
                </View>
                <Text style={[styles.progressLabel, i <= 1 && styles.progressLabelActive]}>{step}</Text>
              </TouchableOpacity>
              {i < 3 && <View style={[styles.progressLine, i < 1 && styles.progressLineActive]} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Icon name="map-pin" size={16} color={COLORS.textPrimary} />
            <Text style={styles.sectionTitle}>Shipping Address</Text>
          </View>
          <Input
            label="Address"
            placeholder="Near Bus Stand"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            error={errors.address}
            autoCapitalize="sentences"
          />
          <Input
            label="City"
            placeholder="Ahmedabad"
            value={city}
            onChangeText={setCity}
            error={errors.city}
            autoCapitalize="words"
          />
          <Input
            label="State"
            placeholder="Gujarat"
            value={stateName}
            onChangeText={setStateName}
            error={errors.state}
            autoCapitalize="words"
          />
          <Input
            label="PIN Code"
            placeholder="380001"
            value={pinCode}
            onChangeText={setPinCode}
            error={errors.pinCode}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Icon name="shopping-cart" size={16} color={COLORS.textPrimary} />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.boxSummary}>
            <Text style={styles.boxSummaryLabel}>Total boxes</Text>
            <Text style={styles.boxSummaryValue}>{totalBoxes}</Text>
          </View>
          {errors.totalBoxes ? (
            <Text style={styles.boxError}>{errors.totalBoxes}</Text>
          ) : null}
          {items.slice(0, 5).map((item, i) => {
            const product = item.product || item;
            const price = product.offerPrice || product.price || item.price || 0;
            const boxes = item.boxes || item.quantity || 1;
            return (
              <View key={i} style={styles.orderItem}>
                <Text style={styles.orderItemName} numberOfLines={1}>{product.name} - {product.category}</Text>
                <Text style={styles.orderItemDetail}>{boxes} boxes</Text>
                <Text style={styles.orderItemPrice}>Rs.{(price * boxes).toLocaleString()}</Text>
              </View>
            );
          })}
          {items.length > 5 ? (
            <Text style={styles.moreItems}>+ {items.length - 5} more items</Text>
          ) : null}
        </View>

        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>Rs.{subtotal.toLocaleString()}</Text>
          </View>
          {gst > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>GST</Text>
              <Text style={styles.billValue}>Rs.{gst.toLocaleString()}</Text>
            </View>
          )}
          <Divider style={{ marginVertical: SPACING.md }} />
          <View style={styles.billRow}>
            <Text style={styles.billTotalLabel}>Grand Total</Text>
            <Text style={styles.billTotalValue}>Rs.{total.toLocaleString()}</Text>
          </View>
        </View>

        <Button
          title="Place Order"
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
  progressStepActive: {},
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  metaLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textSecondary,
  },
  metaValue: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  boxSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  boxSummaryLabel: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textSecondary,
  },
  boxSummaryValue: {
    fontSize: TYPOGRAPHY.lg,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  boxError: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  orderItemName: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textSecondary,
  },
  orderItemDetail: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textMuted,
  },
  orderItemPrice: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    minWidth: 70,
    textAlign: 'right',
  },
  moreItems: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
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
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  billLabel: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textSecondary,
  },
  billValue: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textPrimary,
  },
  billTotalLabel: {
    fontSize: TYPOGRAPHY.lg,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  billTotalValue: {
    fontSize: TYPOGRAPHY.xl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.burgundy,
  },
});

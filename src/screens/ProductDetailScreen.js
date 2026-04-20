import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, Dimensions, TextInput,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Button, Divider, Icon, BrandMark } from '../components/UI';
import { addToCart } from '../api';
import { useCart } from '../context/CartContext';
import { useAlert } from '../components/CustomAlert';

const { width: SCREEN_W } = Dimensions.get('window');

const formatCategoryLabel = (cat) => {
  if (!cat) return '-';
  if (/^\d+ml$/i.test(cat)) return `${cat.replace(/ml/i, '')} ml`;
  if (/^\d+l$/i.test(cat)) return `${cat.replace(/l/i, '')} L`;
  return cat;
};

function Attribute({ label, value }) {
  return (
    <View style={styles.attribute}>
      <Text style={styles.attrLabel}>{label}</Text>
      <Text style={styles.attrValue}>{value}</Text>
    </View>
  );
}

export default function ProductDetailScreen({ navigation, route }) {
  const { product } = route.params;
  const { refreshCart } = useCart();
  const { alert } = useAlert();
  const [boxes, setBoxes] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const holdTimeoutRef = useRef(null);
  const holdIntervalRef = useRef(null);

  const stockBoxes = Number(product.boxes || 0);
  const isOutOfStock = stockBoxes <= 0;
  const bottlesPerBox = Number(product.bottlesPerBox || 0);

  useEffect(() => () => stopHold(), []);

  const stopHold = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  const startHold = (setter, delta, minimum = 1) => {
    setter((current) => Math.max(minimum, current + delta));
    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        setter((current) => Math.max(minimum, current + delta));
      }, 75);
    }, 300);
  };

  const handleNumericChange = (value) => {
    const digits = value.replace(/[^0-9]/g, '');
    if (!digits) {
      setBoxes(1);
      return;
    }

    setBoxes(Math.max(1, Number.parseInt(digits, 10)));
  };

  const handleAddToCart = async () => {
    // if (isOutOfStock) {
    //   Alert.alert('Out of stock', 'This product is currently unavailable.');
    //   return;
    // }

    setAddingCart(true);
    try {
      await addToCart(product._id || product.id, boxes);
      refreshCart();
      alert('Added to Cart', `${boxes} boxes of ${product.name} added successfully.`, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (e) {
      alert('Error', e.message);
    } finally {
      setAddingCart(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroImageWrap}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
            ) : (
              <BrandMark size={96} />
            )}
          </View>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.productName}>{product.name}</Text>

          <Text style={styles.sectionTitle}>Product details</Text>
          <View style={styles.attributeGrid}>
            <Attribute label="Category" value={formatCategoryLabel(product.category)} />
            <Attribute label="Bottles per box" value={bottlesPerBox ? String(bottlesPerBox) : '-'} />
          </View>

          <Divider />

          <Text style={styles.sectionTitle}>Order configuration</Text>
          <View style={styles.orderGrid}>
            <View style={styles.counterCard}>
              <Text style={styles.fieldLabel}>Boxes to order</Text>
              <View style={styles.counter}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPressIn={() => startHold(setBoxes, -1, 1)}
                  onPressOut={stopHold}
                  onPress={stopHold}
                >
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.counterInput}
                  value={String(boxes)}
                  onChangeText={handleNumericChange}
                  keyboardType="number-pad"
                  selectTextOnFocus
                />
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPressIn={() => startHold(setBoxes, 1, 1)}
                  onPressOut={stopHold}
                  onPress={stopHold}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* <View style={styles.readonlyFieldCard}>
              <Text style={styles.fieldLabel}>Boxes per box</Text>
              <View style={styles.readonlyField}>
                <Text style={styles.readonlyValue}>
                  {bottlesPerBox ? String(bottlesPerBox) : '-'}
                </Text>
              </View>
            </View> */}
          </View>

          <Divider />

          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>
              {product.description?.trim()
                ? product.description
                : 'No description has been added for this product yet.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title={addingCart ? 'Adding...' : 'Add to Cart'}
          onPress={handleAddToCart}
          loading={addingCart}
          size="lg"
          style={styles.addButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 120 },
  hero: {
    backgroundColor: '#eef7fa',
    paddingTop: 52,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  heroImageWrap: {
    height: 290,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    ...SHADOW.md,
  },
  productImage: {
    width: SCREEN_W * 0.64,
    height: 230,
  },
  detailCard: {
    marginTop: -16,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.xl,
  },
  productName: {
    fontSize: TYPOGRAPHY.xxl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    lineHeight: 34,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  attributeGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  attribute: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  attrLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  attrValue: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  orderGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  counterCard: {
    flex: 1.15,
    backgroundColor: '#f6fafb',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
  },
  readonlyFieldCard: {
    flex: 1,
    backgroundColor: '#f6fafb',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  counterBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.burgundy,
  },
  counterBtnText: {
    fontSize: TYPOGRAPHY.xxl,
    lineHeight: 28,
    color: '#fff',
    fontFamily: 'DMSans_700Bold',
  },
  counterInput: {
    flex: 1,
    minWidth: 72,
    paddingHorizontal: SPACING.sm,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  readonlyField: {
    minHeight: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  readonlyValue: {
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  descriptionCard: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  description: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.lg,
    paddingBottom: 30,
    ...SHADOW.lg,
  },
  addButton: {
    width: '100%',
  },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, Dimensions,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Button, Divider, Badge } from '../components/UI';
import { addToCart } from '../api';
import { useCart } from '../context/CartContext';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ProductDetailScreen({ navigation, route }) {
  const { product } = route.params;
  const { refreshCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [boxes, setBoxes] = useState(1);
  const [addingCart, setAddingCart] = useState(false);

  const price = product.offerPrice || product.price;
  const total = price * quantity;
  const discount = product.discount || product.offerPercentage;

  const handleAddToCart = async () => {
    setAddingCart(true);
    try {
      await addToCart(product._id || product.id, quantity, boxes);
      refreshCart();
      Alert.alert('Added to Cart 🎉', `${quantity}x ${product.name} added successfully!`, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setAddingCart(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Image Section */}
        <View style={styles.imageBg}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {product.imageUrl || product.image ? (
            <Image
              source={{ uri: product.imageUrl || product.image }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.productEmoji}>💧</Text>
          )}

          {discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.detailCard}>
          {/* Name & Brand */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              {product.brand && (
                <Text style={styles.brandName}>{product.brand}</Text>
              )}
            </View>
            {product.type && (
              <Badge
                label={product.type}
                color={COLORS.burgundyMuted}
                textColor={COLORS.burgundy}
              />
            )}
          </View>

          <Divider />

          {/* Price */}
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.currentPrice}>₹{price?.toLocaleString()}</Text>
              {product.originalPrice && product.originalPrice > price && (
                <Text style={styles.originalPrice}>₹{product.originalPrice?.toLocaleString()} MRP</Text>
              )}
            </View>
            {discount && (
              <View style={styles.savingsPill}>
                <Text style={styles.savingsText}>Save ₹{(product.originalPrice - price) * quantity}</Text>
              </View>
            )}
          </View>

          <Divider />

          {/* Quantity & Boxes */}
          <View style={styles.counterSection}>
            <View style={styles.counterGroup}>
              <Text style={styles.counterLabel}>Quantity</Text>
              <View style={styles.counter}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.counterGroup}>
              <Text style={styles.counterLabel}>Boxes</Text>
              <View style={styles.counter}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setBoxes(Math.max(1, boxes - 1))}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{boxes}</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setBoxes(boxes + 1)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Divider />

          {/* Description / Attributes */}
          {product.description && (
            <>
              <Text style={styles.sectionTitle}>About this product</Text>
              <Text style={styles.description}>{product.description}</Text>
              <Divider />
            </>
          )}

          {/* Product attributes */}
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.attributeGrid}>
            {product.volume && <Attribute label="Volume" value={product.volume} />}
            {product.alcoholContent && <Attribute label="Alcohol" value={product.alcoholContent} />}
            {product.origin && <Attribute label="Origin" value={product.origin} />}
            {product.category && <Attribute label="Category" value={product.category} />}
            {product.sku && <Attribute label="SKU" value={product.sku} />}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹{total?.toLocaleString()}</Text>
        </View>
        <Button
          title={addingCart ? 'Adding...' : 'Add to Cart'}
          onPress={handleAddToCart}
          loading={addingCart}
          disabled={product.inStock === false}
          size="lg"
          style={{ flex: 1, marginLeft: SPACING.md }}
        />
      </View>
    </View>
  );
}

function Attribute({ label, value }) {
  return (
    <View style={styles.attribute}>
      <Text style={styles.attrLabel}>{label}</Text>
      <Text style={styles.attrValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  imageBg: {
    height: 320,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: SPACING.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  backIcon: { fontSize: TYPOGRAPHY.xl },
  productImage: {
    width: SCREEN_W * 0.6,
    height: 240,
  },
  productEmoji: { fontSize: 100 },
  discountBadge: {
    position: 'absolute',
    top: 52,
    right: SPACING.lg,
    backgroundColor: COLORS.burgundy,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  discountText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_700Bold',
  },
  detailCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginTop: -20,
    padding: SPACING.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  productName: {
    fontSize: TYPOGRAPHY.xxl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    lineHeight: 34,
  },
  brandName: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
  },
  currentPrice: {
    fontSize: TYPOGRAPHY.xxxl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.burgundy,
  },
  originalPrice: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  savingsPill: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  savingsText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.success,
    fontFamily: 'DMSans_700Bold',
  },
  counterSection: {
    flexDirection: 'row',
    gap: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  counterGroup: { alignItems: 'center', gap: 8 },
  counterLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  counterBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
  counterBtnText: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.textPrimary,
    fontFamily: 'DMSans_400Regular',
  },
  counterValue: {
    width: 44,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  attributeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  attribute: {
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    minWidth: '45%',
    flex: 1,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: 30,
    ...SHADOW.lg,
  },
  totalSection: {
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: TYPOGRAPHY.lg,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
});

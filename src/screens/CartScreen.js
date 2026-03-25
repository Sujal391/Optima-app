import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, RefreshControl,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Button, Divider, EmptyState, LoadingSpinner } from '../components/UI';
import { getCart, removeFromCart } from '../api';
import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }) {
  const { refreshCart } = useCart();
  const [cartData, setCartData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await getCart();
      const data = res.data || {};
      setCartData(data);
      setItems(data.items || data || []);
    } catch (e) {
      console.log('Cart fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemove = async (productId, productName) => {
    Alert.alert('Remove Item', `Remove ${productName} from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemovingId(productId);
          try {
            await removeFromCart(productId);
            await fetchCart();
            refreshCart();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setRemovingId(null);
          }
        },
      },
    ]);
  };

  const subtotal = items.reduce((sum, item) => {
    // API: price is per-box; boxes = number of boxes ordered
    const price = item.product?.price || item.price || 0;
    const boxes = item.boxes || item.quantity || 1;
    return sum + price * boxes;
  }, 0);
  const deliveryFee = subtotal > 2000 ? 0 : 99;
  const total = subtotal + deliveryFee;

  const renderItem = ({ item }) => {
    const product = item.product || item;
    const price = product.price || item.price || 0;
    const boxes = item.boxes || item.quantity || 1;
    const pid = product._id || product.id;
    const isRemoving = removingId === pid;

    return (
      <View style={[styles.cartItem, isRemoving && { opacity: 0.4 }]}>
        <View style={styles.cartImageBox}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.cartImage} resizeMode="cover" />
          ) : (
            <Text style={styles.cartEmoji}>💧</Text>
          )}
        </View>
        <View style={styles.cartItemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{product.name}</Text>
          {product.category && (
            <Text style={styles.itemBrand}>{product.category}</Text>
          )}
          <View style={styles.itemBottom}>
            <Text style={styles.itemPrice}>₹{price?.toLocaleString()}/box</Text>
            <View style={styles.itemQty}>
              <Text style={styles.qtyLabel}>Boxes: </Text>
              <Text style={styles.qtyValue}>{boxes}</Text>
            </View>
          </View>
          <Text style={styles.itemSubtotal}>
            Subtotal: ₹{(price * boxes)?.toLocaleString()}
            {product.bottlesPerBox
              ? `  ·  ${boxes * product.bottlesPerBox} bottles`
              : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove(pid, product.name)}
          disabled={isRemoving}
        >
          <Text style={styles.removeIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.itemCount}>{items.length} items</Text>
      </View>

      {items.length === 0 ? (
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          subtitle="Browse our water products and add items to cart"
          action="Browse Collection"
          onAction={() => navigation.navigate('Products')}
        />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <Divider />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchCart(); }}
                tintColor={COLORS.burgundy}
              />
            }
            ListFooterComponent={() => (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal ({items.length} items)</Text>
                  <Text style={styles.summaryValue}>₹{subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery</Text>
                  <Text style={[styles.summaryValue, deliveryFee === 0 && { color: COLORS.success }]}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </Text>
                </View>
                {deliveryFee > 0 && (
                  <Text style={styles.freeDeliveryHint}>
                    Add ₹{(2000 - subtotal).toLocaleString()} more for free delivery
                  </Text>
                )}
                <Divider />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>₹{total.toLocaleString()}</Text>
                </View>
              </View>
            )}
          />

          {/* Bottom checkout bar */}
          <View style={styles.checkoutBar}>
            <View>
              <Text style={styles.checkoutTotal}>₹{total.toLocaleString()}</Text>
              <Text style={styles.checkoutLabel}>including delivery</Text>
            </View>
            <Button
              title="Proceed to Checkout →"
              size="lg"
              style={{ flex: 1, marginLeft: SPACING.md }}
              onPress={() => navigation.navigate('Checkout', { items, total, subtotal })}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  backIcon: { fontSize: TYPOGRAPHY.lg },
  headerTitle: {
    flex: 1, fontSize: TYPOGRAPHY.xl,
    fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary,
  },
  itemCount: {
    fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted,
  },
  listContent: { padding: SPACING.lg, paddingBottom: 140 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  cartImageBox: {
    width: 80, height: 80, borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  cartImage: { width: '100%', height: '100%' },
  cartEmoji: { fontSize: 36 },
  cartItemInfo: { flex: 1 },
  itemName: {
    fontSize: TYPOGRAPHY.base, fontFamily: 'DMSans_500Medium', color: COLORS.textPrimary,
  },
  itemBrand: {
    fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted, marginTop: 2,
  },
  itemBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.md, fontFamily: 'DMSans_700Bold', color: COLORS.burgundy,
  },
  itemQty: { flexDirection: 'row', alignItems: 'center' },
  qtyLabel: {
    fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted,
  },
  qtyValue: {
    fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary,
  },
  itemSubtotal: {
    fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted, marginTop: 2,
  },
  removeBtn: {
    padding: SPACING.sm,
  },
  removeIcon: { fontSize: 18 },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.md, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.base, fontFamily: 'DMSans_400Regular', color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.base, fontFamily: 'DMSans_500Medium', color: COLORS.textPrimary,
  },
  freeDeliveryHint: {
    fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_400Regular', color: COLORS.gold,
    marginTop: -4, marginBottom: SPACING.sm,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.lg, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary,
  },
  totalAmount: {
    fontSize: TYPOGRAPHY.xxl, fontFamily: 'DMSans_700Bold', color: COLORS.burgundy,
  },
  checkoutBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.lg, paddingBottom: 30,
    ...SHADOW.lg,
  },
  checkoutTotal: {
    fontSize: TYPOGRAPHY.xl, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary,
  },
  checkoutLabel: {
    fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted,
  },
});

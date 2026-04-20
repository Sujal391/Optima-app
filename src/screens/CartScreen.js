import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, RefreshControl, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Button, Divider, EmptyState, LoadingSpinner, Icon, BrandMark } from '../components/UI';
import { getCart, removeFromCart } from '../api';
import { useCart } from '../context/CartContext';
import { useAlert } from '../components/CustomAlert';


export default function CartScreen({ navigation }) {
  const { cartItems, refreshCart } = useCart();
  const { alert } = useAlert();
  const [cartData, setCartData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchCart();
    }, [])
  );

  useEffect(() => {
    if (!loading) {
      setItems(cartItems || []);
    }
  }, [cartItems, loading]);

  const fetchCart = async () => {
    try {
      const res = await getCart();
      const cart = res.data?.cart || {};
      const products = Array.isArray(cart.products) ? cart.products : [];
      setCartData({ ...cart, products });
      setItems(products);
    } catch (e) {
      console.log('Cart fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemove = async (productId, productName) => {
    alert('Remove Item', `Remove ${productName} from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemovingId(productId);
          try {
            await removeFromCart({ product: productId });
            await fetchCart();
            refreshCart();
          } catch (e) {
            alert('Error', e.message);
          } finally {
            setRemovingId(null);
          }
        },
      },
    ]);
  };

  const subtotal = cartData?.amount ?? items.reduce((sum, item) => sum + (item.total || 0), 0);
  const gst = cartData?.gst || 0;
  const deliveryFee = 0; // Backend handles totals now, keeping it 0 unless specified
  const total = cartData?.totalAmount ?? (subtotal + gst + deliveryFee);
  const totalBoxes = cartData?.totalItems ?? items.reduce((sum, item) => sum + Number(item.boxes || 0), 0);
  const hasMinimumBoxes = true;

  const handleCheckout = () => {

    navigation.navigate('Checkout', { items, total, subtotal, totalBoxes, gst });
  };

  const renderItem = ({ item }) => {
    const product = item.product || {};
    const price = item.price || product.price || 0;
    const boxes = item.boxes || 1;
    const itemSubtotal = item.total ?? price * boxes;
    const pid = product._id;
    const isRemoving = removingId === pid;

    return (
      <View style={[styles.cartItem, isRemoving && { opacity: 0.4 }]}>
        <TouchableOpacity 
          style={styles.clickableArea} 
          onPress={() => navigation.navigate('ProductDetail', { product })}
          activeOpacity={0.7}
        >
          <View style={styles.cartImageBox}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.cartImage} resizeMode="cover" />
            ) : (
              <BrandMark size={42} />
            )}
          </View>
          <View style={styles.cartItemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>{product.name}</Text>
            {product.category ? (
              <Text style={styles.itemBrand}>{product.category}</Text>
            ) : null}
            <View style={styles.itemBottom}>
              <Text style={styles.itemPrice}>Rs.{price?.toLocaleString()}/box</Text>
              <View style={styles.itemQty}>
                <Text style={styles.qtyLabel}>Boxes: </Text>
                <Text style={styles.qtyValue}>{boxes}</Text>
              </View>
            </View>
            <Text style={styles.itemSubtotal}>
              Subtotal: Rs.{itemSubtotal?.toLocaleString()}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove(pid, product.name)}
          disabled={isRemoving}
        >
          <Icon name="trash-2" size={16} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.itemCount}>{items.length} items</Text>
      </View>

      {items.length === 0 ? (
        <ScrollView 
          contentContainerStyle={{ flex: 1, justifyContent: 'center' }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchCart(); }}
              tintColor={COLORS.burgundy}
            />
          }
        >
          <EmptyState
            icon={<Icon name="shopping-cart" size={52} color={COLORS.burgundy} style={{ marginBottom: SPACING.lg }} />}
            title="Your cart is empty"
            subtitle="Browse products and add items to your cart"
            action="Browse Collection"
            onAction={() => navigation.navigate('Products')}
          />
        </ScrollView>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.product?._id || String(Math.random())}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <Divider />}
            showsVerticalScrollIndicator={false}
            refreshControl={(
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchCart(); }}
                tintColor={COLORS.burgundy}
              />
            )}
          />

          <View style={styles.checkoutWrap}>
            {summaryOpen ? (
              <View style={styles.summaryAccordion}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal ({items.length} items)</Text>
                  <Text style={styles.summaryValue}>Rs.{subtotal.toLocaleString()}</Text>
                </View>
                {gst > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>GST</Text>
                    <Text style={styles.summaryValue}>Rs.{gst.toLocaleString()}</Text>
                  </View>
                )}
                {/* <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total boxes</Text>
                  <Text style={styles.summaryValue}>{totalBoxes}</Text>
                </View> */}
                <Divider style={styles.summaryDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>Rs.{total.toLocaleString()}</Text>
                </View>
              </View>
            ) : null}
            <View style={styles.checkoutBar}>
              <TouchableOpacity
                style={styles.checkoutSummary}
                onPress={() => setSummaryOpen((open) => !open)}
                activeOpacity={0.85}
              >
                <Text style={styles.checkoutLabel}>Order Summary</Text>
                <View style={styles.checkoutSummaryRow}>
                  <Text style={styles.checkoutTotal}>Rs.{total.toLocaleString()}</Text>
                  <Icon
                    name={summaryOpen ? 'chevron-down' : 'chevron-up'}
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </View>
              </TouchableOpacity>
              <Button
                title="Checkout"
                style={styles.checkoutButton}
                onPress={handleCheckout}
              />
            </View>
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
  headerTitle: {
    flex: 1, fontSize: TYPOGRAPHY.xl,
    fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary,
  },
  itemCount: {
    fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted,
  },
  listContent: { padding: SPACING.lg, paddingBottom: 130 },
  cartItem: {
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  clickableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  cartImageBox: {
    width: 80, height: 80, borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  cartImage: { width: '100%', height: '100%' },
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
  checkoutWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  summaryAccordion: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOW.md,
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
  minimumHint: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.error,
    marginTop: -2,
    marginBottom: SPACING.sm,
  },
  summaryDivider: {
    marginVertical: SPACING.sm,
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
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    minHeight: 84,
    ...SHADOW.lg,
  },
  checkoutSummary: {
    flex: 1,
    marginRight: SPACING.md,
  },
  checkoutSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  checkoutTotal: {
    fontSize: TYPOGRAPHY.lg, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary,
  },
  checkoutLabel: {
    fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_500Medium', color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  checkoutButton: {
    flex: 1,
    marginLeft: 'auto',
    paddingVertical: 14,
  },
});

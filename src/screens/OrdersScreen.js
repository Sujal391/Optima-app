import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { LoadingSpinner, EmptyState, Divider, Icon } from '../components/UI';
import { getOrderHistory } from '../api';

const STATUS_CONFIG = {
  pending: { color: COLORS.warningLight, text: COLORS.warning, label: 'Pending' },
  confirmed: { color: COLORS.successLight, text: COLORS.success, label: 'Confirmed' },
  processing: { color: '#E8F0FE', text: '#1A73E8', label: 'Processing' },
  shipped: { color: '#E3F2FD', text: '#0277BD', label: 'Shipped' },
  delivered: { color: COLORS.successLight, text: COLORS.success, label: 'Delivered' },
  cancelled: { color: COLORS.errorLight, text: COLORS.error, label: 'Cancelled' },
};

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await getOrderHistory();
      const raw = res.data;
      setOrders(
        Array.isArray(raw) ? raw :
        Array.isArray(raw?.orders) ? raw.orders :
        Array.isArray(raw?.data) ? raw.data : []
      );
    } catch (e) {
      console.log('Orders error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderOrder = ({ item }) => {
    const status = (item.orderStatus || item.status)?.toLowerCase() || 'pending';
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    }) : '—';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { order: item })}
        activeOpacity={0.9}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{(item._id || item.id)?.slice(-8)?.toUpperCase()}</Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
            <View style={[styles.statusDot, { backgroundColor: cfg.text }]} />
            <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>

        <Divider style={{ marginVertical: SPACING.sm }} />

        {(item.products || []).slice(0, 2).map((p, i) => {
          const product = p.product || p;
          return (
            <View key={i} style={styles.productRow}>
              <Text style={styles.productDot}>•</Text>
              <Text style={styles.productName} numberOfLines={1}>
                {product.name || 'Product'}
                {product.category ? ` (${product.category})` : ''}
              </Text>
              <Text style={styles.productQty}>
                {p.boxes ? `${p.boxes} box${p.boxes > 1 ? 'es' : ''}` : `x${p.quantity || 1}`}
              </Text>
            </View>
          );
        })}
        {(item.products?.length || 0) > 2 && (
          <Text style={styles.moreProducts}>
            + {item.products.length - 2} more items
          </Text>
        )}

        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>Rs.{item.paymentDetails?.amount?.toLocaleString()}</Text>
          </View>
          <View style={styles.detailsBtn}>
            <Text style={styles.detailsBtnText}>View Details</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>{orders.length} orders placed</Text>
      </View>

      {orders.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flex: 1, justifyContent: 'center' }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              tintColor={COLORS.burgundy}
            />
          }
        >
          <EmptyState
            icon={<Icon name="archive" size={52} color={COLORS.burgundy} style={{ marginBottom: SPACING.lg }} />}
            title="No orders yet"
            subtitle="Your order history will appear here"
            action="Start Shopping"
            onAction={() => navigation.navigate('Products')}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              tintColor={COLORS.burgundy}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 56,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xxl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  statusText: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_700Bold',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  productDot: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.base,
  },
  productName: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textSecondary,
  },
  productQty: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textMuted,
  },
  moreProducts: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
  },
  totalAmount: {
    fontSize: TYPOGRAPHY.lg,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.burgundy,
  },
  detailsBtn: {
    backgroundColor: COLORS.burgundyMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  detailsBtnText: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.burgundy,
  },
});

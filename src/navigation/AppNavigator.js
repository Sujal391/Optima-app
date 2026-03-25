import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS, SPACING, RADIUS } from '../theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentScreen from '../screens/PaymentScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Tab Icon ─────────────────────────────────────────────────────────────────
function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────
function MainTabs() {
  const { cartCount } = useCart();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.burgundy,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💧" focused={focused} />,
          tabBarLabel: 'Products',
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View>
              <TabIcon emoji="🛒" focused={focused} />
              {cartCount > 0 && (
                <View style={styles.cartDot}>
                  <Text style={styles.cartDotText}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          tabBarLabel: 'Cart',
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
          tabBarLabel: 'Orders',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Auth Stack ───────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ─── Order Detail Screen ──────────────────────────────────────────────────────
function OrderDetailScreen({ navigation, route }) {
  const { order } = route.params;

  const STATUS_CONFIG = {
    pending:    { color: COLORS.warningLight, text: COLORS.warning, label: 'Payment Pending' },
    confirmed:  { color: COLORS.successLight, text: COLORS.success, label: 'Confirmed' },
    processing: { color: '#E8F0FE',           text: '#1A73E8',      label: 'Processing' },
    shipped:    { color: '#E3F2FD',           text: '#0277BD',      label: 'Shipped' },
    delivered:  { color: COLORS.successLight, text: COLORS.success, label: 'Delivered' },
    cancelled:  { color: COLORS.errorLight,   text: COLORS.error,   label: 'Cancelled' },
  };

  // API uses `orderStatus`; fall back to `status` for compatibility
  const status = (order.orderStatus || order.status)?.toLowerCase() || 'pending';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-IN')
    : '';

  // shippingAddress may be an object { street, city, state, pincode } or a plain string
  const formatAddress = (addr) => {
    if (!addr) return null;
    if (typeof addr === 'string') return addr;
    return [addr.street || addr.line1, addr.city, addr.state, addr.pincode]
      .filter(Boolean).join(', ');
  };
  const addressStr = formatAddress(order.shippingAddress || order.address);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={detailStyles.header}>
        <Text onPress={() => navigation.goBack()} style={detailStyles.back}>←</Text>
        <Text style={detailStyles.title}>Order Details</Text>
      </View>
      <View style={{ padding: SPACING.lg }}>
        {/* Order status badge */}
        <View style={[detailStyles.statusBox, { backgroundColor: cfg.color }]}>
          <Text style={[detailStyles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>

        <Text style={detailStyles.orderId}>
          Order #{(order._id || order.id)?.slice(-8)?.toUpperCase()}
        </Text>
        {!!date && <Text style={detailStyles.orderDate}>{date}</Text>}
        <Text style={detailStyles.total}>
          Total: ₹{order.totalAmount?.toLocaleString()}
        </Text>

        {/* Payment status row */}
        {!!order.paymentStatus && (
          <View style={detailStyles.infoBox}>
            <Text style={detailStyles.infoLabel}>Payment Status</Text>
            <Text style={[
              detailStyles.infoValue,
              { color: order.paymentStatus === 'paid' ? COLORS.success : COLORS.warning }
            ]}>
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </Text>
          </View>
        )}

        {/* Delivery address */}
        {!!addressStr && (
          <View style={detailStyles.infoBox}>
            <Text style={detailStyles.infoLabel}>Delivery Address</Text>
            <Text style={detailStyles.infoValue}>{addressStr}</Text>
          </View>
        )}

        {/* Items list */}
        {(order.products || []).length > 0 && (
          <View style={detailStyles.infoBox}>
            <Text style={detailStyles.infoLabel}>Items Ordered</Text>
            {order.products.map((p, i) => {
              const product = p.product || p;
              const qty = p.boxes
                ? `${p.boxes} box${p.boxes > 1 ? 'es' : ''}`
                : `×${p.quantity || 1}`;
              return (
                <Text key={i} style={detailStyles.productLine}>
                  • {product.name || 'Product'}
                  {product.category ? ` (${product.category})` : ''}{'  '}{qty}
                </Text>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── App Stack (authenticated) ────────────────────────────────────────────────
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{ presentation: 'modal', gestureEnabled: false }}
      />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <Text style={{ fontSize: 64 }}>💧</Text>
        <Text style={styles.splashTitle}>Rewa Water</Text>
        <Text style={styles.splashSub}>Pure Water Delivery</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  splashTitle: {
    fontSize: 36,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
    letterSpacing: 3,
    marginTop: 8,
  },
  splashSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 72,
    paddingBottom: 12,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
  },
  cartDot: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.burgundy,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartDotText: {
    fontSize: 9,
    color: '#fff',
    fontFamily: 'DMSans_700Bold',
  },
});

const detailStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.burgundy,
    padding: SPACING.lg,
    paddingTop: 52,
    gap: SPACING.md,
  },
  back: { fontSize: 22, color: '#fff' },
  title: { fontSize: 20, fontFamily: 'DMSans_700Bold', color: '#fff' },
  statusBox: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  statusText: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  orderId: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary },
  orderDate: { fontSize: 13, color: COLORS.textMuted, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  total: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: COLORS.burgundy, marginTop: SPACING.md },
  infoBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'DMSans_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: { fontSize: 14, color: COLORS.textPrimary, fontFamily: 'DMSans_400Regular' },
  productLine: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'DMSans_400Regular',
    marginTop: 4,
    lineHeight: 22,
  },
});
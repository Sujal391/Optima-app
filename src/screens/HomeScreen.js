import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, Image, Dimensions, RefreshControl,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { SectionHeader, Badge, LoadingSpinner, Card } from '../components/UI';
import { getBanners, getOffers } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const [banners, setBanners] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-scroll banners
  useEffect(() => {
    if (!banners.length) return;
    const timer = setInterval(() => {
      const next = (activeBanner + 1) % banners.length;
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveBanner(next);
    }, 3500);
    return () => clearInterval(timer);
  }, [activeBanner, banners]);

  const fetchData = async () => {
    try {
      const [bannerRes, offerRes] = await Promise.all([getBanners(), getOffers()]);
      // Handle various API response shapes: array | { data } | { banners } | { offers }
      const bannerData = bannerRes.data;
      setBanners(
        Array.isArray(bannerData) ? bannerData :
        Array.isArray(bannerData?.banners) ? bannerData.banners :
        Array.isArray(bannerData?.data) ? bannerData.data : []
      );
      const offerData = offerRes.data;
      setOffers(
        Array.isArray(offerData) ? offerData :
        Array.isArray(offerData?.offers) ? offerData.offers :
        Array.isArray(offerData?.data) ? offerData.data : []
      );
    } catch (e) {
      console.log('Home fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const categories = [
    { icon: '💧', label: '500ml', type: 'bottles', category: '500ml' },
    { icon: '🫙', label: '1 Litre', type: 'bottles', category: '1l' },
    { icon: '🪣', label: '5 Litre', type: 'jars', category: '5l' },
    { icon: '🛢️', label: '20 Litre', type: 'bulk', category: '20l' },
    { icon: '📦', label: 'Bulk Pack', type: 'bulk', category: 'bulk' },
    { icon: '✨', label: 'All', type: null, category: null },
  ];

  if (loading) return <LoadingSpinner text="Loading products..." />;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.burgundy} />}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.greeting}>Good {getTimeGreeting()},</Text>
          <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Customer'} 👋</Text>
        </View>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Products')}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Search water products...</Text>
      </TouchableOpacity>

      {/* Banner Carousel */}
      {banners.length > 0 ? (
        <View style={styles.bannerSection}>
          <FlatList
            ref={bannerRef}
            data={banners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - SPACING.xl * 2));
              setActiveBanner(idx);
            }}
            renderItem={({ item }) => (
              <View style={styles.bannerCard}>
                <Image
                  source={{ uri: item.imageUrl || item.image }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <View style={styles.bannerOverlay}>
                  {item.title && <Text style={styles.bannerTitle}>{item.title}</Text>}
                  {item.subtitle && <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>}
                </View>
              </View>
            )}
          />
          <View style={styles.dotsRow}>
            {banners.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeBanner && styles.dotActive]} />
            ))}
          </View>
        </View>
      ) : (
        /* Fallback hero when no banners */
        <View style={styles.heroBanner}>
          <View style={styles.heroCircle} />
          <Text style={styles.heroText}>💧</Text>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Order Pure{'\n'}Water Bottles</Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => navigation.navigate('Products')}
            >
              <Text style={styles.heroBtnText}>Browse Products →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <SectionHeader title="Browse" subtitle="Explore by category" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={styles.catCard}
              onPress={() => navigation.navigate('Products', { type: cat.type, category: cat.category })}
            >
              <View style={styles.catIcon}>
                <Text style={styles.catEmoji}>{cat.icon}</Text>
              </View>
              <Text style={styles.catLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Offers */}
      {offers.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="Today's Deals"
            subtitle={`${offers.length} items on offer`}
            action="See all"
            onAction={() => navigation.navigate('Products', { showOffers: true })}
          />
          <FlatList
            data={offers.slice(0, 6)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id || item.id}
            renderItem={({ item }) => (
              <OfferCard item={item} navigation={navigation} />
            )}
            ItemSeparatorComponent={() => <View style={{ width: SPACING.md }} />}
          />
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <SectionHeader title="Quick Access" />
        <View style={styles.quickGrid}>
          {[
            { icon: '📦', label: 'My Orders', screen: 'Orders' },
            { icon: '👤', label: 'Profile', screen: 'Profile' },
            { icon: '🏷️', label: 'Offers', screen: 'Products', params: { showOffers: true } },
            { icon: '🛒', label: 'My Cart', screen: 'Cart' },
          ].map((q) => (
            <TouchableOpacity
              key={q.label}
              style={styles.quickCard}
              onPress={() => navigation.navigate(q.screen, q.params)}
            >
              <Text style={styles.quickIcon}>{q.icon}</Text>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: SPACING.xxxl }} />
    </ScrollView>
  );
}

function OfferCard({ item, navigation }) {
  const discount = item.discount || item.offerPercentage;
  return (
    <TouchableOpacity
      style={styles.offerCard}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
      activeOpacity={0.9}
    >
      <View style={styles.offerImageBox}>
        {item.imageUrl || item.image ? (
          <Image source={{ uri: item.imageUrl || item.image }} style={styles.offerImage} resizeMode="cover" />
        ) : (
          <Text style={styles.offerPlaceholder}>💧</Text>
        )}
        {discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
      </View>
      <View style={styles.offerInfo}>
        <Text style={styles.offerName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.offerPrice}>₹{item.offerPrice || item.price}</Text>
        {item.originalPrice && (
          <Text style={styles.offerOriginal}>₹{item.originalPrice}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 56,
    paddingBottom: SPACING.md,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
  },
  userName: {
    fontSize: TYPOGRAPHY.xl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  cartBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  cartIcon: { fontSize: 20 },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOW.sm,
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
  },
  bannerSection: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  bannerCard: {
    width: SCREEN_W - SPACING.xl * 2,
    height: 180,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.burgundyDark,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: 'rgba(26,10,14,0.55)',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: TYPOGRAPHY.lg,
    fontFamily: 'DMSans_700Bold',
  },
  bannerSubtitle: {
    color: COLORS.goldLight,
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.burgundy,
    width: 18,
  },
  // Fallback hero
  heroBanner: {
    marginHorizontal: SPACING.xl,
    height: 180,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.burgundy,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  heroCircle: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroText: {
    fontSize: 72,
    marginRight: SPACING.lg,
  },
  heroContent: { flex: 1 },
  heroTitle: {
    color: '#fff',
    fontSize: TYPOGRAPHY.xl,
    fontFamily: 'DMSans_700Bold',
    lineHeight: 28,
  },
  heroBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.gold,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  heroBtnText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_700Bold',
  },
  // Sections
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  catScroll: {
    marginHorizontal: -SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  catCard: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 72,
  },
  catIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...SHADOW.sm,
  },
  catEmoji: { fontSize: 26 },
  catLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Offer card
  offerCard: {
    width: 160,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  offerImageBox: {
    width: '100%',
    height: 130,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerImage: { width: '100%', height: '100%' },
  offerPlaceholder: { fontSize: 50 },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.burgundy,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  discountText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_700Bold',
  },
  offerInfo: {
    padding: SPACING.md,
  },
  offerName: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  offerPrice: {
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.burgundy,
  },
  offerOriginal: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    fontFamily: 'DMSans_400Regular',
  },
  // Quick grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  quickCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  quickIcon: { fontSize: 28, marginBottom: 6 },
  quickLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textSecondary,
  },
});

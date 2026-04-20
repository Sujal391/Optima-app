import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, Dimensions, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { SectionHeader, LoadingSpinner, Icon, BrandMark } from '../components/UI';
import { getBanners, getProducts } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const bannerRef = useRef(null);
  const displayName =
    user?.name?.trim() ||
    user?.customerDetails?.firmName ||
    user?.firmName ||
    user?.userCode ||
    user?.email?.split('@')[0] ||
    'Customer';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!banners.length) return undefined;
    const timer = setInterval(() => {
      const next = (activeBanner + 1) % banners.length;
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveBanner(next);
    }, 3500);
    return () => clearInterval(timer);
  }, [activeBanner, banners]);

  const fetchData = async () => {
    try {
      const [bannerRes, productsRes] = await Promise.all([getBanners(), getProducts()]);
      const bannerData = bannerRes.data;
      const rawProducts = productsRes.data;
      const products =
        Array.isArray(rawProducts) ? rawProducts :
        Array.isArray(rawProducts?.products) ? rawProducts.products :
        Array.isArray(rawProducts?.data) ? rawProducts.data : [];

      setBanners(
        Array.isArray(bannerData) ? bannerData :
        Array.isArray(bannerData?.banners) ? bannerData.banners :
        Array.isArray(bannerData?.data) ? bannerData.data : []
      );
      setFeaturedProducts(products.filter((p) => p.isActive !== false).slice(0, 4));
    } catch (e) {
      console.log('Home fetch error:', e?.message || String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) return <LoadingSpinner text="Loading products..." />;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.burgundy} />}
    >
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.greeting}>Good {getTimeGreeting()},</Text>
          <Text style={styles.userName}>{displayName}</Text>
        </View>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <Icon name="shopping-cart" size={18} color={COLORS.textPrimary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Products')}
      >
        <Icon name="search" size={16} color={COLORS.textMuted} />
        <Text style={styles.searchPlaceholder}>Search products...</Text>
      </TouchableOpacity>

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
                  source={item.imageUrl || item.image}
                  style={styles.bannerImage}
                  contentFit="cover"
                  transition={300}
                  cachePolicy="none"
                />
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
        <View style={styles.heroBanner}>
          <View style={styles.heroCircle} />
          <BrandMark size={72} style={styles.heroMark} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Browse{'\n'}Featured Products</Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => navigation.navigate('Products')}
            >
              <View style={styles.heroBtnInner}>
                <Text style={styles.heroBtnText}>Browse Products</Text>
                <Icon name="arrow-right" size={14} color={COLORS.textPrimary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader
          title="Featured Products"
          subtitle="A quick shortlist from the catalog"
          action="View All"
          onAction={() => navigation.navigate('Products')}
        />
        <View style={styles.productGrid}>
          {featuredProducts.slice(0, 4).map((product) => (
            <TouchableOpacity
              key={product._id || product.id || product.name}
              style={styles.productCard}
              onPress={() => navigation.navigate('ProductDetail', { product })}
              activeOpacity={0.88}
            >
              <View style={styles.productImageWrap}>
                {product.image ? (
                  <Image 
                    source={product.image} 
                    style={styles.productImage} 
                    contentFit="cover" 
                    transition={200}
                    cachePolicy="disk"
                  />
                ) : (
                  <BrandMark size={52} />
                )}
                {!!product.category && (
                  <View style={styles.productBadge}>
                    <Text style={styles.productBadgeText}>{product.category}</Text>
                  </View>
                )}
              </View>
              <View style={styles.productContent}>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productMeta}>
                  {product.bottlesPerBox ? `${product.bottlesPerBox} bottles/box` : 'Available now'}
                </Text>
                <Text style={styles.productPrice}>Rs.{product.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: SPACING.xxxl }} />
    </ScrollView>
  );
}

function getTimeGreeting() {
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = (utcMinutes + 330) % 1440;

  if (istMinutes < 720) return 'Morning';
  if (istMinutes < 1020) return 'Afternoon';
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
    objectFit: 'contain',
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
  heroMark: {
    marginRight: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.12)',
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
  heroBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroBtnText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_700Bold',
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  productCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  productImageWrap: {
    height: 120,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.burgundy,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  productBadgeText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_700Bold',
  },
  productContent: {
    padding: SPACING.md,
    gap: 4,
  },
  productName: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  productMeta: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
  },
  productPrice: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.burgundy,
  },
});

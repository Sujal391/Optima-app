import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { LoadingSpinner, EmptyState, Icon, BrandMark } from '../components/UI';
import { getProducts } from '../api';
import { useAlert } from '../components/CustomAlert';

const SIZE_ORDER = ['200ml', '250ml', '500ml', '700ml', '1L', '2L', '5L', '10L', '20L'];

const sortCategories = (cats) =>
  [...cats].sort((a, b) => {
    const ai = SIZE_ORDER.findIndex((s) => s.toLowerCase() === a.toLowerCase());
    const bi = SIZE_ORDER.findIndex((s) => s.toLowerCase() === b.toLowerCase());
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

const formatCategoryLabel = (cat) => {
  if (!cat) return '';
  if (cat.toLowerCase() === 'all') return 'All';
  if (/^\d+ml$/i.test(cat)) return `${cat.replace(/ml/i, '')} ml`;
  if (/^\d+l$/i.test(cat)) return `${cat.replace(/l/i, '')} L`;
  return cat;
};

export default function ProductsScreen({ navigation }) {
  const { alert } = useAlert();
  const [allProducts, setAllProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      const raw = res.data;
      const data =
        Array.isArray(raw) ? raw :
        Array.isArray(raw?.products) ? raw.products :
        Array.isArray(raw?.data) ? raw.data : [];

      const active = data.filter((p) => p.isActive !== false);
      const uniqueCats = [...new Set(active.map((p) => p.category).filter(Boolean))];

      setAllProducts(active);
      setCategories(['All', ...sortCategories(uniqueCats)]);
    } catch (e) {
      console.log('Products error:', e?.message || String(e));
      alert('Error', 'Could not load products. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let list = allProducts;

    if (activeCategory !== 'All') {
      list = list.filter((p) => p.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name?.toLowerCase().includes(q));
    }

    setFiltered(list);
  }, [allProducts, activeCategory, search]);

  const renderProduct = ({ item }) => {
    // const outOfStock = (item.boxes ?? 1) <= 0;
    const hasDiscount = item.originalPrice && item.price < item.originalPrice;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
        activeOpacity={0.88}
      >
        <View style={styles.productImageBox}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <BrandMark size={56} />
          )}

          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{formatCategoryLabel(item.category)}</Text>
            </View>
          )}

          {/* {outOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )} */}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.bottlesPerBox}>{item.bottlesPerBox} bottles/box</Text>

          <View style={styles.productFooter}>
            <View>
              <Text style={styles.productPrice}>
                Rs.{item.price}
                <Text style={styles.perBox}>/box</Text>
              </Text>
              {hasDiscount && (
                <Text style={styles.productOriginalPrice}>Rs.{item.originalPrice}</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartBtn}>
          <Icon name="shopping-cart" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="x" size={16} color={COLORS.textMuted} style={styles.clearSearch} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          decelerationRate="fast"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const label = formatCategoryLabel(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Text style={styles.resultsCount}>
        {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
        {activeCategory !== 'All' ? ` • ${formatCategoryLabel(activeCategory)}` : ''}
      </Text>

      {loading ? (
        <LoadingSpinner text="Loading products..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Icon name="search" size={52} color={COLORS.burgundy} style={{ marginBottom: SPACING.lg }} />}
          title="No products found"
          subtitle="Try a different size or clear your search"
          action="Clear Filters"
          onAction={() => {
            setSearch('');
            setActiveCategory('All');
          }}
        />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => item._id || item.id || item.name}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchProducts();
              }}
              tintColor={COLORS.burgundy}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.burgundyDark,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.xl,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  cartBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textPrimary,
    fontFamily: 'DMSans_400Regular',
    marginLeft: SPACING.sm,
  },
  clearSearch: {
    padding: 4,
  },
  filterWrapper: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  filterContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: COLORS.burgundy,
    borderColor: COLORS.burgundy,
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: '#495057',
    textAlign: 'center',
    lineHeight: 18,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultsCount: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    paddingTop: SPACING.sm,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  productCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  productImageBox: {
    height: 150,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.burgundy,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.5,
  },
  productInfo: {
    padding: SPACING.sm,
  },
  productName: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
    lineHeight: 18,
  },
  bottlesPerBox: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: TYPOGRAPHY.md,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.burgundy,
  },
  perBox: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
  },
  productOriginalPrice: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    fontFamily: 'DMSans_400Regular',
  },
});
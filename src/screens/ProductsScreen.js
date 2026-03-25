import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, RefreshControl, ScrollView, Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { LoadingSpinner, EmptyState } from '../components/UI';
import { getProducts, addToCart } from '../api';
import { useCart } from '../context/CartContext';

// Sort category sizes in a logical order
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

export default function ProductsScreen({ navigation }) {
  const [allProducts, setAllProducts] = useState([]);   // full list from API
  const [filtered, setFiltered] = useState([]);          // displayed list
  const [categories, setCategories] = useState(['All']); // derived from API
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const { refreshCart } = useCart();

  // ── Fetch all products once ──────────────────────────────────────
  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      const raw = res.data;
      // API returns { products: [...] }
      const data =
        Array.isArray(raw) ? raw :
        Array.isArray(raw?.products) ? raw.products :
        Array.isArray(raw?.data) ? raw.data : [];

      // Keep only active products
      const active = data.filter((p) => p.isActive !== false);
      setAllProducts(active);

      // Derive sorted unique categories
      const uniqueCats = [...new Set(active.map((p) => p.category).filter(Boolean))];
      setCategories(['All', ...sortCategories(uniqueCats)]);
    } catch (e) {
      console.log('Products error:', e);
      Alert.alert('Error', 'Could not load products. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // ── Local filtering (no re-fetch on filter change) ───────────────
  useEffect(() => {
    let list = allProducts;

    if (activeCategory !== 'All') {
      list = list.filter(
        (p) => p.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name?.toLowerCase().includes(q));
    }

    setFiltered(list);
  }, [allProducts, activeCategory, search]);

  // ── Add to cart ──────────────────────────────────────────────────
  const handleAddToCart = async (product) => {
    const outOfStock = (product.boxes ?? 1) <= 0;
    if (outOfStock) {
      Alert.alert('Out of Stock', 'This product is currently unavailable.');
      return;
    }
    setAddingId(product._id);
    try {
      await addToCart(product._id, 1, 1);
      refreshCart();
      Alert.alert('Added to Cart! 🛒', `${product.name} (${product.category}) added.`);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setAddingId(null);
    }
  };

  // ── Product card ─────────────────────────────────────────────────
  const renderProduct = ({ item }) => {
    const isAdding = addingId === item._id;
    const outOfStock = (item.boxes ?? 1) <= 0;
    const hasDiscount = item.originalPrice && item.price < item.originalPrice;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
        activeOpacity={0.88}
      >
        {/* Image */}
        <View style={styles.productImageBox}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.productEmoji}>💧</Text>
          )}

          {/* Category badge */}
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
          )}

          {/* Out-of-stock overlay */}
          {outOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

          <Text style={styles.bottlesPerBox}>
            {item.bottlesPerBox} bottles/box
          </Text>

          <View style={styles.productFooter}>
            <View>
              <Text style={styles.productPrice}>₹{item.price}
                <Text style={styles.perBox}>/box</Text>
              </Text>
              {hasDiscount && (
                <Text style={styles.productOriginalPrice}>₹{item.originalPrice}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.addBtn, (isAdding || outOfStock) && styles.addBtnDisabled]}
              onPress={() => handleAddToCart(item)}
              disabled={isAdding || outOfStock}
            >
              <Text style={styles.addBtnText}>{isAdding ? '…' : '+'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Water Products</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartBtn}>
          <Text style={{ fontSize: 22 }}>🛒</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips — derived from real API data */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.filterChipText, activeCategory === cat && styles.filterChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <Text style={styles.resultsCount}>
        {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
        {activeCategory !== 'All' ? ` · ${activeCategory}` : ''}
      </Text>

      {/* List */}
      {loading ? (
        <LoadingSpinner text="Loading products..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="No products found"
          subtitle="Try a different size or clear your search"
          action="Clear Filters"
          onAction={() => { setSearch(''); setActiveCategory('All'); }}
        />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={{ gap: SPACING.md }}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchProducts(); }}
              tintColor={COLORS.burgundy}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Header ──────────────────────────────────────────────────────
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
  backIcon: { fontSize: TYPOGRAPHY.lg, color: '#fff' },
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

  // ── Search ──────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  searchIcon: { fontSize: 16, marginRight: SPACING.sm },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textPrimary,
    fontFamily: 'DMSans_400Regular',
  },
  clearSearch: { fontSize: 14, color: COLORS.textMuted, padding: 4 },

  // ── Category chips ───────────────────────────────────────────────
  filterScroll: { maxHeight: 52 },
  filterContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.burgundy,
    borderColor: COLORS.burgundy,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: { color: '#fff' },

  // ── Results label ────────────────────────────────────────────────
  resultsCount: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },

  // ── List ─────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },

  // ── Product card ─────────────────────────────────────────────────
  productCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,   // rounded-2xl (16px)
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  productImageBox: {
    height: 150,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: { width: '100%', height: '100%' },
  productEmoji: { fontSize: 52 },

  // Category badge — top-right corner over image
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

  // Out-of-stock dim
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

  // Card body
  productInfo: { padding: SPACING.sm },
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
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 32,
    textAlign: 'center',
  },
});

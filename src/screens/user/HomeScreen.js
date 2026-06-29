import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  FlatList,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { CATEGORIES } from '../../constants/data';
import { AppContext } from '../../context/AppContext';
import ProductCard from '../../components/home/ProductCard';
import HeroBanner from '../../components/home/HeroBanner';
import CategoryChip from '../../components/home/CategoryChip';
import OrderCutoffBanner from '../../components/home/OrderCutoffBanner';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { cart, addToCart, unreadCount, products, selectedAdmin, loadProducts } = useContext(AppContext);
  const favorites = []; // favorites feature not yet implemented in API
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userLocation, setUserLocation] = useState('Detecting...');
  const [locLoading, setLocLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // ── Detect user city for display in header ──────────────────────────────────
  useEffect(() => {
    detectUserCity();
  }, []);

  const detectUserCity = async () => {
    setLocLoading(true);
    try {
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation('Location disabled');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (geo) {
        const city = geo.city || geo.subregion || geo.district || 'Your City';
        const state = geo.region ? geo.region.slice(0, 2).toUpperCase() : 'IN';
        setUserLocation(`${city}, ${state}`);
      } else {
        setUserLocation('Your Location');
      }
    } catch {
      setUserLocation('Tap to set location');
    } finally {
      setLocLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const featuredProducts = products.filter((p) => p.isFeatured && p.availability);
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Sticky blur header on scroll */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={80} style={styles.stickyHeaderBlur}>
          <View style={styles.stickyHeaderContent}>
            <Text style={styles.stickyTitle}>🍶 Toddy Connect</Text>
            <TouchableOpacity
              style={styles.cartBtnSmall}
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons name="bag-outline" size={20} color={COLORS.white} />
              {totalCartItems > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalCartItems}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      >
        {/* ── Hero Section ─────────────────────────────────────────────────── */}
        <LinearGradient colors={['#0d1f14', '#1a4a2e']} style={styles.heroSection}>

          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.accent} />
              <View>
                <Text style={styles.locationLabel}>Deliver to</Text>
                <TouchableOpacity
                  style={styles.locationBtn}
                  onPress={detectUserCity}
                  activeOpacity={0.75}
                >
                  {locLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 4 }} />
                  ) : (
                    <Ionicons name="navigate-circle" size={13} color={COLORS.primaryLight} />
                  )}
                  <Text style={styles.locationText} numberOfLines={1}>{userLocation}</Text>
                  <Ionicons name="chevron-down" size={13} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.topBarRight}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search-outline" size={22} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cartBtn}
                onPress={() => navigation.navigate('Cart')}
              >
                <Ionicons name="bag-outline" size={22} color={COLORS.white} />
                {totalCartItems > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.badgeText}>{totalCartItems}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting */}
          <View style={styles.greetingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
              <Text style={styles.greetingSubtext}>What would you like today?</Text>
            </View>
            {favorites.length > 0 && (
              <TouchableOpacity
                style={styles.favQuickBtn}
                onPress={() => navigation.navigate('FavoritesTab')}
                activeOpacity={0.8}
              >
                <Ionicons name="heart" size={16} color="#f44336" />
                <Text style={styles.favQuickBtnText}>{favorites.length}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Hero Banner Carousel */}
          <HeroBanner navigation={navigation} />
        </LinearGradient>

        {/* ── Shop Selection Banner ─────────────────────────────────────── */}
        {selectedAdmin ? (
          <TouchableOpacity
            style={styles.shopBanner}
            onPress={() => navigation.navigate('ShopSelection')}
            activeOpacity={0.85}
          >
            <View style={styles.shopBannerIcon}>
              <Text style={{ fontSize: 20 }}>🍶</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shopBannerLabel}>Ordering from</Text>
              <Text style={styles.shopBannerName} numberOfLines={1}>{selectedAdmin.shopName}</Text>
              <Text style={styles.shopBannerAddr} numberOfLines={1}>{selectedAdmin.address}</Text>
            </View>
            <View style={styles.shopBannerChange}>
              <Text style={styles.shopBannerChangeText}>Change</Text>
              <Ionicons name="chevron-forward" size={12} color={COLORS.accent} />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.shopBannerEmpty}
            onPress={() => navigation.navigate('ShopSelection')}
            activeOpacity={0.85}
          >
            <Ionicons name="storefront-outline" size={22} color="#ffb74d" />
            <View style={{ flex: 1 }}>
              <Text style={styles.shopBannerEmptyTitle}>Select a Toddy Shop</Text>
              <Text style={styles.shopBannerEmptySubtitle}>Choose a shop near you to start ordering</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ffb74d" />
          </TouchableOpacity>
        )}

        {/* Order Cutoff Banner */}
        <OrderCutoffBanner />

        {/* ── Categories ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse By Category</Text>
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => (
              <CategoryChip
                item={item}
                isSelected={selectedCategory === item.id}
                onPress={() => setSelectedCategory(item.id)}
              />
            )}
          />
        </View>

        {/* ── Featured Products ─────────────────────────────────────────────── */}
        {selectedCategory === 'all' && featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⭐ Featured Products</Text>
              <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={featuredProducts}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  variant="featured"
                  onPress={() => navigation.navigate('ProductDetail', { product: item })}
                  onAddToCart={() => addToCart(item)}
                />
              )}
            />
          </View>
        )}

        {/* ── All Products Grid ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all'
                ? '🛒 All Products'
                : CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'Products'}
            </Text>
            <Text style={styles.productCount}>{filteredProducts.length} items</Text>
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyCategory}>
              <Ionicons name="cube-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyCategoryText}>No products in this category</Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="grid"
                  onPress={() => navigation.navigate('ProductDetail', { product })}
                  onAddToCart={() => addToCart(product)}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Educational Banner ────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.educationBanner}
          onPress={() => navigation.navigate('Education')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(244,200,66,0.15)', 'rgba(45,134,83,0.2)']}
            style={styles.educationGradient}
          >
            <Text style={{ fontSize: 34 }}>📚</Text>
            <View style={styles.educationText}>
              <Text style={styles.educationTitle}>Learn About Toddy</Text>
              <Text style={styles.educationSubtitle}>
                History, health benefits & traditional tapping
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.accent} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </Animated.ScrollView>

      {/* ── Cart FAB ──────────────────────────────────────────────────────────── */}
      {totalCartItems > 0 && (
        <TouchableOpacity
          style={styles.cartFab}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <LinearGradient colors={['#2d8653', '#1a5c38']} style={styles.cartFabGradient}>
            <Ionicons name="bag-outline" size={20} color="#fff" />
            <Text style={styles.cartFabText}>
              View Cart • {totalCartItems} item{totalCartItems > 1 ? 's' : ''}
            </Text>
            <View style={styles.cartFabBadge}>
              <Text style={styles.cartFabBadgeText}>{totalCartItems}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  stickyHeaderBlur: { paddingTop: 44, paddingBottom: 12, paddingHorizontal: SPACING.xl },
  stickyHeaderContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stickyTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  cartBtnSmall: { padding: 6, position: 'relative' },
  heroSection: { paddingTop: 50, paddingBottom: SPACING.lg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flex: 1 },
  locationLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: width * 0.4 },
  locationText: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  iconBtn: { padding: 8, position: 'relative' },
  cartBtn: { padding: 8, position: 'relative' },
  cartBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: COLORS.accent, borderRadius: 8,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: '#ef5350', borderRadius: 8,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: COLORS.bgDark, fontSize: 9, fontWeight: '800' },
  greetingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg,
  },
  greeting: { color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  greetingSubtext: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, marginTop: 2 },
  favQuickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(244,67,54,0.15)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(244,67,54,0.3)',
  },
  favQuickBtnText: { color: '#f44336', fontSize: FONTS.sizes.sm, fontWeight: '800' },
  section: { paddingTop: SPACING.xl, paddingHorizontal: SPACING.xl },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  seeAll: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  productCount: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  categoryList: { paddingBottom: SPACING.md, paddingTop: 4 },
  featuredList: { paddingBottom: SPACING.sm },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  emptyCategory: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.xxxl, gap: SPACING.md,
  },
  emptyCategoryText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },
  shopBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    backgroundColor: 'rgba(45,134,83,0.12)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(45,134,83,0.2)',
  },
  shopBannerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(45,134,83,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  shopBannerLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  shopBannerName: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '800' },
  shopBannerAddr: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 1 },
  shopBannerChange: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  shopBannerChangeText: { color: COLORS.accent, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  shopBannerEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg,
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,152,0,0.2)',
  },
  shopBannerEmptyTitle: { color: '#ffb74d', fontSize: FONTS.sizes.md, fontWeight: '800' },
  shopBannerEmptySubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  educationBanner: {
    marginHorizontal: SPACING.xl, marginTop: SPACING.xl,
    borderRadius: RADIUS.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(244,200,66,0.2)',
  },
  educationGradient: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.xl, gap: SPACING.md,
  },
  educationText: { flex: 1 },
  educationTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  educationSubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  cartFab: {
    position: 'absolute', bottom: 90, left: SPACING.xl, right: SPACING.xl,
    borderRadius: RADIUS.full, overflow: 'hidden', ...SHADOWS.button,
  },
  cartFabGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl, gap: SPACING.md,
  },
  cartFabText: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700', flex: 1 },
  cartFabBadge: {
    backgroundColor: COLORS.accent, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  cartFabBadgeText: { color: COLORS.bgDark, fontSize: FONTS.sizes.xs, fontWeight: '800' },
});

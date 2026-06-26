import React, { useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';
import ProductCard from '../../components/home/ProductCard';

export default function FavoritesScreen({ navigation }) {
  const { getFavoriteProducts, addToCart, favorites } = useContext(AppContext);
  const favProducts = getFavoriteProducts();

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient colors={['#0d1f14', '#1a4a2e']} style={s.header}>
        <Ionicons name="heart" size={22} color="#f44336" />
        <Text style={s.headerTitle}>My Favourites</Text>
        {favorites.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countBadgeText}>{favorites.length}</Text>
          </View>
        )}
      </LinearGradient>

      {favProducts.length === 0 ? (
        /* ── Empty State ──────────────────────────────────────────────────── */
        <View style={s.emptyWrap}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="heart-dislike-outline" size={64} color={COLORS.textMuted} />
          </View>
          <Text style={s.emptyTitle}>No favourites yet</Text>
          <Text style={s.emptySubtitle}>
            Tap the ❤️ on any product to save it here for quick access
          </Text>
          <TouchableOpacity
            style={s.browseBtn}
            onPress={() => navigation.navigate('HomeTab')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#2d8653', '#1a5c38']} style={s.browseBtnGrad}>
              <Ionicons name="storefront-outline" size={18} color="#fff" />
              <Text style={s.browseBtnText}>Browse Products</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Favourites Grid ──────────────────────────────────────────────── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          <Text style={s.subtitle}>
            {favProducts.length} saved product{favProducts.length !== 1 ? 's' : ''}
          </Text>
          <View style={s.grid}>
            {favProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="grid"
                onPress={() => navigation.navigate('ProductDetail', { product })}
                onAddToCart={() => addToCart(product)}
              />
            ))}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingTop: 54, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl,
  },
  headerTitle: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  countBadge: {
    backgroundColor: '#f44336', borderRadius: 12,
    minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  countBadgeText: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '800' },
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xxxl, gap: SPACING.lg,
  },
  emptyIconWrap: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '700' },
  emptySubtitle: {
    color: COLORS.textMuted, fontSize: FONTS.sizes.md,
    textAlign: 'center', lineHeight: 22,
  },
  browseBtn: { borderRadius: RADIUS.full, overflow: 'hidden', ...SHADOWS.button, marginTop: SPACING.md },
  browseBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxxl,
  },
  browseBtnText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
  scroll: { padding: SPACING.xl },
  subtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginBottom: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
});

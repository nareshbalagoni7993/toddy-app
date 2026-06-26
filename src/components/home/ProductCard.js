import React, { useRef, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Image, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - SPACING.xl * 2 - SPACING.md) / 2;

export default function ProductCard({ product, variant = 'grid', onPress, onAddToCart }) {
  const { isFavorite, toggleFavorite } = useContext(AppContext);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleFavoritePress = (e) => {
    e.stopPropagation();
    Animated.sequence([
      Animated.spring(heartAnim, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(heartAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    toggleFavorite(product.id);
  };

  const isFeatured = variant === 'featured';
  const cardWidth = isFeatured ? 200 : GRID_ITEM_WIDTH;
  const favorited = isFavorite(product.id);

  const isOrderingAllowed = () => {
    if (!product.session || product.session === 'all') return true;
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    if (product.session === 'morning') {
      return hour < 10 || (hour === 10 && minute === 0);
    }
    if (product.session === 'evening') {
      return hour < 18 || (hour === 18 && minute === 0);
    }
    return true;
  };

  const orderingAllowed = isOrderingAllowed();
  const isAvailable = product.availability && orderingAllowed;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, isFeatured && styles.featuredWrap]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.card, { width: cardWidth }, isFeatured && styles.featuredCard]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
          style={styles.cardGradient}
        >
          {/* Product Image */}
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: product.image }}
              style={styles.image}
              resizeMode="cover"
            />
            {/* Tag badge */}
            {product.tag && (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{product.tag}</Text>
              </View>
            )}
            {/* Favorite heart button */}
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={handleFavoritePress}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                <Ionicons
                  name={favorited ? 'heart' : 'heart-outline'}
                  size={18}
                  color={favorited ? '#f44336' : 'rgba(255,255,255,0.8)'}
                />
              </Animated.View>
            </TouchableOpacity>
            {/* Unavailable overlay */}
            {!isAvailable && (
              <View style={styles.unavailableOverlay}>
                <Text style={styles.unavailableText}>
                  {!product.availability ? 'Out of Stock' : 'Closed'}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            <Text style={styles.unitInfo}>{product.unitSize}</Text>

            {/* Rating */}
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={COLORS.accent} />
              <Text style={styles.rating}>{product.rating}</Text>
              <Text style={styles.reviewCount}>({product.reviews})</Text>
            </View>

            {/* Price + Add button */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{product.price}</Text>
              {isAvailable ? (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={(e) => { e.stopPropagation(); onAddToCart(); }}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#2d8653', '#1a5c38']} style={styles.addBtnGradient}>
                    <Ionicons name="add" size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.unavailableBtn}>
                  <Text style={styles.unavailableBtnText}>N/A</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  featuredWrap: { marginRight: SPACING.md },
  card: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...SHADOWS.card,
  },
  featuredCard: { marginBottom: 0 },
  cardGradient: { flex: 1 },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 130, backgroundColor: '#1a3a24' },
  tagBadge: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    backgroundColor: COLORS.accent, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 2,
  },
  tagText: { color: COLORS.bgDark, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  heartBtn: {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  unavailableText: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  content: { padding: SPACING.md, gap: 4 },
  productName: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700', lineHeight: 18 },
  unitInfo: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { color: COLORS.accent, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  reviewCount: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '800' },
  addBtn: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', ...SHADOWS.button },
  addBtnGradient: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  unavailableBtn: {
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.sm,
  },
  unavailableBtnText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
});

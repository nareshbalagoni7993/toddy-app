import React, { useContext, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
  Image, StatusBar, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { cart, addToCart, updateQuantity, morningStock, eveningStock } = useContext(AppContext);

  const [activeImg, setActiveImg] = useState(0);
  const imgScrollRef = useRef(null);

  const cartItem = cart.find((item) => item.id === product.id);
  const cartQty = cartItem ? cartItem.quantity : 0;

  const hour = new Date().getHours();
  const availableStock = hour < 12 ? morningStock : eveningStock;
  const isToddy = product.category === 'toddy';
  const isOutOfStock = !product.availability || (isToddy && availableStock === 0);

  const allImages = product.images?.length > 0 ? product.images : [product.image];

  const scrollToImg = (idx) => {
    imgScrollRef.current?.scrollTo({ x: idx * width, animated: true });
    setActiveImg(idx);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

        {/* ── Photo Gallery ──────────────────────────────────────────────────── */}
        <View style={s.galleryWrap}>
          <ScrollView
            ref={imgScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImg(idx);
            }}
          >
            {allImages.map((uri, idx) => (
              <View key={idx} style={{ width }}>
                <Image source={{ uri }} style={s.heroImage} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(13,31,20,0.7)', COLORS.bgDark]}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            ))}
          </ScrollView>

          {/* Image counter */}
          <View style={s.imgCounter}>
            <Text style={s.imgCounterText}>{activeImg + 1} / {allImages.length}</Text>
          </View>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.thumbStrip}
              style={s.thumbStripWrap}
            >
              {allImages.map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => scrollToImg(idx)}
                  activeOpacity={0.85}
                  style={[s.thumb, idx === activeImg && s.thumbActive]}
                >
                  <Image source={{ uri }} style={s.thumbImg} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Tag badge */}
          {product.tag && (
            <View style={s.tagBadge}>
              <Text style={s.tagText}>{product.tag}</Text>
            </View>
          )}

          {/* Stock badge */}
          {isToddy && (
            <View style={[s.stockBadge, isOutOfStock && s.stockBadgeOut]}>
              <Text style={s.stockBadgeText}>
                {isOutOfStock ? '⚠️ Out of Stock' : `🍶 ${availableStock} left`}
              </Text>
            </View>
          )}
        </View>

        {/* Back button */}
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <View style={s.backBtnInner}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        {/* ── Product Info ──────────────────────────────────────────────────── */}
        <View style={s.content}>
          <View style={s.nameRow}>
            <View style={s.nameBlock}>
              <Text style={s.name}>{product.name}</Text>
              {product.nameTelugi && <Text style={s.nameTe}>{product.nameTelugi}</Text>}
            </View>
            <View style={s.priceBlock}>
              <Text style={s.price}>₹{product.price}</Text>
              <Text style={s.unit}>per {product.unitSize}</Text>
            </View>
          </View>

          {/* Rating */}
          <View style={s.ratingRow}>
            {[1,2,3,4,5].map((star) => (
              <Ionicons key={star} name={star <= Math.round(product.rating) ? 'star' : 'star-outline'} size={15} color={COLORS.accent} />
            ))}
            <Text style={s.ratingVal}>{product.rating}</Text>
            <Text style={s.ratingCount}>({product.reviews} reviews)</Text>
            <View style={s.ecoTag}>
              <Text style={s.ecoTagText}>🌴 Traditional</Text>
            </View>
          </View>

          {/* Feature pills */}
          <View style={s.pillRow}>
            <View style={s.pill}><Text style={s.pillText}>🏺 Clay Pot</Text></View>
            <View style={s.pill}><Text style={s.pillText}>🌿 Natural</Text></View>
            <View style={s.pill}><Text style={s.pillText}>♻️ Eco Glass</Text></View>
            {product.session !== 'all' && (
              <View style={[s.pill, s.pillAccent]}>
                <Text style={[s.pillText, { color: COLORS.accent }]}>
                  {product.session === 'morning' ? '🌅 Morning' : '🌇 Evening'}
                </Text>
              </View>
            )}
          </View>

          {/* Session info */}
          {product.session !== 'all' && (
            <View style={s.sessionCard}>
              <Ionicons name="time-outline" size={16} color={COLORS.accent} />
              <Text style={s.sessionText}>
                {product.session === 'morning'
                  ? 'Morning session only — order before 10:00 AM. Fresh toddy tapped at dawn.'
                  : 'Evening session only — order before 6:00 PM. Fermented from late afternoon tapping.'}
              </Text>
            </View>
          )}

          {/* Description */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>About This Product</Text>
            <Text style={s.desc}>{product.description}</Text>
          </View>

          {/* Benefits */}
          {product.benefits?.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Health Benefits</Text>
              <View style={s.benefitGrid}>
                {product.benefits.map((b, i) => (
                  <View key={i} style={s.benefitCard}>
                    <View style={s.benefitDot} />
                    <Text style={s.benefitText}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Traditional serving info */}
          <View style={s.servingCard}>
            <Text style={s.servingTitle}>🏺 Traditional Service</Text>
            <Text style={s.servingText}>
              All toddy is served in traditional clay pots or eco-friendly glasses. Clay pots preserve the natural taste and coolness of fresh toddy. Wooden trays used for premium packaging.
            </Text>
            <View style={s.servingIcons}>
              <ServingIcon emoji="🏺" label="Clay Pot" />
              <ServingIcon emoji="🥛" label="Fresh Foam" />
              <ServingIcon emoji="🌴" label="Palm Tree" />
              <ServingIcon emoji="🪵" label="Wooden Tray" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom CTA ───────────────────────────────────────────────────────── */}
      <View style={s.bottomBar}>
        {isOutOfStock ? (
          <View style={s.outOfStockBar}>
            <Ionicons name="warning-outline" size={20} color="#ff9800" />
            <Text style={s.outOfStockText}>
              {!product.availability ? 'Currently unavailable' : `${product.session === 'morning' ? 'Morning' : 'Evening'} stock exhausted`}
            </Text>
          </View>
        ) : cartQty > 0 ? (
          <>
            <View style={s.qtyCtrl}>
              <TouchableOpacity style={s.qtyBtn} onPress={() => updateQuantity(product.id, cartQty - 1)}>
                <Ionicons name={cartQty === 1 ? 'trash-outline' : 'remove'} size={20} color={cartQty === 1 ? '#ef5350' : COLORS.white} />
              </TouchableOpacity>
              <Text style={s.qtyNum}>{cartQty}</Text>
              <TouchableOpacity style={s.qtyBtn} onPress={() => updateQuantity(product.id, cartQty + 1)}>
                <Ionicons name="add" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.viewCartBtn} onPress={() => navigation.navigate('Cart')} activeOpacity={0.85}>
              <LinearGradient colors={['#2d8653', '#1a5c38']} style={s.viewCartGrad}>
                <Text style={s.viewCartText}>View Cart</Text>
                <Ionicons name="bag-check-outline" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={s.addBtn} onPress={() => addToCart(product)} activeOpacity={0.85}>
            <LinearGradient colors={['#2d8653', '#1a5c38']} style={s.addBtnGrad}>
              <Ionicons name="bag-add-outline" size={22} color="#fff" />
              <Text style={s.addBtnText}>Add to Cart • ₹{product.price}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ServingIcon({ emoji, label }) {
  return (
    <View style={s.servingIconWrap}>
      <Text style={s.servingIconEmoji}>{emoji}</Text>
      <Text style={s.servingIconLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  galleryWrap: { height: 320, position: 'relative', overflow: 'hidden' },
  heroImage: { width, height: 320 },
  imgCounter: { position: 'absolute', top: 56, right: SPACING.xl, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  imgCounterText: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  thumbStripWrap: { position: 'absolute', bottom: 12, left: 0, right: 0 },
  thumbStrip: { paddingHorizontal: SPACING.xl, gap: SPACING.sm },
  thumb: { width: 48, height: 48, borderRadius: RADIUS.sm, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', opacity: 0.65 },
  thumbActive: { borderColor: COLORS.primaryLight, opacity: 1 },
  thumbImg: { width: '100%', height: '100%' },
  tagBadge: { position: 'absolute', top: 56, left: SPACING.xl, backgroundColor: COLORS.accent, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 3 },
  tagText: { color: COLORS.bgDark, fontSize: FONTS.sizes.xs, fontWeight: '800' },
  stockBadge: { position: 'absolute', bottom: 70, right: SPACING.xl, backgroundColor: 'rgba(45,134,83,0.85)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 4 },
  stockBadgeOut: { backgroundColor: 'rgba(255,152,0,0.85)' },
  stockBadgeText: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  backBtn: { position: 'absolute', top: 50, left: SPACING.xl },
  backBtnInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  nameBlock: { flex: 1, marginRight: SPACING.md },
  name: { color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: '800', lineHeight: 30 },
  nameTe: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, marginTop: 4 },
  priceBlock: { alignItems: 'flex-end' },
  price: { color: COLORS.accent, fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  unit: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  ratingVal: { color: COLORS.accent, fontSize: FONTS.sizes.sm, fontWeight: '700', marginLeft: 4 },
  ratingCount: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, flex: 1 },
  ecoTag: { backgroundColor: 'rgba(45,134,83,0.2)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  ecoTagText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.lg },
  pill: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pillAccent: { backgroundColor: 'rgba(244,200,66,0.1)', borderColor: 'rgba(244,200,66,0.2)' },
  pillText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  sessionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: 'rgba(244,200,66,0.08)', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(244,200,66,0.2)', marginBottom: SPACING.lg },
  sessionText: { color: COLORS.accent, fontSize: FONTS.sizes.sm, flex: 1, lineHeight: 18 },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700', marginBottom: SPACING.md },
  desc: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, lineHeight: 24 },
  benefitGrid: { gap: SPACING.sm },
  benefitCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(45,134,83,0.07)', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(45,134,83,0.15)' },
  benefitDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.primaryLight, flexShrink: 0 },
  benefitText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, flex: 1 },
  servingCard: { backgroundColor: 'rgba(45,134,83,0.08)', borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: 'rgba(45,134,83,0.18)', marginBottom: SPACING.xl },
  servingTitle: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700', marginBottom: SPACING.sm },
  servingText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 20, marginBottom: SPACING.md },
  servingIcons: { flexDirection: 'row', justifyContent: 'space-around' },
  servingIconWrap: { alignItems: 'center', gap: 4 },
  servingIconEmoji: { fontSize: 28 },
  servingIconLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: SPACING.md, padding: SPACING.xl, paddingBottom: 30, backgroundColor: 'rgba(13,31,20,0.97)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  outOfStockBar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: 'rgba(255,152,0,0.1)', borderRadius: RADIUS.md, paddingVertical: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,152,0,0.2)' },
  outOfStockText: { color: '#ff9800', fontSize: FONTS.sizes.md, fontWeight: '700' },
  addBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.button },
  addBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
  addBtnText: { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: '700' },
  qtyCtrl: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xl, backgroundColor: 'rgba(45,134,83,0.2)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(45,134,83,0.4)', paddingVertical: SPACING.md },
  qtyBtn: { padding: SPACING.sm },
  qtyNum: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800', minWidth: 30, textAlign: 'center' },
  viewCartBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.button },
  viewCartGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
  viewCartText: { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: '700' },
});

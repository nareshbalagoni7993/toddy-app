import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { IMAGES } from '../../constants/data';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - SPACING.xl * 2;

const BANNERS = [
  {
    id: '1',
    title: 'Fresh Morning\nToddy',
    subtitle: 'White foamy • Clay pot collected • Order before 10 AM',
    tag: '🌅 Morning Special',
    cta: '₹200 / bottle',
    accent: '#4caf7d',
    bg: IMAGES.freshToddy,
    overlay: ['rgba(13,31,20,0.15)', 'rgba(13,31,20,0.88)'],
  },
  {
    id: '2',
    title: 'Toddy Trees\nVijayawada',
    subtitle: 'Fresh sap from 100-year-old Palmyra palms every dawn',
    tag: '🌴 Straight from Farm',
    cta: 'See Our Products',
    accent: '#81c784',
    bg: IMAGES.palmForest,
    overlay: ['rgba(13,31,20,0.1)', 'rgba(13,31,20,0.85)'],
  },
  {
    id: '3',
    title: 'Traditional\nClay Pot Service',
    subtitle: 'Eco-friendly clay cups • No plastic • Pure taste preserved',
    tag: '🏺 Eco Friendly',
    cta: 'Order Now',
    accent: '#f4c842',
    bg: IMAGES.toddyPots,
    overlay: ['rgba(40,20,0,0.15)', 'rgba(20,10,0,0.88)'],
  },
  {
    id: '4',
    title: 'Palm Jaggery\nWooden Fresh',
    subtitle: 'Organic • Chemical-free • Served on traditional wooden tray',
    tag: '🍯 Organic',
    cta: '₹120 / 500g',
    accent: '#ffb74d',
    bg: IMAGES.woodenServing,
    overlay: ['rgba(30,15,0,0.15)', 'rgba(20,10,0,0.85)'],
  },
  {
    id: '5',
    title: 'Ice Apple\nTati Munjalu',
    subtitle: 'Nature\'s coolant • Eco glass served • Summer special',
    tag: '🧊 Summer Hit',
    cta: '₹50 / piece',
    accent: '#64b5f6',
    bg: IMAGES.iceApple,
    overlay: ['rgba(0,20,40,0.15)', 'rgba(0,15,30,0.88)'],
  },
];

export default function HeroBanner({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollTo({ x: next * (BANNER_WIDTH + SPACING.md), animated: true });
        return next;
      });
    }, 4000);
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const handleScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + SPACING.md));
    if (index !== activeIndex) setActiveIndex(index);
  };

  const goTo = (i) => {
    scrollRef.current?.scrollTo({ x: i * (BANNER_WIDTH + SPACING.md), animated: true });
    setActiveIndex(i);
    resetTimer();
  };

  return (
    <View style={s.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_WIDTH + SPACING.md}
        decelerationRate="fast"
        contentContainerStyle={s.scroll}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={32}
      >
        {BANNERS.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.95}
            style={s.bannerWrap}
            onPress={() => navigation?.navigate('Cart')}
          >
            {/* Product Photo Background */}
            <Image
              source={{ uri: banner.bg }}
              style={s.bannerBg}
              resizeMode="cover"
            />

            {/* Gradient overlay for readability */}
            <LinearGradient colors={banner.overlay} style={s.overlay} />

            {/* Content */}
            <View style={s.content}>
              {/* Tag badge */}
              <View style={[s.tag, { backgroundColor: `${banner.accent}25`, borderColor: `${banner.accent}50` }]}>
                <Text style={[s.tagText, { color: banner.accent }]}>{banner.tag}</Text>
              </View>

              {/* Title */}
              <Text style={s.title}>{banner.title}</Text>

              {/* Subtitle */}
              <Text style={s.subtitle} numberOfLines={2}>{banner.subtitle}</Text>

              {/* CTA Row */}
              <View style={s.ctaRow}>
                <View style={[s.ctaBtn, { backgroundColor: banner.accent }]}>
                  <Text style={s.ctaBtnText}>{banner.cta}</Text>
                  <Ionicons name="arrow-forward" size={13} color="#0d1f14" />
                </View>

                {/* Clay pot + eco glass indicators */}
                <View style={s.indicators}>
                  <View style={s.indicator}>
                    <Text style={s.indicatorIcon}>🏺</Text>
                  </View>
                  <View style={s.indicator}>
                    <Text style={s.indicatorIcon}>🌴</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Shine edge */}
            <LinearGradient
              colors={['rgba(255,255,255,0.12)', 'transparent']}
              style={s.shine}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={s.dots}>
        {BANNERS.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
            <View style={[s.dot, i === activeIndex && s.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: SPACING.xl },
  scroll: { gap: SPACING.md, paddingRight: SPACING.xl },
  bannerWrap: { width: BANNER_WIDTH, height: 195, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bannerBg: { position: 'absolute', width: '100%', height: '100%', borderRadius: RADIUS.xl },
  overlay: { position: 'absolute', width: '100%', height: '100%' },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, borderRadius: RADIUS.xl },
  content: { flex: 1, padding: SPACING.xl, justifyContent: 'flex-end', gap: SPACING.xs },
  tag: { alignSelf: 'flex-start', paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1, marginBottom: 2 },
  tagText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  title: { color: '#fff', fontSize: FONTS.sizes.xl, fontWeight: '800', lineHeight: 26, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  subtitle: { color: 'rgba(255,255,255,0.78)', fontSize: FONTS.sizes.xs, lineHeight: 16 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.full },
  ctaBtnText: { color: '#0d1f14', fontSize: FONTS.sizes.xs, fontWeight: '800' },
  indicators: { flexDirection: 'row', gap: 6 },
  indicator: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  indicatorIcon: { fontSize: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: SPACING.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { width: 22, height: 6, borderRadius: 3, backgroundColor: COLORS.primaryLight },
});

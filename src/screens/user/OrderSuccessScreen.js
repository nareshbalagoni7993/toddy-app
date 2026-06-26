import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function OrderSuccessScreen({ navigation, route }) {
  const { orderId } = route.params || {};
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 45, friction: 6, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(checkAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    // Auto-navigate to tracking after 3s
    const t = setTimeout(() => {
      if (orderId) navigation.replace('OrderTracking', { orderId });
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <LinearGradient colors={['#0d1f14', '#142a1c']} style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Confetti-like background dots */}
      {[...Array(8)].map((_, i) => (
        <View key={i} style={[s.confettiDot, { top: `${10 + i * 11}%`, left: i % 2 === 0 ? `${5 + i * 5}%` : undefined, right: i % 2 !== 0 ? `${5 + i * 3}%` : undefined, backgroundColor: i % 3 === 0 ? COLORS.primaryLight : i % 3 === 1 ? COLORS.accent : 'rgba(255,255,255,0.2)' }]} />
      ))}

      <Animated.View style={[s.content, { transform: [{ scale: scaleAnim }] }]}>
        <View style={s.iconWrap}>
          <LinearGradient colors={['#2d8653', '#1a5c38']} style={s.iconGrad}>
            <Animated.View style={{ transform: [{ scale: checkAnim }] }}>
              <Ionicons name="checkmark" size={64} color={COLORS.white} />
            </Animated.View>
          </LinearGradient>
          <View style={s.iconRing1} />
          <View style={s.iconRing2} />
        </View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', gap: SPACING.sm }}>
          <Text style={s.emoji}>🎉</Text>
          <Text style={s.title}>Order Placed!</Text>
          <Text style={s.sub}>Your fresh toddy is on its way.{'\n'}We'll confirm your order shortly.</Text>
          {orderId && <Text style={s.orderId}>{orderId}</Text>}
        </Animated.View>
      </Animated.View>

      <Animated.View style={[s.buttons, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={s.trackBtn}
          onPress={() => navigation.replace('OrderTracking', { orderId })}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#2d8653', '#1a5c38']} style={s.trackBtnGrad}>
            <Ionicons name="location-outline" size={20} color={COLORS.white} />
            <Text style={s.trackBtnText}>Track Order</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.homeBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'UserMain' }] })}
          activeOpacity={0.85}
        >
          <Text style={s.homeBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={s.hint}>Redirecting to order tracking in 3s...</Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxl },
  confettiDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, opacity: 0.4 },
  content: { alignItems: 'center', gap: SPACING.xl, marginBottom: SPACING.xxxl },
  iconWrap: { position: 'relative', width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  iconGrad: { width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center', ...SHADOWS.button },
  iconRing1: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: 'rgba(45,134,83,0.3)', top: -10, left: -10 },
  iconRing2: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: 'rgba(45,134,83,0.15)', top: -20, left: -20 },
  emoji: { fontSize: 44 },
  title: { color: COLORS.white, fontSize: FONTS.sizes.hero, fontWeight: '800', textAlign: 'center' },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, textAlign: 'center', lineHeight: 24 },
  orderId: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '700', marginTop: SPACING.xs },
  buttons: { width: '100%', gap: SPACING.md },
  trackBtn: { borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.button },
  trackBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
  trackBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  homeBtn: { paddingVertical: SPACING.lg, alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  homeBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.lg, fontWeight: '600' },
  hint: { position: 'absolute', bottom: 40, color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
});

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.xl * 2 - SPACING.md) / 2;

function SkeletonBox({ width: w, height: h, style, borderRadius = 8, shimmerAnim }) {
  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });
  return (
    <Animated.View
      style={[
        styles.skeletonBox,
        { width: w, height: h, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  return (
    <View style={[styles.card, { width: CARD_WIDTH }]}>
      <SkeletonBox width="100%" height={130} borderRadius={0} shimmerAnim={shimmerAnim} />
      <View style={styles.content}>
        <SkeletonBox width="85%" height={12} shimmerAnim={shimmerAnim} style={{ marginBottom: 6 }} />
        <SkeletonBox width="55%" height={10} shimmerAnim={shimmerAnim} style={{ marginBottom: 8 }} />
        <SkeletonBox width="40%" height={10} shimmerAnim={shimmerAnim} style={{ marginBottom: 8 }} />
        <View style={styles.priceRow}>
          <SkeletonBox width={50} height={20} borderRadius={6} shimmerAnim={shimmerAnim} />
          <SkeletonBox width={32} height={32} borderRadius={16} shimmerAnim={shimmerAnim} />
        </View>
      </View>
    </View>
  );
}

export function ProductGridSkeleton({ count = 4 }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function OrderCardSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <SkeletonBox width={160} height={16} borderRadius={6} shimmerAnim={shimmerAnim} />
        <SkeletonBox width={70} height={22} borderRadius={11} shimmerAnim={shimmerAnim} />
      </View>
      <SkeletonBox width="70%" height={12} borderRadius={6} shimmerAnim={shimmerAnim} style={{ marginTop: 8 }} />
      <SkeletonBox width="50%" height={12} borderRadius={6} shimmerAnim={shimmerAnim} style={{ marginTop: 6 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  card: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  content: {
    padding: SPACING.md,
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  orderCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: SPACING.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

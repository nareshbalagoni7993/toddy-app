import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

function getSessionInfo() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentMinutes = hour * 60 + minute;
  const morningCutoff = 10 * 60;
  const eveningCutoff = 18 * 60;

  if (currentMinutes < morningCutoff) {
    const remaining = morningCutoff - currentMinutes;
    const h = Math.floor(remaining / 60);
    const m = remaining % 60;
    return {
      icon: 'sunny-outline',
      text: `Morning toddy cutoff in ${h > 0 ? `${h}h ` : ''}${m}m — order now!`,
      color: COLORS.accent,
    };
  }
  if (currentMinutes < eveningCutoff) {
    const remaining = eveningCutoff - currentMinutes;
    const h = Math.floor(remaining / 60);
    const m = remaining % 60;
    return {
      icon: 'time-outline',
      text: `Evening toddy order closes in ${h}h ${m}m`,
      color: COLORS.primaryLight,
    };
  }
  return {
    icon: 'moon-outline',
    text: 'Toddy orders closed for today. Back at 6:00 AM',
    color: COLORS.textMuted,
  };
}

export default function OrderCutoffBanner() {
  const [info, setInfo] = useState(getSessionInfo);

  useEffect(() => {
    const interval = setInterval(() => setInfo(getSessionInfo()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.banner, { borderColor: `${info.color}40` }]}>
      <View style={[styles.dot, { backgroundColor: info.color }]} />
      <Ionicons name={info.icon} size={14} color={info.color} />
      <Text style={[styles.text, { color: info.color }]}>{info.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: FONTS.sizes.sm, fontWeight: '600', flex: 1 },
});

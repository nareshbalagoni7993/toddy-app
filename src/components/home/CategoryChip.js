import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function CategoryChip({ item, isSelected, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.wrapper}>
      {isSelected ? (
        <LinearGradient colors={['#2d8653', '#1a5c38']} style={styles.chip}>
          <Ionicons name={item.icon} size={15} color={COLORS.white} />
          <Text style={[styles.label, styles.labelActive]}>{item.name}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.chip}>
          <Ionicons name={item.icon} size={15} color={COLORS.textMuted} />
          <Text style={styles.label}>{item.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginRight: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  label: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  labelActive: { color: COLORS.white },
});

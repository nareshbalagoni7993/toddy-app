import React, { useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';

export default function ProfileScreen({ navigation }) {
  const { orders, cart, user, unreadCount, logoutUser, favorites } = useContext(AppContext);

  // ── Fix: use CommonActions.reset to properly navigate from tab screen ───────
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
          navigation.getParent()?.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
          );
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      badge: unreadCount > 0 ? unreadCount : null,
      color: '#7986cb',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'heart-outline',
      label: 'My Favourites',
      badge: favorites.length > 0 ? favorites.length : null,
      badgeColor: '#f44336',
      color: '#f44336',
      onPress: () => navigation.navigate('FavoritesTab'),
    },
    {
      icon: 'receipt-outline',
      label: 'Order History',
      badge: orders.length > 0 ? orders.length : null,
      color: '#4caf7d',
      onPress: () => navigation.navigate('OrdersTab'),
    },
    {
      icon: 'compass-outline',
      label: 'Learn & Explore',
      color: '#ffb74d',
      onPress: () => navigation.navigate('ExploreTab'),
    },
    {
      icon: 'location-outline',
      label: 'Saved Addresses',
      color: '#64b5f6',
      soon: true,
    },
    {
      icon: 'card-outline',
      label: 'Payment Methods',
      color: '#81c784',
      soon: true,
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      color: '#ce93d8',
      soon: true,
    },
    {
      icon: 'information-circle-outline',
      label: 'About Toddy Connect',
      color: '#4db6ac',
      soon: true,
    },
  ];

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Profile Header ────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#0d1f14', '#1a4a2e']} style={s.header}>
        <View style={s.avatarWrap}>
          <Ionicons name="person" size={44} color={COLORS.primaryLight} />
        </View>
        <Text style={s.userName}>
          {user?.phone ? `+91 ${user.phone}` : 'My Profile'}
        </Text>
        <Text style={s.userTagline}>Toddy Connect Customer</Text>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{orders.length}</Text>
            <Text style={s.statLabel}>Orders</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>{favorites.length}</Text>
            <Text style={[s.statLabel, favorites.length > 0 && { color: '#f44336' }]}>
              {favorites.length > 0 ? '♥ Favs' : 'Favs'}
            </Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>{cart.length}</Text>
            <Text style={s.statLabel}>In Cart</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statValue, unreadCount > 0 && { color: '#ef5350' }]}>
              {unreadCount}
            </Text>
            <Text style={s.statLabel}>Notifs</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Menu Items ────────────────────────────────────────────────────── */}
        <View style={s.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={s.menuItem}
              onPress={
                item.soon
                  ? () => Alert.alert('Coming Soon', 'This feature will be available soon!')
                  : item.onPress
              }
              activeOpacity={0.75}
            >
              <View style={[s.menuIcon, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              {item.badge > 0 && (
                <View style={[s.badge, { backgroundColor: item.badgeColor || COLORS.primaryLight }]}>
                  <Text style={s.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
                </View>
              )}
              {item.soon && (
                <View style={s.soonBadge}>
                  <Text style={s.soonText}>Soon</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Logout ────────────────────────────────────────────────────────── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={s.version}>Toddy Connect v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    paddingTop: 60, paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xl, alignItems: 'center',
  },
  avatarWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(45,134,83,0.2)',
    borderWidth: 3, borderColor: 'rgba(45,134,83,0.4)',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  userName: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '800' },
  userTagline: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 4, marginBottom: SPACING.xl },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  statItem: { alignItems: 'center', minWidth: 48 },
  statValue: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.12)' },
  menuSection: { padding: SPACING.xl, gap: SPACING.sm },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '600' },
  badge: {
    borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  soonBadge: {
    backgroundColor: 'rgba(244,200,66,0.15)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(244,200,66,0.25)',
  },
  soonText: { color: COLORS.accent, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    padding: SPACING.lg, marginHorizontal: SPACING.xl, marginTop: SPACING.sm,
    borderRadius: RADIUS.lg, backgroundColor: 'rgba(244,67,54,0.08)',
    borderWidth: 1, borderColor: 'rgba(244,67,54,0.2)',
  },
  logoutText: { color: COLORS.error, fontSize: FONTS.sizes.md, fontWeight: '700' },
  version: {
    color: COLORS.textMuted, fontSize: FONTS.sizes.xs,
    textAlign: 'center', paddingVertical: SPACING.xl,
  },
});

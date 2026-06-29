import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';
import { superAdminAPI } from '../../config/api';

function StatCard({ icon, label, value, color, sub }) {
  return (
    <View style={[s.statCard, { borderColor: color + '40' }]}>
      <View style={[s.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub ? <Text style={[s.statSub, { color }]}>{sub}</Text> : null}
    </View>
  );
}

function fmt(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export default function SuperAdminDashboardScreen({ navigation }) {
  const { user, logoutUser } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await superAdminAPI.getDashboard();
      setData(res.data.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await logoutUser();
          navigation.getParent()?.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
          );
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={s.loadWrap}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
        <Text style={s.loadText}>Loading Super Admin Dashboard...</Text>
      </View>
    );
  }

  const st = data?.ordersByStatus || {};

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient colors={['#0d0d1a', '#1a1a35', '#0d1f14']} style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerGreet}>Super Admin</Text>
            <Text style={s.headerName}>Toddy Connect HQ</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          </TouchableOpacity>
        </View>
        <View style={s.headerStats}>
          <View style={s.hStat}>
            <Text style={s.hStatV}>{data?.totalAdmins || 0}</Text>
            <Text style={s.hStatL}>Total Shops</Text>
          </View>
          <View style={s.hDivider} />
          <View style={s.hStat}>
            <Text style={s.hStatV}>{data?.totalUsers || 0}</Text>
            <Text style={s.hStatL}>Users</Text>
          </View>
          <View style={s.hDivider} />
          <View style={s.hStat}>
            <Text style={[s.hStatV, { color: COLORS.accent }]}>{fmt(data?.totalRevenue || 0)}</Text>
            <Text style={s.hStatL}>Revenue</Text>
          </View>
          <View style={s.hDivider} />
          <View style={s.hStat}>
            <Text style={[s.hStatV, { color: '#ffb74d' }]}>{data?.todayOrders || 0}</Text>
            <Text style={s.hStatL}>Today</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primaryLight} />
        }
      >

        {/* Quick actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('ManageAdmins')} activeOpacity={0.85}>
              <LinearGradient colors={['rgba(45,134,83,0.25)', 'rgba(45,134,83,0.1)']} style={s.actionGrad}>
                <Ionicons name="storefront-outline" size={26} color={COLORS.primaryLight} />
                <Text style={s.actionLabel}>Manage Shops</Text>
                <Text style={s.actionSub}>{data?.activeAdmins} active</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('CreateAdmin')} activeOpacity={0.85}>
              <LinearGradient colors={['rgba(121,134,203,0.25)', 'rgba(121,134,203,0.1)']} style={s.actionGrad}>
                <Ionicons name="person-add-outline" size={26} color="#9fa8da" />
                <Text style={s.actionLabel}>Add Shop</Text>
                <Text style={s.actionSub}>Register admin</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('AllOrders')} activeOpacity={0.85}>
              <LinearGradient colors={['rgba(255,183,77,0.2)', 'rgba(255,183,77,0.05)']} style={s.actionGrad}>
                <Ionicons name="receipt-outline" size={26} color="#ffb74d" />
                <Text style={s.actionLabel}>All Orders</Text>
                <Text style={s.actionSub}>{data?.totalOrders} total</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Status Breakdown */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Status</Text>
          <View style={s.statsGrid}>
            <StatCard icon="receipt-outline" label="Placed" value={st.placed || 0} color="#64b5f6" />
            <StatCard icon="checkmark-circle-outline" label="Accepted" value={st.accepted || 0} color="#81c784" />
            <StatCard icon="time-outline" label="Preparing" value={st.preparing || 0} color="#ffb74d" />
            <StatCard icon="bicycle-outline" label="On Way" value={st.out_for_delivery || 0} color="#7986cb" />
            <StatCard icon="home-outline" label="Delivered" value={st.delivered || 0} color="#4caf50" sub={fmt((st.delivered || 0) * 200)} />
            <StatCard icon="close-circle-outline" label="Cancelled" value={st.cancelled || 0} color="#ef5350" />
          </View>
        </View>

        {/* Top Performing Shops */}
        {(data?.topAdmins?.length > 0) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Top Performing Shops</Text>
            {data.topAdmins.map((a, i) => (
              <TouchableOpacity
                key={a._id}
                style={s.adminCard}
                onPress={() => navigation.navigate('AdminDetail', { adminId: a._id })}
                activeOpacity={0.85}
              >
                <View style={s.rankBadge}>
                  <Text style={s.rankText}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.adminShopName}>{a.shopName}</Text>
                  <Text style={s.adminOwner}>{a.ownerName}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.adminRevenue}>{fmt(a.totalRevenue)}</Text>
                  <Text style={s.adminOrders}>{a.totalOrders} orders</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Orders */}
        {(data?.recentOrders?.length > 0) && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllOrders')}>
                <Text style={s.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {data.recentOrders.map((o) => (
              <View key={o._id} style={s.orderRow}>
                <View style={s.orderLeft}>
                  <Text style={s.orderOid}>{o.orderId}</Text>
                  <Text style={s.orderShop}>{o.adminName || o.adminId?.shopName}</Text>
                </View>
                <View style={s.orderRight}>
                  <Text style={s.orderAmt}>₹{o.total}</Text>
                  <View style={[s.statusPill, { backgroundColor: STATUS_COLOR[o.status] + '30' }]}>
                    <Text style={[s.statusText, { color: STATUS_COLOR[o.status] }]}>{o.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const STATUS_COLOR = {
  placed: '#64b5f6', accepted: '#81c784', preparing: '#ffb74d',
  ready: '#4db6ac', out_for_delivery: '#7986cb', delivered: '#4caf50', cancelled: '#ef5350',
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  loadWrap: { flex: 1, backgroundColor: COLORS.bgDark, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },
  header: { paddingTop: 56, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.xl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xl },
  headerGreet: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  headerName: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(244,67,54,0.1)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(244,67,54,0.2)' },
  headerStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.lg },
  hStat: { flex: 1, alignItems: 'center' },
  hStatV: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  hStatL: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  hDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  section: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '800', marginBottom: SPACING.md },
  seeAll: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: SPACING.sm },
  actionCard: { flex: 1, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  actionGrad: { padding: SPACING.lg, alignItems: 'center', gap: 6 },
  actionLabel: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700', textAlign: 'center' },
  actionSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statCard: { width: '31%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.md, alignItems: 'center', gap: 4 },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  statSub: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  adminCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(45,134,83,0.2)', alignItems: 'center', justifyContent: 'center' },
  rankText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '800' },
  adminShopName: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700' },
  adminOwner: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  adminRevenue: { color: COLORS.accent, fontSize: FONTS.sizes.lg, fontWeight: '800' },
  adminOrders: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xs },
  orderLeft: { flex: 1 },
  orderOid: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  orderShop: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderAmt: { color: COLORS.accent, fontSize: FONTS.sizes.md, fontWeight: '800' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700', textTransform: 'capitalize' },
});

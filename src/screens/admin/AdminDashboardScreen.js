import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, RefreshControl, ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';

function statusColor(s) {
  const m = {
    placed: '#64b5f6', accepted: '#81c784', preparing: '#ffb74d',
    ready: '#4db6ac', out_for_delivery: '#7986cb', delivered: '#4caf50', cancelled: '#ef5350',
  };
  return m[s] || COLORS.textMuted;
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminDashboardScreen({ navigation }) {
  const { user, orders, stock, adminDashboard, loadAdminDashboard, logoutUser } = useContext(AppContext);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!adminDashboard);

  useEffect(() => {
    if (!adminDashboard) {
      loadAdminDashboard().finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminDashboard();
    setRefreshing(false);
  };

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

  // Compute counts from live orders state (real-time via socket)
  const pendingCount   = orders.filter((o) => o.status === 'placed').length;
  const acceptedCount  = orders.filter((o) => o.status === 'accepted').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const ofdCount       = orders.filter((o) => o.status === 'out_for_delivery').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;
  const activeCount    = acceptedCount + preparingCount + ofdCount;

  // Revenue and deeper stats come from API dashboard
  const db = adminDashboard || {};
  const todayOrders    = db.todayOrders    ?? 0;
  const weeklyRevenue  = db.weeklyRevenue  ?? 0;
  const monthlyRevenue = db.monthlyRevenue ?? 0;

  const morningStock = stock?.morningStock ?? 50;
  const eveningStock = stock?.eveningStock ?? 40;

  const recentOrders = orders.slice(0, 8);

  if (initialLoading) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient colors={['#0d1f14', '#142a1c']} style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>Admin Dashboard</Text>
          <Text style={s.sub}>{user?.shopName || user?.name || user?.phone || 'Admin'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={s.headerBtn}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryLight} />}
      >

        {/* ── Today Summary ─────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Today's Summary</Text>
        <View style={s.statsGrid}>
          <StatCard icon="receipt-outline"          label="Today Orders"  value={todayOrders}    color="#81c784" />
          <StatCard icon="time-outline"             label="Pending"       value={pendingCount}   color="#ffb74d" alert={pendingCount > 0} />
          <StatCard icon="flash-outline"            label="Active"        value={activeCount}    color="#7986cb" />
          <StatCard icon="checkmark-circle-outline" label="Delivered"     value={deliveredCount} color="#4db6ac" />
          <StatCard icon="calendar-outline"         label="Weekly Rev"    value={`₹${weeklyRevenue}`}  color="#64b5f6" />
          <StatCard icon="bar-chart-outline"        label="Monthly Rev"   value={`₹${monthlyRevenue}`} color="#ce93d8" />
        </View>

        {/* ── Order Status Breakdown ────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Order Status</Text>
        <View style={s.statusGrid}>
          <StatusChip label="Placed"       count={pendingCount}   color="#64b5f6" />
          <StatusChip label="Accepted"     count={acceptedCount}  color="#81c784" />
          <StatusChip label="Preparing"    count={preparingCount} color="#ffb74d" />
          <StatusChip label="Out Delivery" count={ofdCount}       color="#7986cb" />
          <StatusChip label="Delivered"    count={deliveredCount} color="#4caf50" />
          <StatusChip label="Cancelled"    count={cancelledCount} color="#ef5350" />
        </View>

        {/* ── Stock Status ─────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Stock Status</Text>
        <View style={s.stockCard}>
          <View style={s.stockRow}>
            <StockItem emoji="🌅" label="Morning" value={morningStock} max={100} />
            <View style={s.stockDivider} />
            <StockItem emoji="🌇" label="Evening" value={eveningStock} max={100} />
          </View>
          {(morningStock === 0 || eveningStock === 0) && (
            <View style={s.outOfStockAlert}>
              <Ionicons name="close-circle-outline" size={14} color="#ef5350" />
              <Text style={s.outOfStockText}>
                {morningStock === 0 && eveningStock === 0
                  ? 'All stocks are OUT — ordering is disabled for customers'
                  : morningStock === 0
                  ? 'Morning stock OUT — morning toddy ordering disabled'
                  : 'Evening stock OUT — evening toddy ordering disabled'}
              </Text>
            </View>
          )}
        </View>

        {/* ── Quick Actions ─────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          <ActionBtn
            icon="receipt-outline" label="Manage Orders" color="#7986cb"
            badge={pendingCount}
            onPress={() => navigation.navigate('AdminOrders')}
          />
          <ActionBtn
            icon="layers-outline" label="Update Stock" color="#4db6ac"
            onPress={() => navigation.navigate('AdminStock')}
          />
          <ActionBtn
            icon="cube-outline" label="Products" color="#ce93d8"
            onPress={() => navigation.navigate('AdminProducts')}
          />
        </View>

        {/* ── Recent Orders ─────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Recent Orders</Text>
        {recentOrders.map((o) => (
          <TouchableOpacity
            key={o._id}
            style={s.orderRow}
            onPress={() => navigation.navigate('AdminOrders')}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.orderId}>{o.orderId || o._id?.slice(-6)}</Text>
              <Text style={s.orderMeta}>
                {o.customer?.phone || o.userId?.phone} • {o.deliveryType === 'home' ? '🚴 Home' : '🚶 Pickup'} • ₹{o.total}
              </Text>
              <Text style={s.orderTime}>{fmtDate(o.createdAt)}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: statusColor(o.status) + '25' }]}>
              <Text style={[s.statusText, { color: statusColor(o.status) }]}>
                {o.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {orders.length === 0 && (
          <View style={s.emptyOrders}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.textMuted} />
            <Text style={s.emptyText}>No orders yet</Text>
            <Text style={s.emptySub}>Orders from customers will appear here in real-time</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, alert }) {
  return (
    <View style={[s.statCard, alert && s.statCardAlert]}>
      <View style={[s.statIconWrap, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function StatusChip({ label, count, color }) {
  return (
    <View style={[s.statusChip, { borderColor: color + '40' }]}>
      <Text style={[s.statusChipCount, { color }]}>{count}</Text>
      <Text style={s.statusChipLabel}>{label}</Text>
    </View>
  );
}

function StockItem({ emoji, label, value, max }) {
  const pct = Math.min((value / max) * 100, 100);
  const low = value > 0 && value < 10;
  return (
    <View style={s.stockItem}>
      <Text style={s.stockEmoji}>{emoji}</Text>
      <Text style={s.stockLabel}>{label} Stock</Text>
      <Text style={[s.stockValue, low && s.stockLow, value === 0 && s.stockOut]}>
        {value === 0 ? 'OUT OF STOCK' : `${value} bottles`}
      </Text>
      <View style={s.barBg}>
        <View style={[s.barFill, {
          width: `${pct}%`,
          backgroundColor: value === 0 ? '#ef5350' : low ? '#ffb74d' : COLORS.primaryLight,
        }]} />
      </View>
    </View>
  );
}

function ActionBtn({ icon, label, color, onPress, badge }) {
  return (
    <TouchableOpacity style={s.actionBtn} onPress={onPress} activeOpacity={0.85}>
      <View style={[s.actionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={22} color={color} />
        {badge > 0 && (
          <View style={s.actionBadge}><Text style={s.actionBadgeText}>{badge}</Text></View>
        )}
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    paddingTop: 54, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl,
    flexDirection: 'row', alignItems: 'center',
  },
  greeting: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  headerBtn: { padding: 8 },
  scroll: { padding: SPACING.xl },
  sectionTitle: {
    color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700',
    marginBottom: SPACING.md, marginTop: SPACING.lg,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  statCard: {
    width: '31%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 4,
  },
  statCardAlert: { borderColor: 'rgba(255,152,0,0.35)', backgroundColor: 'rgba(255,152,0,0.07)' },
  statIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800', marginTop: 4 },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statusChip: {
    width: '30%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', borderWidth: 1,
  },
  statusChipCount: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  statusChipLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', marginTop: 2 },
  stockCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  stockRow: { flexDirection: 'row', gap: SPACING.md },
  stockItem: { flex: 1, gap: 6 },
  stockEmoji: { fontSize: 22 },
  stockLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  stockValue: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '800' },
  stockLow: { color: '#ffb74d' },
  stockOut: { color: '#ef5350', fontSize: FONTS.sizes.sm },
  stockDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  barBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  outOfStockAlert: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: 'rgba(239,83,80,0.1)', borderRadius: RADIUS.sm,
    padding: SPACING.sm, marginTop: SPACING.md,
  },
  outOfStockText: { color: '#ef5350', fontSize: FONTS.sizes.xs, flex: 1 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  actionBtn: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl,
    padding: SPACING.lg, gap: SPACING.xs, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xs, position: 'relative',
  },
  actionBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#ef5350', borderRadius: 8, width: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  actionLabel: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  orderId: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  orderMeta: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  orderTime: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 1 },
  statusPill: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700', textTransform: 'capitalize' },
  emptyOrders: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xxl },
  emptyText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '600' },
  emptySub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, textAlign: 'center' },
});

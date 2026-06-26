import React, { useContext, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
  Alert, Modal, TextInput, ActivityIndicator,
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
  const {
    morningStock, eveningStock, products, user, logoutUser,
    shopLocation, setShopLocation,
    getAdminOrders,
    getTodayOrders, getTodayRevenue, getWeeklyRevenue, getMonthlyRevenue,
    getOrdersByStatus, getTotalBottlesSold, getBestSellers,
  } = useContext(AppContext);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopLat, setShopLat] = useState('');
  const [shopLon, setShopLon] = useState('');
  const [locLoading, setLocLoading] = useState(false);

  // ── Analytics (admin-specific) ───────────────────────────────────────────────
  const adminOrders   = getAdminOrders();
  const todayOrders   = getTodayOrders();
  const todayRevenue  = getTodayRevenue();
  const weeklyRevenue = getWeeklyRevenue();
  const monthlyRevenue = getMonthlyRevenue();
  const bottlesSold   = getTotalBottlesSold();
  const bestSellers   = getBestSellers();

  const totalOrders   = adminOrders.length;
  const pendingCount  = adminOrders.filter((o) => o.status === 'placed').length;
  const acceptedCount = adminOrders.filter((o) => o.status === 'accepted').length;
  const preparingCount = adminOrders.filter((o) => o.status === 'preparing').length;
  const ofdCount      = adminOrders.filter((o) => o.status === 'out_for_delivery').length;
  const deliveredCount = adminOrders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = adminOrders.filter((o) => o.status === 'cancelled').length;
  const activeCount   = acceptedCount + preparingCount + ofdCount;

  const lowStockProducts = products.filter((p) => p.stock < 10 && p.availability);

  // ── Logout ──────────────────────────────────────────────────────────────────
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

  // ── Shop Location GPS ────────────────────────────────────────────────────────
  const detectShopGPS = async () => {
    setLocLoading(true);
    try {
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permission.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setShopLat(pos.coords.latitude.toFixed(6));
      setShopLon(pos.coords.longitude.toFixed(6));
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (geo) {
        const addr = [geo.name, geo.street, geo.city, geo.region].filter(Boolean).join(', ');
        setShopAddress(addr);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to detect GPS: ' + e.message);
    } finally {
      setLocLoading(false);
    }
  };

  const openLocationModal = () => {
    setShopName(shopLocation?.name || '');
    setShopAddress(shopLocation?.address || '');
    setShopLat(String(shopLocation?.latitude || ''));
    setShopLon(String(shopLocation?.longitude || ''));
    setShowLocationModal(true);
  };

  const saveShopLocation = async () => {
    const lat = parseFloat(shopLat);
    const lon = parseFloat(shopLon);
    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Invalid Coordinates', 'Please enter valid latitude and longitude.');
      return;
    }
    if (!shopName.trim()) {
      Alert.alert('Missing Name', 'Please enter the shop name.');
      return;
    }
    await setShopLocation({
      latitude: lat, longitude: lon,
      address: shopAddress.trim() || `${lat}, ${lon}`,
      name: shopName.trim(),
    });
    setShowLocationModal(false);
    Alert.alert('✓ Saved', 'Shop location updated successfully.');
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient colors={['#0d1f14', '#142a1c']} style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>Admin Dashboard</Text>
          <Text style={s.sub}>{user?.shopName || user?.phone || 'Admin'}</Text>
        </View>
        <TouchableOpacity onPress={openLocationModal} style={s.headerBtn}>
          <Ionicons name="location-outline" size={20} color={COLORS.accent} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={s.headerBtn}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </LinearGradient>

      <TouchableOpacity style={s.shopBar} onPress={openLocationModal} activeOpacity={0.85}>
        <Ionicons name="storefront-outline" size={14} color={COLORS.primaryLight} />
        <Text style={s.shopBarText} numberOfLines={1}>
          {shopLocation?.name || 'Set shop location'} — {shopLocation?.address || 'Tap to configure'}
        </Text>
        <Ionicons name="pencil-outline" size={13} color={COLORS.accent} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Today Summary ─────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Today's Summary</Text>
        <View style={s.statsGrid}>
          <StatCard icon="receipt-outline"          label="Today Orders"  value={todayOrders.length} color="#81c784" />
          <StatCard icon="cash-outline"             label="Today Revenue" value={`₹${todayRevenue}`} color="#4caf7d" />
          <StatCard icon="time-outline"             label="Pending"       value={pendingCount}       color="#ffb74d" alert={pendingCount > 0} />
          <StatCard icon="flash-outline"            label="Active"        value={activeCount}        color="#7986cb" />
          <StatCard icon="checkmark-circle-outline" label="Delivered"     value={deliveredCount}     color="#4db6ac" />
          <StatCard icon="close-circle-outline"     label="Cancelled"     value={cancelledCount}     color="#ef5350" />
        </View>

        {/* ── Revenue Overview ──────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Revenue Overview</Text>
        <View style={s.revenueCard}>
          <RevenueRow icon="today-outline"       label="Today"   value={`₹${todayRevenue}`}   color="#81c784" />
          <RevenueRow icon="calendar-outline"    label="Weekly"  value={`₹${weeklyRevenue}`}  color="#64b5f6" />
          <RevenueRow icon="bar-chart-outline"   label="Monthly" value={`₹${monthlyRevenue}`} color="#ce93d8" />
          <View style={s.revDivider} />
          <RevenueRow icon="wine-outline"        label="Total Orders (All time)" value={`${totalOrders}`}   color={COLORS.textMuted} />
          <RevenueRow icon="checkmark-done-outline" label="Delivered Orders"     value={`${deliveredCount}`} color="#4caf50" />
          <RevenueRow icon="cube-outline"        label="Bottles Sold (Delivered)" value={`${bottlesSold}`} color={COLORS.accent} />
        </View>

        {/* ── Order Status Breakdown ────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Order Status</Text>
        <View style={s.statusGrid}>
          <StatusChip label="Placed"       count={pendingCount}  color="#64b5f6" />
          <StatusChip label="Accepted"     count={acceptedCount} color="#81c784" />
          <StatusChip label="Preparing"    count={preparingCount} color="#ffb74d" />
          <StatusChip label="Out Delivery" count={ofdCount}      color="#7986cb" />
          <StatusChip label="Delivered"    count={deliveredCount} color="#4caf50" />
          <StatusChip label="Cancelled"    count={cancelledCount} color="#ef5350" />
        </View>

        {/* ── Stock Status ─────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Stock Status</Text>
        <View style={s.stockCard}>
          <View style={s.stockRow}>
            <StockItem emoji="🌅" label="Morning" value={morningStock} max={50} />
            <View style={s.stockDivider} />
            <StockItem emoji="🌇" label="Evening" value={eveningStock} max={40} />
          </View>
          {lowStockProducts.length > 0 && (
            <View style={s.lowStockAlert}>
              <Ionicons name="warning-outline" size={14} color="#ffb74d" />
              <Text style={s.lowStockText}>
                Low stock: {lowStockProducts.map((p) => p.name).join(', ')}
              </Text>
            </View>
          )}
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

        {/* ── Best Sellers ─────────────────────────────────────────────────── */}
        {bestSellers.length > 0 && (
          <>
            <Text style={s.sectionTitle}>🏆 Best Selling Products</Text>
            <View style={s.bestCard}>
              {bestSellers.map((item, i) => (
                <View key={item.product.id} style={s.bestRow}>
                  <View style={s.bestRank}>
                    <Text style={s.bestRankText}>#{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.bestName}>{item.product.name}</Text>
                    <Text style={s.bestUnit}>{item.product.unitSize}</Text>
                  </View>
                  <View style={s.bestQtyBadge}>
                    <Text style={s.bestQtyText}>{item.soldQty} sold</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

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
          <ActionBtn
            icon="location-outline" label="Shop Location" color="#f4c842"
            onPress={openLocationModal}
          />
        </View>

        {/* ── Recent Orders ─────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Recent Orders</Text>
        {adminOrders.slice(0, 8).map((o) => (
          <TouchableOpacity
            key={o.id}
            style={s.orderRow}
            onPress={() => navigation.navigate('AdminOrders')}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.orderId}>{o.id}</Text>
              <Text style={s.orderMeta}>
                {o.customer?.phone} • {o.deliveryType === 'home' ? '🚴 Home' : '🚶 Pickup'} • ₹{o.total}
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
        {adminOrders.length === 0 && (
          <View style={s.emptyOrders}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.textMuted} />
            <Text style={s.emptyText}>No orders yet</Text>
            <Text style={s.emptySub}>Orders from customers will appear here</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Shop Location Modal ────────────────────────────────────────────────── */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <LinearGradient colors={['#1a3d28', '#0d1f14']} style={s.modalInner}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>Set Shop Location</Text>
                <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                  <Ionicons name="close" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={s.inputLabel}>Shop Name</Text>
              <TextInput
                style={s.inputField}
                value={shopName}
                onChangeText={setShopName}
                placeholder="e.g. Kallu Reddy Toddy Shop"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />

              <Text style={s.inputLabel}>Address</Text>
              <TextInput
                style={[s.inputField, s.inputMultiline]}
                value={shopAddress}
                onChangeText={setShopAddress}
                placeholder="Full shop address"
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                numberOfLines={2}
              />

              <View style={s.coordsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Latitude</Text>
                  <TextInput
                    style={s.inputField}
                    value={shopLat}
                    onChangeText={setShopLat}
                    placeholder="e.g. 16.5062"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Longitude</Text>
                  <TextInput
                    style={s.inputField}
                    value={shopLon}
                    onChangeText={setShopLon}
                    placeholder="e.g. 80.6480"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <TouchableOpacity style={s.gpsBtn} onPress={detectShopGPS} disabled={locLoading} activeOpacity={0.85}>
                {locLoading
                  ? <ActivityIndicator size="small" color={COLORS.primaryLight} />
                  : <Ionicons name="locate-outline" size={18} color={COLORS.primaryLight} />}
                <Text style={s.gpsBtnText}>
                  {locLoading ? 'Detecting GPS...' : 'Use My GPS as Shop Location'}
                </Text>
              </TouchableOpacity>

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowLocationModal(false)} activeOpacity={0.85}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={saveShopLocation} activeOpacity={0.85}>
                  <LinearGradient colors={['#2d8653', '#1a5c38']} style={s.saveBtnGrad}>
                    <Text style={s.saveBtnText}>Save Location</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
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

function RevenueRow({ icon, label, value, color }) {
  return (
    <View style={s.revRow}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={s.revLabel}>{label}</Text>
      <Text style={[s.revValue, { color: color === COLORS.textMuted ? COLORS.white : color }]}>{value}</Text>
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
  const low = value < 10;
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
  shopBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(45,134,83,0.1)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  shopBarText: { flex: 1, color: COLORS.textSecondary, fontSize: FONTS.sizes.xs },
  scroll: { padding: SPACING.xl },
  sectionTitle: {
    color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700',
    marginBottom: SPACING.md, marginTop: SPACING.lg,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  statCard: {
    width: '31%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 4,
  },
  statCardAlert: { borderColor: 'rgba(255,152,0,0.35)', backgroundColor: 'rgba(255,152,0,0.07)' },
  statIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800', marginTop: 4 },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },
  // Revenue
  revenueCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    gap: SPACING.md,
  },
  revRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  revLabel: { flex: 1, color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  revValue: { fontSize: FONTS.sizes.md, fontWeight: '800' },
  revDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  // Status chips
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statusChip: {
    width: '30%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', borderWidth: 1,
  },
  statusChipCount: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  statusChipLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', marginTop: 2 },
  // Stock
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
  lowStockAlert: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: 'rgba(255,152,0,0.1)', borderRadius: RADIUS.sm,
    padding: SPACING.sm, marginTop: SPACING.md,
  },
  lowStockText: { color: '#ffb74d', fontSize: FONTS.sizes.xs, flex: 1 },
  outOfStockAlert: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: 'rgba(239,83,80,0.1)', borderRadius: RADIUS.sm,
    padding: SPACING.sm, marginTop: SPACING.xs,
  },
  outOfStockText: { color: '#ef5350', fontSize: FONTS.sizes.xs, flex: 1 },
  // Best sellers
  bestCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: SPACING.md,
  },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  bestRank: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(244,200,66,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  bestRankText: { color: COLORS.accent, fontSize: FONTS.sizes.xs, fontWeight: '800' },
  bestName: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  bestUnit: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  bestQtyBadge: {
    backgroundColor: 'rgba(45,134,83,0.2)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
  },
  bestQtyText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  // Quick actions
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
  // Recent orders
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
  emptyOrders: {
    alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xxl,
  },
  emptyText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '600' },
  emptySub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, overflow: 'hidden' },
  modalInner: { padding: SPACING.xxl, gap: SPACING.md, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  inputLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600', marginTop: SPACING.xs },
  inputField: {
    height: 48, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    color: COLORS.white, fontSize: FONTS.sizes.md, paddingHorizontal: SPACING.lg,
  },
  inputMultiline: { height: 72, paddingTop: SPACING.md, textAlignVertical: 'top' },
  coordsRow: { flexDirection: 'row', gap: SPACING.md },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(45,134,83,0.15)', borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(45,134,83,0.3)',
  },
  gpsBtnText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  cancelBtn: {
    flex: 1, paddingVertical: SPACING.lg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  saveBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  saveBtnGrad: { paddingVertical: SPACING.lg, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
});

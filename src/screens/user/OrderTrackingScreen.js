import React, { useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';
import { ORDER_STATUSES } from '../../constants/data';

const STATUS_FLOW = ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

function getStatusInfo(key) {
  return ORDER_STATUSES.find((s) => s.key === key) || ORDER_STATUSES[0];
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OrderTrackingScreen({ navigation, route }) {
  const { orders } = useContext(AppContext);
  const { orderId } = route.params || {};
  const order = orders.find((o) => o.id === orderId) || orders[0];

  if (!order) {
    return (
      <View style={s.empty}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Text style={{ fontSize: 60 }}>📦</Text>
        <Text style={s.emptyTitle}>Order not found</Text>
        <TouchableOpacity style={s.backBtn2} onPress={() => navigation.navigate('UserMain')}>
          <LinearGradient colors={['#2d8653', '#1a5c38']} style={s.backBtnGrad}>
            <Text style={s.backBtnText}>Go to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatusIdx = STATUS_FLOW.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  const getStepState = (stepKey) => {
    if (isCancelled) return 'cancelled';
    const stepIdx = STATUS_FLOW.indexOf(stepKey);
    if (stepIdx < currentStatusIdx) return 'done';
    if (stepIdx === currentStatusIdx) return 'active';
    return 'pending';
  };

  const getHistoryTime = (statusKey) => {
    const entry = (order.statusHistory || []).find((h) => h.status === statusKey);
    return entry ? formatTime(entry.time) : null;
  };

  const openMaps = () => {
    if (!order.deliveryAddress) return;
    const { latitude, longitude } = order.deliveryAddress;
    Linking.openURL(`https://maps.google.com/?q=${latitude},${longitude}`).catch(() => {});
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient colors={['#0d1f14', '#1a4a2e']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Track Order</Text>
          <Text style={s.headerSub}>{order.id}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: `${getStatusInfo(order.status).color}20`, borderColor: `${getStatusInfo(order.status).color}40` }]}>
          <Text style={[s.statusBadgeText, { color: getStatusInfo(order.status).color }]}>
            {getStatusInfo(order.status).label}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Status Timeline ─────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Status</Text>
          <View style={s.timeline}>
            {STATUS_FLOW.map((key, idx) => {
              const state = getStepState(key);
              const info = getStatusInfo(key);
              const time = getHistoryTime(key);
              const isLast = idx === STATUS_FLOW.length - 1;
              return (
                <View key={key} style={s.step}>
                  {/* Connector line */}
                  {!isLast && (
                    <View style={[s.connector, state === 'done' && s.connectorDone]} />
                  )}
                  {/* Dot */}
                  <View style={[s.dot, state === 'active' && s.dotActive, state === 'done' && s.dotDone, state === 'cancelled' && s.dotCancelled]}>
                    {state === 'done' ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : state === 'active' ? (
                      <View style={s.dotPulse} />
                    ) : (
                      <View style={s.dotEmpty} />
                    )}
                  </View>
                  {/* Content */}
                  <View style={s.stepContent}>
                    <Text style={[s.stepLabel, state === 'active' && s.stepLabelActive, state === 'done' && s.stepLabelDone]}>
                      {info.label}
                    </Text>
                    {state === 'active' && order.estimatedDelivery && key === 'out_for_delivery' && (
                      <Text style={s.stepEta}>ETA: {order.estimatedDelivery}</Text>
                    )}
                    {time && <Text style={s.stepTime}>{time}</Text>}
                    {state === 'active' && !time && <Text style={s.stepActiveLabel}>Current Status</Text>}
                  </View>
                </View>
              );
            })}
            {isCancelled && (
              <View style={s.step}>
                <View style={s.dotCancelled}>
                  <Ionicons name="close" size={14} color="#fff" />
                </View>
                <View style={s.stepContent}>
                  <Text style={[s.stepLabel, { color: '#ef5350' }]}>Cancelled</Text>
                  {getHistoryTime('cancelled') && <Text style={s.stepTime}>{getHistoryTime('cancelled')}</Text>}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Order Info ──────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Details</Text>
          <View style={s.infoCard}>
            <InfoRow icon="receipt-outline" label="Order ID" value={order.id} />
            <InfoRow icon="calendar-outline" label="Placed On" value={formatDate(order.createdAt)} />
            <InfoRow icon={order.deliveryType === 'home' ? 'bicycle-outline' : 'walk-outline'} label="Delivery" value={order.deliveryType === 'home' ? 'Home Delivery' : 'Self Pickup'} />
            <InfoRow icon="cash-outline" label="Payment" value={order.paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery'} />
            <InfoRow icon="pricetag-outline" label="Total" value={`₹${order.total}`} accent />
          </View>
        </View>

        {/* ── Delivery Address ────────────────────────────────────────────── */}
        {order.deliveryType === 'home' && order.deliveryAddress && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity style={s.addressCard} onPress={openMaps} activeOpacity={0.85}>
              <View style={s.addressRow}>
                <View style={s.addressIcon}>
                  <Ionicons name="location" size={20} color={COLORS.primaryLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.addressText} numberOfLines={3}>{order.deliveryAddress.formattedAddress || 'Address saved'}</Text>
                  {order.distanceKm > 0 && <Text style={s.addressDist}>📍 {order.distanceKm} km from shop</Text>}
                </View>
                <Ionicons name="navigate-outline" size={18} color={COLORS.accent} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Items ──────────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Items Ordered ({order.items?.length || 0})</Text>
          <View style={s.itemsCard}>
            {(order.items || []).map((item, i) => (
              <View key={item.id || i} style={[s.itemRow, i < (order.items.length - 1) && s.itemRowBorder]}>
                <Text style={s.itemBullet}>🍶</Text>
                <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.itemQty}>×{item.quantity}</Text>
                <Text style={s.itemTotal}>₹{item.price * item.quantity}</Text>
              </View>
            ))}
            {order.deliveryCharge > 0 && (
              <View style={[s.itemRow, s.itemRowBorder]}>
                <Ionicons name="bicycle-outline" size={14} color={COLORS.textMuted} />
                <Text style={[s.itemName, { color: COLORS.textMuted }]}>Delivery Charge</Text>
                <Text style={s.itemTotal}>₹{order.deliveryCharge}</Text>
              </View>
            )}
            <View style={[s.itemRow, { paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={[s.itemName, { color: COLORS.white, fontWeight: '700', flex: 1 }]}>Grand Total</Text>
              <Text style={[s.itemTotal, { color: COLORS.accent, fontSize: FONTS.sizes.lg }]}>₹{order.total}</Text>
            </View>
          </View>
        </View>

        {/* ── Action Buttons ──────────────────────────────────────────────── */}
        <View style={[s.section, { gap: SPACING.sm }]}>
          <TouchableOpacity
            style={s.primaryActionBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'UserMain' }] })}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#2d8653', '#1a5c38']} style={s.primaryActionGrad}>
              <Ionicons name="home-outline" size={20} color="#fff" />
              <Text style={s.primaryActionText}>Continue Shopping</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.secActionBtn}
            onPress={() => navigation.navigate('OrdersTab')}
            activeOpacity={0.85}
          >
            <Ionicons name="receipt-outline" size={18} color={COLORS.primaryLight} />
            <Text style={s.secActionText}>View All Orders</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, accent }) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIcon}><Ionicons name={icon} size={16} color={COLORS.primaryLight} /></View>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoVal, accent && { color: COLORS.accent }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  empty: { flex: 1, backgroundColor: COLORS.bgDark, alignItems: 'center', justifyContent: 'center', gap: SPACING.xl, padding: SPACING.xxxl },
  emptyTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '700' },
  backBtn2: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.md },
  backBtnGrad: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxxl },
  backBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 54, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl, gap: SPACING.md },
  backBtn: { padding: 4 },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '700' },
  headerSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1 },
  statusBadgeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  section: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700', marginBottom: SPACING.md },
  timeline: { paddingLeft: SPACING.sm },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, minHeight: 52 },
  connector: { position: 'absolute', left: 15, top: 32, width: 2, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },
  connectorDone: { backgroundColor: COLORS.primaryLight },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryLight, ...SHADOWS.button },
  dotDone: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryLight },
  dotCancelled: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ef5350', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dotPulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  dotEmpty: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  stepContent: { flex: 1, paddingTop: 6, paddingBottom: SPACING.lg },
  stepLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, fontWeight: '500' },
  stepLabelActive: { color: COLORS.white, fontWeight: '700' },
  stepLabelDone: { color: COLORS.textSecondary, fontWeight: '600' },
  stepEta: { color: COLORS.accent, fontSize: FONTS.sizes.xs, marginTop: 2, fontWeight: '600' },
  stepTime: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  stepActiveLabel: { color: COLORS.primaryLight, fontSize: FONTS.sizes.xs, marginTop: 2, fontWeight: '600' },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: SPACING.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  infoIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(45,134,83,0.15)', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, flex: 1 },
  infoVal: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  addressCard: { backgroundColor: 'rgba(45,134,83,0.1)', borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(45,134,83,0.25)' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  addressIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(45,134,83,0.2)', alignItems: 'center', justifyContent: 'center' },
  addressText: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '600', flex: 1 },
  addressDist: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 4 },
  itemsCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 8 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  itemBullet: { fontSize: 14 },
  itemName: { flex: 1, color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  itemQty: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  itemTotal: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  primaryActionBtn: { borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.button },
  primaryActionGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
  primaryActionText: { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: '700' },
  secActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.lg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(45,134,83,0.3)' },
  secActionText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.md, fontWeight: '600' },
});

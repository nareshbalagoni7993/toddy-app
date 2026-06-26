import React, { useContext, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  Alert, Image, Linking, ScrollView, TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';

const STATUS_FLOW = ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

const STATUS_META = {
  placed:           { color: '#64b5f6', label: 'Order Placed',      icon: 'receipt-outline' },
  accepted:         { color: '#81c784', label: 'Accepted',           icon: 'checkmark-circle-outline' },
  preparing:        { color: '#ffb74d', label: 'Preparing',          icon: 'time-outline' },
  ready:            { color: '#4db6ac', label: 'Ready',              icon: 'bag-check-outline' },
  out_for_delivery: { color: '#7986cb', label: 'Out For Delivery',   icon: 'bicycle-outline' },
  delivered:        { color: '#4caf50', label: 'Delivered',          icon: 'home-outline' },
  cancelled:        { color: '#ef5350', label: 'Cancelled',          icon: 'close-circle-outline' },
};

const FILTER_OPTIONS = ['All', 'Pending', 'Active', 'Delivered', 'Cancelled'];

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminOrdersScreen() {
  const { getAdminOrders, updateOrderStatus } = useContext(AppContext);
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Only show this admin's orders
  const adminOrders = getAdminOrders();

  const filteredOrders = adminOrders.filter((o) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return o.status === 'placed';
    if (filter === 'Active') return ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status);
    if (filter === 'Delivered') return o.status === 'delivered';
    if (filter === 'Cancelled') return o.status === 'cancelled';
    return true;
  });

  const confirmStatusChange = (order, newStatus, label) => {
    Alert.alert(
      'Confirm Action',
      `Set order ${order.id} to "${label}"?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => updateOrderStatus(order.id, newStatus) },
      ]
    );
  };

  const openRejectModal = (orderId) => {
    setRejectOrderId(orderId);
    setRejectReason('');
    setRejectModal(true);
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a reason for rejecting/cancelling the order.');
      return;
    }
    updateOrderStatus(rejectOrderId, 'cancelled', rejectReason.trim());
    setRejectModal(false);
    setRejectOrderId(null);
    setExpanded(null);
  };

  const confirmCancel = (order) => openRejectModal(order.id);

  const openMaps = (lat, lon) => {
    const url = `https://maps.google.com/?q=${lat},${lon}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Maps'));
  };

  const renderActionButtons = (item) => {
    const { status } = item;
    if (status === 'delivered' || status === 'cancelled') return null;

    if (status === 'placed') {
      return (
        <View style={s.actionRow}>
          <ActionBtn
            label="✓ Accept Order"
            color="#4caf50"
            onPress={() => {
              Alert.alert('Accept Order', `Accept order ${item.id}?`, [
                { text: 'No', style: 'cancel' },
                { text: 'Accept', style: 'default', onPress: () => updateOrderStatus(item.id, 'accepted') },
              ]);
            }}
          />
          <ActionBtn
            label="✗ Reject"
            color="#ef5350"
            outline
            onPress={() => openRejectModal(item.id)}
          />
        </View>
      );
    }
    if (status === 'accepted') {
      return (
        <View style={s.actionRow}>
          <ActionBtn
            label="🍶 Start Preparing"
            color="#ffb74d"
            onPress={() => confirmStatusChange(item, 'preparing', 'Preparing')}
          />
          <ActionBtn label="Cancel" color="#ef5350" outline onPress={() => confirmCancel(item)} />
        </View>
      );
    }
    if (status === 'preparing') {
      return (
        <View style={s.actionRow}>
          <ActionBtn
            label="✓ Ready"
            color="#4db6ac"
            onPress={() => confirmStatusChange(item, 'ready', 'Ready')}
          />
          <ActionBtn label="Cancel" color="#ef5350" outline onPress={() => confirmCancel(item)} />
        </View>
      );
    }
    if (status === 'ready') {
      return (
        <View style={s.actionRow}>
          <ActionBtn
            label="🛵 Dispatch"
            color="#7986cb"
            onPress={() => confirmStatusChange(item, 'out_for_delivery', 'Out for Delivery')}
          />
          <ActionBtn label="Cancel" color="#ef5350" outline onPress={() => confirmCancel(item)} />
        </View>
      );
    }
    if (status === 'out_for_delivery') {
      return (
        <View style={s.actionRow}>
          <ActionBtn
            label="✓ Mark Delivered"
            color="#4caf50"
            onPress={() => confirmStatusChange(item, 'delivered', 'Delivered')}
          />
        </View>
      );
    }
    return null;
  };

  const renderItem = ({ item }) => {
    const isExpanded = expanded === item.id;
    const meta = STATUS_META[item.status] || STATUS_META.placed;
    const isDone = item.status === 'delivered' || item.status === 'cancelled';
    const hasMap = item.deliveryAddress?.latitude && item.deliveryAddress?.longitude;

    return (
      <TouchableOpacity
        style={[s.orderCard, isExpanded && s.orderCardExpanded]}
        onPress={() => setExpanded(isExpanded ? null : item.id)}
        activeOpacity={0.88}
      >
        {/* ── Order Header ─────────────────────────────────────────────── */}
        <View style={s.orderTop}>
          <View style={s.orderIdRow}>
            <Text style={s.orderId}>{item.id}</Text>
            <View style={[s.statusPill, { backgroundColor: meta.color + '22' }]}>
              <Ionicons name={meta.icon} size={11} color={meta.color} />
              <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
          <View style={s.orderSummary}>
            <View style={s.summaryItem}>
              <Ionicons name="call-outline" size={13} color={COLORS.textMuted} />
              <Text style={s.summaryText}>{item.customer?.phone || '—'}</Text>
            </View>
            <View style={s.summaryItem}>
              <Ionicons name={item.deliveryType === 'home' ? 'bicycle-outline' : 'walk-outline'} size={13} color={COLORS.textMuted} />
              <Text style={s.summaryText}>{item.deliveryType === 'home' ? 'Home Delivery' : 'Pickup'}</Text>
            </View>
            <View style={s.summaryItem}>
              <Ionicons name="cash-outline" size={13} color={COLORS.accent} />
              <Text style={[s.summaryText, { color: COLORS.accent, fontWeight: '700' }]}>₹{item.total}</Text>
            </View>
          </View>
          <Text style={s.orderTime}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} /> {fmtDate(item.createdAt)}
          </Text>
        </View>

        {/* ── Expanded Details ─────────────────────────────────────────── */}
        {isExpanded && (
          <View style={s.expandedWrap}>

            {/* Product Items */}
            <Text style={s.detailSectionLabel}>Order Items</Text>
            {(item.items || []).map((it, i) => (
              <View key={i} style={s.itemRow}>
                <Image source={{ uri: it.image }} style={s.itemImg} />
                <View style={{ flex: 1 }}>
                  <Text style={s.itemName}>{it.name}</Text>
                  <Text style={s.itemUnit}>{it.unitSize}</Text>
                </View>
                <View style={s.itemRight}>
                  <Text style={s.itemQty}>×{it.quantity}</Text>
                  <Text style={s.itemPrice}>₹{it.price * it.quantity}</Text>
                </View>
              </View>
            ))}

            {/* Bill Summary */}
            <View style={s.billRow}>
              <Text style={s.billLabel}>Subtotal</Text>
              <Text style={s.billVal}>₹{item.subtotal || item.total}</Text>
            </View>
            {item.deliveryCharge > 0 && (
              <View style={s.billRow}>
                <Text style={s.billLabel}>Delivery Charge</Text>
                <Text style={s.billVal}>₹{item.deliveryCharge}</Text>
              </View>
            )}
            <View style={[s.billRow, s.billTotal]}>
              <Text style={s.billTotalLabel}>Grand Total</Text>
              <Text style={s.billTotalVal}>₹{item.total}</Text>
            </View>

            {/* Payment Method */}
            <View style={s.infoRow}>
              <Ionicons
                name={item.paymentMethod === 'upi' ? 'phone-portrait-outline' : 'cash-outline'}
                size={15} color={COLORS.primaryLight}
              />
              <Text style={s.infoText}>
                {item.paymentMethod === 'upi' ? '📱 UPI Payment' : '💵 Cash on Delivery'}
                {item.upiRef ? ` — ${item.upiRef}` : ''}
              </Text>
            </View>

            {/* Delivery Address */}
            {item.deliveryAddress && (
              <>
                <Text style={s.detailSectionLabel}>Delivery Address</Text>
                <View style={s.addressCard}>
                  <View style={s.addressRow}>
                    <Ionicons name="location-outline" size={15} color={COLORS.primaryLight} />
                    <Text style={s.addressText}>
                      {item.deliveryAddress.formattedAddress || 'Address saved'}
                    </Text>
                  </View>
                  {item.distanceKm > 0 && (
                    <Text style={s.distanceText}>📍 {item.distanceKm} km from shop</Text>
                  )}
                  {hasMap && (
                    <TouchableOpacity
                      style={s.mapsBtn}
                      onPress={() => openMaps(item.deliveryAddress.latitude, item.deliveryAddress.longitude)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="navigate-outline" size={14} color={COLORS.accent} />
                      <Text style={s.mapsBtnText}>Open in Google Maps</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* Customer Notes */}
            {!!item.customerNotes && (
              <View style={s.notesCard}>
                <Ionicons name="chatbubble-outline" size={14} color={COLORS.accent} />
                <Text style={s.notesText}>"{item.customerNotes}"</Text>
              </View>
            )}

            {/* Status Timeline */}
            {(item.statusHistory || []).length > 0 && (
              <>
                <Text style={s.detailSectionLabel}>Order Timeline</Text>
                {item.statusHistory.map((h, i) => {
                  const hMeta = STATUS_META[h.status] || STATUS_META.placed;
                  return (
                    <View key={i} style={s.timelineRow}>
                      <View style={[s.timelineDot, { backgroundColor: hMeta.color }]} />
                      <Text style={s.timelineLabel}>{h.label}</Text>
                      <Text style={s.timelineTime}>{fmtDate(h.time)}</Text>
                    </View>
                  );
                })}
              </>
            )}

            {/* Action Buttons */}
            {!isDone && renderActionButtons(item)}
          </View>
        )}

        <View style={s.expandHint}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={COLORS.textMuted}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const pendingCount = adminOrders.filter((o) => o.status === 'placed').length;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0d1f14', '#142a1c']} style={s.header}>
        <Text style={s.headerTitle}>Orders Management</Text>
        <View style={s.headerMeta}>
          {pendingCount > 0 && (
            <View style={s.pendingBadge}>
              <Text style={s.pendingBadgeText}>{pendingCount} new</Text>
            </View>
          )}
          <Text style={s.headerSub}>{filteredOrders.length} orders</Text>
        </View>
      </LinearGradient>

      {/* Filter Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterRow}
      >
        {FILTER_OPTIONS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, filter === f && s.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.85}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredOrders.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="receipt-outline" size={60} color={COLORS.textMuted} />
          <Text style={s.emptyText}>No {filter !== 'All' ? filter.toLowerCase() : ''} orders</Text>
          <Text style={s.emptySubText}>
            {filter === 'Pending'
              ? 'New orders from customers will appear here'
              : 'Orders will appear here once placed'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(o) => o.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Reject / Cancel Reason Modal ────────────────────────────────────── */}
      <Modal visible={rejectModal} transparent animationType="slide" onRequestClose={() => setRejectModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.rejectModal}>
            <LinearGradient colors={['#2a0a0a', '#1a1a1a']} style={s.rejectModalInner}>
              <View style={s.rejectHeader}>
                <Ionicons name="close-circle-outline" size={24} color="#ef5350" />
                <Text style={s.rejectTitle}>Reject / Cancel Order</Text>
                <TouchableOpacity onPress={() => setRejectModal(false)}>
                  <Ionicons name="close" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={s.rejectLabel}>Reason for rejection (required)</Text>
              <TextInput
                style={s.rejectInput}
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="e.g. Out of stock, Shop closed, Cannot deliver..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                autoFocus
              />
              <View style={s.rejectBtns}>
                <TouchableOpacity style={s.rejectCancelBtn} onPress={() => setRejectModal(false)}>
                  <Text style={s.rejectCancelText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.rejectConfirmBtn} onPress={confirmReject}>
                  <Text style={s.rejectConfirmText}>✗ Reject Order</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ActionBtn({ label, color, onPress, outline }) {
  return (
    <TouchableOpacity
      style={[
        s.actionBtn,
        outline
          ? { borderWidth: 1, borderColor: color + '80', backgroundColor: 'transparent' }
          : { backgroundColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[s.actionBtnText, { color: outline ? color : '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { paddingTop: 54, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4 },
  headerSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  pendingBadge: {
    backgroundColor: 'rgba(255,152,0,0.2)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(255,152,0,0.4)',
  },
  pendingBadgeText: { color: '#ffb74d', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  filterScroll: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  filterRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm },
  filterChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: { backgroundColor: 'rgba(45,134,83,0.25)', borderColor: 'rgba(45,134,83,0.5)' },
  filterText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  filterTextActive: { color: COLORS.primaryLight },
  list: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: 100 },
  orderCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  orderCardExpanded: { borderColor: 'rgba(45,134,83,0.3)', backgroundColor: 'rgba(45,134,83,0.05)' },
  orderTop: { padding: SPACING.lg, gap: 6 },
  orderIdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { color: COLORS.primaryLight, fontSize: FONTS.sizes.md, fontWeight: '700', letterSpacing: 0.5 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  orderSummary: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs },
  orderTime: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  expandHint: { alignItems: 'center', paddingBottom: 6 },
  expandedWrap: {
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    gap: SPACING.sm,
  },
  detailSectionLabel: {
    color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700',
    marginTop: SPACING.sm, marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  itemImg: { width: 48, height: 48, borderRadius: RADIUS.sm, backgroundColor: '#1a3a24' },
  itemName: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  itemUnit: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemQty: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  itemPrice: { color: COLORS.accent, fontSize: FONTS.sizes.md, fontWeight: '700' },
  billRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 3,
  },
  billLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  billVal: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  billTotal: {
    paddingTop: SPACING.sm, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)', marginTop: 4,
  },
  billTotalLabel: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700' },
  billTotalVal: { color: COLORS.accent, fontSize: FONTS.sizes.lg, fontWeight: '800' },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(45,134,83,0.1)', borderRadius: RADIUS.md, padding: SPACING.sm,
  },
  infoText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, flex: 1 },
  addressCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md,
    padding: SPACING.md, gap: 6,
  },
  addressRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  addressText: { color: COLORS.white, fontSize: FONTS.sizes.sm, flex: 1 },
  distanceText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(244,200,66,0.15)', borderRadius: RADIUS.md,
    padding: SPACING.sm, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(244,200,66,0.25)',
  },
  mapsBtnText: { color: COLORS.accent, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  notesCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: 'rgba(244,200,66,0.08)', borderRadius: RADIUS.md,
    padding: SPACING.sm, borderWidth: 1, borderColor: 'rgba(244,200,66,0.2)',
  },
  notesText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, flex: 1, fontStyle: 'italic' },
  timelineRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: 4,
  },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, flex: 1 },
  timelineTime: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  actionBtn: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  emptyText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '600' },
  emptySubText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, textAlign: 'center' },
  // Reject modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  rejectModal: { borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, overflow: 'hidden' },
  rejectModalInner: { padding: SPACING.xxl, gap: SPACING.md, paddingBottom: 40 },
  rejectHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  rejectTitle: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '800' },
  rejectLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  rejectInput: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(239,83,80,0.3)',
    color: COLORS.white, fontSize: FONTS.sizes.md,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md,
    minHeight: 80,
  },
  rejectBtns: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  rejectCancelBtn: {
    flex: 1, paddingVertical: SPACING.lg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center',
  },
  rejectCancelText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  rejectConfirmBtn: {
    flex: 1.5, paddingVertical: SPACING.lg, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(239,83,80,0.2)', borderWidth: 1, borderColor: 'rgba(239,83,80,0.5)',
    alignItems: 'center',
  },
  rejectConfirmText: { color: '#ef5350', fontSize: FONTS.sizes.md, fontWeight: '800' },
});

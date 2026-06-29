import React, { useContext, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
  Alert, StatusBar, Animated, TextInput, ActivityIndicator, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';
import { DELIVERY_CHARGES, MAX_DELIVERY_KM } from '../../constants/data';
import { useLocation } from '../../hooks/useLocation';

const PAYMENT_OPTS = [
  { id: 'upi', label: 'UPI / Google Pay / PhonePe', icon: 'phone-portrait-outline', desc: 'Instant payment via UPI' },
  { id: 'cod', label: 'Cash on Delivery', icon: 'cash-outline', desc: 'Pay when you receive' },
];

function calcDeliveryCharge(km) {
  for (const tier of DELIVERY_CHARGES) {
    if (km <= tier.maxKm) return tier.charge;
  }
  return 0;
}

export default function CartScreen({ navigation }) {
  const {
    cart, updateQuantity, cartTotal, placeOrder,
    stock, selectedAdmin,
  } = useContext(AppContext);

  const { coords, address, distance, loading: locLoading, error: locError, detect, reset } = useLocation();

  const [deliveryType, setDeliveryType] = useState('home');
  const [payment, setPayment] = useState('cod');
  const [upiId, setUpiId] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const km = distance ?? 0;
  const canDeliver = km <= MAX_DELIVERY_KM;
  const deliveryCharge = deliveryType === 'home' && coords ? calcDeliveryCharge(km) : 0;
  const grandTotal = cartTotal + deliveryCharge;

  const toddyQty = cart.filter((i) => i.category === 'toddy').reduce((s, i) => s + i.quantity, 0);
  const hour = new Date().getHours();
  const morningStock = stock?.morningStock ?? 50;
  const eveningStock = stock?.eveningStock ?? 40;
  const availableStock = hour < 12 ? morningStock : eveningStock;

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (!selectedAdmin) {
      Alert.alert(
        'No Shop Selected',
        'Please select a Toddy Shop before placing an order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Select Shop', onPress: () => navigation.navigate('ShopSelection', { returnTo: 'Cart' }) },
        ]
      );
      return false;
    }
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add items before placing order.');
      return false;
    }
    if (deliveryType === 'home' && !coords) {
      Alert.alert('Location Required', 'Please detect your location for home delivery.');
      return false;
    }
    if (deliveryType === 'home' && !canDeliver) {
      Alert.alert(
        'Out of Delivery Range',
        `Sorry, home delivery is only available within ${MAX_DELIVERY_KM} km of our shop.\n\nYou are ${km.toFixed(1)} km away. Please choose Self Pickup.`
      );
      return false;
    }
    if (toddyQty > availableStock) {
      Alert.alert('Low Stock', `Only ${availableStock} toddy bottles available right now.`);
      return false;
    }
    if (payment === 'upi' && upiId.trim().length < 5) {
      Alert.alert('UPI ID Required', 'Please enter a valid UPI ID to proceed.');
      return false;
    }
    return true;
  };

  // ── Place Order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!validate()) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    setPlacing(true);
    try {
      const order = await placeOrder({
        deliveryType,
        paymentMethod: payment,
        upiRef: payment === 'upi' ? upiId : null,
        customerNotes: customerNotes.trim(),
        deliveryAddress: coords
          ? { ...address, latitude: coords.latitude, longitude: coords.longitude }
          : null,
        shopAddress: selectedAdmin?.address,
        shopName: selectedAdmin?.shopName,
        distanceKm: Number(km.toFixed(2)),
        deliveryCharge,
        subtotal: cartTotal,
        total: grandTotal,
        estimatedDelivery: deliveryType === 'home'
          ? (km <= 1 ? '20-30 min' : '30-45 min')
          : 'Ready in 15 min',
      });
      navigation.replace('OrderSuccess', { orderId: order.orderId || order._id });
    } catch {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const openMaps = () => {
    const lat = selectedAdmin?.latitude;
    const lon = selectedAdmin?.longitude;
    if (!lat || !lon) return;
    const url = `https://maps.google.com/?q=${lat},${lon}`;
    Linking.openURL(url).catch(() => Alert.alert('Maps', 'Could not open Google Maps'));
  };

  // ── Empty Cart ──────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <View style={s.empty}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Ionicons name="bag-outline" size={80} color={COLORS.textMuted} />
        <Text style={s.emptyTitle}>Your cart is empty</Text>
        <Text style={s.emptySubtitle}>Add some fresh toddy products to get started</Text>
        <TouchableOpacity style={s.shopBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <LinearGradient colors={['#2d8653', '#1a5c38']} style={s.shopBtnGrad}>
            <Text style={s.shopBtnText}>Shop Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient colors={['#0d1f14', '#142a1c']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Your Cart</Text>
        <Text style={s.headerCount}>{cart.length} item{cart.length !== 1 ? 's' : ''}</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 220 }}>

        {/* ── Selected Shop Banner ─────────────────────────────────────────── */}
        {selectedAdmin ? (
          <TouchableOpacity
            style={s.shopBanner}
            onPress={() => navigation.navigate('ShopSelection')}
            activeOpacity={0.85}
          >
            <Ionicons name="storefront-outline" size={16} color={COLORS.primaryLight} />
            <View style={{ flex: 1 }}>
              <Text style={s.shopBannerName}>{selectedAdmin.shopName}</Text>
              <Text style={s.shopBannerAddr} numberOfLines={1}>{selectedAdmin.address}</Text>
            </View>
            <Text style={s.shopBannerChange}>Change</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.shopBannerEmpty}
            onPress={() => navigation.navigate('ShopSelection', { returnTo: 'Cart' })}
            activeOpacity={0.85}
          >
            <Ionicons name="warning-outline" size={16} color="#ffb74d" />
            <Text style={s.shopBannerEmptyText}>No shop selected — tap to choose a shop</Text>
            <Ionicons name="chevron-forward" size={14} color="#ffb74d" />
          </TouchableOpacity>
        )}

        {/* ── Cart Items ──────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Items</Text>
          {cart.map((item) => (
            <View key={item.id} style={s.cartItem}>
              <Image source={{ uri: item.image }} style={s.itemImg} />
              <View style={s.itemInfo}>
                <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.itemUnit}>{item.unitSize}</Text>
                <Text style={s.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>
              <View style={s.qtyCtrl}>
                <TouchableOpacity
                  style={s.qtyBtn}
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Ionicons
                    name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                    size={15}
                    color={item.quantity === 1 ? '#f44336' : COLORS.white}
                  />
                </TouchableOpacity>
                <Text style={s.qtyNum}>{item.quantity}</Text>
                <TouchableOpacity
                  style={s.qtyBtn}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Ionicons name="add" size={15} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── Delivery Type ───────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Delivery Option</Text>

          {/* Home Delivery */}
          <TouchableOpacity
            style={[
              s.optCard,
              deliveryType === 'home' && s.optCardActive,
              coords && !canDeliver && s.optCardDisabled,
            ]}
            onPress={() => {
              if (coords && !canDeliver) {
                Alert.alert(
                  'Out of Range',
                  `You are ${km.toFixed(1)} km away. Home delivery is only available within ${MAX_DELIVERY_KM} km.`
                );
                return;
              }
              setDeliveryType('home');
            }}
            activeOpacity={0.85}
          >
            <Ionicons
              name="bicycle-outline"
              size={22}
              color={deliveryType === 'home' ? COLORS.primaryLight : COLORS.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.optName, deliveryType === 'home' && s.optNameActive]}>Home Delivery</Text>
              {coords && !canDeliver ? (
                <Text style={s.optWarn}>
                  ⚠️ Out of range ({km.toFixed(1)} km). Only Pickup available.
                </Text>
              ) : (
                <Text style={s.optDesc}>
                  {km > 0
                    ? `₹${calcDeliveryCharge(km)} delivery charge • ${km.toFixed(1)} km away`
                    : 'Detect location to see delivery charge'}
                </Text>
              )}
            </View>
            {deliveryType === 'home' && canDeliver && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primaryLight} />
            )}
          </TouchableOpacity>

          {/* Self Pickup */}
          <TouchableOpacity
            style={[s.optCard, deliveryType === 'pickup' && s.optCardActive]}
            onPress={() => setDeliveryType('pickup')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="walk-outline"
              size={22}
              color={deliveryType === 'pickup' ? COLORS.primaryLight : COLORS.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.optName, deliveryType === 'pickup' && s.optNameActive]}>
                Self Pickup — Free
              </Text>
              <Text style={s.optDesc} numberOfLines={2}>{selectedAdmin?.address || selectedAdmin?.shopName || 'Shop address'}</Text>
            </View>
            {deliveryType === 'pickup' ? (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primaryLight} />
            ) : (
              <TouchableOpacity onPress={openMaps} style={s.mapsBtn}>
                <Ionicons name="navigate-outline" size={14} color={COLORS.accent} />
                <Text style={s.mapsBtnText}>Maps</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {deliveryType === 'pickup' && (
            <TouchableOpacity style={s.mapsFullBtn} onPress={openMaps} activeOpacity={0.85}>
              <Ionicons name="navigate" size={18} color={COLORS.white} />
              <Text style={s.mapsFullBtnText}>Open Shop in Google Maps</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Location Detection (Home Delivery) ─────────────────────────── */}
        {deliveryType === 'home' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Your Delivery Location</Text>
            {coords ? (
              <View style={s.locationCard}>
                <View style={s.locationRow}>
                  <Ionicons name="location" size={20} color={COLORS.primaryLight} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.locationAddr} numberOfLines={2}>
                      {address?.formattedAddress || 'Location detected'}
                    </Text>
                    {address?.district && (
                      <Text style={s.locationMeta}>
                        {[address.district, address.pincode].filter(Boolean).join(' • ')}
                      </Text>
                    )}
                    <Text style={[s.distanceText, !canDeliver && s.distanceWarn]}>
                      📍 {km.toFixed(2)} km from shop
                      {!canDeliver ? ' — ⚠️ Outside delivery zone' : ' ✓'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={s.changeLocBtn}
                  onPress={() => { reset(); }}
                >
                  <Text style={s.changeLocText}>Change Location</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={s.detectBtn}
                onPress={() => detect(
                selectedAdmin?.latitude,
                selectedAdmin?.longitude
              )}
                disabled={locLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['rgba(45,134,83,0.25)', 'rgba(45,134,83,0.1)']}
                  style={s.detectBtnGrad}
                >
                  {locLoading ? (
                    <>
                      <ActivityIndicator size="small" color={COLORS.primaryLight} />
                      <Text style={s.detectBtnText}>Detecting location...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="locate-outline" size={22} color={COLORS.primaryLight} />
                      <Text style={s.detectBtnText}>Detect My Location</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
            {locError && <Text style={s.errText}>⚠️ {locError}</Text>}
          </View>
        )}

        {/* ── Payment Method ───────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Payment Method</Text>
          {PAYMENT_OPTS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[s.optCard, payment === m.id && s.optCardActive]}
              onPress={() => setPayment(m.id)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={m.icon}
                size={22}
                color={payment === m.id ? COLORS.primaryLight : COLORS.textMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={[s.optName, payment === m.id && s.optNameActive]}>{m.label}</Text>
                <Text style={s.optDesc}>{m.desc}</Text>
              </View>
              {payment === m.id && <Ionicons name="checkmark-circle" size={20} color={COLORS.primaryLight} />}
            </TouchableOpacity>
          ))}

          {payment === 'upi' && (
            <View style={s.upiInput}>
              <Ionicons name="phone-portrait-outline" size={18} color={COLORS.textMuted} />
              <TextInput
                style={s.upiField}
                placeholder="Enter UPI ID (e.g. 9876543210@upi)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          )}
        </View>

        {/* ── Customer Notes ───────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Add Notes (Optional)</Text>
          <View style={s.notesInput}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.textMuted} />
            <TextInput
              style={s.notesField}
              placeholder="Special instructions for the tapper or delivery..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={customerNotes}
              onChangeText={setCustomerNotes}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ── Bill Summary ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Bill Summary</Text>
          <View style={s.bill}>
            <BillRow label="Items Total" value={`₹${cartTotal}`} />
            <BillRow
              label={`Delivery ${km > 0 ? `(${km.toFixed(1)} km)` : '(home delivery)'}`}
              value={deliveryType === 'home' && coords
                ? (deliveryCharge > 0 ? `₹${deliveryCharge}` : 'FREE')
                : 'FREE'}
              highlight={deliveryCharge === 0}
            />
            {toddyQty > 0 && (
              <View style={s.stockRow}>
                <Ionicons
                  name={toddyQty <= availableStock ? 'checkmark-circle-outline' : 'warning-outline'}
                  size={14}
                  color={toddyQty <= availableStock ? COLORS.success : COLORS.warning}
                />
                <Text style={[s.stockText, {
                  color: toddyQty <= availableStock ? COLORS.success : COLORS.warning,
                }]}>
                  {toddyQty <= availableStock
                    ? `${availableStock - toddyQty} bottles remaining in stock`
                    : `⚠️ Only ${availableStock} bottles available — reduce quantity`}
                </Text>
              </View>
            )}
            <View style={[s.billRow, s.billTotal]}>
              <Text style={s.billTotalLabel}>Grand Total</Text>
              <Text style={s.billTotalVal}>₹{grandTotal}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Place Order Bar ────────────────────────────────────────────── */}
      <View style={s.bottomBar}>
        <View style={s.totalRow}>
          <View>
            <Text style={s.totalLabel}>Total Amount</Text>
            <Text style={s.totalVal}>₹{grandTotal}</Text>
          </View>
          <View style={s.payBadge}>
            <Ionicons
              name={payment === 'upi' ? 'phone-portrait-outline' : 'cash-outline'}
              size={13}
              color={COLORS.textMuted}
            />
            <Text style={s.payBadgeText}>{payment === 'upi' ? 'UPI' : 'COD'}</Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[s.placeBtn, placing && s.placeBtnDisabled]}
            onPress={handlePlaceOrder}
            disabled={placing}
            activeOpacity={0.88}
          >
            <LinearGradient colors={['#2d8653', '#1a5c38']} style={s.placeBtnGrad}>
              {placing ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={s.placeBtnText}>Placing Order...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                  <Text style={s.placeBtnText}>Place Order</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

function BillRow({ label, value, highlight }) {
  return (
    <View style={s.billRow}>
      <Text style={s.billLabel}>{label}</Text>
      <Text style={[s.billVal, highlight && { color: COLORS.success }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  empty: {
    flex: 1, backgroundColor: COLORS.bgDark,
    alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxl, gap: SPACING.md,
  },
  emptyTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '700' },
  emptySubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, textAlign: 'center' },
  shopBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.md },
  shopBtnGrad: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxxl },
  shopBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 54, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl, gap: SPACING.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '700' },
  headerCount: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  shopBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    backgroundColor: 'rgba(45,134,83,0.1)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(45,134,83,0.2)',
  },
  shopBannerName: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  shopBannerAddr: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 1 },
  shopBannerChange: { color: COLORS.accent, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  shopBannerEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,152,0,0.2)',
  },
  shopBannerEmptyText: { flex: 1, color: '#ffb74d', fontSize: FONTS.sizes.sm, fontWeight: '600' },
  section: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700', marginBottom: SPACING.md },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  itemImg: { width: 68, height: 68, borderRadius: RADIUS.md, backgroundColor: '#1a3a24' },
  itemInfo: { flex: 1 },
  itemName: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700' },
  itemUnit: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  itemPrice: { color: COLORS.accent, fontSize: FONTS.sizes.lg, fontWeight: '800', marginTop: 4 },
  qtyCtrl: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADIUS.md, padding: SPACING.xs,
  },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  optCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  optCardActive: { borderColor: 'rgba(45,134,83,0.5)', backgroundColor: 'rgba(45,134,83,0.1)' },
  optCardDisabled: { opacity: 0.45 },
  optName: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  optNameActive: { color: COLORS.white },
  optDesc: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  optWarn: { color: '#ff9800', fontSize: FONTS.sizes.xs, marginTop: 2, fontWeight: '600' },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(244,200,66,0.15)', paddingHorizontal: SPACING.sm,
    paddingVertical: 4, borderRadius: RADIUS.full,
  },
  mapsBtnText: { color: COLORS.accent, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  mapsFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(45,134,83,0.15)', borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(45,134,83,0.3)',
  },
  mapsFullBtnText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  locationCard: {
    backgroundColor: 'rgba(45,134,83,0.1)', borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(45,134,83,0.25)', marginBottom: SPACING.sm,
  },
  locationRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  locationAddr: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '600', flex: 1 },
  locationMeta: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 3 },
  distanceText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.xs, marginTop: 4, fontWeight: '600' },
  distanceWarn: { color: '#ff9800' },
  changeLocBtn: { marginTop: SPACING.sm, alignSelf: 'flex-end' },
  changeLocText: { color: COLORS.accent, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  detectBtn: {
    borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(45,134,83,0.3)',
  },
  detectBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.lg,
  },
  detectBtnText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.md, fontWeight: '700' },
  errText: { color: '#ff9800', fontSize: FONTS.sizes.xs, textAlign: 'center', marginBottom: SPACING.sm },
  upiInput: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginTop: SPACING.xs,
  },
  upiField: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.md },
  notesInput: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 70,
  },
  notesField: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.sm, minHeight: 50 },
  bill: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    gap: SPACING.sm, marginBottom: SPACING.xl,
  },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },
  billVal: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '600' },
  billTotal: {
    paddingTop: SPACING.sm, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)', marginTop: SPACING.xs,
  },
  billTotalLabel: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  billTotalVal: { color: COLORS.accent, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  stockRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  stockText: { fontSize: FONTS.sizes.xs, fontWeight: '600', flex: 1 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.xl, paddingBottom: 30,
    backgroundColor: 'rgba(13,31,20,0.97)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', gap: SPACING.md,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  totalVal: { color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  payBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  payBadgeText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  placeBtn: { borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.button },
  placeBtnDisabled: { opacity: 0.7 },
  placeBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.lg, gap: SPACING.sm,
  },
  placeBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
});

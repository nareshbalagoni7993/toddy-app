import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
  Alert, ActivityIndicator, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';

// Haversine formula to calculate distance between two GPS coords (in km)
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function StarRating({ rating }) {
  return (
    <View style={ss.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={12}
          color="#f4c842"
        />
      ))}
      <Text style={ss.ratingNum}>{rating.toFixed(1)}</Text>
    </View>
  );
}

export default function ShopSelectionScreen({ navigation, route }) {
  const { nearbyShops, loadNearbyShops, selectShop, selectedAdmin } = useContext(AppContext);
  const [userCoords, setUserCoords] = useState(null);
  const [locLoading, setLocLoading] = useState(true);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [selecting, setSelecting] = useState(null); // shop._id being selected

  const returnTo = route?.params?.returnTo || null;

  useEffect(() => {
    detectUserLocation();
    if (nearbyShops.length === 0) fetchShops();
  }, []);

  const fetchShops = async () => {
    setShopsLoading(true);
    await loadNearbyShops();
    setShopsLoading(false);
  };

  const detectUserLocation = async () => {
    setLocLoading(true);
    try {
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      }
    } catch {}
    setLocLoading(false);
  };

  const getDistance = (shop) => {
    if (!userCoords) return null;
    return haversineKm(userCoords.lat, userCoords.lon, shop.latitude, shop.longitude);
  };

  const handleSelect = async (shop) => {
    setSelecting(shop._id);
    try {
      await selectShop(shop);
      if (returnTo) {
        navigation.navigate(returnTo);
      } else {
        navigation.goBack();
      }
    } catch {
      Alert.alert('Error', 'Could not select shop. Please try again.');
    } finally {
      setSelecting(null);
    }
  };

  const openMaps = (shop) => {
    const url = `https://maps.google.com/?q=${shop.latitude},${shop.longitude}`;
    Linking.openURL(url).catch(() => Alert.alert('Maps', 'Could not open Google Maps'));
  };

  // Sort shops by distance (nearest first) if location available
  const sortedShops = [...nearbyShops].sort((a, b) => {
    const da = getDistance(a);
    const db = getDistance(b);
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });

  return (
    <View style={ss.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient colors={['#0d1f14', '#1a4a2e']} style={ss.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ss.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={ss.headerTitle}>Select Toddy Shop</Text>
          <Text style={ss.headerSub}>Choose a shop to order from</Text>
        </View>
        {locLoading && <ActivityIndicator size="small" color={COLORS.primaryLight} />}
      </LinearGradient>

      {/* Info bar */}
      <View style={ss.infoBar}>
        <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
        <Text style={ss.infoText}>
          {userCoords
            ? 'Shops sorted by distance from your location'
            : 'Enable GPS to see shops sorted by distance'}
        </Text>
        {!locLoading && !userCoords && (
          <TouchableOpacity onPress={detectUserLocation} style={ss.retryBtn}>
            <Text style={ss.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ss.scroll}>

        {shopsLoading && nearbyShops.length === 0 && (
          <ActivityIndicator size="large" color={COLORS.primaryLight} style={{ marginTop: 60 }} />
        )}

        {sortedShops.map((shop) => {
          const distKm = getDistance(shop);
          const shopId = shop._id || shop.id;
          const selectedId = selectedAdmin?._id || selectedAdmin?.id;
          const isSelected = selectedId && selectedId === shopId;
          const isSelecting = selecting === shopId;
          const canDeliver = distKm !== null ? distKm <= shop.deliveryRadius : true;

          return (
            <View
              key={shopId}
              style={[ss.shopCard, isSelected && ss.shopCardSelected]}
            >
              {/* Selected badge */}
              {isSelected && (
                <View style={ss.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#fff" />
                  <Text style={ss.selectedBadgeText}>Currently Selected</Text>
                </View>
              )}

              {/* Shop Header */}
              <View style={ss.shopHead}>
                <View style={ss.shopIconWrap}>
                  <Text style={{ fontSize: 32 }}>🍶</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ss.shopName}>{shop.shopName}</Text>
                  <Text style={ss.ownerName}>by {shop.ownerName}</Text>
                  <StarRating rating={shop.rating} />
                  <Text style={ss.ratingsCount}>({shop.totalRatings} ratings)</Text>
                </View>
                <View style={[ss.openBadge, !shop.isOpen && ss.closedBadge]}>
                  <View style={[ss.openDot, !shop.isOpen && ss.closedDot]} />
                  <Text style={[ss.openText, !shop.isOpen && ss.closedText]}>
                    {shop.isOpen ? 'Open' : 'Closed'}
                  </Text>
                </View>
              </View>

              {/* Address & Distance */}
              <View style={ss.infoRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.primaryLight} />
                <Text style={ss.addressText} numberOfLines={2}>{shop.address}</Text>
                <TouchableOpacity onPress={() => openMaps(shop)} style={ss.mapBtn}>
                  <Ionicons name="navigate-outline" size={12} color={COLORS.accent} />
                  <Text style={ss.mapBtnText}>Map</Text>
                </TouchableOpacity>
              </View>

              {distKm !== null && (
                <View style={[ss.distanceRow, !canDeliver && ss.distanceRowWarn]}>
                  <Ionicons
                    name={canDeliver ? 'bicycle-outline' : 'alert-circle-outline'}
                    size={14}
                    color={canDeliver ? COLORS.primaryLight : '#ff9800'}
                  />
                  <Text style={[ss.distanceText, !canDeliver && ss.distanceWarn]}>
                    {distKm.toFixed(1)} km away
                    {canDeliver
                      ? ` • Home delivery available (within ${shop.deliveryRadius} km)`
                      : ` • Home delivery unavailable — pickup only`}
                  </Text>
                </View>
              )}

              {/* Hours */}
              <View style={ss.infoRow}>
                <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                <Text style={ss.hoursText}>{shop.openTime} – {shop.closeTime}</Text>
                <Text style={ss.minOrderText}>Min order: ₹{shop.minOrder}</Text>
              </View>

              {/* Specialties */}
              {shop.specialties?.length > 0 && (
                <View style={ss.specialtiesWrap}>
                  {(shop.specialties || []).slice(0, 4).map((s, i) => (
                    <View key={i} style={ss.specialtyChip}>
                      <Text style={ss.specialtyText}>{s}</Text>
                    </View>
                  ))}
                  {shop.specialties.length > 4 && (
                    <View style={ss.specialtyChip}>
                      <Text style={ss.specialtyText}>+{shop.specialties.length - 4} more</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Description */}
              {!!shop.description && <Text style={ss.desc}>{shop.description}</Text>}

              {/* Select Button */}
              <TouchableOpacity
                style={[ss.selectBtn, isSelected && ss.selectBtnSelected]}
                onPress={() => handleSelect(shop)}
                disabled={isSelecting || isSelected}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={isSelected ? ['#1a5c38', '#0f3d22'] : ['#2d8653', '#1a5c38']}
                  style={ss.selectBtnGrad}
                >
                  {isSelecting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : isSelected ? (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={ss.selectBtnText}>Shop Selected</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="storefront-outline" size={18} color="#fff" />
                      <Text style={ss.selectBtnText}>Select This Shop</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingTop: 54, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  headerSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  infoBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(45,134,83,0.08)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  infoText: { flex: 1, color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  retryBtn: { paddingHorizontal: SPACING.sm },
  retryText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  scroll: { padding: SPACING.xl, gap: SPACING.lg },
  shopCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: SPACING.xl, gap: SPACING.md, ...SHADOWS.card,
  },
  shopCardSelected: {
    borderColor: 'rgba(45,134,83,0.6)',
    backgroundColor: 'rgba(45,134,83,0.08)',
  },
  selectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2d8653', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  selectedBadgeText: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  shopHead: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  shopIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(45,134,83,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(45,134,83,0.3)',
  },
  shopName: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '800' },
  ownerName: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  ratingNum: { color: '#f4c842', fontSize: FONTS.sizes.xs, fontWeight: '700', marginLeft: 4 },
  ratingsCount: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  openBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(76,175,80,0.15)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(76,175,80,0.3)',
    alignSelf: 'flex-start',
  },
  closedBadge: {
    backgroundColor: 'rgba(239,83,80,0.15)', borderColor: 'rgba(239,83,80,0.3)',
  },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4caf50' },
  closedDot: { backgroundColor: '#ef5350' },
  openText: { color: '#4caf50', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  closedText: { color: '#ef5350' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  addressText: { flex: 1, color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(244,200,66,0.12)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
  },
  mapBtnText: { color: COLORS.accent, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  distanceRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: 'rgba(45,134,83,0.1)', borderRadius: RADIUS.md, padding: SPACING.sm,
  },
  distanceRowWarn: { backgroundColor: 'rgba(255,152,0,0.1)' },
  distanceText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.xs, flex: 1, fontWeight: '600' },
  distanceWarn: { color: '#ff9800' },
  hoursText: { flex: 1, color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  minOrderText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  specialtiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  specialtyChip: {
    backgroundColor: 'rgba(244,200,66,0.1)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(244,200,66,0.2)',
  },
  specialtyText: { color: COLORS.accent, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  desc: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, lineHeight: 20 },
  selectBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOWS.button },
  selectBtnSelected: { opacity: 0.8 },
  selectBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.lg, gap: SPACING.sm,
  },
  selectBtnText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '800' },
});

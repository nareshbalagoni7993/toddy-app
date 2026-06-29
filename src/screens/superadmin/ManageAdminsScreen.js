import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Alert, TextInput, Switch, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { superAdminAPI } from '../../config/api';

export default function ManageAdminsScreen({ navigation }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState(null); // null = all

  const load = useCallback(async (q = search) => {
    try {
      const params = {};
      if (q) params.search = q;
      if (filterActive !== null) params.isActive = filterActive;

      const { data } = await superAdminAPI.getAdmins(params);
      setAdmins(data.data || []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load admins');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filterActive]);

  useEffect(() => { load(); }, [filterActive]);

  const handleToggle = async (admin) => {
    const action = admin.isActive ? 'disable' : 'enable';
    Alert.alert(
      `${admin.isActive ? 'Disable' : 'Enable'} Admin`,
      `Are you sure you want to ${action} "${admin.shopName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: admin.isActive ? 'Disable' : 'Enable',
          style: admin.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await superAdminAPI.toggleAdmin(admin._id);
              setAdmins((prev) =>
                prev.map((a) => a._id === admin._id ? { ...a, isActive: !a.isActive } : a)
              );
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (admin) => {
    Alert.alert(
      'Delete Admin',
      `Permanently delete "${admin.shopName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await superAdminAPI.deleteAdmin(admin._id);
              setAdmins((prev) => prev.filter((a) => a._id !== admin._id));
              Alert.alert('Done', `${admin.shopName} deleted.`);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete admin');
            }
          },
        },
      ]
    );
  };

  const renderAdmin = ({ item }) => (
    <View style={[s.card, !item.isActive && s.cardDisabled]}>
      <TouchableOpacity
        style={s.cardMain}
        onPress={() => navigation.navigate('AdminDetail', { adminId: item._id })}
        activeOpacity={0.85}
      >
        <View style={s.cardHeader}>
          <View style={[s.statusDot, { backgroundColor: item.isActive ? '#4caf50' : '#ef5350' }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.shopName}>{item.shopName}</Text>
            <Text style={s.ownerName}>{item.ownerName} · {item.phone}</Text>
          </View>
          <View style={s.cardBadges}>
            <Text style={s.orderCount}>{item.orderCount || 0} orders</Text>
            <Text style={s.revenue}>₹{item.revenue || 0}</Text>
          </View>
        </View>
        <Text style={s.address} numberOfLines={1}>
          <Ionicons name="location-outline" size={11} color={COLORS.textMuted} /> {item.address}
        </Text>
        <View style={s.metaRow}>
          <Text style={s.meta}>{item.openTime} – {item.closeTime}</Text>
          <Text style={s.meta}>⭐ {item.rating}</Text>
          <Text style={s.meta}>📦 {item.deliveryRadius} km</Text>
        </View>
      </TouchableOpacity>

      <View style={s.cardActions}>
        <TouchableOpacity
          style={[s.actionBtn, { borderColor: item.isActive ? 'rgba(239,83,80,0.4)' : 'rgba(76,175,80,0.4)' }]}
          onPress={() => handleToggle(item)}
        >
          <Ionicons
            name={item.isActive ? 'ban-outline' : 'checkmark-circle-outline'}
            size={15}
            color={item.isActive ? '#ef5350' : '#4caf50'}
          />
          <Text style={[s.actionBtnText, { color: item.isActive ? '#ef5350' : '#4caf50' }]}>
            {item.isActive ? 'Disable' : 'Enable'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, { borderColor: 'rgba(244,200,66,0.4)' }]}
          onPress={() => navigation.navigate('EditAdmin', { admin: item })}
        >
          <Ionicons name="pencil-outline" size={15} color={COLORS.accent} />
          <Text style={[s.actionBtnText, { color: COLORS.accent }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, { borderColor: 'rgba(239,83,80,0.3)' }]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={15} color="#ef5350" />
          <Text style={[s.actionBtnText, { color: '#ef5350' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0d0d1a', '#0d1f14']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Manage Shops</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => navigation.navigate('CreateAdmin')}
        >
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search shop name, owner, phone..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load(search)}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); load(''); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills */}
      <View style={s.filterRow}>
        {[{ label: 'All', val: null }, { label: 'Active', val: true }, { label: 'Disabled', val: false }].map((f) => (
          <TouchableOpacity
            key={String(f.val)}
            style={[s.filterChip, filterActive === f.val && s.filterChipActive]}
            onPress={() => setFilterActive(f.val)}
          >
            <Text style={[s.filterText, filterActive === f.val && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
        <Text style={s.countText}>{admins.length} shops</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryLight} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(a) => a._id}
          renderItem={renderAdmin}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={COLORS.primaryLight}
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="storefront-outline" size={60} color={COLORS.textMuted} />
              <Text style={s.emptyText}>No shops found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingTop: 54, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl,
  },
  back: { padding: 4 },
  headerTitle: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(45,134,83,0.3)', alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md,
    marginHorizontal: SPACING.xl, marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.md },
  filterRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.xl, marginTop: SPACING.sm, marginBottom: SPACING.xs,
  },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  filterChipActive: { backgroundColor: 'rgba(45,134,83,0.25)', borderColor: 'rgba(45,134,83,0.5)' },
  filterText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  filterTextActive: { color: COLORS.primaryLight },
  countText: { marginLeft: 'auto', color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  list: { padding: SPACING.lg, gap: SPACING.sm, paddingBottom: 80 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  cardDisabled: { opacity: 0.55 },
  cardMain: { padding: SPACING.lg, gap: SPACING.xs },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  shopName: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '800' },
  ownerName: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  cardBadges: { alignItems: 'flex-end' },
  orderCount: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs },
  revenue: { color: COLORS.accent, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  address: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  metaRow: { flexDirection: 'row', gap: SPACING.lg },
  meta: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  cardActions: {
    flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)' },
  actionBtnText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: SPACING.md },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },
});

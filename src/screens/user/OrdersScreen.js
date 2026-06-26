import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';
import { ORDER_STATUSES } from '../../constants/data';

function getStatusInfo(status) {
  return ORDER_STATUSES.find((s) => s.key === status) || ORDER_STATUSES[0];
}

export default function OrdersScreen({ navigation }) {
  const { orders } = useContext(AppContext);

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('HomeTab')}>
          <LinearGradient colors={['#2d8653', '#1a5c38']} style={styles.shopBtnGradient}>
            <Text style={styles.shopBtnText}>Shop Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerCount}>{orders.length} order{orders.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const statusInfo = getStatusInfo(item.status);
          return (
            <View style={styles.orderCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)']}
                style={styles.orderGradient}
              >
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20`, borderColor: `${statusInfo.color}40` }]}>
                    <Ionicons name={statusInfo.icon} size={13} color={statusInfo.color} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>

                <View style={styles.itemsList}>
                  {item.items.slice(0, 2).map((product) => (
                    <Text key={product.id} style={styles.itemText} numberOfLines={1}>
                      • {product.name} × {product.quantity}
                    </Text>
                  ))}
                  {item.items.length > 2 && (
                    <Text style={styles.moreText}>+{item.items.length - 2} more items</Text>
                  )}
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>₹{item.total}</Text>
                  <View style={styles.footerRight}>
                    <View style={styles.deliveryBadge}>
                      <Ionicons
                        name={item.deliveryType === 'home' ? 'bicycle-outline' : 'walk-outline'}
                        size={13} color={COLORS.textMuted}
                      />
                      <Text style={styles.deliveryText}>
                        {item.deliveryType === 'home' ? 'Home Delivery' : 'Self Pickup'}
                      </Text>
                    </View>
                    {item.status !== 'delivered' && item.status !== 'cancelled' && (
                      <TouchableOpacity
                        style={styles.trackBtn}
                        onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="location-outline" size={12} color={COLORS.primaryLight} />
                        <Text style={styles.trackBtnText}>Track</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'delivered' && (
                      <TouchableOpacity
                        style={styles.trackBtnDelivered}
                        onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.trackBtnTextDelivered}>View Details</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  emptyContainer: {
    flex: 1, backgroundColor: COLORS.bgDark,
    alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxl,
  },
  emptyIcon: { fontSize: 80, marginBottom: SPACING.xl },
  emptyTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '700', marginBottom: SPACING.sm },
  emptySubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, textAlign: 'center', marginBottom: SPACING.xxl },
  shopBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  shopBtnGradient: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxxl },
  shopBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 54, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  headerCount: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  list: { padding: SPACING.xl, gap: SPACING.md },
  orderCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', ...SHADOWS.card },
  orderGradient: { padding: SPACING.lg },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  orderId: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700' },
  orderDate: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1 },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  itemsList: { marginBottom: SPACING.md, gap: 4 },
  itemText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  moreText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  orderTotal: { color: COLORS.accent, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  footerRight: { alignItems: 'flex-end', gap: 6 },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deliveryText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  trackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(45,134,83,0.15)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(45,134,83,0.3)' },
  trackBtnText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  trackBtnDelivered: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  trackBtnTextDelivered: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '600' },
});

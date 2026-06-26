import React, { useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

const TYPE_COLORS = {
  order_placed: '#4caf7d',
  order_accepted: '#81c784',
  order_preparing: '#ffb74d',
  order_ready: '#4db6ac',
  order_out_for_delivery: '#7986cb',
  order_delivered: '#4caf50',
  order_cancelled: '#ef5350',
};

const TYPE_ICONS = {
  order_placed: 'receipt-outline',
  order_accepted: 'checkmark-circle-outline',
  order_preparing: 'time-outline',
  order_ready: 'bag-check-outline',
  order_out_for_delivery: 'bicycle-outline',
  order_delivered: 'home-outline',
  order_cancelled: 'close-circle-outline',
};

export default function NotificationsScreen({ navigation }) {
  const { notifications, markRead, markAllRead } = useContext(AppContext);

  const renderItem = ({ item }) => {
    const color = TYPE_COLORS[item.type] || COLORS.primaryLight;
    const icon = TYPE_ICONS[item.type] || 'notifications-outline';
    return (
      <TouchableOpacity
        style={[s.card, !item.read && s.cardUnread]}
        onPress={() => {
          markRead(item.id);
          if (item.orderId) navigation.navigate('OrderTracking', { orderId: item.orderId });
        }}
        activeOpacity={0.8}
      >
        <View style={[s.iconWrap, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={s.body}>
          <Text style={s.title} numberOfLines={1}>{item.title}</Text>
          <Text style={s.bodyText} numberOfLines={2}>{item.body}</Text>
          <Text style={s.time}>{timeAgo(item.time)}</Text>
        </View>
        {!item.read && <View style={s.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0d1f14', '#142a1c']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        {notifications.some((n) => !n.read) && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={s.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {notifications.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 64 }}>🔔</Text>
          <Text style={s.emptyTitle}>No notifications yet</Text>
          <Text style={s.emptySubtitle}>Order updates and alerts will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 54, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl, gap: SPACING.md },
  back: { padding: 4 },
  headerTitle: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '700' },
  markAll: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  list: { padding: SPACING.xl, gap: SPACING.sm },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardUnread: { backgroundColor: 'rgba(45,134,83,0.1)', borderColor: 'rgba(45,134,83,0.25)' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  body: { flex: 1 },
  title: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700', marginBottom: 2 },
  bodyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, lineHeight: 18 },
  time: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primaryLight, marginTop: 6, flexShrink: 0 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING.xxxl },
  emptyTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '700' },
  emptySubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, textAlign: 'center' },
});

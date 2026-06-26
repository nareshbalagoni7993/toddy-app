import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { AppContext } from '../context/AppContext';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminStockScreen from '../screens/admin/AdminStockScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  const { getAdminOrders } = useContext(AppContext);
  // Badge shows only this admin's pending orders
  const adminOrders = getAdminOrders();
  const pendingCount = adminOrders.filter(
    (o) => o.status === 'placed' || o.status === 'accepted'
  ).length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primaryLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'AdminDashboard')  iconName = focused ? 'grid'    : 'grid-outline';
          else if (route.name === 'AdminOrders')   iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'AdminStock')    iconName = focused ? 'layers'  : 'layers-outline';
          else if (route.name === 'AdminProducts') iconName = focused ? 'cube'    : 'cube-outline';

          if (route.name === 'AdminOrders' && pendingCount > 0) {
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
                </View>
              </View>
            );
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="AdminDashboard"  component={AdminDashboardScreen}  options={{ title: 'Dashboard' }} />
      <Tab.Screen name="AdminOrders"     component={AdminOrdersScreen}     options={{ title: 'Orders' }} />
      <Tab.Screen name="AdminStock"      component={AdminStockScreen}      options={{ title: 'Stock' }} />
      <Tab.Screen name="AdminProducts"   component={AdminProductsScreen}   options={{ title: 'Products' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0d1f14',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    height: 65,
  },
  tabLabel: { fontSize: FONTS.sizes.xs, fontWeight: '600', marginTop: 2 },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: '#ef5350', borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

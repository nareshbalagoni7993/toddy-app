import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { AppContext } from '../context/AppContext';
import HomeScreen from '../screens/user/HomeScreen';
import OrdersScreen from '../screens/user/OrdersScreen';
import FavoritesScreen from '../screens/user/FavoritesScreen';
import ExploreScreen from '../screens/user/ExploreScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function UserNavigator() {
  const { unreadCount, favorites } = useContext(AppContext);

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
          if (route.name === 'HomeTab')      iconName = focused ? 'home'             : 'home-outline';
          else if (route.name === 'OrdersTab')    iconName = focused ? 'receipt'         : 'receipt-outline';
          else if (route.name === 'FavoritesTab') iconName = focused ? 'heart'           : 'heart-outline';
          else if (route.name === 'ExploreTab')   iconName = focused ? 'compass'         : 'compass-outline';
          else if (route.name === 'ProfileTab')   iconName = focused ? 'person'          : 'person-outline';

          // Favorites badge (red dot when items saved)
          if (route.name === 'FavoritesTab' && favorites.length > 0) {
            return (
              <View>
                <Ionicons name={iconName} size={size} color={focused ? '#f44336' : color} />
                <View style={[styles.badge, styles.heartBadge]}>
                  <Text style={styles.heartBadgeText}>{favorites.length > 9 ? '9+' : favorites.length}</Text>
                </View>
              </View>
            );
          }

          // Notifications badge on profile tab
          if (route.name === 'ProfileTab' && unreadCount > 0) {
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              </View>
            );
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={route.name === 'FavoritesTab' && focused ? '#f44336' : color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab"      component={HomeScreen}      options={{ title: 'Home' }} />
      <Tab.Screen name="OrdersTab"    component={OrdersScreen}    options={{ title: 'Orders' }} />
      <Tab.Screen name="FavoritesTab" component={FavoritesScreen} options={{ title: 'Saved' }} />
      <Tab.Screen name="ExploreTab"   component={ExploreScreen}   options={{ title: 'Explore' }} />
      <Tab.Screen name="ProfileTab"   component={ProfileScreen}   options={{ title: 'Profile' }} />
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
  tabLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#0d1f14', fontSize: 9, fontWeight: '800' },
  heartBadge: { backgroundColor: '#f44336' },
  heartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

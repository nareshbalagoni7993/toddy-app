import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { AppProvider, AppContext } from './src/context/AppContext';
import { ThemeProvider } from './src/context/ThemeContext';

// Auth
import SplashScreen from './src/screens/auth/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';

// User
import UserNavigator from './src/navigation/UserNavigator';
import CartScreen from './src/screens/user/CartScreen';
import ProductDetailScreen from './src/screens/user/ProductDetailScreen';
import SearchScreen from './src/screens/user/SearchScreen';
import OrderSuccessScreen from './src/screens/user/OrderSuccessScreen';
import OrderTrackingScreen from './src/screens/user/OrderTrackingScreen';
import NotificationsScreen from './src/screens/user/NotificationsScreen';
import ExploreScreen from './src/screens/user/ExploreScreen';
import ShopSelectionScreen from './src/screens/user/ShopSelectionScreen';

// Admin
import AdminNavigator from './src/navigation/AdminNavigator';

// Super Admin
import SuperAdminNavigator from './src/navigation/SuperAdminNavigator';

const Stack = createNativeStackNavigator();

// ── Root navigator — switches between auth and app based on role ──────────────
function RootNavigator() {
  const { role, authLoading } = useContext(AppContext);

  // Show loading screen while restoring session
  if (authLoading) {
    return (
      <View style={styles.loadScreen}>
        <ActivityIndicator size="large" color="#2d8653" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      initialRouteName={role ? getMainRoute(role) : 'Splash'}
    >
      {/* Always include auth screens so getParent().dispatch(reset) works */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />

      {/* User */}
      <Stack.Screen name="UserMain" component={UserNavigator} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Education" component={ExploreScreen} />
      <Stack.Screen name="ShopSelection" component={ShopSelectionScreen} />

      {/* Admin */}
      <Stack.Screen name="AdminMain" component={AdminNavigator} />

      {/* Super Admin */}
      <Stack.Screen name="SuperAdminMain" component={SuperAdminNavigator} />
    </Stack.Navigator>
  );
}

function getMainRoute(role) {
  if (role === 'super_admin') return 'SuperAdminMain';
  if (role === 'admin') return 'AdminMain';
  if (role === 'user') return 'UserMain';
  return 'Splash';
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadScreen: {
    flex: 1,
    backgroundColor: '#0d1f14',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

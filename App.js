import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/context/AppContext';
import { ThemeProvider } from './src/context/ThemeContext';

import SplashScreen from './src/screens/auth/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import UserNavigator from './src/navigation/UserNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';
import CartScreen from './src/screens/user/CartScreen';
import ProductDetailScreen from './src/screens/user/ProductDetailScreen';
import SearchScreen from './src/screens/user/SearchScreen';
import OrderSuccessScreen from './src/screens/user/OrderSuccessScreen';
import OrderTrackingScreen from './src/screens/user/OrderTrackingScreen';
import NotificationsScreen from './src/screens/user/NotificationsScreen';
import ExploreScreen from './src/screens/user/ExploreScreen';
import ShopSelectionScreen from './src/screens/user/ShopSelectionScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
                initialRouteName="Splash"
              >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="UserMain" component={UserNavigator} />
                <Stack.Screen name="AdminMain" component={AdminNavigator} />
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
              </Stack.Navigator>
            </NavigationContainer>
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

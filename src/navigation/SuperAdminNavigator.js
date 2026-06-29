import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SuperAdminDashboardScreen from '../screens/superadmin/SuperAdminDashboardScreen';
import ManageAdminsScreen from '../screens/superadmin/ManageAdminsScreen';
import CreateAdminScreen from '../screens/superadmin/CreateAdminScreen';

const Stack = createNativeStackNavigator();

export default function SuperAdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboardScreen} />
      <Stack.Screen name="ManageAdmins" component={ManageAdminsScreen} />
      <Stack.Screen name="CreateAdmin" component={CreateAdminScreen} />
      <Stack.Screen name="EditAdmin" component={CreateAdminScreen} />
      {/* AdminDetail and AllOrders can be added here */}
    </Stack.Navigator>
  );
}

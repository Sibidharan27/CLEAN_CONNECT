import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverDashboard from '../screens/Driver/Dashboard';
import AssignedRoutes from '../screens/Driver/AssignedRoutes';
import LiveNavigation from '../screens/Driver/LiveNavigation';
import CompletedCollections from '../screens/Driver/CompletedCollections';
import DriverProfile from '../screens/Driver/Profile';

const Stack = createNativeStackNavigator();

const DriverNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
      <Stack.Screen name="AssignedRoutes" component={AssignedRoutes} />
      <Stack.Screen name="LiveNavigation" component={LiveNavigation} />
      <Stack.Screen name="CompletedCollections" component={CompletedCollections} />
      <Stack.Screen name="DriverProfile" component={DriverProfile} />
    </Stack.Navigator>
  );
};

export default DriverNavigator;

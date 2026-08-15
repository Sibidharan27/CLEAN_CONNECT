import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles } from '../theme';

import DriverDashboard from '../screens/Driver/Dashboard';
import AssignedRoutes from '../screens/Driver/AssignedRoutes';
import LiveNavigation from '../screens/Driver/LiveNavigation';
import CompletedCollections from '../screens/Driver/CompletedCollections';
import DriverProfile from '../screens/Driver/Profile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab bar icon component
const TabIcon = ({ name, focused, color, badge }) => (
  <View style={styles.tabIconWrapper}>
    <MaterialCommunityIcons name={focused ? name : `${name}-outline`} size={24} color={color} />
    {badge > 0 && (
      <View style={styles.tabBadge}>
        <Text style={styles.tabBadgeText}>{badge > 9 ? '9+' : badge}</Text>
      </View>
    )}
  </View>
);

// Bottom tab navigator for main driver screens
const DriverTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: '#1565C0',
      tabBarInactiveTintColor: Colors.textTertiary,
      tabBarLabelStyle: styles.tabLabel,
      tabBarHideOnKeyboard: true,
    }}
  >
    <Tab.Screen
      name="DriverDashboard"
      component={DriverDashboard}
      options={{
        tabBarLabel: 'Dashboard',
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name="view-dashboard" focused={focused} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="AssignedRoutes"
      component={AssignedRoutes}
      options={{
        tabBarLabel: 'My Route',
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name="map" focused={focused} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="CompletedCollections"
      component={CompletedCollections}
      options={{
        tabBarLabel: 'Completed',
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name="clipboard-check" focused={focused} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="DriverProfile"
      component={DriverProfile}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name="account-circle" focused={focused} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

// Root stack — tabs as main screen, LiveNavigation as modal
const DriverNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DriverTabs" component={DriverTabs} />
    <Stack.Screen
      name="LiveNavigation"
      component={LiveNavigation}
      options={{ animation: 'slide_from_bottom' }}
    />
    {/* Keep these accessible from tab screens via navigation.navigate() */}
    <Stack.Screen name="DriverDashboardStack" component={DriverDashboard} />
    <Stack.Screen name="AssignedRoutesStack" component={AssignedRoutes} />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8EDF2',
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  tabLabel: {
    ...textStyles.caption,
    fontSize: 11,
    marginTop: 2,
  },
  tabIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },
});

export default DriverNavigator;

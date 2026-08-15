import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme';

import HomeScreen from '../screens/Citizen/HomeScreen';
import LiveTracking from '../screens/Citizen/LiveTracking';
import Notifications from '../screens/Citizen/Notifications';
import Profile from '../screens/Citizen/Profile';
import ReportComplaint from '../screens/Citizen/ReportComplaint';
import ComplaintHistory from '../screens/Citizen/ComplaintHistory';
import ComplaintDetails from '../screens/Citizen/ComplaintDetails';
import CollectionSchedule from '../screens/Citizen/CollectionSchedule';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Tab screens (visible in bottom tab bar) ──────────────────────────────────
const HomeTab = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: Colors.tabActive,
      tabBarInactiveTintColor: Colors.tabInactive,
      tabBarLabelStyle: {
        fontSize: 11,
        fontFamily: 'Poppins_500Medium',
        marginTop: 2,
      },
      tabBarIcon: ({ focused, color }) => {
        const icons = {
          Home: focused ? 'home' : 'home-outline',
          Track: focused ? 'truck-fast' : 'truck-outline',
          Notifications: focused ? 'bell' : 'bell-outline',
          Profile: focused ? 'account' : 'account-outline',
        };
        return (
          <View style={focused ? styles.activeTabIconBg : styles.tabIconBg}>
            <MaterialCommunityIcons name={icons[route.name] || 'home-outline'} size={focused ? 22 : 20} color={color} />
          </View>
        );
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
    <Tab.Screen name="Track" component={LiveTracking} options={{ tabBarLabel: 'Track' }} />
    <Tab.Screen name="Notifications" component={Notifications} options={{ tabBarLabel: 'Alerts' }} />
    <Tab.Screen name="Profile" component={Profile} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

// ── Root stack — tab bar is the main screen, modal screens slide on top ───────
// All modal/push screens are registered HERE so they're reachable from any tab
const CitizenNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {/* Main tabs */}
    <Stack.Screen name="CitizenTabs" component={HomeTab} />

    {/* Stack screens accessible from any tab via navigation.navigate() */}
    <Stack.Screen name="LiveTracking" component={LiveTracking} />
    <Stack.Screen name="ReportComplaint" component={ReportComplaint} />
    <Stack.Screen name="ComplaintHistory" component={ComplaintHistory} />
    <Stack.Screen name="ComplaintDetails" component={ComplaintDetails} />
    <Stack.Screen name="CollectionSchedule" component={CollectionSchedule} />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBackground,
    borderTopWidth: 0,
    height: 70,
    paddingBottom: 10,
    paddingTop: 6,
    ...Shadows.lg,
  },
  activeTabIconBg: {
    width: 44,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconBg: {
    width: 44,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CitizenNavigator;

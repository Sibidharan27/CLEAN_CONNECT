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

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="ReportComplaint" component={ReportComplaint} />
    <Stack.Screen name="ComplaintHistory" component={ComplaintHistory} />
    <Stack.Screen name="ComplaintDetails" component={ComplaintDetails} />
    <Stack.Screen name="CollectionSchedule" component={CollectionSchedule} />
  </Stack.Navigator>
);

const TrackStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TrackMain" component={LiveTracking} />
  </Stack.Navigator>
);

const NotificationsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NotificationsMain" component={Notifications} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={Profile} />
  </Stack.Navigator>
);

const TAB_CONFIG = [
  { name: 'Home', component: HomeStack, icon: 'home', activeIcon: 'home', label: 'Home' },
  { name: 'Track', component: TrackStack, icon: 'truck-outline', activeIcon: 'truck-fast', label: 'Track' },
  { name: 'Notifications', component: NotificationsStack, icon: 'bell-outline', activeIcon: 'bell', label: 'Alerts', badge: 2 },
  { name: 'Profile', component: ProfileStack, icon: 'account-outline', activeIcon: 'account', label: 'Profile' },
];

const CitizenNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBackground,
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
          ...Shadows.lg,
        },
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Poppins_500Medium',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const tab = TAB_CONFIG.find(t => t.name === route.name);
          const iconName = focused ? (tab?.activeIcon || tab?.icon) : tab?.icon;
          return (
            <View style={focused ? styles.activeTabIconBg : styles.tabIconBg}>
              <MaterialCommunityIcons name={iconName || 'home'} size={focused ? 22 : 20} color={color} />
              {tab?.badge && !focused && (
                <View style={styles.tabBadge}>
                  <View style={styles.tabBadgeDot} />
                </View>
              )}
            </View>
          );
        },
      })}
    >
      {TAB_CONFIG.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} options={{ tabBarLabel: tab.label }} />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
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
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: 2,
    right: 8,
  },
  tabBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});

export default CitizenNavigator;

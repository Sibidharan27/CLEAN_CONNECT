import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { NotificationProvider } from './src/context/NotificationContext';
import LoadingScreen from './src/components/Loading/LoadingScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <LoadingScreen message="Initializing CleanConnect+..." />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <NotificationProvider>
            <AppNavigator />
            <StatusBar style="dark" />
          </NotificationProvider>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

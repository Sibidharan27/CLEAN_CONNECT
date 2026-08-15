import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import CitizenNavigator from './CitizenNavigator';
import DriverNavigator from './DriverNavigator';
import LoadingScreen from '../components/Loading/LoadingScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen message="Initializing CleanConnect+..." />;

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : role === 'driver' ? (
        <DriverNavigator />
      ) : (
        <CitizenNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;

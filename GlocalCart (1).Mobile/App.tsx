import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { AppAlertProvider } from './src/components/common/AppAlert';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppAlertProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor="#FF6B35" translucent={false} />
            <AppNavigator />
          </NavigationContainer>
        </AppAlertProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import * as Updates from 'expo-updates';
import { AuthProvider } from './src/context/AuthContext';
import { NetworkProvider } from './src/context/NetworkContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import OfflineBanner from './src/components/OfflineBanner';
import gpsTrackingService from './src/services/gpsTrackingService';

async function checkForUpdates() {
  if (__DEV__) return; // Skip in development / Expo Go
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      Alert.alert(
        'Update Available',
        'A new version has been downloaded. Restart the app to apply the update.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart Now', onPress: () => Updates.reloadAsync() },
        ]
      );
    }
  } catch (e) {
    console.log('Error checking for updates:', e);
  }
}

export default function App() {
  // Initialize GPS tracking service on app start
  // This will resume any ongoing trip tracking if the app was closed
  useEffect(() => {
    gpsTrackingService.initialize();
    checkForUpdates();

    return () => {
      gpsTrackingService.cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NetworkProvider>
            <AuthProvider>
              <NavigationContainer>
                <StatusBar style="light" />
                <OfflineBanner />
                <AppNavigator />
              </NavigationContainer>
            </AuthProvider>
          </NetworkProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

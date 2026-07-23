import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isApproved, loading, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (!isApproved && user?.user_type === 'driver') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      </Stack.Navigator>
    );
  }

  return <MainNavigator />;
};

export default AppNavigator;

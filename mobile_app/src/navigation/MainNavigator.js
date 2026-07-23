import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import sorApi from '../api/sorApi';
import { sorEvents, SOR_EVENTS } from '../utils/eventEmitter';

// Dashboard
import DashboardScreen from '../screens/dashboard/DashboardScreen';

// Vehicles
import VehicleListScreen from '../screens/vehicles/VehicleListScreen';
import VehicleDetailScreen from '../screens/vehicles/VehicleDetailScreen';

// Trips
import TripListScreen from '../screens/trips/TripListScreen';
import TripDetailScreen from '../screens/trips/TripDetailScreen';
import StartTripScreen from '../screens/trips/StartTripScreen';
import EndTripScreen from '../screens/trips/EndTripScreen';
import TripMapScreen from '../screens/trips/TripMapScreen';

// Maintenance
import MaintenanceListScreen from '../screens/maintenance/MaintenanceListScreen';
import MaintenanceDetailScreen from '../screens/maintenance/MaintenanceDetailScreen';
import AddMaintenanceScreen from '../screens/maintenance/AddMaintenanceScreen';

// Fuel
import FuelListScreen from '../screens/fuel/FuelListScreen';
import FuelDetailScreen from '../screens/fuel/FuelDetailScreen';
import AddFuelScreen from '../screens/fuel/AddFuelScreen';

// SOR
import {
  SORListScreen,
  SORDetailScreen,
  CreateSORScreen,
  BundleListScreen,
  BundleDetailScreen,
  CreateBundleSORScreen,
} from '../screens/sor';

// Personal Vehicle
import { MyVehicleScreen, MyVehicleDetailScreen, ReimbursementScreen } from '../screens/personal-vehicle';

// Documents
import DocumentListScreen from '../screens/documents/DocumentListScreen';
import AddDocumentScreen from '../screens/documents/AddDocumentScreen';
import EditDocumentScreen from '../screens/documents/EditDocumentScreen';

// Profile
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: colors.primary,
  },
  headerTintColor: colors.textOnPrimary,
  headerTitleStyle: {
    fontWeight: '600',
  },
};

// Dashboard Stack
const DashboardStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ title: 'Dashboard' }} />
  </Stack.Navigator>
);

// Vehicles Stack
const VehiclesStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="VehicleList" component={VehicleListScreen} options={{ title: 'Vehicles' }} />
    <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
  </Stack.Navigator>
);

// Trips Stack
const TripsStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="TripList" component={TripListScreen} options={{ title: 'Trips' }} />
    <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Trip Details' }} />
    <Stack.Screen name="StartTrip" component={StartTripScreen} options={{ title: 'Start Trip' }} />
    <Stack.Screen name="EndTrip" component={EndTripScreen} options={{ title: 'End Trip' }} />
    <Stack.Screen name="TripMap" component={TripMapScreen} options={{ title: 'Trip Route' }} />
    <Stack.Screen name="BundleDetail" component={BundleDetailScreen} options={{ title: 'Bundle Details' }} />
  </Stack.Navigator>
);

// Maintenance Stack
const MaintenanceStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="MaintenanceList" component={MaintenanceListScreen} options={{ title: 'Maintenance' }} />
    <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen} options={{ title: 'Maintenance Details' }} />
    <Stack.Screen name="AddMaintenance" component={AddMaintenanceScreen} options={{ title: 'Add Maintenance' }} />
  </Stack.Navigator>
);

// Fuel Stack
const FuelStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="FuelList" component={FuelListScreen} options={{ title: 'Fuel Transactions' }} />
    <Stack.Screen name="FuelDetail" component={FuelDetailScreen} options={{ title: 'Fuel Details' }} />
    <Stack.Screen name="AddFuel" component={AddFuelScreen} options={{ title: 'Add Fuel Entry' }} />
  </Stack.Navigator>
);

// More Stack (Documents, Profile, etc.)
const MoreStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    <Stack.Screen name="Documents" component={DocumentListScreen} options={{ title: 'Documents' }} />
    <Stack.Screen name="AddDocument" component={AddDocumentScreen} options={{ title: 'Add Document' }} />
    <Stack.Screen name="EditDocument" component={EditDocumentScreen} options={{ title: 'Edit Document' }} />
  </Stack.Navigator>
);

// SOR Stack
const SORStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="SORList" component={SORListScreen} options={{ title: 'SOR Assignments' }} />
    <Stack.Screen name="SORDetail" component={SORDetailScreen} options={{ title: 'SOR Details' }} />
    <Stack.Screen name="CreateSOR" component={CreateSORScreen} options={{ title: 'Create SOR' }} />
    <Stack.Screen name="CreateBundleSOR" component={CreateBundleSORScreen} options={{ title: 'Create Bundle SOR' }} />
    <Stack.Screen name="BundleList" component={BundleListScreen} options={{ title: 'SOR Bundles' }} />
    <Stack.Screen name="BundleDetail" component={BundleDetailScreen} options={{ title: 'Bundle Details' }} />
  </Stack.Navigator>
);

// My Vehicle Stack (for Personal Vehicle Staff)
const MyVehicleStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="MyVehicleList" component={MyVehicleScreen} options={{ title: 'My Vehicles' }} />
    <Stack.Screen name="MyVehicleDetail" component={MyVehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
  </Stack.Navigator>
);

// Reimbursement Stack (for Personal Vehicle Staff)
const ReimbursementStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="ReimbursementHome" component={ReimbursementScreen} options={{ title: 'Reimbursement' }} />
  </Stack.Navigator>
);

const MainNavigator = () => {
  const { isDriver, isPersonalVehicleStaff, isSORTeam, isSORHead, isSORUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [pendingSORCount, setPendingSORCount] = useState(0);
  
  // Fetch pending SOR count for badge
  const fetchPendingSORCount = useCallback(async () => {
    if (isDriver || isSORUser) {
      try {
        const response = isSORUser 
          ? await sorApi.getAll({ status: 'pending' })
          : await sorApi.getPending();
        // Response is already the data array or object with results
        const data = response?.results || response || [];
        const count = Array.isArray(data) ? data.length : 0;
        setPendingSORCount(count);
      } catch (error) {
        console.log('Error fetching pending SOR count:', error);
      }
    }
  }, [isDriver, isSORUser]);
  
  // Fetch on mount and when navigator is focused
  useEffect(() => {
    fetchPendingSORCount();
  }, [fetchPendingSORCount]);
  
  // Refresh count periodically (every 30 seconds)
  useEffect(() => {
    if (isDriver || isSORUser) {
      const interval = setInterval(fetchPendingSORCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isDriver, isSORUser, fetchPendingSORCount]);
  
  // Listen for SOR update events
  useEffect(() => {
    const unsubscribe = sorEvents.on(SOR_EVENTS.SOR_UPDATED, () => {
      fetchPendingSORCount();
    });
    return () => unsubscribe();
  }, [fetchPendingSORCount]);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Vehicles':
              iconName = focused ? 'car' : 'car-outline';
              break;
            case 'MyVehicle':
              iconName = focused ? 'car-sport' : 'car-sport-outline';
              break;
            case 'Trips':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Fuel':
              iconName = focused ? 'water' : 'water-outline';
              break;
            case 'Reimbursement':
              iconName = focused ? 'cash' : 'cash-outline';
              break;
            case 'SOR':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'More':
              iconName = focused ? 'menu' : 'menu-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 5) : 5,
          paddingTop: 5,
          height: 60 + (Platform.OS === 'android' ? Math.max(insets.bottom, 0) : 0),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      {/* SOR users only see Dashboard, SOR, and More tabs */}
      {isSORUser ? (
        <Tab.Screen 
          name="SOR" 
          component={SORStack} 
          options={{
            tabBarBadge: pendingSORCount > 0 ? pendingSORCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: colors.error,
              fontSize: 11,
              fontWeight: 'bold',
            },
          }}
        />
      ) : (
        <>
          {isPersonalVehicleStaff ? (
            <Tab.Screen name="MyVehicle" component={MyVehicleStack} options={{ title: 'My Vehicle' }} />
          ) : (
            <Tab.Screen name="Vehicles" component={VehiclesStack} />
          )}
          <Tab.Screen name="Trips" component={TripsStack} />
          {isDriver && (
            <Tab.Screen 
              name="SOR" 
              component={SORStack} 
              options={{
                tabBarBadge: pendingSORCount > 0 ? pendingSORCount : undefined,
                tabBarBadgeStyle: {
                  backgroundColor: colors.error,
                  fontSize: 11,
                  fontWeight: 'bold',
                },
              }}
            />
          )}
          {isPersonalVehicleStaff && (
            <Tab.Screen name="Reimbursement" component={ReimbursementStack} />
          )}
          {!isDriver && !isPersonalVehicleStaff && <Tab.Screen name="Fuel" component={FuelStack} />}
        </>
      )}
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
};

export default MainNavigator;

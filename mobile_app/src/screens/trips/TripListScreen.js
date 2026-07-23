import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { tripApi } from '../../api/tripApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';

const TripListScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('my_trips');

  const tabs = [
    { key: 'my_trips', label: 'My Trips' },
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'all', label: 'All Trips' },
  ];

  const fetchTrips = useCallback(async () => {
    try {
      let response;
      if (activeTab === 'my_trips') {
        response = await tripApi.getMyTrips();
      } else if (activeTab === 'ongoing') {
        response = await tripApi.getOngoing();
      } else {
        response = await tripApi.getAll();
      }
      setTrips(response.results || response || []);
    } catch (error) {
      console.log('Error fetching trips:', error);
      // Sample data for demo
      setTrips([
        {
          id: 1,
          vehicle: { license_plate: 'TN01AB1234', make: 'Toyota', model: 'Innova' },
          driver: { first_name: 'John', last_name: 'Doe' },
          origin: 'Chennai Office',
          destination: 'Bangalore',
          status: 'ongoing',
          start_time: new Date().toISOString(),
          purpose: 'Client Meeting',
          start_odometer: 45000,
        },
        {
          id: 2,
          vehicle: { license_plate: 'TN02CD5678', make: 'Maruti', model: 'Swift' },
          driver: { first_name: 'John', last_name: 'Doe' },
          origin: 'Home',
          destination: 'Office',
          status: 'completed',
          start_time: '2024-01-10T09:00:00Z',
          end_time: '2024-01-10T10:30:00Z',
          purpose: 'Daily Commute',
          start_odometer: 23000,
          end_odometer: 23045,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchTrips();
  }, [fetchTrips]);

  // Auto-refresh when screen comes into focus (e.g. after starting a trip)
  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [fetchTrips])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTrip = ({ item }) => (
    <Card
      style={styles.tripCard}
      onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripVehicle}>
            {item.vehicle?.license_plate}
          </Text>
          <Text style={styles.tripVehicleModel}>
            {item.vehicle?.make} {item.vehicle?.model}
          </Text>
        </View>
        <StatusBadge status={item.status} type="trip" />
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeIconContainer}>
          <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
          <View style={styles.routeLine} />
          <View style={[styles.routeDot, { backgroundColor: colors.danger }]} />
        </View>
        <View style={styles.routeDetails}>
          <Text style={styles.routeText} numberOfLines={1}>{item.origin}</Text>
          <Text style={styles.routeText} numberOfLines={1}>
            {item.destination || 'In Progress...'}
          </Text>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <View style={styles.tripMeta}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{formatDate(item.start_time)}</Text>
        </View>
        {item.purpose && (
          <View style={styles.tripMeta}>
            <Ionicons name="flag-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>{item.purpose}</Text>
          </View>
        )}
      </View>

      {item.status === 'ongoing' && (
        <Button
          title="End Trip"
          variant="outline"
          size="small"
          onPress={() => navigation.navigate('EndTrip', { tripId: item.id })}
          style={styles.endTripButton}
        />
      )}
    </Card>
  );

  if (loading) {
    return <LoadingScreen message="Loading trips..." />;
  }

  return (
    <View style={styles.container}>
      {/* Start Trip FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('StartTrip')}
      >
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trip List */}
      <FlatList
        data={trips}
        renderItem={renderTrip}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="map-outline"
            title="No Trips Found"
            message="Start a new trip to see it here"
            actionText="Start Trip"
            onAction={() => navigation.navigate('StartTrip')}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: `${colors.primary}15`,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  tripCard: {
    marginBottom: 12,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripInfo: {},
  tripVehicle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  tripVehicleModel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  routeIconContainer: {
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 4,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  routeDetails: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  routeText: {
    fontSize: 14,
    color: colors.text,
  },
  tripFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  endTripButton: {
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default TripListScreen;

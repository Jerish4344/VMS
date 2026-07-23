import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tripApi } from '../../api/tripApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingScreen from '../../components/LoadingScreen';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

const TripDetailScreen = ({ route, navigation }) => {
  const { tripId } = route.params;
  const { isDriver, isPersonalVehicleStaff } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trip, setTrip] = useState(null);

  const fetchTrip = async () => {
    try {
      const response = await tripApi.getById(tripId);
      setTrip(response);
    } catch (error) {
      console.log('Error fetching trip:', error);
      // Sample data for demo
      setTrip({
        id: tripId,
        vehicle: { license_plate: 'TN01AB1234', make: 'Toyota', model: 'Innova' },
        driver: { first_name: 'John', last_name: 'Doe' },
        origin: 'Chennai Office',
        destination: 'Bangalore',
        status: 'ongoing',
        start_time: new Date().toISOString(),
        purpose: 'Client Meeting',
        start_odometer: 45000,
        notes: 'Important client presentation',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrip();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingScreen message="Loading trip details..." />;
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <Text>Trip not found</Text>
      </View>
    );
  }

  const DetailRow = ({ icon, label, value }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailLabel}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <Text style={styles.valueText}>{value || 'N/A'}</Text>
    </View>
  );

  const distance = trip.end_odometer && trip.start_odometer 
    ? trip.end_odometer - trip.start_odometer 
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Status Header */}
      <Card style={styles.headerCard}>
        <View style={styles.statusHeader}>
          <StatusBadge status={trip.status} type="trip" />
          <Text style={styles.tripId}>Trip #{trip.id}</Text>
        </View>
      </Card>

      {/* Route Card */}
      <Card style={styles.routeCard}>
        <View style={styles.routeContainer}>
          <View style={styles.routeIconContainer}>
            <View style={styles.originIcon}>
              <Ionicons name="location" size={20} color={colors.success} />
            </View>
            <View style={styles.routeLine} />
            <View style={styles.destIcon}>
              <Ionicons name="flag" size={20} color={colors.danger} />
            </View>
          </View>
          <View style={styles.routeDetails}>
            <View style={styles.routePoint}>
              <Text style={styles.routeLabel}>Origin</Text>
              <Text style={styles.routeValue}>{trip.origin}</Text>
            </View>
            <View style={styles.routePoint}>
              <Text style={styles.routeLabel}>Destination</Text>
              <Text style={styles.routeValue}>
                {trip.destination || 'In Progress...'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Vehicle Details */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle</Text>
        <DetailRow 
          icon="car-outline" 
          label="License Plate" 
          value={trip.vehicle?.license_plate} 
        />
        <DetailRow 
          icon="information-circle-outline" 
          label="Model" 
          value={`${trip.vehicle?.make} ${trip.vehicle?.model}`} 
        />
      </Card>

      {/* Trip Details */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Details</Text>
        <DetailRow 
          icon="person-outline" 
          label="Driver" 
          value={`${trip.driver?.first_name} ${trip.driver?.last_name}`} 
        />
        <DetailRow icon="flag-outline" label="Purpose" value={trip.purpose} />
        <DetailRow icon="time-outline" label="Start Time" value={formatDate(trip.start_time)} />
        {trip.end_time && (
          <DetailRow icon="time-outline" label="End Time" value={formatDate(trip.end_time)} />
        )}
      </Card>

      {/* Odometer Details */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Odometer</Text>
        <DetailRow 
          icon="speedometer-outline" 
          label="Start" 
          value={`${trip.start_odometer?.toLocaleString()} km`} 
        />
        {trip.end_odometer && (
          <>
            <DetailRow 
              icon="speedometer-outline" 
              label="End" 
              value={`${trip.end_odometer?.toLocaleString()} km`} 
            />
            <DetailRow 
              icon="navigate-outline" 
              label="Distance" 
              value={`${distance?.toLocaleString()} km`} 
            />
          </>
        )}
      </Card>

      {/* Notes */}
      {trip.notes && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{trip.notes}</Text>
        </Card>
      )}

      {/* View Route Map Button - shows for completed trips or trips with GPS data, hidden for drivers and personal vehicle staff */}
      {(trip.status === 'completed' || trip.status === 'ongoing') && !isDriver && !isPersonalVehicleStaff && (
        <Button
          title="  View Route Map"
          variant="outline"
          icon={<Ionicons name="map-outline" size={18} color={colors.primary} />}
          onPress={() => navigation.navigate('TripMap', { 
            tripId: trip.id,
            tripInfo: {
              origin: trip.origin,
              destination: trip.destination,
            }
          })}
          style={styles.mapButton}
        />
      )}

      {/* Actions */}
      {trip.status === 'ongoing' && (
        <View style={styles.actionsContainer}>
          {trip.is_bundle_trip && trip.bundle_id ? (
            <Button
              title="Open SOR Bundle"
              icon="albums"
              onPress={() =>
                navigation.navigate('BundleDetail', { bundleId: trip.bundle_id })
              }
              style={styles.actionButton}
            />
          ) : (
            <Button
              title="End Trip"
              onPress={() => navigation.navigate('EndTrip', { tripId: trip.id })}
              style={styles.actionButton}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripId: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  routeCard: {
    marginBottom: 16,
  },
  routeContainer: {
    flexDirection: 'row',
  },
  routeIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  originIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  routeDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  routePoint: {
    paddingVertical: 4,
  },
  routeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  routeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    maxWidth: '50%',
    textAlign: 'right',
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  mapButton: {
    marginBottom: 16,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});

export default TripDetailScreen;

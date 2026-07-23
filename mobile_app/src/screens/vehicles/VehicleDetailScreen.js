import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vehicleApi } from '../../api/vehicleApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingScreen from '../../components/LoadingScreen';
import Button from '../../components/Button';

const VehicleDetailScreen = ({ route, navigation }) => {
  const { vehicleId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicle, setVehicle] = useState(null);

  const fetchVehicle = async () => {
    try {
      const response = await vehicleApi.getById(vehicleId);
      setVehicle(response);
    } catch (error) {
      console.log('Error fetching vehicle:', error);
      // Sample data for demo
      setVehicle({
        id: vehicleId,
        license_plate: 'TN01AB1234',
        make: 'Toyota',
        model: 'Innova',
        year: 2022,
        status: 'available',
        vehicle_type: { name: 'SUV' },
        color: 'White',
        fuel_type: 'Diesel',
        seating_capacity: 7,
        current_odometer: 45200,
        vin: 'MALA851CSNG123456',
        insurance_expiry_date: '2025-06-15',
        fitness_expiry: '2025-03-20',
        owner_name: 'Company Fleet',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, [vehicleId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicle();
  };

  if (loading) {
    return <LoadingScreen message="Loading vehicle details..." />;
  }

  if (!vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Text>Vehicle not found</Text>
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Vehicle Header */}
      <Card style={styles.headerCard}>
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleIcon}>
            <Ionicons name="car" size={40} color={colors.primary} />
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.licensePlate}>{vehicle.license_plate}</Text>
            <Text style={styles.vehicleModel}>
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </Text>
            <StatusBadge status={vehicle.status} type="vehicle" />
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      {vehicle.status === 'available' && (
        <View style={styles.actionsContainer}>
          <Button
            title="Start Trip"
            onPress={() => navigation.navigate('Trips', { 
              screen: 'StartTrip',
              initial: false,
              params: { vehicleId: vehicle.id }
            })}
            icon={<Ionicons name="play-circle" size={20} color={colors.textOnPrimary} />}
            style={styles.actionButton}
          />
        </View>
      )}

      {/* Basic Information */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <DetailRow icon="pricetag-outline" label="Type" value={vehicle.vehicle_type?.name} />
        <DetailRow icon="color-palette-outline" label="Color" value={vehicle.color} />
        <DetailRow icon="water-outline" label="Fuel Type" value={vehicle.fuel_type} />
        <DetailRow icon="people-outline" label="Seating" value={`${vehicle.seating_capacity} seats`} />
        <DetailRow icon="speedometer-outline" label="Odometer" value={`${vehicle.current_odometer?.toLocaleString()} km`} />
      </Card>

      {/* Registration Details */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Registration Details</Text>
        <DetailRow icon="card-outline" label="VIN" value={vehicle.vin} />
        <DetailRow icon="person-outline" label="Owner" value={vehicle.owner_name} />
      </Card>

      {/* Document Status */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Document Status</Text>
        <DetailRow 
          icon="shield-checkmark-outline" 
          label="Insurance Expiry" 
          value={vehicle.insurance_expiry_date} 
        />
        <DetailRow 
          icon="document-text-outline" 
          label="Fitness Expiry" 
          value={vehicle.fitness_expiry} 
        />
        <DetailRow 
          icon="leaf-outline" 
          label="Pollution Cert" 
          value={vehicle.pollution_cert_expiry || 'N/A'} 
        />
      </Card>
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
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
    gap: 4,
  },
  licensePlate: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  vehicleModel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
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
  },
});

export default VehicleDetailScreen;

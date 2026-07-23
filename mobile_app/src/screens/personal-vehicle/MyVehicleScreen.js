import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { personalVehicleApi } from '../../api/personalVehicleApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const MyVehicleScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState([]);

  const fetchVehicles = useCallback(async () => {
    try {
      const data = await personalVehicleApi.getVehicles();
      setVehicles(data || []);
    } catch (error) {
      console.log('Error fetching personal vehicles:', error);
      if (error.response?.status === 403) {
        Alert.alert('Access Denied', 'This feature is only for personal vehicle staff.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [fetchVehicles])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || '0'}`;
  };

  if (loading) {
    return <LoadingScreen message="Loading vehicles..." />;
  }

  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon="car-outline"
        title="No Personal Vehicles"
        message="You don't have any personal vehicles registered. Please contact your administrator."
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>My Personal Vehicles</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{vehicles.length}</Text>
            <Text style={styles.summaryLabel}>Vehicles</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {vehicles.reduce((sum, v) => sum + (v.current_month_trips_count || 0), 0)}
            </Text>
            <Text style={styles.summaryLabel}>Monthly Trips</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {vehicles.reduce((sum, v) => sum + (v.current_month_distance || 0), 0)}
            </Text>
            <Text style={styles.summaryLabel}>KM This Month</Text>
          </View>
        </View>
      </Card>

      {/* Vehicle Cards */}
      {vehicles.map((vehicle) => (
        <TouchableOpacity
          key={vehicle.id}
          onPress={() => navigation.navigate('MyVehicleDetail', { vehicleId: vehicle.id })}
          activeOpacity={0.7}
        >
          <Card style={styles.vehicleCard}>
            {/* Vehicle Header */}
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleImageContainer}>
                {vehicle.image ? (
                  <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
                ) : (
                  <View style={styles.vehicleImagePlaceholder}>
                    <Ionicons name="car" size={32} color={colors.textLight} />
                  </View>
                )}
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.licensePlate}>{vehicle.license_plate}</Text>
                <Text style={styles.vehicleMake}>
                  {vehicle.make} {vehicle.model}
                </Text>
                <View style={styles.statusBadge}>
                  <Ionicons 
                    name={vehicle.ongoing_trips > 0 ? "car" : "checkmark-circle"} 
                    size={12} 
                    color={vehicle.ongoing_trips > 0 ? colors.warning : colors.success} 
                  />
                  <Text style={[
                    styles.statusText, 
                    { color: vehicle.ongoing_trips > 0 ? colors.warning : colors.success }
                  ]}>
                    {vehicle.ongoing_trips > 0 ? 'On Trip' : 'Available'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="speedometer-outline" size={20} color={colors.primary} />
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{vehicle.current_odometer || 0}</Text>
                  <Text style={styles.statLabel}>Odometer (km)</Text>
                </View>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="map-outline" size={20} color={colors.info} />
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{vehicle.current_month_distance || 0}</Text>
                  <Text style={styles.statLabel}>This Month (km)</Text>
                </View>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="cash-outline" size={20} color={colors.success} />
                <View style={styles.statContent}>
                  <Text style={[styles.statValue, styles.reimbursementValue]}>
                    {formatCurrency(vehicle.current_month_reimbursement)}
                  </Text>
                  <Text style={styles.statLabel}>Reimbursement</Text>
                </View>
              </View>
            </View>

            {/* Rate Info */}
            {vehicle.reimbursement_rate_per_km > 0 && (
              <View style={styles.rateInfo}>
                <Ionicons name="pricetag-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.rateText}>
                  Rate: ₹{vehicle.reimbursement_rate_per_km}/km
                </Text>
              </View>
            )}
          </Card>
        </TouchableOpacity>
      ))}

      {/* View Reimbursement Button */}
      <TouchableOpacity
        style={styles.reimbursementButton}
        onPress={() => navigation.navigate('Reimbursement')}
      >
        <Ionicons name="wallet-outline" size={20} color={colors.textOnPrimary} />
        <Text style={styles.reimbursementButtonText}>View Full Reimbursement Details</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
      </TouchableOpacity>
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
    paddingBottom: 32,
  },
  summaryCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.primary,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textOnPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  vehicleCard: {
    marginBottom: 16,
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleImageContainer: {
    marginRight: 12,
  },
  vehicleImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  vehicleImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  licensePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  vehicleMake: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statContent: {
    marginLeft: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  reimbursementValue: {
    color: colors.success,
  },
  rateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  reimbursementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  reimbursementButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textOnPrimary,
    marginHorizontal: 12,
  },
});

export default MyVehicleScreen;

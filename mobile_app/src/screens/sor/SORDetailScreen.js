import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { sorApi } from '../../api/sorApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';
import Button from '../../components/Button';
import { sorEvents, SOR_EVENTS } from '../../utils/eventEmitter';
import { useAuth } from '../../context/AuthContext';
import gpsTrackingService from '../../services/gpsTrackingService';

const SORDetailScreen = () => {
  const { isSORUser, isDriver } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { sorId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sor, setSor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSOR = async () => {
    try {
      const response = await sorApi.getById(sorId);
      setSor(response);
    } catch (error) {
      console.log('Error fetching SOR:', error);
      Alert.alert('Error', 'Failed to load SOR details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSOR();
  }, [sorId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSOR();
  };

  const handleAccept = () => {
    Alert.alert(
      'Accept SOR',
      'Are you sure you want to accept this SOR? A trip will be started automatically.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setActionLoading(true);
            try {
              const response = await sorApi.accept(sorId);
              sorEvents.emit(SOR_EVENTS.SOR_UPDATED);

              // Start GPS tracking for the created trip
              const tripId = response?.trip_id || response?.data?.trip_id;
              if (tripId) {
                try {
                  await gpsTrackingService.startTracking(tripId);
                  console.log('GPS tracking started for SOR trip:', tripId);
                } catch (gpsError) {
                  console.log('GPS tracking start error for SOR trip:', gpsError);
                }
              }

              Alert.alert('Success', 'SOR accepted and trip started!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              // Backend now returns 409 if this SOR is part of a bundle.
              const data = error?.response?.data;
              if (error?.response?.status === 409 && data?.bundle_id) {
                Alert.alert(
                  'Bundle SOR',
                  'This SOR is part of a bundle. Open the bundle to accept all stops together.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Open Bundle',
                      onPress: () =>
                        navigation.navigate('BundleDetail', { bundleId: data.bundle_id }),
                    },
                  ]
                );
              } else {
                Alert.alert('Error', data?.detail || 'Failed to accept SOR');
              }
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject SOR',
      'Are you sure you want to reject this SOR?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await sorApi.reject(sorId);
              sorEvents.emit(SOR_EVENTS.SOR_UPDATED);
              Alert.alert('Success', 'SOR rejected.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to reject SOR');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value) => {
    if (!value) return '₹0';
    return `₹${parseFloat(value).toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'driver_accepted':
        return colors.info;
      case 'in_progress':
        return colors.primary;
      case 'completed':
        return colors.success;
      case 'rejected':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading SOR details..." />;
  }

  if (!sor) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
        <Text style={styles.errorText}>SOR not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: getStatusColor(sor.status) }]}>
        <Ionicons
          name={
            sor.status === 'completed'
              ? 'checkmark-circle'
              : sor.status === 'rejected'
              ? 'close-circle'
              : sor.status === 'in_progress'
              ? 'car'
              : 'time'
          }
          size={24}
          color={colors.white}
        />
        <Text style={styles.statusBannerText}>{sor.status_display}</Text>
      </View>

      {/* Main Info Card */}
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>SOR #{sor.id}</Text>
          <Text style={styles.goodsValue}>{formatCurrency(sor.goods_value)}</Text>
        </View>
        <Text style={styles.subtitle}>Goods Value</Text>
      </Card>

      {/* Route Card */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Route Details</Text>
        
        <View style={styles.routeContainer}>
          <View style={styles.routeIconContainer}>
            <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
            <View style={styles.routeLine} />
            <View style={[styles.routeDot, { backgroundColor: colors.danger }]} />
          </View>
          <View style={styles.routeDetails}>
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>From</Text>
              <Text style={styles.locationText}>{sor.from_location}</Text>
            </View>
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>To</Text>
              <Text style={styles.locationText}>{sor.to_location}</Text>
            </View>
          </View>
        </View>

        {sor.distance_km && (
          <View style={styles.distanceRow}>
            <Ionicons name="speedometer-outline" size={20} color={colors.primary} />
            <Text style={styles.distanceText}>{sor.distance_km} km</Text>
          </View>
        )}
      </Card>

      {/* Vehicle Info */}
      {sor.vehicle && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>License Plate</Text>
              <Text style={styles.infoValue}>{sor.vehicle.license_plate}</Text>
            </View>
          </View>
          {sor.vehicle.make && (
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Vehicle</Text>
                <Text style={styles.infoValue}>{sor.vehicle.make} {sor.vehicle.model}</Text>
              </View>
            </View>
          )}
          {sor.vehicle.rate_per_km && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Rate per KM</Text>
                <Text style={styles.infoValue}>₹{sor.vehicle.rate_per_km}</Text>
              </View>
            </View>
          )}
        </Card>
      )}

      {/* Transport Cost */}
      {(sor.transport_cost || sor.transport_cost_percentage) && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Cost Analysis</Text>
          {sor.transport_cost && (
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Transport Cost</Text>
              <Text style={styles.costValue}>{formatCurrency(sor.transport_cost)}</Text>
            </View>
          )}
          {sor.transport_cost_percentage && (
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Cost Percentage</Text>
              <Text style={styles.costValue}>{sor.transport_cost_percentage.toFixed(2)}%</Text>
            </View>
          )}
        </Card>
      )}

      {/* Additional Info */}
      {(sor.number_of_crates || sor.number_of_sac || sor.description) && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Cargo Details</Text>
          {sor.number_of_crates && (
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Number of Crates</Text>
                <Text style={styles.infoValue}>{sor.number_of_crates}</Text>
              </View>
            </View>
          )}
          {sor.number_of_sac && (
            <View style={styles.infoRow}>
              <Ionicons name="bag-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Number of Sacs</Text>
                <Text style={styles.infoValue}>{sor.number_of_sac}</Text>
              </View>
            </View>
          )}
          {sor.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.descriptionText}>{sor.description}</Text>
            </View>
          )}
        </Card>
      )}

      {/* Timestamps */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>{formatDate(sor.created_at)}</Text>
          </View>
        </View>
        {sor.created_by && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Created By</Text>
              <Text style={styles.infoValue}>
                {sor.created_by.first_name} {sor.created_by.last_name}
              </Text>
            </View>
          </View>
        )}
        {sor.updated_at && (
          <View style={styles.infoRow}>
            <Ionicons name="sync-outline" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>{formatDate(sor.updated_at)}</Text>
            </View>
          </View>
        )}
      </Card>

      {/* Action Buttons - only for drivers */}
      {isDriver && sor.status === 'pending' && !sor.bundle_id && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            disabled={actionLoading}
          >
            <Ionicons name="checkmark-circle" size={24} color={colors.white} />
            <Text style={styles.actionButtonText}>Accept & Start Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
            disabled={actionLoading}
          >
            <Ionicons name="close-circle" size={24} color={colors.white} />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bundle SOR: cannot be single-accepted, send to bundle screen */}
      {isDriver && sor.bundle_id && (
        <View style={styles.viewTripContainer}>
          <Button
            title="Open Bundle"
            icon="albums"
            onPress={() =>
              navigation.navigate('BundleDetail', { bundleId: sor.bundle_id })
            }
          />
        </View>
      )}

      {/* View Trip Button for In Progress / Completed - hidden for SOR users */}
      {sor.trip && !isSORUser && (
        <View style={styles.viewTripContainer}>
          <Button
            title="View Associated Trip"
            icon="arrow-forward"
            onPress={() => navigation.navigate('Trips', {
              screen: 'TripDetail',
              initial: false,
              params: { tripId: sor.trip },
            })}
          />
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
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    marginVertical: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  statusBannerText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  card: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  goodsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  routeContainer: {
    flexDirection: 'row',
  },
  routeIconContainer: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 4,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: colors.border,
  },
  routeDetails: {
    flex: 1,
  },
  locationItem: {
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    marginTop: 2,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  costLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  viewTripContainer: {
    margin: 16,
    marginTop: 24,
  },
});

export default SORDetailScreen;

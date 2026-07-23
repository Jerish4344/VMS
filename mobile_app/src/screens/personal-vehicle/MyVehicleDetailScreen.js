import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { personalVehicleApi } from '../../api/personalVehicleApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';

const MyVehicleDetailScreen = () => {
  const route = useRoute();
  const { vehicleId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedOdometer, setEditedOdometer] = useState('');
  const [editedNotes, setEditedNotes] = useState('');

  const fetchVehicle = useCallback(async () => {
    try {
      const data = await personalVehicleApi.getVehicleDetail(vehicleId);
      setVehicle(data);
      setEditedOdometer(String(data.current_odometer || ''));
      setEditedNotes(data.notes || '');
    } catch (error) {
      console.log('Error fetching vehicle:', error);
      Alert.alert('Error', 'Failed to load vehicle details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vehicleId]);

  useFocusEffect(
    useCallback(() => {
      fetchVehicle();
    }, [fetchVehicle])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicle();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        current_odometer: parseInt(editedOdometer) || 0,
        notes: editedNotes,
      };
      await personalVehicleApi.updateVehicle(vehicleId, updateData);
      Alert.alert('Success', 'Vehicle updated successfully');
      setEditing(false);
      fetchVehicle();
    } catch (error) {
      Alert.alert('Error', 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <LoadingScreen message="Loading vehicle..." />;
  }

  if (!vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>Vehicle not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Vehicle Image & Info */}
      <Card style={styles.headerCard}>
        {vehicle.image ? (
          <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
        ) : (
          <View style={styles.vehicleImagePlaceholder}>
            <Ionicons name="car" size={64} color={colors.textLight} />
          </View>
        )}
        <Text style={styles.licensePlate}>{vehicle.license_plate}</Text>
        <Text style={styles.vehicleMake}>{vehicle.make} {vehicle.model}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{vehicle.vehicle_type_name || 'Personal Vehicle'}</Text>
        </View>
      </Card>

      {/* This Month Stats */}
      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>This Month's Performance</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="car-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{vehicle.current_month_trips_count || 0}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="speedometer-outline" size={24} color={colors.info} />
            <Text style={styles.statValue}>{vehicle.current_month_distance || 0}</Text>
            <Text style={styles.statLabel}>KM Traveled</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxHighlight]}>
            <Ionicons name="cash-outline" size={24} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.success }]}>
              {formatCurrency(vehicle.current_month_reimbursement)}
            </Text>
            <Text style={styles.statLabel}>Reimbursement</Text>
          </View>
        </View>
        {vehicle.reimbursement_rate_per_km > 0 && (
          <View style={styles.rateRow}>
            <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.rateText}>
              Rate: ₹{vehicle.reimbursement_rate_per_km} per km
            </Text>
          </View>
        )}
      </Card>

      {/* Vehicle Details */}
      <Card style={styles.detailsCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Trips</Text>
          <Text style={styles.detailValue}>{vehicle.total_trips || 0}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ongoing Trips</Text>
          <Text style={styles.detailValue}>{vehicle.ongoing_trips || 0}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fuel Type</Text>
          <Text style={styles.detailValue}>{vehicle.fuel_type || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Year</Text>
          <Text style={styles.detailValue}>{vehicle.year || 'N/A'}</Text>
        </View>

        {editing ? (
          <>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Current Odometer (km)</Text>
              <TextInput
                style={styles.editInput}
                value={editedOdometer}
                onChangeText={setEditedOdometer}
                keyboardType="numeric"
                placeholder="Enter odometer reading"
              />
            </View>
            
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Notes</Text>
              <TextInput
                style={[styles.editInput, styles.editTextArea]}
                value={editedNotes}
                onChangeText={setEditedNotes}
                multiline
                numberOfLines={3}
                placeholder="Add notes about your vehicle..."
              />
            </View>
            
            <View style={styles.editButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setEditing(false);
                  setEditedOdometer(String(vehicle.current_odometer || ''));
                  setEditedNotes(vehicle.notes || '');
                }}
                style={styles.cancelButton}
              />
              <Button
                title="Save"
                onPress={handleSave}
                loading={saving}
                style={styles.saveButton}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Odometer</Text>
              <Text style={styles.detailValue}>{vehicle.current_odometer || 0} km</Text>
            </View>
            
            {vehicle.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.notesText}>{vehicle.notes}</Text>
              </View>
            )}
          </>
        )}
      </Card>

      {/* Recent Trips */}
      {vehicle.recent_trips && vehicle.recent_trips.length > 0 && (
        <Card style={styles.tripsCard}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          {vehicle.recent_trips.map((trip, index) => (
            <View key={trip.id || index} style={styles.tripItem}>
              <View style={styles.tripIcon}>
                <Ionicons name="navigate" size={18} color={colors.primary} />
              </View>
              <View style={styles.tripContent}>
                <Text style={styles.tripRoute} numberOfLines={1}>
                  {trip.origin} → {trip.destination}
                </Text>
                <Text style={styles.tripMeta}>
                  {formatDate(trip.start_time)} • {trip.distance_traveled || 0} km
                </Text>
              </View>
            </View>
          ))}
        </Card>
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
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  headerCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  vehicleImage: {
    width: 150,
    height: 100,
    borderRadius: 12,
    marginBottom: 16,
  },
  vehicleImagePlaceholder: {
    width: 150,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  licensePlate: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  vehicleMake: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  typeBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  statsCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statBoxHighlight: {
    backgroundColor: colors.success + '10',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rateText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  detailsCard: {
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
    lineHeight: 20,
  },
  editField: {
    marginTop: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  tripsCard: {
    padding: 16,
    marginBottom: 16,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tripIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tripContent: {
    flex: 1,
  },
  tripRoute: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  tripMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default MyVehicleDetailScreen;

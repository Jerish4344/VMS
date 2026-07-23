import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { tripApi } from '../../api/tripApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import gpsTrackingService from '../../services/gpsTrackingService';

const EndTripScreen = ({ route, navigation }) => {
  const { tripId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [trip, setTrip] = useState(null);
  const [formData, setFormData] = useState({
    destination: '',
    end_odometer: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [gettingLocation, setGettingLocation] = useState(false);
  const [odometerImage, setOdometerImage] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStartOdo, setVerifyStartOdo] = useState('');
  const [verifyEndOdo, setVerifyEndOdo] = useState('');

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      const response = await tripApi.getById(tripId);
      setTrip(response);

      // If this trip is a SOR Bundle trip, the driver must complete each
      // bundled SOR from the Bundle screen instead of using End Trip here.
      if (response?.is_bundle_trip && response?.bundle_id) {
        Alert.alert(
          'Bundle Trip',
          'This is a SOR Bundle trip. Complete each stop from the bundle screen — the trip will close automatically.',
          [
            {
              text: 'Open Bundle',
              onPress: () =>
                navigation.replace('BundleDetail', { bundleId: response.bundle_id }),
            },
            { text: 'Back', style: 'cancel', onPress: () => navigation.goBack() },
          ],
          { cancelable: false }
        );
        return;
      }

      // Prefill destination if already set (e.g., from SOR to_location)
      if (response.destination) {
        setFormData(prev => ({
          ...prev,
          destination: response.destination,
        }));
      }
    } catch (error) {
      console.log('Error fetching trip:', error);
      // Sample data
      setTrip({
        id: tripId,
        vehicle: { license_plate: 'TN01AB1234', make: 'Toyota', model: 'Innova' },
        origin: 'Chennai Office',
        start_odometer: 45000,
        purpose: 'Client Meeting',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const locationString = [
          address.street,
          address.city,
          address.region,
        ].filter(Boolean).join(', ');
        
        setFormData(prev => ({ ...prev, destination: locationString }));
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get location. Please enter manually.');
    } finally {
      setGettingLocation(false);
    }
  };

  const takeOdometerPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take odometer photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.4,
      });

      if (!result.canceled && result.assets[0]) {
        setOdometerImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not take photo. Please try again.');
    }
  };

  const pickOdometerImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.4,
      });

      if (!result.canceled && result.assets[0]) {
        setOdometerImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not select photo. Please try again.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Odometer Photo',
      'Take a photo or select from gallery',
      [
        { text: 'Camera', onPress: takeOdometerPhoto },
        { text: 'Gallery', onPress: pickOdometerImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeOdometerImage = () => {
    setOdometerImage(null);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    if (!formData.end_odometer) {
      newErrors.end_odometer = 'End odometer is required';
    } else {
      const endOdo = parseInt(formData.end_odometer);
      if (isNaN(endOdo)) {
        newErrors.end_odometer = 'Must be a valid number';
      } else if (trip && endOdo <= trip.start_odometer) {
        newErrors.end_odometer = `Must be greater than ${trip.start_odometer} km`;
      }
    }
    
    if (!odometerImage) {
      newErrors.odometer_image = 'Odometer photo is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    // Open ODO verification modal before submitting
    setVerifyStartOdo(String(trip?.start_odometer || ''));
    setVerifyEndOdo(formData.end_odometer);
    setShowVerifyModal(true);
  };

  const verifiedDistance =
    verifyStartOdo && verifyEndOdo
      ? parseInt(verifyEndOdo) - parseInt(verifyStartOdo)
      : null;
  const verifyValid =
    verifyStartOdo && verifyEndOdo &&
    !isNaN(parseInt(verifyStartOdo)) &&
    !isNaN(parseInt(verifyEndOdo)) &&
    parseInt(verifyEndOdo) > parseInt(verifyStartOdo);

  const confirmEndTrip = async () => {
    setShowVerifyModal(false);
    setSubmitting(true);
    try {
      // Stop GPS tracking first
      if (gpsTrackingService.isTrackingActive() && gpsTrackingService.getCurrentTripId() === tripId) {
        try {
          await gpsTrackingService.stopTracking();
          console.log('GPS tracking stopped for trip:', tripId);
        } catch (gpsError) {
          console.log('GPS tracking stop error:', gpsError);
        }
      }

      const endData = {
        destination: formData.destination,
        end_odometer: parseInt(verifyEndOdo),
        start_odometer: parseInt(verifyStartOdo),
        notes: formData.notes,
      };

      await tripApi.endTrip(tripId, endData);

      if (odometerImage) {
        tripApi.uploadOdometerImage(tripId, odometerImage, 'end')
          .then(() => console.log('End odometer image uploaded successfully'))
          .catch((err) => console.log('End odometer image upload failed:', err.message));
      }

      Alert.alert('Success', 'Trip ended successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('TripList') },
      ]);
    } catch (error) {
      const data = error?.response?.data;
      if (error?.response?.status === 403 && data?.bundle_id) {
        Alert.alert(
          'Bundle Trip',
          'This trip belongs to a SOR Bundle. Complete each stop from the bundle screen.',
          [
            {
              text: 'Open Bundle',
              onPress: () =>
                navigation.replace('BundleDetail', { bundleId: data.bundle_id }),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Error', data?.detail || 'Failed to end trip');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading trip details..." />;
  }

  const estimatedDistance = formData.end_odometer && trip?.start_odometer
    ? Math.max(0, parseInt(formData.end_odometer) - trip.start_odometer)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Trip Summary */}
      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Trip Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Vehicle:</Text>
          <Text style={styles.summaryValue}>
            {trip?.vehicle?.license_plate} - {trip?.vehicle?.make} {trip?.vehicle?.model}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Origin:</Text>
          <Text style={styles.summaryValue}>{trip?.origin}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Purpose:</Text>
          <Text style={styles.summaryValue}>{trip?.purpose}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Start Odometer:</Text>
          <Text style={styles.summaryValue}>{trip?.start_odometer?.toLocaleString()} km</Text>
        </View>
      </Card>

      {/* End Trip Form */}
      <Text style={styles.sectionTitle}>End Trip Details</Text>
      
      <View style={styles.destinationContainer}>
        <View style={styles.destinationInput}>
          <Input
            label="Destination"
            value={formData.destination}
            onChangeText={(text) => setFormData({ ...formData, destination: text })}
            placeholder="Enter destination"
            icon="flag-outline"
            error={errors.destination}
          />
        </View>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={getCurrentLocation}
          disabled={gettingLocation}
        >
          <Ionicons 
            name="navigate" 
            size={24} 
            color={gettingLocation ? colors.textLight : colors.primary} 
          />
        </TouchableOpacity>
      </View>

      <Input
        label="End Odometer (km)"
        value={formData.end_odometer}
        onChangeText={(text) => setFormData({ ...formData, end_odometer: text })}
        placeholder={`Enter odometer (must be > ${trip?.start_odometer})`}
        icon="speedometer-outline"
        keyboardType="numeric"
        error={errors.end_odometer}
      />

      {estimatedDistance > 0 && (
        <Card style={styles.distanceCard}>
          <View style={styles.distanceContent}>
            <Ionicons name="navigate-outline" size={24} color={colors.primary} />
            <View>
              <Text style={styles.distanceLabel}>Estimated Distance</Text>
              <Text style={styles.distanceValue}>{estimatedDistance.toLocaleString()} km</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Odometer Photo Capture */}
      <View style={styles.photoSection}>
        <Text style={styles.photoLabel}>
          End Odometer Photo <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.photoHint}>
          Take a photo of the odometer for verification
        </Text>
        
        {odometerImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: odometerImage.uri }} 
              style={styles.imagePreview} 
            />
            <View style={styles.imageActions}>
              <TouchableOpacity 
                style={styles.retakeButton}
                onPress={showImagePickerOptions}
              >
                <Ionicons name="camera" size={20} color={colors.primary} />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={removeOdometerImage}
              >
                <Ionicons name="trash" size={20} color={colors.error} />
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.photoButton, errors.odometer_image && styles.photoButtonError]}
            onPress={showImagePickerOptions}
          >
            <Ionicons name="camera" size={32} color={colors.primary} />
            <Text style={styles.photoButtonText}>Capture Odometer</Text>
          </TouchableOpacity>
        )}
        {errors.odometer_image && (
          <Text style={styles.errorText}>{errors.odometer_image}</Text>
        )}
      </View>

      <Input
        label="Notes (Optional)"
        value={formData.notes}
        onChangeText={(text) => setFormData({ ...formData, notes: text })}
        placeholder="Add any notes about this trip"
        icon="document-text-outline"
        multiline
        numberOfLines={3}
      />

      <Button
        title="End Trip"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
        style={styles.submitButton}
        size="large"
      />

      {/* ODO Verification Modal */}
      <Modal
        visible={showVerifyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Ionicons name="speedometer" size={22} color="#856404" />
              <Text style={styles.modalTitle}>Verify Odometer Readings</Text>
            </View>

            <Text style={styles.modalHint}>
              Check the values below. Correct them if wrong — this updates the vehicle's record.
            </Text>

            {/* Start ODO */}
            <View style={styles.odoRow}>
              <View style={styles.odoField}>
                <Text style={styles.odoLabel}>
                  <Ionicons name="play-circle" size={14} color="#28a745" /> Start Odometer (km)
                </Text>
                <TextInput
                  style={styles.odoInput}
                  value={verifyStartOdo}
                  onChangeText={setVerifyStartOdo}
                  keyboardType="numeric"
                  placeholder="Start reading"
                />
                <Text style={styles.odoHint}>
                  Recorded: <Text style={{ color: '#28a745', fontWeight: '700' }}>{trip?.start_odometer?.toLocaleString()} km</Text>
                </Text>
              </View>

              <View style={styles.odoField}>
                <Text style={styles.odoLabel}>
                  <Ionicons name="stop-circle" size={14} color="#dc3545" /> End Odometer (km)
                </Text>
                <TextInput
                  style={styles.odoInput}
                  value={verifyEndOdo}
                  onChangeText={setVerifyEndOdo}
                  keyboardType="numeric"
                  placeholder="Current reading"
                />
                <Text style={styles.odoHint}>Current odometer reading</Text>
              </View>
            </View>

            {/* Distance breakdown */}
            {verifyValid ? (
              <View style={styles.distBreakdown}>
                <View style={styles.distBreakdownItem}>
                  <Text style={styles.distBreakdownLabel}>START ODO</Text>
                  <Text style={[styles.distBreakdownValue, { color: '#28a745' }]}>{parseInt(verifyStartOdo).toLocaleString()}</Text>
                  <Text style={styles.distBreakdownUnit}>km</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#6c757d" />
                <View style={styles.distBreakdownItem}>
                  <Text style={styles.distBreakdownLabel}>END ODO</Text>
                  <Text style={[styles.distBreakdownValue, { color: '#dc3545' }]}>{parseInt(verifyEndOdo).toLocaleString()}</Text>
                  <Text style={styles.distBreakdownUnit}>km</Text>
                </View>
                <Text style={{ fontSize: 18, color: '#6c757d' }}>=</Text>
                <View style={styles.distBreakdownItem}>
                  <Text style={styles.distBreakdownLabel}>TOTAL KMS</Text>
                  <Text style={[styles.distBreakdownValue, { color: '#0d6efd', fontSize: 22 }]}>{verifiedDistance.toLocaleString()}</Text>
                  <Text style={styles.distBreakdownUnit}>km</Text>
                </View>
              </View>
            ) : (
              verifyStartOdo && verifyEndOdo ? (
                <View style={styles.distError}>
                  <Ionicons name="alert-circle" size={16} color="#dc3545" />
                  <Text style={styles.distErrorText}>
                    End odometer must be greater than start odometer.
                  </Text>
                </View>
              ) : null
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBackBtn}
                onPress={() => setShowVerifyModal(false)}
              >
                <Ionicons name="arrow-back" size={18} color="#6c757d" />
                <Text style={styles.modalBackBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, !verifyValid && styles.modalConfirmBtnDisabled]}
                onPress={confirmEndTrip}
                disabled={!verifyValid}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.modalConfirmBtnText}>Confirm &amp; End Trip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  summaryCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  destinationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  destinationInput: {
    flex: 1,
  },
  locationButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    borderRadius: 8,
    marginLeft: 8,
    marginBottom: 16,
  },
  distanceCard: {
    backgroundColor: `${colors.primary}08`,
    marginBottom: 16,
  },
  distanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  distanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  submitButton: {
    marginTop: 24,
  },
  photoSection: {
    marginBottom: 16,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  required: {
    color: colors.error,
  },
  photoHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  photoButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}08`,
  },
  photoButtonError: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}08`,
  },
  photoButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  imagePreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    padding: 12,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: `${colors.primary}15`,
  },
  retakeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: `${colors.error}15`,
  },
  removeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  // ODO Verification Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
  },
  modalHint: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 18,
  },
  odoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  odoField: {
    flex: 1,
  },
  odoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  odoInput: {
    borderWidth: 1.5,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
  },
  odoHint: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 4,
  },
  distBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  distBreakdownItem: {
    alignItems: 'center',
  },
  distBreakdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6c757d',
    letterSpacing: 0.5,
  },
  distBreakdownValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  distBreakdownUnit: {
    fontSize: 10,
    color: '#6c757d',
  },
  distError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  distErrorText: {
    fontSize: 13,
    color: '#dc3545',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalBackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  modalBackBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6c757d',
  },
  modalConfirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#dc3545',
  },
  modalConfirmBtnDisabled: {
    backgroundColor: '#f5c6cb',
  },
  modalConfirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default EndTripScreen;

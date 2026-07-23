import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { vehicleApi } from '../../api/vehicleApi';
import { tripApi } from '../../api/tripApi';
import { colors } from '../../constants/colors';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import SearchableDropdown from '../../components/SearchableDropdown';
import { useAuth } from '../../context/AuthContext';
import gpsTrackingService from '../../services/gpsTrackingService';

const StartTripScreen = ({ route, navigation }) => {
  const preselectedVehicleId = route?.params?.vehicleId;
  const { isPersonalVehicleStaff } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    origin: '',
    purpose: '',
    start_odometer: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [gettingLocation, setGettingLocation] = useState(false);
  const [odometerImage, setOdometerImage] = useState(null);
  const [hasOngoingTrip, setHasOngoingTrip] = useState(false);
  const [ongoingTripInfo, setOngoingTripInfo] = useState(null);
  const [checkingTrips, setCheckingTrips] = useState(true);

  useEffect(() => {
    fetchVehicles();
    checkExistingTrips();
  }, []);

  // Auto-redirect to active trip when detected
  useEffect(() => {
    if (!checkingTrips && hasOngoingTrip && ongoingTripInfo) {
      Alert.alert(
        'Active Trip Exists',
        `You already have an ongoing trip with vehicle ${ongoingTripInfo.vehicle?.license_plate || 'N/A'}. Please end it before starting a new one.`,
        [
          {
            text: 'View Active Trip',
            onPress: () => navigation.replace('TripDetail', { tripId: ongoingTripInfo.id }),
          },
          {
            text: 'Go Back',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );
    }
  }, [checkingTrips, hasOngoingTrip, ongoingTripInfo]);

  const checkExistingTrips = async () => {
    setCheckingTrips(true);
    try {
      const ongoingTrips = await tripApi.checkOngoingTrips();
      if (ongoingTrips.length > 0) {
        setHasOngoingTrip(true);
        setOngoingTripInfo(ongoingTrips[0]);
      }
    } catch (error) {
      console.log('Error checking ongoing trips:', error);
    } finally {
      setCheckingTrips(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await vehicleApi.getAvailable();
      const availableVehicles = response.results || response || [];
      setVehicles(availableVehicles);
      
      if (preselectedVehicleId) {
        const preselected = availableVehicles.find(v => v.id === preselectedVehicleId);
        if (preselected) {
          setSelectedVehicle(preselected);
          setFormData(prev => ({
            ...prev,
            start_odometer: preselected.current_odometer?.toString() || '',
          }));
        }
      }
    } catch (error) {
      console.log('Error fetching vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get your current location.');
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
        
        setFormData(prev => ({ ...prev, origin: locationString }));
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get current location. Please enter manually.');
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
    
    if (!selectedVehicle) {
      newErrors.vehicle = 'Please select a vehicle';
    }
    if (!formData.origin.trim()) {
      newErrors.origin = 'Origin is required';
    }
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    if (!formData.start_odometer) {
      newErrors.start_odometer = 'Start odometer is required';
    } else if (isNaN(Number(formData.start_odometer))) {
      newErrors.start_odometer = 'Must be a valid number';
    }
    
    if (!odometerImage) {
      newErrors.odometer_image = 'Odometer photo is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Step 0: Check GPS permissions FIRST before creating the trip
      const permissionResult = await gpsTrackingService.requestPermissions();
      if (!permissionResult.granted) {
        if (permissionResult.backgroundDenied) {
          // Background permission was denied - show settings prompt and block trip creation
          Alert.alert(
            'Background Location Required',
            'Trip tracking requires "Allow all the time" location permission to track your route when the phone is locked or app is closed.\n\nPlease go to Settings and select "Allow all the time" for location, then try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => Linking.openSettings()
              },
            ]
          );
        } else {
          Alert.alert('Location Permission Required', permissionResult.message || 'Please enable location permissions to start a trip.');
        }
        setSubmitting(false);
        return; // Block trip creation
      }

      // Double-check for ongoing trips before starting
      try {
        const ongoingTrips = await tripApi.checkOngoingTrips();
        if (ongoingTrips.length > 0) {
          const existingTrip = ongoingTrips[0];
          Alert.alert(
            'Active Trip Exists',
            `You already have an ongoing trip (${existingTrip.vehicle?.license_plate || 'Unknown Vehicle'}). Please end it before starting a new one.`
          );
          setSubmitting(false);
          return;
        }
      } catch (checkError) {
        console.log('Error checking ongoing trips:', checkError);
      }

      const tripData = {
        vehicle: selectedVehicle.id,
        origin: formData.origin,
        purpose: formData.purpose,
        start_odometer: parseInt(formData.start_odometer),
        notes: formData.notes,
      };

      // Step 1: Start trip WITHOUT image - instant response
      const response = await tripApi.startTrip(tripData);
      const tripId = response?.id || response?.data?.id;
      
      // Step 2: Upload image in background (don't wait for it)
      if (odometerImage && tripId) {
        // Fire and forget - upload happens in background
        tripApi.uploadOdometerImage(tripId, odometerImage, 'start')
          .then(() => console.log('Odometer image uploaded successfully'))
          .catch((err) => console.log('Odometer image upload failed, will retry:', err.message));
      }
      
      // Step 3: Start GPS tracking (permissions already verified)
      if (tripId) {
        try {
          await gpsTrackingService.startTracking(tripId);
          console.log('GPS tracking started for trip:', tripId);
        } catch (gpsError) {
          console.log('GPS tracking start error:', gpsError);
        }
      }
      
      Alert.alert('Success', 'Trip started successfully!', [
        { text: 'OK', onPress: () => {
          if (tripId) {
            navigation.replace('TripDetail', { tripId });
          } else {
            navigation.goBack();
          }
        }},
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to start trip');
    } finally {
      setSubmitting(false);
    }
  };

  const selectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData(prev => ({
      ...prev,
      start_odometer: vehicle?.current_odometer?.toString() || '',
    }));
    setErrors(prev => ({ ...prev, vehicle: null }));
  };

  const renderVehicleItem = (vehicle, isSelected) => (
    <View style={styles.vehicleItemContent}>
      <View style={styles.vehicleItemLeft}>
        <Ionicons 
          name="car" 
          size={24} 
          color={isSelected ? colors.primary : colors.textSecondary} 
        />
        <View style={styles.vehicleItemInfo}>
          <Text style={[
            styles.vehicleItemPlate,
            isSelected && styles.vehicleItemPlateSelected,
          ]}>
            {vehicle.license_plate}
          </Text>
          <Text style={styles.vehicleItemModel}>
            {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
          </Text>
        </View>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      )}
    </View>
  );

  if (loading || checkingTrips) {
    return <LoadingScreen message={checkingTrips ? "Checking for active trips..." : "Loading available vehicles..."} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Warning banner if user already has an ongoing trip */}
      {hasOngoingTrip && ongoingTripInfo && (
        <View style={styles.ongoingTripWarning}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={22} color="#856404" />
            <Text style={styles.warningTitle}>Active Trip Exists</Text>
          </View>
          <Text style={styles.warningText}>
            You already have an ongoing trip with vehicle{' '}
            <Text style={{ fontWeight: '700' }}>
              {ongoingTripInfo.vehicle?.license_plate || 'N/A'}
            </Text>
            . Please end it before starting a new one.
          </Text>
          <TouchableOpacity
            style={styles.viewTripButton}
            onPress={() => navigation.navigate('TripDetail', { tripId: ongoingTripInfo.id })}
          >
            <Text style={styles.viewTripButtonText}>View Active Trip</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Vehicle Selection with Searchable Dropdown */}
      <SearchableDropdown
        label="Select Vehicle"
        data={vehicles}
        selectedItem={selectedVehicle}
        onSelect={selectVehicle}
        placeholder="Tap to select a vehicle"
        searchPlaceholder="Search by plate, make, or model..."
        searchKeys={['license_plate', 'make', 'model']}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderVehicleItem}
        displayValue={(item) => `${item.license_plate} - ${item.make} ${item.model}`}
        error={errors.vehicle}
      />
      
      {/* Selected Vehicle Info */}
      {selectedVehicle && (
        <View style={styles.selectedVehicleCard}>
          <View style={styles.selectedVehicleHeader}>
            <Ionicons name="car" size={28} color={colors.primary} />
            <View style={styles.selectedVehicleInfo}>
              <Text style={styles.selectedVehiclePlate}>{selectedVehicle.license_plate}</Text>
              <Text style={styles.selectedVehicleModel}>
                {selectedVehicle.make} {selectedVehicle.model}
              </Text>
            </View>
          </View>
          {selectedVehicle.current_odometer && (
            <View style={styles.odometerInfo}>
              <Ionicons name="speedometer-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.odometerText}>
                Current: {selectedVehicle.current_odometer.toLocaleString()} km
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Trip Details Form */}
      <Text style={styles.sectionTitle}>Trip Details</Text>
      
      <View style={styles.originContainer}>
        <View style={styles.originInput}>
          <Input
            label="Origin"
            value={formData.origin}
            onChangeText={(text) => setFormData({ ...formData, origin: text })}
            placeholder="Enter starting location"
            icon="location-outline"
            error={errors.origin}
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
        label="Purpose"
        value={formData.purpose}
        onChangeText={(text) => setFormData({ ...formData, purpose: text })}
        placeholder="Enter trip purpose"
        icon="flag-outline"
        error={errors.purpose}
      />

      <Input
        label="Start Odometer (km)"
        value={formData.start_odometer}
        onChangeText={(text) => setFormData({ ...formData, start_odometer: text })}
        placeholder="Enter current odometer reading"
        icon="speedometer-outline"
        keyboardType="numeric"
        error={errors.start_odometer}
      />

      {/* Odometer Photo Capture */}
      <View style={styles.photoSection}>
        <Text style={styles.photoLabel}>
          Odometer Photo <Text style={styles.required}>*</Text>
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
        placeholder="Add any notes for this trip"
        icon="document-text-outline"
        multiline
        numberOfLines={3}
      />

      <Button
        title={hasOngoingTrip ? "Trip Already Active" : "Start Trip"}
        onPress={handleSubmit}
        loading={submitting}
        disabled={!selectedVehicle || submitting || hasOngoingTrip}
        style={styles.submitButton}
        size="large"
      />
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
  ongoingTripWarning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#856404',
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 19,
  },
  viewTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  viewTripButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  vehicleItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  vehicleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  vehicleItemPlate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  vehicleItemPlateSelected: {
    color: colors.primary,
  },
  vehicleItemModel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedVehicleCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    borderLeftWidth: 4,
  },
  selectedVehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedVehicleInfo: {
    marginLeft: 12,
  },
  selectedVehiclePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  selectedVehicleModel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  odometerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  odometerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  originContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  originInput: {
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
});

export default StartTripScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { vehicleApi } from '../../api/vehicleApi';
import { fuelApi } from '../../api/fuelApi';
import { colors } from '../../constants/colors';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';

const AddFuelScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [receiptImage, setReceiptImage] = useState(null);
  const [formData, setFormData] = useState({
    fuel_type: 'Diesel',
    quantity: '',
    cost_per_liter: '',
    odometer_reading: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const fuelTypes = ['Diesel', 'Petrol', 'CNG', 'Electric'];

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    try {
      const response = await vehicleApi.getAll();
      setVehicles(response.results || response || []);
    } catch (error) {
      setVehicles([
        { id: 1, license_plate: 'TN01AB1234', make: 'Toyota', model: 'Innova', current_odometer: 45200, fuel_type: 'Diesel' },
        { id: 2, license_plate: 'TN02CD5678', make: 'Maruti', model: 'Swift', current_odometer: 23000, fuel_type: 'Petrol' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setReceiptImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled) setReceiptImage(result.assets[0].uri);
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedVehicle) newErrors.vehicle = 'Please select a vehicle';
    if (!formData.quantity) newErrors.quantity = 'Quantity is required';
    if (!formData.cost_per_liter) newErrors.cost_per_liter = 'Cost per liter is required';
    if (!formData.odometer_reading) newErrors.odometer_reading = 'Odometer reading is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fuelData = {
        vehicle: selectedVehicle.id,
        fuel_type: formData.fuel_type,
        quantity: parseFloat(formData.quantity),
        cost_per_liter: parseFloat(formData.cost_per_liter),
        total_cost: parseFloat(formData.quantity) * parseFloat(formData.cost_per_liter),
        odometer_reading: parseInt(formData.odometer_reading),
        notes: formData.notes,
        date: new Date().toISOString().split('T')[0],
      };
      await fuelApi.createWithImage(fuelData, receiptImage);
      Alert.alert('Success', 'Fuel entry added successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add fuel entry');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCost = formData.quantity && formData.cost_per_liter
    ? (parseFloat(formData.quantity) * parseFloat(formData.cost_per_liter)).toFixed(2)
    : '0.00';

  if (loading) return <LoadingScreen message="Loading..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Select Vehicle</Text>
      {errors.vehicle && <Text style={styles.errorText}>{errors.vehicle}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[styles.vehicleCard, selectedVehicle?.id === vehicle.id && styles.vehicleCardActive]}
            onPress={() => {
              setSelectedVehicle(vehicle);
              setFormData(prev => ({
                ...prev,
                odometer_reading: vehicle.current_odometer?.toString() || '',
                fuel_type: vehicle.fuel_type || 'Diesel',
              }));
            }}
          >
            <Ionicons name="car" size={24} color={selectedVehicle?.id === vehicle.id ? colors.primary : colors.textSecondary} />
            <Text style={[styles.vehiclePlate, selectedVehicle?.id === vehicle.id && styles.vehiclePlateActive]}>
              {vehicle.license_plate}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Fuel Type</Text>
      <View style={styles.typeContainer}>
        {fuelTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeButton, formData.fuel_type === type && styles.typeButtonActive]}
            onPress={() => setFormData({ ...formData, fuel_type: type })}
          >
            <Text style={[styles.typeText, formData.fuel_type === type && styles.typeTextActive]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Details</Text>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Input label="Quantity (L)" value={formData.quantity} onChangeText={(t) => setFormData({ ...formData, quantity: t })} keyboardType="numeric" error={errors.quantity} />
        </View>
        <View style={styles.halfInput}>
          <Input label="Rate (₹/L)" value={formData.cost_per_liter} onChangeText={(t) => setFormData({ ...formData, cost_per_liter: t })} keyboardType="numeric" error={errors.cost_per_liter} />
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Cost</Text>
        <Text style={styles.totalValue}>₹{totalCost}</Text>
      </View>

      <Input label="Odometer (km)" value={formData.odometer_reading} onChangeText={(t) => setFormData({ ...formData, odometer_reading: t })} keyboardType="numeric" error={errors.odometer_reading} />
      <Input label="Notes (Optional)" value={formData.notes} onChangeText={(t) => setFormData({ ...formData, notes: t })} multiline numberOfLines={2} />

      <Text style={styles.sectionTitle}>Receipt (Optional)</Text>
      <View style={styles.imageButtons}>
        <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
          <Ionicons name="camera" size={24} color={colors.primary} />
          <Text style={styles.imageButtonText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Ionicons name="image" size={24} color={colors.primary} />
          <Text style={styles.imageButtonText}>Gallery</Text>
        </TouchableOpacity>
      </View>
      {receiptImage && <Image source={{ uri: receiptImage }} style={styles.receiptPreview} />}

      <Button title="Add Fuel Entry" onPress={handleSubmit} loading={submitting} style={styles.submitButton} size="large" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12, marginTop: 16 },
  errorText: { color: colors.danger, fontSize: 12, marginBottom: 8 },
  horizontalScroll: { marginBottom: 8 },
  vehicleCard: { width: 100, padding: 12, backgroundColor: colors.surface, borderRadius: 12, marginRight: 12, alignItems: 'center', borderWidth: 2, borderColor: colors.border },
  vehicleCardActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}08` },
  vehiclePlate: { fontSize: 11, fontWeight: '600', color: colors.text, marginTop: 8, textAlign: 'center' },
  vehiclePlateActive: { color: colors.primary },
  typeContainer: { flexDirection: 'row', gap: 8 },
  typeButton: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  typeButtonActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
  typeText: { fontSize: 14, color: colors.textSecondary },
  typeTextActive: { color: colors.primary, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  totalCard: { backgroundColor: `${colors.success}15`, padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  totalLabel: { fontSize: 14, color: colors.textSecondary },
  totalValue: { fontSize: 28, fontWeight: '700', color: colors.success },
  imageButtons: { flexDirection: 'row', gap: 12 },
  imageButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  imageButtonText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  receiptPreview: { width: '100%', height: 200, borderRadius: 12, marginTop: 12 },
  submitButton: { marginTop: 24 },
});

export default AddFuelScreen;

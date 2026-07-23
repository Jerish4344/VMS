import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vehicleApi } from '../../api/vehicleApi';
import { maintenanceApi } from '../../api/maintenanceApi';
import { colors } from '../../constants/colors';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';

const AddMaintenanceScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    odometer_reading: '',
    scheduled_date: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesRes, typesRes] = await Promise.all([
        vehicleApi.getAll(),
        maintenanceApi.getTypes(),
      ]);
      setVehicles(vehiclesRes.results || vehiclesRes || []);
      setMaintenanceTypes(typesRes.results || typesRes || []);
    } catch (error) {
      setVehicles([
        { id: 1, license_plate: 'TN01AB1234', make: 'Toyota', model: 'Innova', current_odometer: 45200 },
        { id: 2, license_plate: 'TN02CD5678', make: 'Maruti', model: 'Swift', current_odometer: 23000 },
      ]);
      setMaintenanceTypes([
        { id: 1, name: 'Oil Change' },
        { id: 2, name: 'Tire Rotation' },
        { id: 3, name: 'Brake Service' },
        { id: 4, name: 'General Service' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedVehicle) newErrors.vehicle = 'Please select a vehicle';
    if (!selectedType) newErrors.type = 'Please select maintenance type';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.odometer_reading) newErrors.odometer_reading = 'Odometer reading is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await maintenanceApi.create({
        vehicle: selectedVehicle.id,
        maintenance_type: selectedType.id,
        description: formData.description,
        odometer_reading: parseInt(formData.odometer_reading),
        scheduled_date: formData.scheduled_date || new Date().toISOString().split('T')[0],
      });
      Alert.alert('Success', 'Maintenance scheduled successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule maintenance');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Select Vehicle</Text>
      {errors.vehicle && <Text style={styles.errorText}>{errors.vehicle}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[styles.selectCard, selectedVehicle?.id === vehicle.id && styles.selectCardActive]}
            onPress={() => {
              setSelectedVehicle(vehicle);
              setFormData(prev => ({ ...prev, odometer_reading: vehicle.current_odometer?.toString() || '' }));
            }}
          >
            <Ionicons name="car" size={24} color={selectedVehicle?.id === vehicle.id ? colors.primary : colors.textSecondary} />
            <Text style={[styles.selectText, selectedVehicle?.id === vehicle.id && styles.selectTextActive]}>
              {vehicle.license_plate}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Maintenance Type</Text>
      {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
      <View style={styles.typeGrid}>
        {maintenanceTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.typeCard, selectedType?.id === type.id && styles.typeCardActive]}
            onPress={() => setSelectedType(type)}
          >
            <Text style={[styles.typeText, selectedType?.id === type.id && styles.typeTextActive]}>
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Details</Text>
      <Input
        label="Description"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        placeholder="Describe the maintenance needed"
        multiline
        numberOfLines={3}
        error={errors.description}
      />
      <Input
        label="Odometer Reading (km)"
        value={formData.odometer_reading}
        onChangeText={(text) => setFormData({ ...formData, odometer_reading: text })}
        placeholder="Current odometer"
        keyboardType="numeric"
        error={errors.odometer_reading}
      />

      <Button
        title="Schedule Maintenance"
        onPress={handleSubmit}
        loading={submitting}
        style={styles.submitButton}
        size="large"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12, marginTop: 16 },
  errorText: { color: colors.danger, fontSize: 12, marginBottom: 8 },
  horizontalScroll: { marginBottom: 8 },
  selectCard: {
    width: 100, padding: 12, backgroundColor: colors.surface, borderRadius: 12, marginRight: 12,
    alignItems: 'center', borderWidth: 2, borderColor: colors.border,
  },
  selectCardActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}08` },
  selectText: { fontSize: 12, fontWeight: '600', color: colors.text, marginTop: 8 },
  selectTextActive: { color: colors.primary },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCard: {
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.surface,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
  },
  typeCardActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
  typeText: { fontSize: 14, color: colors.textSecondary },
  typeTextActive: { color: colors.primary, fontWeight: '500' },
  submitButton: { marginTop: 24 },
});

export default AddMaintenanceScreen;

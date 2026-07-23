import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { sorApi } from '../../api/sorApi';
import { colors, shadows } from '../../constants/colors';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import { sorEvents, SOR_EVENTS } from '../../utils/eventEmitter';

const CreateSORScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [locations, setLocations] = useState([]);

  const [formData, setFormData] = useState({
    goods_value: '',
    from_location: '',
    to_location: '',
    vehicle: null,
    driver: null,
    number_of_crates: '',
    number_of_sac: '',
    description: '',
  });

  // For custom location entry
  const [fromCustom, setFromCustom] = useState('');
  const [toCustom, setToCustom] = useState('');
  const [fromIsOther, setFromIsOther] = useState(false);
  const [toIsOther, setToIsOther] = useState(false);

  // Picker modals
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [showDriverPicker, setShowDriverPicker] = useState(false);

  // Search filters for pickers
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');

  useEffect(() => {
    fetchFormOptions();
  }, []);

  const fetchFormOptions = async () => {
    try {
      const options = await sorApi.getFormOptions();
      setVehicles(options.vehicles || []);
      setDrivers(options.drivers || []);
      setLocations(options.locations || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load form options. Please try again.');
      console.log('Form options error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedVehicle = () => vehicles.find(v => v.id === formData.vehicle);
  const getSelectedDriver = () => drivers.find(d => d.id === formData.driver);

  const validate = () => {
    const finalFrom = fromIsOther ? fromCustom.trim() : formData.from_location;
    const finalTo = toIsOther ? toCustom.trim() : formData.to_location;

    if (!formData.goods_value || parseFloat(formData.goods_value) <= 0) {
      Alert.alert('Validation', 'Please enter a valid goods value.');
      return false;
    }
    if (!finalFrom) {
      Alert.alert('Validation', 'Please select or enter a From location.');
      return false;
    }
    if (!finalTo) {
      Alert.alert('Validation', 'Please select or enter a To location.');
      return false;
    }
    if (!formData.vehicle) {
      Alert.alert('Validation', 'Please select a vehicle.');
      return false;
    }
    if (!formData.driver) {
      Alert.alert('Validation', 'Please select a driver.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const finalFrom = fromIsOther ? fromCustom.trim() : formData.from_location;
    const finalTo = toIsOther ? toCustom.trim() : formData.to_location;

    const payload = {
      goods_value: parseFloat(formData.goods_value),
      from_location: finalFrom,
      to_location: finalTo,
      vehicle: formData.vehicle,
      driver: formData.driver,
    };

    if (formData.number_of_crates) payload.number_of_crates = parseInt(formData.number_of_crates);
    if (formData.number_of_sac) payload.number_of_sac = parseInt(formData.number_of_sac);
    if (formData.description.trim()) payload.description = formData.description.trim();

    setSubmitting(true);
    try {
      const result = await sorApi.create(payload);
      Alert.alert('Success', `SOR #${result.id} created and driver notified.`, [
        { text: 'OK', onPress: () => {
          sorEvents.emit(SOR_EVENTS.SOR_UPDATED);
          navigation.goBack();
        }},
      ]);
    } catch (error) {
      const errData = error.response?.data;
      let msg = 'Failed to create SOR.';
      if (errData) {
        if (typeof errData === 'string') msg = errData;
        else if (errData.detail) msg = errData.detail;
        else {
          // Collect field errors
          const fieldErrors = Object.entries(errData)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join('\n');
          if (fieldErrors) msg = fieldErrors;
        }
      }
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPickerModal = ({ visible, onClose, title, data, onSelect, searchValue, onSearchChange, renderLabel }) => (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        {onSearchChange && (
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchValue}
            onChangeText={onSearchChange}
            placeholderTextColor={colors.textLight}
          />
        )}
        <FlatList
          style={styles.pickerList}
          data={data}
          keyExtractor={(item) => (item.id || item).toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text style={styles.pickerItemText}>{renderLabel(item)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyPickerText}>No options available</Text>
          }
        />
      </View>
    </Modal>
  );

  if (loading) {
    return <LoadingScreen message="Loading form..." />;
  }

  const filteredVehicles = vehicles.filter(v =>
    v.license_plate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    `${v.make} ${v.model}`.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
    d.username.toLowerCase().includes(driverSearch.toLowerCase())
  );

  const locationOptions = [...locations, 'Others'];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Goods Value */}
        <Text style={styles.label}>Goods Value (₹) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter goods value"
          placeholderTextColor={colors.textLight}
          keyboardType="decimal-pad"
          value={formData.goods_value}
          onChangeText={(val) => setFormData({ ...formData, goods_value: val })}
        />

        {/* From Location */}
        <Text style={styles.label}>From Location *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowFromPicker(true)}
        >
          <Text style={formData.from_location ? styles.pickerValue : styles.pickerPlaceholder}>
            {formData.from_location || 'Select from location'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textLight} />
        </TouchableOpacity>
        {fromIsOther && (
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Enter custom location"
            placeholderTextColor={colors.textLight}
            value={fromCustom}
            onChangeText={setFromCustom}
          />
        )}

        {/* To Location */}
        <Text style={styles.label}>To Location *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowToPicker(true)}
        >
          <Text style={formData.to_location ? styles.pickerValue : styles.pickerPlaceholder}>
            {formData.to_location || 'Select to location'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textLight} />
        </TouchableOpacity>
        {toIsOther && (
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Enter custom location"
            placeholderTextColor={colors.textLight}
            value={toCustom}
            onChangeText={setToCustom}
          />
        )}

        {/* Vehicle */}
        <Text style={styles.label}>Vehicle *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => { setVehicleSearch(''); setShowVehiclePicker(true); }}
        >
          <Text style={formData.vehicle ? styles.pickerValue : styles.pickerPlaceholder}>
            {getSelectedVehicle()
              ? `${getSelectedVehicle().license_plate} - ${getSelectedVehicle().make} ${getSelectedVehicle().model}`
              : 'Select vehicle'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textLight} />
        </TouchableOpacity>

        {/* Driver */}
        <Text style={styles.label}>Driver *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => { setDriverSearch(''); setShowDriverPicker(true); }}
        >
          <Text style={formData.driver ? styles.pickerValue : styles.pickerPlaceholder}>
            {getSelectedDriver()
              ? `${getSelectedDriver().name} (${getSelectedDriver().username})`
              : 'Select driver'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textLight} />
        </TouchableOpacity>

        {/* Optional fields */}
        <Text style={styles.sectionTitle}>Optional Details</Text>

        <Text style={styles.label}>Number of Crates</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter number of crates"
          placeholderTextColor={colors.textLight}
          keyboardType="number-pad"
          value={formData.number_of_crates}
          onChangeText={(val) => setFormData({ ...formData, number_of_crates: val })}
        />

        <Text style={styles.label}>Number of Sac</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter number of sac"
          placeholderTextColor={colors.textLight}
          keyboardType="number-pad"
          value={formData.number_of_sac}
          onChangeText={(val) => setFormData({ ...formData, number_of_sac: val })}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe contents (optional)"
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={3}
          value={formData.description}
          onChangeText={(val) => setFormData({ ...formData, description: val })}
        />

        {/* Submit */}
        <Button
          title={submitting ? 'Creating SOR...' : 'Create SOR'}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
        />
      </ScrollView>

      {/* From Location Picker */}
      {renderPickerModal({
        visible: showFromPicker,
        onClose: () => setShowFromPicker(false),
        title: 'Select From Location',
        data: locationOptions,
        onSelect: (item) => {
          if (item === 'Others') {
            setFromIsOther(true);
            setFormData({ ...formData, from_location: 'Others' });
          } else {
            setFromIsOther(false);
            setFromCustom('');
            setFormData({ ...formData, from_location: item });
          }
        },
        renderLabel: (item) => item,
      })}

      {/* To Location Picker */}
      {renderPickerModal({
        visible: showToPicker,
        onClose: () => setShowToPicker(false),
        title: 'Select To Location',
        data: locationOptions,
        onSelect: (item) => {
          if (item === 'Others') {
            setToIsOther(true);
            setFormData({ ...formData, to_location: 'Others' });
          } else {
            setToIsOther(false);
            setToCustom('');
            setFormData({ ...formData, to_location: item });
          }
        },
        renderLabel: (item) => item,
      })}

      {/* Vehicle Picker */}
      {renderPickerModal({
        visible: showVehiclePicker,
        onClose: () => setShowVehiclePicker(false),
        title: 'Select Vehicle',
        data: filteredVehicles,
        onSelect: (item) => setFormData({ ...formData, vehicle: item.id }),
        searchValue: vehicleSearch,
        onSearchChange: setVehicleSearch,
        renderLabel: (item) => `${item.license_plate} - ${item.make} ${item.model}`,
      })}

      {/* Driver Picker */}
      {renderPickerModal({
        visible: showDriverPicker,
        onClose: () => setShowDriverPicker(false),
        title: 'Select Driver',
        data: filteredDrivers,
        onSelect: (item) => setFormData({ ...formData, driver: item.id }),
        searchValue: driverSearch,
        onSearchChange: setDriverSearch,
        renderLabel: (item) => `${item.name} (${item.username})`,
      })}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerValue: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  pickerPlaceholder: {
    fontSize: 15,
    color: colors.textLight,
    flex: 1,
  },
  submitButton: {
    marginTop: 28,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  searchInput: {
    marginHorizontal: 12,
    marginVertical: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  pickerList: {
    flex: 1,
    backgroundColor: colors.white,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    fontSize: 15,
    color: colors.text,
  },
  emptyPickerText: {
    textAlign: 'center',
    color: colors.textSecondary,
    padding: 20,
    fontSize: 14,
  },
});

export default CreateSORScreen;

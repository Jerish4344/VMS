import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/colors';
import { documentApi } from '../../api/documentApi';
import apiClient from '../../api/axios';
import { API_ENDPOINTS } from '../../constants/config';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';

// Simple Date Picker Component
const SimpleDatePicker = ({ visible, onClose, onSelect, selectedDate, minDate }) => {
  const [year, setYear] = useState(selectedDate.getFullYear());
  const [month, setMonth] = useState(selectedDate.getMonth());
  const [day, setDay] = useState(selectedDate.getDate());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(year, month);

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 5; y <= currentYear + 10; y++) {
    years.push(y);
  }

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const handleConfirm = () => {
    const newDate = new Date(year, month, day);
    if (minDate && newDate < minDate) {
      Alert.alert('Invalid Date', 'Please select a date after the issue date');
      return;
    }
    onSelect(newDate);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.container}>
          <Text style={pickerStyles.title}>Select Date</Text>
          
          <View style={pickerStyles.pickerRow}>
            {/* Day */}
            <View style={pickerStyles.column}>
              <Text style={pickerStyles.columnLabel}>Day</Text>
              <ScrollView style={pickerStyles.scrollColumn} showsVerticalScrollIndicator={false}>
                {days.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[pickerStyles.option, day === d && pickerStyles.optionSelected]}
                    onPress={() => setDay(d)}
                  >
                    <Text style={[pickerStyles.optionText, day === d && pickerStyles.optionTextSelected]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Month */}
            <View style={[pickerStyles.column, { flex: 1.5 }]}>
              <Text style={pickerStyles.columnLabel}>Month</Text>
              <ScrollView style={pickerStyles.scrollColumn} showsVerticalScrollIndicator={false}>
                {months.map((m, index) => (
                  <TouchableOpacity
                    key={m}
                    style={[pickerStyles.option, month === index && pickerStyles.optionSelected]}
                    onPress={() => setMonth(index)}
                  >
                    <Text style={[pickerStyles.optionText, month === index && pickerStyles.optionTextSelected]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Year */}
            <View style={pickerStyles.column}>
              <Text style={pickerStyles.columnLabel}>Year</Text>
              <ScrollView style={pickerStyles.scrollColumn} showsVerticalScrollIndicator={false}>
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[pickerStyles.option, year === y && pickerStyles.optionSelected]}
                    onPress={() => setYear(y)}
                  >
                    <Text style={[pickerStyles.optionText, year === y && pickerStyles.optionTextSelected]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={pickerStyles.buttonRow}>
            <TouchableOpacity style={pickerStyles.cancelButton} onPress={onClose}>
              <Text style={pickerStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pickerStyles.confirmButton} onPress={handleConfirm}>
              <Text style={pickerStyles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollColumn: {
    maxHeight: 200,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
});

const AddDocumentScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date());
  const [expiryDate, setExpiryDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
  const [notes, setNotes] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch personal vehicles
      const vehiclesResponse = await apiClient.get(API_ENDPOINTS.PERSONAL_VEHICLES);
      setVehicles(vehiclesResponse.data || []);
      
      // Fetch document types
      const typesResponse = await documentApi.getTypes();
      setDocumentTypes(typesResponse.results || typesResponse || []);
    } catch (error) {
      console.log('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocumentFile(result.assets[0]);
      }
    } catch (error) {
      console.log('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocumentFile(result.assets[0]);
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Document Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const displayDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const validateForm = () => {
    if (!selectedVehicle) {
      Alert.alert('Validation Error', 'Please select a vehicle');
      return false;
    }
    if (!selectedType) {
      Alert.alert('Validation Error', 'Please select a document type');
      return false;
    }
    if (!documentNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter the document number');
      return false;
    }
    if (expiryDate <= issueDate) {
      Alert.alert('Validation Error', 'Expiry date must be after issue date');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const documentData = {
        vehicle_id: selectedVehicle.id,
        document_type_id: selectedType.id,
        document_number: documentNumber.trim(),
        issue_date: formatDate(issueDate),
        expiry_date: formatDate(expiryDate),
        notes: notes.trim(),
      };

      await documentApi.create(documentData, documentFile);
      
      Alert.alert(
        'Success',
        'Document added successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.log('Error creating document:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add document. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading..." />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle & Document Type</Text>
          
          {/* Vehicle Selector */}
          <Text style={styles.label}>Vehicle *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowVehiclePicker(!showVehiclePicker)}
          >
            <Text style={selectedVehicle ? styles.selectorText : styles.selectorPlaceholder}>
              {selectedVehicle ? selectedVehicle.license_plate : 'Select Vehicle'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          {showVehiclePicker && (
            <View style={styles.pickerList}>
              {vehicles.length === 0 ? (
                <Text style={styles.noDataText}>No vehicles found</Text>
              ) : (
                vehicles.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.pickerItem,
                      selectedVehicle?.id === vehicle.id && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedVehicle(vehicle);
                      setShowVehiclePicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{vehicle.license_plate}</Text>
                    <Text style={styles.pickerItemSubtext}>{vehicle.make} {vehicle.model}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Document Type Selector */}
          <Text style={styles.label}>Document Type *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowTypePicker(!showTypePicker)}
          >
            <Text style={selectedType ? styles.selectorText : styles.selectorPlaceholder}>
              {selectedType ? selectedType.name : 'Select Document Type'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          {showTypePicker && (
            <View style={styles.pickerList}>
              {documentTypes.length === 0 ? (
                <Text style={styles.noDataText}>No document types found</Text>
              ) : (
                documentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.pickerItem,
                      selectedType?.id === type.id && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedType(type);
                      setShowTypePicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{type.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Document Details</Text>
          
          {/* Document Number */}
          <Text style={styles.label}>Document Number *</Text>
          <TextInput
            style={styles.input}
            value={documentNumber}
            onChangeText={setDocumentNumber}
            placeholder="Enter document number"
            placeholderTextColor={colors.textSecondary}
          />

          {/* Issue Date */}
          <Text style={styles.label}>Issue Date</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowIssueDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.selectorText}>{displayDate(issueDate)}</Text>
          </TouchableOpacity>

          {/* Expiry Date */}
          <Text style={styles.label}>Expiry Date *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowExpiryDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.selectorText}>{displayDate(expiryDate)}</Text>
          </TouchableOpacity>

          {/* Notes */}
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Document Image (Optional)</Text>
          
          {documentFile ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: documentFile.uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setDocumentFile(null)}
              >
                <Ionicons name="close-circle" size={28} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={showImageOptions}>
              <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
              <Text style={styles.uploadText}>Tap to add document image</Text>
              <Text style={styles.uploadSubtext}>Take a photo or choose from gallery</Text>
            </TouchableOpacity>
          )}
        </Card>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Adding...' : 'Add Document'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      <SimpleDatePicker
        visible={showIssueDatePicker}
        onClose={() => setShowIssueDatePicker(false)}
        onSelect={setIssueDate}
        selectedDate={issueDate}
      />
      <SimpleDatePicker
        visible={showExpiryDatePicker}
        onClose={() => setShowExpiryDatePicker(false)}
        onSelect={setExpiryDate}
        selectedDate={expiryDate}
        minDate={issueDate}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  selectorPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
  },
  pickerList: {
    marginTop: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    maxHeight: 200,
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pickerItemSelected: {
    backgroundColor: `${colors.primary}15`,
  },
  pickerItemText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  pickerItemSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noDataText: {
    padding: 16,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  uploadText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default AddDocumentScreen;

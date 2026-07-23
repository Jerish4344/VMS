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

const EditDocumentScreen = ({ navigation, route }) => {
  const { document } = route.params;
  
  const [submitting, setSubmitting] = useState(false);
  const [documentNumber, setDocumentNumber] = useState(document.document_number || '');
  const [issueDate, setIssueDate] = useState(new Date(document.issue_date));
  const [expiryDate, setExpiryDate] = useState(new Date(document.expiry_date));
  const [notes, setNotes] = useState(document.notes || '');
  const [documentFile, setDocumentFile] = useState(null);
  const [existingFile, setExistingFile] = useState(document.file);
  
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocumentFile(result.assets[0]);
        setExistingFile(null);
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
        setExistingFile(null);
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Update Document Image',
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
        document_number: documentNumber.trim(),
        issue_date: formatDate(issueDate),
        expiry_date: formatDate(expiryDate),
        notes: notes.trim(),
      };

      await documentApi.update(document.id, documentData, documentFile);
      
      Alert.alert(
        'Success',
        'Document updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.log('Error updating document:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update document. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Document Info (Read-only) */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Document Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle</Text>
            <Text style={styles.infoValue}>{document.vehicle?.license_plate}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Document Type</Text>
            <Text style={styles.infoValue}>{document.document_type?.name}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Edit Details</Text>
          
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
          <Text style={styles.sectionTitle}>Document Image</Text>
          
          {documentFile ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: documentFile.uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setDocumentFile(null);
                  setExistingFile(document.file);
                }}
              >
                <Ionicons name="close-circle" size={28} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : existingFile ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: existingFile }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={showImageOptions}
              >
                <Ionicons name="camera" size={20} color={colors.textOnPrimary} />
                <Text style={styles.changeImageText}>Change</Text>
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
              {submitting ? 'Saving...' : 'Save Changes'}
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
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
  changeImageButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  changeImageText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textOnPrimary,
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

export default EditDocumentScreen;

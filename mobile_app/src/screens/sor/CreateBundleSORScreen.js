import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { sorApi } from '../../api/sorApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import { sorEvents, SOR_EVENTS } from '../../utils/eventEmitter';

const OTHERS = '__OTHERS__';

const blankItem = () => ({
  to_location: '',
  to_is_other: false,
  to_other_text: '',
  goods_value: '',
  number_of_crates: '',
  number_of_sac: '',
  description: '',
});

const CreateBundleSORScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [locations, setLocations] = useState([]);

  const [vehicleId, setVehicleId] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [fromLocation, setFromLocation] = useState('');
  const [fromIsOther, setFromIsOther] = useState(false);
  const [fromOtherText, setFromOtherText] = useState('');
  const [items, setItems] = useState([blankItem()]);

  // Pickers
  const [picker, setPicker] = useState(null); // { type, itemIndex? }
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const opts = await sorApi.getFormOptions();
        setVehicles(opts.vehicles || []);
        setDrivers(opts.drivers || []);
        setLocations(opts.locations || []);
      } catch (e) {
        Alert.alert('Error', 'Failed to load form options.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId),
    [vehicles, vehicleId]
  );
  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === driverId),
    [drivers, driverId]
  );

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, blankItem()]);
  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const openPicker = (type, itemIndex) => {
    setSearch('');
    setPicker({ type, itemIndex });
  };
  const closePicker = () => setPicker(null);

  const handlePickerSelect = (value) => {
    const { type, itemIndex } = picker || {};
    if (type === 'vehicle') setVehicleId(value);
    else if (type === 'driver') setDriverId(value);
    else if (type === 'fromLocation') {
      if (value === OTHERS) {
        setFromIsOther(true);
        setFromLocation('');
      } else {
        setFromIsOther(false);
        setFromLocation(value);
      }
    } else if (type === 'toLocation' && itemIndex != null) {
      if (value === OTHERS) {
        updateItem(itemIndex, { to_is_other: true, to_location: '' });
      } else {
        updateItem(itemIndex, {
          to_is_other: false,
          to_location: value,
          to_other_text: '',
        });
      }
    }
    closePicker();
  };

  const validate = () => {
    if (!vehicleId) return 'Select a vehicle.';
    if (!driverId) return 'Select a driver.';
    const finalFrom = fromIsOther ? fromOtherText.trim() : fromLocation;
    if (!finalFrom) return 'From location is required.';
    if (!items.length) return 'Add at least one drop.';
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const finalTo = it.to_is_other ? it.to_other_text.trim() : it.to_location;
      if (!finalTo) return `Drop #${i + 1}: select a destination.`;
      const gv = Number(it.goods_value);
      if (!it.goods_value || Number.isNaN(gv) || gv <= 0)
        return `Drop #${i + 1}: enter a valid goods value.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation', err);
      return;
    }
    const finalFrom = fromIsOther ? fromOtherText.trim() : fromLocation;
    const payload = {
      vehicle_id: vehicleId,
      driver_id: driverId,
      from_location: finalFrom,
      items: items.map((it) => ({
        to_location: it.to_is_other ? it.to_other_text.trim() : it.to_location,
        goods_value: Number(it.goods_value),
        number_of_crates: it.number_of_crates ? Number(it.number_of_crates) : null,
        number_of_sac: it.number_of_sac ? Number(it.number_of_sac) : null,
        description: it.description.trim() || null,
      })),
    };

    setSubmitting(true);
    try {
      const res = await sorApi.createBundle(payload);
      sorEvents.emit(SOR_EVENTS.SOR_UPDATED);
      Alert.alert(
        'Success',
        res?.detail || 'Bundle created and driver notified.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create bundle.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading form..." />;

  // ----- Picker rendering -----
  const renderPicker = () => {
    if (!picker) return null;
    let data = [];
    let label = '';
    let getLabel = (x) => x;
    let getValue = (x) => x;
    let allowOthers = false;

    if (picker.type === 'vehicle') {
      label = 'Select Vehicle';
      data = vehicles.filter((v) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          v.license_plate.toLowerCase().includes(q) ||
          (v.make || '').toLowerCase().includes(q) ||
          (v.model || '').toLowerCase().includes(q)
        );
      });
      getLabel = (v) => `${v.license_plate} · ${v.make || ''} ${v.model || ''}`.trim();
      getValue = (v) => v.id;
    } else if (picker.type === 'driver') {
      label = 'Select Driver';
      data = drivers.filter((d) =>
        !search ? true : (d.name || d.username).toLowerCase().includes(search.toLowerCase())
      );
      getLabel = (d) => d.name || d.username;
      getValue = (d) => d.id;
    } else {
      label = picker.type === 'fromLocation' ? 'From Location' : 'Destination';
      data = locations.filter((l) =>
        !search ? true : l.toLowerCase().includes(search.toLowerCase())
      );
      allowOthers = true;
    }

    return (
      <Modal visible animationType="slide" transparent onRequestClose={closePicker}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={closePicker}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search..."
              placeholderTextColor={colors.textLight}
            />
            <FlatList
              data={data}
              keyExtractor={(it, idx) =>
                String(typeof it === 'string' ? it + idx : getValue(it))
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => handlePickerSelect(getValue(item))}
                >
                  <Text style={styles.pickerRowText}>{getLabel(item)}</Text>
                </TouchableOpacity>
              )}
              ListFooterComponent={
                allowOthers ? (
                  <TouchableOpacity
                    style={[styles.pickerRow, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => handlePickerSelect(OTHERS)}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                    <Text style={[styles.pickerRowText, { color: colors.primary, marginLeft: 8 }]}>
                      Others (enter manually)
                    </Text>
                  </TouchableOpacity>
                ) : null
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>No matches</Text>
              }
            />
          </View>
        </View>
      </Modal>
    );
  };

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
        {/* Header card: vehicle + driver + from */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Trip Details</Text>

          <Text style={styles.label}>Vehicle *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => openPicker('vehicle')}
          >
            <Ionicons name="car-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.selectText, !selectedVehicle && styles.placeholder]}>
              {selectedVehicle
                ? `${selectedVehicle.license_plate} · ${selectedVehicle.make || ''} ${selectedVehicle.model || ''}`
                : 'Select vehicle'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.label}>Driver *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => openPicker('driver')}
          >
            <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.selectText, !selectedDriver && styles.placeholder]}>
              {selectedDriver ? selectedDriver.name || selectedDriver.username : 'Select driver'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.label}>Pickup (From) *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => openPicker('fromLocation')}
          >
            <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
            <Text
              style={[
                styles.selectText,
                !fromLocation && !fromIsOther && styles.placeholder,
              ]}
            >
              {fromIsOther ? 'Others (enter below)' : fromLocation || 'Select pickup location'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          {fromIsOther && (
            <TextInput
              style={styles.input}
              value={fromOtherText}
              onChangeText={setFromOtherText}
              placeholder="Enter pickup location"
              placeholderTextColor={colors.textLight}
            />
          )}
        </Card>

        {/* Drops */}
        <View style={styles.dropsHeader}>
          <Text style={styles.sectionTitle}>Drops ({items.length})</Text>
          <TouchableOpacity style={styles.addBtn} onPress={addItem}>
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.addBtnText}>Add Drop</Text>
          </TouchableOpacity>
        </View>

        {items.map((it, idx) => (
          <Card key={idx} style={styles.card}>
            <View style={styles.dropHeader}>
              <View style={styles.seqBadge}>
                <Text style={styles.seqBadgeText}>{idx + 1}</Text>
              </View>
              <Text style={styles.dropTitle}>Drop #{idx + 1}</Text>
              {items.length > 1 && (
                <TouchableOpacity onPress={() => removeItem(idx)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>Destination *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => openPicker('toLocation', idx)}
            >
              <Ionicons name="flag-outline" size={18} color={colors.textSecondary} />
              <Text
                style={[
                  styles.selectText,
                  !it.to_location && !it.to_is_other && styles.placeholder,
                ]}
              >
                {it.to_is_other
                  ? 'Others (enter below)'
                  : it.to_location || 'Select destination'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {it.to_is_other && (
              <TextInput
                style={styles.input}
                value={it.to_other_text}
                onChangeText={(t) => updateItem(idx, { to_other_text: t })}
                placeholder="Enter destination"
                placeholderTextColor={colors.textLight}
              />
            )}

            <Text style={styles.label}>Goods Value (₹) *</Text>
            <TextInput
              style={styles.input}
              value={it.goods_value}
              onChangeText={(t) => updateItem(idx, { goods_value: t })}
              keyboardType="numeric"
              placeholder="e.g. 12000"
              placeholderTextColor={colors.textLight}
            />

            <View style={styles.row2}>
              <View style={styles.col}>
                <Text style={styles.label}>Crates</Text>
                <TextInput
                  style={styles.input}
                  value={it.number_of_crates}
                  onChangeText={(t) => updateItem(idx, { number_of_crates: t })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Sacs</Text>
                <TextInput
                  style={styles.input}
                  value={it.number_of_sac}
                  onChangeText={(t) => updateItem(idx, { number_of_sac: t })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textLight}
                />
              </View>
            </View>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={it.description}
              onChangeText={(t) => updateItem(idx, { description: t })}
              placeholder="Optional notes about this drop"
              placeholderTextColor={colors.textLight}
              multiline
            />
          </Card>
        ))}

        <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 32 }}>
          <Button
            title={submitting ? 'Creating…' : `Create Bundle (${items.length} drops)`}
            onPress={handleSubmit}
            disabled={submitting}
          />
        </View>
      </ScrollView>

      {renderPicker()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: 12 },
  card: { marginHorizontal: 16, marginVertical: 6, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  selectText: { flex: 1, marginLeft: 8, color: colors.text, fontSize: 14 },
  placeholder: { color: colors.textLight },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
    marginTop: 6,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', marginHorizontal: -6 },
  col: { flex: 1, paddingHorizontal: 6 },

  dropsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: colors.white, fontWeight: '700', marginLeft: 4 },

  dropHeader: { flexDirection: 'row', alignItems: 'center' },
  seqBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  seqBadgeText: { color: colors.white, fontWeight: '700' },
  dropTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerRowText: { fontSize: 14, color: colors.text },
  emptyText: { textAlign: 'center', color: colors.textSecondary, padding: 16 },
});

export default CreateBundleSORScreen;

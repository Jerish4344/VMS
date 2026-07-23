import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { sorApi } from '../../api/sorApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';
import Button from '../../components/Button';
import { sorEvents, SOR_EVENTS } from '../../utils/eventEmitter';
import gpsTrackingService from '../../services/gpsTrackingService';

const STATUS_COLORS = {
  pending: colors.warning,
  driver_accepted: colors.info,
  in_progress: colors.primary,
  completed: colors.success,
  rejected: colors.danger,
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '₹0';
  return `₹${parseFloat(value).toLocaleString('en-IN')}`;
};

const BundleDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bundleId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bundle, setBundle] = useState(null);
  const [acting, setActing] = useState(false);

  // Complete-SOR modal state
  const [activeSor, setActiveSor] = useState(null);
  const [arrivalOdo, setArrivalOdo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBundle = useCallback(async () => {
    try {
      const data = await sorApi.getBundle(bundleId);
      setBundle(data);
    } catch (error) {
      console.log('Bundle fetch error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load bundle');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bundleId]);

  useEffect(() => {
    fetchBundle();
  }, [fetchBundle]);

  useFocusEffect(
    useCallback(() => {
      fetchBundle();
    }, [fetchBundle])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBundle();
  };

  const handleAcceptBundle = () => {
    Alert.alert(
      'Accept Bundle',
      `Start one trip for ${bundle?.count || 0} drops? You will record arrival odometer at each stop.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setActing(true);
            try {
              const res = await sorApi.acceptBundle(bundleId);
              sorEvents.emit(SOR_EVENTS.SOR_UPDATED);
              const tripId = res?.trip_id;
              if (tripId) {
                try {
                  await gpsTrackingService.startTracking(tripId);
                } catch (e) {
                  console.log('GPS start error:', e);
                }
              }
              setBundle(res?.bundle || null);
              Alert.alert('Success', 'Bundle accepted. Trip started.');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to accept bundle');
            } finally {
              setActing(false);
            }
          },
        },
      ]
    );
  };

  const openCompleteModal = (sor) => {
    setActiveSor(sor);
    setArrivalOdo('');
    setNotes('');
  };

  const closeCompleteModal = () => {
    setActiveSor(null);
    setArrivalOdo('');
    setNotes('');
  };

  const submitComplete = async () => {
    if (!activeSor) return;
    const odoNum = Number(arrivalOdo);
    if (!arrivalOdo || Number.isNaN(odoNum) || odoNum < 0) {
      Alert.alert('Invalid odometer', 'Enter a valid arrival odometer reading.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await sorApi.completeBundleSOR(bundleId, activeSor.id, {
        arrival_odometer: odoNum,
        notes: notes.trim() || undefined,
      });
      sorEvents.emit(SOR_EVENTS.SOR_UPDATED);
      setBundle(res?.bundle || null);
      closeCompleteModal();
      if (res?.trip_closed) {
        try {
          if (
            gpsTrackingService.isTrackingActive() &&
            gpsTrackingService.getCurrentTripId() === bundle?.trip_id
          ) {
            await gpsTrackingService.stopTracking();
          }
        } catch (e) {
          console.log('GPS stop error:', e);
        }
        Alert.alert('Bundle Completed', 'All drops done. Trip closed.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Stop Completed', 'Marked as delivered.');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to mark stop complete');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading bundle..." />;
  }

  if (!bundle) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
        <Text style={styles.errorText}>Bundle not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const completedCount = (bundle.sors || []).filter((s) => s.status === 'completed').length;
  const showAccept = !bundle.any_active && !bundle.all_completed;
  const nextActiveId = bundle.next_active_sor_id;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header card */}
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>SOR Bundle</Text>
            <View style={styles.progressPill}>
              <Text style={styles.progressText}>
                {completedCount}/{bundle.count} done
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            From: {bundle.from_location}
          </Text>
          {bundle.vehicle && (
            <View style={styles.row}>
              <Ionicons name="car-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.rowText}>
                {bundle.vehicle.license_plate} · {bundle.vehicle.make} {bundle.vehicle.model}
              </Text>
            </View>
          )}
          {bundle.trip_id ? (
            <View style={styles.row}>
              <Ionicons name="navigate-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.rowText}>
                Trip #{bundle.trip_id} · {bundle.trip_status || 'unknown'}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Stops list */}
        <Text style={styles.sectionLabel}>Stops</Text>
        {(bundle.sors || []).map((sor, idx) => {
          const color = STATUS_COLORS[sor.status] || colors.textSecondary;
          const isNext = sor.id === nextActiveId;
          return (
            <Card key={sor.id} style={[styles.card, isNext && styles.activeStopCard]}>
              <View style={styles.stopHeader}>
                <View style={[styles.seqBadge, { backgroundColor: color }]}>
                  <Text style={styles.seqBadgeText}>{sor.sequence ?? idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stopTitle} numberOfLines={2}>
                    {sor.location || '—'}
                  </Text>
                  <Text style={styles.stopMeta}>
                    SOR #{sor.id} · {formatCurrency(sor.goods_value)}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: color + '22' }]}>
                  <Text style={[styles.statusPillText, { color }]}>
                    {sor.status_display}
                  </Text>
                </View>
              </View>

              {(sor.number_of_crates || sor.number_of_sac) && (
                <View style={styles.cargoRow}>
                  {sor.number_of_crates ? (
                    <View style={styles.cargoChip}>
                      <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.cargoText}>{sor.number_of_crates} crates</Text>
                    </View>
                  ) : null}
                  {sor.number_of_sac ? (
                    <View style={styles.cargoChip}>
                      <Ionicons name="bag-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.cargoText}>{sor.number_of_sac} sacs</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {sor.start_odometer || sor.end_odometer ? (
                <View style={styles.odoRow}>
                  <Ionicons name="speedometer-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.odoText}>
                    {sor.start_odometer ?? '-'} → {sor.end_odometer ?? '-'}
                    {sor.distance_km ? `  (${sor.distance_km} km)` : ''}
                  </Text>
                </View>
              ) : null}

              {isNext && (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => openCompleteModal(sor)}
                  disabled={acting}
                >
                  <Ionicons name="checkmark-done" size={18} color={colors.white} />
                  <Text style={styles.completeBtnText}>Arrived – Mark Completed</Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        })}

        {showAccept && (
          <View style={styles.acceptWrap}>
            <TouchableOpacity
              style={[styles.acceptBtn, acting && styles.btnDisabled]}
              onPress={handleAcceptBundle}
              disabled={acting}
            >
              <Ionicons name="play-circle" size={22} color={colors.white} />
              <Text style={styles.acceptBtnText}>
                {acting ? 'Starting…' : 'Accept Bundle & Start Trip'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {bundle.all_completed && (
          <Card style={[styles.card, styles.doneCard]}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text style={styles.doneText}>All drops completed</Text>
          </Card>
        )}
      </ScrollView>

      {/* Complete-stop modal */}
      <Modal
        visible={!!activeSor}
        animationType="slide"
        transparent
        onRequestClose={closeCompleteModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              Complete Stop #{activeSor?.sequence}
            </Text>
            <Text style={styles.modalSubtitle} numberOfLines={2}>
              {activeSor?.location}
            </Text>

            <Text style={styles.label}>Arrival Odometer (km)</Text>
            <TextInput
              style={styles.input}
              value={arrivalOdo}
              onChangeText={setArrivalOdo}
              keyboardType="numeric"
              placeholder="e.g. 45230"
              placeholderTextColor={colors.textLight}
            />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything to record about this stop?"
              placeholderTextColor={colors.textLight}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={closeCompleteModal}
                disabled={submitting}
              >
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, submitting && styles.btnDisabled]}
                onPress={submitComplete}
                disabled={submitting}
              >
                <Text style={styles.modalBtnPrimaryText}>
                  {submitting ? 'Saving…' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: 12, paddingBottom: 32 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 18, color: colors.text, marginVertical: 16 },

  card: { marginHorizontal: 16, marginVertical: 6, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rowText: { marginLeft: 8, color: colors.text, fontSize: 14 },

  progressPill: {
    backgroundColor: colors.primary + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: { color: colors.primary, fontSize: 12, fontWeight: '700' },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  activeStopCard: { borderWidth: 1.5, borderColor: colors.primary },

  stopHeader: { flexDirection: 'row', alignItems: 'center' },
  seqBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  seqBadgeText: { color: colors.white, fontWeight: '700' },
  stopTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  stopMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginLeft: 8 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  cargoRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  cargoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  cargoText: { marginLeft: 4, fontSize: 12, color: colors.textSecondary },

  odoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  odoText: { marginLeft: 6, color: colors.textSecondary, fontSize: 13 },

  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 14,
  },
  completeBtnText: { color: colors.white, fontWeight: '700', marginLeft: 8 },

  acceptWrap: { paddingHorizontal: 16, marginTop: 12 },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
  },
  acceptBtnText: { color: colors.white, fontWeight: '700', marginLeft: 8, fontSize: 16 },
  btnDisabled: { opacity: 0.6 },

  doneCard: { alignItems: 'center', paddingVertical: 24 },
  doneText: { marginTop: 8, fontSize: 16, fontWeight: '600', color: colors.success },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, color: colors.textSecondary, marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },

  modalActions: { flexDirection: 'row', marginTop: 20, justifyContent: 'flex-end' },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  modalBtnGhost: { backgroundColor: colors.backgroundSecondary },
  modalBtnGhostText: { color: colors.text, fontWeight: '600' },
  modalBtnPrimary: { backgroundColor: colors.primary },
  modalBtnPrimaryText: { color: colors.white, fontWeight: '700' },
});

export default BundleDetailScreen;

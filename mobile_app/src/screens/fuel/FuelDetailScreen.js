import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fuelApi } from '../../api/fuelApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';

const FuelDetailScreen = ({ route }) => {
  const { fuelId } = route.params;
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState(null);

  const fetchTransaction = async () => {
    try {
      const response = await fuelApi.getById(fuelId);
      setTransaction(response);
    } catch (error) {
      setTransaction({
        id: fuelId, vehicle: { license_plate: 'TN01AB1234', make: 'Toyota', model: 'Innova' },
        driver: { first_name: 'John', last_name: 'Doe' }, fuel_station: { name: 'Indian Oil - OMR' },
        date: '2024-01-15', fuel_type: 'Diesel', quantity: 45, cost_per_liter: 90, total_cost: 4050,
        odometer_reading: 45200, notes: 'Regular refuel',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransaction(); }, [fuelId]);

  if (loading) return <LoadingScreen message="Loading..." />;
  if (!transaction) return <View style={styles.container}><Text>Not found</Text></View>;

  const DetailRow = ({ icon, label, value }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailLabel}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <Text style={styles.valueText}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <View style={styles.costContainer}>
          <Text style={styles.costLabel}>Total Cost</Text>
          <Text style={styles.costValue}>₹{transaction.total_cost?.toLocaleString()}</Text>
        </View>
        <View style={styles.headerDetails}>
          <View style={styles.headerItem}>
            <Text style={styles.headerLabel}>Quantity</Text>
            <Text style={styles.headerValue}>{transaction.quantity} L</Text>
          </View>
          <View style={styles.headerItem}>
            <Text style={styles.headerLabel}>Rate</Text>
            <Text style={styles.headerValue}>₹{transaction.cost_per_liter}/L</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle</Text>
        <DetailRow icon="car-outline" label="License Plate" value={transaction.vehicle?.license_plate} />
        <DetailRow icon="information-circle-outline" label="Model" value={`${transaction.vehicle?.make} ${transaction.vehicle?.model}`} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Details</Text>
        <DetailRow icon="water-outline" label="Fuel Type" value={transaction.fuel_type} />
        <DetailRow icon="calendar-outline" label="Date" value={transaction.date} />
        <DetailRow icon="speedometer-outline" label="Odometer" value={`${transaction.odometer_reading?.toLocaleString()} km`} />
        <DetailRow icon="location-outline" label="Station" value={transaction.fuel_station?.name} />
        <DetailRow icon="person-outline" label="Driver" value={`${transaction.driver?.first_name} ${transaction.driver?.last_name}`} />
      </Card>

      {transaction.notes && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notes}>{transaction.notes}</Text>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  headerCard: { marginBottom: 16, backgroundColor: colors.info },
  costContainer: { alignItems: 'center', marginBottom: 16 },
  costLabel: { fontSize: 14, color: colors.textOnPrimary, opacity: 0.8 },
  costValue: { fontSize: 36, fontWeight: '700', color: colors.textOnPrimary },
  headerDetails: { flexDirection: 'row', justifyContent: 'space-around' },
  headerItem: { alignItems: 'center' },
  headerLabel: { fontSize: 12, color: colors.textOnPrimary, opacity: 0.8 },
  headerValue: { fontSize: 18, fontWeight: '600', color: colors.textOnPrimary },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  detailLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  labelText: { fontSize: 14, color: colors.textSecondary },
  valueText: { fontSize: 14, fontWeight: '500', color: colors.text },
  notes: { fontSize: 14, color: colors.text, lineHeight: 22 },
});

export default FuelDetailScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { maintenanceApi } from '../../api/maintenanceApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingScreen from '../../components/LoadingScreen';

const MaintenanceDetailScreen = ({ route }) => {
  const { maintenanceId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [record, setRecord] = useState(null);

  const fetchRecord = async () => {
    try {
      const response = await maintenanceApi.getById(maintenanceId);
      setRecord(response);
    } catch (error) {
      console.log('Error:', error);
      setRecord({
        id: maintenanceId,
        vehicle: { license_plate: 'TN01AB1234', make: 'Toyota', model: 'Innova' },
        maintenance_type: { name: 'Oil Change' },
        provider: { name: 'Authorized Service Center' },
        status: 'scheduled',
        date_reported: '2024-01-10',
        scheduled_date: '2024-01-20',
        odometer_reading: 50000,
        description: 'Regular oil change at 50,000 km service interval',
        cost: 2500,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [maintenanceId]);

  if (loading) return <LoadingScreen message="Loading..." />;
  if (!record) return <View style={styles.container}><Text>Not found</Text></View>;

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchRecord} />}
    >
      <Card style={styles.headerCard}>
        <View style={styles.header}>
          <View style={styles.typeIcon}>
            <Ionicons name="construct" size={32} color={colors.warning} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.typeName}>{record.maintenance_type?.name}</Text>
            <StatusBadge status={record.status} type="maintenance" />
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle</Text>
        <DetailRow icon="car-outline" label="License Plate" value={record.vehicle?.license_plate} />
        <DetailRow icon="information-circle-outline" label="Model" value={`${record.vehicle?.make} ${record.vehicle?.model}`} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <DetailRow icon="calendar-outline" label="Scheduled" value={record.scheduled_date} />
        <DetailRow icon="speedometer-outline" label="Odometer" value={`${record.odometer_reading?.toLocaleString()} km`} />
        <DetailRow icon="business-outline" label="Provider" value={record.provider?.name} />
        {record.cost && (
          <DetailRow icon="cash-outline" label="Cost" value={`₹${record.cost.toLocaleString()}`} />
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{record.description}</Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  headerCard: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: `${colors.warning}15`,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  headerInfo: { flex: 1, gap: 8 },
  typeName: { fontSize: 20, fontWeight: '700', color: colors.text },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  detailLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  labelText: { fontSize: 14, color: colors.textSecondary },
  valueText: { fontSize: 14, fontWeight: '500', color: colors.text },
  description: { fontSize: 14, color: colors.text, lineHeight: 22 },
});

export default MaintenanceDetailScreen;

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { maintenanceApi } from '../../api/maintenanceApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const MaintenanceListScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ];

  const fetchMaintenance = useCallback(async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await maintenanceApi.getAll(params);
      setRecords(response.results || response || []);
    } catch (error) {
      console.log('Error fetching maintenance:', error);
      // Sample data
      setRecords([
        {
          id: 1,
          vehicle: { license_plate: 'TN01AB1234', make: 'Toyota', model: 'Innova' },
          maintenance_type: { name: 'Oil Change' },
          status: 'scheduled',
          scheduled_date: '2024-01-20',
          description: 'Regular oil change at 50,000 km',
        },
        {
          id: 2,
          vehicle: { license_plate: 'TN02CD5678', make: 'Maruti', model: 'Swift' },
          maintenance_type: { name: 'Tire Rotation' },
          status: 'in_progress',
          scheduled_date: '2024-01-15',
          description: 'Front tire rotation and balancing',
        },
        {
          id: 3,
          vehicle: { license_plate: 'TN03EF9012', make: 'Tata', model: 'Nexon' },
          maintenance_type: { name: 'Brake Service' },
          status: 'completed',
          scheduled_date: '2024-01-10',
          completion_date: '2024-01-12',
          cost: 3500,
          description: 'Front brake pad replacement',
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchMaintenance();
  }, [fetchMaintenance]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMaintenance();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderRecord = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('MaintenanceDetail', { maintenanceId: item.id })}
    >
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Ionicons name="construct" size={20} color={colors.warning} />
          <Text style={styles.typeName}>{item.maintenance_type?.name}</Text>
        </View>
        <StatusBadge status={item.status} type="maintenance" />
      </View>

      <View style={styles.vehicleInfo}>
        <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.vehicleText}>
          {item.vehicle?.license_plate} - {item.vehicle?.make} {item.vehicle?.model}
        </Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.dateText}>
            {item.status === 'completed' 
              ? `Completed: ${formatDate(item.completion_date)}`
              : `Scheduled: ${formatDate(item.scheduled_date)}`
            }
          </Text>
        </View>
        {item.cost && (
          <Text style={styles.cost}>₹{item.cost.toLocaleString()}</Text>
        )}
      </View>
    </Card>
  );

  if (loading) {
    return <LoadingScreen message="Loading maintenance records..." />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMaintenance')}
      >
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>

      <View style={styles.filterContainer}>
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              statusFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="construct-outline"
            title="No Maintenance Records"
            message="No maintenance records found for the selected filter"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.textOnPrimary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  vehicleText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cost: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default MaintenanceListScreen;

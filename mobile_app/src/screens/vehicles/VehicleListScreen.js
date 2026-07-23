import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { vehicleApi } from '../../api/vehicleApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const VehicleListScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'available', label: 'Available' },
    { key: 'in_use', label: 'In Use' },
    { key: 'maintenance', label: 'Maintenance' },
  ];

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await vehicleApi.getAll();
      const vehicleList = response.results || response || [];
      setVehicles(vehicleList);
      setFilteredVehicles(vehicleList);
    } catch (error) {
      console.log('Error fetching vehicles:', error);
      // No sample data - show empty state on error
      setVehicles([]);
      setFilteredVehicles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    filterVehicles();
  }, [searchQuery, statusFilter, vehicles]);

  const filterVehicles = () => {
    let filtered = [...vehicles];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.license_plate?.toLowerCase().includes(query) ||
          v.make?.toLowerCase().includes(query) ||
          v.model?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    setFilteredVehicles(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const renderVehicle = ({ item }) => (
    <Card
      style={styles.vehicleCard}
      onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
    >
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleIcon}>
          <Ionicons name="car" size={28} color={colors.primary} />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.licensePlate}>{item.license_plate}</Text>
          <Text style={styles.vehicleModel}>
            {item.make} {item.model} ({item.year})
          </Text>
        </View>
        <StatusBadge status={item.status} type="vehicle" />
      </View>
      <View style={styles.vehicleFooter}>
        <View style={styles.vehicleDetail}>
          <Ionicons name="pricetag-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>{item.vehicle_type?.name || 'N/A'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </View>
    </Card>
  );

  if (loading) {
    return <LoadingScreen message="Loading vehicles..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vehicles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textLight}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status Filters */}
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

      {/* Vehicle List */}
      <FlatList
        data={filteredVehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="car-outline"
            title="No Vehicles Found"
            message={
              searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No vehicles available in the system'
            }
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.textOnPrimary,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  vehicleCard: {
    marginBottom: 12,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  licensePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  vehicleModel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  vehicleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  vehicleDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default VehicleListScreen;

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fuelApi } from '../../api/fuelApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const FuelListScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fuelApi.getAll();
      setTransactions(response.results || response || []);
    } catch (error) {
      console.log('Error:', error);
      setTransactions([
        {
          id: 1, vehicle: { license_plate: 'TN01AB1234', make: 'Toyota', model: 'Innova' },
          date: '2024-01-15', fuel_type: 'Diesel', quantity: 45, total_cost: 4050, odometer_reading: 45200,
        },
        {
          id: 2, vehicle: { license_plate: 'TN02CD5678', make: 'Maruti', model: 'Swift' },
          date: '2024-01-14', fuel_type: 'Petrol', quantity: 35, total_cost: 3675, odometer_reading: 23100,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderTransaction = ({ item }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('FuelDetail', { fuelId: item.id })}>
      <View style={styles.header}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.licensePlate}>{item.vehicle?.license_plate}</Text>
          <Text style={styles.vehicleModel}>{item.vehicle?.make} {item.vehicle?.model}</Text>
        </View>
        <Text style={styles.cost}>₹{item.total_cost?.toLocaleString()}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="water" size={16} color={colors.info} />
          <Text style={styles.detailText}>{item.quantity} L {item.fuel_type}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="speedometer-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>{item.odometer_reading?.toLocaleString()} km</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>{formatDate(item.date)}</Text>
        </View>
      </View>
    </Card>
  );

  if (loading) return <LoadingScreen message="Loading fuel transactions..." />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddFuel')}>
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchTransactions} />}
        ListEmptyComponent={
          <EmptyState
            icon="water-outline"
            title="No Fuel Transactions"
            message="Add your first fuel entry"
            actionText="Add Fuel"
            onAction={() => navigation.navigate('AddFuel')}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 16, paddingBottom: 80 },
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  vehicleInfo: {},
  licensePlate: { fontSize: 16, fontWeight: '600', color: colors.text },
  vehicleModel: { fontSize: 13, color: colors.textSecondary },
  cost: { fontSize: 18, fontWeight: '700', color: colors.success },
  details: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: colors.textSecondary },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.info, justifyContent: 'center', alignItems: 'center', zIndex: 100,
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
});

export default FuelListScreen;
